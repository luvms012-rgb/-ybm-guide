/* ==========================================================================
   회원가입 > 가입완료 — 간편계정 연결 (SB.18 · 만14세 미만 SB.29 공통)
   · ★ 소셜 아이콘 → 해당 소셜 로그인 후 연동. 실패 시 Alert 2종 — 서버 판정
   · ★ '다음에 하기' → 로그인 상태로 가입을 시작한 사이트로 이동
   · 퍼블리싱은 이동 지점을 스낵바로 표시하고, Alert 는 바로가기(#sb18-dup · #sb18-ci)로 확인
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.YBM_I18N || { t: function (k) { return k; } };
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  // 타이틀 아이디 — 실제로는 서버가 채운다. 퍼블리싱은 ?id= 가 있으면 그 값
  var m = /[?&]id=([^&#]+)/.exec(location.search);
  if (m) $("#complete-title em").textContent = decodeURIComponent(m[1]);

  var BRAND = { naver: "네이버", kakao: "카카오", google: "구글", apple: "애플" };
  $$(".signup-social__btn").forEach(function (b) {
    b.addEventListener("click", function () {
      YBM.snackbar(BRAND[b.getAttribute("data-brand")] + " 로그인 → 간편계정 연결 (개발)");
    });
  });
  $("#skip-link").addEventListener("click", function () {
    YBM.snackbar("연결 없이 로그인 상태로 가입을 시작한 사이트로 이동 (개발)");
  });

  /* ---- 바로가기 해시 (가이드 뷰어 전용) -----------------------------------
     #sb18 기본 · #sb18-dup 소셜계정 중복 연동 · #sb18-ci CI 불일치
     -------------------------------------------------------------------------- */
  var ALERT = { "sb18-dup": "dialog-social-dup", "sb18-ci": "dialog-social-ci" };
  function applyHash() {
    ["dialog-social-dup", "dialog-social-ci"].forEach(function (id) { YBM.closeDialog(id); });
    var id = ALERT[location.hash.replace("#", "")];
    if (id) YBM.openDialog(id);
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
