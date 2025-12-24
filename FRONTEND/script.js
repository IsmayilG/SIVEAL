let allNews = [];
let currentCategory = 'all';
let currentPage = 1;
let itemsPerPage = 12;
let filteredNews = [];
let currentSlide = 0;
let carouselInterval = null;
let carouselSlides = [];
let currentLanguage = localStorage.getItem('siveal-language') || 'en';

// API Base URL
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://siveal-backend.onrender.com';

// Debug: Log API URL for troubleshooting
console.log('API Base URL:', API_BASE_URL);
console.log('Current hostname:', window.location.hostname);

const translations = {
    en: {
        'nav-all': 'All',
        'nav-ai': 'AI & Robotics',
        'nav-enterprise': 'Enterprise',
        'nav-crypto': 'Crypto',
        'nav-science': 'Science',
        'search-placeholder': 'Search articles...',
        'latest-wire': 'Latest Wire',
        'trending': 'Trending',
        'back-to-news': 'Back to News',
        'comments': 'Comments',
        'leave-comment': 'Leave a Comment',
        'related-articles': 'Related Articles',
        'subscribe-text': 'Subscribe to SIVEAL',
        'subscribe-desc': 'Get the latest tech news delivered to your inbox daily.',
        'subscribe-btn': 'Subscribe',
        'subscribe-modal-title': 'Subscribe to SIVEAL',
        'subscribe-modal-desc': 'Get the latest tech news delivered to your inbox daily.',
        'about': 'About',
        'advertise': 'Advertise',
        'privacy': 'Privacy',
        'terms': 'Terms',
        'contact': 'Contact',
        'rss-feed': 'RSS Feed'
    },
    tr: {
        'nav-all': 'Hepsi',
        'nav-ai': 'AI & Robotik',
        'nav-enterprise': 'Kurumsal',
        'nav-crypto': 'Kripto',
        'nav-science': 'Bilim',
        'search-placeholder': 'Makale ara...',
        'latest-wire': 'Son Haberler',
        'trending': 'Trend',
        'back-to-news': 'Haberlere Dön',
        'comments': 'Yorumlar',
        'leave-comment': 'Yorum Bırak',
        'related-articles': 'İlgili Makaleler',
        'about': 'Hakkında',
        'advertise': 'Reklam',
        'privacy': 'Gizlilik',
        'terms': 'Şartlar',
        'contact': 'İletişim',
        'rss-feed': 'RSS Beslemesi'
    },
    az: {
        'nav-all': 'Hamısı',
        'nav-ai': 'AI & Robotika',
        'nav-enterprise': 'Korporativ',
        'nav-crypto': 'Kripto',
        'nav-science': 'Elm',
        'search-placeholder': 'Məqalə axtar...',
        'latest-wire': 'Son Xəbərlər',
        'trending': 'Trend',
        'back-to-news': 'Xəbərlərə Qayıt',
        'comments': 'Şərhlər',
        'leave-comment': 'Şərh Yaz',
        'related-articles': 'Əlaqəli Məqalələr',
        'about': 'Haqqında',
        'advertise': 'Reklam',
        'privacy': 'Gizlilik',
        'terms': 'Şərtlər',
        'contact': 'Əlaqə',
        'rss-feed': 'RSS Lent'
    },
    ru: {
        'nav-all': 'Все',
        'nav-ai': 'ИИ & Робототехника',
        'nav-enterprise': 'Корпоратив',
        'nav-crypto': 'Крипто',
        'nav-science': 'Наука',
        'search-placeholder': 'Поиск статей...',
        'latest-wire': 'Последние Новости',
        'trending': 'В тренде',
        'back-to-news': 'Вернуться к новостям',
        'comments': 'Комментарии',
        'leave-comment': 'Оставить комментарий',
        'related-articles': 'Связанные статьи',
        'about': 'О нас',
        'advertise': 'Реклама',
        'privacy': 'Конфиденциальность',
        'terms': 'Условия',
        'contact': 'Контакты',
        'rss-feed': 'RSS лента'
    }
};

