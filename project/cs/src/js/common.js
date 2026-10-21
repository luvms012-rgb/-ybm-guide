/* ==========================================================================
   고객센터 공통 스크립트
   --------------------------------------------------------------------------
   여러 화면이 같은 컴포넌트(검색바·서비스 선택 레이어·추천키워드·검색 로딩·
   푸터 패밀리 사이트)를 쓰므로 동작도 여기 한 벌만 둔다.
   화면별 스크립트(main.js · search.js · faq.js …)는 이 함수들을 부르고,
   그 화면에만 있는 동작만 직접 쓴다.

     CS.searchBar({ onSubmit, onCategory })  검색바 — 2자 미만 안내 · 지우기 버튼
     CS.searchPanel({ onSelect })            서비스 선택 레이어 (SB.9) — 마크업까지 만든다
     CS.keywordsRolling(onClick)             모바일 추천키워드 한 줄
     CS.loadingDialog()                      검색 로딩 다이얼로그 — 콘텐츠 위에 띄운다
     CS.familySite()                         푸터 패밀리 사이트 드롭업
     CS.topButton()                          위로 버튼 — link 하면 자동 생성

   · 서비스 선택 레이어와 로딩 다이얼로그는 화면마다 마크업을 베끼지 않도록
     여기서 만들어 붙인다. 검색창에 서비스 셀렉트(#search-category)가 있는
     화면이면 패널이 자동으로 생긴다.
   · 필요한 요소가 없는 화면에서는 아무 일도 하지 않는다(안전하게 건너뛴다).
   ========================================================================== */
