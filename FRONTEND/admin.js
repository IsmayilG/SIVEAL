let articles = [];
let editingArticle = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadArticles();
    document.getElementById('newsForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancel-btn').addEventListener('click', cancelEdit);
    document.getElementById('delete-modal-close').addEventListener('click', () => {
        document.getElementById('delete-modal').classList.remove('show');
    });
    document.getElementById('cancel-delete').addEventListener('click', () => {
        document.getElementById('delete-modal').classList.remove('show');
    });
    document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
});

async function loadDashboard() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update stats
        document.getElementById('total-articles').textContent = stats.totalArticles;
        document.getElementById('total-views').textContent = stats.totalViews.toLocaleString();

        // Find top category
        let topCategory = 'N/A';
        let maxViews = 0;
        for (const [category, data] of Object.entries(stats.categoryStats)) {
            if (data.views > maxViews) {
                maxViews = data.views;
                topCategory = category;
            }
        }
        document.getElementById('top-category').textContent = topCategory;

        // Calculate average views
        const avgViews = stats.totalArticles > 0 ? Math.round(stats.totalViews / stats.totalArticles) : 0;
        document.getElementById('avg-views').textContent = avgViews.toLocaleString();

        // Update recent articles
        const recentContainer = document.getElementById('recent-articles');
        recentContainer.innerHTML = stats.recentArticles.slice(0, 5).map(article => `
            <div class="recent-article-item">
                <h5>${article.title}</h5>
                <div class="recent-article-meta">${article.category} • ${article.views || 0} views</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadArticles() {
    try {
        const response = await fetch('/api/news');
        articles = await response.json();
        renderArticlesList();
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

function renderArticlesList() {
    const container = document.getElementById('articles-list');
    container.innerHTML = '';

    articles.forEach(article => {
        const articleItem = document.createElement('div');
        articleItem.className = 'article-item';

        articleItem.innerHTML = `
            <h4>${article.title}</h4>
            <div class="article-meta">${article.category} • ${article.time}</div>
            <div class="article-actions">
                <button class="btn-small btn-edit" onclick="editArticle(${article.id})">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteArticle(${article.id})">Delete</button>
            </div>
        `;

        container.appendChild(articleItem);
    });
}

function editArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    editingArticle = article;

    // Fill form with article data
    document.getElementById('article-id').value = article.id;
    document.getElementById('title').value = article.title;
    document.getElementById('category').value = article.category;
    document.getElementById('image').value = article.image;
    document.getElementById('summary').value = article.summary;

    // Update UI
    document.getElementById('form-title').textContent = 'Edit Article';
    document.getElementById('submit-btn').textContent = 'Update Article';
    document.getElementById('cancel-btn').style.display = 'inline-block';

    // Scroll to form
    document.querySelector('.admin-panel').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingArticle = null;

    // Reset form
    document.getElementById('newsForm').reset();
    document.getElementById('article-id').value = '';

    // Reset UI
    document.getElementById('form-title').textContent = 'Add New Article';
    document.getElementById('submit-btn').textContent = 'Publish Article';
    document.getElementById('cancel-btn').style.display = 'none';
}

let articleToDelete = null;

function deleteArticle(articleId) {
    articleToDelete = articleId;
    document.getElementById('delete-modal').classList.add('show');
}

async function confirmDelete() {
    if (!articleToDelete) return;

    try {
        const response = await fetch(`/api/news/${articleToDelete}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            document.getElementById('delete-modal').classList.remove('show');
            await loadArticles(); // Reload articles list
            articleToDelete = null;
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        console.error('Error deleting article:', error);
        alert('Failed to delete article. Please try again.');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const statusDiv = document.getElementById('status');
    const submitBtn = document.getElementById('submit-btn');

    const newsData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        image: document.getElementById('image').value,
        summary: document.getElementById('summary').value
    };

    const isEditing = editingArticle !== null;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/news/${editingArticle.id}` : '/api/news';

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = isEditing ? 'Updating...' : 'Publishing...';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newsData)
        });

        if (response.ok) {
            statusDiv.innerText = `Article ${isEditing ? 'updated' : 'published'} successfully!`;
            statusDiv.className = 'status success';
            document.getElementById('newsForm').reset();

            if (isEditing) {
                cancelEdit();
            }

            await loadArticles(); // Reload articles list
        } else {
            throw new Error('Server error');
        }

    } catch (error) {
        statusDiv.innerText = `Failed to ${isEditing ? 'update' : 'publish'} article.`;
        statusDiv.className = 'status error';
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isEditing ? 'Update Article' : 'Publish Article';
        setTimeout(() => {
            statusDiv.innerText = '';
        }, 3000);
    }
}
