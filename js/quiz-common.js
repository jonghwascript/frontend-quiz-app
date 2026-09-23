const totalQuestions = 10;
const resultKey = 'frontend-quiz-result';
const progressKey = 'frontend-quiz-progress';
const topicKeys = {
  HTML: 'html',
  CSS: 'css',
  JavaScript: 'js',
  Accessibility: 'accessibility',
};
function readStored(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}
function writeStored(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function removeStored(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage may be unavailable. */
  }
}
function updateTopic(topic) {
  $('.current-topic > span:last-child').text(topic);
  $('.current-topic .topic-icon').attr(
    'class',
    'topic-icon topic-icon--' + topicKeys[topic],
  );
}
