/**
 * 즉시 실행 함수(IIFE) & 스코프 격리: 전역 네임스페이스 오염을 방지하면서 테마 제어용 전역 객체
 * (window.quizTheme)만 외부에 노출.
 * 
 * FOUC(Flash of Unstyled Content) 방지: 최상단 <html> 요소(document.documentElement)에 data-theme 
 * 속성을 바로 부여하여 화면 깜빡임 없이 스타일을 적용.
 * 
 * 로컬 스토리지 안전 접근(Defensive Coding): 시크릿 모드나 서드파티 쿠키 차단 등 브라우저 보안 정책으로 
 * localStorage 접근 시 예외(QuotaExceeded, SecurityError 등)가 발생해도 스크립트가 중단되지 않도록 try...*catch로 감쌈.
 * 
 * 시스템 설정 감지: 브라우저/운영체제의 테마 선호도 미디어 쿼리(prefers-color-scheme: light)를 감지하여 
 * 기본 테마로 fallback 처리.
 */
(function () {
  // 로컬 스토리지에 테마 설정을 저장할 고유 키 명칭
  var KEY = 'frontend-quiz-theme';
  // CSS 테마 속성을 부여할 최상위 <html> 요소
  var root = document.documentElement;

  /**
   * 로컬 스토리지에서 저장된 테마 값을 읽어오는 함수
   * @returns {'light' | 'dark' | null} 유효한 테마 문자열 또는 null
   */
  function read() {
    try {
      var saved = localStorage.getItem(KEY);
      // 저장된 값이 'light' 또는 'dark'인 경우에만 유효값으로 인정
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch (error) {
      // 브라우저가 저장소를 차단한 시크릿 모드/보안 환경에서도 페이지 에러를 방지하고 null 반환
      return null;
    }
  }

  /**
   * 선택된 테마를 로컬 스토리지에 영구 저장하는 함수
   * @param {'light' | 'dark'} theme 
   */
  function save(theme) {
    try {
      localStorage.setItem(KEY, theme);
    } catch (error) {
      /* 저장 공간 부족이나 보안 제약으로 저장 실패 시에도 현재 페이지의 테마 적용은 정상 유지 */
    }
  }

  /**
   * 사용자의 OS/시스템 다크·라이트 모드 설정을 감지하는 함수
   * @returns {'light' | 'dark'} 시스템 설정 모드 (기본값: 'dark')
   */
  function systemTheme() {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  /**
   * <html> 태그의 data-theme 속성에 테마를 반영하는 함수
   * CSS에서 [data-theme="light"] 또는 [data-theme="dark"] 선택자로 스타일 제어
   * @param {'light' | 'dark'} theme 
   */
  function apply(theme) {
    root.setAttribute('data-theme', theme);
  }

  /**
   * 외부 UI(예: 토글 스위치)에서 테마를 조회하고 변경할 수 있도록 전역 API 공개
   */
  window.quizTheme = {
    key: KEY,
    read: read,
    // 현재 활성화된 테마 상태 확인
    current: function () {
      return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    },
    // 새로운 테마로 변경하고 저장
    set: function (theme) {
      var next = theme === 'light' ? 'light' : 'dark';
      apply(next);
      save(next);
      return next;
    },
  };

  // 초기 실행:
  // 1. 기존에 저장된 테마(read())가 있으면 우선 적용
  // 2. 저장된 값이 없으면 운영체제 환경 설정(systemTheme())을 기본값으로 채택
  apply(read() || systemTheme());
})();