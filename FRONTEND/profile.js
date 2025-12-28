// ==========================================
// DEFENSIVE CODING - PROFILE.JS
// Tüm DOM erişimleri güvenli, hiçbir çökme olmayacak
// ==========================================

// CLOUDINARY CONSTANTS - Replace with your own values
const CLOUDINARY_CLOUD_NAME = 'dpmqiqsm7';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// Global değişkenler - güvenli başlatma
let currentUser = null;
let currentTab = 'overview';

// API URL - window objesinden al, çakışma önle
const API_URL = window.API_BASE_URL || 'http://localhost:3000';

// ==========================================
// GÜVENLİ YARDIMCI FONKSİYONLAR
// ==========================================

// Güvenli element seçimi - null dönerse hiçbir şey yapma
function safeGetElement(id) {
    try {
        return document.getElementById(id);
    } catch (e) {
        console.warn(`UYARI: Element '${id}' seçilirken hata:`, e);
        return null;
    }
}

// Güvenli element güncelleme - element yoksa sessizce geç
function safeUpdateElement(id, property, value) {
    const el = safeGetElement(id);
    if (el && el[property] !== undefined) {
        try {
            el[property] = value;
        } catch (e) {
            console.warn(`UYARI: Element '${id}' güncellenirken hata:`, e);
        }
    } else if (!el) {
        console.warn(`UYARI: Element '${id}' bulunamadı, güncelleme atlandı`);
    }
}

// Güvenli event listener ekleme
function safeAddEventListener(id, event, handler) {
    const el = safeGetElement(id);
    if (el) {
        try {
            el.addEventListener(event, handler);
        } catch (e) {
            console.warn(`UYARI: Element '${id}' için event listener eklenirken hata:`, e);
        }
    } else {
        console.warn(`UYARI: Element '${id}' bulunamadı, event listener eklenemedi`);
    }
}

// ==========================================
// AUTH YARDIMCI FONKSİYONLAR
// ==========================================

function getAuthToken() {
    try {
        return localStorage.getItem('siveal_token');
    } catch (e) {
        console.warn('UYARI: localStorage token okunurken hata:', e);
        return null;
    }
}

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('siveal_user');
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        console.warn('UYARI: localStorage user okunurken hata:', e);
        return null;
    }
}

function clearAuthData() {
    try {
        localStorage.removeItem('siveal_token');
        localStorage.removeItem('siveal_user');
        currentUser = null;
    } catch (e) {
        console.warn('UYARI: localStorage temizlenirken hata:', e);
    }
}

// Güvenli API isteği
function makeAuthenticatedRequest(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        console.warn('UYARI: Auth token bulunamadı');
        throw new Error('No authentication token found');
    }

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

// ==========================================
// AUTH ANA FONKSİYONLAR
// ==========================================

async function checkAuth() {
    try {
        const token = getAuthToken();
        if (!token) {
            console.warn('UYARI: Auth token yok, login sayfasına yönlendiriliyor');
            redirectToLogin();
            return false;
        }

        const response = await makeAuthenticatedRequest('/api/auth/status');
        const data = await response.json();

        if (response.ok && data.isLoggedIn) {
            currentUser = data.user;
            updateHeaderLoginButton();
            console.log('AUTH BAŞARILI: Kullanıcı giriş yapmış');
            return true;
        } else {
            console.warn('UYARI: Auth status başarısız:', { status: response.status, data });
            redirectToLogin();
            return false;
        }
    } catch (error) {
        console.error('AUTH HATASI:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            url: `${API_URL}/api/auth/status`,
            token: getAuthToken() ? 'EXISTS' : 'NOT FOUND'
        });
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    try {
        window.location.href = 'login.html';
    } catch (e) {
        console.warn('UYARI: Login sayfasına yönlendirme başarısız:', e);
    }
}

