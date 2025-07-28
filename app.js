// Check if we're running locally or on Netlify
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';

// Task details cache for instant access
let taskDetailsCache = new Map();

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
  displayTodos(filteredTodos);
  showTemporaryMessage('Task deleted successfully!', 'success');
}

// Add Task Modal Functions
let databaseSchema = null;

async function openAddTaskModal() {
  const modal = document.getElementById('add-task-modal');
  const modalBody = document.getElementById('add-task-body');
  
  // Show modal and loading state
  modal.classList.add('show');
  modalBody.innerHTML = '<div class="loading">Loading form fields...</div>';
  
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
    generateAddTaskForm(databaseSchema);
    
  } catch (error) {
    console.error('Error loading add task form:', error);
    modalBody.innerHTML = `
      <div class="loading" style="color: #dc3545;">
        Failed to load form: ${error.message}
        <br><br>
        <small>Using basic form instead.</small>
      </div>
    `;
    
    // Fallback to basic form
    setTimeout(() => generateBasicForm(), 1000);
  }
}

function generateAddTaskForm(schema) {
  const modalBody = document.getElementById('add-task-body');
  
  let formHtml = '<form id="add-task-form" class="form-grid">';
  
  schema.fields.forEach(field => {
    formHtml += generateFormField(field);
  });
  
  formHtml += '</form>';
  
  modalBody.innerHTML = formHtml;
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

function generateBasicForm() {
  const modalBody = document.getElementById('add-task-body');
  modalBody.innerHTML = `
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
    
    // Close modal and refresh
    closeAddTaskModal();
    clearTaskCache();
    getTodos();
    showTemporaryMessage('Task created successfully!', 'success');
    
  } catch (error) {
    console.error('Error creating task:', error);
    showTemporaryMessage(`Failed to create task: ${error.message}`, 'error');
  }
}

function closeAddTaskModal() {
  const modal = document.getElementById('add-task-modal');
  modal.classList.remove('show');
  
  // Reset form
  const form = document.getElementById('add-task-form');
  if (form) {
    form.reset();
    // Reset field styles
    const fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
    fields.forEach(field => {
      field.style.borderColor = '#ddd';
    });
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
      <span class="card-text" onclick="event.stopPropagation(); openTaskDetails('${todo.id}', '${escapeHtml(todo.text)}'); console.log('Card clicked:', '${todo.id}')">${todo.text}</span>
      <button onclick="event.stopPropagation(); deleteTodo('${todo.id}')" class="delete-btn">×</button>
    </div>
  `;
  
  // Add click event as backup
  const cardText = card.querySelector('.card-text');
  cardText.addEventListener('click', function(e) {
    e.stopPropagation();
    console.log('Card text clicked via event listener:', todo.id);
    openTaskDetails(todo.id, todo.text);
  });
  
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
    localStorage.removeItem('uploaded-background'); // Clear uploaded image
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
  const preview = document.getElementById('upload-preview');
  preview.innerHTML = `
    <div class="preview-container">
      <p style="margin: 0 0 5px 0; font-size: 11px; color: #666;">${filename}</p>
      <img src="${dataUrl}" alt="Preview" class="preview-image" />
      <div class="preview-actions">
        <button class="preview-btn apply-btn" onclick="applyUploadedBackground('${dataUrl}')">Apply</button>
        <button class="preview-btn remove-btn" onclick="clearUploadPreview()">Remove</button>
      </div>
    </div>
  `;
}

// Apply uploaded background
function applyUploadedBackground(dataUrl) {
  document.body.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${dataUrl}') center/cover no-repeat fixed`;
  localStorage.setItem('uploaded-background', dataUrl);
  localStorage.removeItem('custom-background'); // Clear URL background
  localStorage.removeItem('background-preference'); // Clear preset background
  document.getElementById('settings-panel').classList.remove('show');
  showUploadStatus('Background applied successfully!');
  setTimeout(() => showUploadStatus(''), 2000);
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
  const savedBg = localStorage.getItem('background-preference');
  const customBg = localStorage.getItem('custom-background');
  const uploadedBg = localStorage.getItem('uploaded-background');
  
  if (uploadedBg) {
    // Prioritize uploaded background
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${uploadedBg}') center/cover no-repeat fixed`;
  } else if (customBg) {
    // Custom URL background
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${customBg}') center/cover no-repeat fixed`;
    document.getElementById('custom-bg-url').value = customBg;
  } else if (savedBg) {
    // Preset background
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

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Load background preference
  loadBackgroundPreference();
});

// Task Details Modal Functions
function openTaskDetails(taskId, taskTitle) {
  console.log('Opening task details for:', taskId, taskTitle);
  
  const modal = document.getElementById('task-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  if (!modal || !modalTitle || !modalBody) {
    console.error('Modal elements not found');
    alert('Error: Modal elements not found. Please refresh the page.');
    return;
  }
  
  // Show modal immediately
  modal.classList.add('show');
  modalTitle.textContent = taskTitle || 'Task Details';
  
  // Try to get cached data first
  const cachedDetails = getCachedTaskDetails(taskId);
  
  if (cachedDetails) {
    console.log('Using cached data for task:', taskId);
    displayTaskDetails(cachedDetails);
  } else {
    console.log('No cached data found, fetching from API...');
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
  const modalBody = document.getElementById('modal-body');
  
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
}

// Display task details in the modal
function displayTaskDetails(taskDetails) {
  const modalBody = document.getElementById('modal-body');
  
  let propertiesHtml = '<div class="property-grid">';
  
  // Display all properties dynamically
  Object.entries(taskDetails.properties).forEach(([propertyName, propertyData]) => {
    if (propertyData.displayValue || propertyData.displayValue === false || propertyData.displayValue === 0) {
      propertiesHtml += `
        <div class="property-item ${propertyData.type}">
          <div class="property-label">${propertyName}</div>
          <div class="property-value ${!propertyData.displayValue ? 'empty' : ''}">
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
  const addTaskModal = document.getElementById('add-task-modal');
  
  if (e.target === taskModal) {
    closeTaskModal();
  }
  if (e.target === addTaskModal) {
    closeAddTaskModal();
  }
});

// Close modals with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const taskModal = document.getElementById('task-modal');
    const addTaskModal = document.getElementById('add-task-modal');
    
    if (taskModal.classList.contains('show')) {
      closeTaskModal();
    }
    if (addTaskModal.classList.contains('show')) {
      closeAddTaskModal();
    }
  }
});

// Run the function when the page loads
getTodos();