/* ==========================================================================
   SB.9 검색 결과 상태 — 검색 로딩 · 검색 결과 없음
   --------------------------------------------------------------------------
   · 두 상태는 같은 파일에서 해시로 바꾼다 (#sb9-loading 기본 · #sb9-empty)
   · 로딩은 자동으로 넘어가지 않고 그대로 유지한다 (응답을 기다리는 상태)
   · 내용이 있는 화면에서 쓰는 로딩은 다이얼로그 형태 (#sb9-loading-dialog)
   바로가기: #sb9-loading · #sb9-empty · #sb9-loading-dialog · #sb9-panel
   ========================================================================== */
(function () {
  "use strict";

  var result = document.getElementById("result");
  var loadingBlock = document.getElementById("state-loading");
  var empty = document.getElementById("state-empty");
  var loading = CS.loadingDialog();

  function show(state) {
    result.dataset.state = state;
    loadingBlock.hidden = state !== "loading";
    empty.hidden = state !== "empty";
  }

  CS.familySite();
  CS.keywordsRolling();
  var panel = CS.searchPanel({ onSubmit: function () { show("loading"); } });
  CS.searchBar({ onSubmit: function () { show("loading"); } });

  function applyHash() {
    var h = location.hash;
    show(h === "#sb9-empty" ? "empty" : "loading");
    if (panel) panel.open(h === "#sb9-panel");
    if (h === "#sb9-loading-dialog") loading.open(); else loading.close();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
