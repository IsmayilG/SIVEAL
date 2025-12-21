let currentUser = null;
let currentTab = 'overview';

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuthForProfile();

    // Setup tab switching
    setupTabNavigation();

    // Setup profile editing
    setupProfileEditing();

    // Setup password change
    setupPasswordChange();

    // Setup avatar editing
    setupAvatarEditing();

    // Setup activity filtering
    setupActivityFiltering();

    // Load initial data
    loadProfileData();
});

async function checkAuthForProfile() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();

        if (!data.isLoggedIn) {
            window.location.href = '/login.html';
            return;
        }

        currentUser = {
            username: data.username,
            role: data.role
        };

        console.log('Auth check successful:', currentUser);

        // Update header login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.textContent = 'Profile';
            loginBtn.href = '#';
            loginBtn.onclick = () => showProfileMenu();
        }
    } catch (error) {
        console.log('Auth check failed');
        window.location.href = '/login.html';
    }
}

function showProfileMenu() {
    // Same as index.js
    if (confirm('Çıkış yapmak istiyor musun?')) {
        window.location.href = '/logout';
    }
}

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.profile-nav-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);

            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;

    // Hide all tabs
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');

        // Load admin dashboard data if admin tab is selected
        if (tabName === 'admin') {
            loadAdminDashboard();
        }
    }
}

async function loadAdminDashboard() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update admin stats
        document.getElementById('total-articles').textContent = stats.totalArticles || '0';
        document.getElementById('total-users').textContent = stats.totalUsers || '1';
        document.getElementById('total-views').textContent = stats.totalViews || '0';

        // Calculate recent comments (mock data for now)
        document.getElementById('recent-comments').textContent = '12';

    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        // Set default values
        document.getElementById('total-articles').textContent = '0';
        document.getElementById('total-users').textContent = '1';
        document.getElementById('total-views').textContent = '0';
        document.getElementById('recent-comments').textContent = '0';
    }
}

