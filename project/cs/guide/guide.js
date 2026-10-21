/* ==========================================================================
   퍼블리싱 가이드 뷰어
   --------------------------------------------------------------------------
   프로젝트마다 고치는 파일은 config.js(설정)와 screens.js(화면 목록) 둘뿐이다.
   이 파일과 guide.css · index.html 은 그대로 복사해서 쓴다.

     왼쪽   프로젝트명 + 보기 설정(언어·기기) + 화면 목록
            PC    접기/펼치기 — 접으면 번호만 남는 레일 (상태는 저장된다)
            모바일 서랍 (☰ · dim · ESC · 화면 선택 시 자동으로 닫힘)
     오른쪽  상단바([이전] 현재 화면 [다음]) + 화면(iframe)
            키보드 ← → 로도 이동한다 (화면 안쪽에 포커스가 있을 때는 제외)
   ========================================================================== */
(function () {
  "use strict";

  /* ---- 설정 — config.js 가 없거나 항목이 빠져도 동작하도록 기본값을 둔다 ---- */
  var C = window.GUIDE_CONFIG || {};
  var CFG = {
    title: C.title || "퍼블리싱 가이드",
    storageKey: C.storageKey || "guide",
    lang: C.lang !== false,
    device: C.device !== false,
    deviceWidth: { pc: (C.deviceWidth && C.deviceWidth.pc) || 1024,
                   mo: (C.deviceWidth && C.deviceWidth.mo) || 360 },
    srcLabel: C.srcLabel === undefined ? "SB." : C.srcLabel,
    figmaFile: C.figmaFile || ""
  };

  var body = document.body;
  var menu = document.getElementById("g-menu");
  var frame = document.getElementById("g-frame");
  var stage = document.getElementById("g-stage");
  var empty = document.getElementById("g-empty");
  var content = document.getElementById("g-content");
  var nav = document.getElementById("g-nav");
  var scrim = document.getElementById("g-scrim");
  var navToggle = document.getElementById("g-nav-toggle");
  var navClose = document.getElementById("g-nav-close");
  var navCollapse = document.getElementById("g-nav-collapse");
  var view = document.getElementById("g-view");
  var projectTitle = document.getElementById("g-project-title");
  var barTitle = document.getElementById("g-bar-title");
  var barSb = document.getElementById("g-bar-sb");
  var barName = document.getElementById("g-bar-name");
  var prevBtn = document.getElementById("g-prev");
  var nextBtn = document.getElementById("g-next");

  // 주소의 해시 = 화면 id. 뒤에 "&c=코멘트id" 가 붙을 수 있다 (코멘트 링크 공유)
  function hashId() { return location.hash.slice(1).split("&")[0]; }

  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  function store(k, v) {
    var key = CFG.storageKey + "-" + k;
    try { if (v === undefined) return localStorage.getItem(key); localStorage.setItem(key, v); } catch (e) { return null; }
  }

  var mobile = window.matchMedia("(max-width: 767px)");
  function isMobile() { return mobile.matches; }

  document.title = CFG.title + " — 퍼블리싱 가이드";
  // MO 보기 폭은 config.deviceWidth.mo 를 따른다 (CSS 기본값 360)
  content.style.setProperty("--g-mo-width", CFG.deviceWidth.mo + "px");
  projectTitle.textContent = CFG.title;

  /* ---- 보기 설정 중 꺼진 것은 감춘다 ------------------------------------ */
  var langBox = document.querySelector(".g-lang");
  var deviceBox = document.querySelector(".g-device");
  if (!CFG.lang) langBox.hidden = true;
  if (!CFG.device) deviceBox.hidden = true;
  var shown = (CFG.lang ? 1 : 0) + (CFG.device ? 1 : 0);
  if (shown === 0) view.hidden = true;
  else if (shown === 1) view.setAttribute("data-cols", "1");

  /* ---- 목록 만들기 — 구현된 화면은 바로가기 hash, 아니면 sbN 을 id 로 ---- */
  var all = [];
  (window.GUIDE_SCREENS || []).forEach(function (g) {
    g.items.forEach(function (it) {
      it.id = it.hash || ("sb" + it.sb);
      all.push(it);
    });
  });
  menu.innerHTML = all.map(function (it) {
    var label = CFG.srcLabel + it.sb;
    return '<a class="g-item" href="#' + it.id + '" data-id="' + it.id + '" title="' + label + " " + it.name + '"' +
      ' data-status="' + (it.page ? "done" : "todo") + '" data-en="' + (it.en ? "true" : "false") + '">' +
      '<span class="g-item__sb">' + label + '</span><span class="g-item__name">' + it.name + '</span></a>';
  }).join("");

  // 이전/다음은 "퍼블리싱된 화면"끼리만 오간다 (예정 항목은 건너뛴다)
  function done() { return all.filter(function (i) { return i.page; }); }
  function srcOf(it) { return it.page + (lang === "en" ? "?lang=en" : "") + (it.hash ? "#" + it.hash : ""); }
  function openable(it) { return !!(it.page && (lang === "ko" || it.en)); }

  var current = null;

  function render(id) {
    // 퍼블리싱된 화면이 하나도 없는 초기에도 첫 화면(예정 카드)을 보여준다
    var it = all.filter(function (i) { return i.id === id; })[0] || all.filter(function (i) { return i.page; })[0] || all[0];
    if (!it) return;
    current = it;

    Array.prototype.forEach.call(menu.children, function (a) {
      if (a.getAttribute("data-id") === it.id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    if (openable(it)) {
      var src = srcOf(it);
      if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);   // 같은 파일이면 상태만 바뀐다
      frame.hidden = false; empty.hidden = true;
    } else {
      frame.hidden = true; empty.hidden = false;
      renderEmpty(it);
    }

    barSb.textContent = CFG.srcLabel + it.sb;
    barName.textContent = it.name;

    var list = done(), i = list.indexOf(it);
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i < 0 || i >= list.length - 1;

    store("screen", it.id);                        // 다음에 열면 보던 화면부터
    document.dispatchEvent(new CustomEvent("guide:render", { detail: { item: it } }));
    var link = menu.querySelector('[data-id="' + it.id + '"]');
    if (link && link.scrollIntoView) link.scrollIntoView({ block: "nearest" });
  }

  /* ---- 퍼블리싱 전 화면 — 이름 · 확인 포인트(notes) · 피그마 바로가기 ----------
     프로젝트 초기에는 화면이 대부분 '예정'이다. 그래도 기획·개발이 이 URL 하나로
     무엇을 만들지 보고 코멘트를 남길 수 있도록 screens.js 의 내용을 그대로 보여준다 */
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function figmaUrl(node) { return "https://www.figma.com/design/" + CFG.figmaFile + "/?node-id=" + node; }
  function renderEmpty(it) {
    if (it.page) { empty.innerHTML = '<p class="g-empty__title">' + esc(it.enNote || "영문 화면 없음 — 한국어 전용 화면입니다") + "</p>"; return; }
    var links = "";
    if (CFG.figmaFile && it.figma) links += '<a class="ds-btn" data-variant="neutralOutline" data-size="small" target="_blank" rel="noopener" href="' + figmaUrl(it.figma) + '">피그마 PC</a>';
    if (CFG.figmaFile && it.figmaMo) links += '<a class="ds-btn" data-variant="neutralOutline" data-size="small" target="_blank" rel="noopener" href="' + figmaUrl(it.figmaMo) + '">피그마 MO</a>';
    empty.innerHTML =
      '<div class="g-empty__box">' +
        '<span class="g-empty__badge">퍼블리싱 예정</span>' +
        '<p class="g-empty__title">' + esc(CFG.srcLabel + it.sb + " " + it.name) + "</p>" +
        (it.notes && it.notes.length ? '<ul class="g-empty__notes">' + it.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" : "") +
        (links ? '<div class="g-empty__links">' + links + "</div>" : "") +
      "</div>";
  }

  function go(step) {
    var list = done(), i = list.indexOf(current);
    var target = list[i + step];
    if (target) location.hash = target.id;
  }
  prevBtn.addEventListener("click", function () { go(-1); });
  nextBtn.addEventListener("click", function () { go(1); });
  // 키보드 ← → — 입력 중이거나 화면(iframe) 안에 포커스가 있을 때는 넘긴다
  document.addEventListener("keydown", function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
  });

  /* ---- 왼쪽 목록 — PC 접기/펼치기 --------------------------------------- */
  function setCollapsed(on) {
    body.setAttribute("data-nav-collapsed", String(on));
    navCollapse.setAttribute("aria-expanded", String(!on));
    navCollapse.querySelector(".ds-sr-only").textContent = on ? "화면 목록 펼치기" : "화면 목록 접기";
    store("nav-collapsed", on ? "1" : "0");
    fit();
  }
  navCollapse.addEventListener("click", function () {
    setCollapsed(body.getAttribute("data-nav-collapsed") !== "true");
  });
  setCollapsed(store("nav-collapsed") === "1");

  /* ---- 왼쪽 목록 — 모바일 서랍 ------------------------------------------ */
  function setNav(open) {
    body.setAttribute("data-nav", open ? "open" : "closed");
    navToggle.setAttribute("aria-expanded", String(open));
    if (open) nav.focus();
    else if (document.activeElement && nav.contains(document.activeElement)) navToggle.focus();
  }
  nav.setAttribute("tabindex", "-1");
  navToggle.addEventListener("click", function () { setNav(body.getAttribute("data-nav") !== "open"); });
  barTitle.addEventListener("click", function () { setNav(true); });
  navClose.addEventListener("click", function () { setNav(false); });
  scrim.addEventListener("click", function () { setNav(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && body.getAttribute("data-nav") === "open") setNav(false);
  });
  menu.addEventListener("click", function (e) { if (e.target.closest(".g-item") && isMobile()) setNav(false); });
  function onBreakpoint() { setNav(false); applyDevice(); }
  mobile.addEventListener ? mobile.addEventListener("change", onBreakpoint) : mobile.addListener(onBreakpoint);
  setNav(false);

  /* ---- 한국어 / 영문 — 화면(iframe)에 ?lang=en 을 붙여 연다 -------------- */
  var lang = "ko";
  function setLang(l) {
    lang = (CFG.lang && l === "en") ? "en" : "ko";
    body.setAttribute("data-lang", lang);
    $$(".g-lang .ds-segmented__item").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
    });
    store("lang", lang);
    render(hashId() || store("screen") || "");
  }
  langBox.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) setLang(b.getAttribute("data-lang"));
  });

  /* ---- PC / MO — iframe 폭만 바꾼다 (화면 안쪽은 자체 반응형) ------------ */
  function setDevice(d, remember) {
    content.setAttribute("data-device", d);
    $$(".g-device .ds-segmented__item").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-device") === d));
    });
    if (remember !== false) store("device", d);
    fit();
    document.dispatchEvent(new CustomEvent("guide:device", { detail: { device: d } }));
  }
  deviceBox.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b && !isMobile()) setDevice(b.getAttribute("data-device"));
  });
  // 모바일에서는 PC 화면을 볼 일이 없으므로 선택을 감추고 항상 MO.
  // 데스크톱으로 돌아오면 저장해 둔 값(기본 PC)으로 복귀한다
  function applyDevice() {
    if (!CFG.device) { setDevice("pc", false); return; }
    if (isMobile()) setDevice("mo", false);
    else setDevice(store("device") || "pc");
  }
  applyDevice();

  /* 보기 폭이 기준(config.deviceWidth)보다 좁으면 그 폭으로 그린 뒤 비율대로 축소한다 */
  function fit() {
    if (isMobile()) { frame.style.width = frame.style.height = frame.style.transform = ""; return; }
    var target = CFG.deviceWidth[content.getAttribute("data-device")] || CFG.deviceWidth.pc;
    var cw = stage.clientWidth, ch = stage.clientHeight;
    if (!cw || cw >= target) {
      frame.style.width = frame.style.height = frame.style.transform = "";
      return;
    }
    var k = cw / target;
    frame.style.width = target + "px";
    frame.style.height = (ch / k) + "px";
    frame.style.transform = "scale(" + k + ")";
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);

  window.addEventListener("hashchange", function () { render(hashId()); });

  /* ---- 다른 모듈(comments.js)이 쓰는 최소 API ------------------------- */
  window.GUIDE = {
    cfg: CFG,
    items: all,
    current: function () { return current; },
    device: function () { return content.getAttribute("data-device"); },
    frame: frame, stage: stage, content: content, menu: menu, empty: empty,
    isMobile: isMobile,
    fit: fit,
    store: store
  };
  setLang(CFG.lang ? (store("lang") || "ko") : "ko");
})();
