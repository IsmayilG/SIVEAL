let currentArticle = null;
let allArticles = [];
let currentLanguage = localStorage.getItem('siveal-language') || 'en';

function openSubscribeModal() {
    const modal = document.getElementById('subscribe-modal');
    modal.classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = parseInt(urlParams.get('id'));

    if (!articleId || isNaN(articleId)) {
        window.location.href = 'index.html';
        return;
    }

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            switchLanguage(lang);
        });
    });

    const savedLanguage = localStorage.getItem('siveal-language') || 'en';
    applyLanguage(savedLanguage);

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

    const subscribeBtn = document.querySelector('.btn-subscribe');
    const modal = document.getElementById('subscribe-modal');
    const modalClose = document.querySelector('.modal-close');
    const subscribeForm = document.getElementById('subscribe-form');
    const subscribeMessage = document.getElementById('subscribe-message');

    subscribeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('show');
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    subscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('subscribe-email').value;

        subscribeMessage.textContent = 'Subscribing...';
        subscribeMessage.className = 'subscribe-message';

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            subscribeMessage.textContent = 'Successfully subscribed! Welcome to SIVEAL.';
            subscribeMessage.className = 'subscribe-message success';
            subscribeForm.reset();

            setTimeout(() => {
                modal.classList.remove('show');
                subscribeMessage.textContent = '';
            }, 2000);
        } catch (error) {
            subscribeMessage.textContent = 'Failed to subscribe. Please try again.';
            subscribeMessage.className = 'subscribe-message error';
        }
    });

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-active');
            mobileToggle.classList.toggle('active');
        });
    }

    loadArticle(articleId);
    loadComments(articleId);

    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitComment(articleId);
        });
    }
});

function loadSavedTheme(theme) {
    document.body.classList.remove('light-theme', 'high-contrast-theme');

    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else if (theme === 'high-contrast') {
        document.body.classList.add('high-contrast-theme');
    }

    updateThemeIcon(theme);
}

