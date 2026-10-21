/* ==========================================================================
   가이드 뷰어 — 프로젝트별 설정
   --------------------------------------------------------------------------
   뷰어를 다른 프로젝트로 복사할 때 고치는 파일은 이 파일과 screens.js 둘뿐이다.
   guide.html · guide.css · guide.js 는 그대로 복사해 쓴다.

     title        왼쪽 상단에 보이는 프로젝트 이름
     storageKey   보기 설정·마지막 화면을 저장할 때 쓰는 접두사.
                  프로젝트마다 다르게 둬야 같은 브라우저에서 값이 섞이지 않는다.
     lang         한국어 / English 전환을 쓸지 (영문 사전이 있는 프로젝트만 true)
     device       PC / MO 전환을 쓸지
     deviceWidth  보기 폭. 화면이 이 폭보다 좁으면 이 폭으로 그린 뒤 비율 축소한다
     srcLabel     화면 목록의 번호 접두사 (스토리보드 체계가 다르면 바꾼다)
   ========================================================================== */
window.GUIDE_CONFIG = {
  title: "회원가입 개편",
  storageKey: "guide-signup",
  lang: true,
  device: true,
  deviceWidth: { pc: 1024, mo: 360 },
  srcLabel: "SB.",
  figmaFile: "etsLv4DqIAlXp9QiC4hwLw",
  comments: {                     // 코멘트 — 자세한 설정은 project/_publish/README.md
    project: "signup",
    endpoint: "https://script.google.com/macros/s/AKfycbzhGGrZZBvL6oNyVH7xeqd4qlfszO-WfElY8dyOBIswMAajd9QgcCkhakO7U9ut5h_LhQ/exec",                 // Google Apps Script 웹앱 URL (…/exec). 비우면 이 브라우저에만 저장
    key: ""
  }
};
