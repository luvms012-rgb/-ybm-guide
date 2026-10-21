/* ==========================================================================
   가이드 뷰어 — 코멘트 (피그마식 위치 코멘트 · 비로그인)
   --------------------------------------------------------------------------
   기획·개발·디자인이 로그인 없이 화면의 특정 위치에 코멘트를 남긴다.

     하단 도구막대   [코멘트 n] [화면 정보]   — 단축키 C 로 코멘트 모드 전환
     코멘트 모드     화면을 누르면 그 위치에 핀 + 작성창. 오른쪽 패널에 목록
                    (모바일은 아래에서 올라오는 시트)
     핀 위치        누른 요소(selector) + 요소 안 비율로 저장한다 → PC/MO 폭이 바뀌거나
                    레이아웃이 움직여도 같은 요소를 따라간다. 요소를 못 찾으면 같은 기기
                    보기일 때만 저장한 좌표로 보여준다.
     상태 단위      화면 파일 + 해시(상태 바로가기)마다 따로 모인다
                    예) src/pages/main.html#sb6  /  src/pages/main.html#sb9-panel
     링크 공유      코멘트마다 [링크 복사] → 가이드주소#화면id&c=코멘트id

   저장소 — config.js 의 comments 설정
     endpoint 가 있으면 Google Apps Script(구글 시트) 에 저장 → 모두가 같이 본다
     없으면 이 브라우저(localStorage)에만 저장 — 혼자 테스트용
   이 파일과 comments.css 는 프로젝트와 무관하게 그대로 복사해서 쓴다.
   ========================================================================== */
