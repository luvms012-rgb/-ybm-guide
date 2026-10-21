/* ==========================================================================
   SB.18~20 문의 상세 · 재문의 작성 · 재문의 완료
   --------------------------------------------------------------------------
   한 화면의 상태다. 상태마다 붙고 빠지는 블록은 아래 표와 같다.

     상태               답변  재문의 스레드  재문의 배너  재문의 폼  하단
     답변대기            ·         ·             ·           ·       편집 가능
     답변완료            ○         ·             ○           ·       편집 불가
     재문의 작성         ○         ·             ·           ○       (숨김)
     재문의 완료         ○         ○             ·           ·       편집 불가

   · 수정·삭제는 답변대기에서만, 재문의는 답변완료에서만 할 수 있다
   · 만족도 평가는 SB 14 와 같은 컴포넌트다(로그인 사용자 · 다시 고를 수 있음)
   바로가기: #sb18 · #sb18-answered · #sb18-delete · #sb19 · #sb19-done · #sb20
   ========================================================================== */
(function () {
  "use strict";

  var MAX_BYTES = 10 * 1024 * 1024;
  var ALLOWED = ["jpg", "jpeg", "png", "pdf", "xlsx"];

  function $(id) { return document.getElementById(id); }

  var answer = $("answer");
  var thread = $("reinquiry-thread");
  var banner = $("reinquiry-banner");
  var form = $("reinquiry-form");
  var actions = $("detail-actions");
  var status = $("detail-status");
  var content = $("reinquiry-content");
  var files = [];

  CS.familySite();

  /* ---- 상태 ------------------------------------------------------------------ */
  var STATES = {
    /*                  답변   스레드  배너   폼     하단          배지 */
    "waiting":        [false, false, false, false, "editable",  ["답변대기", ""]],
    "answered":       [true,  false, true,  false, "locked",    ["답변완료", "positive"]],
    "reinquiry":      [true,  false, false, true,  null,        ["답변완료", "positive"]],
    "reinquiry-done": [true,  true,  false, false, "locked",    ["재문의", "warning"]]
  };

  function setState(name) {
    var s = STATES[name] || STATES.waiting;
    answer.hidden = !s[0];
    thread.hidden = !s[1];
    banner.hidden = !s[2];
    form.hidden = !s[3];
    actions.hidden = s[4] === null;
    if (s[4]) {
      actions.dataset.type = s[4];
      var locked = s[4] === "locked";
      $("edit-btn").disabled = locked;
      $("delete-btn").disabled = locked;
      $("edit-caption").hidden = !locked;
    }
    status.textContent = s[5][0];
    if (s[5][1]) status.dataset.tone = s[5][1];
    else status.removeAttribute("data-tone");
    document.body.dataset.screen = name;
  }

  /* ---- 만족도 평가 (SB 14 와 같은 동작) --------------------------------------- */
  var fb = answer.querySelector(".cs-feedback");

  function setFeedback(state, picked) {
    if (state === "default") fb.dataset.chosen = "";
    else if (picked) fb.dataset.chosen = picked;
    var chosen = fb.dataset.chosen;

    fb.dataset.state = state;
    fb.querySelector(".cs-feedback__reason").hidden = state !== "reason";
    fb.querySelector(".cs-feedback__thanks").hidden = state !== "result";
    fb.querySelectorAll(".cs-feedback__btn").forEach(function (b) {
      b.setAttribute("aria-pressed", String(state !== "default" && b.dataset.value === chosen));
    });
  }

  fb.addEventListener("click", function (e) {
    var btn = e.target.closest(".cs-feedback__btn");
    if (btn) {
      var v = btn.dataset.value;
      if (v === fb.dataset.chosen) { setFeedback("default"); return; }
      if (v === "no") {
        var r = fb.querySelector("input[type='radio']:checked");
        if (r) r.checked = false;
        setFeedback("reason", v);
      } else setFeedback("result", v);
      return;
    }
    if (e.target.closest(".cs-feedback__submit")) {
      if (!fb.querySelector("input[type='radio']:checked")) { YBM.snackbar("아쉬웠던 점을 선택해 주세요."); return; }
      setFeedback("result", "no");
      return;
    }
    /* 건너뛰기 — 의견을 남기지 않았으므로 감사 문구 없이 평가 전으로 되돌린다 */
    if (e.target.closest(".cs-feedback__skip")) {
      var rs = fb.querySelector("input[type='radio']:checked");
      if (rs) rs.checked = false;
      setFeedback("default");
    }
  });

  /* ---- 재문의 작성 ----------------------------------------------------------- */
  $("reinquiry-btn").addEventListener("click", function () {
    location.hash = "#sb19";
    content.focus();
  });
  $("reinquiry-cancel").addEventListener("click", function () { location.hash = "#sb18-answered"; });

  content.addEventListener("input", function () {
    $("reinquiry-count").textContent = content.value.length.toLocaleString("ko-KR") + " / 2,000자";
    $("reinquiry-submit").disabled = content.value.trim() === "";
  });

  /* 첨부 — 재문의는 전체 10MB 만 제한한다 (개수 제한 없음 · Figma 안내 문구 기준) */
  var attachInput = $("reinquiry-attach-input");
  var attachValue = $("reinquiry-attach-field").querySelector(".ds-fieldbutton__value");
  var attachList = $("reinquiry-attach-list");

  function renderFiles() {
    var total = files.reduce(function (s, f) { return s + f.size; }, 0);
    attachValue.textContent = files.length ? files.length + "개 선택" : "";
    attachList.hidden = files.length === 0;
    attachList.innerHTML = files.map(function (f, i) {
      return '<span class="cs-attachment"><i class="ds-icon ds-icon--paperclip" aria-hidden="true"></i>' + f.name +
             '<button type="button" class="cs-attachment__remove" data-index="' + i + '">' +
             '<i class="ds-icon ds-icon--x" aria-hidden="true"></i><span class="ds-sr-only">' + f.name + ' 지우기</span></button></span>';
    }).join("");
    $("reinquiry-size").innerHTML = "<b>" + (total / 1024 / 1024).toFixed(total ? 1 : 0) + "MB</b> / 10MB";
  }

  $("reinquiry-attach-btn").addEventListener("click", function () { attachInput.click(); });

  attachInput.addEventListener("change", function () {
    var picked = Array.prototype.slice.call(attachInput.files);
    attachInput.value = "";
    if (!picked.length) return;
    var bad = picked.some(function (f) { return ALLOWED.indexOf(f.name.split(".").pop().toLowerCase()) === -1; });
    if (bad) { YBM.snackbar("JPG, PNG, PDF, XLSX 파일만 첨부할 수 있습니다."); return; }
    var next = files.concat(picked);
    if (next.reduce(function (s, f) { return s + f.size; }, 0) > MAX_BYTES) {
      YBM.snackbar("전체 10MB까지 첨부할 수 있습니다."); return;
    }
    files = next;
    renderFiles();
  });

  attachList.addEventListener("click", function (e) {
    var btn = e.target.closest(".cs-attachment__remove");
    if (!btn) return;
    files.splice(Number(btn.dataset.index), 1);
    renderFiles();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    $("alert-reinquiry").showModal();
  });
  $("reinquiry-done").addEventListener("click", function () {
    $("alert-reinquiry").close();
    location.hash = "#sb20";
  });

  /* ---- 수정 · 삭제 (답변대기에서만) ------------------------------------------- */
  $("edit-btn").addEventListener("click", function () {
    YBM.snackbar("문의 수정 화면으로 가는 자리입니다.");
  });
  $("delete-btn").addEventListener("click", function () { $("alert-delete").showModal(); });
  $("delete-confirm").addEventListener("click", function () {
    $("alert-delete").close();
    YBM.snackbar("문의를 삭제하고 목록으로 돌아가는 자리입니다.");
  });

  document.querySelectorAll(".cs-alert").forEach(function (dlg) {
    dlg.addEventListener("click", function (e) {
      if (e.target.closest("[data-ds-close]")) dlg.close();
    });
  });

  /* ---- 상태 바로가기 --------------------------------------------------------- */
  var HASH = {
    "#sb18": "waiting",
    "#sb18-delete": "waiting",
    "#sb18-answered": "answered",
    "#sb19": "reinquiry",
    "#sb19-done": "reinquiry",
    "#sb20": "reinquiry-done"
  };

  function applyHash() {
    var h = location.hash || "#sb18";
    document.querySelectorAll(".cs-alert").forEach(function (d) { if (d.open) d.close(); });
    setState(HASH[h] || "waiting");

    /* 재문의 완료는 만족도를 고르는 중인 모습으로 둔다 (Figma 2403:3560)
       사유는 첫 번째 '답변 내용이 충분하지 않아요.' 를 기본 선택해 둔다 */
    if (h === "#sb20") {
      var r = fb.querySelector("input[value='insufficient']");
      if (r) r.checked = true;
      setFeedback("reason", "no");
    } else setFeedback("default");

    if (h === "#sb18-delete") $("alert-delete").showModal();
    if (h === "#sb19-done") $("alert-reinquiry").showModal();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
