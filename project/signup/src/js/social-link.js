/* ==========================================================================
   연계 페이지 > 소셜 로그인 — YBM 아이디 입력 (SB.58)
   · 아이디 · 비밀번호가 모두 입력되면 [로그인] 활성
   · ★ 로그인 성공 → 소셜 계정과 YBM Family 계정을 연결하고 원래 서비스로 이동
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var id = $("#login-id"), pw = $("#login-pw"), cta = $("#login-cta"), eye = $("#login-eye");

  function sync() { cta.disabled = !(id.value.trim() && pw.value); }
  id.addEventListener("input", sync);
  pw.addEventListener("input", sync);

  // 비밀번호 표시/숨김 — 가려진 상태 eye-off, 보이는 상태 eye
  function setShown(show) {
    pw.type = show ? "text" : "password";
    eye.setAttribute("aria-pressed", String(show));
    eye.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 보기");
    eye.firstElementChild.className = "ds-icon ds-icon--lg ds-icon--" + (show ? "eye" : "eye-off");
  }
  eye.addEventListener("mousedown", function (e) { e.preventDefault(); });
  eye.addEventListener("click", function () { setShown(pw.type === "password"); pw.focus(); });

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cta.disabled) YBM.snackbar("로그인 · 네이버 계정 연결 (개발)");
  });

  /* ---- 바로가기 해시 (가이드 뷰어 전용) ---- */
  function applyHash() {
    var filled = location.hash === "#sb58-filled";
    id.value = filled ? "userid" : "";
    pw.value = filled ? "Ybm2026!ok" : "";
    setShown(false);
    sync();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
