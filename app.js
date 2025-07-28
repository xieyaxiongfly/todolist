// Check if we're running locally or on Netlify
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';

// Load todos from Notion via serverless function
async function getTodos() {
  try {
    const response = await fetch(`${API_BASE}/get-todos`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const todos = await response.json();
    displayTodos(todos);
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
    displayTodos(todos);
  } else {
    const defaultTodos = [
      { id: '1', text: "Learn JavaScript", status: "To Do", completed: false },
      { id: '2', text: "Build todo app", status: "In Progress", completed: false },
      { id: '3', text: "Deploy to Netlify", status: "Done", completed: true }
    ];
    localStorage.setItem('todos', JSON.stringify(defaultTodos));
    displayTodos(defaultTodos);
  }
}

// Add new todo to Notion
async function addTodo() {
  const input = document.getElementById('new-todo');
  const text = input.value.trim();
  
  if (text === '') return;
  
  try {
    const response = await fetch(`${API_BASE}/add-todo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    input.value = '';
    getTodos();
  } catch (error) {
    console.error('Error adding todo:', error);
    alert('Failed to add todo. Please try again.');
  }
}

// Update todo status in Notion
async function updateTodoStatus(id, newStatus) {
  try {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    getTodos();
  } catch (error) {
    console.error('Error updating todo status:', error);
    alert('Failed to update todo. Please try again.');
  }
}

// Delete todo (mark as done for now)
async function deleteTodo(id) {
  if (confirm('Are you sure you want to delete this task?')) {
    await updateTodoStatus(id, 'Done');
  }
}

// Display todos in Trello-like columns
function displayTodos(todos) {
  const columns = {
    'To Do': document.getElementById('todo-column'),
    'In Progress': document.getElementById('inprogress-column'),
    'Done': document.getElementById('done-column'),
    'Blocked': document.getElementById('blocked-column')
  };

  // Clear all columns
  Object.values(columns).forEach(column => {
    column.innerHTML = '';
  });

  // Group todos by status
  const todosByStatus = {
    'To Do': [],
    'In Progress': [],
    'Done': [],
    'Blocked': []
  };

  todos.forEach(todo => {
    const status = todo.status || 'To Do';
    if (todosByStatus[status]) {
      todosByStatus[status].push(todo);
    } else {
      todosByStatus['To Do'].push(todo);
    }
  });

  // Display todos in their respective columns
  Object.entries(todosByStatus).forEach(([status, statusTodos]) => {
    const column = columns[status];
    
    if (statusTodos.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-column';
      emptyDiv.textContent = 'No tasks here yet';
      column.appendChild(emptyDiv);
    } else {
      statusTodos.forEach(todo => {
        const card = createTodoCard(todo);
        column.appendChild(card);
      });
    }
  });

  // Re-initialize drag and drop
  initializeDragAndDrop();
}

// Create a todo card element
function createTodoCard(todo) {
  const card = document.createElement('li');
  card.className = 'card';
  card.draggable = true;
  card.setAttribute('data-id', todo.id);
  card.setAttribute('data-status', todo.status || 'To Do');
  
  card.innerHTML = `
    <div class="card-content">
      <span class="card-text">${todo.text}</span>
      <button onclick="deleteTodo('${todo.id}')" class="delete-btn">×</button>
    </div>
  `;
  
  return card;
}

// Initialize drag and drop functionality
function initializeDragAndDrop() {
  const cards = document.querySelectorAll('.card');
  const columns = document.querySelectorAll('.card-list');

  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });

  columns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragenter', handleDragEnter);
    column.addEventListener('dragleave', handleDragLeave);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  this.classList.remove('drag-over');

  if (draggedElement !== this) {
    const newStatus = this.closest('.column').getAttribute('data-status');
    const todoId = draggedElement.getAttribute('data-id');
    
    // Update status in Notion
    updateTodoStatus(todoId, newStatus);
  }

  return false;
}

// Background settings functions
function toggleSettings() {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('show');
}

function setBackground(type) {
  const body = document.body;
  
  // Remove all background classes
  body.className = body.className.replace(/bg-\w+/g, '');
  
  // Add new background class
  if (type !== 'none') {
    body.classList.add(`bg-${type}`);
  }
  
  // Save preference
  localStorage.setItem('background-preference', type);
  
  // Close settings panel
  document.getElementById('settings-panel').classList.remove('show');
}

function setCustomBackground() {
  const url = document.getElementById('custom-bg-url').value.trim();
  if (url) {
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${url}') center/cover no-repeat fixed`;
    localStorage.setItem('custom-background', url);
    document.getElementById('settings-panel').classList.remove('show');
  }
}

// Load saved background preference
function loadBackgroundPreference() {
  const savedBg = localStorage.getItem('background-preference');
  const customBg = localStorage.getItem('custom-background');
  
  if (customBg) {
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${customBg}') center/cover no-repeat fixed`;
    document.getElementById('custom-bg-url').value = customBg;
  } else if (savedBg) {
    setBackground(savedBg);
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

// Add Enter key support for input
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('new-todo');
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
  
  // Load background preference
  loadBackgroundPreference();
});

// Run the function when the page loads
getTodos();