document.addEventListener('DOMContentLoaded', () => {

    const header = document.getElementById('main-header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(2, 6, 23, 0.98)';
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        } else {
            header.style.background = 'rgba(2, 6, 23, 0.85)';
            header.style.boxShadow = 'none';
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-category') || e.target.textContent.toLowerCase();
            filterByCategory(category);
            updateActiveNavLink(e.target);
        });
    });

    document.querySelectorAll('.category-filter').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-category');
            filterByCategory(category.toLowerCase());
            updateActiveNavLink(null);
        });
    });

    const searchToggle = document.getElementById('search-toggle');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchToggle.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            hideSearchResults();
            filterByCategory(currentCategory);
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            showSearchResults(query);
        } else {
            hideSearchResults();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !searchToggle.contains(e.target)) {
            hideSearchResults();
        }
    });

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        const savedTheme = localStorage.getItem('siveal-theme') || 'dark';
        loadSavedTheme(savedTheme);
    }

    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
            mobileToggle.classList.toggle('active');
        });
    }

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            switchLanguage(lang);
        });
    });

    applyLanguage(currentLanguage);
    fetchNews();

    // Fallback login button is already visible in HTML with inline styles
    console.log('Fallback login button should be visible');

    // Initialize authentication with fallback
    initializeAuth();

    // Hide fallback button when proper auth UI is loaded
    function hideFallbackIfNeeded() {
        const fallbackBtn = document.getElementById('fallback-login-btn');
        if (fallbackBtn && (document.getElementById('loginBtn') || document.getElementById('userBtn'))) {
            fallbackBtn.style.display = 'none';
            console.log('Hiding fallback login button - proper auth UI loaded');
        }
    }

    // Check every second for 10 seconds
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        checkCount++;
        hideFallbackIfNeeded();
        if (checkCount >= 10) {
            clearInterval(checkInterval);
        }
    }, 1000);
});

// Authentication utilities
function getAuthToken() {
    return localStorage.getItem('siveal_token');
}

function getCurrentUser() {
    const userData = localStorage.getItem('siveal_user');
    return userData ? JSON.parse(userData) : null;
}

function clearAuthData() {
    localStorage.removeItem('siveal_token');
    localStorage.removeItem('siveal_user');
}

function makeAuthenticatedRequest(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    // Ensure URL uses full API_BASE_URL
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    return fetch(fullUrl, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
}

// Initialize authentication on page load
function initializeAuth() {
    try {
        const token = getAuthToken();
        const user = getCurrentUser();

        console.log('Auth check - Token:', token ? 'EXISTS' : 'NOT FOUND');
        console.log('Auth check - User:', user);

        if (user && token) {
            console.log('Auth check - User logged in, updating UI');
            updateAuthUI(user);
        } else {
            console.log('Auth check - User not logged in, showing login button');
            showLoginButton();
        }
    } catch (error) {
        console.error('Auth initialization error:', error);
        showLoginButton();
    }
}

function updateAuthUI(user) {
    console.log('Updating auth UI for user:', user);

    // Create the new user button
    const userBtn = document.createElement('a');
    userBtn.id = 'userBtn';
    userBtn.href = 'profile.html';
    userBtn.className = 'login-btn'; // Use same class as login button for consistent styling
    userBtn.textContent = user.username;
    userBtn.style.cssText = 'display: inline-block !important; background: linear-gradient(45deg, #60a5fa, #8b5cf6) !important; color: white !important; padding: 8px 20px !important; border-radius: 100px !important; text-decoration: none !important; font-weight: 600 !important; border: none !important; cursor: pointer !important;';

    console.log('Created user button:', userBtn);

    // Nükleer yöntem: header-actions div'inin içini tamamen temizle ve yeni butonu ekle
    const headerActions = document.querySelector('.header-actions');
    console.log('Header actions element:', headerActions);

    if (headerActions) {
        console.log('Clearing header actions and adding user button');
        headerActions.innerHTML = ''; // Tüm içeriği temizle
        headerActions.appendChild(userBtn); // Sadece yeni user butonunu ekle
        console.log('User button added successfully');
    } else {
        console.error('Header actions element not found!');
    }
}

function showLoginButton() {
    // Remove existing user button if it exists
    const existingUserBtn = document.getElementById('userBtn');
    if (existingUserBtn) {
        existingUserBtn.remove();
    }

    // Remove user menu if it exists
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Add login button to header actions
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const loginBtn = document.createElement('a');
        loginBtn.id = 'loginBtn';
        loginBtn.href = 'login.html';
        loginBtn.className = 'login-btn';
        loginBtn.textContent = 'Login';
        headerActions.appendChild(loginBtn);
    }
}

