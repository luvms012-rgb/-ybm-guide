/* ==========================================================================
   한/영 전환 (i18n) — 의존성 없는 일반 스크립트
   --------------------------------------------------------------------------
   · 언어는 <html lang> 하나로 결정한다. 주소에 ?lang=en 이 있으면 영문.
   · HTML 은 한 벌. 기본 텍스트는 한국어 그대로 두고 번역할 요소에만 키를 단다.
       <h1 data-i18n="회원가입">회원가입</h1>
       <input data-i18n-attr="placeholder:이름; aria-label:이름">
       <label data-ko-only>…</label>          ← 한국어에서만 보임
       <p data-en-only>…</p>                  ← 영문에서만 보임
   · 키 = 한국어 원문. 같은 한국어에 영문이 여러 개면 키 끝에 " (2)" 를 붙인다
     (예: 이름 안내문 vs 이름 오류 문구). 영문 값은 en.js 에 있고, 사전에 없는 키는
     한국어 원문이 그대로 나온다.
   · 영문 값의 \n 은 PC 에서만 줄을 바꾸고 모바일(1024 미만)은 자연 줄바꿈(.u-br-pc).
   · 스크립트에서 문구를 바꿀 때는 YBM_I18N.t("키") / YBM_I18N.setText(el, "키") 사용.
   사용: <head> 안, CSS 보다 먼저 (defer 없이)
         <script src="../i18n/en.js"></script>
         <script src="../i18n/i18n.js"></script>
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var q = /[?&]lang=(ko|en)\b/.exec(location.search);
  var lang = q ? q[1] : (root.getAttribute("lang") || "ko");
  root.setAttribute("lang", lang);                       // 렌더 전에 정해지므로 깜빡임이 없다

  var dict = lang === "en" ? (window.I18N_EN || {}) : {};

  // 사전에 없거나 한국어일 때는 키 끝의 " (2)" 를 뗀 한국어 원문을 돌려준다.
  function t(key) {
    return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : String(key).replace(/ \(\d+\)$/, "");
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* 요소 텍스트 교체 — \n 은 PC 전용 줄바꿈으로, [[강조]] 는 <em>(색 강조)으로 */
  function setText(el, key) {
    var v = t(key);
    if (v.indexOf("\n") > -1 || v.indexOf("[[") > -1) {
      el.innerHTML = esc(v).replace(/\n/g, ' <br class="u-br-pc">').replace(/\[\[(.+?)\]\]/g, "<em>$1</em>");
    } else el.textContent = v;
  }

  function apply(scope) {
    if (lang === "ko") return;                           // 한국어는 마크업 그대로
    scope = scope || document;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-i18n]"), function (el) {
      setText(el, el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-i18n-attr]"), function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i < 0) return;
        el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
      });
    });
  }

  window.YBM_I18N = { lang: lang, t: t, setText: setText, apply: apply };

  // 문서 파싱이 끝난 직후(= defer 화면 스크립트가 실행되기 전) 정적 문구를 먼저 바꾼다.
  // 이후 화면 스크립트가 바꾸는 문구는 스크립트가 직접 t()/setText() 로 처리한다.
  if (document.readyState === "loading") {
    document.addEventListener("readystatechange", function once() {
      if (document.readyState !== "loading") { document.removeEventListener("readystatechange", once); apply(); }
    });
  } else {
    apply();
  }
})();
