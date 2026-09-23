(function () {
  var KEY = 'frontend-quiz-theme';
  var root = document.documentElement;

  function read() {
    try {
      var saved = localStorage.getItem(KEY);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch (error) {
      // 브라우저가 저장소를 막아둔 경우에도 페이지는 동작해야 합니다.
      return null;
    }
  }

  function save(theme) {
    try {
      localStorage.setItem(KEY, theme);
    } catch (error) {
      /* 저장만 실패하고 현재 페이지 전환은 그대로 진행합니다. */
    }
  }

  function systemTheme() {
    return window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
  }

  window.quizTheme = {
    key: KEY,
    read: read,
    current: function () {
      return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    },
    set: function (theme) {
      var next = theme === 'light' ? 'light' : 'dark';
      apply(next);
      save(next);
      return next;
    },
  };

  // 저장된 값이 없으면 운영체제 설정을 따릅니다.
  apply(read() || systemTheme());
})();
