/* ==========================================================================
   회원가입 > 본인인증 (SB.4 ~ SB.10) — 누적 스텝 흐름
   --------------------------------------------------------------------------
   이름 → 생년월일 → 성별(레이어팝업) → 휴대전화번호 ⇄ 이메일 → (실명인증 선택 시) 입력 정보 확인
   · 다음 버튼: 현재까지 열린 스텝이 모두 유효하면 활성
   · 다음을 누르면 현재 스텝은 'done'(라벨 노출·아래로), 다음 스텝이 위에 나타나며 포커스 이동
   · 완료된 스텝도 다시 눌러 수정할 수 있다
   · 실명인증 선택 여부에 따라 이름 안내문 / 성별 옵션 / 휴대전화 prefix / CTA 문구 / 확인 화면이 바뀐다
   · 휴대전화 스텝의 '휴대전화가 없어요' ↔ 이메일 스텝의 '휴대전화로 인증할게요' 로 서로 전환 (SB.9, 실명인증 미선택 전용)
   · 실명인증 선택 경로는 휴대전화 다음에 '입력 정보 확인'(SB.10) — 모든 필드가 라벨과 함께 펼쳐지고 [확인했어요]
   · 만14세 미만(생년월일로 판단)은 성별 다음 바로 '입력 정보 확인'(SB.20) — 휴대전화·이메일 없이 인증 패스 → 보호자 절차
   공통 동작(clear 버튼, 다이얼로그 열고 닫기, 스낵바)은 ybm-ds.js 가 담당한다.
   ========================================================================== */
