// NEW JAVASCRIPT FILE - app-v2.js - FRESH VERSION
console.log('🚀🚀🚀 LOADING FRESH APP-V2.JS FILE 🚀🚀🚀');

// Check if we're running locally or on Netlify
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';

// Task details cache for instant access
let taskDetailsCache = new Map();

// Global state for current view and tasks
let currentView = 'today';
let allTasks = [];
let filteredTasks = [];
let searchQuery = '';

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load todos from Notion via serverless function
async function getTodos() {
  try {
    const response = await fetch(`${API_BASE}/get-todos`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const todos = await response.json();
    
    // Cache task details for instant access
    cacheTaskDetails(todos);
    
    // Extract due dates and other properties from fullDetails
    todos.forEach(task => {
      if (task.fullDetails && task.fullDetails.properties) {
        const props = task.fullDetails.properties;
        
        // Extract due date from "Due Date" property
        if (props['Due Date'] && props['Due Date'].value && props['Due Date'].value.start) {
          task.dueDate = props['Due Date'].value.start;
        }
        
        // Extract priority from "Priority" property
        if (props['Priority'] && props['Priority'].value && props['Priority'].value.name) {
          task.priority = props['Priority'].value.name;
        }
        
        // Extract other useful properties
        if (props['Description'] && props['Description'].displayValue) {
          task.description = props['Description'].displayValue;
        }
      }
    });
    
    // Store all tasks globally
    allTasks = todos;
    
    // Update task counts and display current view
    updateTaskCounts();
    displayCurrentView();
  } catch (error) {
    console.error('Error fetching todos:', error);
    loadFromLocalStorage();
  }
}

// Fallback to localStorage when API is unavailable
function loadFromLocalStorage() {
  const savedTodos = localStorage.getItem('todos');
  if (savedTodos) {
    const todos = JSON.parse(savedTodos);
    
    // Store all tasks globally
    allTasks = todos;
    
    // Update task counts and display current view
    updateTaskCounts();
    displayCurrentView();
  } else {
    const defaultTodos = [
      { id: '1', text: "Learn JavaScript", status: "To Do", completed: false },
      { id: '2', text: "Build todo app", status: "In Progress", completed: false },
      { id: '3', text: "Deploy to Netlify", status: "Done", completed: true }
    ];
    localStorage.setItem('todos', JSON.stringify(defaultTodos));
    
    // Store all tasks globally
    allTasks = defaultTodos;
    
    // Update task counts and display current view
    updateTaskCounts();
    displayCurrentView();
  }
}

// Cache task details for instant access
function cacheTaskDetails(todos) {
  console.log('Caching task details for', todos.length, 'tasks');
  taskDetailsCache.clear();
  
  todos.forEach(todo => {
    if (todo.fullDetails) {
      taskDetailsCache.set(todo.id, todo.fullDetails);
      console.log(`Cached details for task: ${todo.id}`);
    }
  });
  
  console.log('Cache size:', taskDetailsCache.size);
}

// Get cached task details
function getCachedTaskDetails(taskId) {
  return taskDetailsCache.get(taskId);
}

// Clear cache when tasks are updated
function clearTaskCache() {
  taskDetailsCache.clear();
  console.log('Task cache cleared');
}

// Delete from localStorage (fallback)
function deleteFromLocalStorage(id) {
  const todos = JSON.parse(localStorage.getItem('todos')) || [];
  const filteredTodos = todos.filter(todo => todo.id !== id);
  localStorage.setItem('todos', JSON.stringify(filteredTodos));
  
  // Update global state
  allTasks = filteredTodos;
  updateTaskCounts();
  displayCurrentView();
  
  showTemporaryMessage('Task deleted successfully!', 'success');
}

// View switching functionality
function switchView(viewName) {
  console.log('Switching to view:', viewName);
  
  // Update current view
  currentView = viewName;
  
  // Update active navigation item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }
  
  // Update view title and subtitle
  updateViewHeader(viewName);
  
  // Display filtered tasks
  displayCurrentView();
}

// Update view header based on current view
function updateViewHeader(viewName) {
  const titleElement = document.getElementById('view-title');
  const subtitleElement = document.getElementById('view-subtitle');
  
  const viewConfig = {
    'today': {
      title: 'Today',
      subtitle: 'Tasks due today'
    },
    'upcoming': {
      title: 'Upcoming',
      subtitle: 'Tasks due in the next 7 days'
    },
    'all': {
      title: 'All Tasks',
      subtitle: 'Complete overview of all tasks'
    },
    'completed': {
      title: 'Completed',
      subtitle: 'Tasks that have been finished'
    },
    'todo': {
      title: 'To Do',
      subtitle: 'Tasks ready to be started'
    },
    'in-progress': {
      title: 'In Progress',
      subtitle: 'Tasks currently being worked on'
    },
    'blocked': {
      title: 'Blocked',
      subtitle: 'Tasks waiting on external dependencies'
    },
    'add-task': {
      title: 'Add New Task',
      subtitle: 'Create and organize your new task'
    }
  };
  
  const config = viewConfig[viewName] || { title: 'Tasks', subtitle: 'Task list' };
  titleElement.textContent = config.title;
  subtitleElement.textContent = config.subtitle;
}

// Filter tasks based on current view and search query
function getFilteredTasks() {
  let filtered = [...allTasks];
  const today = new Date();
  const todayStr = today.toDateString();
  
  // Apply search filter first
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(task => 
      task.text.toLowerCase().includes(query) ||
      (task.status || '').toLowerCase().includes(query)
    );
  }
  
  // Apply view filter
  switch (currentView) {
    case 'today':
      filtered = filtered.filter(task => {
        if (task.completed || task.status === 'Done') return false;
        
        // Show tasks due today, overdue tasks, or tasks with no due date
        if (!task.dueDate) return true; // Tasks without due date show in Today
        
        const taskDueDate = new Date(task.dueDate);
        const taskDueDateStr = taskDueDate.toDateString();
        
        // Show today's tasks and overdue tasks
        return taskDueDateStr === todayStr || taskDueDate < today;
      });
      break;
      
    case 'upcoming':
      filtered = filtered.filter(task => {
        if (task.completed || task.status === 'Done') return false;
        if (!task.dueDate) return false; // Only show tasks with due dates in upcoming
        
        const taskDueDate = new Date(task.dueDate);
        return taskDueDate > today; // Only future tasks
      });
      break;
      
    case 'all':
      // Show all tasks
      break;
      
    case 'completed':
      filtered = filtered.filter(task => task.completed || task.status === 'Done');
      break;
      
    case 'todo':
      filtered = filtered.filter(task => task.status === 'To Do' && !task.completed);
      break;
      
    case 'in-progress':
      filtered = filtered.filter(task => task.status === 'In Progress');
      break;
      
    case 'blocked':
      filtered = filtered.filter(task => task.status === 'Blocked');
      break;
  }
  
  // Sort tasks by due date, then by priority
  filtered.sort((a, b) => {
    // Handle tasks without due dates
    if (!a.dueDate && !b.dueDate) {
      // Both have no date, sort by priority then alphabetically
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      const aPriority = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 3;
      const bPriority = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      return a.text.localeCompare(b.text);
    }
    if (!a.dueDate) return 1; // a has no date, put it after b
    if (!b.dueDate) return -1; // b has no date, put a before b
    
    // Both have due dates, sort by date first (earliest first)
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    const dateDiff = dateA - dateB;
    
    if (dateDiff !== 0) {
      return dateDiff; // Different dates, sort by date
    }
    
    // Same date, sort by priority then alphabetically
    const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    const aPriority = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 3;
    const bPriority = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 3;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    return a.text.localeCompare(b.text);
  });
  
  return filtered;
}

