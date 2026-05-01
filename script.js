document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const tasksCount = document.getElementById('tasks-count');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const dateDisplay = document.getElementById('date-display');
    const todoDate = document.getElementById('todo-date');
    const todoTime = document.getElementById('todo-time');

    // --- State ---
    // Load tasks from Local Storage or initialize an empty array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all'; // 'all', 'pending', 'completed'

    // --- Initialize App ---
    displayDate();
    renderTasks();

    // --- Request Notification Permission ---
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // --- Event Listeners ---
    
    // Add new task
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (text !== '') {
            addTask(text);
            todoInput.value = '';
            todoDate.value = '';
            todoTime.value = '';
        }
    });

    // Handle clicks on the list (Complete, Edit, Delete)
    todoList.addEventListener('click', (e) => {
        const item = e.target.closest('.todo-item');
        if (!item) return;

        const id = item.dataset.id;

        // Toggle Complete
        if (e.target.closest('.checkbox-container')) {
            toggleTaskStatus(id);
        }
        
        // Delete Task
        if (e.target.closest('.delete-btn')) {
            deleteTask(id);
        }

        // Edit Task
        if (e.target.closest('.edit-btn')) {
            enableEditMode(item, id);
        }
    });

    // Clear completed tasks
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Filter tasks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active class
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter state and re-render
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // --- Functions ---

    // Display current date in the header
    function displayDate() {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        const today = new Date();
        dateDisplay.textContent = today.toLocaleDateString('en-US', options);
    }

    // Add a new task to the state
    function addTask(text) {
        const newTask = {
            id: Date.now().toString(), // Simple unique ID
            text: text,
            completed: false,
            dueDate: todoDate.value || null,
            dueTime: todoTime.value || null,
            notified: false
        };
        tasks.unshift(newTask); // Add to the beginning
        saveAndRender();
    }

    // Toggle completion status
    function toggleTaskStatus(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveAndRender();
    }

    // Delete a task
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveAndRender();
    }

    // Enable inline editing for a task
    function enableEditMode(itemElement, id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const textElement = itemElement.querySelector('.todo-text');
        
        // Create an input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.text;
        input.className = 'edit-input';
        
        // Replace text with input
        itemElement.replaceChild(input, textElement);
        input.focus();

        // Save changes on Enter or blur
        const saveEdit = () => {
            const newText = input.value.trim();
            if (newText) {
                task.text = newText;
            } else {
                // If empty, delete the task
                deleteTask(id);
                return;
            }
            saveAndRender();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') saveEdit();
        });
    }

    // Clear all completed tasks
    function clearCompleted() {
        tasks = tasks.filter(task => !task.completed);
        saveAndRender();
    }

    // Save state to Local Storage and update UI
    function saveAndRender() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }

    // Render tasks to the DOM based on current filter
    function renderTasks() {
        todoList.innerHTML = ''; // Clear current list

        // Filter tasks
        let filteredTasks = tasks;
        if (currentFilter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        // Render empty state if no tasks
        if (filteredTasks.length === 0) {
            todoList.innerHTML = `<li class="empty-state">No tasks found here.</li>`;
            updateFooterCount();
            return;
        }

        // Build HTML for each task
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `todo-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;

            li.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <span class="todo-text">
                    ${escapeHTML(task.text)}
                    ${task.dueDate || task.dueTime ? `<br><small style="color: var(--text-muted); font-size: 0.8em; margin-top: 4px; display: inline-block;">⏰ ${task.dueDate || ''} ${task.dueTime || ''}</small>` : ''}
                </span>
                <div class="action-btns">
                    <button class="icon-btn edit-btn" aria-label="Edit Task" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn delete-btn" aria-label="Delete Task" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            todoList.appendChild(li);
        });

        updateFooterCount();
    }

    // Update the "tasks left" counter
    function updateFooterCount() {
        const pendingCount = tasks.filter(task => !task.completed).length;
        tasksCount.textContent = `${pendingCount} item${pendingCount !== 1 ? 's' : ''} left`;
    }

    // Utility: Prevent XSS attacks by escaping HTML in user input
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Reminder / Alarm Logic ---
    setInterval(() => {
        if (tasks.length === 0) return;
        const now = new Date();
        const currentDateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const currentTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

        let updated = false;

        tasks.forEach(task => {
            if (!task.completed && !task.notified && task.dueDate && task.dueTime) {
                if (task.dueDate === currentDateStr && task.dueTime === currentTimeStr) {
                    triggerAlarm(task.text);
                    task.notified = true;
                    updated = true;
                }
            }
        });

        if (updated) {
            saveAndRender();
        }
    }, 30000); // Check every 30 seconds

    function triggerAlarm(taskText) {
        // Show Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification("To-Do Reminder", {
                body: `⏰ It's time to: ${taskText}`
            });
        }
        
        // Play offline beep sound using Web Audio API
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime); // Volume
            osc.start();
            setTimeout(() => osc.stop(), 400); // 400ms beep duration
        } catch (e) {
            console.log("Audio API not supported in this browser.");
        }
    }
});
