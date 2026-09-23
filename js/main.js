const params = new URLSearchParams(location.search);
const selectedTopic = params.get('topic');
let quizQuestions = [];
const totalQuestions = 10;
const resultKey = 'frontend-quiz-result';
const topicKeys = {
  HTML: 'html',
  CSS: 'css',
  JavaScript: 'js',
  Accessibility: 'accessibility',
};
let questionIndex = 0;
let score = 0;
let answered = false;
let errorAnnouncementTimer;

function clearAnswerError() {
  clearTimeout(errorAnnouncementTimer);
  $('.error-message').removeClass('show');
  $('#quiz-error-announcement').text('');
  $('.answer-option__input').removeAttr('aria-invalid aria-describedby');
}

function showAnswerError() {
  clearAnswerError();
  $('.error-message').addClass('show');
  $('.answer-option__input')
    .attr('aria-invalid', 'true')
    .attr('aria-describedby', 'quiz-error-text');
  // 같은 오류를 다시 제출해도 알림이 갱신되도록 비운 뒤 내용을 넣습니다.
  errorAnnouncementTimer = setTimeout(function () {
    $('#quiz-error-announcement').text($('#quiz-error-text').text());
  }, 100);
}

// 보기를 선택하는 즉시 메시지를 숨기기
$('.answer-option__input').on('change', function () {
  clearAnswerError();
});

$('.quiz-form').on('submit', function (event) {
  event.preventDefault();
  if (quizQuestions.length === 0) return;

  if (answered) {
    if (questionIndex === totalQuestions - 1) {
      sessionStorage.setItem(
        resultKey,
        JSON.stringify({ topic: selectedTopic, score }),
      );
      location.href = './score.html';
      return;
    }
    questionIndex++;
    renderQuestion();
    $('h1.quiz-question').attr('tabindex', '-1').trigger('focus');
    return;
  }

  const selectedValue = $('.answer-option__input:checked').val();
  const selectedIndex = 'ABCD'.indexOf(selectedValue ?? '');
  if (!selectedValue || selectedIndex < 0) {
    showAnswerError();
    return;
  }

  clearAnswerError();

  const question = quizQuestions[questionIndex];
  const correctIndex = question.options.indexOf(question.answer);
  const $options = $('.answer-options .answer-option');
  $options.eq(correctIndex).addClass('answer-option--green');
  if (selectedIndex === correctIndex) {
    score++;
  } else {
    $options.eq(selectedIndex).addClass('answer-option--red');
  }

  answered = true;
  $('.answer-option__input').prop('disabled', true);
  $('.quiz-submit').text(
    questionIndex === totalQuestions - 1 ? 'View Results' : 'Next Question',
  );
  $('.quiz-feedback').text(
    selectedIndex === correctIndex
      ? 'Correct answer.'
      : 'Incorrect answer. The correct answer is ' + question.answer + '.',
  );
});

if (location.pathname.endsWith('/question.html')) {
  $('.quiz-submit').prop('disabled', true);
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type === 'reload') {
    location.replace('./index.html');
  } else {
    $.get('./data.json', successFn, 'json').fail(failFn);
  }
}

if (location.pathname.endsWith('/score.html')) {
  showResult();
}

$('.again-button').on('click', function () {
  sessionStorage.removeItem(resultKey);
  location.href = './index.html';
});

function successFn(data) {
  initializeQuiz(data);
}

function failFn() {
  initializeQuiz(dummyData());
}

function initializeQuiz(data) {
  const quiz = data.quizzes.find((item) => item.title === selectedTopic);

  if (!quiz || quiz.questions.length < totalQuestions) {
    location.replace('./index.html');
    return;
  }

  // 원본 데이터는 유지하고 Fisher–Yates 방식으로 문제 순서를 섞습니다.
  quizQuestions = [...quiz.questions];
  for (let i = quizQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [quizQuestions[i], quizQuestions[j]] = [quizQuestions[j], quizQuestions[i]];
  }

  quizQuestions = quizQuestions.slice(0, totalQuestions);
  questionIndex = 0;
  score = 0;
  sessionStorage.removeItem(resultKey);
  updateTopic(quiz.title);
  renderQuestion();
}

