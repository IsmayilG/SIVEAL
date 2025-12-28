require('dotenv').config();
const mongoose = require('mongoose');
const News = require('../models/News');
const newsData = require('../data/news.json');

const seedNews = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'siveal_db'
        });
        console.log('MongoDB bağlantısı başarılı');

        // Clear existing news
        await News.deleteMany({});
        console.log('Mevcut haberler silindi');

        // Insert seed data
        const result = await News.insertMany(newsData);
        console.log(`${result.length} haber başarıyla eklendi`);

        console.log('Seed işlemi tamamlandı!');
        process.exit(0);
    } catch (error) {
        console.error('Seed hatası:', error);
        process.exit(1);
    }
};

seedNews();