function updateHeaderLoginButton() {
    const loginBtn = safeGetElement('loginBtn');
    if (loginBtn && currentUser) {
        try {
            loginBtn.textContent = currentUser.username;
            loginBtn.href = '#';
            loginBtn.onclick = (e) => {
                e.preventDefault();
                showProfileMenu();
            };
        } catch (e) {
            console.warn('UYARI: Header login button güncellenirken hata:', e);
        }
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
        console.log('LOGOUT BAŞARILI');
    } catch (error) {
        console.warn('UYARI: Logout isteği başarısız:', error);
    }

    clearAuthData();
    redirectToLogin();
}

// ==========================================
// DOM YÖNETİMİ - TAM GÜVENLİ
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('PROFILE SAYFASI YÜKLENDİ');
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    setupTabNavigation();
    setupProfileEditing();
    setupPasswordChange();
    loadProfileData();
});

function setupTabNavigation() {
    try {
        const tabButtons = document.querySelectorAll('.profile-nav-btn');
        if (tabButtons.length === 0) {
            console.warn('UYARI: Tab butonları bulunamadı');
            return;
        }

        tabButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    const tabName = button.getAttribute('data-tab');
                    if (tabName) {
                        switchTab(tabName);
                        // Aktif tabı güncelle
                        tabButtons.forEach(btn => {
                            if (btn) btn.classList.remove('active');
                        });
                        button.classList.add('active');
                    }
                });
            }
        });
    } catch (e) {
        console.warn('UYARI: Tab navigation kurulurken hata:', e);
    }
}

function switchTab(tabName) {
    if (!tabName) return;

    currentTab = tabName;

    try {
        // Tüm tabları gizle
        const tabs = document.querySelectorAll('.profile-tab');
        tabs.forEach(tab => {
            if (tab) tab.classList.remove('active');
        });

        // Seçilen tabı göster
        const selectedTab = safeGetElement(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');

            if (tabName === 'admin' && currentUser?.role === 'admin') {
                loadAdminDashboard();
            }
        } else {
            console.warn(`UYARI: Tab '${tabName}' bulunamadı`);
        }
    } catch (e) {
        console.warn('UYARI: Tab değiştirirken hata:', e);
    }
}

async function loadAdminDashboard() {
    try {
        const response = await makeAuthenticatedRequest('/api/admin/stats');
        const stats = await response.json();

        // Güvenli element güncellemeleri
        safeUpdateElement('total-articles', 'textContent', stats.totalArticles || '0');
        safeUpdateElement('total-users', 'textContent', stats.totalUsers || '0');
        safeUpdateElement('total-views', 'textContent', (stats.totalViews || 0).toLocaleString());

        // Admin navigation göster
        const adminNavBtn = safeGetElement('admin-nav-btn');
        if (adminNavBtn) {
            adminNavBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('ADMIN DASHBOARD HATASI:', error);
        safeShowMessage('Failed to load admin data', 'error');
    }
}

async function loadProfileData() {
    try {
        console.log('PROFİL VERİSİ YÜKLENİYOR...');
        const response = await makeAuthenticatedRequest('/api/profile');
        const profileData = await response.json();

        console.log('PROFİL VERİSİ ALINDI:', profileData);

        // DEFENSIVE CODING - Her element için güvenli güncelleme
        // HTML'de VAR olan elementler: profile-name, profile-email, profile-role, profile-joined
        safeUpdateElement('profile-name', 'textContent', profileData.username || 'N/A');
        safeUpdateElement('profile-email', 'textContent', profileData.email || 'N/A');
        safeUpdateElement('profile-role', 'textContent', profileData.role === 'admin' ? 'Administrator' : 'Member');
        safeUpdateElement('profile-joined', 'textContent', `Joined: ${new Date(profileData.createdAt).toLocaleDateString()}`);

        // HTML'de YOK olan elementler - sessizce atla
        // safeUpdateElement('profile-last-login', 'textContent', 'N/A'); // Bu element yok
        // safeUpdateElement('edit-email', 'value', profileData.email || ''); // Bu element yok

        // Edit form için var olan elementi güncelle
        safeUpdateElement('edit-display-name', 'value', profileData.username || '');

        // Admin tab göster (eğer admin ise)
        if (currentUser?.role === 'admin') {
            const adminTab = document.querySelector('[data-tab="admin"]');
            if (adminTab) {
                adminTab.style.display = 'block';
            }
        }

        // Logout butonu event listener ekle
        const logoutBtn = safeGetElement('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.clear();
                alert('Çıkış yapıldı!');
                window.location.href = 'index.html';
            });
        }

        // Top logout button event listener ekle
        const logoutBtnTop = safeGetElement('logout-btn-top');
        if (logoutBtnTop) {
            logoutBtnTop.addEventListener('click', function() {
                localStorage.clear();
                sessionStorage.clear();
                alert('Çıkış yapıldı!');
                window.location.href = 'login.html';
            });
        }

        // Kesin çözüm: Direkt onclick atama
        const logoutBtnTopDirect = document.getElementById('logout-btn-top');
        if (logoutBtnTopDirect) {
            logoutBtnTopDirect.onclick = function() {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login.html'; // Giriş sayfasına yönlendir
            };
        }

        console.log('PROFİL VERİSİ BAŞARIYLA GÜNCELLENDİ');

    } catch (error) {
        console.error('PROFİL VERİSİ YÜKLEME HATASI:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            url: `${API_URL}/api/profile`,
            token: getAuthToken() ? 'EXISTS' : 'NOT FOUND'
        });
        safeShowMessage('Failed to load profile data - check console for details', 'error');
    }
}

