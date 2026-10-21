/* ==========================================================================
   영문 사전 — i18n.js 가 읽는다
   --------------------------------------------------------------------------
   키 = 한국어 원문. 같은 한국어에 영문이 여러 개면 키 끝에 " (2)" 를 붙인다.
   값의 \n = PC 전용 줄바꿈 위치 · [[ ]] = 색 강조 구간(<em>).
   섹션 제목의 EN n 은 기획서 영문 슬라이드 번호.
   적용 범위: SB.3 약관동의 · SB.4~12 본인인증 · SB.13~14 기존 회원 조회 ·
             SB.15~17 정보입력 · SB.18 가입완료 · SB.45~57 아이디 찾기·비밀번호 재설정
   ========================================================================== */
window.I18N_EN = {
  /* 공통 */
  "회원가입": "Sign Up",
  "다음": "Next",
  "홍길동": "HongGildong",
  "English": "Korean",                       // 헤더 언어 전환 버튼 (영문 화면에서는 Korean)

  /* SB.3 약관동의 (EN 3) */
  "서비스 약관에 동의해 주세요.": "Please agree to the required\nterms to continue",
  "전체 동의합니다.": "Agree to All",
  "전체 동의 시 필수 및 선택 항목 모두에 대해 동의 처리되며, 선택 항목 동의를 거부하시더라도 서비스 이용이 가능합니다.":
    "By selecting Agree to All, you agree to all required\nand optional terms. You may decline the optional terms\nand still use our services.",
  "필수": "Required",
  "선택": "Optional",
  "YBM Familiy 회원 이용약관": "YBM Family member\nterms and conditions",
  "㈜와이비엠 이용약관": "㈜와이비엠 Terms of Use Agreement",
  "개인정보 수집 및 이용": "Collection and use\nof personal information",
  "YBM머니 이용을 위한 개인정보 제3자 제공": "Provide personal information\nto a third party for the use of YBM Money",
  "㈜와이비엠 제3자 제공": "㈜와이비엠 Provide\npersonal information to third parties",
  "보기": "View",
  "다음 (2)": "Agree and Continue",

  /* SB.4 이름 입력 */
  "이름을 입력해 주세요": "Please enter your name",
  "이름": "Name",
  "한글, 영문 대/소문자를 사용해 주세요. (특수기호, 공백 사용 불가)":
    "Please use Korean or English characters.\nYou can’t verify your legal name if the name does not\nmatch the information on your ID.",
  /* 이름 오류 문구 — 한국어는 안내문과 같고 영문만 짧다 */
  "한글, 영문 대/소문자를 사용해 주세요. (특수기호, 공백 사용 불가) (2)": "Please use Korean or English characters.",
  "실제 명의를 입력해 주세요. (특수기호, 공백 사용 불가)":
    "Please use Korean or English characters.\nYou can’t verify your legal name if the name does not\nmatch the information on your ID.",

  /* SB.5 생년월일 입력 */
  "생년월일을 입력해 주세요": "Please enter your date of birth",
  "생년월일": "Date of birth",
  "생년월일은 8자리 숫자로 입력해 주세요.": "Please enter your date of birth as an 8-digit number.",
  "생년월일이 정확한지 확인해 주세요.": "Please enter your date of birth as an 8-digit number.",

  /* SB.6~7 성별 */
  "성별을 선택해 주세요": "Please select your gender",
  "성별": "Gender",
  "남성": "Male",
  "여성": "Female",
  "선택안함": "Other",

  /* SB.8 휴대전화번호 */
  "휴대전화번호 인증을 진행합니다": "Proceed with mobile\nverification via SMS",
  "휴대전화번호": "Mobile Number",
  "휴대전화가 없어요": "Verify via email.",
  "인증번호 발송": "Send Code",
  "휴대전화번호가 정확한지 확인해 주세요.": "Please check that your mobile number is correct.",
  "통신사": "Carrier",
  "통신사를 선택해 주세요": "Please select your carrier",
  "SKT 알뜰폰": "SKT MVNO",
  "KT 알뜰폰": "KT MVNO",
  "LG U+ 알뜰폰": "LG U+ MVNO",
  "국가번호를 선택해 주세요": "Please select your\ncountry code",

  /* 국가번호 목록 — 영문에서는 identity.js 가 알파벳순으로 다시 정렬하고
     기본값을 United States +1 로 둔다 */
  "가나 +233": "Ghana +233",
  "그리스 +30": "Greece +30",
  "네덜란드 +31": "Netherlands +31",
  "네팔 +977": "Nepal +977",
  "노르웨이 +47": "Norway +47",
  "뉴질랜드 +64": "New Zealand +64",
  "니제르 +227": "Niger +227",
  "니카라과 +505": "Nicaragua +505",
  "대한민국 +82": "South Korea +82",
  "덴마크 +45": "Denmark +45",
  "도미니카공화국 +1": "Dominican Republic +1",
  "독일 +49": "Germany +49",
  "라오스 +856": "Laos +856",
  "러시아 +7": "Russia +7",
  "말레이시아 +60": "Malaysia +60",
  "멕시코 +52": "Mexico +52",
  "몽골 +976": "Mongolia +976",
  "미국 +1": "United States +1",
  "베트남 +84": "Vietnam +84",
  "아랍에미리트 +971": "United Arab Emirates +971",
  "영국 +44": "United Kingdom +44",
  "우루과이 +598": "Uruguay +598",
  "우즈베키스탄 +998": "Uzbekistan +998",
  "우크라이나 +380": "Ukraine +380",
  "일본 +81": "Japan +81",
  "중국 +86": "China +86",

  /* SB.9 이메일 */
  "이메일 인증을 진행합니다": "Proceed with email verification",
  "이메일 주소": "Email Address",
  "휴대전화로 인증할게요": "Verify via mobile phone.",
  "이메일 주소를 다시 확인해주세요.": "Please check that your email address is correct.",

  /* SB.10 입력 정보 확인 — 기획서에 영문이 없어 한국어에서 유추 (기획 확인 필요) */
  "입력한 정보가 맞는지 확인해 주세요 (2)": "Please confirm that\nyour information is correct",
  "확인했어요 (2)": "Confirm",
  "입력하신 정보와 실명인증 정보가 일치하지 않습니다": "Your information does not match\nyour verified identity",
  "다시 확인 후 인증을 시도해 주세요.": "Please check and try verifying again.",
  "확인": "OK",

  /* SB.11 본인확인 약관동의 — 기획서에 영문이 없어 한국어에서 유추 (기획 확인 필요) */
  "본인확인을 위한 약관동의가 필요합니다": "Please agree to the terms\nfor identity verification",
  "필수 약관 전체 동의": "Agree to All Required Terms",
  "동의하고 인증하기": "Agree and Verify",
  "개인정보 수집 및 이용 안내": "Collection and use\nof personal information",
  "인증시 고유식별정보처리": "Processing of unique\nidentification information",
  "통신사 이용약관": "Carrier terms of use",
  "인증사 이용약관": "Verification provider\nterms of use",
  "YBM 개인정보 수집": "YBM personal\ninformation collection",

  /* SB.12 인증번호 입력 (EN 10) — {0} = 받는 휴대전화번호·이메일 */
  "{0}로 전송된\n인증번호를 입력해 주세요": "Enter the verification code\nsent to {0}",
  "남은 시간": "Time remaining",
  "시간연장": "Extend time",
  "재전송": "Resend",
  "인증번호 확인": "Confirm",
  "인증번호를 다시 입력해 주세요.": "Please enter the correct verification code.",
  "인증번호를 재전송했습니다": "The verification code has been resent",

  /* SB.13 이미 가입된 회원 (기획서 영문 없음) · SB.14 이미 가입된 아이디 선택 (EN 11) */
  "이미 가입된 회원입니다": "You are already a member",
  "아이디": "User ID",
  "가입일자": "Joined",
  "시험 접수 등 일부 서비스는 실명인증된 1개 아이디만 이용 가능합니다.":
    "Some services, including test registration, are available\nonly through an [[identity-verified account]].",
  "비밀번호 재설정": "Reset Password",
  "로그인하기": "Log In",
  "고객님 정보로 이미 가입된 아이디를 찾았어요": "We found existing accounts\nregistered with your information",
  "실명인증": "Identity Verified",
  "최근 로그인": "Last login",
  "계속해서 가입하기": "Continue Signing Up",

  /* SB.15 아이디 (EN 12) */
  "아이디를 입력해 주세요": "Please enter your user ID",
  "아이디 (추천)": "User ID (Suggested)",
  "5~20자의 영문 소문자, 숫자와 특수기호(_),(-)만 사용 가능합니다.": "Use 5–20 characters containing only lowercase letters,\nnumbers, underscores (_), and hyphens (-).",
  "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.": "This user ID is unavailable.\nPlease enter a different one.",

  /* SB.16 비밀번호 (EN 13) */
  "비밀번호를 입력해 주세요": "Please enter your password",
  "비밀번호": "Password",
  "비밀번호 입력": "Password",
  "영문": "Letters",
  "숫자": "Numbers",
  "특수문자": "Special Characters",
  "8~20자": "8–20 Characters",
  "';--<()\\/ 사용불가": "Not allowed: ' ; -- < ( ) \\ /",

  /* SB.17 이메일 주소 / 휴대전화번호 (EN 14) */
  "이메일 주소를 입력해 주세요": "Please enter your email address",
  "이메일 주소 입력": "Email Address",
  "휴대전화번호를 입력해 주세요": "Please enter your\nmobile phone number",
  "휴대전화번호 입력": "Mobile Number",
  "가입하기": "Sign Up",

  /* SB.18 가입완료 — 간편계정 연결 (EN 15) */
  "[[userid]]님, 환영합니다.": "Welcome, [[userid]]!",
  "보다 간편한 로그인을 위해 간편계정을 연결해 주세요.": "Link your social account\nfor faster and easier sign-in.",
  "다음에 하기": "Skip for now",
  "해당 네이버 계정은 이미 YBM Family 계정에 연결되어 있습니다": "This Naver account is already\nlinked to a YBM Family account",
  "다른 네이버 아이디로 연결하시거나, 연결된 YBM Family 계정에서 연결 해제 후 다시 시도해 주세요.":
    "Please connect a different Naver account,\nor unlink it from the connected\nYBM Family account and try again.",
  "본인인증한 정보와 네이버 계정의 본인 정보가 일치하지 않습니다": "The Naver account does not\nmatch your verified identity",
  "동일한 명의의 소셜 계정으로 다시 로그인해 주세요.": "Please log in again with a social\naccount registered under your name.",

  /* 접근성 라벨 · 문서 제목 (화면에 보이지 않는 문구) */
  "이름 지우기": "Clear name",
  "생년월일 지우기": "Clear date of birth",
  "휴대전화번호 지우기": "Clear mobile number",
  "이메일 주소 지우기": "Clear email address",
  "이메일 도메인 추천": "Suggested email domains",
  "닫기": "Close",
  "회원가입 · 본인인증 | YBM Family": "Sign Up | YBM Family",
  "회원가입 · 약관동의 | YBM Family": "Sign Up | YBM Family",
  "회원가입 · 기존 회원 조회 | YBM Family": "Sign Up | YBM Family",
  "약관 펼치기": "Show terms",
  "약관 접기": "Hide terms",
  "인증번호 6자리": "6-digit verification code",
  "아이디 선택": "Select your user ID",
  "회원가입 · 정보입력 | YBM Family": "Sign Up | YBM Family",
  "아이디 지우기": "Clear user ID",
  "비밀번호 보기": "Show password",
  "비밀번호 숨기기": "Hide password",
  "회원가입 · 가입완료 | YBM Family": "Sign Up | YBM Family",
  "네이버 계정 연결": "Link Naver account",
  "카카오 계정 연결": "Link Kakao account",
  "구글 계정 연결": "Link Google account",
  "애플 계정 연결": "Link Apple account"
};