(function () {
  "use strict";

  var G = window.GUIDE;
  var CC = (window.GUIDE_CONFIG || {}).comments;
  if (!G || CC === false) return;
  CC = CC || {};

  var PROJECT = CC.project || G.cfg.storageKey;
  var ENDPOINT = (CC.endpoint || "").trim();
  var KEY = CC.key || "";
  var POLL = Math.max(5000, CC.poll || 15000);

  var ROLES = [
    { id: "plan", label: "기획" },
    { id: "dev", label: "개발" },
    { id: "design", label: "디자인" },
    { id: "etc", label: "기타" }
  ];
  function roleLabel(id) { for (var i = 0; i < ROLES.length; i++) if (ROLES[i].id === id) return ROLES[i].label; return "기타"; }

  var body = document.body;
  var frame = G.frame, stage = G.stage, content = G.content;

  /* ---- 유틸 ------------------------------------------------------------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function richText(t) {
    return esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");
  }
  function ago(iso) {
    var t = new Date(iso).getTime(); if (!t) return "";
    var s = (Date.now() - t) / 1000;
    if (s < 60) return "방금";
    if (s < 3600) return Math.floor(s / 60) + "분 전";
    if (s < 86400) return Math.floor(s / 3600) + "시간 전";
    var d = new Date(t), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return (d.getMonth() + 1) + "." + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function store(k, v) { return G.store("cmt-" + k, v); }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  var ICON_MSG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';

  /* ---- 나 (비로그인 — 이 브라우저를 구분하는 임의 id + 이름) -------------- */
  var me = { cid: store("cid"), name: store("name") || "", role: store("role") || "plan" };
  if (!me.cid) { me.cid = uid(); store("cid", me.cid); }

  /* ======================================================================
     저장소
     ====================================================================== */
  var LOCAL_KEY = G.cfg.storageKey + "-cmt-items";
  function readLocal() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch (e) { return []; } }
  function writeLocal(a) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(a)); } catch (e) { /* 용량 초과 등 */ } }
  function guard(item, cid, field) {
    if (field === "text" && item.cid !== cid) throw new Error("본인이 남긴 코멘트만 고칠 수 있어요");
    if (field === "remove" && item.cid !== cid) throw new Error("본인이 남긴 코멘트만 삭제할 수 있어요");
  }

  var Local = {
    shared: false,
    list: function () { return Promise.resolve(readLocal().filter(function (i) { return i.project === PROJECT && !i.deleted; })); },
    add: function (c) { var a = readLocal(); a.push(c); writeLocal(a); return Promise.resolve(c); },
    update: function (id, patch) {
      return new Promise(function (ok) {
        var a = readLocal();
        a.forEach(function (i) {
          if (i.id !== id) return;
          if ("text" in patch) guard(i, me.cid, "text");
          for (var k in patch) i[k] = patch[k];
          i.up = new Date().toISOString();
        });
        writeLocal(a); ok();
      });
    },
    remove: function (id) {
      return new Promise(function (ok) {
        var a = readLocal();
        a.forEach(function (i) { if (i.id === id || i.parent === id) { if (i.id === id) guard(i, me.cid, "remove"); i.deleted = 1; } });
        writeLocal(a); ok();
      });
    }
  };

  // Google Apps Script 웹앱 — POST 는 text/plain 으로 보내 CORS 사전 요청을 피한다
  var Remote = {
    shared: true,
    list: function () {
      var url = ENDPOINT + (ENDPOINT.indexOf("?") < 0 ? "?" : "&") +
        "project=" + encodeURIComponent(PROJECT) + "&key=" + encodeURIComponent(KEY) + "&t=" + Date.now();
      return fetch(url, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
        if (!d || !d.ok) throw new Error((d && d.error) || "불러오기 실패");
        return d.items || [];
      });
    },
    send: function (payload) {
      payload.project = PROJECT; payload.key = KEY; payload.cid = me.cid;
      return fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (!d || !d.ok) throw new Error((d && d.error) || "저장 실패"); return d; });
    },
    add: function (c) { return Remote.send({ action: "add", item: c }); },
    update: function (id, patch) { return Remote.send({ action: "update", id: id, patch: patch }); },
    remove: function (id) { return Remote.send({ action: "remove", id: id }); }
  };
  var DB = ENDPOINT ? Remote : Local;

  /* ======================================================================
     상태
     ====================================================================== */
  var items = [];           // 이 프로젝트의 모든 코멘트(삭제 제외)
  var sig = "";             // 목록 변경 감지용
  var mode = "";            // "" | "comments" | "info"
  var showResolved = false;
  var selected = null;      // 선택된 스레드 id
  var draft = null;         // 작성 중인 새 코멘트 {anchor..}
  var layer = null;         // iframe 안 핀 레이어
  var loadError = "";

  function roots() { return items.filter(function (i) { return !i.parent; }); }
  function repliesOf(id) { return items.filter(function (i) { return i.parent === id; }).sort(byTime); }
  function byTime(a, b) { return (a.at || "").localeCompare(b.at || ""); }
  function find(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }

  /* 현재 화면의 "상태 키" = 프로젝트 폴더 기준 파일 경로 + 해시
     퍼블리싱 전 화면은 screen:{화면 id} */
  function projectRoot() { return location.pathname.replace(/[^/]*$/, "").replace(/[^/]+\/$/, ""); }
  function stateKey() {
    var it = G.current(); if (!it) return "";
    if (!it.page || frame.hidden) return "screen:" + it.id;
    try {
      var loc = frame.contentWindow.location, path = decodeURIComponent(loc.pathname), root = decodeURIComponent(projectRoot());
      if (loc.href === "about:blank") throw 0;
      return (path.indexOf(root) === 0 ? path.slice(root.length) : path) + (loc.hash || "");
    } catch (e) {
      return it.page.replace(/^(\.\.\/)+/, "") + (it.hash ? "#" + it.hash : "");
    }
  }
  // 상태 키 → 가이드 화면 id (목록 배지용). 같은 파일·해시인 항목이 없으면 지금 화면
  function screenOfState(key) {
    if (key.indexOf("screen:") === 0) return key.slice(7);
    for (var i = 0; i < G.items.length; i++) {
      var it = G.items[i];
      if (it.page && it.page.replace(/^(\.\.\/)+/, "") + (it.hash ? "#" + it.hash : "") === key) return it.id;
    }
    return G.current() ? G.current().id : "";
  }
  function threadsHere() {
    var k = stateKey();
    return roots().filter(function (c) { return c.state === k; }).sort(byTime);
  }

  /* ======================================================================
     화면(iframe) 안 핀 레이어 — Shadow DOM 이라 화면 CSS 와 섞이지 않는다
     ====================================================================== */
  var PIN_CSS =
    ":host{all:initial}" +
    ".pins{position:absolute;left:0;top:0}" +
    ".pin{--c:var(--ybm-color-bg-magic-solid,#8969ea);position:absolute;display:grid;place-items:center;min-width:28px;height:28px;padding:0 6px;box-sizing:border-box;" +
    "border:2px solid #fff;border-radius:14px 14px 14px 2px;background:var(--c);color:#fff;font:600 13px/1 Pretendard,system-ui,sans-serif;cursor:pointer;" +
    "box-shadow:0 2px 8px rgba(0,0,0,.25);transform-origin:0 100%;transform:translateY(-100%) scale(var(--inv,1));transition:transform .15s}" +
    ".pin:hover{transform:translateY(-100%) scale(calc(var(--inv,1)*1.12))}" +
    ".pin[data-role=dev]{--c:var(--ybm-color-bg-informative-solid,#1d6ef0)}" +
    ".pin[data-role=design]{--c:var(--ybm-color-bg-positive-solid,#16a34a)}" +
    ".pin[data-role=etc]{--c:var(--ybm-color-bg-neutral-solid,#222)}" +
    ".pin[data-status=resolved]{--c:#9aa0a6;opacity:.85}" +
    ".pin[aria-current=true]{box-shadow:0 0 0 3px var(--c),0 4px 12px rgba(0,0,0,.3);z-index:2}" +
    ".pin[data-draft]{--c:var(--ybm-color-bg-neutral-solid,#222);animation:pop .2s}" +
    "@keyframes pop{from{transform:translateY(-100%) scale(0)}}" +
    ".hover{position:absolute;pointer-events:none;outline:2px solid rgba(137,105,234,.9);outline-offset:-1px;background:rgba(137,105,234,.06);border-radius:4px}" +
    ".hover[hidden]{display:none}";

  function frameDoc() { try { var d = frame.contentDocument; return d && d.documentElement && frame.contentWindow.location.href !== "about:blank" ? d : null; } catch (e) { return null; } }
  function frameScale() { var w = frame.offsetWidth; return w ? frame.getBoundingClientRect().width / w : 1; }

  function detach() {
    if (!layer) return;
    try { layer.off(); layer.host.remove(); } catch (e) { /* 이미 사라진 문서 */ }
    layer = null;
  }

  function attach() {
    detach();
    var doc = frameDoc(); if (!doc) return;
    var win = doc.defaultView;
    var host = doc.createElement("guide-comment-layer");
    host.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:2147483600;";
    var root = host.attachShadow({ mode: "open" });
    root.innerHTML = "<style>" + PIN_CSS + '</style><div class="hover" hidden></div><div class="pins"></div>';
    doc.documentElement.appendChild(host);
    layer = { doc: doc, win: win, host: host, root: root, pins: root.querySelector(".pins"), hover: root.querySelector(".hover") };

    function inLayer(e) { return e.composedPath && e.composedPath().indexOf(host) > -1; }
    function block(e) { if (mode === "comments" && !inLayer(e)) { e.preventDefault(); e.stopImmediatePropagation(); } }
    function hideHover() { if (layer) layer.hover.hidden = true; }
    function onMove(e) {
      if (mode !== "comments" || inLayer(e) || draft) { layer.hover.hidden = true; return; }
      var t = e.target; if (!t || t === doc.documentElement || t === doc.body) { layer.hover.hidden = true; return; }
      var r = t.getBoundingClientRect();
      layer.hover.style.cssText = "left:" + (r.left + win.scrollX) + "px;top:" + (r.top + win.scrollY) + "px;width:" + r.width + "px;height:" + r.height + "px";
      layer.hover.hidden = false;
    }
    function onClick(e) {
      if (mode !== "comments") return;
      if (inLayer(e)) {                                  // 핀 클릭
        var pin = e.composedPath()[0].closest && e.composedPath()[0].closest(".pin");
        if (pin && !pin.hasAttribute("data-draft")) { e.preventDefault(); select(pin.getAttribute("data-id")); }
        return;
      }
      e.preventDefault(); e.stopImmediatePropagation();
      startDraft(anchorFrom(e));
    }
    var evs = ["pointerdown", "mousedown", "pointerup", "mouseup", "dblclick", "contextmenu", "submit"];
    evs.forEach(function (t) { doc.addEventListener(t, block, true); });
    doc.addEventListener("click", onClick, true);
    doc.addEventListener("pointermove", onMove, true);
    doc.addEventListener("keydown", onKey, true);
    win.addEventListener("scroll", schedule, { passive: true });
    win.addEventListener("resize", schedule);
    win.addEventListener("hashchange", onFrameState);
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) if (!host.contains(list[i].target) && list[i].target !== host) { schedule(); return; }
    });
    mo.observe(doc.body || doc.documentElement, { subtree: true, childList: true, attributes: true, characterData: false });
    doc.addEventListener("transitionend", schedule, true);
    doc.documentElement.addEventListener("mouseleave", hideHover);
    win.addEventListener("resize", hideHover);
    layer.off = function () {
      evs.forEach(function (t) { doc.removeEventListener(t, block, true); });
      doc.removeEventListener("click", onClick, true);
      doc.removeEventListener("pointermove", onMove, true);
      doc.removeEventListener("keydown", onKey, true);
      win.removeEventListener("scroll", schedule);
      win.removeEventListener("resize", schedule);
      win.removeEventListener("hashchange", onFrameState);
      doc.removeEventListener("transitionend", schedule, true);
      doc.documentElement.removeEventListener("mouseleave", hideHover);
      win.removeEventListener("resize", hideHover);
      mo.disconnect();
    };
    body.setAttribute("data-gc-frame", "ok");
    paintHint();
    renderAll();
  }

  /* 누른 위치 → 앵커(요소 selector + 요소 안 비율 + 문서 좌표) */
  function selectorOf(node, doc) {
    var esc2 = (doc.defaultView.CSS && doc.defaultView.CSS.escape) || function (s) { return s.replace(/[^\w-]/g, "\\$&"); };
    var parts = [];
    while (node && node.nodeType === 1 && node !== doc.documentElement) {
      if (node.id && doc.querySelectorAll("#" + esc2(node.id)).length === 1) { parts.unshift("#" + esc2(node.id)); break; }
      var tag = node.tagName.toLowerCase(), p = node.parentElement;
      if (!p) { parts.unshift(tag); break; }
      var same = Array.prototype.filter.call(p.children, function (c) { return c.tagName === node.tagName; });
      parts.unshift(same.length > 1 ? tag + ":nth-of-type(" + (same.indexOf(node) + 1) + ")" : tag);
      node = p;
    }
    return parts.join(" > ");
  }
  function anchorFrom(e) {
    var doc = layer.doc, win = layer.win, t = e.target;
    if (t === doc.documentElement) t = doc.body;
    var r = t.getBoundingClientRect();
    return {
      sel: selectorOf(t, doc),
      ox: r.width ? +((e.clientX - r.left) / r.width).toFixed(4) : 0,
      oy: r.height ? +((e.clientY - r.top) / r.height).toFixed(4) : 0,
      x: Math.round(e.clientX + win.scrollX), y: Math.round(e.clientY + win.scrollY),
      vw: doc.documentElement.clientWidth
    };
  }
  /* 앵커 → 지금 문서 좌표. 요소가 있지만 안 보이면(닫힌 팝업 등) null */
  function place(c) {
    if (!layer || !c.sel && c.x == null) return null;
    var doc = layer.doc, win = layer.win, node = null;
    if (c.sel) { try { node = doc.querySelector(c.sel); } catch (e) { node = null; } }
    if (node) {
      var r = node.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      if (win.getComputedStyle(node).visibility === "hidden") return null;
      return { x: Math.round(r.left + (+c.ox || 0) * r.width + win.scrollX), y: Math.round(r.top + (+c.oy || 0) * r.height + win.scrollY) };
    }
    if (c.device === G.device() && c.x != null && c.x !== "") return { x: +c.x, y: +c.y };
    return null;
  }

  var raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; renderPins(); placeComposer(); }); }

  function renderPins() {
    if (!layer) return;
    var on = mode === "comments";
    layer.host.style.display = on ? "" : "none";
    if (!on) return;
    var inv = (1 / frameScale()).toFixed(3);
    var html = "";
    threadsHere().forEach(function (c, i) {
      c._n = i + 1;
      if (c.status === "resolved" && !showResolved && c.id !== selected) { c._placed = !!place(c); return; }
      var p = place(c); c._placed = !!p;
      if (!p) return;
      html += '<button type="button" class="pin" data-id="' + esc(c.id) + '" data-role="' + esc(c.role) + '" data-status="' + esc(c.status) + '"' +
        (c.id === selected ? ' aria-current="true"' : "") + ' style="left:' + p.x + "px;top:" + p.y + "px;--inv:" + inv + '" title="' + esc(c.author + ": " + c.text.slice(0, 60)) + '">' + (i + 1) + "</button>";
    });
    if (draft && draft.anchor) {
      var dp = place(draft.anchor);
      if (dp) html += '<span class="pin" data-draft style="left:' + dp.x + "px;top:" + dp.y + "px;--inv:" + inv + '">+</span>';
    }
    if (layer.last !== html) { layer.last = html; layer.pins.innerHTML = html; }   // 바뀔 때만 다시 그린다
  }

  function onFrameState() { draftCancel(); renderAll(); }

  /* ======================================================================
     뷰어 쪽 UI — 하단 도구막대 · 패널(목록/화면 정보) · 작성창 · 토스트
     ====================================================================== */
  var bar = el(
    '<div class="gc-bar" role="toolbar" aria-label="코멘트">' +
      '<button type="button" class="gc-bar__btn" data-mode="comments" aria-pressed="false" title="코멘트 (C)">' + ICON_MSG +
        '<span>코멘트</span><span class="gc-count" hidden></span></button>' +
      '<button type="button" class="gc-bar__btn" data-mode="info" aria-pressed="false" title="화면 정보">' +
        '<i class="ds-icon ds-icon--info" aria-hidden="true"></i><span>화면 정보</span></button>' +
    "</div>");
  var hint = el('<div class="gc-hint" hidden>화면에서 코멘트를 남길 위치를 누르세요 · <kbd>Esc</kbd> 종료</div>');
  stage.appendChild(bar);
  stage.appendChild(hint);

  var panel = el(
    '<aside class="gc-panel" id="gc-panel" aria-label="코멘트 패널" hidden>' +
      '<div class="gc-panel__head">' +
        '<div class="ds-segmented gc-tabs" data-layout="fill" role="group" aria-label="패널 보기">' +
          '<button type="button" class="ds-segmented__item" data-tab="comments" aria-pressed="true">코멘트</button>' +
          '<button type="button" class="ds-segmented__item" data-tab="info" aria-pressed="false">화면 정보</button>' +
        "</div>" +
        '<button type="button" class="g-icon-btn gc-close"><i class="ds-icon ds-icon--x ds-icon--lg" aria-hidden="true"></i><span class="ds-sr-only">패널 닫기</span></button>' +
      "</div>" +
      '<div class="gc-panel__body"></div>' +
      '<div class="gc-panel__foot"></div>' +
    "</aside>");
  content.appendChild(panel);
  var pbody = panel.querySelector(".gc-panel__body");
  var pfoot = panel.querySelector(".gc-panel__foot");

  var composer = el(
    '<form class="gc-composer" hidden>' +
      '<div class="gc-composer__who">' +
        '<input class="gc-name" name="name" maxlength="20" placeholder="이름" autocomplete="name" aria-label="이름">' +
        '<div class="gc-roles" role="radiogroup" aria-label="역할">' +
          ROLES.map(function (r) { return '<button type="button" class="gc-role" data-role="' + r.id + '" role="radio" aria-checked="false">' + r.label + "</button>"; }).join("") +
        "</div>" +
      "</div>" +
      '<textarea class="ds-textarea gc-text" data-size="medium" name="text" rows="3" maxlength="2000" placeholder="코멘트를 입력하세요 (Ctrl+Enter 등록)"></textarea>' +
      '<div class="gc-composer__actions">' +
        '<span class="gc-composer__where"></span>' +
        '<button type="button" class="ds-btn gc-cancel" data-variant="ghost" data-size="small">취소</button>' +
        '<button type="submit" class="ds-btn" data-variant="neutralSolid" data-size="small">등록</button>' +
      "</div>" +
    "</form>");
  stage.appendChild(composer);
  var toast = el('<div class="gc-toast" role="status" aria-live="polite" hidden></div>');
  body.appendChild(toast);

  var toastTimer = 0;
  function say(msg, bad) {
    toast.textContent = msg; toast.hidden = false; toast.setAttribute("data-bad", bad ? "true" : "false");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  /* ---- 모드 ------------------------------------------------------------- */
  // 안내 띠 — 핀을 찍을 수 있는 상태에서만 (file:// 로 연 화면에서는 감춘다)
  function paintHint() { hint.hidden = mode !== "comments" || !!draft || (!layer && !frame.hidden); }
  function setMode(m) {
    mode = m || "";
    body.setAttribute("data-gc", mode || "off");
    panel.hidden = !mode;
    Array.prototype.forEach.call(bar.querySelectorAll("[data-mode]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === mode)); });
    Array.prototype.forEach.call(panel.querySelectorAll("[data-tab]"), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tab") === mode)); });
    paintHint();
    if (mode !== "comments") draftCancel();
    if (layer) layer.hover.hidden = true;
    store("mode", mode);
    G.fit();
    renderAll();
  }
  bar.addEventListener("click", function (e) {
    var b = e.target.closest("[data-mode]"); if (!b) return;
    var m = b.getAttribute("data-mode");
    setMode(mode === m ? "" : m);
  });
  panel.querySelector(".gc-tabs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]"); if (b) setMode(b.getAttribute("data-tab"));
  });
  panel.querySelector(".gc-close").addEventListener("click", function () { setMode(""); });

  function typing(t) { return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable); }
  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      if (draft) { draftCancel(); e.preventDefault(); return; }
      if (mode) { setMode(""); e.preventDefault(); }
      return;
    }
    if ((e.key === "c" || e.key === "C" || e.key === "ㅊ") && !typing(e.target)) {
      setMode(mode === "comments" ? "" : "comments"); e.preventDefault();
    }
  }
  document.addEventListener("keydown", onKey);

  /* ---- 작성창 ----------------------------------------------------------- */
  var nameInput = composer.querySelector(".gc-name");
  var textInput = composer.querySelector(".gc-text");
  function paintRole() {
    Array.prototype.forEach.call(composer.querySelectorAll(".gc-role"), function (b) { b.setAttribute("aria-checked", String(b.getAttribute("data-role") === me.role)); });
  }
  composer.querySelector(".gc-roles").addEventListener("click", function (e) {
    var b = e.target.closest(".gc-role"); if (!b) return;
    me.role = b.getAttribute("data-role"); store("role", me.role); paintRole();
  });

  function startDraft(anchor) {
    if (mode !== "comments") setMode("comments");
    selected = null;
    draft = { anchor: anchor || null };
    body.setAttribute("data-gc-draft", "true");
    if (layer) layer.hover.hidden = true;
    nameInput.value = me.name;
    textInput.value = "";
    paintRole();
    composer.querySelector(".gc-composer__where").textContent = anchor ? "" : "위치 없는 코멘트";
    composer.hidden = false;
    paintHint();
    composer.setAttribute("data-floating", anchor && layer ? "true" : "false");
    renderAll();
    placeComposer();
    setTimeout(function () { (me.name ? textInput : nameInput).focus({ preventScroll: true }); }, 0);
  }
  function draftCancel() {
    if (!draft) return;
    draft = null; composer.hidden = true;
    body.removeAttribute("data-gc-draft");
    paintHint();
    renderPins();
  }
  composer.querySelector(".gc-cancel").addEventListener("click", draftCancel);
  composer.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); draftCancel(); }
  });
  composer.addEventListener("submit", function (e) { e.preventDefault(); submit(); });

  // 작성창을 핀 옆에 띄운다 (iframe 축소 비율 반영). 모바일·위치 없는 코멘트는 고정 위치
  function placeComposer() {
    if (!draft || composer.hidden || composer.getAttribute("data-floating") !== "true" || G.isMobile()) { composer.style.left = composer.style.top = ""; return; }
    var p = place(draft.anchor); if (!p || !layer) return;
    var k = frameScale(), fr = frame.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    var x = fr.left - sr.left + (p.x - layer.win.scrollX) * k + 44;
    var y = fr.top - sr.top + (p.y - layer.win.scrollY) * k - 20;
    var w = composer.offsetWidth, h = composer.offsetHeight;
    if (x + w > sr.width - 12) x = Math.max(12, x - w - 56);
    y = Math.min(Math.max(12, y), sr.height - h - 72);
    composer.style.left = x + "px"; composer.style.top = y + "px";
  }

  function submit() {
    var text = textInput.value.trim(), name = nameInput.value.trim();
    if (!name) { nameInput.focus(); say("이름을 입력해 주세요", true); return; }
    if (!text) { textInput.focus(); return; }
    me.name = name; store("name", name);
    var st = stateKey(), a = draft && draft.anchor || {};
    var c = {
      id: uid(), project: PROJECT, screen: screenOfState(st), state: st, device: G.device(),
      sel: a.sel || "", ox: a.ox == null ? "" : a.ox, oy: a.oy == null ? "" : a.oy,
      x: a.x == null ? "" : a.x, y: a.y == null ? "" : a.y, vw: a.vw || "",
      author: name, role: me.role, text: text, parent: "", status: "open",
      cid: me.cid, at: new Date().toISOString(), up: ""
    };
    items.push(c); selected = c.id;
    draft = null; composer.hidden = true;
    body.removeAttribute("data-gc-draft");
    paintHint();
    renderAll(); scrollToSelected();
    DB.add(c).then(function () { say(DB.shared ? "코멘트를 남겼어요" : "이 브라우저에만 저장했어요"); refresh(); })
      .catch(function (err) { items = items.filter(function (i) { return i !== c; }); renderAll(); say(err.message || "저장하지 못했어요", true); });
  }

  /* ---- 스레드 동작 ------------------------------------------------------- */
  function reply(parentId, text) {
    var p = find(parentId); if (!p || !text.trim()) return;
    var c = { id: uid(), project: PROJECT, screen: p.screen, state: p.state, device: G.device(), sel: "", ox: "", oy: "", x: "", y: "", vw: "",
      author: me.name, role: me.role, text: text.trim(), parent: parentId, status: "open", cid: me.cid, at: new Date().toISOString(), up: "" };
    items.push(c); renderAll();
    DB.add(c).then(refresh).catch(function (err) { items = items.filter(function (i) { return i !== c; }); renderAll(); say(err.message, true); });
  }
  function setStatus(id, status) {
    var c = find(id); if (!c) return;
    var prev = c.status; c.status = status;
    if (status === "resolved" && selected === id) selected = null;
    renderAll();
    DB.update(id, { status: status }).then(function () { say(status === "resolved" ? "해결됨으로 표시했어요" : "다시 열었어요"); refresh(); })
      .catch(function (err) { c.status = prev; renderAll(); say(err.message, true); });
  }
  function removeItem(id) {
    var c = find(id); if (!c) return;
    if (c.cid !== me.cid) { say("본인이 남긴 코멘트만 삭제할 수 있어요", true); return; }
    if (!window.confirm("이 코멘트를 삭제할까요?" + (c.parent ? "" : "\n답글도 함께 삭제됩니다."))) return;
    var keep = items; items = items.filter(function (i) { return i.id !== id && i.parent !== id; });
    if (selected === id) selected = null;
    renderAll();
    DB.remove(id).then(refresh).catch(function (err) { items = keep; renderAll(); say(err.message, true); });
  }
  function linkOf(c) { return location.href.split("#")[0] + "#" + (c.screen || (G.current() && G.current().id)) + "&c=" + c.id; }
  function copyLink(id) {
    var c = find(id); if (!c) return;
    var url = linkOf(c);
    var done = function () { say("링크를 복사했어요"); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, function () { window.prompt("링크를 복사하세요", url); });
    else window.prompt("링크를 복사하세요", url);
  }

  /* 선택 — 다른 상태(해시)의 코멘트면 그 상태로 화면을 바꾼 뒤 핀으로 스크롤 */
  function select(id) {
    var c = find(id); if (!c) return;
    selected = selected === id ? null : id;
    draftCancel();
    if (selected && c.state !== stateKey() && c.state.indexOf("screen:") !== 0) {
      frame.setAttribute("src", projectRootRel() + c.state);
    }
    renderAll();
    if (selected) { scrollToPin(c); scrollToSelected(); }
  }
  function projectRootRel() { return "../"; }      // guide/index.html 기준 프로젝트 폴더
  function scrollToPin(c) {
    if (!layer) return;
    var p = place(c); if (!p) return;
    var win = layer.win, vh = win.innerHeight;
    if (p.y < win.scrollY + 60 || p.y > win.scrollY + vh - 60) win.scrollTo({ top: Math.max(0, p.y - vh / 2), behavior: "smooth" });
  }
  function scrollToSelected() {
    var n = pbody.querySelector('[data-thread="' + selected + '"]');
    if (n && n.scrollIntoView) n.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  pbody.addEventListener("click", function (e) {
    var rb = e.target.closest(".gc-role");
    if (rb) {
      me.role = rb.getAttribute("data-role"); store("role", me.role);
      Array.prototype.forEach.call(rb.parentNode.children, function (x) { x.setAttribute("aria-checked", String(x === rb)); });
      return;
    }
    var b = e.target.closest("[data-act]");
    if (b) {
      var id = b.getAttribute("data-id"), act = b.getAttribute("data-act");
      if (act === "resolve") setStatus(id, "resolved");
      else if (act === "reopen") setStatus(id, "open");
      else if (act === "delete") removeItem(id);
      else if (act === "link") copyLink(id);
      else if (act === "general") startDraft(null);
      else if (act === "resolved-toggle") { showResolved = !showResolved; renderAll(); }
      return;
    }
    if (e.target.closest("a, textarea, input, form")) return;
    var t = e.target.closest("[data-thread]");
    if (t) select(t.getAttribute("data-thread"));
  });
  pbody.addEventListener("submit", function (e) {
    var f = e.target.closest(".gc-reply"); if (!f) return;
    e.preventDefault();
    var ta = f.querySelector("textarea"), text = ta.value, nm = f.querySelector(".gc-name");
    if (nm) {
      if (!nm.value.trim()) { nm.focus(); say("이름을 입력해 주세요", true); return; }
      me.name = nm.value.trim(); store("name", me.name);
    }
    if (!text.trim()) { ta.focus(); return; }
    ta.value = ""; ta.blur();
    reply(f.getAttribute("data-id"), text);
  });
  pbody.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target.closest(".gc-reply")) {
      e.preventDefault(); e.target.closest(".gc-reply").requestSubmit();
    }
  });

  /* ---- 그리기 ------------------------------------------------------------ */
  function renderAll() {
    renderBadges();
    renderPanel();
    renderPins();
  }

  function openCount(screenId) {
    return roots().filter(function (c) { return c.status !== "resolved" && c.screen === screenId; }).length;
  }
  function renderBadges() {
    var here = threadsHere().filter(function (c) { return c.status !== "resolved"; }).length;
    var cnt = bar.querySelector(".gc-count");
    cnt.textContent = here; cnt.hidden = !here;
    Array.prototype.forEach.call(G.menu.children, function (a) {
      var n = openCount(a.getAttribute("data-id"));
      var b = a.querySelector(".gc-nav-count");
      if (!n) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement("span"); b.className = "gc-nav-count"; a.appendChild(b); }
      b.textContent = n; b.title = "진행 중인 코멘트 " + n + "개";
    });
  }

  // 이름이 아직 없을 때(처음 답글) 이름 + 역할을 같이 받는다
  function whoHTML() {
    return '<div class="gc-composer__who" data-width="fill"><input class="gc-name" maxlength="20" placeholder="이름" aria-label="이름">' +
      '<div class="gc-roles" role="radiogroup" aria-label="역할">' + ROLES.map(function (r) {
        return '<button type="button" class="gc-role" data-role="' + r.id + '" role="radio" aria-checked="' + (r.id === me.role) + '">' + r.label + "</button>";
      }).join("") + "</div></div>";
  }
  function threadHTML(c) {
    var rs = repliesOf(c.id), open = c.id === selected, mine = c.cid === me.cid;
    var whereNote = "";
    if (c.state.indexOf("screen:") !== 0 && c.sel !== undefined) {
      if (!c.sel && c.x === "") whereNote = '<span class="gc-where">위치 없음</span>';
      else if (!c._placed && layer) whereNote = '<span class="gc-where">이 보기에서 위치 없음 · ' + (c.device === "mo" ? "MO" : "PC") + "에서 작성</span>";
    }
    return '<article class="gc-thread" data-thread="' + esc(c.id) + '" data-status="' + esc(c.status) + '"' + (open ? ' aria-current="true"' : "") + ">" +
      '<div class="gc-thread__head">' +
        '<span class="gc-num" data-role="' + esc(c.role) + '">' + (c._n || "·") + "</span>" +
        '<span class="gc-author">' + esc(c.author) + "</span>" +
        '<span class="gc-role-tag" data-role="' + esc(c.role) + '">' + roleLabel(c.role) + "</span>" +
        '<time class="gc-time" datetime="' + esc(c.at) + '">' + ago(c.at) + "</time>" +
      "</div>" +
      '<div class="gc-text-body">' + richText(c.text) + "</div>" +
      whereNote +
      (rs.length && !open ? '<div class="gc-meta">답글 ' + rs.length + "개</div>" : "") +
      (open ?
        '<div class="gc-replies">' + rs.map(function (r) {
          return '<div class="gc-replyitem"><div class="gc-thread__head"><span class="gc-author">' + esc(r.author) + '</span><span class="gc-role-tag" data-role="' + esc(r.role) + '">' + roleLabel(r.role) +
            '</span><time class="gc-time">' + ago(r.at) + "</time>" +
            (r.cid === me.cid ? '<button type="button" class="gc-mini" data-act="delete" data-id="' + esc(r.id) + '">삭제</button>' : "") +
            '</div><div class="gc-text-body">' + richText(r.text) + "</div></div>";
        }).join("") + "</div>" +
        '<form class="gc-reply" data-id="' + esc(c.id) + '">' + (me.name ? "" : whoHTML()) + '<textarea class="ds-textarea" data-size="medium" rows="2" maxlength="2000" placeholder="답글 (Ctrl+Enter)"></textarea>' +
          '<button type="submit" class="ds-btn" data-variant="neutralWeak" data-size="xsmall">답글</button></form>' +
        '<div class="gc-actions">' +
          (c.status === "resolved"
            ? '<button type="button" class="ds-btn" data-variant="neutralOutline" data-size="xsmall" data-act="reopen" data-id="' + esc(c.id) + '">다시 열기</button>'
            : '<button type="button" class="ds-btn" data-variant="neutralSolid" data-size="xsmall" data-act="resolve" data-id="' + esc(c.id) + '">해결</button>') +
          '<button type="button" class="ds-btn" data-variant="ghost" data-size="xsmall" data-act="link" data-id="' + esc(c.id) + '">링크 복사</button>' +
          (mine ? '<button type="button" class="ds-btn" data-variant="ghost" data-size="xsmall" data-act="delete" data-id="' + esc(c.id) + '">삭제</button>' : "") +
        "</div>" : "") +
    "</article>";
  }

  function renderPanel() {
    if (panel.hidden) return;
    var it = G.current();
    var ae = document.activeElement;
    if (ae && ae.closest && ae.closest(".gc-reply") && ae.value) { renderFoot(); return; }   // 답글을 쓰는 중이면 목록을 다시 그리지 않는다
    if (mode === "info") { pbody.innerHTML = infoHTML(it); renderFoot(); return; }

    var list = threadsHere();
    list.forEach(function (c, i) { c._n = i + 1; if (layer && c._placed === undefined) c._placed = !!place(c); });
    var open = list.filter(function (c) { return c.status !== "resolved"; });
    var done = list.filter(function (c) { return c.status === "resolved"; });
    var html = "";
    if (loadError) html += '<p class="gc-notice" data-bad="true">' + esc(loadError) + "</p>";
    if (!layer && it && it.page && !frame.hidden && location.protocol === "file:")
      html += '<p class="gc-notice">파일(file://)로 열면 화면 위에 핀을 찍을 수 없어요. 배포 주소나 로컬 서버로 열어 주세요. 위치 없는 코멘트는 남길 수 있어요.</p>';
    if (!list.length) html += '<div class="gc-empty"><p>이 화면에 남긴 코멘트가 없어요.</p><p>화면을 누르면 그 위치에 코멘트를 남길 수 있어요.</p></div>';
    html += open.map(threadHTML).join("");
    if (done.length) {
      html += '<button type="button" class="gc-resolved-toggle" data-act="resolved-toggle" aria-expanded="' + showResolved + '">해결된 코멘트 ' + done.length + "개 " + (showResolved ? "숨기기" : "보기") + "</button>";
      if (showResolved) html += done.map(threadHTML).join("");
    }
    pbody.innerHTML = html;
    renderFoot();
  }

  function renderFoot() {
    if (mode === "info") { pfoot.innerHTML = ""; pfoot.hidden = true; return; }
    pfoot.hidden = false;
    pfoot.innerHTML =
      '<button type="button" class="ds-btn" data-variant="neutralOutline" data-size="small" data-width="fill" data-act="general">위치 없이 코멘트 남기기</button>' +
      '<p class="gc-store" data-shared="' + DB.shared + '">' +
        (DB.shared ? "공유 저장소에 저장 · 모두에게 보여요" : "⚠ 이 브라우저에만 저장돼요 — config.js 에 comments.endpoint 를 넣으면 공유됩니다") +
        (me.name ? ' · <button type="button" class="gc-mini gc-rename">' + esc(me.name) + " 이름 바꾸기</button>" : "") +
      "</p>";
  }
  pfoot.addEventListener("click", function (e) {
    if (e.target.closest("[data-act=general]")) startDraft(null);
    if (e.target.closest(".gc-rename")) {
      var n = window.prompt("코멘트에 표시할 이름", me.name);
      if (n && n.trim()) { me.name = n.trim(); store("name", me.name); renderFoot(); }
    }
  });

  function infoHTML(it) {
    if (!it) return "";
    var f = G.cfg.figmaFile, url = function (n) { return "https://www.figma.com/design/" + f + "/?node-id=" + n; };
    var page = it.page ? it.page + (it.hash ? "#" + it.hash : "") : "";
    return '<div class="gc-info">' +
      '<p class="gc-info__title">' + esc(G.cfg.srcLabel + it.sb + " " + it.name) + "</p>" +
      '<dl class="gc-info__dl">' +
        "<dt>상태</dt><dd>" + (it.page ? "퍼블리싱 완료" : "퍼블리싱 예정") + "</dd>" +
        (page ? '<dt>파일</dt><dd><a href="' + esc(page) + '" target="_blank" rel="noopener">' + esc(page.replace(/^(\.\.\/)+/, "")) + "</a></dd>" : "") +
        (f && it.figma ? '<dt>피그마</dt><dd><a href="' + url(it.figma) + '" target="_blank" rel="noopener">PC ' + esc(it.figma) + "</a>" +
          (it.figmaMo ? ' · <a href="' + url(it.figmaMo) + '" target="_blank" rel="noopener">MO ' + esc(it.figmaMo) + "</a>" : "") + "</dd>" : "") +
      "</dl>" +
      (it.notes && it.notes.length ? '<p class="gc-info__sub">확인 포인트</p><ul class="gc-info__notes">' + it.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>" : "") +
    "</div>";
  }

  /* ---- 불러오기 · 주기적 갱신 ------------------------------------------- */
  function refresh() {
    return DB.list().then(function (list) {
      loadError = "";
      var s = JSON.stringify(list);
      if (s === sig) return;
      sig = s;
      items = list.filter(function (i) { return !i.deleted; });
      if (selected && !find(selected)) selected = null;
      renderAll();
    }).catch(function (err) {
      var msg = "코멘트를 불러오지 못했어요 (" + (err && err.message || "네트워크") + ")";
      if (msg !== loadError) { loadError = msg; renderAll(); }
    });
  }
  setInterval(function () { if (document.visibilityState === "visible" && DB.shared) refresh(); }, POLL);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refresh(); });

  /* ---- 가이드와 연결 ----------------------------------------------------- */
  frame.addEventListener("load", function () { draftCancel(); attach(); openFromHash(); });
  document.addEventListener("guide:render", function () {
    draftCancel();
    if (frame.hidden) { detach(); body.setAttribute("data-gc-frame", "none"); }
    renderAll();
    setTimeout(openFromHash, 0);
  });
  document.addEventListener("guide:device", function () { draftCancel(); setTimeout(schedule, 60); });
  window.addEventListener("resize", schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(stage);

  // 퍼블리싱 전 화면 — 코멘트 모드에서 빈 화면을 누르면 위치 없는 코멘트
  G.empty.addEventListener("click", function (e) {
    if (mode === "comments" && !e.target.closest("a, button")) startDraft(null);
  });

  // 주소의 &c=코멘트id → 코멘트 모드로 열고 그 스레드 선택
  var pendingC = "";
  function openFromHash() {
    var m = /[&?]c=([\w-]+)/.exec(location.hash);
    if (m) { pendingC = m[1]; history.replaceState(null, "", location.href.replace(/&c=[\w-]+/, "")); }
    if (!pendingC) return;
    var c = find(pendingC);
    if (!c) return;                                          // 아직 못 불러왔다 — refresh 뒤 다시
    pendingC = "";
    if (mode !== "comments") setMode("comments");
    if (selected !== c.id) select(c.id);
  }

  setMode(store("mode") === "comments" || store("mode") === "info" ? store("mode") : "");
  if (frameDoc()) attach();
  refresh().then(openFromHash);
  setInterval(function () { if (mode === "comments") schedule(); }, 1000);   // 애니메이션·지연 로딩 대비
})();
