(function () {
  const { topics, questions } = window.IPAS_QUIZ_DATA;
  const LETTERS = ["A", "B", "C", "D"];

  const state = {
    studentName: "",
    selectedTopic: "ALL",
    mode: "practice", // "practice" | "exam"
    activeQuestions: [],
    currentIndex: 0,
    answers: {} // questionId -> optionIndex
  };

  const setupScreen = document.getElementById("setup-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const resultScreen = document.getElementById("result-screen");
  const summaryPanel = document.getElementById("summary-panel");

  const studentNameInput = document.getElementById("student-name");
  const topicPills = document.querySelectorAll("[data-topic]");
  const modePills = document.querySelectorAll("[data-mode]");
  const startBtn = document.getElementById("start-btn");
  const toggleSummaryBtn = document.getElementById("toggle-summary-btn");

  const topicTag = document.getElementById("topic-tag");
  const questionCounter = document.getElementById("question-counter");
  const progressFill = document.getElementById("progress-fill");
  const questionText = document.getElementById("question-text");
  const answersList = document.getElementById("answers-list");
  const feedbackBox = document.getElementById("feedback-box");
  const questionNav = document.getElementById("question-nav");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const finishBtn = document.getElementById("finish-btn");

  const resultGreeting = document.getElementById("result-greeting");
  const scoreValue = document.getElementById("score-value");
  const correctCountEl = document.getElementById("correct-count");
  const wrongCountEl = document.getElementById("wrong-count");
  const predicateEl = document.getElementById("predicate-value");
  const topicBreakdownEl = document.getElementById("topic-breakdown");
  const reviewListEl = document.getElementById("review-list");
  const retryBtn = document.getElementById("retry-btn");
  const homeBtn = document.getElementById("home-btn");
  const printBtn = document.getElementById("print-btn");

  function setActivePill(group, key, value) {
    group.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset[key] === value);
    });
  }

  topicPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedTopic = btn.dataset.topic;
      setActivePill(topicPills, "topic", state.selectedTopic);
    });
  });

  modePills.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      setActivePill(modePills, "mode", state.mode);
    });
  });

  toggleSummaryBtn.addEventListener("click", () => {
    const isHidden = summaryPanel.classList.toggle("hidden");
    toggleSummaryBtn.textContent = isHidden
      ? "Lihat Ringkasan Materi"
      : "Tutup Ringkasan Materi";
  });

  function showScreen(screen) {
    [setupScreen, quizScreen, resultScreen].forEach((el) => el.classList.add("hidden"));
    screen.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startQuiz() {
    state.studentName = studentNameInput.value.trim();
    state.activeQuestions =
      state.selectedTopic === "ALL"
        ? questions.slice()
        : questions.filter((q) => q.topic === state.selectedTopic);
    state.currentIndex = 0;
    state.answers = {};
    showScreen(quizScreen);
    renderQuestion();
  }

  function renderNavDots() {
    questionNav.innerHTML = "";
    state.activeQuestions.forEach((q, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "nav-dot";
      dot.textContent = String(idx + 1);
      if (idx === state.currentIndex) dot.classList.add("current");
      if (state.answers[q.id] !== undefined) dot.classList.add("answered");
      dot.addEventListener("click", () => {
        state.currentIndex = idx;
        renderQuestion();
      });
      questionNav.appendChild(dot);
    });
  }

  function renderQuestion() {
    const q = state.activeQuestions[state.currentIndex];
    const total = state.activeQuestions.length;
    const chosen = state.answers[q.id];
    const showImmediate = state.mode === "practice" && chosen !== undefined;

    topicTag.textContent = topics[q.topic];
    questionCounter.textContent = `Soal ${state.currentIndex + 1} dari ${total}`;
    const answeredCount = Object.keys(state.answers).length;
    progressFill.style.width = `${Math.round((answeredCount / total) * 100)}%`;
    questionText.textContent = `${state.currentIndex + 1}. ${q.question}`;

    answersList.innerHTML = "";
    q.options.forEach((optText, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn";

      if (showImmediate) {
        if (idx === q.answer) btn.classList.add("correct");
        else if (idx === chosen) btn.classList.add("wrong");
        btn.disabled = true;
      } else if (chosen === idx) {
        btn.classList.add("selected");
      }

      const letterSpan = document.createElement("span");
      letterSpan.className = "answer-letter";
      letterSpan.textContent = LETTERS[idx];

      const textSpan = document.createElement("span");
      textSpan.textContent = optText;

      btn.appendChild(letterSpan);
      btn.appendChild(textSpan);

      btn.addEventListener("click", () => {
        if (state.mode === "practice" && state.answers[q.id] !== undefined) return;
        state.answers[q.id] = idx;
        renderQuestion();
      });

      answersList.appendChild(btn);
    });

    if (showImmediate) {
      const isRight = chosen === q.answer;
      feedbackBox.className = `feedback-box ${isRight ? "ok" : "err"}`;
      feedbackBox.innerHTML = `<strong>${isRight ? "Benar!" : `Kurang tepat. Jawaban benar: ${LETTERS[q.answer]}.`}</strong><br>${q.explanation}`;
    } else {
      feedbackBox.className = "feedback-box hidden";
      feedbackBox.textContent = "";
    }

    prevBtn.disabled = state.currentIndex === 0;
    const isLast = state.currentIndex === total - 1;
    nextBtn.classList.toggle("hidden", isLast);
    finishBtn.classList.toggle("hidden", !isLast);

    renderNavDots();
  }

  function getPredicate(score) {
    if (score >= 90) return "Sangat Baik";
    if (score >= 80) return "Baik";
    if (score >= 70) return "Cukup";
    return "Perlu Bimbingan";
  }

  function finishQuiz() {
    const total = state.activeQuestions.length;
    const unanswered = state.activeQuestions.filter((q) => state.answers[q.id] === undefined).length;
    if (unanswered > 0) {
      const ok = window.confirm(
        `Masih ada ${unanswered} soal yang belum dijawab. Tetap selesaikan evaluasi sekarang?`
      );
      if (!ok) return;
    }

    let correct = 0;
    const perTopic = {};

    state.activeQuestions.forEach((q) => {
      if (!perTopic[q.topic]) perTopic[q.topic] = { total: 0, correct: 0 };
      perTopic[q.topic].total += 1;
      if (state.answers[q.id] === q.answer) {
        correct += 1;
        perTopic[q.topic].correct += 1;
      }
    });

    const wrong = total - correct;
    const score = Math.round((correct / total) * 100);
    const nameLabel = state.studentName ? `Hebat, ${state.studentName}!` : "Evaluasi Selesai!";

    resultGreeting.textContent = `${nameLabel} Berikut hasil evaluasi IPAS Bab 1 milikmu.`;
    scoreValue.textContent = String(score);
    correctCountEl.textContent = String(correct);
    wrongCountEl.textContent = String(wrong);
    predicateEl.textContent = getPredicate(score);

    topicBreakdownEl.innerHTML = "";
    Object.keys(perTopic).forEach((tKey) => {
      const item = perTopic[tKey];
      const pct = Math.round((item.correct / item.total) * 100);
      const row = document.createElement("div");
      row.className = "topic-row";
      row.innerHTML = `
        <div class="topic-row-head">
          <span>${topics[tKey]}</span>
          <span>${item.correct}/${item.total} benar (${pct}%)</span>
        </div>
        <div class="mini-track">
          <div class="mini-fill" style="width: ${pct}%"></div>
        </div>
      `;
      topicBreakdownEl.appendChild(row);
    });

    reviewListEl.innerHTML = "";
    state.activeQuestions.forEach((q, idx) => {
      const chosen = state.answers[q.id];
      const isRight = chosen === q.answer;
      const card = document.createElement("div");
      card.className = `review-item ${isRight ? "correct" : "wrong"}`;

      const chosenText =
        chosen !== undefined ? `${LETTERS[chosen]}. ${q.options[chosen]}` : "Tidak dijawab";
      const rightText = `${LETTERS[q.answer]}. ${q.options[q.answer]}`;

      card.innerHTML = `
        <div class="review-meta">${topics[q.topic]} • ${isRight ? "Benar" : "Salah"}</div>
        <p style="margin: 0 0 8px; font-weight: 600;">${idx + 1}. ${q.question.replace(/\n/g, "<br>")}</p>
        <p style="margin: 0 0 4px;"><strong>Jawabanmu:</strong> ${chosenText}</p>
        ${isRight ? "" : `<p style="margin: 0 0 4px;"><strong>Jawaban benar:</strong> ${rightText}</p>`}
        <p style="margin: 6px 0 0; color: #36503a;"><strong>Pembahasan:</strong> ${q.explanation}</p>
      `;
      reviewListEl.appendChild(card);
    });

    showScreen(resultScreen);
  }

  startBtn.addEventListener("click", startQuiz);
  prevBtn.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      renderQuestion();
    }
  });
  nextBtn.addEventListener("click", () => {
    if (state.currentIndex < state.activeQuestions.length - 1) {
      state.currentIndex += 1;
      renderQuestion();
    }
  });
  finishBtn.addEventListener("click", finishQuiz);
  retryBtn.addEventListener("click", startQuiz);
  homeBtn.addEventListener("click", () => showScreen(setupScreen));
  printBtn.addEventListener("click", () => window.print());
})();
