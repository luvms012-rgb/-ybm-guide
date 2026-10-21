/* ==========================================================================
   연계 페이지 > 어학시험 본인인증 (SB.59 회원 · SB.60 비회원 접수)
   · data-case-only="member|guest" 요소를 화면에 맞게 보이고 숨긴다 (실제로는 서버가 둘 중 하나만 그린다)
   · SB.59: 회원정보 변경 동의(필수)를 안 하고 수단을 누르면 Alert '회원 정보 변경에 동의해 주세요'
   · ★ 수단 → 인증 기관 팝업 / 회원가입 · 로그인 → 각 화면
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var R = window.SignupRecover;
  var consent = $("#consent");
  var mode = "member";

  R.methods($("#methods"), {
    consent: { get checked() { return mode === "guest" || consent.checked; } },
    onPick: function (m) { YBM.snackbar("본인인증 팝업: " + m); }
  });
  $("#guest-signup").addEventListener("click", function () { location.href = "terms.html"; });
  $("#guest-login").addEventListener("click", function () { YBM.snackbar("이동: 로그인"); });

  function applyHash() {
    R.closeAlert();
    var key = location.hash.replace("#", "") || "sb59";
    mode = key === "sb60" ? "guest" : "member";
    $$("[data-case-only]").forEach(function (el) { el.hidden = el.getAttribute("data-case-only") !== mode; });
    consent.checked = key === "sb59-agreed";
    if (key === "sb59-alert") R.alert("회원 정보 변경에 동의해 주세요");
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