function updateTopic(topic) {
  $('.current-topic > span:last-child').text(topic);
  $('.current-topic .topic-icon').attr(
    'class',
    'topic-icon topic-icon--' + topicKeys[topic],
  );
}

function renderQuestion() {
  clearAnswerError();
  answered = false;
  const question = quizQuestions[questionIndex];
  // HTML 태그가 포함된 문제와 보기도 문자열 그대로 표시합니다.
  $('h1.quiz-question').text(question.question);
  $('.answer-options .answer-option').each(function (index) {
    const $option = $(this);
    $option.removeClass(
      'answer-option--green answer-option--red answer-option--purple',
    );

    $option.find('.answer-option__text').text(question.options[index]);
    $option
      .find('.answer-option__input')
      .val('ABCD'[index])
      .prop('checked', false)
      .prop('disabled', false);
    $option.attr('data-text', 'ABCD'[index]);
  });
  $('.quiz-counter').text(
    'Question ' + (questionIndex + 1) + ' of ' + totalQuestions,
  );
  $('.quiz-submit').text('Submit Answer').prop('disabled', false);
  $('.quiz-feedback').text('');
  updateProgress(questionIndex + 1);
}

function updateProgress(currentQuestion) {
  $('.quiz-progress')
    .attr('max', totalQuestions)
    .attr('value', currentQuestion)
    .attr('aria-label', 'Current question')
    .text(currentQuestion + ' of ' + totalQuestions);
}

function showResult() {
  let result;
  try {
    result = JSON.parse(sessionStorage.getItem(resultKey));
  } catch {
    result = null;
  }
  if (
    !result ||
    !Object.hasOwn(topicKeys, result.topic) ||
    !Number.isInteger(result.score) ||
    result.score < 0 ||
    result.score > totalQuestions
  ) {
    location.replace('./index.html');
    return;
  }
  updateTopic(result.topic);
  $('output.quiz-score').text(result.score);
  $('.question-result .quiz-counter').text('out of ' + totalQuestions);
}