function createUserMenu() {
    // Remove existing menu
    const existingMenu = document.getElementById('userMenu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-item" onclick="goToProfile()">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Profile
        </div>
        <div class="user-menu-item" onclick="goToAdmin()">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Admin Panel
        </div>
        <div class="user-menu-item logout" onclick="logout()">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Logout
        </div>
    `;

    document.body.appendChild(menu);

    // Hide admin panel option if user is not admin
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        const adminItem = menu.querySelector('.user-menu-item:nth-child(2)');
        if (adminItem) {
            adminItem.style.display = 'none';
        }
    }

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const userBtn = document.getElementById('userBtn');
        const menu = document.getElementById('userMenu');
        if (menu && userBtn && !userBtn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
}

function showUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Clear all auth data including old keys
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearAuthData();
    showLoginButton();

    // Optional: Show logout message
    showNotification('Logged out successfully', 'success');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide and remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}



async function fetchNews() {
    showLoadingState();

    try {
        const response = await fetch(`${API_BASE_URL}/api/news`);
        if (!response.ok) {
            throw new Error('Failed to fetch news');
        }

        allNews = await response.json();
        filterByCategory(currentCategory);
        updateHero(allNews[0]); // Update hero with latest article
        updateTrendingSection(); // Update trending section with real data

        // Re-apply language settings after news data is loaded
        applyLanguage(currentLanguage);
    } catch (error) {
        console.error('Error fetching news:', error);
        showErrorState();
    } finally {
        hideLoadingState();
    }
}

function showLoadingState() {
    const container = document.getElementById('news-container');
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading latest news...</p>
        </div>
    `;
}

function hideLoadingState() {
    // Loading state will be replaced by actual content
}

function showErrorState() {
    const container = document.getElementById('news-container');
    container.innerHTML = `
        <div class="error-state">
            <h3>Unable to load news</h3>
            <p>Please check your connection and try again.</p>
            <button onclick="fetchNews()" class="btn-retry">Retry</button>
        </div>
    `;
}

function updateTrendingSection() {
    const trendingList = document.querySelector('.trend-list');
    if (!trendingList) return;

    // Get top 5 articles by recency (could be improved with view counts in real app)
    const trendingArticles = allNews.slice(0, 5);

    trendingList.innerHTML = trendingArticles.map((article, index) => {
        const title = getNewsTitle(article);
        return `
            <li>
                <span class="number">0${index + 1}</span>
                <a href="article.html?id=${article.id}">${title}</a>
            </li>
        `;
    }).join('');
}

function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1; // Reset to first page when filtering
    filteredNews = category === 'all' ? allNews : allNews.filter(news => news.category === category);
    renderNewsWithPagination();
}

function updateActiveNavLink(activeLink) {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    if (activeLink) activeLink.classList.add('active');
}

function performSearch(query) {
    if (!query.trim()) {
        filterByCategory(currentCategory);
        return;
    }

    currentPage = 1; // Reset to first page when searching
    filteredNews = allNews.filter(news =>
        news.title.toLowerCase().includes(query.toLowerCase()) ||
        news.summary.toLowerCase().includes(query.toLowerCase()) ||
        news.category.toLowerCase().includes(query.toLowerCase())
    );

    renderNewsWithPagination();
}

