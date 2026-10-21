/* ==========================================================================
   SB.13~14 도움말 검색 결과 · 항목 펼침 · 만족도 평가
   --------------------------------------------------------------------------
   · 결과는 10개를 한 번에 보여주고, 그 이상이면 페이지네이션으로 넘긴다(펼쳐보기 없음)
   · 항목 10개 모두 누르면 제자리에서 열린다 — 답변 전문 + 이미지 + 만족도 평가
   · 만족도는 항목마다 한 벌 · 계정당 1회지만 다시 고를 수 있다
   바로가기: #sb13 · #sb14 · #sb14-image · #sb14-reason · #sb14-done
   ========================================================================== */
(function () {
  "use strict";

  var list = document.getElementById("result-list");
  var alertEl = document.getElementById("login-alert");
  var loading = CS.loadingDialog();

  CS.familySite();
  CS.searchBar({ onSubmit: function () { loading.open(); } });

  /* ---- 항목 펼치기 · 접기 ---------------------------------------------------- */
  function setOpen(item, open) {
    var btn = item.querySelector(".cs-result-item__q");
    if (!btn || (item.dataset.state === "open") === open) return;
    item.dataset.state = open ? "open" : "closed";
    btn.setAttribute("aria-expanded", String(open));
  }

  /* ---- 만족도 평가 (항목마다 한 벌) -----------------------------------------
     default 평가 전 / reason 아쉬워요 → 사유 선택 / result 평가 완료
     · 반대쪽을 누르면 바뀌고, 고른 쪽을 다시 누르면 평가 전으로 돌아간다 */
  function setFeedback(fb, state, picked) {
    if (state === "default") fb.dataset.chosen = "";
    else if (picked) fb.dataset.chosen = picked;
    var chosen = fb.dataset.chosen;

    fb.dataset.state = state;
    fb.querySelector(".cs-feedback__reason").hidden = state !== "reason";
    fb.querySelector(".cs-feedback__thanks").hidden = state !== "result";

    fb.querySelectorAll(".cs-feedback__btn").forEach(function (b) {
      var on = state !== "default" && b.dataset.value === chosen;
      b.setAttribute("aria-pressed", String(on));
    });
  }

  /* 리스트 한 곳에서 클릭을 모아 처리(이벤트 위임) — 항목이 몇 개든 동작한다 */
  list.addEventListener("click", function (e) {
    var fbBtn = e.target.closest(".cs-feedback__btn");
    if (fbBtn) {
      var fb = fbBtn.closest(".cs-feedback");
      var v = fbBtn.dataset.value;
      if (v === fb.dataset.chosen) { setFeedback(fb, "default"); return; }
      if (v === "no") {
        var r = fb.querySelector("input[type='radio']:checked");
        if (r) r.checked = false;
        setFeedback(fb, "reason", v);
      } else setFeedback(fb, "result", v);
      return;
    }
    if (e.target.closest(".cs-feedback__submit")) {
      var fb2 = e.target.closest(".cs-feedback");
      if (!fb2.querySelector("input[type='radio']:checked")) { YBM.snackbar("아쉬웠던 점을 선택해 주세요."); return; }
      setFeedback(fb2, "result", "no");
      return;
    }
    /* 건너뛰기 — 의견을 남기지 않았으므로 감사 문구 없이 평가 전으로 되돌린다 */
    if (e.target.closest(".cs-feedback__skip")) {
      var fb3 = e.target.closest(".cs-feedback");
      var r3 = fb3.querySelector("input[type='radio']:checked");
      if (r3) r3.checked = false;
      setFeedback(fb3, "default");
      return;
    }
    /* 행 전체가 열고 닫기 영역이다 — 질문 줄뿐 아니라 요약까지.
       펼친 답변 영역(이미지·만족도)과 그 안의 버튼·링크는 제외한다. */
    var item = e.target.closest(".cs-result-item");
    if (!item) return;
    if (e.target.closest(".cs-result-item__a")) return;
    if (e.target.closest("a, button:not(.cs-result-item__q)")) return;
    setOpen(item, item.dataset.state !== "open");
  });

  /* ---- 문의하기 → 로그인 안내 팝업 ------------------------------------------- */
  document.getElementById("inquiry-btn").addEventListener("click", function () { alertEl.showModal(); });
  alertEl.addEventListener("click", function (e) {
    if (e.target.closest("[data-ds-close]")) alertEl.close();
  });
  document.getElementById("login-confirm").addEventListener("click", function () {
    alertEl.close();
    YBM.snackbar("로그인 화면으로 이동하는 자리입니다.");
  });

  /* 상태 바로가기 — #sb14* 는 첫 항목을 펼쳐 만족도 상태를 보여 준다 */
  function applyHash() {
    var h = location.hash;
    setOpen(list.children[0], h.indexOf("#sb14") === 0);

    var fb = list.children[0].querySelector(".cs-feedback");
    if (fb) {
      if (h === "#sb14-reason") setFeedback(fb, "reason", "no");
      else if (h === "#sb14-done") setFeedback(fb, "result", "no");
      else setFeedback(fb, "default");
    }
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
