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
    // Fallback to localStorage if API fails
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
    // Default todos for first time users
    const defaultTodos = [
      { id: '1', text: "Learn JavaScript", completed: false },
      { id: '2', text: "Build todo app", completed: true },
      { id: '3', text: "Deploy to Netlify", completed: false }
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
    // Refresh the todo list
    getTodos();
  } catch (error) {
    console.error('Error adding todo:', error);
    alert('Failed to add todo. Please try again.');
  }
}

// Toggle todo completion in Notion
async function toggleTodo(id) {
  try {
    // First get current state from DOM to determine new state
    const todoElement = document.querySelector(`[data-id="${id}"]`);
    const isCurrentlyCompleted = todoElement?.classList.contains('completed') || false;
    const newCompletedState = !isCurrentlyCompleted;

    const response = await fetch(`${API_BASE}/toggle-todo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id: id, 
        completed: newCompletedState 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Refresh the todo list
    getTodos();
  } catch (error) {
    console.error('Error toggling todo:', error);
    alert('Failed to toggle todo. Please try again.');
  }
}

// Delete todo (for now, we'll just toggle it as completed)
async function deleteTodo(id) {
  if (confirm('Are you sure you want to mark this as completed?')) {
    // Since Notion doesn't easily support deletion, we'll mark as completed
    await toggleTodo(id);
  }
}

// Function to display todos on the webpage
function displayTodos(todos) {
  const todoListElement = document.getElementById('todo-list');
  todoListElement.innerHTML = ''; // Clear previous list

  if (todos.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'No tasks yet. Add one above!';
    emptyItem.className = 'empty';
    todoListElement.appendChild(emptyItem);
    return;
  }

  todos.forEach(todo => {
    const listItem = document.createElement('li');
    listItem.className = todo.completed ? 'completed' : '';
    listItem.setAttribute('data-id', todo.id);
    
    listItem.innerHTML = `
      <span onclick="toggleTodo('${todo.id}')" class="todo-text">${todo.text}</span>
      <button onclick="deleteTodo('${todo.id}')" class="delete-btn">×</button>
    `;
    
    todoListElement.appendChild(listItem);
  });
}

// Add Enter key support for input
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('new-todo');
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });
});

// Run the function when the page loads
getTodos();