function updateHero(latestArticle) {
    if (!latestArticle) return;

    // Initialize carousel with latest 5 articles
    const carouselArticles = allNews.slice(0, 5);
    initializeCarousel(carouselArticles);
}

function getCarouselTagText(category) {
    const lang = currentLanguage || 'en';
    const tagTranslations = {
        'Security': { en: 'Security', tr: 'Güvenlik', az: 'Təhlükəsizlik', ru: 'Безопасность' },
        'Venture': { en: 'Venture', tr: 'Girişim', az: 'Sərmayə', ru: 'Венчур' },
        'Mobile': { en: 'Mobile', tr: 'Mobil', az: 'Mobil', ru: 'Мобильный' }
    };

    // Default categories for carousel
    const defaultCategories = ['Security', 'Venture', 'Mobile'];
    const categoryIndex = Math.floor(Math.random() * defaultCategories.length);
    const randomCategory = defaultCategories[categoryIndex];

    return tagTranslations[randomCategory][lang] || randomCategory;
}

function initializeCarousel(articles) {
    const carouselContainer = document.getElementById('carousel-container');
    const indicatorsContainer = document.getElementById('carousel-indicators');

    if (!carouselContainer || !indicatorsContainer) return;

    carouselContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';

    articles.forEach((article, index) => {
        // Get translated title and summary for carousel
        const title = getNewsTitle(article);
        const summary = getNewsSummary(article);

        // Create slide
        const slide = document.createElement('div');
        slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <div class="hero-overlay"></div>
            <img src="${article.image}" alt="${title}" class="hero-img" loading="lazy">
            <div class="hero-content">
                <span class="tag category-tag" data-category="${article.category}">${article.category}</span>
                <h1>${title}</h1>
                <p>${summary}</p>
            </div>
        `;

        // Add click event to navigate to article
        slide.addEventListener('click', () => {
            window.location.href = `article.html?id=${article.id}`;
        });

        carouselContainer.appendChild(slide);

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = `carousel-indicator ${index === 0 ? 'active' : ''}`;
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });

    carouselSlides = articles;

    // Add carousel controls
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));

    // Start auto-play
    startCarouselAutoPlay();

    // Add click functionality to category tags
    addCategoryTagListeners();
}

function addCategoryTagListeners() {
    const categoryTags = document.querySelectorAll('.category-tag');
    categoryTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent carousel slide click
            const category = tag.getAttribute('data-category');
            filterByCategory(category.toLowerCase());
            updateActiveNavLink(null); // Clear nav link selection
        });
    });
}

function changeSlide(direction) {
    const totalSlides = carouselSlides.length;
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    goToSlide(currentSlide);
}

function goToSlide(slideIndex) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');

    // Update slides
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === slideIndex);
    });

    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === slideIndex);
    });

    currentSlide = slideIndex;

    // Reset auto-play timer
    resetCarouselAutoPlay();
}

function startCarouselAutoPlay() {
    carouselInterval = setInterval(() => {
        changeSlide(1);
    }, 8000); // Change slide every 8 seconds
}

function resetCarouselAutoPlay() {
    clearInterval(carouselInterval);
    startCarouselAutoPlay();
}

// Pause auto-play on hover
document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.hero-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            clearInterval(carouselInterval);
        });

        carousel.addEventListener('mouseleave', () => {
            startCarouselAutoPlay();
        });
    }
});

function renderNewsWithPagination() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedNews = filteredNews.slice(startIndex, endIndex);

    renderNews(paginatedNews);
    renderPagination();
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredNews.length / itemsPerPage);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="pagination-controls">';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})">Previous</button>`;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="page-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
        paginationHTML += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Next</button>`;
    }

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(pageNumber) {
    currentPage = pageNumber;
    renderNewsWithPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleTheme() {
    const themes = ['dark', 'light', 'high-contrast'];
    const currentTheme = localStorage.getItem('siveal-theme') || 'dark';

    // Remove all theme classes
    themes.forEach(theme => {
        if (theme !== 'dark') { // dark is default, no class needed
            document.body.classList.remove(`${theme}-theme`);
        }
    });

    // Find next theme
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    // Apply next theme
    if (nextTheme !== 'dark') {
        document.body.classList.add(`${nextTheme}-theme`);
    }

    localStorage.setItem('siveal-theme', nextTheme);
    updateThemeIcon(nextTheme);
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
        'blue': `<circle cx="12" cy="12" r="5" fill="#1da1f2"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m9.9 9.9l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m9.9-9.9l1.42-1.42"/>`,
        'purple': `<circle cx="12" cy="12" r="5" fill="#8b5cf6"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m9.9 9.9l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m9.9-9.9l1.42-1.42"/>`,
        'green': `<circle cx="12" cy="12" r="5" fill="#10b981"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m9.9 9.9l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m9.9-9.9l1.42-1.42"/>`
    };

    iconSVG.innerHTML = themeIcons[theme] || themeIcons['dark'];
}

function showSearchResults(query) {
    const searchResults = document.getElementById('search-results');
    const results = allNews.filter(news =>
        news.title.toLowerCase().includes(query.toLowerCase()) ||
        news.summary.toLowerCase().includes(query.toLowerCase()) ||
        news.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Show only top 5 results

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No articles found</div>';
    } else {
        searchResults.innerHTML = results.map(news => `
            <div class="search-result-item" onclick="navigateToArticle(${news.id})">
                <div class="search-result-image">
                    <img src="${news.image}" alt="${news.title}" loading="lazy">
                </div>
                <div class="search-result-content">
                    <div class="search-result-title">${highlightText(news.title, query)}</div>
                    <div class="search-result-meta">${news.category} • ${news.time}</div>
                </div>
            </div>
        `).join('');
    }

    searchResults.classList.add('show');
}

function hideSearchResults() {
    const searchResults = document.getElementById('search-results');
    searchResults.classList.remove('show');
}

function navigateToArticle(articleId) {
    hideSearchResults();
    document.getElementById('search-input').classList.remove('active');
    document.getElementById('search-input').value = '';
    window.location.href = `article.html?id=${articleId}`;
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}



function renderNews(newsArray) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';

    if (newsArray.length === 0) {
        const noResultsText = getTranslatedText('no-results');
        container.innerHTML = `<div class="no-results">${noResultsText}</div>`;
        return;
    }

    newsArray.forEach(news => {
        const article = document.createElement('article');
        article.className = 'news-card';
        article.style.cursor = 'pointer';

        // Get translated title and summary
        const title = getNewsTitle(news);
        const summary = getNewsSummary(news);

        article.innerHTML = `
            <div class="card-image">
                <img src="${news.image}" alt="${title}" loading="lazy">
            </div>
            <div class="card-body">
                <span class="meta">${news.category} • ${news.time}</span>
                <h3>${title}</h3>
                <p>${summary}</p>
            </div>
        `;

        // Add click event to navigate to article page
        article.addEventListener('click', () => {
            window.location.href = `article.html?id=${news.id}`;
        });

        container.appendChild(article);
    });
}