/* SB.45~57 아이디 찾기 · 비밀번호 재설정 (EN 16~28) */
Object.assign(window.I18N_EN, {
  "아이디 찾기 | YBM Family": "Find your ID | YBM Family",
  "비밀번호 재설정 | YBM Family": "Reset Password | YBM Family",
  "아이디 찾기": "Find your ID",
  "아래의 인증방법 중 하나를 선택하여\n인증을 진행해 주세요.": "Please select one of the verification\nmethods below to proceed.",
  "[[userid]] 님,\n아래의 인증방법 중 하나를 선택하여\n인증을 진행해 주세요.": "[[userid]], please select a verification\nmethod below to proceed.",
  "이메일주소": "Email Address",
  "본인인증": "Identity Verification",
  "- 없이 숫자만 입력해 주세요.": "Please enter numbers only,\nwithout hyphens.",
  "인증번호 전송": "Send Code",
  "인증번호 재전송": "Resend",
  "인증번호": "Verification code",
  "인증번호 지우기": "Clear verification code",
  "휴대전화 인증": "Mobile Phone Verification",
  "아이핀 인증": "i-PIN Verification",
  "외국인 인증": "Foreigner Identity Verification",
  "기존에 [[본인인증을 하지 않은 아이디]]는 조회할 수 없습니다.": "You can only retrieve IDs that were [[previously identity-verified]].",
  "가입하신 아이디를\n확인하시고 로그인해 주세요": "Please check your registered ID\nand log in",
  "비밀번호 재설정하기": "Reset Password",
  "로그인하러 가기": "Go to Login",
  "비밀번호를 재설정하실\n아이디를 입력해 주세요": "Please enter your ID\nto reset your password",
  "아이디 (2)": "ID",
  "아이디가 기억나지 않나요?": "Forgot your ID?",
  "새 비밀번호를 입력해 주세요": "Enter a new password",
  "비밀번호는 아이디나 주민등록번호 및 전화번호와 같이 개인정보와 관련된 숫자나 문자를 사용하시면 안 됩니다.": "Do not use personal information such as your ID,\ndate of birth, or mobile number.",
  "확인 (2)": "Confirm",
  "[[필수]] 본인확인 결과에 따라 회원정보(이름, 생년월일, 휴대전화번호)가 최신 정보로 변경될 수 있음에 동의합니다.": "[[Required]] I agree to have my account information\n(name, date of birth, and mobile number)\nupdated after identity verification.",

  /* Alert */
  "휴대전화번호를 입력해 주세요 (2)": "Please enter\nyour mobile number",
  "이메일주소를 입력해 주세요": "Please enter\nyour email address",
  "이메일주소를 정확히 입력해 주세요": "Please enter a valid\nemail address",
  "인증번호를 전송했습니다": "The verification code\nhas been sent",
  "인증번호를 재전송했습니다": "The verification code\nhas been resent",
  "인증번호 전송에 실패했습니다": "Failed to send\nthe verification code",
  "이미 인증번호를 발송하였습니다": "A verification code\nhas already been sent",
  "잠시 후 다시 시도해 주세요.": "Please try again later.",
  "인증번호를 정확히 입력해 주세요": "Please enter the correct\nverification code",
  "인증번호가 만료되었습니다": "The verification code\nhas expired",
  "재전송 후 다시 입력해 주세요.": "Please resend it and enter the new code.",
  "입력하신 정보가 일치하지 않습니다": "The information does not match",
  "다시 확인해 주세요.": "Please check and try again.",
  "비밀번호가 변경되었습니다": "Your password has been changed",
  "새 비밀번호로 로그인해 주세요.": "Please log in with your new password.",
  "기존에 사용한 비밀번호는\n사용할 수 없습니다": "You cannot reuse\na previous password",
  "새로운 비밀번호를 입력해 주세요.": "Please enter a new password.",
  "회원 정보 변경에 동의해 주세요": "Please consent to updating\nyour account information"
});
