/* ==========================================================================
   SB.17 내 문의 내역 (목록)
   --------------------------------------------------------------------------
   · 행 전체가 링크다 — 누르면 상세로 간다
   · [더보기] 는 다음 묶음을 이어 붙인다(실제로는 서버가 내려준다)
   바로가기: #sb17 · #sb17-empty
   ========================================================================== */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  var list = $("inquiry-list");
  var empty = $("inquiry-empty");
  var past = $("past-list");
  var more = $("list-more");
  var pager = $("list-pager");
  var pastBtn = $("past-inquiry");
  var heading = document.querySelector(".cs-page-heading__title");

  /* [더보기] 로 이어 붙이는 다음 10건 (실제로는 서버가 내려준다) */
  var NEXT_10 = [
    ["답변완료", "positive", "TOEIC",          "시험 접수",      "접수한 시험 일정을 변경할 수 있나요?",        "2026.06.17 15:22"],
    ["답변완료", "positive", "YBM 인강",        "수강/진도",      "수강 기간 연장은 어떻게 신청하나요?",         "2026.06.02 11:40"],
    ["재문의",   "warning",  "YBM 회원정보",    "아이디/비밀번호", "비밀번호 재설정 메일이 오지 않습니다.",        "2026.05.28 09:12"],
    ["답변완료", "positive", "YBM 머니",        "충전/사용",      "이벤트 적립금이 반영되지 않았어요.",          "2026.05.14 17:05"],
    ["답변완료", "positive", "TOEIC Speaking", "성적 확인",      "성적 발표일이 언제인가요?",                 "2026.04.30 10:51"],
    ["답변완료", "positive", "IT시험",          "시험 접수",      "COS Pro 응시 자격을 알고 싶습니다.",         "2026.04.08 14:33"],
    ["답변완료", "positive", "어학원",          "수강 신청",      "강남센터 야간반 개강일 문의드립니다.",         "2026.03.19 16:08"],
    ["답변완료", "positive", "YBM 회원정보",    "가입/탈퇴",      "탈퇴 후 재가입이 가능한가요?",               "2026.03.02 13:27"],
    ["답변완료", "positive", "교과서",          "자료 다운로드",   "교사용 자료를 내려받을 수 없습니다.",          "2026.02.11 09:45"],
    ["답변완료", "positive", "YBM 인강",        "결제/취소/환불",  "결제 수단을 변경하고 싶습니다.",             "2026.01.23 18:02"]
  ];

  var HREF = { "답변대기": "#sb18", "답변완료": "#sb18-answered", "재문의": "#sb20" };

  function appendRows(items) {
    items.forEach(function (it) {
      var a = document.createElement("a");
      a.className = "cs-inquiry-item";
      a.dataset.more = "1";                       // 상태 전환 시 되돌리기 위한 표식
      a.href = "inquiry-detail.html" + (HREF[it[0]] || "#sb18");
      a.innerHTML =
        '<span class="cs-inquiry-item__content">' +
          '<span class="cs-inquiry-item__meta">' +
            '<span class="ds-badge" data-size="large"' + (it[1] ? ' data-tone="' + it[1] + '"' : '') + '>' + it[0] + '</span>' +
            '<span class="cs-inquiry-item__type">' + it[2] +
              '<i class="ds-icon ds-icon--chevron-right" aria-hidden="true"></i>' + it[3] +
            '</span>' +
          '</span>' +
          '<span class="cs-inquiry-item__title">' + it[4] + '</span>' +
        '</span>' +
        '<span class="cs-inquiry-item__date">' + it[5] + '</span>';
      list.appendChild(a);
    });
  }

  /* 10건/페이지 — 목록이 10건을 넘으면 더보기 대신 페이지네이션을 보여 준다 */
  function syncFoot() {
    var many = list.children.length > 10;
    more.hidden = many;
    pager.hidden = !many;
  }

  function resetList() {
    var extra = list.querySelectorAll('[data-more="1"]');
    for (var i = 0; i < extra.length; i++) extra[i].remove();
  }

  CS.familySite();

  /* [지난 문의] — 기획서는 새 창이지만 뷰어에서는 같은 파일의 상태로 보여 준다 */
  pastBtn.addEventListener("click", function () { location.hash = "#sb17-past"; });

  $("more-btn").addEventListener("click", function () {
    appendRows(NEXT_10);
    syncFoot();
  });

  pager.addEventListener("click", function (e) {
    var item = e.target.closest(".ds-pagination__item");
    if (!item) return;
    e.preventDefault();
    if (item.getAttribute("aria-disabled") === "true") return;
    YBM.snackbar("해당 페이지를 불러오는 자리입니다.");
  });

  /* ---- 상태 바로가기 --------------------------------------------------------- */
  function applyHash() {
    var h = location.hash;
    var isEmpty = h === "#sb17-empty";
    var isPast = h === "#sb17-past";

    resetList();                          // 화면을 바꿀 때 더보기로 붙인 행은 되돌린다

    list.hidden = isEmpty || isPast;
    empty.hidden = !isEmpty;
    past.hidden = !isPast;
    pastBtn.hidden = isPast;              // 이미 지난 문의 안이므로 숨긴다
    heading.textContent = isPast ? "지난 문의 내역" : "내 문의 내역";

    if (isEmpty || isPast) {              // 빈 화면·지난 문의는 더보기·페이징 모두 없음
      more.hidden = true;
      pager.hidden = true;
    } else {
      syncFoot();
    }

    document.body.dataset.screen = isEmpty ? "list-empty" : (isPast ? "list-past" : "list");
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();
})();
