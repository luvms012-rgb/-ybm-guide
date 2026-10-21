/* ==========================================================================
   SB.6~7 고객센터 메인
   --------------------------------------------------------------------------
   · 검색: 2자 미만이면 검색창 아래 인라인 안내 (알럿 아님 — 2026.10.01 확정)
   · 서비스 선택 레이어(SB.9)·검색 로딩 다이얼로그·검색바·패밀리 사이트는 common.js
   바로가기: #sb6 기본 · #sb6-min 검색어 2자 미만 안내 · #sb9-panel 서비스 선택 레이어
             #sb9-loading-dialog 검색 로딩 다이얼로그
   ========================================================================== */
(function () {
  "use strict";

  var loading = CS.loadingDialog();
  var bar = CS.searchBar({ onSubmit: function () { loading.open(); } });
  var panel = CS.searchPanel({ onSubmit: function () { loading.open(); } });
  CS.keywordsRolling();
  CS.familySite();

  /* ---- 서비스 전체보기 — 다음 묶음을 펼치고 버튼은 접으며 사라진다 ------------
     실제로는 서버가 다음 묶음을 내려주는 자리다. 여기서는 미리 넣어 둔 더미 행을 보여준다. */
  var moreBtn = document.getElementById("service-more");
  var moreWrap = moreBtn.parentElement;
  moreBtn.addEventListener("click", function () {
    var cards = document.querySelectorAll(".cs-service-card--more[hidden]");
    if (!cards.length) return;
    Array.prototype.forEach.call(cards, function (card, i) {
      card.hidden = false;
      card.style.animationDelay = (i * 60) + "ms";
    });
    /* 높이를 현재 값으로 고정한 뒤 다음 프레임에 0 으로 — 그래야 접히는 모션이 보인다 */
    moreWrap.style.height = moreWrap.offsetHeight + "px";
    requestAnimationFrame(function () {
      moreWrap.dataset.state = "gone";
      moreWrap.style.height = "0px";
    });
    moreWrap.addEventListener("transitionend", function once(e) {
      if (e.propertyName !== "height") return;
      moreWrap.remove();
    });
  });

  /* 상태 바로가기 */
  function applyHash() {
    var h = location.hash;
    if (bar) {
      if (h === "#sb6-min") { bar.input.value = "토"; bar.setHint(true); }
      else { bar.setHint(false); }
      bar.sync();
    }
    if (panel) panel.open(h === "#sb9-panel");
    if (h === "#sb9-loading-dialog") loading.open(); else loading.close();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
