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

        // Seed admin user
        const User = require('../models/User');
        const bcrypt = require('bcryptjs');
        const adminExists = await User.findOne({ username: 'admin' });
        
        if (!adminExists) {
            console.log('Admin kullanıcı oluşturuluyor...');
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            await User.create({
                id: 1,
                username: 'admin',
                email: 'admin@siveal.com',
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Administrator',
                role: 'admin',
                isActive: true
            });
            console.log('Admin kullanıcı oluşturuldu! (admin / Admin123!)');
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
