const News = require('../models/News');
const Comment = require('../models/Comment');
const { validateInput, validateComment } = require('../middleware/security');

async function getNews(req, res) {
    try {
        const { category, featured, limit = 50, skip = 0 } = req.query;

        let query = { published: true };

        if (category) {
            query.category = category;
        }

        if (featured === 'true') {
            query.featured = true;
        }

        const news = await News.find(query)
            .sort({ time: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .select('-__v');

        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getRSS(req, res) {
    try {
        const articles = await News.find({ published: true })
            .sort({ time: -1 })
            .limit(20)
            .select('id title summary time category');

        const rssItems = articles.map(article => `
            <item>
                <title><![CDATA[${article.title}]]></title>
                <description><![CDATA[${article.summary}]]></description>
                <link>http://localhost:3000/article.html?id=${article.id}</link>
                <guid>http://localhost:3000/article.html?id=${article.id}</guid>
                <pubDate>${new Date(article.time).toUTCString()}</pubDate>
                <category>${article.category}</category>
            </item>
        `).join('');

        const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>SIVEAL - Global Tech Wire</title>
        <description>Latest technology news, AI developments, crypto updates, and enterprise solutions from around the world.</description>
        <link>http://localhost:3000</link>
        <atom:link href="http://localhost:3000/rss.xml" rel="self" type="application/rss+xml" />
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <generator>SIVEAL CMS</generator>
        ${rssItems}
    </channel>
</rss>`;

        res.header('Content-Type', 'application/rss+xml');
        res.send(rssContent);
    } catch (error) {
        console.error('Error generating RSS:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function createNews(req, res) {
    try {
        const { title, summary, content, category, author, image, featured, published, tags, metaTitle, metaDescription } = req.body;

        // Generate unique ID
        const lastNews = await News.findOne().sort({ id: -1 });
        const newId = lastNews ? lastNews.id + 1 : 1;

        const newArticle = new News({
            id: newId,
            title,
            summary,
            content,
            category,
            author,
            image,
            featured: featured || false,
            published: published !== false,
            tags,
            metaTitle,
            metaDescription,
            time: new Date()
        });

        const savedArticle = await newArticle.save();
        res.status(201).json({ message: 'Article created successfully', article: savedArticle });
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateNews(req, res) {
    try {
        const articleId = parseInt(req.params.id);
        const updateData = req.body;

        const updatedArticle = await News.findOneAndUpdate(
            { id: articleId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedArticle) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json({ message: 'Article updated successfully', article: updatedArticle });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteNews(req, res) {
    try {
        const articleId = parseInt(req.params.id);

        const deletedArticle = await News.findOneAndDelete({ id: articleId });

        if (!deletedArticle) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function incrementView(req, res) {
    try {
        const articleId = parseInt(req.params.id);

        const updatedArticle = await News.findOneAndUpdate(
            { id: articleId },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!updatedArticle) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json({ views: updatedArticle.views });
    } catch (error) {
        console.error('Error incrementing view:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getComments(req, res) {
    try {
        const articleId = parseInt(req.params.articleId);

        const comments = await Comment.find({
            articleId,
            deleted: false,
            isApproved: true
        })
        .populate('authorId', 'username avatar')
        .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function createComment(req, res) {
    try {
        const articleId = parseInt(req.params.articleId);
        const { author, content, parentId, authorEmail, authorId } = req.body;

        // Validate required fields
        if (!author || !content) {
            return res.status(400).json({ error: 'Author and content are required' });
        }

        // Validate comment content
        if (!validateComment(content)) {
            return res.status(400).json({ error: 'Invalid comment content' });
        }

        // Generate unique ID
        const lastComment = await Comment.findOne().sort({ id: -1 });
        const newId = lastComment ? lastComment.id + 1 : 1;

        const newComment = new Comment({
            id: newId,
            articleId,
            author,
            authorEmail,
            authorId,
            content,
            parentId: parentId || null
        });

        const savedComment = await newComment.save();
        res.status(201).json(savedComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getNews,
    getRSS,
    createNews,
    updateNews,
    deleteNews,
    incrementView,
    getComments,
    createComment
};