async function trackArticleView(articleId) {
    try {
        await fetch(`/api/news/${articleId}/view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

async function loadArticle(articleId) {
    try {
        console.log('Loading article with ID:', articleId);
        const response = await fetch('/api/news');
        allArticles = await response.json();
        console.log('All articles loaded:', allArticles.length);

        currentArticle = allArticles.find(article => article.id === articleId);
        console.log('Current article:', currentArticle);

        if (!currentArticle) {
            console.error('Article not found with ID:', articleId);
            window.location.href = 'index.html';
            return;
        }

        renderArticle();
        console.log('Article rendered');
        renderRelatedArticles();
        updateMetaTags();
        updateArticleContent(currentLanguage);
        trackArticleView(articleId);
    } catch (error) {
        console.error('Error loading article:', error);
        document.getElementById('article-content').innerHTML = '<p>Article not found.</p>';
    }
}

function renderArticle() {
    const articleContent = document.getElementById('article-content');

    const title = getNewsTitle(currentArticle);
    const summary = getNewsSummary(currentArticle);

    const fullContent = generateFullContent(currentArticle, summary);

    const readingTime = calculateReadingTime(fullContent);

    articleContent.innerHTML = `
        <div class="article-header">
            <span class="article-category">${currentArticle.category}</span>
            <h1 class="article-title">${title}</h1>
            <div class="article-meta">
                <span class="article-date">${currentArticle.time}</span>
                <span class="article-author">By SIVEAL Editorial</span>
                <span class="reading-time">${readingTime} min read</span>
            </div>
            <div class="article-controls">
                <div class="font-controls">
                    <button id="decrease-font" class="font-btn" title="Decrease font size">A-</button>
                    <button id="increase-font" class="font-btn" title="Increase font size">A+</button>
                </div>
                <div class="social-controls">
                    <button id="like-btn" class="like-btn" title="Like this article">
                        <span class="heart-icon">❤️</span>
                        <span class="like-count">${currentArticle.likes || 0}</span>
                    </button>
                    <button id="bookmark-btn" class="bookmark-btn" title="Bookmark this article">
                        <span class="bookmark-icon">🔖</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="reading-progress">
            <div class="progress-bar"></div>
        </div>

        <div class="article-image">
            <img src="${currentArticle.image}" alt="${title}" loading="lazy">
        </div>

        <div class="article-body">
            ${fullContent}
        </div>

        <div class="article-share">
            <h4>Share this article</h4>
            <div class="share-buttons">
                <button onclick="shareOnTwitter()" class="share-btn twitter" title="Share on Twitter">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </button>
                <button onclick="shareOnFacebook()" class="share-btn facebook" title="Share on Facebook">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
                <button onclick="shareOnLinkedIn()" class="share-btn linkedin" title="Share on LinkedIn">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </button>
                <button onclick="shareOnWhatsApp()" class="share-btn whatsapp" title="Share on WhatsApp">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>
                </button>
            </div>
        </div>
    `;
}

function generateFullContent(article, translatedSummary) {
    const summary = translatedSummary || article.summary;
    const category = article.category;
    const lang = currentLanguage || 'en';

    const paragraphs = {
        en: [
            summary,
            `This development in the ${category.toLowerCase()} field is an important step that will shape the future of the industry. The rapid changes taking place in the technology world continue to test the adaptation capabilities of companies and individuals.`,
            `Experts predict that this progress in the ${category.toLowerCase()} field will lead to even greater changes in the coming years. Innovation and technology integration are becoming indispensable elements in the modern world.`,
            `This development will also affect other players in the ${category.toLowerCase()} ecosystem. As the competitive environment heats up, better and more innovative solutions are expected to emerge for consumers.`,
            `As SIVEAL, we closely follow developments in the technology world and continue to bring our readers the most up-to-date information. Progress in the ${category} field offers new opportunities that will make everyone's life easier.`
        ],
        tr: [
            summary,
            `${category} alanında yaşanan bu gelişme, sektörün geleceğini şekillendirecek önemli bir adımdır. Teknoloji dünyasında yaşanan hızlı değişimler, şirketlerin ve bireylerin adaptasyon yeteneklerini test etmeye devam ediyor.`,
            `Uzmanlar, ${category.toLowerCase()} alanındaki bu ilerlemenin, önümüzdeki yıllarda daha da büyük değişimlere yol açacağını öngörüyor. İnovasyon ve teknoloji entegrasyonu, modern dünyada vazgeçilmez unsurlar haline geliyor.`,
            `Bu gelişme aynı zamanda ${category.toLowerCase()} ekosistemindeki diğer oyuncuları da etkileyecek. Rekabet ortamı daha da kızışırken, tüketiciler için daha kaliteli ve yenilikçi çözümler ortaya çıkması bekleniyor.`,
            `SIVEAL olarak teknoloji dünyasındaki gelişmeleri yakından takip ediyor ve okuyucularımızı en güncel bilgilerle buluşturmaya devam ediyoruz. ${category} alanındaki ilerlemeler, hepimizin hayatını kolaylaştıracak yeni fırsatlar sunuyor.`
        ],
        az: [
            summary,
            `${category} sahəsində baş verən bu inkişaf, sənayesinin gələcəyini formalaşdıracaq vacib bir addımdır. Texnologiya dünyasında baş verən sürətli dəyişikliklər, şirkətlərin və fərdlərin adaptasiya imkanlarını sınamağa davam edir.`,
            `Mütəxəssislər, ${category.toLowerCase()} sahəsindəki bu irəliləyişin, gələn illərdə daha böyük dəyişikliklərə səbəb olacağını proqnozlaşdırır. İnnovasiya və texnologiya inteqrasiyası, müasir dünyada əvəzsiz elementlər halına gəlir.`,
            `Bu inkişaf həmçinin ${category.toLowerCase()} ekosistemindəki digər oyunçuları da təsir edəcək. Rəqabət mühiti daha da qızışarkən, istehlakçılar üçün daha keyfiyyətli və yenilikçi həllər ortaya çıxması gözlənilir.`,
            `SIVEAL olaraq texnologiya dünyasındakı inkişafları yaxından izləyirik və oxucularımızı ən aktual məlumatlarla buluşturmağa davam edirik. ${category} sahəsindəki irəliləyişlər, hamımızın həyatını asanlaşdıracaq yeni imkanlar təqdim edir.`
        ],
        ru: [
            summary,
            `Это развитие в области ${category.toLowerCase()} является важным шагом, который сформирует будущее отрасли. Быстрые изменения, происходящие в мире технологий, продолжают тестировать возможности адаптации компаний и отдельных лиц.`,
            `Эксперты прогнозируют, что этот прогресс в области ${category.toLowerCase()} приведет к еще большим изменениям в ближайшие годы. Инновации и интеграция технологий становятся незаменимыми элементами в современном мире.`,
            `Это развитие также повлияет на других игроков в экосистеме ${category.toLowerCase()}. По мере ужесточения конкурентной среды ожидается появление лучших и более инновационных решений для потребителей.`,
            `Как SIVEAL, мы внимательно следим за развитием в мире технологий и продолжаем предоставлять нашим читателям самую свежую информацию. Прогресс в области ${category} предлагает новые возможности, которые облегчат жизнь каждому из нас.`
        ]
    };

    const selectedParagraphs = paragraphs[lang] || paragraphs['en'];
    return selectedParagraphs.map(p => `<p>${p}</p>`).join('');
}

