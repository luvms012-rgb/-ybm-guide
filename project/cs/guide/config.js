/* ==========================================================================
   가이드 뷰어 — 프로젝트별 설정 (고객센터 개편)
   --------------------------------------------------------------------------
   뷰어를 다른 프로젝트로 복사할 때 고치는 파일은 이 파일과 screens.js 둘뿐이다.
   index.html · guide.css · guide.js 는 회원가입에서 그대로 복사해 쓴다.

     title        왼쪽 상단에 보이는 프로젝트 이름
     storageKey   보기 설정·마지막 화면 저장 접두사 — 회원가입(guide-signup)과 분리
     lang         고객센터는 영문 요건이 없다 → false (언어 전환 UI 가 사라진다)
     device       PC / MO 전환 사용
     deviceWidth  보기 폭. PC 1280 = 퍼블리싱 Desktop 분기 시작점(1280~)이라
                  컨테이너 1080 고정 레이아웃을 그대로 확인할 수 있다.
                  MO 375 = 모바일 기준 시안 폭.
     srcLabel     화면 목록 번호 접두사 (기획서 슬라이드 번호 = SB 번호)
     figmaFile    피그마 fileKey — screens.js 의 figma/figmaMo 노드를 링크로 연다
                  (퍼블리싱 전 화면·화면 정보 탭에서 사용)
     comments     코멘트 설정 (comments.js)
       project    코멘트 묶음 이름 — 한 시트를 여러 프로젝트가 같이 쓸 때 구분
       endpoint   Google Apps Script 웹앱 URL (…/exec). 비우면 이 브라우저에만 저장
       key        Apps Script 의 SHARED_KEY 와 같은 값 (선택 · 아무나 쓰는 것 방지용)
       false 로 두면 코멘트 기능을 끈다
   ========================================================================== */
window.GUIDE_CONFIG = {
  title: "고객센터 개편",
  storageKey: "guide-cs",
  lang: false,
  device: true,
  deviceWidth: { pc: 1280, mo: 375 },
  srcLabel: "SB.",
  figmaFile: "5uZaHIZW4c5oN0Ct0bPpc0",
  comments: {
    project: "cs",
    endpoint: "https://script.google.com/macros/s/AKfycbzhGGrZZBvL6oNyVH7xeqd4qlfszO-WfElY8dyOBIswMAajd9QgcCkhakO7U9ut5h_LhQ/exec",
    key: ""
  }
};