function setupProfileEditing() {
    const editForm = safeGetElement('profile-edit-form');
    if (!editForm) {
        console.warn('UYARI: Profile edit form bulunamadı');
        return;
    }

    // Avatar upload functionality
    const avatarEditBtn = safeGetElement('avatar-edit-btn');
    const avatarInput = document.createElement('input');
    avatarInput.type = 'file';
    avatarInput.accept = 'image/*';
    avatarInput.style.display = 'none';
    
    if (avatarEditBtn) {
        avatarEditBtn.addEventListener('click', () => {
            avatarInput.click();
        });
    }
    
    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const imageUrl = await uploadImageToCloudinary(file);
            if (imageUrl) {
                await updateProfileAvatar(imageUrl);
                loadProfileData(); // Reload profile data to update avatar
            }
        } catch (error) {
            console.error('AVATAR UPLOAD HATASI:', error);
            safeShowMessage('Failed to upload avatar. Please try again.', 'error');
        }
    });

    safeAddEventListener('profile-edit-form', 'submit', async (e) => {
        e.preventDefault();

        // Form değerlerini güvenli oku
        const displayName = safeGetElement('edit-display-name')?.value || '';
        const bio = safeGetElement('edit-bio')?.value || '';
        const website = safeGetElement('edit-website')?.value || '';
        const location = safeGetElement('edit-location')?.value || '';

        try {
            setFormLoading('profile-edit-form', true);

            const response = await makeAuthenticatedRequest('/api/profile', {
                method: 'PUT',
                body: JSON.stringify({ displayName, bio, website, location })
            });

            const data = await response.json();

            if (response.ok) {
                safeShowMessage('Profile updated successfully!', 'success');
                loadProfileData(); // Reload profile data
            } else {
                safeShowMessage(data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('PROFILE UPDATE HATASI:', error);
            safeShowMessage('Network error. Please try again.', 'error');
        } finally {
            setFormLoading('profile-edit-form', false);
        }
    });
}

// Cloudinary upload function
async function uploadImageToCloudinary(file) {
    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME') {
        throw new Error('Cloudinary Cloud Name not configured');
    }
    
    if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'YOUR_UPLOAD_PRESET') {
        throw new Error('Cloudinary Upload Preset not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result.secure_url;
}

// Update profile avatar
async function updateProfileAvatar(imageUrl) {
    try {
        const response = await makeAuthenticatedRequest('/api/profile', {
            method: 'PUT',
            body: JSON.stringify({ avatar: imageUrl })
        });

        const data = await response.json();

        if (response.ok) {
            safeShowMessage('Avatar updated successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to update avatar');
        }
    } catch (error) {
        console.error('AVATAR UPDATE HATASI:', error);
        throw error;
    }
}

function setupPasswordChange() {
    const passwordForm = safeGetElement('password-change-form');
    if (!passwordForm) {
        console.warn('UYARI: Password change form bulunamadı');
        return;
    }

    safeAddEventListener('password-change-form', 'submit', async (e) => {
        e.preventDefault();

        // Form değerlerini güvenli oku
        const currentPassword = safeGetElement('current-password')?.value || '';
        const newPassword = safeGetElement('new-password')?.value || '';
        const confirmPassword = safeGetElement('confirm-new-password')?.value || '';

        if (newPassword !== confirmPassword) {
            safeShowMessage('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            safeShowMessage('Password must be at least 6 characters', 'error');
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
                safeShowMessage('Password changed successfully!', 'success');
                // Formu sıfırla
                const form = safeGetElement('password-change-form');
                if (form && form.reset) {
                    form.reset();
                }
            } else {
                safeShowMessage(data.error || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('PASSWORD CHANGE HATASI:', error);
            safeShowMessage('Network error. Please try again.', 'error');
        } finally {
            setFormLoading('password-change-form', false);
        }
    });
}

function setFormLoading(formId, loading) {
    const form = safeGetElement(formId);
    if (!form) {
        console.warn(`UYARI: Form '${formId}' bulunamadı`);
        return;
    }

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input');

        if (submitBtn) {
            submitBtn.disabled = loading;
        }

        inputs.forEach(input => {
            if (input) input.disabled = loading;
        });

        if (submitBtn && loading) {
            submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
        } else if (submitBtn) {
            submitBtn.innerHTML = formId === 'profile-edit-form' ? 'Update Profile' : 'Change Password';
        }
    } catch (e) {
        console.warn(`UYARI: Form '${formId}' loading state güncellenirken hata:`, e);
    }
}

// GÜVENLİ mesaj gösterimi - hiçbir zaman çökmeyecek
function safeShowMessage(text, type) {
    if (!text) return;

    try {
        // Mevcut mesaj elementini bul veya oluştur
        let messageEl = safeGetElement('profile-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'profile-message';
            messageEl.className = 'message';

            // Container'ı bulmaya çalış
            const container = document.querySelector('.container');
            const profileContent = document.querySelector('.profile-content');

            if (container && profileContent) {
                // Güvenli insert
                try {
                    container.insertBefore(messageEl, profileContent);
                } catch (insertError) {
                    console.warn('UYARI: insertBefore başarısız, fallback kullanıyorum:', insertError);
                    document.body.appendChild(messageEl);
                }
            } else {
                // Fallback - doğrudan body'ye ekle
                console.warn('UYARI: Container bulunamadı, mesaj document.body\'ye eklenecek');
                document.body.appendChild(messageEl);
            }
        }

        // Mesajı güncelle
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';

            // 5 saniye sonra gizle
            setTimeout(() => {
                if (messageEl) {
                    messageEl.style.display = 'none';
                }
            }, 5000);
        }
    } catch (e) {
        console.warn('UYARI: Mesaj gösterilirken hata:', e);
        // En son fallback - console'a yaz
        console.log('MESSAGE:', text, `(${type})`);
    }
}

function goToAdminPanel() {
    try {
        window.location.href = 'admin.html';
    } catch (e) {
        console.warn('UYARI: Admin paneline yönlendirme başarısız:', e);
    }
}

// ==========================================
// CSS STilleri - Güvenli ekleme
// ==========================================

try {
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
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            min-width: 300px;
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
} catch (e) {
    console.warn('UYARI: CSS stilleri eklenirken hata:', e);
}

console.log('PROFILE.JS YÜKLENDİ - Tüm fonksiyonlar güvenli');
