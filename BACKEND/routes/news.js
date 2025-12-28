const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.get('/', newsController.getNews);
router.post('/', newsController.createNews);
router.put('/:id', newsController.updateNews);
router.delete('/:id', newsController.deleteNews);
router.post('/:id/view', newsController.incrementView);
router.get('/comments/:articleId', newsController.getComments);
router.post('/comments/:articleId', newsController.createComment);

module.exports = router;
