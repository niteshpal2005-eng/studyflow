// StudyFlow Todo List Module
import storage from './storage.js';

let currentFilter = 'all';
let currentSort = 'dueDate';

export const TodoModule = {
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.render();
  },

  cacheDOM() {
    this.todoList = document.getElementById('todo-list');
    this.todoForm = document.getElementById('todo-form');
    this.taskInput = document.getElementById('todo-input-text');
    this.priorityInput = document.getElementById('todo-input-priority');
    this.categoryInput = document.getElementById('todo-input-category');
    this.dueDateInput = document.getElementById('todo-input-date');
    
    this.filterButtons = document.querySelectorAll('.todo-filter-btn');
    this.sortSelect = document.getElementById('todo-sort-select');
    
    // Set default date to today
    if (this.dueDateInput) {
      this.dueDateInput.value = new Date().toISOString().split('T')[0];
    }
  },

  bindEvents() {
    if (this.todoForm) {
      this.todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addTodo();
      });
    }

    if (this.filterButtons) {
      this.filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.filterButtons.forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          currentFilter = e.currentTarget.dataset.filter;
          this.render();
        });
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        this.render();
      });
    }
  },

  addTodo() {
    const text = this.taskInput.value.trim();
    if (!text) return;

    const priority = this.priorityInput.value;
    const category = this.categoryInput.value.trim() || 'General';
    const dueDate = this.dueDateInput.value || new Date().toISOString().split('T')[0];

    const newTodo = {
      id: 'todo_' + Date.now(),
      text,
      completed: false,
      priority,
      category,
      dueDate
    };

    const todos = storage.getTodos();
    todos.push(newTodo);
    storage.saveTodos(todos);

    // Reset inputs
    this.taskInput.value = '';
    this.dueDateInput.value = new Date().toISOString().split('T')[0];
    this.categoryInput.value = '';
    
    this.render();
    
    // Dispatch custom event to let dashboard update if active
    document.dispatchEvent(new CustomEvent('todoUpdated'));
  },

  toggleTodo(id) {
    const todos = storage.getTodos();
    const updated = todos.map(todo => {
      if (todo.id === id) {
        const completedState = !todo.completed;
        return { ...todo, completed: completedState };
      }
      return todo;
    });
    storage.saveTodos(updated);
    this.render();
    
    document.dispatchEvent(new CustomEvent('todoUpdated'));
  },

  deleteTodo(id) {
    const todos = storage.getTodos();
    const filtered = todos.filter(todo => todo.id !== id);
    storage.saveTodos(filtered);
    this.render();
    
    document.dispatchEvent(new CustomEvent('todoUpdated'));
  },

  render() {
    if (!this.todoList) return;

    let todos = storage.getTodos();

    // Filtering
    if (currentFilter === 'pending') {
      todos = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
      todos = todos.filter(t => t.completed);
    }

    // Sorting
    todos.sort((a, b) => {
      if (currentSort === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (currentSort === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      } else if (currentSort === 'alphabetical') {
        return a.text.localeCompare(b.text);
      }
      return 0;
    });

    this.todoList.innerHTML = '';

    if (todos.length === 0) {
      this.todoList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <svg style="width: 48px; height: 48px; margin-bottom: 0.75rem; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
          <p>No tasks found. Add a todo to start staying productive!</p>
        </div>
      `;
      return;
    }

    todos.forEach(todo => {
      const todoEl = document.createElement('div');
      todoEl.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      
      const priorityClass = `badge-${todo.priority}`;
      
      todoEl.innerHTML = `
        <div class="todo-left">
          <div class="todo-checkbox" data-id="${todo.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div>
            <div class="todo-text" style="font-size: 1rem; font-weight: 500;">${this.escapeHTML(todo.text)}</div>
            <div class="todo-meta">
              <span class="badge ${priorityClass}">${todo.priority.toUpperCase()}</span>
              <span>•</span>
              <span style="background: rgba(255,255,255,0.05); padding: 0.15rem 0.5rem; border-radius: 4px; color: var(--text-secondary);">${this.escapeHTML(todo.category)}</span>
              <span>•</span>
              <span class="todo-date ${this.isOverdue(todo.dueDate) && !todo.completed ? 'text-danger' : ''}">
                <svg style="width:12px; height:12px; display:inline; vertical-align:middle; margin-right:2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>${todo.dueDate}
              </span>
            </div>
          </div>
        </div>
        <div class="todo-actions">
          <button class="btn-icon delete-todo-btn" data-id="${todo.id}" title="Delete Task">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `;

      // Event listeners for list items
      todoEl.querySelector('.todo-checkbox').addEventListener('click', () => {
        this.toggleTodo(todo.id);
      });

      todoEl.querySelector('.delete-todo-btn').addEventListener('click', () => {
        this.deleteTodo(todo.id);
      });

      this.todoList.appendChild(todoEl);
    });
  },

  isOverdue(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  },

  escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
export default TodoModule;
