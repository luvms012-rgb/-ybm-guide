/* ==========================================================================
   회원가입 > 본인인증 — 팝업 2종 (SB.11 본인확인 약관동의 · SB.12 인증번호 입력)
   --------------------------------------------------------------------------
   identity.js 가 흐름에 맞춰 호출한다.
     SignupVerify.openTerms()          SB.10 [확인했어요] (실명인증 선택)
     SignupVerify.openOtp(target)      [인증번호 발송] 또는 SB.11 [동의하고 인증하기] 뒤
     SignupVerify.onVerified(fn)       인증 성공 시 (→ 기존 회원 조회 화면)
   ★ 개발 연결 지점 (서버 호출이 들어갈 자리)
     sendCode(target)   인증번호 발송·재전송      checkCode(code)   인증번호 확인 (불일치면 false)
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.YBM_I18N || { t: function (k) { return k; }, setText: function (el, k) { el.textContent = k; } };
  var t = I18N.t;
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var LIMIT = 5 * 60;          // 인증 유효 시간 — 기획서에 'N분'으로만 적혀 있어 확정 필요

  /* ---- ★ 서버 연결 지점 — 아래 두 함수를 실제 API 호출로 바꾼다 ------------
     퍼블리싱에서는 항상 성공으로 두고, checkCode 는 000000 만 불일치로 처리한다 */
  function sendCode(target) { return Promise.resolve(true); }
  function checkCode(code) { return Promise.resolve(code !== "000000"); }

  /* ======================================================================
     SB.11 본인확인 약관동의
     ====================================================================== */
  var terms = $("dialog-auth-terms");
  var all = $("auth-all");
  var toggle = $("auth-toggle");
  var list = $("auth-terms-list");
  var termsSubmit = $("auth-terms-submit");
  // SB.11 팝업이 없는 화면(보호자 동의·아동 휴대전화 등)도 이 파일을 쓴다 — 없으면 인증번호 팝업만 동작
  var hasTerms = !!terms;
  var checks = hasTerms ? $$('input[name="auth-terms"]', terms) : [];

  function syncTerms() {
    var every = checks.every(function (c) { return c.checked; });
    all.checked = every;
    termsSubmit.disabled = !every;          // 필수 5종 모두 동의해야 활성
  }
  function setExpanded(open) {
    list.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", t(open ? "약관 접기" : "약관 펼치기"));
    toggle.firstElementChild.className = "ds-icon ds-icon--lg ds-icon--chevron-" + (open ? "up" : "down");
  }
  if (hasTerms) {
    all.addEventListener("change", function () { checks.forEach(function (c) { c.checked = all.checked; }); syncTerms(); });
    checks.forEach(function (c) { c.addEventListener("change", syncTerms); });
    toggle.addEventListener("click", function () { setExpanded(list.hidden); });
    $$(".signup-terms__view", terms).forEach(function (b) {
      b.addEventListener("click", function () { YBM.snackbar("약관 전문 보기: " + b.getAttribute("data-term")); });
    });
  }

  var pendingTarget = "";
  if (hasTerms) termsSubmit.addEventListener("click", function () {
    YBM.closeDialog(terms);
    openOtp(pendingTarget);
  });

  function openTerms(target, opts) {
    if (!hasTerms) { openOtp(target); return; }     // 약관 팝업이 없는 화면은 바로 인증번호 입력으로
    opts = opts || {};
    pendingTarget = target;
    checks.forEach(function (c) { c.checked = !!opts.agreed; });
    syncTerms();
    setExpanded(!!opts.expanded);
    YBM.openDialog("dialog-auth-terms");
  }

  /* ======================================================================
     SB.12 인증번호 입력
     ====================================================================== */
  var otpDialog = $("dialog-otp");
  var otpTitle = $("dialog-otp-title");
  var box = $("otp-code");
  var input = $("otp");
  var cells = $$(".ds-code-input__cell", box);
  var error = $("otp-error");
  var remaining = $("otp-remaining");
  var otpSubmit = $("otp-submit");

  function paintCells() {
    var v = input.value;
    var focused = document.activeElement === input;
    cells.forEach(function (c, i) {
      c.textContent = v.charAt(i);
      c.setAttribute("data-state", i < v.length ? "filled" : (focused && i === Math.min(v.length, 5) ? "focused" : "empty"));
    });
    otpSubmit.disabled = v.length !== 6;    // 6자리를 다 채우면 활성
  }
  function setError(on) {
    if (on) box.setAttribute("aria-invalid", "true"); else box.removeAttribute("aria-invalid");
    error.hidden = !on;
  }
  input.addEventListener("input", function () {
    input.value = input.value.replace(/\D/g, "").slice(0, 6);
    setError(false);
    paintCells();
  });
  input.addEventListener("focus", paintCells);
  input.addEventListener("blur", paintCells);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !otpSubmit.disabled) otpSubmit.click(); });

  // 타이머
  var left = LIMIT, timer = null;
  function mmss(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  function paintTimer() { remaining.textContent = t("남은 시간") + " " + mmss(left); }
  function startTimer() {
    clearInterval(timer);
    left = LIMIT; paintTimer();
    timer = setInterval(function () {
      left = Math.max(0, left - 1); paintTimer();
      if (left === 0) clearInterval(timer);          // 만료 화면은 미정 — 지금은 시간만 멈춘다
    }, 1000);
  }
  $("otp-extend").addEventListener("click", function () { startTimer(); input.focus(); });                 // 시간 연장
  $("otp-resend").addEventListener("click", function () {                                                   // 재전송
    sendCode(currentTarget).then(function () {
      input.value = ""; setError(false); paintCells(); startTimer(); input.focus();
      YBM.snackbar(t("인증번호를 재전송했습니다"));
    });
  });
  otpDialog.addEventListener("close", function () { clearInterval(timer); });

  var verifiedFns = [];
  otpSubmit.addEventListener("click", function () {
    checkCode(input.value).then(function (ok) {
      if (!ok) { setError(true); paintCells(); input.focus(); return; }    // 불일치 → 입력칸 오류색 + 안내문
      YBM.closeDialog(otpDialog);
      verifiedFns.forEach(function (fn) { fn(); });
    });
  });

  var currentTarget = "";
  function openOtp(target, opts) {
    opts = opts || {};
    currentTarget = target;
    I18N.setText(otpTitle, t("{0}로 전송된\n인증번호를 입력해 주세요").replace("{0}", target));
    input.value = opts.code || "";
    setError(!!opts.error);
    sendCode(target);
    YBM.openDialog("dialog-otp");
    startTimer();
    if (opts.elapsed) { left = LIMIT - opts.elapsed; paintTimer(); }
    input.focus();
    paintCells();
  }

  window.SignupVerify = {
    openTerms: openTerms,
    openOtp: openOtp,
    onVerified: function (fn) { verifiedFns.push(fn); },
    closeAll: function () { if (hasTerms) YBM.closeDialog(terms); YBM.closeDialog(otpDialog); }
  };
})();
