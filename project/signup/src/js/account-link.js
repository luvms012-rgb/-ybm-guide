/* ==========================================================================
   회원가입 > 부모·자녀 계정 연동 동의 (SB.28)
   · ★ 동의 1건을 체크하면 [보호자 계정과 연동하기] 활성 → 연동 관계를 저장하고 다음 단계로
   · [나중에 연동하기] → 연동 없이 다음 단계
   ⚠ 사전 개발 후 비노출 화면이라 이동 지점은 스낵바로만 표시한다
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };

  var agree = $("#link-agree"), cta = $("#link-cta");

  function sync() { cta.disabled = !agree.checked; }
  agree.addEventListener("change", sync);

  $(".signup-terms__view").addEventListener("click", function (e) {
    YBM.snackbar("약관 전문 보기: " + e.currentTarget.getAttribute("data-term"));
  });

  $("#link-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cta.disabled) YBM.snackbar("보호자·자녀 계정 연동 저장 → 다음 단계 (개발)");
  });
  $("#link-later").addEventListener("click", function () { YBM.snackbar("연동 없이 다음 단계 (개발)"); });

  /* ---- 바로가기 — #sb28 미동의 · #sb28-agreed 동의 완료 ---------------- */
  function applyHash() {
    agree.checked = location.hash.replace("#", "") === "sb28-agreed";
    sync();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