async function loadProfileData() {
    try {
        alert('🔄 Loading profile data...');

        // Test with a working endpoint first
        alert('🔍 Testing /api/news endpoint first...');
        const newsResponse = await fetch('/api/news');
        alert(`📄 News API response: ${newsResponse.status}`);

        if (!newsResponse.ok) {
            alert('💥 Even /api/news is not working! Server is down.');
            throw new Error('Server is not responding');
        }

        alert('✅ Server is working, now testing /api/profile...');

        // Load user profile data
        const profileResponse = await fetch('/api/profile');
        alert(`📥 Profile API response: ${profileResponse.status}`);

        if (!profileResponse.ok) {
            throw new Error(`Profile API failed: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        alert(`📄 Profile data received: ${JSON.stringify(profileData)}`);

        // Update profile info
        document.getElementById('profile-name').textContent = profileData.displayName || currentUser.username;
        document.getElementById('profile-email').textContent = profileData.email || 'Error loading...';
        document.getElementById('profile-role').textContent = currentUser.role === 'admin' ? 'Administrator' : 'Member';
        document.getElementById('profile-joined').textContent = `Joined: ${profileData.joinedAt || 'Recently'}`;

        // Update avatar
        if (profileData.avatar) {
            document.getElementById('profile-avatar').src = profileData.avatar;
        }

        // Update stats
        document.getElementById('articles-read').textContent = profileData.articlesRead || '0';
        document.getElementById('comments-posted').textContent = profileData.commentsPosted || '0';
        document.getElementById('account-age').textContent = profileData.accountAge || '0';
        document.getElementById('favorite-category').textContent = profileData.favoriteCategory || 'N/A';

        // Update edit form
        document.getElementById('edit-display-name').value = profileData.displayName || '';
        document.getElementById('edit-bio').value = profileData.bio || '';
        document.getElementById('edit-website').value = profileData.website || '';
        document.getElementById('edit-location').value = profileData.location || '';

        // Load activity
        loadActivityData();

        // Show admin nav button if user is admin
        alert(`👤 Current user role: ${currentUser.role}`);
        if (currentUser.role === 'admin') {
            alert('✅ Showing admin nav button');
            document.getElementById('admin-nav-btn').style.display = 'block';
        } else {
            alert('❌ Hiding admin nav button - user is not admin');
        }

        alert('✅ Profile data loaded successfully!');

    } catch (error) {
        alert(`💥 Error loading profile data: ${error.message}`);
        console.error('Error loading profile data:', error);

        // Show default data
        document.getElementById('profile-name').textContent = currentUser ? currentUser.username : 'Unknown';
        document.getElementById('profile-email').textContent = 'Error loading profile';
        document.getElementById('profile-role').textContent = 'Member';
        document.getElementById('profile-joined').textContent = 'Joined: Recently';
    }
}

async function loadActivityData() {
    try {
        const response = await fetch('/api/user/activity');
        const activities = await response.json();

        const activityList = document.getElementById('activity-list');
        if (activities.length === 0) {
            activityList.innerHTML = '<p>No activity found</p>';
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description} • ${new Date(activity.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activity:', error);
        document.getElementById('activity-list').innerHTML = '<p>Unable to load activity</p>';
    }
}

function getActivityIcon(type) {
    const icons = {
        'article_read': '📖',
        'comment_posted': '💬',
        'article_liked': '👍',
        'profile_updated': '👤'
    };
    return icons[type] || '📝';
}

function setupProfileEditing() {
    const editForm = document.getElementById('profile-edit-form');
    const statusDiv = document.getElementById('edit-status');

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            displayName: document.getElementById('edit-display-name').value,
            bio: document.getElementById('edit-bio').value,
            website: document.getElementById('edit-website').value,
            location: document.getElementById('edit-location').value
        };

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                statusDiv.textContent = 'Profile updated successfully!';
                statusDiv.className = 'form-status success';
                loadProfileData(); // Reload profile data
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            statusDiv.textContent = 'Failed to update profile';
            statusDiv.className = 'form-status error';
        }

        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'form-status';
        }, 3000);
    });
}

function setupPasswordChange() {
    const passwordForm = document.getElementById('password-change-form');
    const statusDiv = document.getElementById('password-status');

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;

        if (newPassword !== confirmPassword) {
            statusDiv.textContent = 'New passwords do not match';
            statusDiv.className = 'form-status error';
            return;
        }

        if (newPassword.length < 6) {
            statusDiv.textContent = 'Password must be at least 6 characters';
            statusDiv.className = 'form-status error';
            return;
        }

        try {
            const response = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response.ok) {
                statusDiv.textContent = 'Password changed successfully!';
                statusDiv.className = 'form-status success';
                passwordForm.reset();
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Password change failed');
            }
        } catch (error) {
            statusDiv.textContent = error.message || 'Failed to change password';
            statusDiv.className = 'form-status error';
        }

        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'form-status';
        }, 3000);
    });
}

function setupAvatarEditing() {
    const avatarEditBtn = document.getElementById('avatar-edit-btn');

    avatarEditBtn.addEventListener('click', () => {
        const newAvatarUrl = prompt('Enter new avatar image URL:', '');
        if (newAvatarUrl && newAvatarUrl.trim()) {
            updateAvatar(newAvatarUrl.trim());
        }
    });
}

async function updateAvatar(avatarUrl) {
    try {
        const response = await fetch('/api/profile/avatar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: avatarUrl })
        });

        if (response.ok) {
            document.getElementById('profile-avatar').src = avatarUrl;
            alert('Avatar updated successfully!');
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        alert('Failed to update avatar');
    }
}

function setupActivityFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter activities
            filterActivities(filter);
        });
    });
}

function filterActivities(filter) {
    const activityItems = document.querySelectorAll('.activity-item');

    activityItems.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'flex';
        } else {
            // In a real app, you'd check the activity type
            // For now, just show/hide randomly for demo
            item.style.display = Math.random() > 0.5 ? 'flex' : 'none';
        }
    });
}

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    // Load saved theme
    const savedTheme = localStorage.getItem('siveal-theme');
    const isLightTheme = savedTheme === 'light';
    if (isLightTheme) {
        document.body.classList.add('light-theme');
    }
    updateThemeIcon(isLightTheme);
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLightTheme = document.body.classList.contains('light-theme');
    localStorage.setItem('siveal-theme', isLightTheme ? 'light' : 'dark');
    updateThemeIcon(isLightTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const iconSVG = themeToggle.querySelector('svg');

    // Theme icons
    const themeIcons = {
        'dark': `<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>`,
        'light': `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>`,
        'high-contrast': `<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m9.9 9.9l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m9.9-9.9l1.42-1.42"/>`,
        'dark': `<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>`,
        'light': `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>`,
        'purple': `<circle cx="12" cy="12" r="5" fill="#8b5cf6"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m9.9 9.9l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m9.9-9.9l1.42-1.42"/>`,
        'green': `<circle cx="12" cy="12" r="5" fill="#10b981"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m9.9 9.9l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m9.9-9.9l1.42-1.42"/>`
    };

    iconSVG.innerHTML = themeIcons[theme] || themeIcons['dark'];
}

function goToAdminPanel() {
    window.location.href = '/admin';
}

// Mobile menu
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-active');
        mobileToggle.classList.toggle('active');
    });
}
