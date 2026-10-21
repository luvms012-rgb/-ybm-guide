/* ==========================================================================
   SB.12 도움말(FAQ) 목록
   --------------------------------------------------------------------------
   · 중분류 칩: 하나만 선택. 데모에서는 "아이디/비밀번호 찾기"가 빈 상태다
   · 아코디언: 다중 펼침 허용 (기획서 UFAQ-01)
   · 문의하기: 비로그인 기준이라 로그인 안내 얼럿을 띄운다
   바로가기: #sb12 기본 · #sb12-empty 중분류 빈 상태 · #sb12-login 로그인 안내 · #sb12-menu 모바일 전체 메뉴
             #sb12-loading 검색 로딩 다이얼로그
   ========================================================================== */
(function () {
  "use strict";

  var chips = document.getElementById("category-chips");
  var list = document.getElementById("faq-list");
  var empty = document.getElementById("faq-empty");
  var alertEl = document.getElementById("login-alert");
  var menu = document.getElementById("mobile-menu");
  var EMPTY_CATEGORY = "아이디/비밀번호 찾기";

  CS.familySite();
  /* 목록이 있는 화면이라 로딩은 다이얼로그로 띄운다 */
  var loading = CS.loadingDialog();
  CS.searchBar({ onSubmit: function () { loading.open(); } });

  /* ---- 서비스 히어로 placeholder — 모바일은 짧은 문구 (Figma device=Mobile) ----
     CSS 로는 글자를 바꿀 수 없어 폭에 따라 JS 가 갈아 끼운다. */
  var searchInput = document.getElementById("search-input");
  var mobile = window.matchMedia("(max-width: 767px)");
  function syncPlaceholder() {
    searchInput.placeholder = mobile.matches
      ? "AI가 가장 관련 높은 답변을 찾아드립니다."
      : "AI가 질문을 분석해 가장 관련 높은 답변을 찾아드립니다.";
  }
  mobile.addEventListener("change", syncPlaceholder);
  syncPlaceholder();

  /* ---- 중분류 칩 ------------------------------------------------------------ */
  function selectCategory(name) {
    Array.prototype.forEach.call(chips.children, function (chip) {
      var on = chip.textContent.trim() === name;
      chip.setAttribute("aria-pressed", String(on));
      /* 선택 칩은 solid(checked), 나머지는 outlineStrong */
      if (on) chip.removeAttribute("data-variant");
      else chip.setAttribute("data-variant", "outlineStrong");
    });
    var isEmpty = name === EMPTY_CATEGORY;
    list.hidden = isEmpty;
    empty.hidden = !isEmpty;
  }

  chips.addEventListener("click", function (e) {
    var chip = e.target.closest(".ds-chip");
    if (chip) selectCategory(chip.textContent.trim());
  });

  /* ---- 아코디언 — 여러 개를 동시에 펼칠 수 있다 ------------------------------ */
  list.addEventListener("click", function (e) {
    var btn = e.target.closest(".cs-faq-item__q");
    if (!btn) return;
    var item = btn.parentElement;
    var open = item.dataset.state !== "open";
    /* 여닫는 모션·화살표 회전은 CSS(5-9)가 data-state 로 처리한다 */
    item.dataset.state = open ? "open" : "closed";
    btn.setAttribute("aria-expanded", String(open));
  });

  /* ---- 문의하기 → 비로그인 로그인 안내 --------------------------------------- */
  document.getElementById("inquiry-btn").addEventListener("click", function () { alertEl.showModal(); });
  alertEl.addEventListener("click", function (e) {
    if (e.target.closest("[data-ds-close]")) alertEl.close();
  });
  document.getElementById("login-confirm").addEventListener("click", function () {
    alertEl.close();
    YBM.snackbar("로그인 화면으로 이동하는 자리입니다.");
  });

  /* ---- 모바일 전체 메뉴 ------------------------------------------------------ */
  function openMenu(on) { menu.hidden = !on; }
  document.getElementById("mobile-menu-close").addEventListener("click", function () { openMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menu.hidden) openMenu(false);
  });

  /* 상태 바로가기 */
  function applyHash() {
    var h = location.hash;
    selectCategory(h === "#sb12-empty" ? EMPTY_CATEGORY : "자주 찾는 도움말");
    if (alertEl.open) alertEl.close();
    if (h === "#sb12-login") alertEl.showModal();
    /* 목록이 뒤에 깔린 상태에서 보는 검색 로딩 다이얼로그 */
    if (h === "#sb12-loading") loading.open(); else loading.close();
    openMenu(h === "#sb12-menu");
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
