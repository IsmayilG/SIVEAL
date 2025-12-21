const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, 'data', 'news.json');

// API endpoints only - frontend served separately by Netlify
app.get('/', (req, res) => {
    res.json({ message: 'SIVEAL Backend API', status: 'running' });
});

app.get('/api/news', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');
        res.json(JSON.parse(data));
    });
});

app.get('/rss.xml', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');

        const articles = JSON.parse(data);
        const rssItems = articles.slice(0, 20).map(article => `
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
    });
});

app.post('/api/news', (req, res) => {
    const newArticle = req.body;
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');

        const newsArray = JSON.parse(data);
        const newId = newsArray.length > 0 ? newsArray[0].id + 1 : 1;

        newArticle.id = newId;
        newArticle.time = new Date().toLocaleDateString();

        newsArray.unshift(newArticle);

        fs.writeFile(dataPath, JSON.stringify(newsArray, null, 2), (err) => {
            if (err) return res.status(500).send('Error');
            res.json({ message: 'Success' });
        });
    });
});

app.put('/api/news/:id', (req, res) => {
    const articleId = parseInt(req.params.id);
    const updatedArticle = req.body;

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');

        let newsArray = JSON.parse(data);
        const articleIndex = newsArray.findIndex(article => article.id === articleId);

        if (articleIndex === -1) {
            return res.status(404).send('Article not found');
        }

        newsArray[articleIndex] = {
            ...newsArray[articleIndex],
            ...updatedArticle
        };

        fs.writeFile(dataPath, JSON.stringify(newsArray, null, 2), (err) => {
            if (err) return res.status(500).send('Error');
            res.json({ message: 'Success' });
        });
    });
});

app.delete('/api/news/:id', (req, res) => {
    const articleId = parseInt(req.params.id);

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');

        let newsArray = JSON.parse(data);
        const filteredArray = newsArray.filter(article => article.id !== articleId);

        if (filteredArray.length === newsArray.length) {
            return res.status(404).send('Article not found');
        }

        fs.writeFile(dataPath, JSON.stringify(filteredArray, null, 2), (err) => {
            if (err) return res.status(500).send('Error');
            res.json({ message: 'Success' });
        });
    });
});

app.post('/api/news/:id/view', (req, res) => {
    const articleId = parseInt(req.params.id);

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error');

        let newsArray = JSON.parse(data);
        const articleIndex = newsArray.findIndex(article => article.id === articleId);

        if (articleIndex === -1) {
            return res.status(404).send('Article not found');
        }

        if (!newsArray[articleIndex].views) {
            newsArray[articleIndex].views = 0;
        }

        newsArray[articleIndex].views += 1;

        fs.writeFile(dataPath, JSON.stringify(newsArray, null, 2), (err) => {
            if (err) return res.status(500).send('Error');
            res.json({ views: newsArray[articleIndex].views });
        });
    });
});



app.get('/api/comments/:articleId', (req, res) => {
    const articleId = parseInt(req.params.articleId);
    const commentsPath = path.join(__dirname, 'data', 'comments.json');

    fs.readFile(commentsPath, 'utf8', (err, data) => {
        if (err) {
            return res.json([]);
        }

        try {
            const allComments = JSON.parse(data);
            const articleComments = allComments.filter(comment => comment.articleId === articleId);
            res.json(articleComments);
        } catch (error) {
            res.json([]);
        }
    });
});

app.post('/api/comments/:articleId', (req, res) => {
    const articleId = parseInt(req.params.articleId);
    const { author, content, parentId } = req.body;
    const commentsPath = path.join(__dirname, 'data', 'comments.json');

    if (!author || !content) {
        return res.status(400).json({ error: 'Author and content are required' });
    }

    const newComment = {
        id: Date.now(),
        articleId,
        author,
        content,
        parentId: parentId || null,
        timestamp: new Date().toISOString(),
        likes: 0
    };

    fs.readFile(commentsPath, 'utf8', (err, data) => {
        let comments = [];
        if (!err) {
            try {
                comments = JSON.parse(data);
            } catch (error) {
                comments = [];
            }
        }

        comments.push(newComment);

        fs.writeFile(commentsPath, JSON.stringify(comments, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving comment');
            res.json(newComment);
        });
    });
});



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
