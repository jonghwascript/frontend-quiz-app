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
  $('.result-loading').prop('hidden', true);
  $('.quiz-score-panel, .question-result').prop('hidden', false);
  $('#main').attr('aria-busy', 'false');
}

$('.again-button').on('click', function () {
  removeStored(resultKey);
  removeStored(progressKey);
  location.href = './index.html';
});
showResult();
