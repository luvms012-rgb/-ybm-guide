/* ==========================================================================
   회원가입 > 정보입력 (SB.15 아이디 · SB.16 비밀번호 · SB.17 이메일/휴대전화)
   --------------------------------------------------------------------------
   · 한 화면에 필드 하나 — [다음]으로 아이디 → 비밀번호 → 연락처 순서
   · SB.17 은 본인인증 수단의 반대 (휴대전화 인증 → 이메일 입력 / 이메일 인증(?verified=email) → 휴대전화 입력)
   · SB.21 만14세 미만(?under14=1) 은 같은 아이디 → 비밀번호 → 이메일 주소 순서이고,
     이메일 안내문만 '보호자 이메일도 입력 가능합니다.' 로 바뀐다. 인증 패스라 휴대전화 분기는 없다
   · 마지막 [가입하기] → SB.18 가입완료 (만14세 미만은 SB.22 보호자 동의)
   ★ 개발 연결 지점: isDuplicateId(id) 아이디 중복 확인 · 추천 아이디(서버가 값 채워서 내려줌)
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.YBM_I18N || { lang: "ko", t: function (k) { return k; }, setText: function (el, k) { el.textContent = k; } };
  var t = I18N.t;
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var form = $("#account-form"), title = $("#account-title"), cta = $("#cta");
  var f = { id: $("#user-id"), password: $("#password"), email: $("#email"), phone: $("#phone") };
  var idLabel = $("#user-id-label"), eye = $("#password-eye"), banned = $("#password-banned"), chips = $("#email-chips");

  var RECOMMENDED = "hgd00000";      // 추천 아이디 — 이름 이니셜(영문) + 임의 5자리 (서버 생성)
  var COPY = {
    title: { id: "아이디를 입력해 주세요", password: "비밀번호를 입력해 주세요", email: "이메일 주소를 입력해 주세요", phone: "휴대전화번호를 입력해 주세요" },
    idRule: "5~20자의 영문 소문자, 숫자와 특수기호(_),(-)만 사용 가능합니다.",
    idDup: "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.",
    emailGuardian: "보호자 이메일도 입력 가능합니다.",      // SB.21 만14세 미만
    emailError: "이메일 주소를 다시 확인해주세요.",
    phoneError: "휴대전화번호가 정확한지 확인해 주세요."
  };

  // 만14세 미만(SB.21) — 본인인증을 패스하고 왔으므로 연락처는 이메일 하나뿐
  var under14 = /[?&]under14=1\b/.test(location.search);
  var contact = !under14 && /[?&]verified=email\b/.test(location.search) ? "phone" : "email";
  var ORDER = function () { return ["id", "password", contact]; };
  var page = "id";

  /* ---- ★ 서버 연결 지점 — 아이디 중복 확인 -------------------------------
     퍼블리싱에서는 userid · userid1 · userid2 를 '이미 있는 아이디'로 둔다
     -------------------------------------------------------------------------- */
  function isDuplicateId(v) { return ["userid", "userid1", "userid2"].indexOf(v) > -1; }

  /* ---- 검증 ---------------------------------------------------------------- */
  function pwRules(v) {
    return {
      letter: /[A-Za-z]/.test(v),
      number: /\d/.test(v),
      special: /[^A-Za-z0-9\s';<()\\\/]/.test(v.replace(/--/g, "")),
      length: v.length >= 8 && v.length <= 20,
      banned: /[';<()\\\/]|--/.test(v)          // 사용불가: ' ; -- < ( ) \ /
    };
  }
  function digits(v) { return v.replace(/\D/g, ""); }
  function formatPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
    if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  }
  var valid = {
    id: function () { return /^[a-z0-9_-]{5,20}$/.test(f.id.value); },
    password: function () { var r = pwRules(f.password.value); return r.letter && r.number && r.special && r.length && !r.banned; },
    email: function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value); },
    phone: function () { return /^01[016789]\d{7,8}$/.test(digits(f.phone.value)); }
  };

  function setHelp(key, text, error) {
    var help = $("#" + (key === "id" ? "user-id" : key) + "-help");
    var el = f[key];
    if (error) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    if (text) I18N.setText(help, text); else help.textContent = "";
    help.hidden = !text;
  }

  /* SB.15 — 안내문은 항상 보이고, 형식이 틀리면 빨강 / 중복이면 중복 문구 */
  function showId(final, dup) {
    var v = f.id.value;
    idLabel.textContent = t(v === RECOMMENDED ? "아이디 (추천)" : "아이디");      // 추천값을 고치면 '아이디'
    var badChar = /[^a-z0-9_-]/.test(v);
    var formatErr = badChar || (final && v !== "" && !valid.id());
    setHelp("id", dup ? COPY.idDup : COPY.idRule, formatErr || dup);
  }

  /* SB.16 — 조건 4개 실시간 체크 + 사용불가 문자 캡션 */
  function showPassword() {
    var r = pwRules(f.password.value);
    $$(".signup-rule").forEach(function (li) { li.setAttribute("data-met", String(!!r[li.getAttribute("data-rule")])); });
    banned.hidden = !r.banned;
  }

  /* SB.17 이메일 — 칩은 입력을 시작했고 '@' 가 없고 오류가 아닐 때만 */
  function showEmail(final) {
    var v = f.email.value, err = final && v !== "" && !valid.email();
    setHelp("email", err ? COPY.emailError : (under14 ? COPY.emailGuardian : ""), err);
    chips.hidden = v === "" || v.indexOf("@") > -1 || err;
  }
  function showPhone(final) {
    var d = digits(f.phone.value);
    var err = !valid.phone() && d.length > 3 && (final || d.length >= 11);
    setHelp("phone", err ? COPY.phoneError : "", err);
  }

  function updateCta() {
    cta.disabled = !valid[page]();
    cta.textContent = t(page === contact ? "가입하기" : "다음");
  }

  /* ---- 화면 전환 -------------------------------------------------------- */
  function go(key, opts) {
    opts = opts || {};
    page = key;
    $$(".signup-page").forEach(function (el) { el.hidden = el.getAttribute("data-page") !== key; });
    I18N.setText(title, COPY.title[key]);
    if (key === "id") showId(false);
    if (key === "password") showPassword();
    if (key === "email") showEmail(false);        // SB.21 보호자 이메일 안내문이 바로 보이도록
    updateCta();
    if (!opts.silent) { f[key].focus(); caretEnd(f[key]); }
  }
  function caretEnd(el) { try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (cta.disabled) return;
    if (page === "id" && isDuplicateId(f.id.value)) { showId(true, true); cta.disabled = true; f.id.focus(); return; }
    var o = ORDER(), i = o.indexOf(page);
    if (i < o.length - 1) { go(o[i + 1]); return; }
    // 만14세 미만은 가입완료 전에 보호자 절차(SB.22)로
    if (under14) { location.href = "guardian.html"; return; }
    // 가입 완료 → SB.18 가입완료(간편계정 연결). 언어와 아이디를 넘긴다 (실제로는 서버 세션)
    var q = (I18N.lang === "en" ? "lang=en&" : "") + "id=" + encodeURIComponent(f.id.value);
    location.href = "complete.html?" + q;
  });

  /* ---- 이벤트 ------------------------------------------------------------ */
  f.id.addEventListener("input", function () { showId(false); updateCta(); });
  f.id.addEventListener("blur", function () { showId(true); });
  f.password.addEventListener("input", function () { showPassword(); updateCta(); });
  f.email.addEventListener("input", function () { showEmail(false); updateCta(); });
  f.email.addEventListener("blur", function (e) {
    if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest("#email-chips")) return;
    showEmail(true);
  });
  f.phone.addEventListener("input", function () { f.phone.value = formatPhone(f.phone.value); showPhone(false); updateCta(); });
  f.phone.addEventListener("blur", function () { showPhone(true); });

  chips.addEventListener("click", function (e) {
    var chip = e.target.closest(".ds-chip");
    if (!chip) return;
    f.email.value = f.email.value.split("@")[0] + chip.getAttribute("data-domain");
    showEmail(false); updateCta(); f.email.focus();
  });

  // 비밀번호 표시/숨김 — 가려진 상태 eye-off, 보이는 상태 eye
  function setShown(show) {
    f.password.type = show ? "text" : "password";
    eye.setAttribute("aria-pressed", String(show));
    eye.setAttribute("aria-label", t(show ? "비밀번호 숨기기" : "비밀번호 보기"));
    eye.firstElementChild.className = "ds-icon ds-icon--lg ds-icon--" + (show ? "eye" : "eye-off");
  }
  eye.addEventListener("mousedown", function (e) { e.preventDefault(); });      // 누를 때 입력 포커스 유지
  eye.addEventListener("click", function () { setShown(f.password.type === "password"); f.password.focus(); caretEnd(f.password); });

  /* ---- 바로가기 해시 — 가이드 뷰어·QA 전용 데모 코드 (실서비스에서는 제거) ---- */
  var PRESETS = {
    "sb15":             { page: "id", focus: true },
    "sb15-format":      { page: "id", id: "HongGilDong!" },
    "sb15-dup":         { page: "id", dup: true },
    "sb16":             { page: "password" },
    "sb16-invalid":     { page: "password", pw: "Ybm202(", focus: true },
    "sb16-show":        { page: "password", pw: "YBM2026", show: true, focus: true },
    "sb16-done":        { page: "password", pw: "Ybm2026!ok", focus: true },
    "sb17":             { page: "email" },
    "sb17-typing":      { page: "email", email: "hong", focus: true },
    "sb17-error":       { page: "email", email: "hong.naver.com", final: true },
    "sb17-done":        { page: "email", email: "hong@naver.com", focus: true },
    "sb17-phone":       { page: "phone" },
    "sb17-phone-error": { page: "phone", phone: "010-1234", final: true },
    "sb17-phone-done":  { page: "phone", phone: "010-1234-5678", focus: true },
    "sb21":             { page: "email", under14: true }        // 만14세 미만 — 보호자 이메일 안내
  };
  function applyHash() {
    var p = PRESETS[location.hash.replace("#", "")];
    f.id.value = RECOMMENDED; f.password.value = ""; f.email.value = ""; f.phone.value = "";
    setShown(false);
    Object.keys(f).forEach(function (k) { f[k].removeAttribute("aria-invalid"); });
    ["email", "phone"].forEach(function (k) { setHelp(k, "", false); });
    chips.hidden = true;
    if (!p) { go("id", { silent: true }); return; }
    under14 = !!p.under14;
    if (p.page === "phone") contact = "phone";
    else if (p.page === "email") contact = "email";
    if (p.id) f.id.value = p.id;
    if (p.pw) f.password.value = p.pw;
    if (p.show) setShown(true);
    if (p.email) f.email.value = p.email;
    if (p.phone) f.phone.value = p.phone;
    go(p.page, { silent: true });
    if (p.page === "id") showId(!!p.id, !!p.dup);
    if (p.dup) cta.disabled = true;
    if (p.page === "id" && p.id) cta.disabled = true;
    if (p.page === "email") showEmail(!!p.final);
    if (p.page === "phone") showPhone(!!p.final);
    if (p.focus) { f[p.page].focus(); caretEnd(f[p.page]); }
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
