// 헤더의 테마 스위치와 해/달 버튼을 window.quizTheme(=partials/theme-init.html)에 연결합니다.
$(function () {
  var theme = window.quizTheme;
  if (!theme) return;

  var $toggle = $('.theme-control input[name="use-darkmode"]');
  var $lightButton = $('.theme-control .light-button');
  var $darkButton = $('.theme-control .dark-button');

  function syncControls(mode) {
    $toggle.prop('checked', mode === 'dark');
    $lightButton.attr('aria-pressed', String(mode === 'light'));
    $darkButton.attr('aria-pressed', String(mode === 'dark'));
  }

  function setTheme(mode) {
    syncControls(theme.set(mode));
  }

  $toggle.on('change', function () {
    setTheme(this.checked ? 'dark' : 'light');
  });

  $lightButton.on('click', function () {
    setTheme('light');
  });

  $darkButton.on('click', function () {
    setTheme('dark');
  });

  // 다른 탭에서 테마를 바꾸면 이 탭도 같은 테마를 따라갑니다.
  $(window).on('storage', function (event) {
    var original = event.originalEvent;
    if (!original || original.key !== theme.key) return;
    syncControls(theme.set(original.newValue));
  });

  syncControls(theme.current());
});
