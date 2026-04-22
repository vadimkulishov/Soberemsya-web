// Configuration
const API_BASE_URL = 'http://localhost:8001/api';
const TOKEN_KEY = 'admin_token';

// DOM Elements
const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const usersTbody = document.getElementById('users-tbody');
const loadingEl = document.getElementById('loading');
const errorMessageEl = document.getElementById('error-message');
const loginErrorEl = document.getElementById('login-error');
const roleModal = document.getElementById('role-modal');
const confirmRoleBtn = document.getElementById('confirm-role-btn');
const cancelRoleBtn = document.getElementById('cancel-role-btn');

// State
let authToken = localStorage.getItem(TOKEN_KEY);
let currentUser = null;
let selectedUserId = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    if (authToken) {
        showAdminView();
        loadUsers();
    } else {
        showLoginView();
    }
    
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    searchBtn.addEventListener('click', handleSearch);
    confirmRoleBtn.addEventListener('click', confirmRoleChange);
    cancelRoleBtn.addEventListener('click', closeModal);
}

// ============== Login ==============

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showLoading(true);
    loginErrorEl.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const data = await response.json();
        
        // Check if user is admin
        if (data.user.role !== 'admin') {
            throw new Error('Only admins can access this panel');
        }
        
        authToken = data.access_token;
        currentUser = data.user;
        localStorage.setItem(TOKEN_KEY, authToken);
        
        loginForm.reset();
        showAdminView();
        loadUsers();
    } catch (error) {
        console.error('Login error:', error);
        loginErrorEl.textContent = error.message;
        loginErrorEl.style.display = 'block';
    } finally {
        showLoading(false);
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    showLoginView();
    loginForm.reset();
}

// ============== UI ==============

function showLoginView() {
    loginView.classList.add('active');
    adminView.classList.remove('active');
}

function showAdminView() {
    loginView.classList.remove('active');
    adminView.classList.add('active');
}

function showLoading(show) {
    loadingEl.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.style.display = 'block';
    setTimeout(() => {
        errorMessageEl.style.display = 'none';
    }, 5000);
}

// ============== Users Management ==============

async function loadUsers() {
    showLoading(true);
    errorMessageEl.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/registrations/admin/users`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                showError('You do not have admin access');
                handleLogout();
                return;
            }
            throw new Error('Failed to load users');
        }
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Load users error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        loadUsers();
        return;
    }
    
    showLoading(true);
    errorMessageEl.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/registrations/admin/users?search=${encodeURIComponent(query)}`, {
            headers: {'Authorization': `Bearer ${authToken}`}
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Search error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function displayUsers(users) {
    usersTbody.innerHTML = '';
    
    if (users.length === 0) {
        usersTbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.full_name || '-')}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td><button class="btn btn-sm btn-primary" onclick="openRoleModal(${user.id}, '${escapeHtml(user.username)}', '${user.role}')">Change Role</button></td>
        `;
        usersTbody.appendChild(row);
    });
}

// ============== Role Management ==============

function openRoleModal(userId, username, currentRole) {
    selectedUserId = userId;
    document.getElementById('modal-user-info').textContent = `Change role for ${username} (currently: ${currentRole})`;
    document.getElementById('role-select').value = currentRole;
    roleModal.style.display = 'flex';
}

function closeModal() {
    roleModal.style.display = 'none';
    selectedUserId = null;
}

async function confirmRoleChange() {
    const newRole = document.getElementById('role-select').value;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/registrations/admin/change-role`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({user_id: selectedUserId, new_role: newRole})
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to change role');
        }
        
        closeModal();
        loadUsers();
    } catch (error) {
        console.error('Role change error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// ============== Utilities ==============

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return typeof text === 'string' ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === roleModal) {
        closeModal();
    }
});
