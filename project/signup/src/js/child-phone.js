/* ==========================================================================
   회원가입 > 만14세 미만 — 실사용자(아동) 휴대전화번호 (SB.26 · SB.27)
   --------------------------------------------------------------------------
   · SB.26 아동 번호 입력 — 국내 번호만(통신사·국가번호 선택 없음), 010 자동 입력, 010-0000-0000 자동 포맷
     [인증번호 발송] → 인증번호 입력 팝업(verify.js) → 인증 성공 → 가입완료(SB.29)
   · SB.27 휴대전화가 없을 때 — 입력 없이 보호자 번호를 등록. [가입하기] 는 항상 활성
   · 두 화면은 하단 링크로 서로 오간다 (문구를 고칠 때는 양쪽을 같이 본다)
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var phoneCard = $('[data-case="phone"]');
  var noticeCard = $('[data-case="notice"]');
  var form = $("#phone-form");
  var phone = $("#phone");
  var help = $("#phone-help");
  var cta = $("#phone-cta");

  var ERROR = "휴대전화번호가 정확한지 확인해 주세요.";

  function digits(v) { return v.replace(/\D/g, ""); }
  function formatPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
    if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  }
  function isValid() { return /^01[016789]\d{7,8}$/.test(digits(phone.value)); }

  function show(final) {
    var d = digits(phone.value);
    var err = !isValid() && d.length > 3 && (final || d.length >= 11);
    if (err) phone.setAttribute("aria-invalid", "true"); else phone.removeAttribute("aria-invalid");
    help.textContent = err ? ERROR : "";
    help.hidden = !err;
    cta.disabled = !isValid();
  }

  function showCase(key) {
    phoneCard.hidden = key !== "phone";
    noticeCard.hidden = key !== "notice";
  }

  phone.addEventListener("input", function () { phone.value = formatPhone(phone.value); show(false); });
  phone.addEventListener("blur", function () { show(true); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cta.disabled) SignupVerify.openOtp(phone.value);
  });

  // 인증 성공 → 가입완료 (SB.29 = SB.18 과 같은 화면)
  SignupVerify.onVerified(function () { location.href = "complete.html#sb29"; });

  $("#to-notice").addEventListener("click", function () { location.hash = "sb27"; });
  $("#to-phone").addEventListener("click", function () { location.hash = "sb26"; });
  // 보호자 번호를 회원정보에 저장하고 가입 완료 처리 (서버) → SB.29
  $("#notice-cta").addEventListener("click", function () { location.href = "complete.html#sb29"; });

  /* ---- 바로가기 해시 — 가이드 뷰어·QA 전용 데모 코드 (실서비스에서는 제거) ---- */
  var PRESETS = {
    "sb26":       { card: "phone" },
    "sb26-error": { card: "phone", phone: "01000", final: true },
    "sb26-otp":   { card: "phone", phone: "010-1234-5678", otp: true },
    "sb27":       { card: "notice" }
  };
  function applyHash() {
    SignupVerify.closeAll();
    var p = PRESETS[location.hash.replace("#", "")] || PRESETS.sb26;
    phone.value = p.phone || "010";
    showCase(p.card);
    show(!!p.final);
    if (p.card === "phone" && !p.otp) { phone.focus(); try { phone.setSelectionRange(phone.value.length, phone.value.length); } catch (e) {} }
    if (p.otp) SignupVerify.openOtp(phone.value, { elapsed: 2 });
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
