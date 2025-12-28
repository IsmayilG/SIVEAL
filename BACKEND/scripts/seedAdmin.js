require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: process.env.MONGODB_DB_NAME || 'siveal_db'
        });
        console.log('MongoDB bağlantısı başarılı');

        // Check if admin exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin kullanıcı zaten mevcut, güncelleniyor...');
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log('Admin parolası güncellendi!');
        } else {
            // Create admin user
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            const admin = new User({
                id: 1,
                username: 'admin',
                email: 'admin@siveal.com',
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Administrator',
                role: 'admin',
                isActive: true
            });
            await admin.save();
            console.log('Admin kullanıcı oluşturuldu!');
        }

        console.log('\n=== ADMIN BİLGİLERİ ===');
        console.log('Kullanıcı Adı: admin');
        console.log('Parola: Admin123!');
        console.log('Email: admin@siveal.com');
        console.log('========================\n');

        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
};

seedAdmin();
