/* ==========================================================================
   아이디 찾기 · 비밀번호 재설정 공통 (SB.45~57) — find-id.js / reset-pw.js 가 사용
   --------------------------------------------------------------------------
   SignupRecover.alert(titleKey, descKey)      Alert (Dialog closeButton=false · footer [확인]) → Promise
   SignupRecover.tabs(tablist, onChange)       DS Tabs — 휴대전화번호 / 이메일주소 / 본인인증
   SignupRecover.verifyPanel(panel, opts)      이름 + 휴대전화(이메일) + [인증번호 전송] → 인증번호 + 남은 시간
   SignupRecover.methods(root, opts)           본인인증 수단 버튼 (동의 체크박스가 있으면 먼저 확인)
   ★ 개발 연결 지점 (서버 호출이 들어갈 자리)
     sendCode(type, contact)  인증번호 발송 — false 면 '인증번호 전송에 실패했습니다'
     checkCode(code)          인증번호 확인 — 퍼블리싱에서는 000000 만 불일치
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.YBM_I18N || { t: function (k) { return String(k).replace(/ \(\d+\)$/, ""); } };
  var t = I18N.t;
  var LIMIT = 5 * 60;                       // 인증 유효 시간 — 기획서에 'N분'으로만 적혀 있어 확정 필요

  /* ---- ★ 서버 연결 지점 — 아래 두 함수를 실제 API 호출로 바꾼다 ------------
     퍼블리싱에서는 항상 성공으로 두고, checkCode 는 000000 만 불일치로 처리한다 */
  function sendCode(type, contact) { return Promise.resolve(true); }
  function checkCode(code) { return Promise.resolve(code !== "000000"); }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function html(key) { return esc(t(key)).replace(/\n/g, "<br>"); }

  /* ======================================================================
     Alert — 한 개의 <dialog id="dialog-alert"> 를 문구만 바꿔 쓴다
     ====================================================================== */
  function alert(titleKey, descKey) {
    var dlg = document.getElementById("dialog-alert");
    var title = document.getElementById("dialog-alert-title");
    var desc = document.getElementById("dialog-alert-desc");
    title.innerHTML = html(titleKey);
    desc.hidden = !descKey;
    desc.innerHTML = descKey ? html(descKey) : "";
    if (dlg.open) dlg.close();
    YBM.openDialog("dialog-alert");
    return new Promise(function (resolve) {
      dlg.addEventListener("close", function once() { dlg.removeEventListener("close", once); resolve(); });
    });
  }
  function closeAlert() { YBM.closeDialog("dialog-alert"); }

  /* ======================================================================
     Tabs — role="tab" + aria-controls 로 패널 전환, ← → 키 이동
     ====================================================================== */
  function tabs(tablist, onChange) {
    var triggers = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    function select(key, focus) {
      triggers.forEach(function (b) {
        var on = b.getAttribute("data-tab") === key;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
        if (on && focus) b.focus();
      });
      if (onChange) onChange(key);
    }
    triggers.forEach(function (b, i) {
      b.addEventListener("click", function () { select(b.getAttribute("data-tab")); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select(triggers[(i + d + triggers.length) % triggers.length].getAttribute("data-tab"), true);
      });
    });
    return { select: select };
  }

  /* ======================================================================
     인증 패널 — 휴대전화번호 / 이메일주소
       panel 안의 data-role: name · contact · send · otp-field · code · timer
       opts: { type: "phone"|"email", ctaArea, cta, onVerified(contact) }
     ====================================================================== */
  function verifyPanel(panel, opts) {
    var q = function (role) { return panel.querySelector('[data-role="' + role + '"]'); };
    var name = q("name"), contact = q("contact"), send = q("send"), otpField = q("otp-field"), code = q("code"), timerEl = q("timer");
    var isPhone = opts.type === "phone";
    var sent = false, left = LIMIT, timer = null, active = false;

    function mmss(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
    function paintTimer() { timerEl.textContent = mmss(left); }
    function stopTimer() { clearInterval(timer); timer = null; }
    function startTimer(elapsed) {
      stopTimer();
      left = LIMIT - (elapsed || 0);
      paintTimer();
      timer = setInterval(function () {
        left = Math.max(0, left - 1);
        paintTimer();
        if (left === 0) {                                     // 만료 → 입력값을 비우고 Alert
          stopTimer();
          code.value = "";
          sync();
          alert("인증번호가 만료되었습니다", "재전송 후 다시 입력해 주세요.");
        }
      }, 1000);
    }

    function sync() {
      if (!active) return;
      opts.ctaArea.hidden = !sent;                            // [다음] 은 인증번호를 보낸 뒤에만 (SB.45 에는 CTA 없음)
      opts.cta.disabled = !(sent && left > 0 && code.value.length === 6);
    }

    function setSent(on) {
      sent = on;
      otpField.hidden = !on;
      send.setAttribute("data-i18n", on ? "인증번호 재전송" : "인증번호 전송");
      send.textContent = t(on ? "인증번호 재전송" : "인증번호 전송");
      if (!on) { stopTimer(); code.value = ""; }
      sync();
    }

    // 입력 정리 — 휴대전화는 '- 없이 숫자만', 인증번호는 숫자 6자리
    if (isPhone) contact.addEventListener("input", function () {
      contact.value = contact.value.replace(/\D/g, "").slice(0, 11);
      contact.removeAttribute("aria-invalid");
    });
    code.addEventListener("input", function () { code.value = code.value.replace(/\D/g, "").slice(0, 6); sync(); });

    function validPhone(v) { return /^01[016789]\d{7,8}$/.test(v); }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

    send.addEventListener("click", function () {
      var c = contact.value.trim();
      if (!name.value.trim()) { alert("이름을 입력해 주세요").then(function () { name.focus(); }); return; }
      if (!c) {
        alert(isPhone ? "휴대전화번호를 입력해 주세요 (2)" : "이메일주소를 입력해 주세요").then(function () { contact.focus(); });
        return;
      }
      // 휴대전화 형식 오류는 Alert 없이 안내문('- 없이 숫자만…')만 오류색으로 바꾼다
      if (isPhone && !validPhone(c)) { contact.setAttribute("aria-invalid", "true"); contact.focus(); return; }
      if (!isPhone && !validEmail(c)) { alert("이메일주소를 정확히 입력해 주세요").then(function () { contact.focus(); }); return; }

      var resend = sent;
      sendCode(opts.type, c).then(function (ok) {
        if (!ok) { alert("인증번호 전송에 실패했습니다", "잠시 후 다시 시도해 주세요."); return; }
        alert(resend ? "인증번호를 재전송했습니다" : "인증번호를 전송했습니다").then(function () { code.focus(); });
        setSent(true);
        code.value = "";
        startTimer();
        sync();
      });
    });

    // [다음] — 페이지 스크립트가 form submit 에서 호출
    function submit() {
      if (!sent || opts.cta.disabled) return;
      checkCode(code.value).then(function (ok) {
        if (!ok) { alert("인증번호를 정확히 입력해 주세요").then(function () { code.focus(); }); return; }
        stopTimer();
        opts.onVerified(contact.value.trim());
      });
    }

    function preset(p) {
      p = p || {};
      name.value = p.name || "";
      contact.value = p.contact || "";
      contact.removeAttribute("aria-invalid");
      setSent(!!p.sent);
      if (p.sent) {
        code.value = p.code || "";
        startTimer(p.elapsed || 0);
        if (p.expired) { stopTimer(); left = 0; paintTimer(); }
      }
      sync();
    }

    return {
      preset: preset,
      submit: submit,
      reset: function () { preset({}); },
      activate: function (on) { active = on; if (on) sync(); },
      focusCode: function () { code.focus(); },
      focusName: function () { name.focus(); }
    };
  }

  /* ======================================================================
     본인인증 수단 — [data-method] 버튼. consent(체크박스)가 있으면 미동의 시 Alert
     ====================================================================== */
  function methods(root, opts) {
    opts = opts || {};
    Array.prototype.forEach.call(root.querySelectorAll("[data-method]"), function (b) {
      b.addEventListener("click", function () {
        if (opts.consent && !opts.consent.checked) { alert("회원 정보 변경에 동의해 주세요"); return; }
        // ★ 실제로는 각 인증 기관 팝업(휴대전화 · 아이핀 · 신용카드 · 외국인)을 열고 결과를 받는다
        if (opts.onPick) opts.onPick(b.getAttribute("data-method"));
      });
    });
  }

  window.SignupRecover = { alert: alert, closeAlert: closeAlert, tabs: tabs, verifyPanel: verifyPanel, methods: methods };
})();