// Display current view with filtered tasks
function displayCurrentView() {
  const contentArea = document.getElementById('content-area');
  const taskCountElement = document.getElementById('main-task-count');
  
  // Handle add-task view specially
  if (currentView === 'add-task') {
    displayAddTaskView();
    taskCountElement.textContent = '';
    return;
  }
  
  filteredTasks = getFilteredTasks();
  
  console.log('📊 Displaying current view:', currentView, 'with', filteredTasks.length, 'tasks');
  console.log('📋 Filtered tasks:', filteredTasks.map(t => ({ id: t.id, text: t.text })));
  
  // Update task count
  const taskCount = filteredTasks.length;
  taskCountElement.textContent = `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`;
  
  if (filteredTasks.length === 0) {
    // Show empty state
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No tasks found</h3>
        <p>No tasks match the current view and search criteria.</p>
      </div>
    `;
    return;
  }
  
  // Display tasks based on current view
  if (currentView === 'all') {
    console.log('🎯 Displaying board view');
    displayBoardView(filteredTasks);
  } else {
    console.log('🎯 Displaying list view');
    displayListView(filteredTasks);
  }
}

// Display tasks in list format
function displayListView(tasks) {
  const contentArea = document.getElementById('content-area');
  
  // Special handling for upcoming tasks - group by date
  if (currentView === 'upcoming') {
    displayUpcomingTasksGrouped(tasks);
    return;
  }
  
  let html = '<div class="task-list">';
  
  tasks.forEach(task => {
    html += createTaskListItem(task);
  });
  
  html += '</div>';
  contentArea.innerHTML = html;
}

// Display upcoming tasks grouped by due date
function displayUpcomingTasksGrouped(tasks) {
  const contentArea = document.getElementById('content-area');
  const currentFilter = getCurrentUpcomingFilter();
  
  // Add time filter buttons
  let html = `
    <div class="upcoming-filters">
      <button class="filter-btn ${currentFilter === 'day' ? 'active' : ''}" onclick="setUpcomingFilter('day')" data-filter="day">
        <span class="filter-icon">📅</span>
        <span class="filter-text">Tomorrow</span>
      </button>
      <button class="filter-btn ${currentFilter === 'week' ? 'active' : ''}" onclick="setUpcomingFilter('week')" data-filter="week">
        <span class="filter-icon">📆</span>
        <span class="filter-text">This Week</span>
      </button>
      <button class="filter-btn ${currentFilter === 'month' ? 'active' : ''}" onclick="setUpcomingFilter('month')" data-filter="month">
        <span class="filter-icon">🗓️</span>
        <span class="filter-text">This Month</span>
      </button>
    </div>
  `;
  
  // Display different layouts based on filter
  if (currentFilter === 'week') {
    html += displayWeeklyView(tasks);
  } else if (currentFilter === 'month') {
    html += displayMonthlyCalendarView(tasks);
  } else {
    // For 'day' filter, use the original grouped layout
    const tasksByDate = groupTasksByDate(tasks);
    html += displayGroupedTasks(tasksByDate);
  }
  
  contentArea.innerHTML = html;
}

// Display tasks in weekly column layout
function displayWeeklyView(tasks) {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate dates for this week (Sunday to Saturday)
  const weekDates = [];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay); // Go to Sunday
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(date);
  }
  
  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach(task => {
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate);
      const dateKey = taskDate.toISOString().split('T')[0];
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    }
  });
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let html = '<div class="week-view">';
  
  weekDates.forEach((date, index) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayTasks = tasksByDate[dateKey] || [];
    const isToday = date.toDateString() === today.toDateString();
    const dayName = dayNames[index];
    const dayNumber = date.getDate();
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    html += `
      <div class="week-day ${isToday ? 'today' : ''}">
        <div class="week-day-header">
          <div class="day-name">${dayName}</div>
          <div class="day-date">${monthName} ${dayNumber}</div>
        </div>
        <div class="week-day-tasks">
    `;
    
    if (dayTasks.length === 0) {
      html += '<div class="no-tasks">No tasks</div>';
    } else {
      dayTasks.forEach(task => {
        html += createCompactTaskItem(task);
      });
    }
    
    html += '</div></div>';
  });
  
  html += '</div>';
  return html;
}

// Display tasks in monthly calendar layout
function displayMonthlyCalendarView(tasks) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get first day of month and how many days in month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach(task => {
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate);
      if (taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear) {
        const dateKey = taskDate.toISOString().split('T')[0];
        if (!tasksByDate[dateKey]) {
          tasksByDate[dateKey] = [];
        }
        tasksByDate[dateKey].push(task);
      }
    }
  });
  
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  let html = `
    <div class="calendar-view">
      <div class="calendar-header">
        <h3>${monthName}</h3>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-headers">
  `;
  
  // Day headers
  dayNames.forEach(dayName => {
    html += `<div class="calendar-day-header">${dayName}</div>`;
  });
  
  html += '</div><div class="calendar-days">';
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    html += '<div class="calendar-day empty"></div>';
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateKey = date.toISOString().split('T')[0];
    const dayTasks = tasksByDate[dateKey] || [];
    const isToday = date.toDateString() === today.toDateString();
    
    html += `
      <div class="calendar-day ${isToday ? 'today' : ''}">
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-day-tasks">
    `;
    
    if (dayTasks.length > 0) {
      dayTasks.slice(0, 3).forEach(task => { // Show max 3 tasks
        html += `<div class="calendar-task" title="${escapeHtml(task.text)}">${escapeHtml(task.text.substring(0, 20))}${task.text.length > 20 ? '...' : ''}</div>`;
      });
      
      if (dayTasks.length > 3) {
        html += `<div class="calendar-task-more">+${dayTasks.length - 3} more</div>`;
      }
    }
    
    html += '</div></div>';
  }
  
  html += '</div></div></div>';
  return html;
}

// Display original grouped tasks layout
function displayGroupedTasks(tasksByDate) {
  if (Object.keys(tasksByDate).length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No upcoming tasks</h3>
        <p>You're all caught up! No tasks are due in the selected time period.</p>
      </div>
    `;
  }
  
  let html = '<div class="grouped-tasks">';
  
  // Sort dates and display groups
  const sortedDates = Object.keys(tasksByDate).sort();
  
  sortedDates.forEach(dateKey => {
    const dateTasks = tasksByDate[dateKey];
    const displayDate = formatDateGroup(dateKey);
    
    html += `
      <div class="date-group">
        <div class="date-group-header">
          <h3 class="date-group-title">${displayDate}</h3>
          <span class="date-group-count">${dateTasks.length} ${dateTasks.length === 1 ? 'task' : 'tasks'}</span>
        </div>
        <div class="date-group-tasks">
    `;
    
    dateTasks.forEach(task => {
      html += createTaskListItem(task);
    });
    
    html += '</div></div>';
  });
  
  html += '</div>';
  return html;
}