function dummyData() {
  return {
    quizzes: [
      {
        title: 'HTML',
        icon: './assets/images/icon-html.svg',
        questions: [
          {
            question: 'What does HTML stand for?',
            options: [
              'Hyper Trainer Marking Language',
              'Hyper Text Marketing Language',
              'Hyper Text Markup Language',
              'Hyper Text Markup Leveler',
            ],
            answer: 'Hyper Text Markup Language',
          },
          {
            question:
              'Which of the following is the correct structure for an HTML document?',
            options: [
              '<html><head></head><body></body></html>',
              '<head><html></html><body></body></head>',
              '<body><head></head><html></html></body>',
              '<html><body></body><head></head></html>',
            ],
            answer: '<html><head></head><body></body></html>',
          },
          {
            question:
              'Which HTML element is used to define the title of a document?',
            options: ['<head>', '<title>', '<header>', '<top>'],
            answer: '<title>',
          },
          {
            question: 'What is the purpose of the <body> tag in HTML?',
            options: [
              "It defines the document's head section.",
              'It contains all the content such as text, images, and links.',
              'It is used to define the main content of an HTML document.',
              'It specifies the body of the email content in HTML.',
            ],
            answer:
              'It contains all the content such as text, images, and links.',
          },
          {
            question: 'Which HTML tag is used to create a hyperlink?',
            options: ['<hyperlink>', '<link>', '<a>', '<href>'],
            answer: '<a>',
          },
          {
            question: 'Which tag is used to display images in HTML?',
            options: ['<img>', '<image>', '<src>', '<pic>'],
            answer: '<img>',
          },
          {
            question:
              'What attribute is used to provide the path of an image in the <img> tag?',
            options: ['link', 'src', 'href', 'url'],
            answer: 'src',
          },
          {
            question: 'Which HTML tag is used to create an unordered list?',
            options: ['<ul>', '<ol>', '<list>', '<li>'],
            answer: '<ul>',
          },
          {
            question: 'What does the <br> tag do?',
            options: [
              'It breaks the text into two sections.',
              'It creates a bold text.',
              'It inserts a line break.',
              'It adds a new row in a table.',
            ],
            answer: 'It inserts a line break.',
          },
          {
            question: 'In HTML, what does the `fieldset` tag do?',
            options: [
              'It is used to group related data in a form.',
              'It sets the field to a fixed size.',
              'It automatically validates the fields within a form.',
              'It hides the fields in a form.',
            ],
            answer: 'It is used to group related data in a form.',
          },
        ],
      },
      {
        title: 'CSS',
        icon: './assets/images/icon-css.svg',
        questions: [
          {
            question: 'What does CSS stand for?',
            options: [
              'Colorful Style Sheets',
              'Computer Style Sheets',
              'Cascading Style Sheets',
              'Creative Style Sheets',
            ],
            answer: 'Cascading Style Sheets',
          },
          {
            question: 'Which HTML attribute is used to define inline styles?',
            options: ['styles', 'style', 'class', 'font-style'],
            answer: 'style',
          },
          {
            question: 'How do you insert a comment in a CSS file?',
            options: [
              '// this is a comment //',
              '/* this is a comment */',
              '-- this is a comment --',
              '<!-- this is a comment -->',
            ],
            answer: '/* this is a comment */',
          },
          {
            question:
              'Which property is used to change the background color of an element?',
            options: ['color', 'bgcolor', 'background-color', 'background'],
            answer: 'background-color',
          },
          {
            question: 'How do you apply a style to all <p> elements?',
            options: ['p { }', '.p { }', '#p { }', 'all.p { }'],
            answer: 'p { }',
          },
          {
            question:
              'Which property is used to change the font of an element?',
            options: ['font-style', 'text-style', 'font-family', 'typeface'],
            answer: 'font-family',
          },
          {
            question:
              'How do you make each word in a text start with a capital letter?',
            options: [
              'text-transform: capitalize',
              'text-transform: uppercase',
              'text-style: capital',
              'font-transform: capitalize',
            ],
            answer: 'text-transform: capitalize',
          },
          {
            question:
              "How do you select an element with the class name 'header'?",
            options: ['.header', '#header', 'header', '*header'],
            answer: '.header',
          },
          {
            question: "What is the default value of the 'position' property?",
            options: ['relative', 'fixed', 'absolute', 'static'],
            answer: 'static',
          },
          {
            question: 'What is the purpose of the z-index property in CSS?',
            options: [
              'To count the number of elements',
              'To set the magnification level of an element',
              'To specify the stack order of an element',
              'To create a zoom effect',
            ],
            answer: 'To specify the stack order of an element',
          },
        ],
      },
      {
        title: 'JavaScript',
        icon: './assets/images/icon-js.svg',
        questions: [
          {
            question:
              "Which syntax is correct to output 'Hello World' in an alert box?",
            options: [
              "alertBox('Hello World');",
              "msg('Hello World');",
              "alert('Hello World');",
              "msgBox('Hello World');",
            ],
            answer: "alert('Hello World');",
          },
          {
            question: "How do you call a function named 'myFunction'?",
            options: [
              'call function myFunction()',
              'call myFunction()',
              'myFunction()',
              'execute myFunction()',
            ],
            answer: 'myFunction()',
          },
          {
            question: 'How to write an IF statement in JavaScript?',
            options: ['if i = 5 then', 'if (i == 5)', 'if i == 5', 'if i = 5'],
            answer: 'if (i == 5)',
          },
          {
            question:
              "How to write an IF statement for executing some code if 'i' is NOT equal to 5?",
            options: [
              'if (i <> 5)',
              'if i =! 5 then',
              'if (i != 5)',
              'if i not = 5',
            ],
            answer: 'if (i != 5)',
          },
          {
            question: 'How does a FOR loop start?',
            options: [
              'for (i = 0; i <= 5)',
              'for i = 1 to 5',
              'for (i <= 5; i++)',
              'for (i = 0; i <= 5; i++)',
            ],
            answer: 'for (i = 0; i <= 5; i++)',
          },
          {
            question: 'How can you add a single-line comment in JavaScript?',
            options: [
              "'This is a single-line comment",
              '//This is a single-line comment',
              '<!--This is a single-line comment-->',
              '/* This is a single-line comment */',
            ],
            answer: '//This is a single-line comment',
          },
          {
            question: 'What is the correct way to write a JavaScript array?',
            options: [
              "var colors = (1:'red', 2:'green', 3:'blue')",
              "var colors = ['red', 'green', 'blue']",
              "var colors = 'red', 'green', 'blue'",
              "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')",
            ],
            answer: "var colors = ['red', 'green', 'blue']",
          },
          {
            question:
              'How do you find the number with the highest value of x and y?',
            options: [
              'Math.ceil(x, y)',
              'top(x, y)',
              'Math.max(x, y)',
              'Math.highest(x, y)',
            ],
            answer: 'Math.max(x, y)',
          },
          {
            question: 'Which operator is used to assign a value to a variable?',
            options: ['-', '*', '=', 'x'],
            answer: '=',
          },
          {
            question: 'What is the correct way to write a JavaScript object?',
            options: [
              "var person = {firstName: 'John', lastName: 'Doe'};",
              "var person = {firstName = 'John', lastName = 'Doe'};",
              "var person = (firstName: 'John', lastName: 'Doe');",
              "var person = (firstName = 'John', lastName = 'Doe');",
            ],
            answer: "var person = {firstName: 'John', lastName: 'Doe'};",
          },
        ],
      },
      {
        title: 'Accessibility',
        icon: './assets/images/icon-accessibility.svg',
        questions: [
          {
            question: "What does 'WCAG' stand for?",
            options: [
              'Web Content Accessibility Guidelines',
              'Web Compliance Accessibility Guide',
              'Web Content Accessibility Goals',
              'Website Compliance and Accessibility Guidelines',
            ],
            answer: 'Web Content Accessibility Guidelines',
          },
          {
            question:
              'Which element is used to provide alternative text for images for screen reader users?',
            options: [
              '<alt>',
              '<figcaption>',
              '<description>',
              "<img alt='description'>",
            ],
            answer: "<img alt='description'>",
          },
          {
            question: 'What does ARIA stand for in web development?',
            options: [
              'Accessible Rich Internet Applications',
              'Advanced Responsive Internet Assistance',
              'Accessible Responsive Internet Applications',
              'Automated Responsive Internet Actions',
            ],
            answer: 'Accessible Rich Internet Applications',
          },
          {
            question: 'Which of the following is not a principle of the WCAG?',
            options: [
              'Perceivable',
              'Dependable',
              'Operable',
              'Understandable',
            ],
            answer: 'Dependable',
          },
          {
            question:
              'Which of these color contrast ratios defines the minimum WCAG 2.1 Level AA requirement for normal text?',
            options: ['3:1', '4.5:1', '7:1', '2:1'],
            answer: '4.5:1',
          },
          {
            question:
              "Which of the following elements is inherently focusable, meaning it can receive focus without a 'tabindex' attribute?",
            options: ['<div>', '<span>', "<a href='...'>", '<p>'],
            answer: "<a href='...'>",
          },
          {
            question:
              "What is the purpose of the 'lang' attribute in an HTML page?",
            options: [
              'To specify the scripting language',
              'To define the character set',
              'To indicate the language of the page content',
              'To declare a language pack',
            ],
            answer: 'To indicate the language of the page content',
          },
          {
            question:
              'Which guideline ensures that content is accessible by keyboard as well as by mouse?',
            options: [
              'Keyboard Accessible',
              'Mouse Independence',
              'Device Independence',
              'Operable Controls',
            ],
            answer: 'Keyboard Accessible',
          },
          {
            question:
              "What is the role of 'skip navigation' links in web accessibility?",
            options: [
              'To skip over primary navigation to the main content',
              'To provide shortcuts to different sections of the website',
              'To help users skip unwanted sections like advertisements',
              'To bypass broken links in the navigation',
            ],
            answer: 'To skip over primary navigation to the main content',
          },
          {
            question:
              'Which of these tools can help in checking the accessibility of a website?',
            options: [
              'W3C Validator',
              'Google Lighthouse',
              'CSS Validator',
              'JavaScript Console',
            ],
            answer: 'Google Lighthouse',
          },
        ],
      },
    ],
  };
}
