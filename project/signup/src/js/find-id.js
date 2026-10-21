/* ==========================================================================
   아이디 찾기 (SB.45 ~ SB.50) — 공통 동작은 recover.js
   · 탭: 휴대전화번호(SB.45·46) / 이메일주소(SB.48·49) / 본인인증(SB.50)
   · 인증 성공 → 찾은 아이디(SB.47). ★ 본인인증 수단 버튼도 인증 기관 팝업 뒤 SB.47
   · SB.47 버튼: 로그인하러 가기 = 현재 창 로그인(아이디 자동 입력) · 비밀번호 재설정하기 = 새 창 비밀번호 재설정(추가 인증 없음)
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var R = window.SignupRecover;

  var form = $("#verify-form");
  var ctaArea = $('[data-role="verify-cta"]'), cta = $("#verify-cta");
  var verifyCard = $('[data-case="verify"]'), resultCard = $('[data-case="result"]');

  function showResult(on) {
    verifyCard.hidden = on;
    resultCard.hidden = !on;
    window.scrollTo(0, 0);
  }

  var panels = {
    phone: R.verifyPanel($("#panel-phone"), { type: "phone", ctaArea: ctaArea, cta: cta, onVerified: function () { showResult(true); } }),
    email: R.verifyPanel($("#panel-email"), { type: "email", ctaArea: ctaArea, cta: cta, onVerified: function () { showResult(true); } })
  };
  var current = "phone";
  var tabs = R.tabs($(".signup-tabs"), function (key) {
    current = key;
    Object.keys(panels).forEach(function (k) { panels[k].activate(k === key); });
    if (!panels[key]) ctaArea.hidden = true;                // 본인인증 탭은 CTA 없음
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (panels[current]) panels[current].submit();
  });

  // 본인인증 수단 — 실제는 인증 기관 팝업. 퍼블리싱은 바로 SB.47
  R.methods($("#panel-identity"), { onPick: function (m) { YBM.snackbar("본인인증 팝업: " + m); showResult(true); } });

  // SB.47 이동 — 퍼블리싱에서는 스낵바로 표시
  $("#result-login").addEventListener("click", function () {
    var id = document.querySelector('input[name="found-id"]:checked');
    YBM.snackbar((id ? id.value + " · " : "") + "이동: 로그인 (아이디 자동 입력)");
  });
  $("#result-reset").addEventListener("click", function () { window.open("reset-pw.html" + location.search, "_blank"); });

  /* ---- 바로가기 해시 — 가이드 뷰어·QA 전용 데모 코드 (실서비스에서는 제거) ---- */
  var NAME = (window.YBM_I18N ? YBM_I18N.t("홍길동") : "홍길동");
  var PHONE = { name: NAME, contact: "01012341234" };
  var EMAIL = { name: NAME, contact: "useremail@email.com" };
  function ext(a, b) { var o = {}; [a, b].forEach(function (s) { for (var k in s) o[k] = s[k]; }); return o; }
  var SENT = { sent: true, elapsed: 2 }, FILLED = { sent: true, code: "123456", elapsed: 9, focus: true };
  var PRESETS = {
    "sb45":          { tab: "phone" },
    // SB.45 는 기획서에 Alert 가 없어 같은 화면인 비밀번호 재설정 SB.52 와 같게 동작한다
    "sb45-name":     { tab: "phone", alert: ["이름을 입력해 주세요"] },
    "sb45-phone":    { tab: "phone", p: { name: NAME }, alert: ["휴대전화번호를 입력해 주세요 (2)"] },
    "sb45-sent":     { tab: "phone", p: ext(PHONE, SENT), alert: ["인증번호를 전송했습니다"] },
    "sb45-fail":     { tab: "phone", p: PHONE, alert: ["인증번호 전송에 실패했습니다", "잠시 후 다시 시도해 주세요."] },
    "sb46":          { tab: "phone", p: ext(PHONE, SENT) },
    "sb46-filled":   { tab: "phone", p: ext(PHONE, FILLED) },
    "sb46-mismatch": { tab: "phone", p: ext(PHONE, FILLED), alert: ["인증번호를 정확히 입력해 주세요"] },
    "sb46-expired":  { tab: "phone", p: ext(PHONE, { sent: true, expired: true }), alert: ["인증번호가 만료되었습니다", "재전송 후 다시 입력해 주세요."] },
    "sb46-resent":   { tab: "phone", p: ext(PHONE, SENT), alert: ["인증번호를 재전송했습니다"] },
    "sb46-already":  { tab: "phone", p: ext(PHONE, SENT), alert: ["이미 인증번호를 발송하였습니다", "잠시 후 다시 시도해 주세요."] },
    "sb46-fail":     { tab: "phone", p: ext(PHONE, SENT), alert: ["인증번호 전송에 실패했습니다", "잠시 후 다시 시도해 주세요."] },
    "sb47":          { result: true },
    "sb48":          { tab: "email" },
    "sb48-name":     { tab: "email", alert: ["이름을 입력해 주세요"] },
    "sb48-email":    { tab: "email", p: { name: NAME }, alert: ["이메일주소를 입력해 주세요"] },
    "sb48-format":   { tab: "email", p: { name: NAME, contact: "useremail@email" }, alert: ["이메일주소를 정확히 입력해 주세요"] },
    "sb48-sent":     { tab: "email", p: ext(EMAIL, SENT), alert: ["인증번호를 전송했습니다"] },
    "sb48-fail":     { tab: "email", p: EMAIL, alert: ["인증번호 전송에 실패했습니다", "잠시 후 다시 시도해 주세요."] },
    "sb49":          { tab: "email", p: ext(EMAIL, SENT) },
    "sb49-filled":   { tab: "email", p: ext(EMAIL, FILLED) },
    "sb49-mismatch": { tab: "email", p: ext(EMAIL, FILLED), alert: ["인증번호를 정확히 입력해 주세요"] },
    "sb49-expired":  { tab: "email", p: ext(EMAIL, { sent: true, expired: true }), alert: ["인증번호가 만료되었습니다", "재전송 후 다시 입력해 주세요."] },
    "sb49-resent":   { tab: "email", p: ext(EMAIL, SENT), alert: ["인증번호를 재전송했습니다"] },
    "sb49-already":  { tab: "email", p: ext(EMAIL, SENT), alert: ["이미 인증번호를 발송하였습니다", "잠시 후 다시 시도해 주세요."] },
    "sb49-fail":     { tab: "email", p: ext(EMAIL, SENT), alert: ["인증번호 전송에 실패했습니다", "잠시 후 다시 시도해 주세요."] },
    "sb50":          { tab: "identity" }
  };

  function applyHash() {
    R.closeAlert();
    var key = location.hash.replace("#", "");
    var p = PRESETS[key] || PRESETS.sb45;
    showResult(!!p.result);
    if (p.result) return;
    panels.phone.reset(); panels.email.reset();
    tabs.select(p.tab);
    if (panels[p.tab] && p.p) panels[p.tab].preset(p.p);
    if (p.p && p.p.focus) panels[p.tab].focusCode();
    if (p.alert) R.alert(p.alert[0], p.alert[1]);
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
