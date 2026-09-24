// URL 쿼리스트링(?topic=...)에서 선택된 퀴즈 주제 파라미터 추출
const selectedTopic = new URLSearchParams(location.search).get('topic');

// 퀴즈 애플리케이션 상태(State) 변수 관리
let quizQuestions = [];     // 이번 퀴즈에서 사용할 전체 문제 목록 (셔플 완료된 배열)
let questionIndex = 0;      // 현재 풀이 중인 문제의 배열 인덱스 (0-based)
let responses = [];         // 사용자가 제출 완료한 정답 선택값(0, 1, 2, 3)을 순서대로 기록
let draftAnswer = null;     // 라디오 버튼으로 선택했으나 '제출(Submit)' 버튼은 누르지 않은 임시 인덱스
let answered = false;       // 현재 문제의 제출 및 피드백 표시 완료 여부 플래그
let errorAnnouncementTimer; // 스크린 리더 오류 메시지 지연 안내를 위한 setTimeout 타이머 ID

/**
 * 에러 메시지 초기화 및 WAI-ARIA 오류 상태 해제
 */
function clearAnswerError() {
  clearTimeout(errorAnnouncementTimer);
  // 화면 표시용 에러 UI 숨김
  $('.error-message').removeClass('show');
  // 스크린 리더용 live region 텍스트 초기화
  $('#quiz-error-announcement').text('');
  // 입력 필드의 오류 관련 ARIA 속성 제거
  $('.answer-option__input').removeAttr('aria-invalid aria-describedby');
}

/**
 * 보기 미선택 제출 시 에러 UI 표시 및 스크린 리더 알림 트리거
 */
function showAnswerError() {
  clearAnswerError();
  // 에러 메시지 클래스 추가로 시각적 노출
  $('.error-message').addClass('show');
  // WAI-ARIA: 입력값이 유효하지 않음(invalid) 및 에러 설명 텍스트 요소와 연결(describedby)
  $('.answer-option__input')
    .attr('aria-invalid', 'true')
    .attr('aria-describedby', 'quiz-error-text');
  
  // 동일한 오류가 반복될 때 스크린 리더가 변경 사항을 감지하여 다시 읽어줄 수 있도록 지연 실행
  errorAnnouncementTimer = setTimeout(function () {
    $('#quiz-error-announcement').text($('#quiz-error-text').text());
  }, 100);
}

/**
 * 단일 문제 객체의 구조적 유효성 검증
 * @param {Object} question - 검증 대상 문제 객체
 * @returns {boolean} 필드 타입 및 정답 포함 여부 만족 시 true
 */
function validQuestion(question) {
  return (
    question &&
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === 'string') &&
    question.options.includes(question.answer) // 보기에 실제 정답이 포함되어 있는지 확인
  );
}

/**
 * 선택된 보기 번호가 0, 1, 2, 3 (A, B, C, D) 정수 범위인지 검증
 * @param {*} choice
 * @returns {boolean}
 */
function validChoice(choice) {
  return Number.isInteger(choice) && choice >= 0 && choice < 4;
}

/**
 * 브라우저 새로고침(F5) 시 스토리지에 저장된 진행 상태 데이터를 검증 및 복원
 * @returns {boolean} 복원 성공 여부
 */
function restoreProgress() {
  const saved = readStored(progressKey);
  
  // 저장된 데이터의 무결성 정밀 검증 (주제 일치, 문제 수, 인덱스 및 응답 유효성)
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
    // 응답 배열 길이는 현재 인덱스와 같거나(풀이 중), 인덱스 + 1(채점 후 다음 문제 이동 전)이어야 함
    (saved.responses.length !== saved.index &&
      saved.responses.length !== saved.index + 1) ||
    (saved.draft !== null && !validChoice(saved.draft))
  )
    return false;

  // 상태 변수 복구
  quizQuestions = saved.questions;
  questionIndex = saved.index;
  responses = saved.responses;
  draftAnswer = saved.draft;
  return true;
}

/**
 * 현재 퀴즈 진행 상태를 스토리지에 직렬화하여 저장
 */
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
    // 쿼터 초과나 시크릿 모드 등으로 저장 실패 시 사용자 안내
    $('.storage-notice').text(
      'Progress could not be saved. Keep this page open to continue.',
    );
  }
}

