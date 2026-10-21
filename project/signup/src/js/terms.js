/* ==========================================================================
   회원가입 > 약관동의 (SB.3)
   · 전체 동의 ↔ 개별 약관 연동 (영문에서 숨긴 항목은 계산에서 제외)
   · 필수 약관이 모두 체크되면 [다음] 활성
   · [다음] → 본인인증(identity.html). '실명 인증된 아이디로 가입' 체크 시 ?real=1 로 전달
   · 헤더 English / Korean 버튼 → 같은 화면을 다른 언어로 (?lang=)
   ========================================================================== */
(function () {
  "use strict";

  var I18N = window.YBM_I18N || { lang: "ko" };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var form = document.getElementById("terms-form");
  var all = document.getElementById("agree-all");
  var cta = document.getElementById("cta");
  var realName = document.getElementById("term-real-name");

  // 화면에 보이는 약관만 (영문은 data-ko-only 항목 제외)
  function items() {
    return $$('input[name="terms"]').filter(function (el) { return !(I18N.lang === "en" && el.closest("[data-ko-only]")); });
  }

  function sync() {
    var list = items();
    all.checked = list.length > 0 && list.every(function (el) { return el.checked; });
    cta.disabled = !list.filter(function (el) { return el.hasAttribute("data-required"); })
                        .every(function (el) { return el.checked; });
  }

  all.addEventListener("change", function () {
    items().forEach(function (el) { el.checked = all.checked; });
    sync();
  });
  $$('input[name="terms"]').forEach(function (el) { el.addEventListener("change", sync); });

  // ★ 약관 전문 보기 — 화면이 아직 없어 이동 지점만 표시한다
  $$(".signup-terms__view").forEach(function (b) {
    b.addEventListener("click", function () { YBM.snackbar("약관 전문 보기: " + b.getAttribute("data-term")); });
  });

  // 다음 → 본인인증. 언어와 실명인증 선택값을 넘긴다
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (cta.disabled) return;
    var q = [];
    if (I18N.lang === "en") q.push("lang=en");
    if (I18N.lang !== "en" && realName.checked) q.push("real=1");
    location.href = "identity.html" + (q.length ? "?" + q.join("&") : "");
  });

  // English ↔ Korean
  document.getElementById("lang-switch").addEventListener("click", function () {
    var next = I18N.lang === "en" ? "ko" : "en";
    location.search = next === "en" ? "?lang=en" : "";
  });
  if (I18N.lang === "en") document.getElementById("lang-switch").setAttribute("lang", "ko");

  // 바로가기 해시 — #sb3 기본(모두 미동의) · #sb3-agreed 필수만 동의 (가이드 뷰어 전용)
  function applyHash() {
    var agreed = location.hash === "#sb3-agreed";
    $$('input[name="terms"]').forEach(function (el) { el.checked = agreed && el.hasAttribute("data-required"); });
    sync();
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
