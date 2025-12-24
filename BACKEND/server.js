const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'siveal-secret-key-change-in-production';

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'siveal-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

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

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);

        const user = users.find(u => u.username === username && u.isActive);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);

        // Check if user already exists
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now(),
            username,
            email,
            password: hashedPassword,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true
        };

        users.push(newUser);
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    // In a stateless JWT system, logout is handled on the client side
    // by removing the token from localStorage
    res.json({ success: true, message: 'Logged out successfully' });
});

// Protected routes
app.get('/api/auth/status', authenticateToken, (req, res) => {
    res.json({
        isLoggedIn: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        }
    });
});

app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);

        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);

        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[userIndex];

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to change password' });
            }

            const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidCurrentPassword) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }

            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Update email if provided
        if (email && email !== user.email) {
            // Check if email is already taken
            if (users.find(u => u.email === email && u.id !== user.id)) {
                return res.status(409).json({ error: 'Email already exists' });
            }
            user.email = email;
        }

        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin endpoints
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(usersData);

        const newsData = fs.readFileSync(dataPath, 'utf8');
        const articles = JSON.parse(newsData);

        res.json({
            totalUsers: users.length,
            totalArticles: articles.length,
            totalViews: articles.reduce((sum, article) => sum + (article.views || 0), 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