/**
 * 데이터 로드 또는 복원 완료 후 퀴즈 풀이 화면을 렌더링하고 사용자에게 준비 상태를 알림
 */
function showReady() {
  updateTopic(selectedTopic);
  renderQuestion();

  // Nullish Coalescing Operator(??): 이미 제출된 답이 있으면 그것을, 없으면 임시 선택값(draft)을 선택
  const choice = responses[questionIndex] ?? draftAnswer;
  if (choice !== null && choice !== undefined) {
    $('.answer-option__input').eq(choice).prop('checked', true);
  }

  // 이미 제출된 문제인지 판별하여 피드백 표시
  answered = responses.length > questionIndex;
  if (answered) showFeedback();

  // 로딩 화면 숨기고 본 퀴즈 UI 노출
  $('.quiz-loading').prop('hidden', true);
  $('.quiz-question-panel, .quiz-form').prop('hidden', false);
  $('#main').attr('aria-busy', 'false'); // 비동기 작업 완료 알림
}

/**
 * 채점 결과 피드백(정답/오답 스타일 및 해설 문구) UI 표시
 */
function showFeedback() {
  const question = quizQuestions[questionIndex];
  const correctIndex = question.options.indexOf(question.answer);
  const selectedIndex = responses[questionIndex];
  const $options = $('.answer-options .answer-option');

  // 정답 보기는 초록색 하이라이트
  $options.eq(correctIndex).addClass('answer-option--green');
  // 사용자가 틀린 보기를 선택했을 경우 해당 보기는 빨간색 하이라이트
  if (selectedIndex !== correctIndex)
    $options.eq(selectedIndex).addClass('answer-option--red');

  // 채점 완료 후에는 보기 라디오 버튼 비활성화
  $('.answer-option__input').prop('disabled', true);

  // 마지막 문제 여부에 따라 다음 버튼 텍스트 변경
  $('.quiz-submit').text(
    questionIndex === totalQuestions - 1 ? 'View Results' : 'Next Question',
  );

  // 스크린 리더 및 화면 안내 피드백 텍스트 설정
  $('.quiz-feedback').text(
    selectedIndex === correctIndex
      ? 'Correct answer.'
      : 'Incorrect answer. The correct answer is ' + question.answer + '.',
  );
}

/**
 * 문제 데이터 비동기 요청(Ajax) 실패 시 에러 화면 표시
 */
function showLoadError() {
  $('#main').attr('aria-busy', 'false');
  $('.quiz-load-message').text(
    'Unable to load the questions. Please try again.',
  );
  // 재시도 버튼 활성화
  $('.quiz-retry').prop('hidden', false).prop('disabled', false);
}

/**
 * data.json에서 퀴즈 데이터를 비동기로 불러와 셔플 및 초기화
 */
function loadQuestions() {
  $('#main').attr('aria-busy', 'true'); // 비동기 작업 로딩 중 표시
  $('.quiz-load-message').text('Loading questions?');
  $('.quiz-retry').prop('disabled', true);

  $.ajax({ url: './data.json', dataType: 'json', timeout: 15000 })
    .done(function (data) {
      // 선택된 주제(selectedTopic)와 일치하는 퀴즈 항목 추출
      const quiz =
        data && Array.isArray(data.quizzes)
          ? data.quizzes.find((item) => item && item.title === selectedTopic)
          : null;

      // 불러온 퀴즈 데이터의 구조 및 최소 문제 수 검증
      if (
        !quiz ||
        !Array.isArray(quiz.questions) ||
        quiz.questions.length < totalQuestions ||
        !quiz.questions.every(validQuestion)
      ) {
        showLoadError();
        return;
      }

      // 피셔-예이츠(Fisher-Yates) 알고리즘으로 문제 배열 무작위 셔플
      quizQuestions = [...quiz.questions];
      for (let i = quizQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quizQuestions[i], quizQuestions[j]] = [
          quizQuestions[j],
          quizQuestions[i],
        ];
      }

      // 지정된 문제 수(totalQuestions)만큼 절삭
      quizQuestions = quizQuestions.slice(0, totalQuestions);
      questionIndex = 0;
      responses = [];
      draftAnswer = null;

      // 이전 결과 기록 삭제 및 신규 세션 저장
      removeStored(resultKey);
      saveProgress();
      showReady();
    })
    .fail(showLoadError);
}

