// Global variables
let currentUser = null;
let currentTab = 'overview';

// API Base URL - use existing one from script.js or define fallback
const API_URL = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL :
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://siveal-backend.onrender.com');

// Authentication utilities
function getAuthToken() {
    return localStorage.getItem('siveal_token');
}

function getCurrentUser() {
    const userData = localStorage.getItem('siveal_user');
    return userData ? JSON.parse(userData) : null;
}

function setAuthData(token, user) {
    localStorage.setItem('siveal_token', token);
    localStorage.setItem('siveal_user', JSON.stringify(user));
    currentUser = user;
}

function clearAuthData() {
    localStorage.removeItem('siveal_token');
    localStorage.removeItem('siveal_user');
    currentUser = null;
}

function makeAuthenticatedRequest(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    // Ensure URL uses full API URL
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    return fetch(fullUrl, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// Check authentication on page load
async function checkAuth() {
    try {
        const token = getAuthToken();
        if (!token) {
            console.error('No auth token found');
            redirectToLogin();
            return false;
        }

        const response = await makeAuthenticatedRequest('/api/auth/status');
        const data = await response.json();

        if (response.ok && data.isLoggedIn) {
            currentUser = data.user;
            updateHeaderLoginButton();
            return true;
        } else {
            console.error('Auth status check failed:', { status: response.status, data });
            // Don't clear auth data immediately - let user try again
            redirectToLogin();
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            url: `${API_URL}/api/auth/status`,
            token: getAuthToken() ? 'EXISTS' : 'NOT FOUND'
        });
        // Don't clear auth data on network errors - let user try again
        // clearAuthData(); // Commented out to allow retry
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

function updateHeaderLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && currentUser) {
        loginBtn.textContent = currentUser.username;
        loginBtn.href = '#';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            showProfileMenu();
        };
    }
}

function showProfileMenu() {
    if (confirm('Çıkış yapmak istiyor musun? (Do you want to logout?)')) {
        logout();
    }
}

async function logout() {
    try {
        await fetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    clearAuthData();
    window.location.href = 'index.html';
}

// Profile management
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    setupTabNavigation();
    setupProfileEditing();
    setupPasswordChange();
    loadProfileData();
});

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.profile-nav-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;

    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');

        if (tabName === 'admin' && currentUser?.role === 'admin') {
            loadAdminDashboard();
        }
    }
}

async function loadAdminDashboard() {
    try {
        const response = await makeAuthenticatedRequest('/api/admin/stats');
        const stats = await response.json();

        document.getElementById('total-articles').textContent = stats.totalArticles || '0';
        document.getElementById('total-users').textContent = stats.totalUsers || '0';
        document.getElementById('total-views').textContent = (stats.totalViews || 0).toLocaleString();

        // Show admin navigation
        document.getElementById('admin-nav-btn').style.display = 'block';
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showMessage('Failed to load admin data', 'error');
    }
}

async function loadProfileData() {
    try {
        const response = await makeAuthenticatedRequest('/api/profile');
        const profileData = await response.json();

        // Update profile info
        document.getElementById('profile-name').textContent = profileData.username;
        document.getElementById('profile-email').textContent = profileData.email;
        document.getElementById('profile-role').textContent = profileData.role === 'admin' ? 'Administrator' : 'Member';
        document.getElementById('profile-joined').textContent = `Joined: ${new Date(profileData.createdAt).toLocaleDateString()}`;
        document.getElementById('profile-last-login').textContent = profileData.lastLogin ?
            `Last Login: ${new Date(profileData.lastLogin).toLocaleDateString()}` : 'Last Login: Never';

        // Update edit form
        document.getElementById('edit-email').value = profileData.email;

        // Show admin tab if user is admin
        if (currentUser?.role === 'admin') {
            document.querySelector('[data-tab="admin"]').style.display = 'block';
        }

    } catch (error) {
        console.error('Error loading profile data:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            url: `${API_URL}/api/profile`,
            token: getAuthToken() ? 'EXISTS' : 'NOT FOUND'
        });
        showMessage('Failed to load profile data - check console for details', 'error');
    }
}

function setupProfileEditing() {
    const editForm = document.getElementById('profile-edit-form');

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('edit-email').value.trim();

        try {
            setFormLoading('profile-edit-form', true);

            const response = await makeAuthenticatedRequest('/api/profile', {
                method: 'PUT',
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Profile updated successfully!', 'success');
                loadProfileData(); // Reload profile data
            } else {
                showMessage(data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            setFormLoading('profile-edit-form', false);
        }
    });
}

function setupPasswordChange() {
    const passwordForm = document.getElementById('password-change-form');

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;

        if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            setFormLoading('password-change-form', true);

            const response = await makeAuthenticatedRequest('/api/profile', {
                method: 'PUT',
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Password changed successfully!', 'success');
                passwordForm.reset();
            } else {
                showMessage(data.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            setFormLoading('password-change-form', false);
        }
    });
}

function setFormLoading(formId, loading) {
    const form = document.getElementById(formId);
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input');

    submitBtn.disabled = loading;
    inputs.forEach(input => input.disabled = loading);

    if (loading) {
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
    } else {
        submitBtn.innerHTML = formId === 'profile-edit-form' ? 'Update Profile' : 'Change Password';
    }
}

function showMessage(text, type) {
    // Create or update message element
    let messageEl = document.getElementById('profile-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'profile-message';
        messageEl.className = 'message';
        document.querySelector('.container').insertBefore(messageEl, document.querySelector('.profile-content'));
    }

    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

function goToAdminPanel() {
    window.location.href = 'admin.html';
}

// Add loading spinner styles
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #e2e8f0;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
    }

    .message {
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
        margin-bottom: 20px;
    }

    .message.success {
        background: #16a34a;
        color: white;
    }

    .message.error {
        background: #dc2626;
        color: white;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
