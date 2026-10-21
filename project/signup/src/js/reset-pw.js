/* ==========================================================================
   비밀번호 재설정 (SB.51 ~ SB.57) — 인증 탭 동작은 recover.js (아이디 찾기와 공통)
   · SB.51 아이디 입력 → [다음] → 아이디 확인(서버) → 인증 화면 (타이틀에 아이디)
   · SB.52·53 휴대전화번호 / SB.55·56 이메일주소 / SB.57 본인인증(회원정보 변경 동의 필수)
   · 인증 성공 → SB.54 새 비밀번호 → [확인] → 변경 완료 Alert → ★ 로그인 화면으로
   ★ 개발 연결 지점: findUser(id) · changePassword(id, pw)
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.YBM_I18N || { t: function (k) { return String(k).replace(/ \(\d+\)$/, ""); }, lang: "ko" };
  var t = I18N.t;
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var R = window.SignupRecover;

  /* ---- 서버 연결 지점 (퍼블리싱 확인용 값) -------------------------------- */
  function findUser(id) { return Promise.resolve(id !== "nouser"); }                 // nouser = 정보 불일치
  function changePassword(id, pw) { return Promise.resolve(pw === "Ybm2025!old" ? "same" : "ok"); }

  var cards = { id: $('[data-case="id"]'), verify: $('[data-case="verify"]'), password: $('[data-case="password"]') };
  function showCard(key) { Object.keys(cards).forEach(function (k) { cards[k].hidden = k !== key; }); window.scrollTo(0, 0); }

  /* ======================================================================
     SB.51 아이디 입력
     ====================================================================== */
  var idInput = $("#reset-id"), idCta = $("#id-cta");
  var userId = "userid";
  function syncId() { idCta.disabled = !idInput.value.trim(); }
  idInput.addEventListener("input", syncId);
  $("#to-find-id").href = "find-id.html" + location.search;      // 언어 등 쿼리를 이어서 넘긴다
  $("#id-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (idCta.disabled) return;
    var id = idInput.value.trim();
    findUser(id).then(function (ok) {
      if (!ok) { R.alert("입력하신 정보가 일치하지 않습니다", "다시 확인해 주세요.").then(function () { idInput.focus(); }); return; }
      setUser(id);
      showCard("verify");
    });
  });

  // 타이틀의 아이디 — 문구의 [[userid]] 자리에 넣는다
  var verifyTitle = $("#verify-title");
  var TITLE_KEY = verifyTitle.getAttribute("data-i18n");
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function setUser(id) {
    userId = id || "userid";
    var br = I18N.lang === "en" ? ' <br class="u-br-pc">' : "<br>";
    verifyTitle.innerHTML = esc(t(TITLE_KEY)).replace(/\n/g, br).replace("[[userid]]", "<em>" + esc(userId) + "</em>");
  }

  /* ======================================================================
     SB.52 ~ SB.57 인증 (아이디 찾기와 같은 구조)
     ====================================================================== */
  var ctaArea = $('[data-role="verify-cta"]'), cta = $("#verify-cta");
  function verified() { showCard("password"); pw.value = ""; showPassword(); pw.focus(); }
  var panels = {
    phone: R.verifyPanel($("#panel-phone"), { type: "phone", ctaArea: ctaArea, cta: cta, onVerified: verified }),
    email: R.verifyPanel($("#panel-email"), { type: "email", ctaArea: ctaArea, cta: cta, onVerified: verified })
  };
  var current = "phone";
  var tabs = R.tabs($(".signup-tabs"), function (key) {
    current = key;
    Object.keys(panels).forEach(function (k) { panels[k].activate(k === key); });
    if (!panels[key]) ctaArea.hidden = true;
  });
  $("#verify-form").addEventListener("submit", function (e) { e.preventDefault(); if (panels[current]) panels[current].submit(); });

  // SB.57 — 회원정보 변경 동의(필수)를 안 하고 수단을 누르면 Alert
  // ★ 본인인증을 받지 않은 아이디는 본인인증 탭 자체를 숨긴다 (서버 값으로 판단)
  var consent = $("#consent");
  R.methods($("#panel-identity"), { consent: consent, onPick: function (m) { YBM.snackbar("본인인증 팝업: " + m); verified(); } });

  /* ======================================================================
     SB.54 새 비밀번호 — 조건 4개 실시간 체크 (SB.16 과 같은 규칙)
     ====================================================================== */
  var pw = $("#password"), eye = $("#password-eye"), banned = $("#password-banned"), pwCta = $("#password-cta");
  function pwRules(v) {
    return {
      letter: /[A-Za-z]/.test(v),
      number: /\d/.test(v),
      special: /[^A-Za-z0-9\s';<()\\\/]/.test(v.replace(/--/g, "")),
      length: v.length >= 8 && v.length <= 20,
      banned: /[';<()\\\/]|--/.test(v)          // 사용불가: ' ; -- < ( ) \ /
    };
  }
  function showPassword() {
    var r = pwRules(pw.value);
    $$(".signup-rule").forEach(function (li) { li.setAttribute("data-met", String(!!r[li.getAttribute("data-rule")])); });
    banned.hidden = !r.banned;
    pwCta.disabled = !(r.letter && r.number && r.special && r.length && !r.banned);
  }
  pw.addEventListener("input", showPassword);
  function setShown(show) {
    pw.type = show ? "text" : "password";
    eye.setAttribute("aria-pressed", String(show));
    eye.setAttribute("aria-label", t(show ? "비밀번호 숨기기" : "비밀번호 보기"));
    eye.firstElementChild.className = "ds-icon ds-icon--lg ds-icon--" + (show ? "eye" : "eye-off");
  }
  eye.addEventListener("mousedown", function (e) { e.preventDefault(); });
  eye.addEventListener("click", function () { setShown(pw.type === "password"); pw.focus(); });

  $("#password-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (pwCta.disabled) return;
    changePassword(userId, pw.value).then(function (res) {
      if (res === "same") { R.alert("기존에 사용한 비밀번호는\n사용할 수 없습니다", "새로운 비밀번호를 입력해 주세요.").then(function () { pw.focus(); }); return; }
      R.alert("비밀번호가 변경되었습니다", "새 비밀번호로 로그인해 주세요.").then(function () { YBM.snackbar("이동: 로그인"); });
    });
  });

  /* ---- 바로가기 해시 — 가이드 뷰어·QA 전용 데모 코드 (실서비스에서는 제거) ---- */
  var NAME = (window.YBM_I18N ? YBM_I18N.t("홍길동") : "홍길동");
  var PHONE = { name: NAME, contact: "01012341234" };
  var EMAIL = { name: NAME, contact: "useremail@email.com" };
  function ext(a, b) { var o = {}; [a, b].forEach(function (s) { for (var k in s) o[k] = s[k]; }); return o; }
  var SENT = { sent: true, elapsed: 2 }, FILLED = { sent: true, code: "123456", elapsed: 9, focus: true };
  var FAIL = ["인증번호 전송에 실패했습니다", "잠시 후 다시 시도해 주세요."];
  function otpSet(tab, base) {
    return {
      "":          { tab: tab, p: ext(base, SENT) },
      "-filled":   { tab: tab, p: ext(base, FILLED) },
      "-mismatch": { tab: tab, p: ext(base, FILLED), alert: ["인증번호를 정확히 입력해 주세요"] },
      "-expired":  { tab: tab, p: ext(base, { sent: true, expired: true }), alert: ["인증번호가 만료되었습니다", "재전송 후 다시 입력해 주세요."] },
      "-resent":   { tab: tab, p: ext(base, SENT), alert: ["인증번호를 재전송했습니다"] },
      "-already":  { tab: tab, p: ext(base, SENT), alert: ["이미 인증번호를 발송하였습니다", "잠시 후 다시 시도해 주세요."] },
      "-fail":     { tab: tab, p: ext(base, SENT), alert: FAIL }
    };
  }
  var PRESETS = {
    "sb51":          { card: "id" },
    "sb51-filled":   { card: "id", id: "userid", focus: true },
    "sb51-mismatch": { card: "id", id: "userid", alert: ["입력하신 정보가 일치하지 않습니다", "다시 확인해 주세요."] },
    "sb52":          { tab: "phone" },
    "sb52-name":     { tab: "phone", alert: ["이름을 입력해 주세요"] },
    "sb52-phone":    { tab: "phone", p: { name: NAME }, alert: ["휴대전화번호를 입력해 주세요 (2)"] },
    "sb52-sent":     { tab: "phone", p: ext(PHONE, SENT), alert: ["인증번호를 전송했습니다"] },
    "sb52-fail":     { tab: "phone", p: PHONE, alert: FAIL },
    "sb54":          { card: "password" },
    "sb54-invalid":  { card: "password", pw: "Ybm202(", focus: true },
    "sb54-show":     { card: "password", pw: "YBM2026", show: true, focus: true },
    "sb54-done":     { card: "password", pw: "Ybm2026!ok", focus: true },
    "sb54-changed":  { card: "password", pw: "Ybm2026!ok", alert: ["비밀번호가 변경되었습니다", "새 비밀번호로 로그인해 주세요."] },
    "sb54-same":     { card: "password", pw: "Ybm2025!old", alert: ["기존에 사용한 비밀번호는\n사용할 수 없습니다", "새로운 비밀번호를 입력해 주세요."] },
    "sb55":          { tab: "email" },
    "sb55-name":     { tab: "email", alert: ["이름을 입력해 주세요"] },
    "sb55-email":    { tab: "email", p: { name: NAME }, alert: ["이메일주소를 입력해 주세요"] },
    "sb55-format":   { tab: "email", p: { name: NAME, contact: "useremail@email" }, alert: ["이메일주소를 정확히 입력해 주세요"] },
    "sb55-sent":     { tab: "email", p: ext(EMAIL, SENT), alert: ["인증번호를 전송했습니다"] },
    "sb55-fail":     { tab: "email", p: EMAIL, alert: FAIL },
    "sb57":          { tab: "identity" },
    "sb57-agreed":   { tab: "identity", agreed: true },
    "sb57-alert":    { tab: "identity", alert: ["회원 정보 변경에 동의해 주세요"] }
  };
  [["sb53", "phone", PHONE], ["sb56", "email", EMAIL]].forEach(function (a) {
    var set = otpSet(a[1], a[2]);
    Object.keys(set).forEach(function (suffix) { PRESETS[a[0] + suffix] = set[suffix]; });
  });

  function applyHash() {
    R.closeAlert();
    var p = PRESETS[location.hash.replace("#", "")] || PRESETS.sb51;
    var card = p.card || "verify";
    showCard(card);
    idInput.value = p.id || ""; syncId();
    setUser("userid");
    panels.phone.reset(); panels.email.reset();
    consent.checked = !!p.agreed;
    pw.value = p.pw || ""; setShown(!!p.show); showPassword();
    if (card === "verify") {
      tabs.select(p.tab);
      if (panels[p.tab] && p.p) panels[p.tab].preset(p.p);
      if (p.p && p.p.focus) panels[p.tab].focusCode();
    }
    if (p.focus && card === "id") idInput.focus();
    if (p.focus && card === "password") pw.focus();
    if (p.alert) R.alert(p.alert[0], p.alert[1]);
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