// Create compact task item for week view
function createCompactTaskItem(task) {
  const priorityIcon = task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟡' : task.priority === 'Low' ? '🟢' : '';
  const statusIcon = task.status === 'In Progress' ? '🔄' : task.status === 'Blocked' ? '🚫' : '📝';
  
  return `
    <div class="compact-task-item" onclick="openTaskDetails('${task.id}', '${escapeHtml(task.text)}')">
      <div class="compact-task-content">
        <div class="compact-task-icons">
          <span class="task-status-icon">${statusIcon}</span>
          ${priorityIcon ? `<span class="task-priority-icon">${priorityIcon}</span>` : ''}
        </div>
        <div class="compact-task-text">${escapeHtml(task.text)}</div>
      </div>
    </div>
  `;
}

// Group tasks by their due date
function groupTasksByDate(tasks) {
  const tasksByDate = {};
  const currentFilter = getCurrentUpcomingFilter();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate filter end date
  let filterEndDate = new Date(today);
  switch (currentFilter) {
    case 'day':
      // Tomorrow only
      filterEndDate.setDate(today.getDate() + 2); // Include tomorrow (today + 1 day + 1 for exclusive end)
      break;
    case 'week':
      // This week (until end of current Sunday)
      const daysUntilSunday = (7 - today.getDay()) % 7;
      filterEndDate.setDate(today.getDate() + daysUntilSunday + 1);
      break;
    case 'month':
      // This month (until end of current month)
      filterEndDate.setMonth(today.getMonth() + 1, 1); // First day of next month
      filterEndDate.setDate(0); // Last day of current month
      filterEndDate.setDate(filterEndDate.getDate() + 1); // Make it exclusive
      break;
  }
  
  tasks.forEach(task => {
    if (!task.dueDate) return;
    
    const dueDate = new Date(task.dueDate);
    const dueDateKey = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Only include tasks within the filter range
    if (dueDate >= today && dueDate < filterEndDate) {
      if (!tasksByDate[dueDateKey]) {
        tasksByDate[dueDateKey] = [];
      }
      tasksByDate[dueDateKey].push(task);
    }
  });
  
  // Sort tasks within each date group by priority and then by creation time
  Object.keys(tasksByDate).forEach(dateKey => {
    tasksByDate[dateKey].sort((a, b) => {
      // First sort by priority (High > Medium > Low > no priority)
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      const aPriority = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 3;
      const bPriority = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort by task name alphabetically
      return a.text.localeCompare(b.text);
    });
  });
  
  return tasksByDate;
}

// Format date group header
function formatDateGroup(dateKey) {
  const date = new Date(dateKey);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const tomorrowStr = tomorrow.toDateString();
  
  if (dateStr === todayStr) {
    return 'Today';
  } else if (dateStr === tomorrowStr) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Get current upcoming filter (default to 'week')
function getCurrentUpcomingFilter() {
  return localStorage.getItem('upcoming-filter') || 'week';
}

// Set upcoming filter
function setUpcomingFilter(filter) {
  localStorage.setItem('upcoming-filter', filter);
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
  
  // Refresh the view
  displayCurrentView();
}

// Display Add Task page
function displayAddTaskView() {
  const contentArea = document.getElementById('content-area');
  
  contentArea.innerHTML = `
    <div class="add-task-page">
      <div class="add-task-form">
        <div class="task-input-container">
          <input type="text" id="new-task-title" class="task-title-input" placeholder="Task name" />
        </div>
        
        <div class="task-details-section">
          <div class="task-detail-row">
            <div class="task-detail-item">
              <label class="task-detail-label">
                <span class="detail-icon">📅</span>
                <span class="detail-text">Due date</span>
              </label>
              <input type="date" id="new-task-due-date" class="task-detail-input" />
            </div>
            
            <div class="task-detail-item">
              <label class="task-detail-label">
                <span class="detail-icon">🏷️</span>
                <span class="detail-text">Priority</span>
              </label>
              <select id="new-task-priority" class="task-detail-input">
                <option value="">Select priority</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
          </div>
          
          <div class="task-detail-row">
            <div class="task-detail-item">
              <label class="task-detail-label">
                <span class="detail-icon">📋</span>
                <span class="detail-text">Status</span>
              </label>
              <select id="new-task-status" class="task-detail-input">
                <option value="To Do">📝 To Do</option>
                <option value="In Progress">🔄 In Progress</option>
                <option value="Blocked">🚫 Blocked</option>
              </select>
            </div>
            
            <div class="task-detail-item">
              <label class="task-detail-label">
                <span class="detail-icon">⏱️</span>
                <span class="detail-text">Estimated time</span>
              </label>
              <input type="number" id="new-task-time" class="task-detail-input" placeholder="Hours" min="0" step="0.25" />
            </div>
          </div>
        </div>
        
        <div class="task-description-section">
          <label class="task-detail-label">
            <span class="detail-icon">📝</span>
            <span class="detail-text">Description</span>
          </label>
          <textarea id="new-task-description" class="task-description-input" placeholder="Add a description..." rows="4"></textarea>
        </div>
        
        <div class="add-task-actions">
          <button class="btn-cancel" onclick="switchView('today')">Cancel</button>
          <button class="btn-save" onclick="createNewTask()">Add Task</button>
        </div>
      </div>
    </div>
  `;
}

// Display tasks in board format (for "All Tasks" view)
function displayBoardView(tasks) {
  const contentArea = document.getElementById('content-area');
  
  // Group tasks by status
  const tasksByStatus = {
    'To Do': [],
    'In Progress': [],
    'Done': [],
    'Blocked': []
  };
  
  tasks.forEach(task => {
    const status = task.status || 'To Do';
    if (tasksByStatus[status]) {
      tasksByStatus[status].push(task);
    } else {
      tasksByStatus['To Do'].push(task);
    }
  });
  
  let html = '<div class="board-view">';
  
  Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
    html += `
      <div class="board-column" data-status="${status}">
        <h3>
          <span class="board-column-icon">${getStatusIcon(status)}</span>
          ${status}
          <span class="nav-count">${statusTasks.length}</span>
        </h3>
        <div class="board-task-list" data-status="${status}">
    `;
    
    if (statusTasks.length === 0) {
      html += '<div class="empty-state" style="padding: 20px; font-size: 12px;">No tasks</div>';
    } else {
      statusTasks.forEach(task => {
        html += createBoardTaskItemV2(task);
      });
    }
    
    html += '</div></div>';
  });
  
  html += '</div>';
  contentArea.innerHTML = html;
  
  // Force clear any cached event handlers and set up fresh ones
  setTimeout(() => {
    console.log('🧹 Clearing any cached handlers and setting up fresh drag/drop');
    setupDragAndDropListenersV2();
  }, 100);
}

