const mongoose = require('mongoose');
require('dotenv').config();

const seedInitialData = async () => {
    try {
        const News = require('../models/News');
        const count = await News.countDocuments();
        
        if (count === 0) {
            console.log('Veritabanında haber yok, seed verisi ekleniyor...');
            const newsData = require('../data/news.json');
            await News.insertMany(newsData);
            console.log(`${newsData.length} haber başarıyla eklendi!`);
        } else {
            console.log(`Veritabanında ${count} haber mevcut.`);
        }
    } catch (error) {
        console.error('Seed hatası:', error.message);
    }
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'siveal_db'
        });
        
        console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
        console.log(`Veritabanı: ${conn.connection.name}`);
        
        // Auto-seed if no news exist
        await seedInitialData();
        
        // Bağlantı olaylarını dinle
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB Bağlantı Hatası:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB Bağlantısı Kesildi');
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB bağlantısı kapatıldı');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('MongoDB Bağlantı Hatası:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
