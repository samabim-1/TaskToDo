// TaskDesk Dashboard Application Logic

const STORAGE_KEY = 'taskdesk_tasks';

// Initial sample tasks if storage is empty
const SAMPLE_TASKS = [
  {
    id: 'sample-1',
    title: 'Design new dashboard layout mockups',
    description: 'Create high-fidelity wireframes and review layout components with the team.',
    category: 'Work',
    priority: 'High',
    dueDate: getRelativeDateOffset(2),
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'sample-2',
    title: 'Weekly grocery shopping list',
    description: 'Fresh vegetables, fruits, Greek yogurt, almonds, and oats.',
    category: 'Shopping',
    priority: 'Medium',
    dueDate: getRelativeDateOffset(1),
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'sample-3',
    title: 'Morning 5k fitness run',
    description: 'Completed 5km jog around the local park in 28 mins.',
    category: 'Health',
    priority: 'Low',
    dueDate: getRelativeDateOffset(0),
    completed: true,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'sample-4',
    title: 'Pay monthly utility bills',
    description: 'Electricity, water supply, and fiber broadband internet subscription.',
    category: 'Finance',
    priority: 'High',
    dueDate: getRelativeDateOffset(-1),
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

// Helper to generate ISO date strings relative to today (e.g. +2 days, -1 day)
function getRelativeDateOffset(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// Global State
let tasks = [];
let activeStatusFilter = 'all';
let activeCategoryFilter = 'all';
let activePriorityFilter = 'all';
let activeSearchQuery = '';
let activeSortBy = 'dueDate';

// DOM Elements
const taskListEl = document.getElementById('taskList');
const emptyStateEl = document.getElementById('emptyState');
const currentDateEl = document.getElementById('currentDate');

// Stats Elements
const statTotalEl = document.getElementById('statTotal');
const statPendingEl = document.getElementById('statPending');
const statCompletedEl = document.getElementById('statCompleted');
const statHighPriorityEl = document.getElementById('statHighPriority');
const progressPercentageEl = document.getElementById('progressPercentage');
const progressFillEl = document.getElementById('progressFill');
const taskCountSummaryEl = document.getElementById('taskCountSummary');

// Controls & Modal Elements
const searchInput = document.getElementById('searchInput');
const categoryFilterSelect = document.getElementById('categoryFilter');
const priorityFilterSelect = document.getElementById('priorityFilter');
const sortBySelect = document.getElementById('sortBy');
const statusTabsContainer = document.querySelector('.status-tabs');

const taskModal = document.getElementById('taskModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const taskForm = document.getElementById('taskForm');
const modalTitle = document.getElementById('modalTitle');

const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDescription');
const taskCategorySelect = document.getElementById('taskCategory');
const taskPrioritySelect = document.getElementById('taskPriority');
const taskDueDateInput = document.getElementById('taskDueDate');

const markAllCompleteBtn = document.getElementById('markAllCompleteBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// Priority weight mapping for sorting
const PRIORITY_WEIGHTS = { High: 3, Medium: 2, Low: 1 };

// Initialize App
function init() {
  displayCurrentDate();
  loadTasks();
  setupEventListeners();
  renderDashboard();
}

function displayCurrentDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayFormatted = new Date().toLocaleDateString(undefined, options);
  currentDateEl.textContent = `Today: ${todayFormatted}`;
}

// Storage Operations
function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      tasks = JSON.parse(data);
    } else {
      tasks = SAMPLE_TASKS;
      saveTasks();
    }
  } catch (err) {
    console.error('Error reading from localStorage:', err);
    tasks = SAMPLE_TASKS;
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

// Filter and Sort Tasks
function getFilteredAndSortedTasks() {
  let result = tasks.filter(task => {
    // Status Filter
    if (activeStatusFilter === 'pending' && task.completed) return false;
    if (activeStatusFilter === 'completed' && !task.completed) return false;

    // Category Filter
    if (activeCategoryFilter !== 'all' && task.category !== activeCategoryFilter) return false;

    // Priority Filter
    if (activePriorityFilter !== 'all' && task.priority !== activePriorityFilter) return false;

    // Search Query
    if (activeSearchQuery.trim() !== '') {
      const q = activeSearchQuery.toLowerCase();
      const titleMatches = task.title.toLowerCase().includes(q);
      const descMatches = (task.description || '').toLowerCase().includes(q);
      if (!titleMatches && !descMatches) return false;
    }

    return true;
  });

  // Sorting
  result.sort((a, b) => {
    if (activeSortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (activeSortBy === 'priority') {
      return (PRIORITY_WEIGHTS[b.priority] || 0) - (PRIORITY_WEIGHTS[a.priority] || 0);
    } else if (activeSortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (activeSortBy === 'createdAt') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    return 0;
  });

  return result;
}

// Render UI
function renderDashboard() {
  // Update Stats Overview
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const highPriority = tasks.filter(t => t.priority === 'High' && !t.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  statTotalEl.textContent = total;
  statPendingEl.textContent = pending;
  statCompletedEl.textContent = completed;
  statHighPriorityEl.textContent = highPriority;
  progressPercentageEl.textContent = `${percentage}%`;
  progressFillEl.style.width = `${percentage}%`;

  // Render Filtered Task List
  const filteredTasks = getFilteredAndSortedTasks();
  taskCountSummaryEl.textContent = `Showing ${filteredTasks.length} of ${total} tasks`;

  taskListEl.innerHTML = '';

  if (filteredTasks.length === 0) {
    emptyStateEl.classList.remove('hidden');
  } else {
    emptyStateEl.classList.add('hidden');
    filteredTasks.forEach(task => {
      const taskCard = createTaskElement(task);
      taskListEl.appendChild(taskCard);
    });
  }
}

// Create Task DOM Node
function createTaskElement(task) {
  const item = document.createElement('div');
  item.className = `task-item ${task.completed ? 'completed' : ''}`;
  item.dataset.id = task.id;

  // Category Badge Class
  const categoryClass = `category-${(task.category || 'work').toLowerCase()}`;
  // Priority Badge Class
  const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;

  // Due Date Formatting & Overdue Check
  let dueDateHTML = '';
  if (task.dueDate) {
    const todayStr = getRelativeDateOffset(0);
    let extraClass = '';
    let label = task.dueDate;

    if (!task.completed) {
      if (task.dueDate < todayStr) {
        extraClass = 'overdue';
        label = `Overdue (${task.dueDate})`;
      } else if (task.dueDate === todayStr) {
        extraClass = 'due-today';
        label = 'Due Today';
      }
    }

    dueDateHTML = `<span class="due-date-badge ${extraClass}">📅 ${escapeHTML(label)}</span>`;
  }

  item.innerHTML = `
    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} title="Toggle completed">
    <div class="task-content">
      <div class="task-title">${escapeHTML(task.title)}</div>
      ${task.description ? `<div class="task-desc">${escapeHTML(task.description)}</div>` : ''}
      <div class="task-meta">
        <span class="badge ${categoryClass}">${escapeHTML(task.category || 'General')}</span>
        <span class="badge ${priorityClass}">${escapeHTML(task.priority || 'Medium')}</span>
        ${dueDateHTML}
      </div>
    </div>
    <div class="task-actions">
      <button class="action-btn edit-btn" title="Edit Task">✏️</button>
      <button class="action-btn delete-btn" title="Delete Task">🗑️</button>
    </div>
  `;

  // Event Listeners for Card Controls
  const checkbox = item.querySelector('.task-checkbox');
  checkbox.addEventListener('change', () => toggleTaskCompleted(task.id));

  const editBtn = item.querySelector('.edit-btn');
  editBtn.addEventListener('click', () => openModalForEdit(task.id));

  const deleteBtn = item.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  return item;
}

// HTML Escaper for Safety
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Task CRUD Operations
function toggleTaskCompleted(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTasks();
  renderDashboard();
}

function deleteTask(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderDashboard();
  }
}

function markAllCompleted() {
  if (tasks.length === 0) return;
  tasks = tasks.map(t => ({ ...t, completed: true }));
  saveTasks();
  renderDashboard();
}

function clearCompleted() {
  const completedCount = tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;
  
  if (confirm(`Are you sure you want to clear ${completedCount} completed task(s)?`)) {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderDashboard();
  }
}

// Modal Handlers
function openModalForCreate() {
  taskIdInput.value = '';
  taskTitleInput.value = '';
  taskDescInput.value = '';
  taskCategorySelect.value = 'Work';
  taskPrioritySelect.value = 'Medium';
  taskDueDateInput.value = getRelativeDateOffset(0);

  modalTitle.textContent = 'Add New Task';
  taskModal.classList.remove('hidden');
  taskTitleInput.focus();
}

function openModalForEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  taskIdInput.value = task.id;
  taskTitleInput.value = task.title;
  taskDescInput.value = task.description || '';
  taskCategorySelect.value = task.category || 'Work';
  taskPrioritySelect.value = task.priority || 'Medium';
  taskDueDateInput.value = task.dueDate || '';

  modalTitle.textContent = 'Edit Task';
  taskModal.classList.remove('hidden');
  taskTitleInput.focus();
}

function closeModal() {
  taskModal.classList.add('hidden');
}

function handleTaskFormSubmit(e) {
  e.preventDefault();

  const title = taskTitleInput.value.trim();
  if (!title) return;

  const id = taskIdInput.value;
  const description = taskDescInput.value.trim();
  const category = taskCategorySelect.value;
  const priority = taskPrioritySelect.value;
  const dueDate = taskDueDateInput.value;

  if (id) {
    // Edit existing task
    tasks = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          title,
          description,
          category,
          priority,
          dueDate
        };
      }
      return t;
    });
  } else {
    // Create new task
    const newTask = {
      id: 'task-' + Date.now(),
      title,
      description,
      category,
      priority,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
  }

  saveTasks();
  renderDashboard();
  closeModal();
}

// Setup Event Listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    activeSearchQuery = e.target.value;
    renderDashboard();
  });

  // Status Tabs
  statusTabsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('status-tab')) {
      document.querySelectorAll('.status-tab').forEach(tab => tab.classList.remove('active'));
      e.target.classList.add('active');
      activeStatusFilter = e.target.dataset.status;
      renderDashboard();
    }
  });

  // Dropdown Filters
  categoryFilterSelect.addEventListener('change', (e) => {
    activeCategoryFilter = e.target.value;
    renderDashboard();
  });

  priorityFilterSelect.addEventListener('change', (e) => {
    activePriorityFilter = e.target.value;
    renderDashboard();
  });

  sortBySelect.addEventListener('change', (e) => {
    activeSortBy = e.target.value;
    renderDashboard();
  });

  // Modal Open/Close/Submit
  openModalBtn.addEventListener('click', openModalForCreate);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeModal();
    }
  });

  taskForm.addEventListener('submit', handleTaskFormSubmit);

  // Quick Action Buttons
  markAllCompleteBtn.addEventListener('click', markAllCompleteBtnHandler);
  clearCompletedBtn.addEventListener('click', clearCompletedBtnHandler);
}

function markAllCompleteBtnHandler() {
  markAllComplete();
}

function clearCompletedBtnHandler() {
  clearCompleted();
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
