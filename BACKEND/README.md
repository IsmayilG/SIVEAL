# SIVEAL Backend - Render Deployment

Bu backend Node.js/Express ile yazılmış ve Render platformunda deploy edilmek üzere hazırlanmıştır.

## 🚀 Render Deployment Adımları

### 1. GitHub Repository Oluşturma
1. Bu projeyi GitHub'a yükleyin
2. Public repository yapın

### 2. Render'da Web Service Oluşturma
1. [render.com](https://render.com) hesabınıza giriş yapın
2. "New +" butonuna tıklayın → "Web Service"
3. GitHub repository'nizi bağlayın
4. Aşağıdaki ayarları yapın:

```
Name: siveal-backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

### 3. Environment Variables (Opsiyonel)
Render dashboard'ında Environment sekmesinden:
```
NODE_ENV=production
```

### 4. Deploy
- Otomatik olarak deploy edilecek
- Deploy tamamlandıktan sonra URL'yi alın (örn: `https://siveal-backend.onrender.com`)

## 🔧 Teknik Detaylar

- **Runtime**: Node.js
- **Port**: Environment variable'dan alır (`process.env.PORT`)
- **CORS**: Tüm origin'lere izin verir
- **Static Files**: Frontend dosyalarını serve eder

## 📁 Dosya Yapısı
```
BACKEND/
├── server.js          # Ana uygulama dosyası
├── package.json       # Dependencies ve scripts
├── data/
│   ├── news.json      # Haber verileri
│   └── users.json     # Kullanıcı verileri
└── README.md          # Bu dosya
```

## 🔗 API Endpoints

- `GET /` - Frontend ana sayfa
- `GET /api/news` - Tüm haberleri getir
- `POST /api/news` - Yeni haber ekle
- `PUT /api/news/:id` - Haber güncelle
- `DELETE /api/news/:id` - Haber sil
- `GET /api/comments/:articleId` - Yorumları getir
- `POST /api/comments/:articleId` - Yorum ekle

## 📡 Frontend Bağlantısı

Frontend deploy edildikten sonra, frontend'in environment variable'larında API URL'ini güncelleyin:

```javascript
const API_BASE_URL = 'https://siveal-backend.onrender.com';