// 보기 라디오 버튼 선택 변경 시 이벤트 리스너
$('.answer-option__input').on('change', function () {
  clearAnswerError();
  // 선택한 값('A','B','C','D')을 인덱스(0, 1, 2, 3)로 환산하여 draftAnswer에 임시 저장
  draftAnswer = 'ABCD'.indexOf(this.value);
  saveProgress();
});

// 데이터 로드 실패 시 재시도 버튼 클릭 리스너
$('.quiz-retry').on('click', loadQuestions);

// 퀴즈 폼 제출(Submit) 이벤트 핸들러
$('.quiz-form').on('submit', function (event) {
  event.preventDefault();
  if (!quizQuestions.length) return;

  // [상태 1] 이미 답안 제출 후 피드백이 표시된 상태: "Next Question" 또는 "View Results" 클릭 시
  if (answered) {
    // 마지막 문제인 경우: 전체 점수 계산 및 결과 페이지 이동
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

      // 결과 저장 실패 처리
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

      // 임시 진행 데이터 삭제 후 결과 페이지로 리다이렉트
      removeStored(progressKey);
      location.href = './score.html';
      return;
    }

    // 다음 문제로 넘어가기
    questionIndex++;
    draftAnswer = null;
    renderQuestion();
    saveProgress();
    // 스크린 리더 초점 이동: 다음 문제 제목에 포커스를 주어 시각/음성 안내 동기화
    $('h1.quiz-question').attr('tabindex', '-1').trigger('focus');
    return;
  }

  // [상태 2] 답안 제출(채점) 단계
  const selectedValue = $('.answer-option__input:checked').val();
  const selectedIndex = 'ABCD'.indexOf(selectedValue ?? '');

  // 보기를 선택하지 않고 제출한 경우 유효성 에러 처리
  if (!selectedValue || !validChoice(selectedIndex)) {
    showAnswerError();
    return;
  }

  clearAnswerError();
  responses.push(selectedIndex); // 사용자 응답 확정 기록
  draftAnswer = null;
  answered = true;
  showFeedback(); // 채점 UI 표시
  saveProgress();
});

/**
 * 현재 인덱스(questionIndex)에 해당하는 문제를 화면에 바인딩
 */
function renderQuestion() {
  clearAnswerError();
  answered = false;
  const question = quizQuestions[questionIndex];

  // XSS 방지 및 특수문자 안전 처리를 위해 .html() 대신 .text() 사용
  $('h1.quiz-question').text(question.question);

  // 4개 보기 초기화 및 텍스트/속성 세팅
  $('.answer-options .answer-option').each(function (index) {
    const $option = $(this);
    // 이전 피드백 스타일 클래스 제거
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

  // 문항 번호 및 버튼 초기화
  $('.quiz-counter').text(
    'Question ' + (questionIndex + 1) + ' of ' + totalQuestions,
  );
  $('.quiz-submit').text('Submit Answer').prop('disabled', false);
  $('.quiz-feedback').text('');
  updateProgress(questionIndex + 1);
}

/**
 * 진행률 표시 바(Progress Bar) 상태 업데이트
 * @param {number} currentQuestion - 현재 문제 번호 (1부터 시작)
 */
function updateProgress(currentQuestion) {
  $('.quiz-progress')
    .attr('max', totalQuestions)
    .attr('value', currentQuestion)
    .attr('aria-label', 'Current question')
    .text(currentQuestion + ' of ' + totalQuestions);
}

// 애플리케이션 시작 지점(Entry Point):
// 1. 유효하지 않은 topic 파라미터인 경우 홈으로 리다이렉트
// 2. 저장된 진행 내역이 있으면 복원 후 표시
// 3. 없으면 데이터 파일(data.json)을 새로 호출하여 퀴즈 시작
if (!Object.hasOwn(topicKeys, selectedTopic)) {
  location.replace('./index.html');
} else if (restoreProgress()) {
  showReady();
} else {
  loadQuestions();
}