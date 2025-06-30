# Karakolik – Futbol Takip ve Favori Sistemi

## Proje Amacı
Karakolik, kullanıcılara çeşitli futbol liglerinden maç fikstürlerini ve puan durumlarını anlık olarak takip etme olanağı sunar. Kullanıcılar ayrıca istedikleri maçları ve takımları favorilerine ekleyebilir. Projenin temel amacı, gerçek zamanlı API verilerini kullanarak interaktif bir futbol takip sistemi sunmaktır.

## Teknik Yığın (Tech Stack)
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Veritabanı:** Microsoft SQL Server (MSSQL)
- **API:** API-Football (RapidAPI)
- **Kimlik Doğrulama:** JSON Web Token (JWT)
- **Veri Güncelleme:** Otomatik cache yenileme sistemi

## Kurulum ve Çalıştırma

1. **Projeyi Klonlayın:**
   ```bash
   git clone https://github.com/kullaniciAdi/karakolik.git
   cd karakolik
   ```

2. **Gerekli Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **.env Dosyasını Oluşturun:**
   Ana dizine aşağıdaki değişkenleri içeren bir `.env` dosyası ekleyin:
   ```
   DB_USER=...
   DB_PW=...
   DB_SERVER=...
   DB_NAME=...
   JWT_SECRET=...
   API_FOOTBALL_KEY=...
   ```

4. **Veritabanı Ayarlarını Yapın:**
   MSSQL üzerinde `Users`, `Favorites`, `Teams`, `TeamFavorites` tablolarını içeren bir veritabanı oluşturun.

5. **Sunucuyu Başlatın:**
   ```bash
   node index.js
   ```

6. **Tarayıcıdan Erişim:**
   Uygulamanızı `http://localhost:3000` adresinde görüntüleyebilirsiniz.

## Klasör Yapısı
```
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── football.html
│   ├── favorites.html
│   └── scripts.js
│
├── routes/
│   ├── football.js
│   ├── favorites.js
│   └── team-fav.js
│
├── cache-refresh.js
├── dbPool.js
├── index.js
├── .env (örnek dosya yukarıda)
├── .gitignore
├── package.json
└── README.md
```

## Geliştirici
Bu proje bir final ödevi kapsamında geliştirilmiş olup, full-stack web geliştirme yetkinliğini belgelemeyi amaçlamaktadır.
