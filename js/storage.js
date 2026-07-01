// StudyFlow Storage Manager
const STORAGE_PREFIX = 'studyflow_';

// Initial Seed Data
const DEFAULT_TODOS = [
  {
    id: 'seed-todo-1',
    text: 'Explore StudyFlow features and check out the dashboard overview',
    completed: false,
    priority: 'high',
    category: 'General',
    dueDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'seed-todo-2',
    text: 'Review the Spaced Repetition flashcard deck',
    completed: false,
    priority: 'medium',
    category: 'Study Tech',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow
  },
  {
    id: 'seed-todo-3',
    text: 'Complete the 10-question Effective Study Techniques quiz',
    completed: false,
    priority: 'high',
    category: 'Quizzes',
    dueDate: new Date().toISOString().split('T')[0]
  }
];

const DEFAULT_DECKS = [
  {
    id: 'seed-deck-1',
    name: 'Effective Learning Methods',
    description: 'Core concepts of cognitive science and learning methodologies.',
    cards: [
      {
        id: 'seed-card-1',
        front: 'What is Spaced Repetition?',
        back: 'A learning technique where reviews are spaced at increasing intervals (e.g., 1 day, 3 days, 7 days) to exploit the psychological spacing effect and consolidate long-term memory.'
      },
      {
        id: 'seed-card-2',
        front: 'What is Active Recall?',
        back: 'A highly efficient testing process where you actively retrieve information from your memory (e.g. using flashcards or practice questions) instead of passively re-reading text.'
      },
      {
        id: 'seed-card-3',
        front: 'Explain the Feynman Technique.',
        back: 'A four-step method to understand any topic: (1) Choose a concept, (2) Teach it to a child/beginner, (3) Identify gaps in your explanation and go back to resources, (4) Simplify and use analogies.'
      },
      {
        id: 'seed-card-4',
        front: 'What is the "Ebbinghaus Forgetting Curve"?',
        back: 'A mathematical curve showing how information is lost over time when there is no attempt to retain it. It demonstrates that memory decay is steepest in the first hours/days.'
      },
      {
        id: 'seed-card-5',
        front: 'What is Pomodoro technique?',
        back: 'A time management system developed by Francesco Cirillo. It uses a timer to break work down into intervals (traditionally 25 minutes), separated by short breaks (5 minutes).'
      }
    ]
  }
];

