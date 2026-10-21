/* ==========================================================================
   회원가입 > 만14세 미만 — 보호자(법정대리인) 절차 (SB.22 ~ SB.25)
   --------------------------------------------------------------------------
   · consent  (SB.22) 인증수단 라디오 2분기 — 휴대전화: 필수 약관 5종 / 아이핀: 저장·파기 안내 1건
                      전체(필수) 동의 시 [동의하고 인증하기] 활성 → 보호자 정보 입력으로
   · identity (SB.23 이름 → SB.24 생년월일 → 성별 → 휴대전화번호 → SB.25 확인) 누적 스텝
                      일반 가입 본인인증(identity.js)의 실명인증 경로와 같은 규칙. 보호자는 항상 통신사 선택
   · [확인했어요] → 인증번호 입력 팝업(verify.js) → 인증 성공 → 아동 휴대전화번호 입력(child-phone.html)
   · 정보 불일치 Alert 은 서버 판정 — 퍼블리싱은 #sb25-alert 바로가기로만 확인
   만14세 미만 경로는 한국어 전용 (영문 기획 없음)
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ====================== SB.22 보호자 동의 ============================== */
  var consentCard = $('[data-case="consent"]');
  var identityCard = $('[data-case="identity"]');
  var consentForm = $("#consent-form");
  var consentCta = $("#consent-cta");
  var methods = $$('input[name="auth-method"]');
  var allCheck = $("#guardian-all");
  var ipinCheck = $("#guardian-ipin");
  var termChecks = $$('input[name="guardian-terms"]');

  function method() { return methods.filter(function (r) { return r.checked; })[0].value; }

  function syncConsent() {
    var m = method();
    $$(".signup-agree-box").forEach(function (box) { box.hidden = box.getAttribute("data-method") !== m; });
    var ok = m === "ipin" ? ipinCheck.checked : termChecks.every(function (c) { return c.checked; });
    if (m !== "ipin") allCheck.checked = ok;
    consentCta.disabled = !ok;
  }

  methods.forEach(function (r) { r.addEventListener("change", syncConsent); });
  allCheck.addEventListener("change", function () {
    termChecks.forEach(function (c) { c.checked = allCheck.checked; });
    syncConsent();
  });
  termChecks.forEach(function (c) { c.addEventListener("change", syncConsent); });
  ipinCheck.addEventListener("change", syncConsent);
  $$(".signup-terms__view", consentCard).forEach(function (b) {
    b.addEventListener("click", function () { YBM.snackbar("약관 전문 보기: " + b.getAttribute("data-term")); });
  });

  consentForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!consentCta.disabled) showCase("identity");
  });

  function showCase(key, opts) {
    consentCard.hidden = key !== "consent";
    identityCard.hidden = key !== "identity";
    if (key === "identity" && !(opts && opts.silent)) activate("name");
  }

  /* ====================== SB.23~25 보호자 정보 입력 ====================== */
  var form = $("#guardian-form");
  var title = $("#step-title");
  var cta = $("#cta");
  var fields = { name: $("#name"), birth: $("#birth"), gender: $("#gender"), phone: $("#phone") };
  var phonePrefixLabel = $("#phone-prefix-label");

  var COPY = {
    title: {
      name: "보호자 이름을 입력해 주세요",
      birth: "보호자 생년월일을 입력해 주세요",
      gender: "보호자 성별을 선택해 주세요",          // 기획서에 화면 없음 ("나머지 프로세스 같음")
      phone: "보호자 휴대전화번호 인증을 진행합니다",
      confirm: "입력한 정보가 맞는지 확인해 주세요"
    },
    nameHelp: "실제 명의를 입력해 주세요. (특수기호, 공백 사용 불가)",
    nameError: "한글, 영문 대/소문자를 사용해 주세요. (특수기호, 공백 사용 불가)",
    birthHelp: "생년월일은 8자리 숫자로 입력해 주세요.",
    birthError: "생년월일이 정확한지 확인해 주세요.",
    phoneError: "휴대전화번호가 정확한지 확인해 주세요."
  };

  var ORDER = ["name", "birth", "gender", "phone", "confirm"];
  var INPUT_STEPS = ["name", "birth", "gender", "phone"];
  var state = { step: "name", carrier: "", gender: "" };

  function stepEl(key) { return $('.signup-step[data-step="' + key + '"]'); }
  function caretToEnd(el) { try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }
  function digits(v) { return v.replace(/\D/g, ""); }

  function formatBirth(v) {
    var d = digits(v).slice(0, 8);
    if (d.length > 6) return d.slice(0, 4) + "." + d.slice(4, 6) + "." + d.slice(6);
    if (d.length > 4) return d.slice(0, 4) + "." + d.slice(4);
    return d;
  }
  function formatPhone(v) {
    var d = digits(v).slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
    if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  }

  var rules = {
    name: function (v, final) {
      var bad = /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z]/.test(v);
      var valid = /^[가-힣a-zA-Z]+$/.test(v);
      return { valid: valid, error: bad || (final && v !== "" && !valid) };
    },
    birth: function (v, final) {
      var d = digits(v);
      if (d.length < 8) return { valid: false, error: final && d.length > 0 };
      var y = +d.slice(0, 4), m = +d.slice(4, 6), day = +d.slice(6, 8);
      var date = new Date(y, m - 1, day);
      var ok = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === day &&
               y >= 1900 && date <= new Date();
      return { valid: ok, error: !ok };
    },
    gender: function () { return { valid: state.gender !== "", error: false }; },
    phone: function (v, final) {
      var d = digits(v);
      var ok = /^01[016789]\d{7,8}$/.test(d);
      return { valid: ok && state.carrier !== "", error: !ok && (final || d.length >= 11) && d.length > 3 };
    },
    confirm: function () { return { valid: true, error: false }; }
  };

  function valueOf(key) { return key === "gender" ? state.gender : (fields[key] ? fields[key].value : ""); }

  function showFieldState(key, final) {
    if (!fields[key]) return rules[key]("", final);
    var r = rules[key](valueOf(key), final);
    var el = fields[key];
    var help = $("#" + key + "-help");
    if (r.error) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    if (help) {
      var base = key === "name" ? COPY.nameHelp : key === "birth" ? COPY.birthHelp : "";
      help.textContent = r.error ? COPY[key + "Error"] : base;
      help.hidden = help.textContent === "";
    }
    return r;
  }

  function updateCta() {
    var upto = ORDER.indexOf(state.step);
    cta.disabled = !ORDER.slice(0, upto + 1).every(function (k) { return rules[k](valueOf(k), false).valid; });
    cta.textContent = state.step === "confirm" ? "확인했어요" : "다음";
  }

  function activate(key, opts) {
    opts = opts || {};
    state.step = key;
    var idx = ORDER.indexOf(key);
    INPUT_STEPS.forEach(function (k) {
      var el = stepEl(k);
      var i = ORDER.indexOf(k);
      el.hidden = i > idx;
      el.setAttribute("data-state", i === idx ? "active" : "done");
      if (i < idx) showFieldState(k, true);
    });
    title.textContent = COPY.title[key];
    syncCarrier();
    updateCta();
    if (opts.silent) return;

    if (key === "gender") {
      setTimeout(function () { YBM.openDialog("dialog-gender"); }, 240);
    } else if (key === "confirm") {
      cta.focus();
    } else {
      fields[key].focus();
      caretToEnd(fields[key]);
    }
  }

  function next() {
    var idx = ORDER.indexOf(state.step);
    if (idx < ORDER.length - 1) { activate(ORDER[idx + 1]); return; }
    // SB.25 [확인했어요] → 인증번호 입력 (SB.22 에서 이미 약관에 동의했으므로 약관 팝업 없음)
    SignupVerify.openOtp(fields.phone.value);
  }

  // 인증 성공 → 아동 휴대전화번호 입력(SB.26)
  // ※ 보호자 YBM 아이디가 조회되면 SB.28 계정 연동이 사이에 들어가지만 비노출 화면이다
  SignupVerify.onVerified(function () { location.href = "child-phone.html"; });

  /* ---- 선택형 목록(성별·통신사) ----------------------------------------- */
  function selectOption(list, button) {
    $$(".ds-select-item", list).forEach(function (b) { b.setAttribute("aria-selected", String(b === button)); });
    var target = list.getAttribute("data-target");
    var value = button.getAttribute("data-value");

    if (target === "gender") setGender(value);
    else { state.carrier = value; syncCarrier(); }

    YBM.closeDialog(list.closest("dialog"));
    (target === "gender" ? fields.gender : fields.phone).focus();
    if (target !== "gender") showFieldState("phone", false);
    updateCta();
  }

  function setGender(value) {
    state.gender = value || "";
    fields.gender.textContent = state.gender;
    if (value) fields.gender.setAttribute("aria-label", "성별, " + value);
    else fields.gender.removeAttribute("aria-label");
    $$("#dialog-gender .ds-select-item").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.getAttribute("data-value") === state.gender));
    });
  }

  function syncCarrier() {
    phonePrefixLabel.textContent = state.carrier || "통신사";
    $("#phone-prefix").setAttribute("aria-label", "통신사를 선택해 주세요" + (state.carrier ? ", " + state.carrier : ""));
  }

  /* ---- 이벤트 ------------------------------------------------------------ */
  fields.name.addEventListener("input", function () { showFieldState("name", false); updateCta(); });
  fields.birth.addEventListener("input", function () {
    fields.birth.value = formatBirth(fields.birth.value);
    showFieldState("birth", false);
    updateCta();
  });
  fields.phone.addEventListener("input", function () {
    fields.phone.value = formatPhone(fields.phone.value);
    showFieldState("phone", false);
    updateCta();
  });
  ["name", "birth", "phone"].forEach(function (k) {
    fields[k].addEventListener("blur", function () { showFieldState(k, true); });
  });

  $$(".ds-select-list").forEach(function (l) {
    l.addEventListener("click", function (e) {
      var b = e.target.closest(".ds-select-item");
      if (b) selectOption(l, b);
    });
  });
  $$("dialog.signup-dialog, dialog.signup-alert").forEach(function (d) {
    d.setAttribute("tabindex", "-1");
    new MutationObserver(function () {
      if (!d.open) return;
      d.focus();
      var sel = $('[aria-selected="true"]', d);
      if (sel) sel.scrollIntoView({ block: "center" });
    }).observe(d, { attributes: true, attributeFilter: ["open"] });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cta.disabled) next();
  });

  /* ---- 바로가기 해시 — 가이드 뷰어·QA 전용 데모 코드 (실서비스에서는 제거) ---- */
  var SAMPLE = { name: "홍길동맘", birth: "1985.10.05", gender: "여성", phone: "010-1234-5678", carrier: "SKT" };
  var PRESETS = {
    "sb22":             { card: "consent" },
    "sb22-agreed":      { card: "consent", agreed: true },
    "sb22-ipin":        { card: "consent", ipin: true },
    "sb23":             { card: "identity", step: "name" },
    "sb24":             { card: "identity", step: "birth", focus: "birth" },
    "guardian-gender":  { card: "identity", step: "gender", dialog: "dialog-gender" },
    "guardian-phone":   { card: "identity", step: "phone", gender: true, focus: "phone" },
    "sb25":             { card: "identity", step: "confirm", gender: true, phone: true },
    "sb25-alert":       { card: "identity", step: "confirm", gender: true, phone: true, dialog: "dialog-mismatch" },
    "sb25-otp":         { card: "identity", step: "confirm", gender: true, phone: true, otp: true }
  };

  function reset() {
    ["dialog-gender", "dialog-carrier", "dialog-mismatch"].forEach(function (id) { YBM.closeDialog(id); });
    SignupVerify.closeAll();
    fields.name.value = ""; fields.birth.value = ""; fields.phone.value = "010";
    setGender("");
    state.carrier = "";
    $$("#dialog-carrier .ds-select-item").forEach(function (b) { b.setAttribute("aria-selected", "false"); });
    Object.keys(fields).forEach(function (k) { fields[k].removeAttribute("aria-invalid"); });
    methods.forEach(function (r, i) { r.checked = i === 0; });
    allCheck.checked = false; ipinCheck.checked = false;
    termChecks.forEach(function (c) { c.checked = false; });
    syncConsent();
  }

  function applyHash() {
    var p = PRESETS[location.hash.replace("#", "")];
    reset();
    if (!p) { showCase("consent"); activate("name", { silent: true }); return; }

    if (p.ipin) { methods[1].checked = true; ipinCheck.checked = true; }
    if (p.agreed) termChecks.forEach(function (c) { c.checked = true; });
    syncConsent();

    if (p.card === "consent") { showCase("consent"); activate("name", { silent: true }); return; }

    var idx = ORDER.indexOf(p.step);
    if (idx > 0) fields.name.value = SAMPLE.name;
    if (idx > 1) fields.birth.value = SAMPLE.birth;
    if (p.gender) setGender(SAMPLE.gender);
    if (p.phone) {
      fields.phone.value = SAMPLE.phone;
      state.carrier = SAMPLE.carrier;
      var c = $('#dialog-carrier [data-value="' + SAMPLE.carrier + '"]');
      if (c) c.setAttribute("aria-selected", "true");
    }
    showCase("identity", { silent: true });
    activate(p.step, { silent: true });
    if (p.focus) { fields[p.focus].focus(); caretToEnd(fields[p.focus]); }
    if (p.dialog) YBM.openDialog(p.dialog);
    if (p.otp) SignupVerify.openOtp(fields.phone.value, { elapsed: 2 });
  }

  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