// Set up drag and drop event listeners - V2
function setupDragAndDropListenersV2() {
  console.log('🔧 V2: Setting up drag and drop listeners');
  
  // Add drag event listeners to all draggable tasks
  const taskElements = document.querySelectorAll('.board-task-v2[draggable="true"]');
  console.log('🔧 V2: Found', taskElements.length, 'v2 draggable tasks');
  
  // Also check for old cached elements
  const oldTaskElements = document.querySelectorAll('.board-task:not(.board-task-v2)[draggable="true"]');
  console.log('🔧 V2: Found', oldTaskElements.length, 'old cached elements (should be 0)');
  
  taskElements.forEach((taskElement, index) => {
    const taskId = taskElement.dataset.taskId;
    const taskStatus = taskElement.dataset.taskStatus;
    
    console.log(`🔧 Setting up task ${index + 1}:`, taskId, taskStatus);
    
    // Remove any existing event listeners by cloning the element
    const newTaskElement = taskElement.cloneNode(true);
    taskElement.parentNode.replaceChild(newTaskElement, taskElement);
    
    newTaskElement.addEventListener('dragstart', (event) => {
      console.log('🎯 NEW Drag started via addEventListener for task:', taskId);
      handleTaskDragStart(event, taskId, taskStatus);
    });
    
    newTaskElement.addEventListener('dragend', (event) => {
      console.log('🎯 NEW Drag ended via addEventListener');
      handleTaskDragEnd(event);
    });
  });
  
  // Add drop event listeners to all drop zones
  const dropZones = document.querySelectorAll('.board-task-list');
  console.log('🔧 Found', dropZones.length, 'drop zones');
  
  dropZones.forEach(dropZone => {
    const targetStatus = dropZone.dataset.status;
    console.log('🔧 Setting up drop zone for:', targetStatus);
    
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', (event) => {
      handleTaskDrop(event, targetStatus);
    });
  });
  
  console.log('✅ Drag and drop listeners set up successfully');
}

// Create task list item HTML
function createTaskListItem(task) {
  const statusClass = (task.status || 'To Do').toLowerCase().replace(/\s+/g, '-');
  const completedClass = task.completed || task.status === 'Done' ? ' completed' : '';
  
  console.log('🎨 Creating task item for:', { id: task.id, text: task.text });
  
  return `
    <div class="task-item${completedClass}" onclick="console.log('🖱️ Task clicked:', '${task.id}'); openTaskDetails('${task.id}', '${escapeHtml(task.text)}');">
      <div class="task-header">
        <div class="task-title">${task.text}</div>
        <div class="task-status ${statusClass}">${task.status || 'To Do'}</div>
      </div>
      <div class="task-meta">
        <div class="task-date">
          <span>📅</span>
          <span>${new Date().toLocaleDateString()}</span>
        </div>
        <div class="task-actions">
          <button class="action-btn edit-btn" onclick="event.stopPropagation(); console.log('🖱️ Edit clicked:', '${task.id}'); openTaskDetails('${task.id}', '${escapeHtml(task.text)}')">
            ✏️ Edit
          </button>
          <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteTodo('${task.id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  `;
}

// Create board task item HTML - NEW VERSION 2025
function createBoardTaskItemV2(task) {
  console.log('✨ NEW V2: Creating board task item for:', { id: task.id, text: task.text });
  
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
  const priorityIcon = task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟡' : task.priority === 'Low' ? '🟢' : '';
  
  return `
    <div class="board-task-v2" 
         draggable="true" 
         data-task-id="${task.id}"
         data-task-status="${task.status || 'To Do'}"
         data-version="v2">
      <div class="task-content" onclick="console.log('🖱️ Board task clicked:', '${task.id}'); openTaskDetails('${task.id}', '${escapeHtml(task.text)}');">
        <div class="task-title">${escapeHtml(task.text)}</div>
        <div class="task-meta">
          <span class="task-due-date">📅 ${dueDate}</span>
          ${priorityIcon ? `<span class="task-priority">${priorityIcon}</span>` : ''}
          <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteTodo('${task.id}')" style="float: right; font-size: 12px; padding: 2px 6px;">
            ×
          </button>
        </div>
      </div>
    </div>
  `;
}

// Get icon for status
function getStatusIcon(status) {
  const icons = {
    'To Do': '📝',
    'In Progress': '🔄',
    'Done': '✅',
    'Blocked': '🚫'
  };
  return icons[status] || '📝';
}

// Drag and Drop functionality
let draggedTask = null;

function handleTaskDragStart(event, taskId, currentStatus) {
  console.log('🎯 Drag started for task:', taskId, 'Status:', currentStatus);
  console.log('🎯 Event target:', event.target);
  draggedTask = { id: taskId, status: currentStatus };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/html', event.target.outerHTML);
  
  // Add visual feedback
  event.target.classList.add('dragging');
  
  // Add drop zones visual feedback
  const dropZones = document.querySelectorAll('.board-task-list');
  console.log('🎯 Found drop zones:', dropZones.length);
  dropZones.forEach(list => {
    list.classList.add('drop-zone-active');
  });
}

function handleTaskDragEnd(event) {
  console.log('🎯 Drag ended');
  event.target.classList.remove('dragging');
  
  // Remove drop zones visual feedback
  document.querySelectorAll('.board-task-list').forEach(list => {
    list.classList.remove('drop-zone-active', 'drop-zone-hover');
  });
  
  draggedTask = null;
}

function handleDragOver(event) {
  console.log('🎯 Drag over:', event.target, 'Current target:', event.currentTarget);
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
  console.log('🎯 Drag enter:', event.target, 'Current target:', event.currentTarget);
  event.preventDefault();
  // Use currentTarget which is the element with the event listener
  event.currentTarget.classList.add('drop-zone-hover');
}

function handleDragLeave(event) {
  console.log('🎯 Drag leave:', event.target, 'Current target:', event.currentTarget);
  // Use currentTarget which is the element with the event listener
  event.currentTarget.classList.remove('drop-zone-hover');
}

