/* ==========================================================================
   회원가입 > 기존 회원 조회 (SB.13 · SB.14)
   · 어느 화면(data-case)을 보여줄지는 서버가 정한다. 퍼블리싱은 바로가기(#sb13 · #sb14)로 전환
   · SB.14: 아이디를 하나 고르면 [비밀번호 재설정] · [로그인하기] 활성
   · 버튼 이동 주소는 data-href 에 적어 두었다. 퍼블리싱에서는 가이드 밖으로 나가지 않도록 스낵바로 표시
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.YBM_I18N || { t: function (k) { return k; } };
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var radios = $$('input[name="member-id"]');
  var reset = $("#list-reset"), login = $("#list-login");

  function sync() {
    var picked = radios.some(function (r) { return r.checked; });
    reset.disabled = login.disabled = !picked;
  }
  radios.forEach(function (r) { r.addEventListener("change", sync); });

  // ★ 실제로는 data-href 로 이동한다(비밀번호 재설정은 새 창). 선택한 아이디를 함께 넘긴다
  $$("[data-href]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      if (b.disabled) return;
      var picked = radios.filter(function (r) { return r.checked; })[0];
      YBM.snackbar((picked && b.closest('[data-case="list"]') ? picked.value + " · " : "") + "이동: " + b.getAttribute("data-href"));
    });
  });
  $("#member-form").addEventListener("submit", function (e) { e.preventDefault(); });

  // 계속해서 가입하기 → SB.15 아이디 입력 (언어·인증 수단을 그대로 넘긴다)
  $("#continue-signup").addEventListener("click", function () { location.href = "account.html" + location.search; });

  /* ---- 바로가기 해시 (가이드 뷰어 전용) -----------------------------------
     #sb13 실명인증 아이디 1개 · #sb14 아이디 목록 · #sb14-selected 선택 상태
     -------------------------------------------------------------------------- */
  function applyHash() {
    var key = location.hash.replace("#", "") || "sb13";
    var single = key === "sb13";
    $('[data-case="single"]').hidden = !single;
    $('[data-case="list"]').hidden = single;
    radios.forEach(function (r, i) { r.checked = key === "sb14-selected" && i === 0; });
    sync();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
