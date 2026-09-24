// DOM 로드가 완료되면 실행 (jQuery Ready)
$(function () {
  // 앞서 선언된 테마 관리 전역 객체(window.quizTheme) 참조
  var theme = window.quizTheme;
  // 테마 관리 모듈이 로드되지 않은 환경이면 실행 중단
  if (!theme) return;

  // 제어 대상 DOM 엘리먼트 캐싱
  var $toggle = $('.theme-control input[name="use-darkmode"]'); // 다크모드 체크박스/스위치
  var $lightButton = $('.theme-control .light-button');           // 라이트 모드(해) 버튼
  var $darkButton = $('.theme-control .dark-button');             // 다크 모드(달) 버튼

  /**
   * 테마 모드에 맞춰 화면의 UI 컨트롤 상태(체크 여부 및 ARIA 속성)를 동기화
   * @param {'light' | 'dark'} mode 
   */
  function syncControls(mode) {
    // 1. 체크박스 상태 갱신: 다크 모드일 때 true, 라이트 모드일 때 false
    $toggle.prop('checked', mode === 'dark');

    // 2. WAI-ARIA 토글 버튼 상태 동기화 (스크린 리더에 현재 활성화된 모드 전달)
    // 문자열 형태의 'true' 또는 'false'를 전달해야 함
    $lightButton.attr('aria-pressed', String(mode === 'light'));
    $darkButton.attr('aria-pressed', String(mode === 'dark'));
  }

  /**
   * 테마를 변경하고 UI 컨트롤을 함께 갱신하는 래퍼 함수
   * @param {'light' | 'dark'} mode 
   */
  function setTheme(mode) {
    // theme.set(mode)로 실제 <html> data-theme 및 localStorage를 변경한 뒤 반환값을 넘겨 동기화
    syncControls(theme.set(mode));
  }

  // [이벤트 1] 스위치 토글 체크 상태 변경 시
  $toggle.on('change', function () {
    // 체크되어 있으면 'dark', 해제되어 있으면 'light' 적용
    setTheme(this.checked ? 'dark' : 'light');
  });

  // [이벤트 2] 라이트 모드(해) 버튼 클릭 시
  $lightButton.on('click', function () {
    setTheme('light');
  });

  // [이벤트 3] 다크 모드(달) 버튼 클릭 시
  $darkButton.on('click', function () {
    setTheme('dark');
  });

  // [이벤트 4] 다른 브라우저 탭/창에서 테마를 변경했을 때 발생하는 storage 이벤트 감지
  $(window).on('storage', function (event) {
    var original = event.originalEvent;

    // 이벤트 객체가 없거나, 다른 localStorage 키가 변경된 경우 무시
    if (!original || original.key !== theme.key) return;

    // 변경된 새로운 값(original.newValue)으로 현재 탭의 테마와 UI 동기화
    syncControls(theme.set(original.newValue));
  });

  // 페이지 최초 진입 시 현재 설정된 테마 상태를 UI 컨트롤에 즉시 반영
  syncControls(theme.current());
});