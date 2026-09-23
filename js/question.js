const selectedTopic = new URLSearchParams(location.search).get('topic');
let quizQuestions = [];
let questionIndex = 0;
let responses = [];
let draftAnswer = null;
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

function validQuestion(question) {
  return (
    question &&
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === 'string') &&
    question.options.includes(question.answer)
  );
}
function validChoice(choice) {
  return Number.isInteger(choice) && choice >= 0 && choice < 4;
}
function restoreProgress() {
  const saved = readStored(progressKey);
  if (
    !saved ||
    saved.topic !== selectedTopic ||
    !Array.isArray(saved.questions) ||
    saved.questions.length !== totalQuestions ||
    !saved.questions.every(validQuestion) ||
    !Number.isInteger(saved.index) ||
    saved.index < 0 ||
    saved.index >= totalQuestions ||
    !Array.isArray(saved.responses) ||
    !saved.responses.every(validChoice) ||
    (saved.responses.length !== saved.index &&
      saved.responses.length !== saved.index + 1) ||
    (saved.draft !== null && !validChoice(saved.draft))
  )
    return false;
  quizQuestions = saved.questions;
  questionIndex = saved.index;
  responses = saved.responses;
  draftAnswer = saved.draft;
  return true;
}
function saveProgress() {
  if (
    !writeStored(progressKey, {
      topic: selectedTopic,
      questions: quizQuestions,
      index: questionIndex,
      responses,
      draft: draftAnswer,
    })
  ) {
    $('.storage-notice').text(
      'Progress could not be saved. Keep this page open to continue.',
    );
  }
}
function showReady() {
  updateTopic(selectedTopic);
  renderQuestion();
  const choice = responses[questionIndex] ?? draftAnswer;
  if (choice !== null && choice !== undefined) {
    $('.answer-option__input').eq(choice).prop('checked', true);
  }
  answered = responses.length > questionIndex;
  if (answered) showFeedback();
  $('.quiz-loading').prop('hidden', true);
  $('.quiz-question-panel, .quiz-form').prop('hidden', false);
  $('#main').attr('aria-busy', 'false');
}
function showFeedback() {
  const question = quizQuestions[questionIndex];
  const correctIndex = question.options.indexOf(question.answer);
  const selectedIndex = responses[questionIndex];
  const $options = $('.answer-options .answer-option');
  $options.eq(correctIndex).addClass('answer-option--green');
  if (selectedIndex !== correctIndex)
    $options.eq(selectedIndex).addClass('answer-option--red');
  $('.answer-option__input').prop('disabled', true);
  $('.quiz-submit').text(
    questionIndex === totalQuestions - 1 ? 'View Results' : 'Next Question',
  );
  $('.quiz-feedback').text(
    selectedIndex === correctIndex
      ? 'Correct answer.'
      : 'Incorrect answer. The correct answer is ' + question.answer + '.',
  );
}
function showLoadError() {
  $('#main').attr('aria-busy', 'false');
  $('.quiz-load-message').text(
    'Unable to load the questions. Please try again.',
  );
  $('.quiz-retry').prop('hidden', false).prop('disabled', false);
}
function loadQuestions() {
  $('#main').attr('aria-busy', 'true');
  $('.quiz-load-message').text('Loading questions?');
  $('.quiz-retry').prop('disabled', true);
  $.ajax({ url: './data.json', dataType: 'json', timeout: 15000 })
    .done(function (data) {
      const quiz =
        data && Array.isArray(data.quizzes)
          ? data.quizzes.find((item) => item && item.title === selectedTopic)
          : null;
      if (
        !quiz ||
        !Array.isArray(quiz.questions) ||
        quiz.questions.length < totalQuestions ||
        !quiz.questions.every(validQuestion)
      ) {
        showLoadError();
        return;
      }
      quizQuestions = [...quiz.questions];
      for (let i = quizQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quizQuestions[i], quizQuestions[j]] = [
          quizQuestions[j],
          quizQuestions[i],
        ];
      }
      quizQuestions = quizQuestions.slice(0, totalQuestions);
      questionIndex = 0;
      responses = [];
      draftAnswer = null;
      removeStored(resultKey);
      saveProgress();
      showReady();
    })
    .fail(showLoadError);
}
$('.answer-option__input').on('change', function () {
  clearAnswerError();
  draftAnswer = 'ABCD'.indexOf(this.value);
  saveProgress();
});
$('.quiz-retry').on('click', loadQuestions);
$('.quiz-form').on('submit', function (event) {
  event.preventDefault();
  if (!quizQuestions.length) return;
  if (answered) {
    if (questionIndex === totalQuestions - 1) {
      const score = responses.reduce(
        (sum, choice, index) =>
          sum +
          Number(
            quizQuestions[index].options[choice] ===
              quizQuestions[index].answer,
          ),
        0,
      );
      if (!writeStored(resultKey, { topic: selectedTopic, score })) {
        $('.storage-notice').text(
          'Unable to save your result. Your score is ' +
            score +
            ' out of ' +
            totalQuestions +
            '.',
        );
        return;
      }
      removeStored(progressKey);
      location.href = './score.html';
      return;
    }
    questionIndex++;
    draftAnswer = null;
    renderQuestion();
    saveProgress();
    $('h1.quiz-question').attr('tabindex', '-1').trigger('focus');
    return;
  }
  const selectedValue = $('.answer-option__input:checked').val();
  const selectedIndex = 'ABCD'.indexOf(selectedValue ?? '');
  if (!selectedValue || !validChoice(selectedIndex)) {
    showAnswerError();
    return;
  }
  clearAnswerError();
  responses.push(selectedIndex);
  draftAnswer = null;
  answered = true;
  showFeedback();
  saveProgress();
});
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

if (!Object.hasOwn(topicKeys, selectedTopic)) {
  location.replace('./index.html');
} else if (restoreProgress()) {
  showReady();
} else {
  loadQuestions();
}
