const request = require('supertest');
const express = require('express');
const newsRoutes = require('../routes/news');

// Mock the News model
jest.mock('../models/News', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../models/Comment', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn()
}));

const News = require('../models/News');
const Comment = require('../models/Comment');

const app = express();
app.use(express.json());
app.use('/api', newsRoutes);

describe('News Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/news', () => {
    it('should return news articles', async () => {
      const mockNews = [
        {
          id: 1,
          title: 'Test Article',
          category: 'AI & Robotics',
          published: true
        }
      ];

      News.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockNews)
          })
        })
      });

      const response = await request(app)
        .get('/api/news')
        .expect(200);

      expect(response.body).toEqual(mockNews);
      expect(News.find).toHaveBeenCalledWith({ published: true });
    });

    it('should filter by category', async () => {
      const mockNews = [{ id: 1, title: 'AI Article', category: 'AI & Robotics' }];

      News.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue(mockNews)
          })
        })
      });

      await request(app)
        .get('/api/news?category=AI%20%26%20Robotics')
        .expect(200);

      expect(News.find).toHaveBeenCalledWith({
        published: true,
        category: 'AI & Robotics'
      });
    });
  });

  describe('POST /api/news/:id/view', () => {
    it('should increment view count', async () => {
      const mockArticle = { id: 1, views: 10 };

      News.findOneAndUpdate.mockResolvedValue({ ...mockArticle, views: 11 });

      const response = await request(app)
        .post('/api/news/1/view')
        .expect(200);

      expect(response.body.views).toBe(11);
      expect(News.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 1 },
        { $inc: { views: 1 } },
        { new: true }
      );
    });
  });

  describe('GET /api/comments/:articleId', () => {
    it('should return comments for an article', async () => {
      const mockComments = [
        {
          id: 1,
          articleId: 1,
          content: 'Test comment',
          author: 'Test User'
        }
      ];

      Comment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockComments)
        })
      });

      const response = await request(app)
        .get('/api/comments/1')
        .expect(200);

      expect(response.body).toEqual(mockComments);
    });
  });

  describe('POST /api/comments/:articleId', () => {
    it('should create a new comment', async () => {
      const mockComment = {
        id: 1,
        articleId: 1,
        author: 'Test User',
        content: 'Test comment content'
      };

      Comment.findOne.mockResolvedValue(null); // No last comment
      Comment.prototype.save = jest.fn().mockResolvedValue(mockComment);

      const response = await request(app)
        .post('/api/comments/1')
        .send({
          author: 'Test User',
          content: 'Test comment content'
        })
        .expect(201);

      expect(response.body).toEqual(mockComment);
    });

    it('should validate comment content', async () => {
      const response = await request(app)
        .post('/api/comments/1')
        .send({
          author: 'Test User',
          content: '<script>alert("xss")</script>'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid comment content');
    });
  });
});
