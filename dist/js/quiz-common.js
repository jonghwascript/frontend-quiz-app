const totalQuestions = 10;
const resultKey = 'frontend-quiz-result';
const progressKey = 'frontend-quiz-progress';
const topicKeys = {
  HTML: 'html',
  CSS: 'css',
  JavaScript: 'js',
  Accessibility: 'accessibility',
};
/**
 * 현재 진행중인 문제와 선택한 답변, 진행 상태를 세션 스토리지에서 조회.
 * ex) topic: "HTML", questions: [{question: "In HTML, wha..........
 * @param {*} key 
 * @returns 
 */
function readStored(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}
/**
 * 세션 스토리지에 저장
 * @param {*} key 
 * @param {*} value 
 * @returns 
 */
function writeStored(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
/**
 * 세션 스토리지에서 삭제
 * @param {*} key 
 */
function removeStored(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage may be unavailable. */
  }
}
/**
 * header에 현재 진행중인 퀴즈 정보 업데이트
 * @param {*} topic 
 */
function updateTopic(topic) {
  $('.current-topic > span:last-child').text(topic);
  $('.current-topic .topic-icon').attr(
    'class',
    'topic-icon topic-icon--' + topicKeys[topic],
  );
}