window.CS = (function () {
  "use strict";

  /* 검색 카테고리 — 실제로는 서버가 내려준다 (Figma CS/Search Category Panel 15개) */
  var SERVICES = ["회원정보", "YBM머니", "인강", "TOEIC", "TOEIC Speaking", "JPT", "SJPT", "TSC",
                  "TOEFL ITP", "TOEIC Bridge", "MOS", "COS", "IT", "학원", "출판"];

  function $(id) { return document.getElementById(id); }

  /* ---- 검색바 ---------------------------------------------------------------
     반환값으로 setHint/sync 를 돌려주어 화면 쪽에서도 상태를 바꿀 수 있게 한다. */
  function searchBar(opts) {
    opts = opts || {};
    var form = $("search-form");
    var input = $("search-input");
    var hint = $("search-hint");
    var clearBtn = $("search-clear");
    var category = $("search-category");
    if (!form || !input) return null;

    function setHint(on) { if (hint) hint.hidden = !on; }
    /* 지우기 버튼은 입력값이 있을 때만 (Figma CS/Search Bar `지우기 버튼`) */
    function sync() { if (clearBtn) clearBtn.hidden = input.value.length === 0; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q.length < 2) { setHint(true); input.focus(); return; }
      setHint(false);
      if (opts.onSubmit) opts.onSubmit(q);
    });

    /* 두 글자를 채우면 안내를 거둔다 */
    input.addEventListener("input", function () {
      if (input.value.trim().length >= 2) setHint(false);
      sync();
    });

    if (clearBtn) clearBtn.addEventListener("click", function () {
      input.value = "";
      setHint(false);
      sync();
      input.focus();
    });

    if (category && opts.onCategory) category.addEventListener("click", opts.onCategory);

    sync();
    return { input: input, setHint: setHint, sync: sync };
  }

  /* ---- 서비스 선택 레이어 (SB.9) ---------------------------------------------
     검색창 자리를 덮으며 열린다. 바깥 클릭·ESC 로 닫히고, 칩을 고르면
     검색창의 서비스명이 바뀐다. 검색창 표기(TOEIC)와 칩 이름(토익)이 다를 수
     있어 data-service 값으로 잇는다. */
  function searchPanel(opts) {
    opts = opts || {};
    var box = document.querySelector(".cs-hero__searchbox");
    var btn = $("search-category");
    var label = $("search-category-label");
    if (!box || !btn || !label) return null;      /* 서비스 셀렉트가 없는 화면은 건너뛴다 */

    var panel = document.createElement("div");
    panel.className = "cs-search-panel";
    panel.id = "search-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "검색할 서비스 선택");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="cs-search-panel__search">' +
        '<input class="cs-search-panel__input" type="search" id="panel-input" placeholder="궁금한 점을 검색해 보세요." aria-label="검색어">' +
        '<button type="button" class="cs-search-panel__submit" id="panel-submit">' +
          '<i class="ds-icon ds-icon--search" aria-hidden="true"></i><span class="ds-sr-only">검색</span>' +
        '</button>' +
      '</div>' +
      '<div class="cs-search-panel__chips">' +
        SERVICES.map(function (s) {
          return '<button type="button" class="ds-chip" data-size="large" aria-pressed="false">' + s + '</button>';
        }).join("") +
      '</div>';
    box.appendChild(panel);

    var panelInput = panel.querySelector("#panel-input");
    var chips = panel.querySelector(".cs-search-panel__chips");
    var searchInput = $("search-input");

    function isOpen() { return !panel.hidden; }

    function open(on) {
      panel.hidden = !on;
      btn.setAttribute("aria-expanded", String(on));
      if (!on) return;
      var current = label.dataset.service || label.textContent.trim();
      Array.prototype.forEach.call(chips.children, function (chip) {
        chip.setAttribute("aria-pressed", String(chip.textContent.trim() === current));
      });
      panelInput.value = searchInput ? searchInput.value : "";
      panelInput.focus();
    }

    chips.addEventListener("click", function (e) {
      var chip = e.target.closest(".ds-chip");
      if (!chip) return;
      var name = chip.textContent.trim();
      label.textContent = name;
      label.dataset.service = name;
      open(false);
      if (opts.onSelect) opts.onSelect(name);
      if (searchInput) searchInput.focus();
    });

    panel.querySelector("#panel-submit").addEventListener("click", function () {
      if (searchInput) searchInput.value = panelInput.value;
      open(false);
      if (opts.onSubmit) opts.onSubmit(panelInput.value.trim());
    });

    btn.addEventListener("click", function (e) { e.stopPropagation(); open(!isOpen()); });
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", function () { if (isOpen()) open(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) { open(false); btn.focus(); }
    });

    return { open: open, isOpen: isOpen };
  }

  /* ---- 검색 로딩 다이얼로그 ---------------------------------------------------
     결과 목록처럼 이미 내용이 있는 화면에서도 쓸 수 있는 단순한 형태.
     화면 전체를 비우는 SB.9 로딩 블록(.cs-loading)과 내용은 같다. */
  function loadingDialog() {
    var dlg = document.createElement("dialog");
    dlg.className = "ds-dialog cs-loading-dialog";
    dlg.id = "loading-dialog";
    dlg.setAttribute("aria-label", "검색 중");
    dlg.innerHTML =
      '<span class="ds-progress-circle" data-size="40" data-tone="brand" data-type="indeterminate" role="progressbar" aria-label="검색 중">' +
        '<svg viewBox="0 0 40 40" aria-hidden="true">' +
          '<defs><linearGradient id="cs-progress-gradient-dialog" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="40">' +
            '<stop offset="0%" style="stop-color:var(--cs-gradient-brand-start)"></stop>' +
            '<stop offset="100%" style="stop-color:var(--cs-gradient-glow-end)"></stop>' +
          '</linearGradient></defs>' +
          '<circle class="ds-progress-circle__track" pathLength="100"></circle>' +
          '<circle class="ds-progress-circle__range" pathLength="100"></circle>' +
        '</svg>' +
      '</span>' +
      '<div class="cs-loading-dialog__text">' +
        '<p class="cs-loading-dialog__title">AI가 답변을 찾고 있습니다</p>' +
        '<p class="cs-loading-dialog__desc">관련 FAQ를 분석 중입니다.</p>' +
      '</div>';
    document.body.appendChild(dlg);
    return {
      el: dlg,
      open: function () { if (!dlg.open) dlg.showModal(); },
      close: function () { if (dlg.open) dlg.close(); }
    };
  }

  /* ---- 모바일 추천키워드 한 줄 ---------------------------------------------- */
  function keywordsRolling(onClick) {
    var el = $("keywords-rolling");
    if (!el) return;
    el.addEventListener("click", onClick || function () {
      YBM.snackbar("인기키워드 전체를 펼치는 자리입니다. (모바일)");
    });
  }

  /* ---- 패밀리 사이트 — 위로 열리는 목록 -------------------------------------- */
  function familySite() {
    var btn = $("family-site");
    var menu = $("family-menu");
    if (!btn || !menu) return;

    function open(on) {
      btn.setAttribute("aria-expanded", String(on));
      menu.hidden = !on;
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      open(btn.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      var item = e.target.closest("a");
      if (!item) return;
      e.preventDefault();
      open(false);
      btn.focus();
      YBM.snackbar(item.textContent + " 로 이동하는 자리입니다.");
    });
    document.addEventListener("click", function (e) {
      if (menu.hidden) return;
      if (!menu.contains(e.target) && e.target !== btn) open(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { open(false); btn.focus(); }
    });
  }

  /* ---- 위로 버튼 — 전 페이지 공통(PC·태블릿), 우하단 고정 ---------------------- */
  function topButton() {
    if (document.querySelector(".cs-top")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cs-top";
    b.setAttribute("aria-label", "\uB9E8 \uC704\uB85C");
    b.innerHTML = '<i class="ds-icon ds-icon--arrow-up" aria-hidden="true"></i>';
    b.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(b);

    /* 화면 맨 위에서는 숨기고, 400 이상 내렸을 때 나타낸다 */
    var SHOW_AT = 400;
    function sync() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      b.dataset.visible = y > SHOW_AT ? "true" : "false";
    }
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    sync();
  }

  return {
    services: SERVICES,
    searchBar: searchBar,
    searchPanel: searchPanel,
    loadingDialog: loadingDialog,
    keywordsRolling: keywordsRolling,
    familySite: familySite,
    topButton: topButton
  };
})();

/* 위로 버튼은 모든 화면에 공통으로 둔다 (common.js 를 link 하면 자동 생성) */
if (window.CS && CS.topButton) CS.topButton();