function getNewsTitle(news) {
    const langSuffix = currentLanguage === 'en' ? '' : `_${currentLanguage}`;
    return news[`title${langSuffix}`] || news.title;
}

function getNewsSummary(news) {
    const langSuffix = currentLanguage === 'en' ? '' : `_${currentLanguage}`;
    return news[`summary${langSuffix}`] || news.summary;
}

function getTranslatedText(key) {
    const langData = translations[currentLanguage];
    if (!langData) return key;

    // Special translations
    if (key === 'no-results') {
        return langData['no-results'] ||
               (currentLanguage === 'tr' ? 'Aradığınız kriterlere uygun makale bulunamadı.' :
                currentLanguage === 'az' ? 'Axtardığınız kriteriyalara uyğun məqalə tapılmadı.' :
                currentLanguage === 'ru' ? 'Не найдено статей, соответствующих вашим критериям.' :
                'No articles found matching your criteria.');
    }

    return langData[key] || key;
}

function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('siveal-language', lang);

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Apply translations
    applyLanguage(lang);

    // Refresh content that depends on language
    if (allNews.length > 0) {
        renderNewsWithPagination();
        updateTrendingSection();
        // Reinitialize carousel with all articles to update language
        const carouselArticles = allNews.slice(0, 5);
        initializeCarousel(carouselArticles);
    }
}

