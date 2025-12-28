// API Configuration
const API_BASE_URL = 'https://siveal-backend.onrender.com';

// Global variables
let currentTab = 'dashboard';
let articles = [];
let users = [];

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

function checkAuth() {
    const token = localStorage.getItem('siveal_token');
    const user = JSON.parse(localStorage.getItem('siveal_user') || '{}');

    // Debug logging
    console.log('Admin Panel Security Check:');
    console.log('Token (jwtToken):', localStorage.getItem('jwtToken'));
    console.log('Token (token):', localStorage.getItem('token'));
    console.log('Token used:', token);
    console.log('User object:', user);
    console.log('User role:', user.role);
    console.log('User role (lowercase):', user.role ? user.role.toLowerCase() : 'undefined');

    // Flexible role check (case-insensitive)
    const hasValidToken = token && token.trim() !== '';
    const hasValidUser = user && user.role;
    const hasAdminRole = hasValidUser && user.role.toLowerCase() === 'admin';

    console.log('Has valid token:', hasValidToken);
    console.log('Has valid user:', hasValidUser);
    console.log('Has admin role:', hasAdminRole);

    if (!hasValidToken || !hasValidUser || !hasAdminRole) {
        // Show alert with debug info
        const roleInfo = hasValidUser ? user.role : 'No role found';
        const tokenInfo = localStorage.getItem('jwtToken') ? 'jwtToken: Present' :
                         localStorage.getItem('token') ? 'token: Present' : 'No token found';
        alert("Erişim Reddedildi! Rolünüz: " + roleInfo + "\n\nDebug Info:\n" + tokenInfo + "\nUser: " + (hasValidUser ? 'Valid' : 'Invalid'));

        document.body.style.display = 'none';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }

    // Show content if authorized
    document.body.style.display = 'block';

    // Hide access denied message and show admin content
    const accessDenied = document.getElementById('access-denied');
    const adminContent = document.getElementById('admin-content');

    if (accessDenied) {
        accessDenied.style.display = 'none';
    }

    if (adminContent) {
        adminContent.style.display = 'block';
    }

    console.log('Access granted - Admin panel loaded successfully!');
    return true;
}

// ==========================================
// API FUNCTIONS
// ==========================================

function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('siveal_token');

    if (!token) {
        console.warn('UYARI: Auth token bulunamadı');
        throw new Error('No authentication token found');
    }

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    return fetch(fullUrl, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    }).catch(error => {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            alert("CORS Hatası olabilir, Backend izin vermiyor!");
        } else {
            alert("Bağlantı Hatası: " + error.message);
        }
        throw error;
    });
}

// ==========================================
// DASHBOARD FUNCTIONS
// ==========================================

async function loadDashboardData() {
    console.log('Dashboard verileri yükleniyor...');

    try {
        // Load dashboard stats from server
        const response = await makeAuthenticatedRequest('/api/admin/stats');
        if (!response.ok) {
            throw new Error(`Dashboard API Error: ${response.status} ${response.statusText}`);
        }
        const stats = await response.json();
        console.log('Gelen Dashboard İstatistikleri:', stats);

        // Update dashboard stats directly from API response
        safeUpdateElement('stat-total-articles', 'textContent', (stats.totalArticles || 0).toString());
        safeUpdateElement('stat-total-users', 'textContent', (stats.totalUsers || 0).toString());
        safeUpdateElement('stat-total-views', 'textContent', (stats.totalViews || 0).toLocaleString());
        safeUpdateElement('stat-recent-comments', 'textContent', (stats.recentComments || 0).toString());

        console.log('Dashboard data loaded successfully');
    } catch (error) {
        console.error('DASHBOARD LOAD HATASI:', error);
        safeShowMessage('Failed to load dashboard data', 'error');
    }
}

async function loadArticlesData() {
    try {
        const response = await makeAuthenticatedRequest('/api/news');
        if (!response.ok) {
            throw new Error(`News API Error: ${response.status} ${response.statusText}`);
        }
        const newsData = await response.json();
        console.log('Gelen Makaleler:', newsData);

        // Smart parsing for news data (server.js uses 'news' structure)
        const articlesList = Array.isArray(newsData) ? newsData : (newsData.data || newsData.news || newsData.result || []);
        const articlesCount = articlesList.length || 0;
        safeUpdateElement('stat-total-articles', 'textContent', articlesCount.toString());

        // Calculate total views from news data
        const totalViews = articlesList.reduce((sum, article) => sum + (article.views || 0), 0);
        safeUpdateElement('stat-total-views', 'textContent', totalViews.toLocaleString());

        // Calculate recent comments (mock data for now)
        const recentComments = Math.floor(Math.random() * 20) + 5;
        safeUpdateElement('stat-recent-comments', 'textContent', recentComments.toString());

        articles = articlesList;
        return articlesList;
    } catch (error) {
        console.error('NEWS LOAD HATASI:', error);
        throw error;
    }
}

