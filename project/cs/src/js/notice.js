/* ==========================================================================
   SB.21 공지사항 (목록)
   --------------------------------------------------------------------------
   · 행 전체가 링크다 — 누르면 상세로 간다
   · 검색: 2자 미만이면 인라인 안내(알럿 미사용), 2자 이상이면 검색 결과를 보여 준다
     (프로토타입이라 결과 없음 화면으로 데모한다 — 실제로는 서버가 결과를 내려준다)
   바로가기: #sb21 · #sb21-empty · #sb21-noresult
   ========================================================================== */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  var list = $("notice-list");
  var empty = $("notice-empty");
  var noresult = $("notice-noresult");
  var pager = $("notice-pager");
  var search = $("notice-search");
  var searchBtn = $("notice-search-btn");
  var note = $("notice-searchnote");

  CS.familySite();

  /* ---- 검색 --------------------------------------------------------------- */
  function runSearch() {
    var q = (search.value || "").trim();
    if (q.length > 0 && q.length < 2) {
      note.hidden = false;
      search.focus();
      return;
    }
    note.hidden = true;
    if (q.length === 0) { location.hash = "#sb21"; return; }
    // 2자 이상 — 실제로는 결과 목록을 받는다. 데모로 '검색 결과 없음'을 보여 준다.
    location.hash = "#sb21-noresult";
  }
  searchBtn.addEventListener("click", runSearch);
  search.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); runSearch(); }
  });
  search.addEventListener("input", function () {
    if (note.hidden === false && search.value.trim().length >= 2) note.hidden = true;
  });

  /* ---- 페이징 (실제로는 서버가 페이지를 내려준다) ------------------------------- */
  pager.addEventListener("click", function (e) {
    var item = e.target.closest(".ds-pagination__item");
    if (!item) return;
    e.preventDefault();
    if (item.getAttribute("aria-disabled") === "true") return;
    YBM.snackbar("해당 페이지를 불러오는 자리입니다.");
  });

  /* ---- 상태 바로가기 --------------------------------------------------------- */
  function applyHash() {
    var h = location.hash;
    var isEmpty = h === "#sb21-empty";
    var isNoResult = h === "#sb21-noresult";
    var hasList = !isEmpty && !isNoResult;

    list.hidden = !hasList;
    pager.hidden = !hasList;
    empty.hidden = !isEmpty;
    noresult.hidden = !isNoResult;

    if (isNoResult && !search.value.trim()) search.value = "환불 계좌";
    document.body.dataset.screen = isEmpty ? "notice-empty" : (isNoResult ? "notice-noresult" : "notice-list");
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