function renderRelatedArticles() {
    const relatedContainer = document.getElementById('related-articles');

    const relatedArticles = allArticles
        .filter(article => article.category === currentArticle.category && article.id !== currentArticle.id)
        .slice(0, 3);

    relatedContainer.innerHTML = relatedArticles.map(article => {
        const title = getNewsTitle(article);
        const summary = getNewsSummary(article);

        return `
        <article class="related-card" onclick="window.location.href='article.html?id=${article.id}'">
            <div class="related-image">
                <img src="${article.image}" alt="${title}" loading="lazy">
            </div>
            <div class="related-content">
                <span class="related-category">${article.category}</span>
                <h4>${title}</h4>
                <p>${summary.substring(0, 100)}...</p>
            </div>
        </article>
    `}).join('');
}

function updateMetaTags() {
    document.title = `${currentArticle.title} | SIVEAL`;
    document.getElementById('article-title').content = `${currentArticle.title} | SIVEAL`;
    document.getElementById('article-description').content = currentArticle.summary;
    document.getElementById('og-title').content = currentArticle.title;
    document.getElementById('og-description').content = currentArticle.summary;
    document.getElementById('og-image').content = currentArticle.image;
}

// Sharing functions
function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${currentArticle.title} - SIVEAL`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticle.title);
    const summary = encodeURIComponent(currentArticle.summary);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
}

function toggleTheme() {
    const themes = ['dark', 'light', 'high-contrast'];
    const currentTheme = localStorage.getItem('siveal-theme') || 'dark';

    themes.forEach(theme => {
        if (theme !== 'dark') {
            document.body.classList.remove(`${theme}-theme`);
        }
    });

    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

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

    const themeIcons = {
        'dark': `<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>`,
        'light': `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd"/>`,
        'high-contrast': `<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m9.9 9.9l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m9.9-9.9l1.42-1.42"/>`
    };

    iconSVG.innerHTML = themeIcons[theme] || themeIcons['dark'];
}

