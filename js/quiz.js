// StudyFlow Quiz Maker & Taker Module
import storage from './storage.js';

let activeQuiz = null;
let currentQuestionIndex = 0;
let selectedOption = null;
let answeredCount = 0;
let correctCount = 0;
let isQuestionAnswered = false;

// Active quiz creation state
let creatorQuestions = [];

export const QuizModule = {
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.render();
  },

  cacheDOM() {
    this.quizListEl = document.getElementById('quiz-list');
    this.quizTakerEl = document.getElementById('quiz-taker');
    this.createQuizBtn = document.getElementById('create-quiz-btn');
    
    // Quiz Creator Elements
    this.quizCreatorModal = document.getElementById('quiz-creator-modal');
    this.quizCreatorForm = document.getElementById('quiz-creator-form');
    this.quizTitleInput = document.getElementById('quiz-title-input');
    this.quizDescInput = document.getElementById('quiz-desc-input');
    this.creatorQuestionsList = document.getElementById('creator-questions-list');
    this.addQuestionBtn = document.getElementById('add-question-btn');
    this.closeQuizModal = document.getElementById('close-quiz-modal');

    // Reminder Simulator Elements
    this.scheduleReminderBtn = document.getElementById('schedule-reminder-btn');
    this.reminderQuizSelect = document.getElementById('reminder-quiz-select');
    this.reminderTimeSelect = document.getElementById('reminder-time-select');
  },

  bindEvents() {
    if (this.createQuizBtn) {
      this.createQuizBtn.addEventListener('click', () => this.openQuizCreator());
    }

    if (this.closeQuizModal) {
      this.closeQuizModal.addEventListener('click', () => {
        this.quizCreatorModal.classList.remove('active');
      });
    }

    if (this.addQuestionBtn) {
      this.addQuestionBtn.addEventListener('click', () => this.addQuestionToCreatorForm());
    }

    if (this.quizCreatorForm) {
      this.quizCreatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveQuiz();
      });
    }

    if (this.scheduleReminderBtn) {
      this.scheduleReminderBtn.addEventListener('click', () => this.scheduleReminder());
    }
  },

  render() {
    this.renderQuizList();
    this.populateReminderSelect();
  },

  renderQuizList() {
    if (!this.quizListEl) return;
    const quizzes = storage.getQuizzes();
    this.quizListEl.innerHTML = '';

    if (quizzes.length === 0) {
      this.quizListEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
          <svg style="width:48px; height:48px; margin-bottom:1rem; opacity:0.4;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>No quizzes available yet. Create one to test your learning!</p>
        </div>
      `;
      return;
    }

    quizzes.forEach(quiz => {
      const cardEl = document.createElement('div');
      cardEl.className = 'glass-card quiz-card';
      cardEl.innerHTML = `
        <div>
          <div class="quiz-card-header">
            <div class="quiz-card-title">${this.escapeHTML(quiz.title)}</div>
            <span class="badge badge-medium">${quiz.questions.length} Qs</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1.5rem;">
            ${this.escapeHTML(quiz.description || 'No description provided')}
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary start-quiz-btn" data-id="${quiz.id}" style="flex: 1; padding: 0.5rem 1rem; font-size: 0.85rem;">Take Quiz</button>
          <button class="btn btn-secondary delete-quiz-btn" data-id="${quiz.id}" style="padding: 0.5rem;" title="Delete Quiz">
            <svg style="width:16px; height:16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `;

      cardEl.querySelector('.start-quiz-btn').addEventListener('click', () => {
        this.startQuiz(quiz.id);
      });

      cardEl.querySelector('.delete-quiz-btn').addEventListener('click', () => {
        this.deleteQuiz(quiz.id);
      });

      this.quizListEl.appendChild(cardEl);
    });
  },

  deleteQuiz(id) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    const quizzes = storage.getQuizzes();
    const filtered = quizzes.filter(q => q.id !== id);
    storage.saveQuizzes(filtered);
    this.render();
  },

  populateReminderSelect() {
    if (!this.reminderQuizSelect) return;
    const quizzes = storage.getQuizzes();
    this.reminderQuizSelect.innerHTML = '<option value="" disabled selected>Choose Quiz</option>';
    quizzes.forEach(q => {
      const option = document.createElement('option');
      option.value = q.id;
      option.textContent = q.title;
      this.reminderQuizSelect.appendChild(option);
    });
  },

  openQuizCreator() {
    this.quizTitleInput.value = '';
    this.quizDescInput.value = '';
    creatorQuestions = [];
    this.creatorQuestionsList.innerHTML = '';
    this.addQuestionToCreatorForm(); // Start with 1 question block
    this.quizCreatorModal.classList.add('active');
  },

  addQuestionToCreatorForm() {
    const qIndex = creatorQuestions.length;
    creatorQuestions.push({
      question: '',
      options: ['', '', '', ''],
      answer: 0,
      explanation: ''
    });

    const qBlock = document.createElement('div');
    qBlock.className = 'question-creator-card';
    qBlock.dataset.index = qIndex;
    qBlock.innerHTML = `
      <div class="question-creator-header">
        <h4 style="color: #818cf8;">Question ${qIndex + 1}</h4>
        ${qIndex > 0 ? `
          <button type="button" class="btn-icon remove-q-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            Remove
          </button>
        ` : ''}
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div>
          <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:4px;">Question text</label>
          <input type="text" class="glass-input q-text-input" placeholder="e.g. What is Active Recall?" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <div>
            <label style="font-size:0.75rem; color:var(--text-muted);">Option A</label>
            <input type="text" class="glass-input q-opt-input" data-opt="0" placeholder="Option A" required>
          </div>
          <div>
            <label style="font-size:0.75rem; color:var(--text-muted);">Option B</label>
            <input type="text" class="glass-input q-opt-input" data-opt="1" placeholder="Option B" required>
          </div>
          <div>
            <label style="font-size:0.75rem; color:var(--text-muted);">Option C</label>
            <input type="text" class="glass-input q-opt-input" data-opt="2" placeholder="Option C" required>
          </div>
          <div>
            <label style="font-size:0.75rem; color:var(--text-muted);">Option D</label>
            <input type="text" class="glass-input q-opt-input" data-opt="3" placeholder="Option D" required>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <div>
            <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:4px;">Correct Answer</label>
            <select class="glass-select q-correct-select" style="width:100%;">
              <option value="0">Option A</option>
              <option value="1">Option B</option>
              <option value="2">Option C</option>
              <option value="3">Option D</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:4px;">Explanation (Optional)</label>
            <input type="text" class="glass-input q-exp-input" placeholder="Why is this correct?">
          </div>
        </div>
      </div>
    `;

    const removeBtn = qBlock.querySelector('.remove-q-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        qBlock.remove();
        // Remove from creatorQuestions array
        creatorQuestions.splice(qIndex, 1);
        this.reindexCreatorFormBlocks();
      });
    }

    this.creatorQuestionsList.appendChild(qBlock);
  },

  reindexCreatorFormBlocks() {
    const cards = this.creatorQuestionsList.querySelectorAll('.question-creator-card');
    cards.forEach((card, idx) => {
      card.dataset.index = idx;
      card.querySelector('h4').textContent = `Question ${idx + 1}`;
    });
  },

  saveQuiz() {
    const title = this.quizTitleInput.value.trim();
    const description = this.quizDescInput.value.trim();
    if (!title) return;

    const cards = this.creatorQuestionsList.querySelectorAll('.question-creator-card');
    const questions = [];

    cards.forEach(card => {
      const qText = card.querySelector('.q-text-input').value.trim();
      const options = Array.from(card.querySelectorAll('.q-opt-input')).map(input => input.value.trim());
      const answer = parseInt(card.querySelector('.q-correct-select').value, 10);
      const explanation = card.querySelector('.q-exp-input').value.trim();

      questions.push({
        question: qText,
        options,
        answer,
        explanation
      });
    });

    if (questions.length === 0) {
      alert('A quiz must have at least one question.');
      return;
    }

    const newQuiz = {
      id: 'quiz_' + Date.now(),
      title,
      description,
      questions
    };

    const quizzes = storage.getQuizzes();
    quizzes.push(newQuiz);
    storage.saveQuizzes(quizzes);

    this.quizCreatorModal.classList.remove('active');
    this.render();
  },

  /* Quiz Taker Module */
  startQuiz(quizId) {
    const quizzes = storage.getQuizzes();
    activeQuiz = quizzes.find(q => q.id === quizId);
    if (!activeQuiz) return;

    currentQuestionIndex = 0;
    selectedOption = null;
    answeredCount = 0;
    correctCount = 0;
    isQuestionAnswered = false;

    // Toggle views: hide list, show quiz taker container
    this.quizListEl.style.display = 'none';
    this.createQuizBtn.style.display = 'none';
    
    // Hide reminder panel
    const reminderCard = document.querySelector('.quiz-reminder-card');
    if (reminderCard) reminderCard.style.display = 'none';

    this.quizTakerEl.style.display = 'block';
    this.renderQuestion();
  },

  renderQuestion() {
    if (!activeQuiz || !this.quizTakerEl) return;

    const question = activeQuiz.questions[currentQuestionIndex];
    const totalQs = activeQuiz.questions.length;
    const progressPercent = (currentQuestionIndex / totalQs) * 100;

    this.quizTakerEl.innerHTML = `
      <div class="quiz-taker-wrapper">
        <div class="quiz-progress-section">
          <div>
            <h3 style="font-family: var(--font-heading);">${this.escapeHTML(activeQuiz.title)}</h3>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">Question ${currentQuestionIndex + 1} of ${totalQs}</span>
          </div>
          <button class="btn btn-secondary" id="exit-quiz-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Exit Quiz</button>
        </div>

        <div class="study-progress" style="margin-bottom: 2rem;">
          <div class="study-progress-bar" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="quiz-question-box">
          <div class="quiz-question-text">${this.escapeHTML(question.question)}</div>
          
          <div class="quiz-options-list">
            ${question.options.map((opt, idx) => `
              <div class="quiz-option" data-idx="${idx}">
                <div class="quiz-option-letter">${String.fromCharCode(65 + idx)}</div>
                <div class="quiz-option-text">${this.escapeHTML(opt)}</div>
              </div>
            `).join('')}
          </div>
          
          <div id="quiz-explanation" class="quiz-explanation-box" style="display: none;">
            <strong>Explanation:</strong> ${this.escapeHTML(question.explanation || 'The answer shown is correct.')}
          </div>
        </div>

        <div style="text-align: right;">
          <button class="btn btn-primary" id="quiz-action-btn" disabled>Submit Answer</button>
        </div>
      </div>
    `;

    // Bind item click
    const options = this.quizTakerEl.querySelectorAll('.quiz-option');
    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        if (isQuestionAnswered) return;
        
        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedOption = parseInt(opt.dataset.idx, 10);

        const actBtn = document.getElementById('quiz-action-btn');
        if (actBtn) actBtn.removeAttribute('disabled');
      });
    });

    // Exit Button
    document.getElementById('exit-quiz-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to exit the quiz? Progress will not be saved.')) {
        this.exitQuiz();
      }
    });

    // Action button submission
    document.getElementById('quiz-action-btn').addEventListener('click', () => {
      this.handleAction();
    });
  },

  handleAction() {
    const question = activeQuiz.questions[currentQuestionIndex];
    const totalQs = activeQuiz.questions.length;
    const actBtn = document.getElementById('quiz-action-btn');

    if (!isQuestionAnswered) {
      // User is submitting an answer
      isQuestionAnswered = true;
      const options = this.quizTakerEl.querySelectorAll('.quiz-option');
      
      // Feedback Colors
      options.forEach(opt => {
        const idx = parseInt(opt.dataset.idx, 10);
        if (idx === question.answer) {
          opt.classList.add('correct');
        } else if (idx === selectedOption) {
          opt.classList.add('incorrect');
        }
        opt.classList.remove('selected');
      });

      if (selectedOption === question.answer) {
        correctCount++;
      }
      answeredCount++;

      // Show explanation
      const expBox = document.getElementById('quiz-explanation');
      if (expBox) expBox.style.display = 'block';

      if (actBtn) {
        actBtn.textContent = currentQuestionIndex === totalQs - 1 ? 'Finish Quiz' : 'Next Question';
      }
    } else {
      // User is moving to the next question
      currentQuestionIndex++;
      if (currentQuestionIndex < totalQs) {
        selectedOption = null;
        isQuestionAnswered = false;
        this.renderQuestion();
      } else {
        this.showQuizResult();
      }
    }
  },

  showQuizResult() {
    if (!this.quizTakerEl) return;
    const totalQs = activeQuiz.questions.length;
    const percent = Math.round((correctCount / totalQs) * 100);

    storage.incrementStat('quizzesTaken');

    this.quizTakerEl.innerHTML = `
      <div class="glass-card quiz-taker-wrapper" style="text-align: center; padding: 3rem; animation: fadeIn 0.4s ease;">
        <h2 style="font-family: var(--font-heading); margin-bottom: 1rem;">Quiz Completed!</h2>
        <p style="color: var(--text-secondary);">${this.escapeHTML(activeQuiz.title)}</p>
        
        <div class="quiz-result-score">${percent}%</div>
        
        <p style="font-size: 1.1rem; margin-bottom: 2rem;">
          You got <strong>${correctCount}</strong> out of <strong>${totalQs}</strong> questions correct!
        </p>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn btn-primary" id="retry-quiz-btn">Try Again</button>
          <button class="btn btn-secondary" id="exit-result-btn">Back to Quizzes</button>
        </div>
      </div>
    `;

    document.getElementById('retry-quiz-btn').addEventListener('click', () => {
      this.startQuiz(activeQuiz.id);
    });

    document.getElementById('exit-result-btn').addEventListener('click', () => {
      this.exitQuiz();
    });

    document.dispatchEvent(new CustomEvent('quizCompleted'));
  },

  exitQuiz() {
    this.quizTakerEl.style.display = 'none';
    this.quizListEl.style.display = 'grid';
    this.createQuizBtn.style.display = 'inline-flex';
    
    // Show reminder panel
    const reminderCard = document.querySelector('.quiz-reminder-card');
    if (reminderCard) reminderCard.style.display = 'block';

    activeQuiz = null;
    this.render();
  },

  /* Reminder Toast Simulation */
  scheduleReminder() {
    const quizId = this.reminderQuizSelect.value;
    const delay = parseInt(this.reminderTimeSelect.value, 10);

    if (!quizId) {
      alert('Please select a quiz to schedule a reminder!');
      return;
    }

    const quizzes = storage.getQuizzes();
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    alert(`Quiz reminder scheduled for "${quiz.title}" in ${delay} seconds! Feel free to explore other pages; the notification alert will pop up.`);

    setTimeout(() => {
      this.triggerReminderAlert(quiz);
    }, delay * 1000);
  },

  triggerReminderAlert(quiz) {
    // Create an elegant float-in notification banner at the top of the body
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid var(--accent-indigo);
      border-radius: 16px;
      padding: 1.25rem;
      color: white;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.25);
      z-index: 1000;
      width: 320px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      animation: slideInRight 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
    `;

    toast.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span style="font-weight: 700; color: #818cf8; font-family: var(--font-heading);">⏰ Quiz Reminder</span>
        <button id="close-toast-btn" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem; line-height:1;">&times;</button>
      </div>
      <div style="font-size: 0.9rem; font-weight: 600;">Time to test your knowledge!</div>
      <div style="font-size: 0.8rem; color: var(--text-secondary);">${this.escapeHTML(quiz.title)}</div>
      <button class="btn btn-primary" id="take-reminded-quiz-btn" style="padding: 0.4rem; font-size: 0.8rem; margin-top: 4px;">Start Quiz Now</button>
    `;

    // Add keyframes for slideInRight if not present
    if (!document.getElementById('slidein-keyframes')) {
      const style = document.createElement('style');
      style.id = 'slidein-keyframes';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Audio beep notification
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}

    const closeToast = () => {
      toast.style.animation = 'slideInRight 0.3s reverse forwards';
      setTimeout(() => { toast.remove(); }, 300);
    };

    toast.querySelector('#close-toast-btn').addEventListener('click', closeToast);

    toast.querySelector('#take-reminded-quiz-btn').addEventListener('click', () => {
      closeToast();
      // Route to Quiz View
      window.location.hash = '#quiz';
      // Start the quiz
      setTimeout(() => {
        this.startQuiz(quiz.id);
      }, 100);
    });
  },

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
export default QuizModule;
