// StudyFlow Central App Manager & Router
import storage from './storage.js';
import TodoModule from './todo.js';
import PomodoroModule from './pomodoro.js';
import FlashcardsModule from './flashcards.js';
import NotesModule from './notes.js';
import QuizModule from './quiz.js';

const MOTIVATIONAL_QUOTES = [
  { text: "If you want to master a concept, explain it in simple terms as if to a child.", author: "Richard Feynman" },
  { text: "Memory decay is steepest in the first hours. Review your notes shortly after studying.", author: "Hermann Ebbinghaus" },
  { text: "Passive highlighting leads to an illusion of competence. Use Active Recall instead.", author: "Cognitive Science Research" },
  { text: "The secret of getting ahead is getting started. Focus on one single task today.", author: "Mark Twain" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Spaced review resets the forgetting curve, building durable long-term storage.", author: "Study Science" },
  { text: "Deep work happens when distractions are zeroed. Silence your device now.", author: "Cal Newport" }
];

export const App = {
  init() {
    // 1. Initialize DB seeds
    storage.init();

    // 2. Initialize sub-modules
    TodoModule.init();
    PomodoroModule.init();
    FlashcardsModule.init();
    NotesModule.init();
    QuizModule.init();

    this.cacheDOM();
    this.bindEvents();
    
    // 3. Set up Router & load current view
    this.handleRouting();
    
    // 4. Render initial dashboard
    this.renderDashboard();
  },

  cacheDOM() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.views = document.querySelectorAll('.view-container');
    
    // Dashboard widgets
    this.statsFocusMinutes = document.getElementById('dash-stat-minutes');
    this.statsCardsReviewed = document.getElementById('dash-stat-cards');
    this.statsQuizzesTaken = document.getElementById('dash-stat-quizzes');
    
    this.dashTaskProgressText = document.getElementById('dash-task-progress-text');
    this.dashTaskProgressBar = document.getElementById('dash-task-progress-bar');
    this.dashNextTaskBox = document.getElementById('dash-next-task-box');
    this.dashQuoteText = document.getElementById('dash-quote-text');
    this.dashQuoteAuthor = document.getElementById('dash-quote-author');
  },

  bindEvents() {
    // Listen to hash shifts
    window.addEventListener('hashchange', () => this.handleRouting());

    // Listen to module actions to live-update the dashboard
    document.addEventListener('todoUpdated', () => this.renderDashboard());
    document.addEventListener('pomodoroCompleted', () => this.renderDashboard());
    document.addEventListener('quizCompleted', () => this.renderDashboard());
  },

  handleRouting() {
    const hash = window.location.hash || '#dashboard';
    const viewId = hash.replace('#', '') + '-view';

    // 1. Highlight nav menu items
    this.navItems.forEach(item => {
      item.classList.remove('active');
      const link = item.querySelector('a');
      if (link && link.getAttribute('href') === hash) {
        item.classList.add('active');
      }
    });

    // 2. Toggle active views
    let viewFound = false;
    this.views.forEach(view => {
      view.classList.remove('active');
      if (view.id === viewId) {
        view.classList.add('active');
        viewFound = true;
      }
    });

    // Fallback if view doesn't exist
    if (!viewFound) {
      const dbView = document.getElementById('dashboard-view');
      if (dbView) dbView.classList.add('active');
    }

    // 3. Special actions on entering views
    if (hash === '#dashboard') {
      this.renderDashboard();
    } else if (hash === '#todo') {
      TodoModule.render();
    } else if (hash === '#notes') {
      NotesModule.loadNotes();
    } else if (hash === '#flashcards') {
      FlashcardsModule.loadDecks();
    } else if (hash === '#quiz') {
      QuizModule.render();
    }
  },

  renderDashboard() {
    const stats = storage.getStats();
    
    // Update simple stat widgets
    if (this.statsFocusMinutes) this.statsFocusMinutes.textContent = `${stats.pomodoroMinutes}m`;
    if (this.statsCardsReviewed) this.statsCardsReviewed.textContent = stats.cardsReviewed;
    if (this.statsQuizzesTaken) this.statsQuizzesTaken.textContent = stats.quizzesTaken;

    // Update daily task progress
    this.renderTaskProgressWidget();

    // Render Next Due Task Widget
    this.renderNextTaskWidget();

    // Render random quote of the day
    this.renderQuoteWidget();
  },

  renderTaskProgressWidget() {
    const todos = storage.getTodos();
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (this.dashTaskProgressText) {
      this.dashTaskProgressText.textContent = `${completed} / ${total} Tasks Completed (${percent}%)`;
    }

    if (this.dashTaskProgressBar) {
      this.dashTaskProgressBar.style.width = `${percent}%`;
    }
  },

  renderNextTaskWidget() {
    if (!this.dashNextTaskBox) return;

    const todos = storage.getTodos();
    const pending = todos.filter(t => !t.completed);

    if (pending.length === 0) {
      this.dashNextTaskBox.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem 0;">
          🎉 No pending tasks! Rest up or create new study goals in the task planner.
        </div>
      `;
      return;
    }

    // Sort by earliest due date
    pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const nextTask = pending[0];

    const today = new Date().toISOString().split('T')[0];
    const isOverdue = nextTask.dueDate < today;

    this.dashNextTaskBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary); margin-bottom: 4px;">
            ${this.escapeHTML(nextTask.text)}
          </div>
          <div style="font-size: 0.75rem; display: flex; gap: 0.5rem; align-items: center;">
            <span class="badge badge-${nextTask.priority}">${nextTask.priority.toUpperCase()}</span>
            <span style="color: var(--text-muted);">Due:</span>
            <span style="color: ${isOverdue ? 'var(--accent-rose)' : 'var(--text-secondary)'}; font-weight: 500;">
              ${nextTask.dueDate} ${isOverdue ? '(Overdue)' : ''}
            </span>
          </div>
        </div>
        <button class="btn btn-icon active" id="dash-complete-task-btn" data-id="${nextTask.id}" title="Complete Task" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.25); color: #34d399;">
          <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    `;

    document.getElementById('dash-complete-task-btn').addEventListener('click', (e) => {
      const taskId = e.currentTarget.dataset.id;
      TodoModule.toggleTodo(taskId);
    });
  },

  renderQuoteWidget() {
    if (!this.dashQuoteText || !this.dashQuoteAuthor) return;

    // Pick a quote deterministically based on date (rotates daily)
    const day = new Date().getDate();
    const quoteIndex = day % MOTIVATIONAL_QUOTES.length;
    const quote = MOTIVATIONAL_QUOTES[quoteIndex];

    this.dashQuoteText.textContent = `"${quote.text}"`;
    this.dashQuoteAuthor.textContent = `— ${quote.author}`;
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

// Start application when page loads
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

export default App;