const DEFAULT_NOTES = [
  {
    id: 'seed-note-1',
    title: 'Study Session Playbook',
    content: `# Study Session Playbook

Welcome to your **StudyFlow Notebook**! This editor supports Markdown syntax.

## Golden Rules of High-Efficiency Studying
1. **Ditch Highlighting**: Studies show passive highlighting yields almost no long-term retention.
2. **Prioritize Active Retrieval**: Do practice questions, write summaries from memory, or use the flashcard tab.
3. **Rest & Consolidate**: Sleep is when memory consolidation occurs. Never skip sleep to cram!

## Markdown Formatting Cheatsheet
* Use \`#\` for Title, \`##\` for Headings.
* Use \`**text**\` for bold, and \`*text*\` for italics.
* Create bullet points with \`*\` or lists with \`1.\`.
`,
    category: 'Meta Learning',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'seed-note-2',
    title: 'Focus Hacks & Pomodoro Tips',
    content: `# Focus Hacks & Pomodoro Tips

Getting the most out of your Pomodoro sessions:

### Before Starting:
* Turn off phone notifications and block distracting websites.
* Have water and study materials ready nearby.

### During Focus:
* Focus strictly on **one task**.
* If a random thought pops up, jot it down in your Todo list quickly and return to work immediately.

### During Breaks:
* Get up! Do not look at another screen.
* Stretch, walk around, or grab a drink. Let your brain enter "diffuse mode" thinking.
`,
    category: 'Productivity',
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_QUIZZES = [
  {
    id: 'seed-quiz-1',
    title: 'Effective Learning Science',
    description: 'A comprehensive 10-question quiz on how the human brain retains information.',
    questions: [
      {
        question: 'Which learning method has been scientifically proven to lead to the highest long-term retention?',
        options: [
          'Re-reading the textbook multiple times',
          'Highlighting and underlining key passages',
          'Self-testing and active recall',
          'Listening to audio recordings of lectures'
        ],
        answer: 2,
        explanation: 'Active recall (testing yourself) forces the brain to retrieve information, strengthening neural pathways far better than passive review methods like re-reading or highlighting.'
      },
      {
        question: 'What is the primary benefit of Spaced Repetition?',
        options: [
          'It allows you to memorize all details in a single study marathon.',
          'It combats the forgetting curve by reviewing information right before you would naturally forget it.',
          'It reduces the amount of sleep you need to consolidate memories.',
          'It ensures you only study subjects you already enjoy.'
        ],
        answer: 1,
        explanation: 'By spacing out reviews, you reinforce memory traces at the point of forgetting, resetting the decay curve and pushing the knowledge into long-term memory.'
      },
      {
        question: 'According to the Feynman Technique, how should you check if you truly understand a concept?',
        options: [
          'Try to explain it in simple terms to a child or beginner.',
          'Read the Wikipedia article on the subject twice.',
          'Write a 20-page essay using advanced technical jargon.',
          'Solve a math formula in your head without paper.'
        ],
        answer: 0,
        explanation: 'Teaching a beginner forces you to strip away complex terminology and jargon, highlighting the exact gaps in your own understanding.'
      },
      {
        question: 'During which phase of the sleep cycle does the brain primarily consolidate declarative (factual) memories?',
        options: [
          'REM sleep',
          'Light sleep',
          'Slow-wave (deep) sleep',
          'Stage 1 transition sleep'
        ],
        answer: 2,
        explanation: 'Slow-wave sleep (Deep Sleep) plays a crucial role in consolidating declarative memory, moving facts from the temporary hippocampus to the permanent neocortex.'
      },
      {
        question: 'What is the "Zeigarnik Effect" in productivity?',
        options: [
          'The tendency to complete tasks faster when listening to classical music.',
          'The tendency to remember uncompleted or interrupted tasks better than completed ones.',
          'The decrease in performance that occurs when multitasking.',
          'The phenomenon of feeling tired exactly 20 minutes after eating lunch.'
        ],
        answer: 1,
        explanation: 'The Zeigarnik Effect states that our brain retains a cognitive tension about open, unfinished tasks, which is why keeping a clean Todo list helps clear mental bandwidth.'
      },
      {
        question: 'What is the traditional duration of a single Pomodoro focus interval?',
        options: [
          '15 minutes',
          '25 minutes',
          '50 minutes',
          '90 minutes'
        ],
        answer: 1,
        explanation: 'The standard Pomodoro interval is 25 minutes of work followed by a 5-minute break. After 4 cycles, a longer break (15-30 minutes) is taken.'
      },
      {
        question: 'What type of cognitive load refers to the effort associated with a specific topic (e.g. the actual math formulas)?',
        options: [
          'Intrinsic cognitive load',
          'Extraneous cognitive load',
          'Germane cognitive load',
          'External cognitive load'
        ],
        answer: 0,
        explanation: 'Intrinsic load is the inherent difficulty of the learning material itself. Extraneous load is caused by bad presentation/distractions, and Germane load is the work put into creating schemas.'
      },
      {
        question: 'Which of the following is an example of interleaving?',
        options: [
          'Studying calculus for 6 hours straight on Monday.',
          'Alternating between studying algebra, biology, and chemistry in a single session.',
          'Reading one chapter while writing notes for another chapter at the same time.',
          'Reviewing flashcards only on weekends.'
        ],
        answer: 1,
        explanation: 'Interleaving involves mixing different topics or problem types during study, which trains the brain to choose the correct strategy for a given scenario rather than mindlessly repeating a formula.'
      },
      {
        question: 'What is the main danger of the "illusion of competence"?',
        options: [
          'You study too much and get burned out.',
          'You mistake familiarity (recognizing notes) for actual mastery (being able to recall from scratch).',
          'You fail to explain terms to other students.',
          'You forget to set a timer for your break.'
        ],
        answer: 1,
        explanation: 'Recognizing a definition when looking at it creates the false impression that you know it. True competence requires being able to retrieve that knowledge on a blank page.'
      },
      {
        question: 'What is the "dual coding" theory of learning?',
        options: [
          'Learning both Python and Java at the same time.',
          'Combining verbal descriptions with visual representations (e.g., diagrams, mind maps).',
          'Studying with a partner and checking each other\'s work.',
          'Storing memories in both the left and right hemispheres of the brain.'
        ],
        answer: 1,
        explanation: 'Dual coding suggests that combining text/speech with visual aids gives the brain two separate cognitive pathways to retrieve the same information.'
      }
    ]
  }
];

const DEFAULT_STATS = {
  pomodoroSessions: 0,
  pomodoroMinutes: 0,
  cardsReviewed: 0,
  quizzesTaken: 0,
  dailyStreak: 1
};

export const storage = {
  // Read item
  get(key, defaultValue) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('LocalStorage load error', e);
      return defaultValue;
    }
  },

  // Save item
  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage save error', e);
    }
  },

  // Init default storage
  init() {
    if (!localStorage.getItem(STORAGE_PREFIX + 'initialized')) {
      this.set('todos', DEFAULT_TODOS);
      this.set('decks', DEFAULT_DECKS);
      this.set('notes', DEFAULT_NOTES);
      this.set('quizzes', DEFAULT_QUIZZES);
      this.set('stats', DEFAULT_STATS);
      localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
      console.log('StudyFlow database successfully initialized with seed data.');
    }
  },

  // CRUD Helpers for Todo
  getTodos() {
    return this.get('todos', []);
  },
  saveTodos(todos) {
    this.set('todos', todos);
  },

  // CRUD Helpers for Flashcard Decks
  getDecks() {
    return this.get('decks', []);
  },
  saveDecks(decks) {
    this.set('decks', decks);
  },

  // CRUD Helpers for Notes
  getNotes() {
    return this.get('notes', []);
  },
  saveNotes(notes) {
    this.set('notes', notes);
  },

  // CRUD Helpers for Quizzes
  getQuizzes() {
    return this.get('quizzes', []);
  },
  saveQuizzes(quizzes) {
    this.set('quizzes', quizzes);
  },

  // Statistics
  getStats() {
    return this.get('stats', DEFAULT_STATS);
  },
  saveStats(stats) {
    this.set('stats', stats);
  },
  incrementStat(field, amount = 1) {
    const stats = this.getStats();
    if (stats[field] !== undefined) {
      stats[field] += amount;
      this.saveStats(stats);
    }
  }
};
export default storage;