(function () {
  "use strict";

  // 한/영 — 문구는 한국어 원문을 키로 t() 에 넘긴다 (i18n.js 가 없으면 한국어 그대로)
  var I18N = window.YBM_I18N || { lang: "ko", t: function (k) { return k; }, setText: function (el, k) { el.textContent = k; } };
  var t = I18N.t;
  var EN = I18N.lang === "en";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var form = $("#identity-form");
  var title = $("#step-title");
  var cta = $("#cta");
  var switchLink = $("#switch-contact");
  var realName = $("#real-name");

  var fields = {
    name: $("#name"),
    birth: $("#birth"),
    gender: $("#gender"),
    phone: $("#phone"),
    email: $("#email")
  };
  var phonePrefix = $("#phone-prefix");
  var phonePrefixLabel = $("#phone-prefix-label");
  var chips = $("#email-chips");

  /* ---- 화면 문구 (영문은 i18n/en.js) ------------------------------------ */
  var COPY = {
    title: {
      name: "이름을 입력해 주세요",
      birth: "생년월일을 입력해 주세요",
      gender: "성별을 선택해 주세요",
      phone: "휴대전화번호 인증을 진행합니다",
      email: "이메일 인증을 진행합니다",
      confirm: "입력한 정보가 맞는지 확인해 주세요 (2)"
    },
    nameHelpReal: "실제 명의를 입력해 주세요. (특수기호, 공백 사용 불가)",
    nameHelp: "한글, 영문 대/소문자를 사용해 주세요. (특수기호, 공백 사용 불가)",
    nameError: "한글, 영문 대/소문자를 사용해 주세요. (특수기호, 공백 사용 불가) (2)",   // 키 끝 " (2)" — 영문만 안내문보다 짧은 문구
    birthHelp: "생년월일은 8자리 숫자로 입력해 주세요.",
    birthError: "생년월일이 정확한지 확인해 주세요.",
    phoneError: "휴대전화번호가 정확한지 확인해 주세요.",
    emailError: "이메일 주소를 다시 확인해주세요."
  };

  // 4번째 스텝은 휴대전화 ⇄ 이메일 중 하나, 실명인증 선택이면 그 뒤에 확인(confirm)
  var state = { step: "name", contact: "phone", carrier: "", country: EN ? "US" : "KR", gender: "", child: false };
  function order() {
    if (state.child) return ["name", "birth", "gender", "confirm"];      // 만14세 미만 (SB.20)
    var o = ["name", "birth", "gender", state.contact];
    if (isReal()) o.push("confirm");
    return o;
  }

  /* 만14세 미만 — 생년월일이 유효할 때만 판정한다 (입력 도중엔 이전 판정 유지)
     영문(외국인 가입)에는 만14세 미만 경로가 없어 적용하지 않는다 */
  function isChildBirth(v) {
    var d = digits(v), now = new Date();
    var age = now.getFullYear() - +d.slice(0, 4);
    if (now.getMonth() + 1 < +d.slice(4, 6) || (now.getMonth() + 1 === +d.slice(4, 6) && now.getDate() < +d.slice(6, 8))) age--;
    return age < 14;
  }
  function syncChild() {
    if (EN || !rules.birth(fields.birth.value, false).valid) return;
    var child = isChildBirth(fields.birth.value);
    if (child === state.child) return;
    state.child = child;
    // 확인 화면에서 생년월일을 고쳐 경로가 바뀌면, 지금 스텝을 새 경로의 마지막 스텝으로
    if (order().indexOf(state.step) < 0) activate(order()[order().length - 1], { silent: true });
  }
  var INPUT_STEPS = ["name", "birth", "gender", "phone", "email"];

  // 커서를 값 끝으로 (type="email" 은 선택 영역 API 를 지원하지 않아 건너뛴다)
  function caretToEnd(el) { try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }

  function stepEl(key) { return $('.signup-step[data-step="' + key + '"]'); }
  // 실명인증 여부. 영문에서는 체크박스가 숨겨져(data-ko-only) 선택할 수 없다
  function isReal() { return realName.checked; }

  /* ---- 국가번호 ---------------------------------------------------------- */
  function countryItem(code) { return $('#dialog-country [data-country="' + code + '"]'); }
  function dialCode() { var el = countryItem(state.country); return el ? el.getAttribute("data-value") : "+82"; }

  /* ---- 입력 포맷 --------------------------------------------------------- */
  function digits(v) { return v.replace(/\D/g, ""); }

  function formatBirth(v) {            // 19990105 → 1999.01.05
    var d = digits(v).slice(0, 8);
    if (d.length > 6) return d.slice(0, 4) + "." + d.slice(4, 6) + "." + d.slice(6);
    if (d.length > 4) return d.slice(0, 4) + "." + d.slice(4);
    return d;
  }
  function formatPhone(v) {            // 01012345678 → 010-1234-5678 (국내 번호일 때만)
    if (!isDomesticPhone()) return digits(v).slice(0, 15);
    var d = digits(v).slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
    if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  }
  function isDomesticPhone() { return isReal() || dialCode() === "+82"; }

  /* ---- 검증 --------------------------------------------------------------
     각 규칙은 { valid, error } 를 돌려준다.
       valid : 다음 버튼 활성 조건
       error : 지금 오류 문구를 보여줄지 (입력 중엔 너무 이르게 띄우지 않는다)
     final=true 는 포커스가 빠졌을 때(blur)·스텝을 넘길 때 호출을 뜻한다
     -------------------------------------------------------------------------- */
  var rules = {
    name: function (v, final) {
      var bad = /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z]/.test(v);          // 특수기호·숫자·공백
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
      var ok = isDomesticPhone() ? /^01[016789]\d{7,8}$/.test(d) : d.length >= 6 && d.length <= 15;
      var full = isDomesticPhone() ? d.length >= 11 : false;
      var prefixOk = isReal() ? state.carrier !== "" : true;
      return { valid: ok && prefixOk, error: !ok && (final || full) && d.length > 3 };
    },
    email: function (v, final) {
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      return { valid: ok, error: !ok && final && v !== "" };
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
      var base = key === "name" ? (isReal() ? COPY.nameHelpReal : COPY.nameHelp)
               : key === "birth" ? COPY.birthHelp : "";
      I18N.setText(help, r.error ? COPY[key + "Error"] : base);
      help.hidden = help.textContent === "";
    }
    if (key === "email") syncChips();
    return r;
  }

  /* 이메일 도메인 추천 칩 — 오류가 없고 아직 '@' 를 입력하지 않았을 때만 보인다 */
  function syncChips() {
    var v = fields.email.value;
    chips.hidden = v.indexOf("@") > -1 || fields.email.getAttribute("aria-invalid") === "true";
  }

  /* 지금까지 열린 스텝이 전부 유효해야 다음 버튼 활성 */
  function updateCta() {
    var o = order();
    var upto = o.indexOf(state.step);
    cta.disabled = !o.slice(0, upto + 1).every(function (k) { return rules[k](valueOf(k), false).valid; });

    var last = state.step === "phone" || state.step === "email";
    var key = state.step === "confirm" ? "확인했어요 (2)"
            : last && !isReal() ? "인증번호 발송"
            : "다음";
    cta.textContent = t(key);

    // 휴대전화 ⇄ 이메일 전환 링크 (실명인증 미선택 경로에서만)
    switchLink.hidden = !(last && !isReal());
    switchLink.textContent = t(state.step === "email" ? "휴대전화로 인증할게요" : "휴대전화가 없어요");
  }

  /* ---- 스텝 전환 --------------------------------------------------------- */
  function activate(key, opts) {
    opts = opts || {};
    state.step = key;
    var o = order();
    var idx = o.indexOf(key);
    INPUT_STEPS.forEach(function (k) {
      var el = stepEl(k);
      var i = o.indexOf(k);
      el.hidden = i < 0 || i > idx;
      el.setAttribute("data-state", i === idx ? "active" : "done");
      if (i > -1 && i < idx) showFieldState(k, true);
    });
    I18N.setText(title, COPY.title[key]);
    if (key === "phone" || key === "confirm") syncPhonePrefix();
    if (key === "email") syncChips();
    updateCta();
    if (opts.silent) return;

    // 새로 나타난 스텝으로 포커스를 옮긴다
    //   성별 : 팝업을 바로 연다
    //   휴대전화 : 번호 입력으로 포커스 (통신사는 앞의 '통신사 ∨' 를 눌러 고른다)
    //   확인 : 입력이 없으므로 CTA 버튼으로
    if (key === "gender") {
      setTimeout(function () { YBM.openDialog("dialog-gender"); }, 240);
    } else if (key === "confirm") {
      cta.focus();
    } else {
      var input = fields[key];
      input.focus();
      caretToEnd(input);
    }
  }

  function next() {
    var o = order();
    var idx = o.indexOf(state.step);
    if (idx < o.length - 1) { activate(o[idx + 1]); return; }
    // 마지막 스텝 — 팝업으로 이어진다 (verify.js)
    //   실명인증 선택: [확인했어요] → SB.11 약관동의 → SB.12 인증번호 입력
    //     (정보 불일치 Alert 는 서버 판정 — 퍼블리싱에서는 #sb10-alert 로만 확인)
    //   미선택: [인증번호 발송] → SB.12 인증번호 입력 (휴대전화 또는 이메일)
    if (state.step === "confirm" && state.child) {
      // 만14세 미만: 인증 패스 → SB.21 정보입력(아이디 → 비밀번호 → 이메일, 보호자 이메일 안내) → SB.22 보호자 동의
      location.href = "account.html?under14=1";
      return;
    }
    if (state.step === "confirm") SignupVerify.openTerms(contactTarget());
    else SignupVerify.openOtp(contactTarget());
  }

  /* 인증번호를 보낼 곳 — 팝업 타이틀에 그대로 나온다 */
  function contactTarget() {
    if (state.contact === "email") return fields.email.value;
    return isDomesticPhone() ? fields.phone.value : dialCode() + " " + fields.phone.value;
  }

  /* ★ 인증 성공 → 기존 회원 조회(SB.13·14). 실제로는 조회 결과에 따라 서버가 분기한다
     (퍼블리싱에서는 실명인증 선택이면 SB.13, 미선택이면 SB.14 로 고정) */
  SignupVerify.onVerified(function () {
    // 어떤 수단으로 인증했는지 넘긴다 — 정보입력(SB.17)에서 반대 수단을 받는다
    var q = [];
    if (I18N.lang === "en") q.push("lang=en");
    if (state.contact === "email") q.push("verified=email");
    location.href = "existing-member.html" + (q.length ? "?" + q.join("&") : "") + (isReal() ? "#sb13" : "#sb14");
  });

  /* 휴대전화 ⇄ 이메일 */
  function switchContact(to, opts) {
    state.contact = to;
    activate(to, opts);
  }

  /* ---- 선택형 목록(성별·통신사·국가번호) --------------------------------- */
  function selectOption(list, button) {
    $$(".ds-select-item", list).forEach(function (b) { b.setAttribute("aria-selected", String(b === button)); });
    var target = list.getAttribute("data-target");
    var value = button.getAttribute("data-value");
    var dialog = list.closest("dialog");

    if (target === "gender") {
      setGender(value);
    } else if (target === "carrier") {
      state.carrier = value;
      syncPhonePrefix();
    } else if (target === "country") {
      state.country = button.getAttribute("data-country");
      syncPhonePrefix();
      fields.phone.value = formatPhone(fields.phone.value);
    }
    YBM.closeDialog(dialog);
    (target === "gender" ? fields.gender : fields.phone).focus();
    if (target !== "gender") showFieldState("phone", false);
    updateCta();
  }

  function setGender(value) {
    state.gender = value || "";
    fields.gender.textContent = value ? t(value) : "";
    if (value) fields.gender.setAttribute("aria-label", t("성별") + ", " + t(value));
    else fields.gender.removeAttribute("aria-label");
    $$("#dialog-gender .ds-select-item").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.getAttribute("data-value") === state.gender));
    });
  }

  function syncPhonePrefix() {
    if (isReal()) {
      phonePrefixLabel.textContent = state.carrier ? t(state.carrier) : t("통신사");
      phonePrefix.setAttribute("data-ds-open", "dialog-carrier");
      phonePrefix.setAttribute("aria-label", t("통신사를 선택해 주세요") + (state.carrier ? ", " + t(state.carrier) : ""));
    } else {
      phonePrefixLabel.textContent = dialCode();
      phonePrefix.setAttribute("data-ds-open", "dialog-country");
      phonePrefix.setAttribute("aria-label", t("국가번호를 선택해 주세요") + ", " + dialCode());
    }
  }

  function syncRealName() {
    // 실명인증을 선택하면 성별 '선택안함' 옵션이 사라지고 이메일 인증 경로도 없다
    $$('[data-only="not-real"]').forEach(function (li) { li.hidden = isReal(); });
    if (isReal() && state.gender === "선택안함") setGender("");
    if (isReal()) state.contact = "phone";
    showFieldState("name", false);
    syncPhonePrefix();
    updateCta();
  }

  /* 영문: 국가번호 목록을 영문 국가명 알파벳순으로 */
  if (EN) {
    var list = $("#dialog-country .ds-select-list");
    $$("li", list).sort(function (a, b) { return a.textContent.trim().localeCompare(b.textContent.trim(), "en"); })
      .forEach(function (li) { list.appendChild(li); });
  }

  /* ---- 이벤트 ------------------------------------------------------------ */
  fields.name.addEventListener("input", function () { showFieldState("name", false); updateCta(); });
  fields.birth.addEventListener("input", function () {
    fields.birth.value = formatBirth(fields.birth.value);
    showFieldState("birth", false);
    syncChild();
    updateCta();
  });
  fields.phone.addEventListener("input", function () {
    fields.phone.value = formatPhone(fields.phone.value);
    showFieldState("phone", false);
    updateCta();
  });
  fields.email.addEventListener("input", function () {
    // 입력 중에는 오류를 지우기만 한다 (오류 표시는 포커스가 빠질 때)
    fields.email.removeAttribute("aria-invalid");
    var help = $("#email-help"); help.hidden = true; help.textContent = "";
    syncChips();
    updateCta();
  });
  ["name", "birth", "phone", "email"].forEach(function (k) {
    fields[k].addEventListener("blur", function (e) {
      // 추천 칩을 누르는 순간의 blur 는 오류로 보지 않는다
      if (k === "email" && e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest("#email-chips")) return;
      showFieldState(k, true);
    });
  });
  realName.addEventListener("change", syncRealName);

  chips.addEventListener("click", function (e) {
    var chip = e.target.closest(".ds-chip");
    if (!chip) return;
    var v = fields.email.value.split("@")[0];
    fields.email.value = v + chip.getAttribute("data-domain");
    showFieldState("email", false);
    updateCta();
    fields.email.focus();
  });

  $$(".ds-select-list").forEach(function (l) {
    l.addEventListener("click", function (e) {
      var b = e.target.closest(".ds-select-item");
      if (b) selectOption(l, b);
    });
  });
  // 레이어팝업을 열면 선택된 항목이 보이도록 스크롤한다. 포커스는 팝업 자체에 둔다
  // (항목에 포커스를 주면 hover 배경이 생겨 기본 상태와 달라 보인다)
  $$("dialog.signup-dialog, dialog.signup-alert, #dialog-auth-terms").forEach(function (d) {
    d.setAttribute("tabindex", "-1");
    new MutationObserver(function () {
      if (!d.open) return;
      d.focus();
      var sel = $('[aria-selected="true"]', d);
      if (sel) sel.scrollIntoView({ block: "center" });
    }).observe(d, { attributes: true, attributeFilter: ["open"] });
  });

  switchLink.addEventListener("click", function () {
    switchContact(state.contact === "phone" ? "email" : "phone");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!cta.disabled) next();
  });

  /* ---- 바로가기 해시(#sb4 ~ #sb12 · #sb20) --------------------------------
     가이드 뷰어·QA 에서 특정 상태로 바로 열기 위한 데모 코드다.
     실제 서비스에서는 아래 SAMPLE·PRESETS·applyHash 블록을 모두 제거하고
     applyHash() 대신 activate("name") 만 호출하면 된다.
     -------------------------------------------------------------------------- */
  var SAMPLE = { name: t("홍길동"), birth: "1999.10.05", gender: "남성", phone: "010-1234-5678", carrier: "SKT", childBirth: "2016.03.12" };
  var PRESETS = {
    sb4:          { step: "name" },
    sb5:          { step: "birth", focus: "birth" },
    sb6:          { step: "gender", dialog: "dialog-gender" },
    sb7:          { step: "gender", gender: true, focus: "gender" },
    sb8:          { step: "phone", gender: true, real: false },
    "sb8-real":   { step: "phone", gender: true, real: true, focus: "phone" },
    sb9:          { step: "email", contact: "email", gender: true, real: false },
    sb10:         { step: "confirm", gender: true, real: true, phone: true },
    "sb10-alert": { step: "confirm", gender: true, real: true, phone: true, dialog: "dialog-mismatch" },
    sb11:         { step: "confirm", gender: true, real: true, phone: true, verify: "terms" },
    "sb11-open":  { step: "confirm", gender: true, real: true, phone: true, verify: "terms-open" },
    sb12:         { step: "confirm", gender: true, real: true, phone: true, verify: "otp" },
    "sb12-filled":{ step: "confirm", gender: true, real: true, phone: true, verify: "otp-filled" },
    "sb12-error": { step: "confirm", gender: true, real: true, phone: true, verify: "otp-error" },
    sb20:         { step: "confirm", gender: true, real: false, child: true }        // 만14세 미만 — 입력 정보 확인 (인증 패스)
  };

  function reset() {
    ["dialog-gender", "dialog-carrier", "dialog-country", "dialog-mismatch"].forEach(function (id) { YBM.closeDialog(id); });
    SignupVerify.closeAll();
    fields.name.value = ""; fields.birth.value = ""; fields.phone.value = "010"; fields.email.value = "";
    setGender("");
    state.carrier = ""; state.country = EN ? "US" : "KR"; state.contact = "phone"; state.child = false;
    $$("#dialog-carrier .ds-select-item, #dialog-country .ds-select-item").forEach(function (b) {
      b.setAttribute("aria-selected", String(b.getAttribute("data-country") === state.country));
    });
    Object.keys(fields).forEach(function (k) { fields[k].removeAttribute("aria-invalid"); });
  }

  // 약관동의에서 넘어온 실명인증 선택값 (?real=1)
  var realFromTerms = /[?&]real=1\b/.test(location.search);

  function applyHash() {
    var key = location.hash.replace("#", "");
    var p = PRESETS[key];
    reset();
    if (!p) { realName.checked = realFromTerms; syncRealName(); activate("name", { silent: true }); return; }
    realName.checked = !!p.real;
    syncRealName();
    if (p.contact) state.contact = p.contact;
    if (p.child) state.child = true;
    var idx = order().indexOf(p.step);
    if (idx > 0) fields.name.value = SAMPLE.name;
    if (idx > 1) fields.birth.value = p.child ? SAMPLE.childBirth : SAMPLE.birth;
    if (p.gender) setGender(SAMPLE.gender);
    if (p.phone) {
      fields.phone.value = SAMPLE.phone;
      state.carrier = SAMPLE.carrier;
      var c = $('#dialog-carrier [data-value="' + SAMPLE.carrier + '"]'); if (c) c.setAttribute("aria-selected", "true");
    }
    activate(p.step, { silent: true });
    if (p.focus) {
      var f = fields[p.focus];
      f.focus();
      caretToEnd(f);
    }
    if (p.dialog) YBM.openDialog(p.dialog);
    // SB.11·12 — 팝업을 특정 상태로 열어 둔다 (564854 는 예시 인증번호)
    if (p.verify === "terms") SignupVerify.openTerms(contactTarget());
    if (p.verify === "terms-open") SignupVerify.openTerms(contactTarget(), { agreed: true, expanded: true });
    if (p.verify === "otp") SignupVerify.openOtp(contactTarget(), { elapsed: 2 });
    if (p.verify === "otp-filled") SignupVerify.openOtp(contactTarget(), { code: "564854", elapsed: 2 });
    if (p.verify === "otp-error") SignupVerify.openOtp(contactTarget(), { code: "564854", error: true, elapsed: 2 });
  }

  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
