# SIVEAL Frontend - Netlify Deployment

Bu frontend HTML/CSS/JavaScript ile yazılmış SPA (Single Page Application) ve Netlify platformunda deploy edilmek üzere hazırlanmıştır.

## 🚀 Netlify Deployment Adımları

### 1. GitHub Repository Oluşturma
1. Bu projeyi GitHub'a yükleyin
2. Public repository yapın

### 2. Netlify'da Site Oluşturma
1. [netlify.com](https://netlify.com) hesabınıza giriş yapın
2. "Add new site" → "Import an existing project"
3. GitHub repository'nizi bağlayın
4. Build ayarları otomatik olarak netlify.toml'dan okunacak:

```
Branch: main
Build command: echo 'No build step required'
Publish directory: FRONTEND
```

### 3. Environment Variables Ayarlama
Netlify dashboard'ında Site settings → Environment variables:

```
API_BASE_URL=https://siveal-backend.onrender.com
NODE_VERSION=18
```

### 4. Deploy
- Otomatik olarak deploy edilecek
- Deploy tamamlandıktan sonra URL'yi alın (örn: `https://siveal.netlify.app`)

## 🔧 Teknik Detaylar

- **Framework**: Vanilla HTML/CSS/JS (No build step)
- **Routing**: Client-side routing with URL parameters
- **API**: RESTful API calls to backend
- **Responsive**: Mobile-first design

## 📁 Dosya Yapısı
```
FRONTEND/
├── index.html         # Ana sayfa
├── article.html       # Makale detay sayfası
├── admin.html         # Admin paneli
├── login.html         # Giriş sayfası
├── profile.html       # Profil sayfası
├── about.html         # Hakkında sayfası
├── contact.html       # İletişim sayfası
├── privacy.html       # Gizlilik politikası
├── terms.html         # Kullanım şartları
├── advertise.html     # Reklam sayfası
├── style.css          # Ana CSS dosyası
├── script.js          # Ana JavaScript
├── article.js         # Makale sayfası JS
├── admin.js           # Admin paneli JS
├── profile.js         # Profil sayfası JS
├── rss.xml            # RSS feed
├── _redirects         # Netlify redirects
├── netlify.toml       # Netlify konfigürasyonu
└── README.md          # Bu dosya
```

## 🔗 Sayfa Yapısı

- `/` - Ana sayfa (haber listesi)
- `/article.html?id=X` - Makale detayı
- `/admin.html` - Admin paneli
- `/login.html` - Giriş sayfası
- `/profile.html` - Profil sayfası
- Diğer sayfalar statik

## 📡 API Bağlantısı

Frontend aşağıdaki API endpoint'lerini kullanır:

```javascript
// script.js içinde tanımlı
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://siveal-backend.onrender.com';
```

## 🌐 Özellikler

- **Çok Dilli Destek**: EN/TR/AZ/RU
- **Responsive Design**: Mobil uyumlu
- **Dark/Light/High Contrast** temaları
- **RSS Feed**: Otomatik RSS oluşturma
- **Yorum Sistemi**: Makale yorumları
- **Admin Paneli**: İçerik yönetimi
- **Arama**: Gerçek zamanlı arama

## 🔄 Deployment Sonrası Yapılacaklar

1. Backend deploy edildikten sonra API URL'ini alın
2. Frontend'deki environment variable'ı güncelleyin
3. Siteyi test edin
4. Domain bağlayın (opsiyonel)

## 📝 Notlar

- Bu proje build step gerektirmez
- Tüm dosyalar statik olarak serve edilir
- API çağrıları environment variable'dan alınır
- SPA routing için _redirects dosyası kullanılır