function initializeDynamicGrid(articles) {
    const gridContainer = document.getElementById('masonry-container');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    // Get user preferences from localStorage
    const userPreferences = getUserPreferences();
    const userLanguage = currentLanguage;

    // Sort articles based on user preferences and language
    const sortedArticles = sortArticlesByRelevance(articles, userPreferences, userLanguage);

    // Create dynamic grid layout
    sortedArticles.forEach((article, index) => {
        const articleElement = document.createElement('article');

        // Determine card size based on relevance score
        const isLarge = index < 3; // First 3 articles are large
        const isMedium = index >= 3 && index < 8; // Next 5 are medium
        const isSmall = index >= 8; // Rest are small

        articleElement.className = `news-card dynamic-card ${isLarge ? 'large' : isMedium ? 'medium' : 'small'}`;

        // Get translated title and summary
        const title = getNewsTitle(article);
        const summary = getNewsSummary(article);

        // Add relevance indicator
        const relevanceScore = calculateRelevanceScore(article, userPreferences);
        const relevanceClass = relevanceScore > 0.7 ? 'high-relevance' : relevanceScore > 0.4 ? 'medium-relevance' : 'low-relevance';

        articleElement.innerHTML = `
            <div class="card-image">
                <img src="${article.image}" alt="${title}" loading="lazy">
                <div class="relevance-indicator ${relevanceClass}"></div>
            </div>
            <div class="card-body">
                <span class="meta">${article.category} • ${article.time}</span>
                <h3>${title}</h3>
                <p>${summary}</p>
                <div class="card-actions">
                    <button class="like-btn" onclick="likeArticle(${article.id})">👍 ${article.likes || 0}</button>
                    <button class="share-btn" onclick="shareArticle(${article.id})">📤</button>
                </div>
            </div>
        `;

        // Add click event to navigate to article page
        articleElement.addEventListener('click', (e) => {
            if (!e.target.closest('.like-btn, .share-btn')) {
                trackArticleClick(article.id);
                window.location.href = `article.html?id=${article.id}`;
            }
        });

        gridContainer.appendChild(articleElement);
    });
}

function getUserPreferences() {
    const preferences = {
        likedCategories: JSON.parse(localStorage.getItem('siveal-liked-categories') || '[]'),
        viewedCategories: JSON.parse(localStorage.getItem('siveal-viewed-categories') || '[]'),
        language: currentLanguage,
        theme: localStorage.getItem('siveal-theme') || 'dark'
    };
    return preferences;
}