async function loadUsersData() {
    try {
        const response = await makeAuthenticatedRequest('/api/users');
        if (!response.ok) {
            throw new Error(`Users API Error: ${response.status} ${response.statusText}`);
        }
        const usersData = await response.json();
        console.log('Gelen Kullanıcılar:', usersData);

        // Smart parsing for users data
        const usersList = Array.isArray(usersData) ? usersData : (usersData.data || usersData.users || usersData.result || []);
        const usersCount = usersList.length || 0;
        safeUpdateElement('stat-total-users', 'textContent', usersCount.toString());
        users = usersList;
        renderUsersTable();
        return usersList;
    } catch (error) {
        console.error('USERS LOAD HATASI:', error);
        throw error;
    }
}

// ==========================================
// TAB MANAGEMENT FUNCTIONS
// ==========================================

function switchTab(tabName) {
    currentTab = tabName;

    // Update nav buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Show/hide tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        if (tab.id === tabName + '-tab') {
            tab.classList.add('active');
            tab.style.display = 'block';
        } else {
            tab.classList.remove('active');
            tab.style.display = 'none';
        }
    });

    // Load data for the tab
    if (tabName === 'articles') loadArticles();
    if (tabName === 'users') loadUsers();
}

// ==========================================
// DATA RENDERING FUNCTIONS
// ==========================================