async function handleTaskDrop(event, targetStatus) {
  console.log('🎯 Drop event triggered for target status:', targetStatus);
  console.log('🎯 Event target:', event.target, 'Current target:', event.currentTarget);
  event.preventDefault();
  event.currentTarget.classList.remove('drop-zone-hover');
  
  if (!draggedTask) {
    console.log('❌ No dragged task found');
    return;
  }
  
  const taskId = draggedTask.id;
  const oldStatus = draggedTask.status;
  
  console.log('🎯 Dragged task:', draggedTask);
  console.log('🎯 Target status:', targetStatus);
  
  if (oldStatus === targetStatus) {
    console.log('ℹ️ Task dropped in same column, no change needed');
    return;
  }
  
  console.log('🔄 Moving task', taskId, 'from', oldStatus, 'to', targetStatus);
  
  try {
    // Update task status via API
    const response = await fetch(`${API_BASE}/update-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: taskId,
        properties: {
          'Status': targetStatus,
          'Status_type': 'select'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Task status updated successfully:', result);
    
    // Update local task data
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      task.status = targetStatus;
    }
    
    // Refresh the board view
    displayCurrentView();
    updateTaskCounts();
    
    // Show success feedback
    showTemporaryMessage(`Task moved to ${targetStatus}`, 'success');
    
  } catch (error) {
    console.error('Error updating task status:', error);
    showTemporaryMessage('Failed to move task. Please try again.', 'error');
  }
}

// Show temporary feedback message
function showTemporaryMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.className = `temp-message temp-message-${type}`;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// Update task counts in navigation
function updateTaskCounts() {
  const counts = {
    today: allTasks.filter(task => !task.completed).length, // Simplified for now
    upcoming: allTasks.filter(task => !task.completed).length, // Simplified for now
    all: allTasks.length,
    completed: allTasks.filter(task => task.completed || task.status === 'Done').length,
    todo: allTasks.filter(task => task.status === 'To Do' && !task.completed).length,
    'in-progress': allTasks.filter(task => task.status === 'In Progress').length,
    blocked: allTasks.filter(task => task.status === 'Blocked').length
  };
  
  Object.entries(counts).forEach(([view, count]) => {
    const countElement = document.getElementById(`${view}-count`);
    if (countElement) {
      countElement.textContent = count;
    }
  });
}

// Search functionality
function handleSearch() {
  const searchInput = document.getElementById('search-input');
  searchQuery = searchInput.value.trim();
  
  console.log('Searching for:', searchQuery);
  displayCurrentView();
}

// Add Task Panel Functions
let databaseSchema = null;

function showAddTaskForm() {
  const panel = document.getElementById('add-task-panel');
  const formContainer = document.getElementById('add-task-form-container');
  
  // Show panel and loading state
  panel.style.display = 'flex';
  formContainer.innerHTML = '<div class="loading">Loading form fields...</div>';
  
  // Load form asynchronously
  loadAddTaskForm();
}

function hideAddTaskForm() {
  const panel = document.getElementById('add-task-panel');
  panel.style.display = 'none';
  
  // Reset form
  const form = document.getElementById('add-task-form');
  if (form) {
    form.reset();
    // Reset field styles
    const fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    fields.forEach(field => {
      field.style.borderColor = '';
    });
  }
}

async function loadAddTaskForm() {
  const formContainer = document.getElementById('add-task-form-container');

  try {
    // Get database schema if not cached
    if (!databaseSchema) {
      console.log('Fetching database schema...');
      const response = await fetch(`${API_BASE}/get-database-schema`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      databaseSchema = await response.json();
      console.log('Database schema loaded:', databaseSchema);
    }
    
    // Generate form
    generateAddTaskForm(databaseSchema, formContainer);
    
  } catch (error) {
    console.error('Error loading add task form:', error);
    formContainer.innerHTML = `
      <div class="loading" style="color: #dc3545;">
        Failed to load form: ${error.message}
        <br><br>
        <small>Using basic form instead.</small>
      </div>
    `;
    
    // Fallback to basic form
    setTimeout(() => generateBasicForm(formContainer), 1000);
  }
}

function generateAddTaskForm(schema, container) {
  
  let formHtml = '<form id="add-task-form" class="form-grid">';
  
  schema.fields.forEach(field => {
    formHtml += generateFormField(field);
  });
  
  formHtml += '</form>';
  
  container.innerHTML = formHtml;
}

function generateFormField(field) {
  let fieldHtml = `<div class="form-field">`;
  
  // Label
  fieldHtml += `<label class="form-label ${field.required ? 'required' : ''}" for="${field.name}">
    ${field.name}
  </label>`;
  
  // Input based on type
  switch (field.inputType) {
    case 'text':
    case 'email':
    case 'url':
    case 'tel':
    case 'number':
    case 'date':
      fieldHtml += `<input 
        type="${field.inputType}" 
        id="${field.name}" 
        name="${field.name}"
        class="form-input" 
        placeholder="${field.placeholder || ''}"
        ${field.required ? 'required' : ''}
        data-type="${field.type}"
      />`;
      break;
      
    case 'textarea':
      fieldHtml += `<textarea 
        id="${field.name}" 
        name="${field.name}"
        class="form-textarea" 
        placeholder="${field.placeholder || ''}"
        ${field.required ? 'required' : ''}
        data-type="${field.type}"
      ></textarea>`;
      break;
      
    case 'select':
      fieldHtml += `<select 
        id="${field.name}" 
        name="${field.name}"
        class="form-select"
        ${field.required ? 'required' : ''}
        data-type="${field.type}"
      >`;
      fieldHtml += `<option value="">Select an option...</option>`;
      field.options.forEach(option => {
        fieldHtml += `<option value="${option.name}">${option.name}</option>`;
      });
      fieldHtml += `</select>`;
      break;
      
    case 'checkbox':
      fieldHtml += `<label class="form-checkbox">
        <input 
          type="checkbox" 
          id="${field.name}" 
          name="${field.name}"
          data-type="${field.type}"
        />
        <span>Yes</span>
      </label>`;
      break;
      
    default:
      fieldHtml += `<input 
        type="text" 
        id="${field.name}" 
        name="${field.name}"
        class="form-input" 
        placeholder="${field.placeholder || ''}"
        data-type="${field.type}"
      />`;
  }
  
  // Help text
  if (field.help) {
    fieldHtml += `<div class="form-help">${field.help}</div>`;
  }
  
  fieldHtml += `</div>`;
  
  return fieldHtml;
}

function generateBasicForm(container) {
  container.innerHTML = `
    <form id="add-task-form" class="form-grid">
      <div class="form-field">
        <label class="form-label required" for="task-title">Task Title</label>
        <input type="text" id="task-title" name="Name" class="form-input" placeholder="Enter task title..." required data-type="title" />
      </div>
      <div class="form-field">
        <label class="form-label" for="task-status">Status</label>
        <select id="task-status" name="Status" class="form-select" data-type="select">
          <option value="">Select status...</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>
    </form>
  `;
}

// Create new task from the Add Task page
async function createNewTask() {
  const title = document.getElementById('new-task-title')?.value?.trim();
  const dueDate = document.getElementById('new-task-due-date')?.value;
  const priority = document.getElementById('new-task-priority')?.value;
  const status = document.getElementById('new-task-status')?.value || 'To Do';
  const estimatedTime = document.getElementById('new-task-time')?.value;
  const description = document.getElementById('new-task-description')?.value?.trim();
  
  if (!title) {
    alert('Please enter a task title');
    document.getElementById('new-task-title')?.focus();
    return;
  }
  
  try {
    // Prepare data for the API
    const properties = {
      'Task': title,
      'Task_type': 'title'
    };
    
    if (status) {
      properties['Status'] = status;
      properties['Status_type'] = 'select';
    }
    
    if (dueDate) {
      properties['Due Date'] = dueDate;
      properties['Due Date_type'] = 'date';
    }
    
    if (priority) {
      properties['Priority'] = priority;
      properties['Priority_type'] = 'select';
    }
    
    if (estimatedTime) {
      properties['Estimated Hours'] = parseFloat(estimatedTime);
      properties['Estimated Hours_type'] = 'number';
    }
    
    if (description) {
      properties['Description'] = description;
      properties['Description_type'] = 'rich_text';
    }
    
    console.log('Creating task with properties:', properties);
    
    const response = await fetch(`${API_BASE}/add-todo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const newTask = await response.json();
    console.log('Task created successfully:', newTask);
    
    // Refresh the tasks and go back to Today view
    await getTodos();
    switchView('today');
    
    // Show success message
    alert('Task created successfully!');
    
  } catch (error) {
    console.error('Error creating task:', error);
    alert('Failed to create task. Please try again.');
  }
}

async function submitNewTask() {
  const form = document.getElementById('add-task-form');
  if (!form) return;
  
  const formData = new FormData(form);
  const properties = {};
  
  // Collect form data with types
  for (let [name, value] of formData.entries()) {
    const field = form.querySelector(`[name="${name}"]`);
    const type = field?.dataset?.type;
    
    if (type === 'checkbox') {
      properties[name] = field.checked;
    } else if (value.trim() !== '') {
      properties[name] = value.trim();
    }
    
    // Store type information for the API
    if (type) {
      properties[name + '_type'] = type;
    }
  }
  
  // Validate required fields
  const requiredFields = form.querySelectorAll('[required]');
  let hasErrors = false;
  
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.style.borderColor = '#dc3545';
      hasErrors = true;
    } else {
      field.style.borderColor = '#ddd';
    }
  });
  
  if (hasErrors) {
    showTemporaryMessage('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    console.log('Submitting task with properties:', properties);
    
    const response = await fetch(`${API_BASE}/add-todo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Task created successfully:', result);
    
    // Close panel and refresh
    hideAddTaskForm();
    clearTaskCache();
    getTodos();
    showTemporaryMessage('Task created successfully!', 'success');
    
  } catch (error) {
    console.error('Error creating task:', error);
    showTemporaryMessage(`Failed to create task: ${error.message}`, 'error');
  }
}


// Update todo status in Notion
async function updateTodoStatus(id, newStatus) {
  try {
    console.log(`Updating todo ${id} to status: ${newStatus}`);
    
    const response = await fetch(`${API_BASE}/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id: id, 
        status: newStatus 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Update successful:', result);
    // Clear cache since task was updated
    clearTaskCache();
    getTodos();
  } catch (error) {
    console.error('Error updating todo status:', error);
    alert(`Failed to update todo: ${error.message}\n\nCheck console for details.`);
  }
}

// Delete todo permanently
async function deleteTodo(id) {
  if (confirm('Are you sure you want to permanently delete this task?')) {
    try {
      console.log(`Deleting todo ${id}`);
      
      const response = await fetch(`${API_BASE}/delete-todo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Delete successful:', result);
      
      // Clear cache and refresh the todo list
      clearTaskCache();
      getTodos();
      
      // Show success message briefly
      showTemporaryMessage('Task deleted successfully!', 'success');
      
    } catch (error) {
      console.error('Error deleting todo:', error);
      console.log('Falling back to localStorage deletion');
      
      // Fallback to localStorage deletion
      deleteFromLocalStorage(id);
    }
  }
}

// Show temporary message
function showTemporaryMessage(message, type = 'info') {
  // Remove existing message if any
  const existingMessage = document.querySelector('.temp-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `temp-message temp-message-${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  
  // Set background color based on type
  if (type === 'success') {
    messageDiv.style.background = '#28a745';
  } else if (type === 'error') {
    messageDiv.style.background = '#dc3545';
  } else {
    messageDiv.style.background = '#007cba';
  }
  
  // Add to page
  document.body.appendChild(messageDiv);
  
  // Remove after 3 seconds
  setTimeout(() => {
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateX(100%)';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}


// Background settings functions
function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('show');
}

// Dark mode functionality
function toggleDarkMode() {
  const body = document.body;
  const isDarkMode = body.classList.toggle('dark-mode');
  
  // Save preference
  localStorage.setItem('dark-mode', isDarkMode);
}

function loadDarkModePreference() {
  const isDarkMode = localStorage.getItem('dark-mode') === 'true';
  const body = document.body;
  const toggle = document.getElementById('dark-mode-toggle');
  
  if (isDarkMode) {
    body.classList.add('dark-mode');
    if (toggle) toggle.checked = true;
  }
}

function setBackground(type) {
  const body = document.body;
  
  // Remove all background classes and custom styles
  body.className = body.className.replace(/bg-\w+/g, '');
  body.style.background = '';
  
  // Add new background class
  if (type !== 'none') {
    body.classList.add(`bg-${type}`);
  }
  
  // Save preference and clear others
  localStorage.setItem('background-preference', type);
  localStorage.removeItem('custom-background');
  localStorage.removeItem('uploaded-background');
  
  // Close settings panel
  document.getElementById('settings-panel').classList.remove('show');
}

function setCustomBackground() {
  const url = document.getElementById('custom-bg-url').value.trim();
  if (url) {
    // Remove all background classes first
    document.body.className = document.body.className.replace(/bg-\w+/g, '');
    
    // Apply custom background with lighter overlay
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('${url}') center/cover no-repeat fixed`;
    localStorage.setItem('custom-background', url);
    localStorage.removeItem('uploaded-background'); // Clear uploaded image
    localStorage.removeItem('background-preference'); // Clear preset background
    document.getElementById('settings-panel').classList.remove('show');
    clearUploadPreview();
  }
}

// Handle image file upload
function handleImageUpload() {
  const fileInput = document.getElementById('bg-file-input');
  const file = fileInput.files[0];
  
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    alert('Image file is too large. Please select a file smaller than 5MB.');
    return;
  }
  
  // Show loading status
  showUploadStatus('Processing image...');
  
  // Convert to data URL
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    showImagePreview(dataUrl, file.name);
    showUploadStatus('');
  };
  
  reader.onerror = function() {
    showUploadStatus('Error reading file. Please try again.');
  };
  
  reader.readAsDataURL(file);
}

// Show image preview with actions
function showImagePreview(dataUrl, filename) {
  console.log('🖼️ Showing image preview for:', filename);
  
  const preview = document.getElementById('upload-preview');
  preview.innerHTML = `
    <div class="preview-container" style="margin-top: 8px;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #666; font-weight: 500;">${filename}</p>
      <img src="${dataUrl}" alt="Preview" style="width: 100%; height: 60px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />
      <div class="preview-actions" style="display: flex; gap: 6px;">
        <button class="preview-btn apply-btn" onclick="applyUploadedBackground('${dataUrl}')" style="flex: 1; padding: 6px 8px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">✓ Apply</button>
        <button class="preview-btn remove-btn" onclick="clearUploadPreview()" style="flex: 1; padding: 6px 8px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">✕ Remove</button>
      </div>
    </div>
  `;
}

// Apply uploaded background
function applyUploadedBackground(dataUrl) {
  console.log('🖼️ Applying uploaded background...');
  
  // Remove all background classes first
  document.body.className = document.body.className.replace(/bg-\w+/g, '');
  
  // Apply the uploaded image as background
  document.body.style.background = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('${dataUrl}') center/cover no-repeat fixed`;
  
  // Store in localStorage for persistence
  localStorage.setItem('uploaded-background', dataUrl);
  localStorage.removeItem('custom-background'); // Clear URL background
  localStorage.removeItem('background-preference'); // Clear preset background
  
  console.log('✅ Uploaded background applied and saved to localStorage');
  
  // Close settings and show confirmation
  document.getElementById('settings-panel').classList.remove('show');
  showUploadStatus('Background applied successfully!');
  setTimeout(() => showUploadStatus(''), 2000);
  
  // Clear the preview
  clearUploadPreview();
}

// Clear upload preview
function clearUploadPreview() {
  document.getElementById('upload-preview').innerHTML = '';
  document.getElementById('bg-file-input').value = '';
  showUploadStatus('');
}

// Show upload status message
function showUploadStatus(message) {
  let statusDiv = document.querySelector('.upload-status');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.className = 'upload-status';
    document.querySelector('.upload-bg').appendChild(statusDiv);
  }
  statusDiv.textContent = message;
}

// Load saved background preference
function loadBackgroundPreference() {
  console.log('🎨 Loading background preferences...');
  
  const savedBg = localStorage.getItem('background-preference');
  const customBg = localStorage.getItem('custom-background');
  const uploadedBg = localStorage.getItem('uploaded-background');
  
  console.log('💾 Background preferences found:', {
    savedBg,
    customBg: !!customBg,
    uploadedBg: !!uploadedBg
  });
  
  if (uploadedBg) {
    // Prioritize uploaded background
    console.log('✅ Applying uploaded background from localStorage');
    document.body.className = document.body.className.replace(/bg-\w+/g, '');
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('${uploadedBg}') center/cover no-repeat fixed`;
  } else if (customBg) {
    // Custom URL background
    console.log('✅ Applying custom URL background from localStorage');
    document.body.className = document.body.className.replace(/bg-\w+/g, '');
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('${customBg}') center/cover no-repeat fixed`;
    const customBgInput = document.getElementById('custom-bg-url');
    if (customBgInput) {
      customBgInput.value = customBg;
    }
  } else if (savedBg) {
    // Preset background
    console.log('✅ Applying preset background from localStorage:', savedBg);
    setBackground(savedBg);
  } else {
    // Default gradient
    console.log('✅ Using default gradient background');
    document.body.className = document.body.className.replace(/bg-\w+/g, '');
    document.body.classList.add('bg-gradient1');
  }
}

// Close settings panel when clicking outside
document.addEventListener('click', function(e) {
  const panel = document.getElementById('settings-panel');
  const settingsBtn = document.querySelector('.settings-btn');
  
  if (!panel.contains(e.target) && !settingsBtn.contains(e.target)) {
    panel.classList.remove('show');
  }
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Load preferences
  loadDarkModePreference();
  loadBackgroundPreference();
  loadUpcomingFilterPreference();
  
  // Set initial view
  switchView('today');
});

// Load upcoming filter preference and set active button
function loadUpcomingFilterPreference() {
  const savedFilter = getCurrentUpcomingFilter();
  // Button will be set when upcoming view is first displayed
}

// Task Details Modal Functions
function openTaskDetails(taskId, taskTitle) {
  console.log('🔍 openTaskDetails called with:', { taskId, taskTitle });
  
  // Check if elements exist
  const modal = document.getElementById('task-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  console.log('📋 Modal elements found:', {
    modal: !!modal,
    modalTitle: !!modalTitle,
    modalBody: !!modalBody
  });
  
  if (!modal || !modalTitle || !modalBody) {
    console.error('❌ Modal elements not found');
    alert('Error: Modal elements not found. Please refresh the page.');
    return;
  }
  
  // Show modal immediately
  console.log('✅ Showing modal...');
  modal.classList.add('show');
  modalTitle.textContent = taskTitle || 'Task Details';
  
  // Try to get cached data first
  const cachedDetails = getCachedTaskDetails(taskId);
  console.log('💾 Cached details for task:', taskId, !!cachedDetails);
  
  if (cachedDetails) {
    console.log('✅ Using cached data for task:', taskId);
    displayTaskDetails(cachedDetails);
  } else {
    console.log('⚠️ No cached data found, fetching from API...');
    modalBody.innerHTML = '<div class="loading">Loading task details...</div>';
    
    // Fallback to API if no cached data
    fetchTaskDetailsFromAPI(taskId, taskTitle, modalBody);
  }
}

// Fallback function to fetch from API when cache is empty
async function fetchTaskDetailsFromAPI(taskId, taskTitle, modalBody) {
  try {
    console.log(`Fetching details for task ${taskId} from API`);
    
    const response = await fetch(`${API_BASE}/get-task-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: taskId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', response.status, errorText);
      
      if (response.status === 404) {
        showBasicTaskInfo(taskId, taskTitle);
        return;
      }
      
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const taskDetails = await response.json();
    console.log('Task details loaded from API:', taskDetails);
    
    // Cache the fetched data for next time
    taskDetailsCache.set(taskId, taskDetails);
    
    displayTaskDetails(taskDetails);
    
  } catch (error) {
    console.error('Error fetching task details:', error);
    showBasicTaskInfo(taskId, taskTitle, error.message);
  }
}

// Fallback function to show basic task info when API is unavailable
function showBasicTaskInfo(taskId, taskTitle, errorMessage) {
  console.log('⚠️ Showing basic task info for:', { taskId, taskTitle, errorMessage });
  
  const modalBody = document.getElementById('modal-body');
  
  if (!modalBody) {
    console.error('❌ Modal body not found in showBasicTaskInfo');
    return;
  }
  
  modalBody.innerHTML = `
    <div class="property-grid">
      <div class="property-item title">
        <div class="property-label">Task Name</div>
        <div class="property-value">${taskTitle}</div>
      </div>
      <div class="property-item">
        <div class="property-label">Task ID</div>
        <div class="property-value" style="font-family: monospace; font-size: 12px;">${taskId}</div>
      </div>
    </div>
    
    <div class="metadata-section">
      <div class="metadata-title">Note</div>
      <div style="padding: 12px; background: #fff3cd; border-radius: 8px; color: #856404; border-left: 3px solid #ffeb3b;">
        <strong>Limited Details Available</strong><br>
        ${errorMessage ? `Error: ${errorMessage}<br><br>` : ''}
        The task details function may not be deployed yet, or there might be a connection issue. 
        Basic information is shown instead.
      </div>
    </div>
  `;
  
  // Show edit button for basic info too
  const editBtn = document.getElementById('edit-task-btn');
  if (editBtn) {
    editBtn.style.display = 'none'; // Hide edit for basic info
  }
}

// Global variable to store current task details for editing
let currentTaskDetails = null;
let isEditingTask = false;

// Display task details in the modal
function displayTaskDetails(taskDetails) {
  currentTaskDetails = taskDetails; // Store for editing
  const modalBody = document.getElementById('modal-body');
  
  let propertiesHtml = '<div class="property-grid" id="task-properties">';
  
  // Display all properties dynamically
  Object.entries(taskDetails.properties).forEach(([propertyName, propertyData]) => {
    if (propertyData.displayValue || propertyData.displayValue === false || propertyData.displayValue === 0) {
      propertiesHtml += `
        <div class="property-item ${propertyData.type}" data-property="${propertyName}">
          <div class="property-label">${propertyName}</div>
          <div class="property-value ${!propertyData.displayValue ? 'empty' : ''}" id="prop-${propertyName}">
            ${formatPropertyValue(propertyData)}
          </div>
        </div>
      `;
    }
  });
  
  propertiesHtml += '</div>';
  
  // Add metadata section
  propertiesHtml += `
    <div class="metadata-section">
      <div class="metadata-title">Metadata</div>
      <div class="property-grid">
        <div class="property-item">
          <div class="property-label">Created</div>
          <div class="property-value">${new Date(taskDetails.created_time).toLocaleString()}</div>
        </div>
        <div class="property-item">
          <div class="property-label">Last Edited</div>
          <div class="property-value">${new Date(taskDetails.last_edited_time).toLocaleString()}</div>
        </div>
        <div class="property-item">
          <div class="property-label">Task ID</div>
          <div class="property-value" style="font-family: monospace; font-size: 12px;">${taskDetails.id}</div>
        </div>
      </div>
    </div>
  `;
  
  modalBody.innerHTML = propertiesHtml;
  
  // Show edit button
  document.getElementById('edit-task-btn').style.display = 'inline-block';
  hideEditButtons();
}

// Show/hide edit buttons
function showEditButtons() {
  document.getElementById('edit-task-btn').style.display = 'none';
  document.getElementById('save-task-btn').style.display = 'inline-block';
  document.getElementById('cancel-edit-btn').style.display = 'inline-block';
  document.getElementById('close-modal-btn').style.display = 'none';
}

function hideEditButtons() {
  document.getElementById('edit-task-btn').style.display = 'inline-block';
  document.getElementById('save-task-btn').style.display = 'none';
  document.getElementById('cancel-edit-btn').style.display = 'none';
  document.getElementById('close-modal-btn').style.display = 'inline-block';
}

// Edit task functionality
function editTask() {
  if (!currentTaskDetails) return;
  
  isEditingTask = true;
  showEditButtons();
  
  // Convert property values to editable inputs
  Object.entries(currentTaskDetails.properties).forEach(([propertyName, propertyData]) => {
    const propertyElement = document.getElementById(`prop-${propertyName}`);
    if (!propertyElement) return;
    
    const currentValue = propertyData.value || propertyData.displayValue || '';
    
    let inputHtml = '';
    switch (propertyData.type) {
      case 'title':
      case 'rich_text':
        inputHtml = `<input type="text" class="form-input" value="${escapeHtml(currentValue)}" data-property="${propertyName}" data-type="${propertyData.type}">`;
        break;
      case 'select':
        // For select, we'd need the schema to get options, so keep it simple for now
        inputHtml = `<input type="text" class="form-input" value="${escapeHtml(currentValue)}" data-property="${propertyName}" data-type="${propertyData.type}">`;
        break;
      case 'checkbox':
        const checked = propertyData.value ? 'checked' : '';
        inputHtml = `<label class="form-checkbox"><input type="checkbox" ${checked} data-property="${propertyName}" data-type="${propertyData.type}"> Yes</label>`;
        break;
      case 'number':
        inputHtml = `<input type="number" class="form-input" value="${currentValue}" data-property="${propertyName}" data-type="${propertyData.type}">`;
        break;
      case 'date':
        const dateValue = propertyData.value ? propertyData.value.split('T')[0] : '';
        inputHtml = `<input type="date" class="form-input" value="${dateValue}" data-property="${propertyName}" data-type="${propertyData.type}">`;
        break;
      case 'url':
        inputHtml = `<input type="url" class="form-input" value="${escapeHtml(currentValue)}" data-property="${propertyName}" data-type="${propertyData.type}">`;
        break;
      case 'email':
        inputHtml = `<input type="email" class="form-input" value="${escapeHtml(currentValue)}" data-property="${propertyName}" data-type="${propertyData.type}">`;
        break;
      default:
        inputHtml = `<input type="text" class="form-input" value="${escapeHtml(currentValue)}" data-property="${propertyName}" data-type="${propertyData.type}">`;
    }
    
    propertyElement.innerHTML = inputHtml;
  });
}

// Save task changes
async function saveTaskChanges() {
  if (!currentTaskDetails) return;
  
  const properties = {};
  
  // Collect all edited values
  document.querySelectorAll('[data-property]').forEach(input => {
    const propertyName = input.dataset.property;
    const propertyType = input.dataset.type;
    let value;
    
    if (input.type === 'checkbox') {
      value = input.checked;
    } else {
      value = input.value.trim();
    }
    
    if (value !== '' || input.type === 'checkbox') {
      properties[propertyName] = value;
      properties[propertyName + '_type'] = propertyType;
    }
  });
  
  try {
    console.log('Saving task changes:', properties);
    
    const response = await fetch(`${API_BASE}/update-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id: currentTaskDetails.id,
        properties: properties
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Task updated successfully:', result);
    
    // Close modal and refresh
    closeTaskModal();
    clearTaskCache();
    getTodos();
    showTemporaryMessage('Task updated successfully!', 'success');
    
  } catch (error) {
    console.error('Error updating task:', error);
    showTemporaryMessage(`Failed to update task: ${error.message}`, 'error');
  }
}

// Cancel task edit
function cancelTaskEdit() {
  if (!currentTaskDetails) return;
  
  isEditingTask = false;
  hideEditButtons();
  
  // Restore original display
  displayTaskDetails(currentTaskDetails);
}

// Format property values for display
function formatPropertyValue(propertyData) {
  if (!propertyData.displayValue && propertyData.displayValue !== false && propertyData.displayValue !== 0) {
    return '<em>Empty</em>';
  }
  
  // Handle URLs
  if (propertyData.type === 'url' && propertyData.displayValue) {
    return `<a href="${propertyData.displayValue}" target="_blank" rel="noopener noreferrer">${propertyData.displayValue}</a>`;
  }
  
  // Handle emails
  if (propertyData.type === 'email' && propertyData.displayValue) {
    return `<a href="mailto:${propertyData.displayValue}">${propertyData.displayValue}</a>`;
  }
  
  // Handle phone numbers
  if (propertyData.type === 'phone_number' && propertyData.displayValue) {
    return `<a href="tel:${propertyData.displayValue}">${propertyData.displayValue}</a>`;
  }
  
  // Handle checkboxes
  if (propertyData.type === 'checkbox') {
    return propertyData.value ? '✅ Yes' : '❌ No';
  }
  
  // Default display
  return propertyData.displayValue;
}

// Close task details modal
function closeTaskModal() {
  const modal = document.getElementById('task-modal');
  modal.classList.remove('show');
}

// Close modals when clicking outside
document.addEventListener('click', function(e) {
  const taskModal = document.getElementById('task-modal');
  
  if (e.target === taskModal) {
    closeTaskModal();
  }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const taskModal = document.getElementById('task-modal');
    const addTaskPanel = document.getElementById('add-task-panel');
    
    if (taskModal.classList.contains('show')) {
      closeTaskModal();
    }
    if (addTaskPanel.style.display === 'flex') {
      hideAddTaskForm();
    }
  }
});

// Run the function when the page loads
getTodos();