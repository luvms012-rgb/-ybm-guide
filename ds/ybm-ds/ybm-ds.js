/* ==========================================================================
   YBM Design System — 공통 인터랙션 (의존성 없음, 모든 서비스 공용)
   --------------------------------------------------------------------------
   원칙: 모양은 CSS, 스크립트는 "CSS만으로 안 되는 동작"만.
     · Text Field clear 버튼 — 값 지우기 (노출/숨김은 CSS 가 처리)
     · Dialog — data-ds-open / data-ds-close 속성으로 열고 닫기, 바깥(dim) 클릭 닫기
     · Snackbar — YBM.snackbar("문구", { variant: "positive"|"critical", action: "확인", onAction, duration })
     · Slider — <input class="ds-slider"> 채움 길이(--ds-slider-value) 동기화
     · Checkbox — data-indeterminate 속성 → input.indeterminate
   사용: <script src="…/ybm-ds/ybm-ds.js" defer></script>
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Dialog ----------------------------------------------------------- */
  function openDialog(id) {
    var dialog = document.getElementById(id);
    if (dialog && !dialog.open) dialog.showModal();
    return dialog;
  }
  function closeDialog(dialog, value) {
    if (typeof dialog === "string") dialog = document.getElementById(dialog);
    if (dialog && dialog.open) dialog.close(value || "");
  }

  /* ---- Snackbar --------------------------------------------------------- */
  var snackbarTimer;
  var SNACK_ICON = { positive: "circle-check-solid", critical: "circle-alert-solid" };
  function snackbar(message, opts) {
    if (typeof opts === "number") opts = { duration: opts };   // 하위호환: snackbar(msg, ms)
    opts = opts || {};
    var el = document.querySelector(".ds-snackbar");
    if (!el) {
      el = document.createElement("div");
      el.className = "ds-snackbar";
      el.setAttribute("role", "status");
      el.setAttribute("data-state", "closed");
      document.body.appendChild(el);
    }
    el.textContent = "";
    if (opts.variant && opts.variant !== "default") el.setAttribute("data-variant", opts.variant);
    else el.removeAttribute("data-variant");
    if (SNACK_ICON[opts.variant]) {
      var icon = document.createElement("i");
      icon.className = "ds-icon ds-icon--" + SNACK_ICON[opts.variant];
      icon.setAttribute("aria-hidden", "true");
      el.appendChild(icon);
    }
    var msg = document.createElement("span");
    msg.className = "ds-snackbar__message";
    msg.textContent = message;
    el.appendChild(msg);
    if (opts.action) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ds-snackbar__action";
      btn.textContent = opts.action;
      btn.addEventListener("click", function () {
        if (opts.onAction) opts.onAction();
        el.setAttribute("data-state", "closed");
      });
      el.appendChild(btn);
    }
    requestAnimationFrame(function () { el.setAttribute("data-state", "open"); });
    clearTimeout(snackbarTimer);
    snackbarTimer = setTimeout(function () { el.setAttribute("data-state", "closed"); }, opts.duration || 4000);
  }

  /* ---- Slider: 채움 길이 ---------------------------------------------------- */
  function syncSlider(input) {
    var min = parseFloat(input.min || 0), max = parseFloat(input.max || 100), v = parseFloat(input.value);
    input.style.setProperty("--ds-slider-value", ((v - min) / (max - min || 1)) * 100 + "%");
  }
  document.addEventListener("input", function (e) {
    if (e.target.classList && e.target.classList.contains("ds-slider")) syncSlider(e.target);
  });

  /* ---- 초기화: 페이지에 이미 있는 요소 ------------------------------------- */
  function init(root) {
    (root || document).querySelectorAll(".ds-slider").forEach(syncSlider);
    (root || document).querySelectorAll(".ds-checkbox__control[data-indeterminate]").forEach(function (c) { c.indeterminate = true; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();

  /* ---- 이벤트 위임: 페이지에 요소가 나중에 추가돼도 동작 ------------------ */
  document.addEventListener("click", function (e) {
    var t = e.target;

    // clear 버튼 → 값 비우고 input 이벤트 발생(화면 검증 로직이 그대로 반응)
    var clear = t.closest(".ds-input__clear");
    if (clear) {
      var control = clear.closest(".ds-input").querySelector(".ds-input__control");
      control.value = "";
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.focus();
      return;
    }

    var opener = t.closest("[data-ds-open]");
    if (opener) { openDialog(opener.getAttribute("data-ds-open")); return; }

    var closer = t.closest("[data-ds-close]");
    if (closer) { closeDialog(closer.closest("dialog")); return; }

    // dialog 바깥(backdrop) 클릭 = dialog 요소 자신이 target
    // 단, Alert(role="alertdialog")는 버튼으로만 닫는다
    if (t.tagName === "DIALOG" && (t.classList.contains("ds-dialog") || t.classList.contains("ds-bottomsheet")) && t.getAttribute("role") !== "alertdialog") closeDialog(t);
  });

  // clear 버튼을 누르는 순간 input 포커스가 빠지지 않게 (버튼이 사라지는 깜빡임 방지)
  document.addEventListener("mousedown", function (e) {
    if (e.target.closest(".ds-input__clear")) e.preventDefault();
  });

  window.YBM = { openDialog: openDialog, closeDialog: closeDialog, snackbar: snackbar, init: init };
})();
