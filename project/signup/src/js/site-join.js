/* ==========================================================================
   연계 페이지 > 사이트 추가 가입 (SB.61 약관 동의 · SB.62 가입 완료)
   · 전체 동의 ↔ 개별 동의 연동 (약관동의 SB.3 과 같은 규칙: 모든 항목이 체크될 때만 전체 동의 체크)
   · [확인]: 필수 3종이 모두 체크돼야 가입 → SB.62. 아니면 Alert '필수 약관에 모두 동의해 주세요.'
   · ★ [취소] / [로그인] / 서비스 링크 / 약관 '보기' → 각 화면으로 이동
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var R = window.SignupRecover;

  var all = $("#agree-all");
  var checks = $$('input[name="site-terms"]');
  var required = checks.filter(function (c) { return c.hasAttribute("data-required"); });

  function syncAll() { all.checked = checks.every(function (c) { return c.checked; }); }
  all.addEventListener("change", function () { checks.forEach(function (c) { c.checked = all.checked; }); });
  checks.forEach(function (c) { c.addEventListener("change", syncAll); });
  $$(".signup-terms__view").forEach(function (b) {
    b.addEventListener("click", function () { YBM.snackbar("약관 전문 보기: " + b.getAttribute("data-term")); });
  });

  function showCase(key) {
    $('[data-case="agree"]').hidden = key !== "agree";
    $('[data-case="done"]').hidden = key !== "done";
    window.scrollTo(0, 0);
  }

  $("#agree-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!required.every(function (c) { return c.checked; })) { R.alert("필수 약관에 모두 동의해 주세요."); return; }
    showCase("done");                                       // ★ 실제로는 동의를 저장한 뒤 완료 화면으로
  });
  $("#agree-cancel").addEventListener("click", function () { YBM.snackbar("취소 — 이전 화면으로 (개발)"); });
  $("#done-login").addEventListener("click", function () { YBM.snackbar("이동: 로그인"); });
  $$(".signup-services a").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); YBM.snackbar("이동: " + a.textContent); });
  });

  /* ---- 바로가기 해시 (가이드 뷰어 전용) ---- */
  function applyHash() {
    R.closeAlert();
    var key = location.hash.replace("#", "") || "sb61";
    showCase(key === "sb62" ? "done" : "agree");
    checks.forEach(function (c) { c.checked = key === "sb61-agreed"; });
    syncAll();
    if (key === "sb61-alert") R.alert("필수 약관에 모두 동의해 주세요.");
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