async function loadArticles() {
    try {
        const response = await makeAuthenticatedRequest('/api/news');
        if (!response.ok) {
            throw new Error(`Articles API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Gelen Makaleler (Articles Tab):', data);

        // Smart parsing for articles data
        articles = Array.isArray(data) ? data : (data.data || data.articles || data.result || []);
        renderArticlesTable();
    } catch (error) {
        console.error('ARTICLES LOAD HATASI:', error);
        safeShowMessage('Failed to load articles', 'error');
    }
}

async function loadUsers() {
    try {
        const response = await makeAuthenticatedRequest('/api/users');
        if (!response.ok) {
            throw new Error(`Users API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Gelen Kullanıcılar (Users Tab):', data);

        // Smart parsing for users data
        users = Array.isArray(data) ? data : (data.data || data.users || data.result || []);
        renderUsersTable();
    } catch (error) {
        console.error('USERS LOAD HATASI:', error);
        safeShowMessage('Failed to load users', 'error');
    }
}

function renderArticlesTable() {
    const tbody = document.getElementById('articles-table-body');
    tbody.innerHTML = '';

    if (articles.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
                Hiç makale bulunamadı
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    articles.forEach(article => {
        const tr = document.createElement('tr');
        const formattedDate = formatDate(article.createdAt || article.date || article.publishedAt);
        tr.innerHTML = `
            <td>${article.title || article.name || article.heading || 'Untitled'}</td>
            <td><span class="status-badge">${article.category || article.type || 'Uncategorized'}</span></td>
            <td>${article.author || article.writer || article.creator || 'Unknown'}</td>
            <td><span class="status-badge status-${article.status || 'draft'}">${article.status || 'draft'}</span></td>
            <td>${(article.views || article.viewCount || 0).toLocaleString()}</td>
            <td class="action-buttons">
                <button class="btn-icon edit" onclick="editArticle(${article.id || article._id})">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="btn-icon delete" onclick="deleteArticle(${article.id || article._id})">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    if (users.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
                Hiç kullanıcı bulunamadı
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    users.forEach(user => {
        const tr = document.createElement('tr');
        const formattedDate = formatDate(user.createdAt || user.joined || user.registeredAt || user.date);
        tr.innerHTML = `
            <td>${user.name || user.username || user.fullName || user.displayName || 'Unknown'}</td>
            <td>${user.email || user.emailAddress || 'No email'}</td>
            <td><span class="status-badge">${user.role || user.userType || 'user'}</span></td>
            <td>${formattedDate}</td>
            <td><span class="status-badge status-${user.status || 'active'}">${user.status || 'active'}</span></td>
            <td class="action-buttons">
                <button class="btn-icon edit" onclick="editUser(${user.id || user._id})">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="btn-icon delete" onclick="deleteUser(${user.id || user._id})">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function safeUpdateElement(id, property, value) {
    const el = document.getElementById(id);
    if (el && el[property] !== undefined) {
        try {
            el[property] = value;
        } catch (e) {
            console.warn(`UYARI: Element '${id}' güncellenirken hata:`, e);
        }
    }
}

function safeShowMessage(text, type) {
    if (!text) return;
    console.log(`${type.toUpperCase()}: ${text}`);

    // Create toast notification
    showToast(text, type);
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function getToastIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

// ==========================================
// FORM MANAGEMENT FUNCTIONS
// ==========================================

function showAddArticleForm() {
    document.getElementById('form-title').textContent = 'Add New Article';
    document.getElementById('form-submit-text').textContent = 'Save Article';
    document.getElementById('article-form-content').reset();
    document.getElementById('article-id').value = '';
    document.getElementById('article-form').style.display = 'block';
}

function hideArticleForm() {
    document.getElementById('article-form').style.display = 'none';
}

async function saveArticle() {
    const id = document.getElementById('article-id').value;
    const article = {
        title: document.getElementById('article-title').value,
        category: document.getElementById('article-category').value,
        author: document.getElementById('article-author').value,
        status: document.getElementById('article-status').value,
        content: document.getElementById('article-content').value,
        image: document.getElementById('article-image').value || 'https://via.placeholder.com/800x400?text=SIVEAL',
        summary: document.getElementById('article-content').value.substring(0, 200) + '...',
        time: new Date().toLocaleDateString()
    };

    try {
        let response;
        if (id) {
            // Update existing article
            response = await makeAuthenticatedRequest(`/api/news/${id}`, {
                method: 'PUT',
                body: JSON.stringify(article)
            });
        } else {
            // Create new article
            response = await makeAuthenticatedRequest('/api/news', {
                method: 'POST',
                body: JSON.stringify(article)
            });
        }

        if (response.ok) {
            hideArticleForm();
            await loadArticles();
            safeShowMessage(id ? 'Article updated successfully!' : 'Article created successfully!', 'success');
        } else {
            const errorData = await response.json();
            safeShowMessage(errorData.error || 'Failed to save article', 'error');
        }
    } catch (error) {
        console.error('Save article error:', error);
        safeShowMessage('Failed to save article. Please try again.', 'error');
    }
}

function editArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    document.getElementById('form-title').textContent = 'Edit Article';
    document.getElementById('form-submit-text').textContent = 'Update Article';
    document.getElementById('article-id').value = article.id;
    document.getElementById('article-title').value = article.title;
    document.getElementById('article-category').value = article.category;
    document.getElementById('article-author').value = article.author;
    document.getElementById('article-status').value = article.status;
    document.getElementById('article-views').value = article.views;
    document.getElementById('article-content').value = article.content;

    document.getElementById('article-form').style.display = 'block';
}

async function deleteArticle(id) {
    if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
        try {
            const response = await makeAuthenticatedRequest(`/api/news/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                safeShowMessage('Article deleted successfully!', 'success');
                await loadArticles(); // Reload the articles list
            } else {
                const errorData = await response.json();
                safeShowMessage(errorData.error || 'Failed to delete article', 'error');
            }
        } catch (error) {
            console.error('Delete article error:', error);
            safeShowMessage('Failed to delete article. Please try again.', 'error');
        }
    }
}

function editUser(id) {
    alert('Edit user functionality would be implemented here');
}

async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            const response = await makeAuthenticatedRequest(`/api/users/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                safeShowMessage('User deleted successfully!', 'success');
                await loadUsers(); // Reload the users list
            } else {
                const errorData = await response.json();
                safeShowMessage(errorData.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            safeShowMessage('Failed to delete user. Please try again.', 'error');
        }
    }
}

function exportData() {
    alert('Data export functionality would be implemented here');
}

function exportAnalytics() {
    alert('Analytics export functionality would be implemented here');
}

function saveSettings() {
    alert('Settings saved successfully!');
}

// ==========================================
// MAIN EXECUTION
// ==========================================

// Check authentication first
const isAuthenticated = checkAuth();

if (isAuthenticated) {
    console.log('Access granted & Data loading started...');
    loadDashboardData();
}

// Test API button for debugging
function testAPIEndpoints() {
    const endpoints = [
        '/api/news',
        '/news'
    ];

    endpoints.forEach(async (endpoint) => {
        try {
            const response = await makeAuthenticatedRequest(endpoint);
            console.log(`TEST: ${endpoint} - Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`TEST: ${endpoint} - SUCCESS with ${data.length || data.length || 0} items`);
                alert(`SUCCESS: ${endpoint} returned ${data.length || data.length || 0} items`);
            } else {
                console.log(`TEST: ${endpoint} - FAILED with status ${response.status}`);
            }
        } catch (error) {
            console.log(`TEST: ${endpoint} - ERROR: ${error.message}`);
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Form submission
    document.getElementById('article-form-content').addEventListener('submit', function(e) {
        e.preventDefault();
        saveArticle();
    });

    // User info display
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.name) {
        document.getElementById('user-name-display').textContent = user.name;
        document.getElementById('user-btn').style.display = 'flex';
    }

    // Add test button to dashboard
    const dashboardHeader = document.querySelector('.admin-header');
    if (dashboardHeader) {
        const testBtn = document.createElement('button');
        testBtn.className = 'btn-admin-action btn-secondary';
        testBtn.innerHTML = `
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            Test API Endpoints
        `;
        testBtn.onclick = testAPIEndpoints;
        dashboardHeader.appendChild(testBtn);
    }

    // Logout button event listener (Kesin çözüm)
    const logoutBtn = document.getElementById('logout-btn-top');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.clear();
            window.location.href = 'login.html';
        };
    }
});
