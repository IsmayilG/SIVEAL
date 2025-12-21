# SIVEAL - Global Tech Wire

Modern, responsive ve çok dilli haber sitesi. Backend Node.js/Express, frontend HTML/CSS/JavaScript ile geliştirilmiştir.

## 🚀 Özellikler

- **Çok Dilli Destek**: EN/TR/AZ/RU dilleri
- **Responsive Design**: Mobil uyumlu
- **Çoklu Tema**: Dark/Light/High Contrast
- **Admin Paneli**: İçerik yönetimi
- **RSS Feed**: Otomatik haber yayını
- **Yorum Sistemi**: Makale yorumları
- **Arama**: Gerçek zamanlı arama
- **SEO Dostu**: Meta tag'ları ve yapılandırılmış veriler

## 📁 Proje Yapısı

```
SIVEAL/
├── BACKEND/
│   ├── server.js          # Ana Express sunucusu
│   ├── package.json       # Backend dependencies
│   ├── data/
│   │   ├── news.json      # Haber verileri
│   │   └── users.json     # Kullanıcı verileri
│   └── README.md          # Backend deployment rehberi
├── FRONTEND/
│   ├── index.html         # Ana sayfa
│   ├── article.html       # Makale detay sayfası
│   ├── admin.html         # Admin paneli
│   ├── *.html             # Diğer sayfalar
│   ├── *.js               # JavaScript dosyaları
│   ├── style.css          # Ana CSS dosyası
│   ├── _redirects         # Netlify SPA routing
│   ├── netlify.toml       # Netlify konfigürasyonu
│   └── README.md          # Frontend deployment rehberi
└── README.md              # Bu dosya
```

## 🛠️ Teknoloji Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **File System** - Veri saklama (JSON dosyaları)

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid/Flexbox
- **Vanilla JavaScript** - No frameworks, pure JS
- **Responsive Design** - Mobile-first approach

### Deployment
- **Render** - Backend hosting
- **Netlify** - Frontend hosting
- **GitHub** - Version control

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v18+)
- Git

### Yerel Çalıştırma

1. **Repository'yi klonlayın:**
```bash
git clone <repository-url>
cd siveal
```

2. **Backend'i başlatın:**
```bash
cd BACKEND
npm install
npm start
```
Backend `http://localhost:3000`'de çalışacak

3. **Frontend'i açın:**
Yeni bir terminal'de:
```bash
cd FRONTEND
# Statik dosyaları serve etmek için basit bir server kullanın
# Örn: Python ile `python -m http.server 8080`
# Veya doğrudan tarayıcıda index.html'i açın
```

## 🌐 Deployment

### 1. GitHub Repository
1. Projeyi GitHub'a yükleyin
2. Public repository yapın

### 2. Backend Deployment (Render)
1. [render.com](https://render.com) hesabınıza giriş yapın
2. **New +** → **Web Service** tıklayın
3. GitHub repository'nizi bağlayın
4. Aşağıdaki ayarları yapın:

```
Name: siveal-backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

5. **Environment Variables** (opsiyonel):
```
NODE_ENV=production
```

6. **Deploy** butonuna tıklayın
7. Deploy tamamlandıktan sonra URL'yi not alın (örn: `https://siveal-backend.onrender.com`)

### 3. Frontend Deployment (Netlify)
1. [netlify.com](https://netlify.com) hesabınıza giriş yapın
2. **Add new site** → **Import an existing project**
3. GitHub repository'nizi bağlayın
4. Build ayarları otomatik olarak `netlify.toml`'dan okunacak:

```
Branch: main
Build command: echo 'No build step required'
Publish directory: FRONTEND
```

5. **Environment variables** ekleyin:
```
API_BASE_URL=https://siveal-backend.onrender.com
NODE_VERSION=18
```

6. **Deploy** butonuna tıklayın
7. Deploy tamamlandıktan sonra URL'yi alın (örn: `https://siveal.netlify.app`)

## 🔧 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Frontend ana sayfa |
| GET | `/api/news` | Tüm haberleri getir |
| POST | `/api/news` | Yeni haber ekle |
| PUT | `/api/news/:id` | Haber güncelle |
| DELETE | `/api/news/:id` | Haber sil |
| POST | `/api/news/:id/view` | Görüntülenme sayısını artır |
| GET | `/api/comments/:articleId` | Yorumları getir |
| POST | `/api/comments/:articleId` | Yorum ekle |

## 🎨 Tema Özellikleri

- **Dark Theme**: Varsayılan modern koyu tema
- **Light Theme**: Açık tema seçeneği
- **High Contrast**: Erişilebilirlik için yüksek kontrast

## 🌍 Çok Dilli Destek

- **English (EN)**: Ana dil
- **Türkçe (TR)**: Tam çeviri
- **Azərbaycanca (AZ)**: Tam çeviri
- **Русский (RU)**: Tam çeviri

## 📱 Responsive Design

- **Desktop**: 1240px max-width grid
- **Tablet**: 768px breakpoint
- **Mobile**: 480px breakpoint

## 🔒 Güvenlik

- CORS koruması
- Input validation
- XSS koruması için HTML escaping

## 📊 Performans

- Lazy loading resimleri
- Optimized CSS/JS
- Minimal dependencies
- Fast loading times

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için issue açabilir veya pull request gönderebilirsiniz.

---

**SIVEAL** - Global teknoloji haberlerini takip edin! 📰⚡
