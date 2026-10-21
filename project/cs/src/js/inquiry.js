/* ==========================================================================
   SB.15~16 문의하기 (작성)
   --------------------------------------------------------------------------
   · 입력 전 / 입력 중은 같은 화면의 상태다 — 조건이 맞을 때만 블록이 나타난다
       환불 계좌정보   중분류(카테고리)에 '환불' 이 들어갈 때
       AI 추천 도움말  제목을 두 글자 이상 입력했을 때
   · 하단 [문의하기] 는 필수 항목(이메일·서비스·카테고리·제목·내용·필수 동의)이
     모두 채워져야 활성된다. 눌렀을 때의 오류 팝업은 그대로 두어 확인할 수 있게 한다.
   · 선택 목록·추천 도움말·파일 목록은 동작을 보여 주기 위한 더미다(서버가 내려준다)
   바로가기: #sb15 · #sb15-filled · #sb16-done · #sb16-required · #sb16-leave
             #sb16-filetype · #sb16-filesize · #sb16-consent
   ========================================================================== */
(function () {
  "use strict";

  var MAX_FILES = 5;
  var MAX_BYTES = 10 * 1024 * 1024;
  var ALLOWED = ["jpg", "jpeg", "png", "pdf", "xlsx", "zip"];

  /* 중분류 — 실제로는 서비스별로 서버가 내려준다 (SB 8 FAQ 카테고리 개편안) */
  var CATEGORIES = ["결제/취소/환불", "수강/학습", "회원정보", "교재/배송", "기타"];

  function $(id) { return document.getElementById(id); }

  var form = $("inquiry-form");
  var email = $("applicant-email");
  var title = $("inquiry-title");
  var content = $("inquiry-content");
  var refund = $("refund");
  var recommend = $("ai-recommend");
  var submitBtn = $("submit-btn");
  var files = [];

  CS.familySite();

  /* ---- 선택 메뉴 (Field Button + DS Select Content) --------------------------
     Figma 에 열린 상태 화면이 없어 DS 규격 그대로 쓴다. */
  function select(btnId, menuId, items, onPick) {
    var btn = $(btnId);
    var menu = $(menuId);
    var value = btn.querySelector(".ds-fieldbutton__value");

    function render(list) {
      menu.innerHTML =
        '<ul class="ds-select-list">' +
        list.map(function (name) {
          return '<li><button type="button" class="ds-select-item" role="option" aria-selected="false">' +
                 '<span class="ds-select-item__body"><span class="ds-select-item__label">' + name + "</span></span></button></li>";
        }).join("") +
        "</ul>";
    }

    function open(on) {
      menu.hidden = !on;
      btn.setAttribute("aria-expanded", String(on));
    }

    render(items);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      open(menu.hidden);
    });
    menu.addEventListener("click", function (e) {
      var item = e.target.closest(".ds-select-item");
      if (!item) return;
      value.textContent = item.textContent.trim();
      open(false);
      if (onPick) onPick(value.textContent);
      sync();
    });
    document.addEventListener("click", function () { if (!menu.hidden) open(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { open(false); btn.focus(); }
    });

    return {
      value: function () { return value.textContent.trim(); },
      set: function (name) { value.textContent = name; if (onPick) onPick(name); },
      replace: function (list) { render(list); value.textContent = ""; }
    };
  }

  var service = select("type-service", "type-service-menu", CS.services, function () {
    category.replace(CATEGORIES);
    showRefund(false);
  });
  var category = select("type-category", "type-category-menu", CATEGORIES, function (name) {
    /* 중분류에 '환불' 이 들어가면 환불 계좌정보가 나타난다 (기획서 SB 15) */
    showRefund(name.indexOf("환불") > -1);
  });
  select("refund-bank", "refund-bank-menu",
    ["국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행", "카카오뱅크", "토스뱅크"]);

  function showRefund(on) { refund.hidden = !on; }

  /* ---- 제목 → AI 추천 연관 도움말 -------------------------------------------- */
  title.addEventListener("input", function () {
    recommend.hidden = title.value.trim().length < 2;
    sync();
  });

  /* 추천 도움말을 누르면 작성 중단을 먼저 확인한다 */
  $("ai-recommend-list").addEventListener("click", function (e) {
    if (e.target.closest(".cs-recommend-chip")) $("alert-leave").showModal();
  });
  $("leave-confirm").addEventListener("click", function () {
    $("alert-leave").close();
    YBM.snackbar("선택한 도움말을 새 창으로 여는 자리입니다.");
  });

  /* ---- 글자 수 --------------------------------------------------------------- */
  content.addEventListener("input", function () {
    $("content-count").textContent = content.value.length.toLocaleString("ko-KR") + " / 2,000자";
    sync();
  });

  /* ---- 첨부파일 — 형식 · 개수 · 전체 용량 ------------------------------------ */
  var attachInput = $("attach-input");
  var attachField = $("attach-field").querySelector(".ds-fieldbutton__value");
  var attachList = $("attach-list");

  function totalBytes() {
    return files.reduce(function (sum, f) { return sum + f.size; }, 0);
  }

  function renderFiles() {
    attachField.textContent = files.length ? files.length + "개 선택" : "";
    attachList.hidden = files.length === 0;
    attachList.innerHTML = files.map(function (f, i) {
      return '<span class="cs-attachment"><i class="ds-icon ds-icon--paperclip" aria-hidden="true"></i>' + f.name +
             '<button type="button" class="cs-attachment__remove" data-index="' + i + '">' +
             '<i class="ds-icon ds-icon--x" aria-hidden="true"></i><span class="ds-sr-only">' + f.name + ' 지우기</span></button></span>';
    }).join("");
    $("attach-size").innerHTML =
      "<b>" + (totalBytes() / 1024 / 1024).toFixed(totalBytes() ? 1 : 0) + "MB</b> / 10MB";
  }

  $("attach-btn").addEventListener("click", function () { attachInput.click(); });

  attachInput.addEventListener("change", function () {
    var picked = Array.prototype.slice.call(attachInput.files);
    attachInput.value = "";
    if (!picked.length) return;

    var bad = picked.some(function (f) {
      return ALLOWED.indexOf(f.name.split(".").pop().toLowerCase()) === -1;
    });
    if (bad) { $("alert-filetype").showModal(); return; }

    var next = files.concat(picked);
    var over = next.length > MAX_FILES ||
               next.reduce(function (s, f) { return s + f.size; }, 0) > MAX_BYTES;
    if (over) { $("alert-filesize").showModal(); return; }

    files = next;
    renderFiles();
  });

  attachList.addEventListener("click", function (e) {
    var btn = e.target.closest(".cs-attachment__remove");
    if (!btn) return;
    files.splice(Number(btn.dataset.index), 1);
    renderFiles();
  });

  /* ---- 약관 동의 ------------------------------------------------------------- */
  var all = $("consent-all");
  var checks = Array.prototype.slice.call(document.querySelectorAll(".cs-consent__check"));

  all.addEventListener("change", function () {
    checks.forEach(function (c) { c.checked = all.checked; });
    sync();
  });
  checks.forEach(function (c) {
    c.addEventListener("change", function () {
      var on = checks.filter(function (x) { return x.checked; }).length;
      all.checked = on === checks.length;
      all.indeterminate = on > 0 && on < checks.length;
      sync();
    });
  });

  /* 동의 내용 펼치기 — 아코디언과 같은 방식(다중 펼침) */
  $("consent-group").addEventListener("click", function (e) {
    var btn = e.target.closest(".cs-consent__toggle");
    if (!btn) return;
    var item = btn.closest(".cs-consent");
    var open = item.dataset.state !== "open";
    item.dataset.state = open ? "open" : "closed";
    btn.setAttribute("aria-expanded", String(open));
  });

  /* ---- 필수 충족 여부 → 하단 버튼 -------------------------------------------- */
  function filled() {
    return email.value.trim() !== "" &&
           service.value() !== "" &&
           category.value() !== "" &&
           title.value.trim() !== "" &&
           content.value.trim() !== "";
  }
  function sync() {
    submitBtn.disabled = !(filled() && $("consent-privacy").checked);
  }
  email.addEventListener("input", sync);

  /* ---- 제출 ------------------------------------------------------------------ */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!filled()) { $("alert-required").showModal(); return; }
    if (!$("consent-privacy").checked) { $("alert-consent").showModal(); return; }
    $("alert-done").showModal();
  });

  $("cancel-btn").addEventListener("click", function () {
    YBM.snackbar("작성을 취소하고 이전 화면으로 돌아가는 자리입니다.");
  });

  /* 팝업 닫기 — DS Alert Dialog 공통 */
  document.querySelectorAll(".cs-alert").forEach(function (dlg) {
    dlg.addEventListener("click", function (e) {
      if (e.target.closest("[data-ds-close]")) dlg.close();
    });
  });

  /* ---- 상태 바로가기 --------------------------------------------------------- */
  function fill(on) {
    if (on) {
      service.set("YBM 인강");
      category.set("결제/취소/환불");
      title.value = "수강 중인 강의 환불을 요청합니다.";
      content.value = "결제한 지 3일 지난 강의인데 수강을 시작하지 않았습니다. 환불이 가능한지 확인 부탁드립니다.";
      $("content-count").textContent = content.value.length.toLocaleString("ko-KR") + " / 2,000자";
      recommend.hidden = false;
      checks.forEach(function (c) { c.checked = true; });
      all.checked = true;
      all.indeterminate = false;
    } else {
      service.replace(CS.services);
      category.replace(CATEGORIES);
      title.value = "";
      content.value = "";
      recommend.hidden = true;
      showRefund(false);
      checks.forEach(function (c) { c.checked = false; });
      all.checked = false;
      all.indeterminate = false;
      files = [];
      renderFiles();
      $("content-count").textContent = "0 / 2,000자";
    }
    sync();
  }

  var ALERTS = {
    "#sb16-done": "alert-done",
    "#sb16-required": "alert-required",
    "#sb16-leave": "alert-leave",
    "#sb16-filetype": "alert-filetype",
    "#sb16-filesize": "alert-filesize",
    "#sb16-consent": "alert-consent"
  };

  function applyHash() {
    var h = location.hash;
    document.querySelectorAll(".cs-alert").forEach(function (d) { if (d.open) d.close(); });
    fill(h !== "" && h !== "#sb15");
    if (ALERTS[h]) $(ALERTS[h]).showModal();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
