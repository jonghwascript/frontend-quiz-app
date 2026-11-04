(function () {
  /**
   * 단일 문제 객체의 유효성을 검사합니다.
   * - question 객체 존재 여부
   * - question.question 텍스트가 문자열인지 확인
   * - question.options 배열이며 길이가 정확히 4개인지 확인
   * - 모든 보기가 문자열인지 확인
   * - 정답(question.answer)이 보기 목록에 포함되어 있는지 확인
   * @param {Object} question - 검사할 문제 객체
   * @returns {boolean} 유효 여부
   */
  function isValidQuestion(question) {
    return (
      question &&
      typeof question.question === 'string' &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.options.every((option) => typeof option === 'string') &&
      question.options.includes(question.answer)
    );
  }

  /**
   * 사용자가 선택한 보기 인덱스의 유효성을 검사합니다.
   * - 0 이상 3 이하의 정수(4지선다 기준)인지 확인
   * @param {number} choice - 선택지 인덱스
   * @returns {boolean} 유효 여부
   */
  function isValidChoice(choice) {
    return Number.isInteger(choice) && choice >= 0 && choice < 4;
  }

  /**
   * 문제 목록을 피셔-예이츠(Fisher-Yates) 알고리즘으로 무작위 셔플한 뒤,
   * 설정된 문제 수(totalQuestions)만큼 잘라내어 반환합니다.
   * @param {Array<Object>} questions - 전체 문제 배열
   * @returns {Array<Object>} 무작위로 추출된 문제 배열
   */
  function shuffleQuestions(questions) {
    // 원본 배열 불변성 유지를 위해 얕은 복사
    const shuffled = [...questions];

    // 배열 끝에서부터 역순으로 순회하며 무작위 요소와 교환
    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [
        shuffled[randomIndex],
        shuffled[index],
      ];
    }

    // 필요한 문제 개수만큼 반환
    return shuffled.slice(0, totalQuestions);
  }

  /**
   * 외부 JSON 데이터 파일에서 특정 주제의 퀴즈를 불러오고 검증 후 섞어서 반환합니다.
   * @param {string} topic - 불러올 퀴즈 주제명
   * @returns {Promise<Array<Object>>} 검증 및 셔플 완료된 문제 목록 프로미스
   */
  function load(topic) {
    return $.ajax({ url: './data.json', dataType: 'json', timeout: 15000 }).then(
      function (data) {
        // 데이터 내 quizzes 배열에서 요청한 topic과 일치하는 퀴즈 검색
        const quiz =
          data && Array.isArray(data.quizzes)
            ? data.quizzes.find((item) => item && item.title === topic)
            : null;

        // 퀴즈 데이터의 구조 및 최소 문제 수, 각 문제의 유효성 검증
        if (
          !quiz ||
          !Array.isArray(quiz.questions) ||
          quiz.questions.length < totalQuestions ||
          !quiz.questions.every(isValidQuestion)
        ) {
          throw new Error('Invalid quiz data');
        }

        // 문제 셔플 후 반환
        return shuffleQuestions(quiz.questions);
      },
    );
  }

  /**
   * 로컬 스토리지 등에 저장된 이전 진행 상황을 복구하고 무결성을 검증합니다.
   * @param {string} topic - 현재 진행 중인 퀴즈 주제명
   * @returns {Object|null} 유효한 저장 데이터 또는 유효하지 않을 경우 null
   */
  function restoreProgress(topic) {
    const saved = readStored(progressKey);

    // 복구 데이터 무결성 검증:
    // 1. 데이터 존재 여부 및 주제 일치 확인
    // 2. 문제 목록 배열 여부, 개수, 각 문제 구조 유효성
    // 3. 현재 문제 인덱스 범위 확인 (0 <= index < totalQuestions)
    // 4. 응답 배열 및 각 응답 선택지 유효성 확인
    // 5. 응답 수와 현재 인덱스 간의 정합성 확인 (답변 대기 중 또는 이미 제출 완료 상태)
    // 6. 임시 선택값(draft)이 존재한다면 유효한 선택지인지 확인
    if (
      !saved ||
      saved.topic !== topic ||
      !Array.isArray(saved.questions) ||
      saved.questions.length !== totalQuestions ||
      !saved.questions.every(isValidQuestion) ||
      !Number.isInteger(saved.index) ||
      saved.index < 0 ||
      saved.index >= totalQuestions ||
      !Array.isArray(saved.responses) ||
      !saved.responses.every(isValidChoice) ||
      (saved.responses.length !== saved.index &&
        saved.responses.length !== saved.index + 1) ||
      (saved.draft !== null && !isValidChoice(saved.draft))
    ) {
      return null;
    }

    return saved;
  }

  /**
   * 현재 퀴즈 진행 상태(문제 목록, 현재 인덱스, 제출 응답, 임시 선택값)를 저장소에 기록합니다.
   * @param {string} topic - 퀴즈 주제명
   * @param {Object} state - 진행 상태 객체
   */
  function saveProgress(topic, state) {
    return writeStored(progressKey, {
      topic,
      questions: state.questions,
      index: state.index,
      responses: state.responses,
      draft: state.draft,
    });
  }

  /**
   * 퀴즈 완료 결과를 저장소에 기록합니다.
   * @param {string} topic - 퀴즈 주제명
   * @param {number} score - 최종 점수
   */
  function saveResult(topic, score) {
    return writeStored(resultKey, { topic, score });
  }

  // 외부(전역)에서 데이터 모듈에 접근할 수 있도록 API를 불변 객체로 공개
  window.quizQuestionData = Object.freeze({
    // 저장된 진행 상태 삭제
    clearProgress: function () {
      removeStored(progressKey);
    },
    // 저장된 최종 결과 삭제
    clearResult: function () {
      removeStored(resultKey);
    },
    isValidChoice,
    load,
    restoreProgress,
    saveProgress,
    saveResult,
  });
})();