// Comments
async function loadComments(articleId) {
    try {
        const response = await fetch(`/api/comments/${articleId}`);
        const comments = await response.json();
        renderComments(comments);
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function renderComments(comments) {
    const commentsList = document.getElementById('comments-list');

    if (comments.length === 0) {
        commentsList.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        return;
    }

    comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item ${comment.parentId ? 'reply' : ''}">
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${new Date(comment.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <button class="comment-like-btn" onclick="likeComment(${comment.id})">
                    👍 ${comment.likes || 0}
                </button>
                <button class="comment-reply-btn" onclick="showReplyForm(${comment.id})">
                    Reply
                </button>
            </div>
            <div class="reply-form" id="reply-form-${comment.id}" style="display: none;">
                <form onsubmit="submitReply(event, ${comment.id}, ${comment.articleId})">
                    <input type="text" placeholder="Your name" required>
                    <textarea placeholder="Write your reply..." rows="3" required></textarea>
                    <button type="submit">Reply</button>
                    <button type="button" onclick="hideReplyForm(${comment.id})">Cancel</button>
                </form>
            </div>
        </div>
    `).join('');
}

async function submitComment(articleId) {
    const author = document.getElementById('comment-author').value;
    const content = document.getElementById('comment-content').value;

    try {
        const response = await fetch(`/api/comments/${articleId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ author, content })
        });

        if (response.ok) {
            document.getElementById('comment-form').reset();
            loadComments(articleId); // Reload comments
        } else {
            alert('Failed to post comment. Please try again.');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment. Please try again.');
    }
}

async function submitReply(event, parentId, articleId) {
    event.preventDefault();

    const form = event.target;
    const author = form.querySelector('input').value;
    const content = form.querySelector('textarea').value;

    try {
        const response = await fetch(`/api/comments/${articleId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ author, content, parentId })
        });

        if (response.ok) {
            hideReplyForm(parentId);
            loadComments(articleId); // Reload comments
        } else {
            alert('Failed to post reply. Please try again.');
        }
    } catch (error) {
        console.error('Error posting reply:', error);
        alert('Failed to post reply. Please try again.');
    }
}

function showReplyForm(commentId) {
    document.getElementById(`reply-form-${commentId}`).style.display = 'block';
}

function hideReplyForm(commentId) {
    document.getElementById(`reply-form-${commentId}`).style.display = 'none';
}

// Translation data
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

function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('siveal-language', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    applyLanguage(lang);
}

function applyLanguage(lang) {
    const langData = translations[lang];
    if (!langData) return;

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

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.placeholder = langData['search-placeholder'];
    }

    if (currentArticle) {
        updateArticleContent(lang);
    }
}

function updateArticleContent(lang) {
    renderArticle();
    renderRelatedArticles();

    updateMetaTags();
}

function getNewsTitle(news) {
    const langSuffix = currentLanguage === 'en' ? '' : `_${currentLanguage}`;
    return news[`title${langSuffix}`] || news.title;
}

function getNewsSummary(news) {
    const langSuffix = currentLanguage === 'en' ? '' : `_${currentLanguage}`;
    return news[`summary${langSuffix}`] || news.summary;
}

async function likeComment(commentId) {
    const likeBtn = document.querySelector(`[onclick="likeComment(${commentId})"]`);
    const currentLikes = parseInt(likeBtn.textContent.match(/\d+/)[0]);
    likeBtn.innerHTML = `👍 ${currentLikes + 1}`;
    likeBtn.style.color = '#60a5fa';
}

function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

function initReadingFeatures() {
    const decreaseBtn = document.getElementById('decrease-font');
    const increaseBtn = document.getElementById('increase-font');

    if (decreaseBtn && increaseBtn) {
        decreaseBtn.addEventListener('click', () => adjustFontSize(-1));
        increaseBtn.addEventListener('click', () => adjustFontSize(1));
    }

    initReadingProgress();

    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }

    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', handleBookmark);
        updateBookmarkIcon();
    }
}

function adjustFontSize(delta) {
    const articleBody = document.querySelector('.article-body');
    if (!articleBody) return;

    const currentSize = parseFloat(getComputedStyle(articleBody).fontSize);
    const newSize = Math.max(14, Math.min(24, currentSize + delta));

    articleBody.style.fontSize = `${newSize}px`;
    localStorage.setItem('siveal-font-size', newSize);
}

function initReadingProgress() {
    const progressBar = document.querySelector('.progress-bar');
    if (!progressBar) return;

    const updateProgress = () => {
        const articleBody = document.querySelector('.article-body');
        if (!articleBody) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const articleTop = articleBody.offsetTop;
        const articleHeight = articleBody.offsetHeight;
        const windowHeight = window.innerHeight;

        const scrollProgress = Math.min(100, Math.max(0,
            ((scrollTop - articleTop + windowHeight) / (articleHeight + windowHeight)) * 100
        ));

        progressBar.style.width = `${scrollProgress}%`;
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial call
}

async function handleLike() {
    const likeBtn = document.getElementById('like-btn');
    const likeCount = likeBtn.querySelector('.like-count');

    if (!likeBtn || !likeCount) return;

    const isLiked = likeBtn.classList.contains('liked');
    const currentCount = parseInt(likeCount.textContent);

    if (isLiked) {
        likeBtn.classList.remove('liked');
        likeCount.textContent = currentCount - 1;
        likeBtn.querySelector('.heart-icon').textContent = '❤️';
    } else {
        likeBtn.classList.add('liked');
        likeCount.textContent = currentCount + 1;
        likeBtn.querySelector('.heart-icon').textContent = '💖';
        likeBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            likeBtn.style.transform = 'scale(1)';
        }, 200);
    }

    const likedArticles = JSON.parse(localStorage.getItem('siveal-liked') || '[]');
    const articleId = currentArticle.id;

    if (isLiked) {
        const index = likedArticles.indexOf(articleId);
        if (index > -1) likedArticles.splice(index, 1);
    } else {
        if (!likedArticles.includes(articleId)) {
            likedArticles.push(articleId);
        }
    }

    localStorage.setItem('siveal-liked', JSON.stringify(likedArticles));

    try {
        await fetch(`/api/news/${articleId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.log('Like update failed, but saved locally');
    }
}

function handleBookmark() {
    const bookmarkBtn = document.getElementById('bookmark-btn');

    const bookmarkedArticles = JSON.parse(localStorage.getItem('siveal-bookmarks') || '[]');
    const articleId = currentArticle.id;

    const isBookmarked = bookmarkedArticles.includes(articleId);

    if (isBookmarked) {
        const index = bookmarkedArticles.indexOf(articleId);
        bookmarkedArticles.splice(index, 1);
    } else {
        bookmarkedArticles.push(articleId);
    }

    localStorage.setItem('siveal-bookmarks', JSON.stringify(bookmarkedArticles));
    updateBookmarkIcon();

    const icon = bookmarkBtn.querySelector('.bookmark-icon');
    icon.style.transform = 'scale(1.3)';
    setTimeout(() => {
        icon.style.transform = 'scale(1)';
    }, 200);
}

function updateBookmarkIcon() {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    if (!bookmarkBtn) return;

    const bookmarkedArticles = JSON.parse(localStorage.getItem('siveal-bookmarks') || '[]');
    const isBookmarked = bookmarkedArticles.includes(currentArticle.id);

    const icon = bookmarkBtn.querySelector('.bookmark-icon');
    if (isBookmarked) {
        icon.textContent = '🔖';
        bookmarkBtn.classList.add('bookmarked');
    } else {
        icon.textContent = '🔖';
        bookmarkBtn.classList.remove('bookmarked');
    }
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${currentArticle.title} - SIVEAL`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initReadingFeatures, 100);
});

function loadUserPreferences() {
    const savedFontSize = localStorage.getItem('siveal-font-size');
    if (savedFontSize) {
        const applyFontSize = () => {
            const articleBody = document.querySelector('.article-body');
            if (articleBody) {
                articleBody.style.fontSize = `${savedFontSize}px`;
                console.log('Applied saved font size:', savedFontSize);
            }
        };

        applyFontSize();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const articleBody = document.querySelector('.article-body');
                    if (articleBody && !articleBody.style.fontSize) {
                        applyFontSize();
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(applyFontSize, 100);
        setTimeout(applyFontSize, 500);
        setTimeout(applyFontSize, 1000);
    }

    const savedTheme = localStorage.getItem('siveal-theme') || 'dark';
    loadSavedTheme(savedTheme);

    console.log('Loaded user preferences - Font size:', savedFontSize, 'Theme:', savedTheme);
}

loadUserPreferences();
