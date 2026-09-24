/**
 * 퀴즈 결과 데이터를 로드하고 화면에 표시하는 함수
 */
function showResult() {
  let result;

  // 세션 스토리지에서 결과 데이터를 안전하게 파싱 (JSON 파싱 에러 방지)
  try {
    result = JSON.parse(sessionStorage.getItem(resultKey));
  } catch {
    result = null;
  }

  // 데이터 무결성 및 비정상 진입 검증:
  // 1. 결과 객체가 없거나
  // 2. 허용된 토픽 키 목록(topicKeys)에 없는 주제이거나
  // 3. 점수가 정수가 아니거나
  // 4. 점수가 0 미만이거나 총 문제 수를 초과할 경우
  if (
    !result ||
    !Object.hasOwn(topicKeys, result.topic) ||
    !Number.isInteger(result.score) ||
    result.score < 0 ||
    result.score > totalQuestions
  ) {
    // 뒤로 가기 기록을 남기지 않고 메인 페이지로 강제 리다이렉트
    location.replace('./index.html');
    return;
  }

  // 상단 헤더 등의 토픽 아이콘/이름 UI 업데이트
  updateTopic(result.topic);

  // 연산 결과를 전달하는 시맨틱 태그인 <output>에 획득 점수 출력
  $('output.quiz-score').text(result.score);

  // 전체 문제 수 표시 (예: "out of 10")
  $('.question-result .quiz-counter').text('out of ' + totalQuestions);

  // 로딩 인디케이터를 숨기고 결과 패널 노출
  $('.result-loading').prop('hidden', true);
  $('.quiz-score-panel, .question-result').prop('hidden', false);

  // 스크린 리더 보조 공학 기기에 작업이 완료되었음을 전달 (WAI-ARIA)
  $('#main').attr('aria-busy', 'false');
}

/**
 * '다시 풀기(Play Again)' 버튼 클릭 이벤트 핸들러
 */
$('.again-button').on('click', function () {
  // 이전 퀴즈의 결과 데이터 및 진행 상태 임시 저장 데이터 초기화
  removeStored(resultKey);
  removeStored(progressKey);

  // 홈 화면으로 이동
  location.href = './index.html';
});

// 페이지 로드 시 결과 화면 렌더링 즉시 실행
showResult();