function sortArticlesByRelevance(articles, preferences, language) {
    return articles.map(article => {
        const relevanceScore = calculateRelevanceScore(article, preferences);
        return { ...article, relevanceScore };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function calculateRelevanceScore(article, preferences) {
    let score = 0.5; // Base score

    // Category preference boost
    if (preferences.likedCategories.includes(article.category)) {
        score += 0.3;
    }

    if (preferences.viewedCategories.includes(article.category)) {
        score += 0.2;
    }

    // Language match boost
    if (article[`title_${preferences.language}`] || article[`summary_${preferences.language}`]) {
        score += 0.1;
    }

    // Recency boost (newer articles get higher score)
    const daysSincePublished = Math.floor((Date.now() - new Date(article.time)) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 0.1 - (daysSincePublished * 0.01));

    return Math.min(1, score);
}

function trackArticleClick(articleId) {
    // Find the article
    const article = allNews.find(a => a.id === articleId);
    if (!article) return;

    // Update viewed categories
    const viewedCategories = JSON.parse(localStorage.getItem('siveal-viewed-categories') || '[]');
    if (!viewedCategories.includes(article.category)) {
        viewedCategories.push(article.category);
        localStorage.setItem('siveal-viewed-categories', JSON.stringify(viewedCategories));
    }

    // Increment view count
    fetch(`/api/news/${articleId}/view`, { method: 'POST' })
        .catch(error => console.error('Error tracking view:', error));
}

function likeArticle(articleId) {
    const article = allNews.find(a => a.id === articleId);
    if (!article) return;

    // Update liked categories
    const likedCategories = JSON.parse(localStorage.getItem('siveal-liked-categories') || '[]');
    if (!likedCategories.includes(article.category)) {
        likedCategories.push(article.category);
        localStorage.setItem('siveal-liked-categories', JSON.stringify(likedCategories));
    }

    // Update UI
    const likeBtn = event.target;
    const currentLikes = parseInt(likeBtn.textContent.match(/\d+/)[0] || 0);
    likeBtn.innerHTML = `👍 ${currentLikes + 1}`;
    likeBtn.style.color = '#60a5fa';

    // Refresh grid to show updated relevance
    setTimeout(() => initializeDynamicGrid(allNews), 500);
}

function shareArticle(articleId) {
    const article = allNews.find(a => a.id === articleId);
    if (!article) return;

    const title = getNewsTitle(article);
    const url = `${window.location.origin}/article.html?id=${articleId}`;

    if (navigator.share) {
        navigator.share({
            title: title,
            text: article.summary,
            url: url
        });
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${title} - ${url}`).then(() => {
            alert('Link copied to clipboard!');
        });
    }
}

function loadSavedTheme(theme) {
    // Remove all theme classes first
    document.body.classList.remove('light-theme', 'high-contrast-theme');

    // Apply the saved theme
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'high-contrast') {
        document.body.classList.add('high-contrast-theme');
    }
    // dark theme is default, no class needed

    // Update the theme icon
    updateThemeIcon(theme);
}

function applyLanguage(lang) {
    const langData = translations[lang];
    if (!langData) return;

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update elements with data-translate attributes
    Object.keys(langData).forEach(key => {
        const elements = document.querySelectorAll(`[data-translate="${key}"]`);
        elements.forEach(element => {
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = langData[key];
            } else {
                element.textContent = langData[key];
            }
        });
    });

    // Update search placeholder
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.placeholder = langData['search-placeholder'];
    }

    // Update loading states
    const loadingTexts = document.querySelectorAll('.loading-state p');
    loadingTexts.forEach(p => {
        p.textContent = lang === 'tr' ? 'En güncel haberler yükleniyor...' : 'Loading latest news...';
    });

    // Update error states
    const errorTitles = document.querySelectorAll('.error-state h3');
    const errorTexts = document.querySelectorAll('.error-state p');
    errorTitles.forEach(h3 => {
        h3.textContent = lang === 'tr' ? 'Haberler yüklenemedi' :
                        lang === 'az' ? 'Xəbərlər yüklənə bilmədi' :
                        lang === 'ru' ? 'Не удалось загрузить новости' :
                        'Unable to load news';
    });
    errorTexts.forEach(p => {
        p.textContent = lang === 'tr' ? 'Bağlantınızı kontrol edip tekrar deneyin.' :
                       lang === 'az' ? 'Əlaqənizi yoxlayın və yenidən cəhd edin.' :
                       lang === 'ru' ? 'Пожалуйста, проверьте подключение и попробуйте еще раз.' :
                       'Please check your connection and try again.';
    });

    // Update no results text
    const noResultsTexts = document.querySelectorAll('.no-results');
    noResultsTexts.forEach(div => {
        div.textContent = lang === 'tr' ? 'Aradığınız kriterlere uygun makale bulunamadı.' :
                         lang === 'az' ? 'Axtardığınız kriteriyalara uyğun məqalə tapılmadı.' :
                         lang === 'ru' ? 'Не найдено статей, соответствующих вашим критериям.' :
                         'No articles found matching your criteria.';
    });
}
