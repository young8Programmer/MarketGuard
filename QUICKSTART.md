# MarketGuard - Tez Boshlash Qo'llanmasi

## 1. O'rnatish

```bash
# 1. Dependencies o'rnatish
npm install

# 2. Environment faylini yaratish
cp env.example .env

# 3. .env faylini sozlash (MySQL va Redis manzillarini kiriting)
# DB_HOST=localhost
# DB_PORT=3306
# DB_USERNAME=root
# DB_PASSWORD=your_password
# DB_DATABASE=marketguard
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

## 2. Database va Redis

```bash
# MySQL terminalida
CREATE DATABASE marketguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Redis ishga tushirish (agar yo'q bo'lsa)
# Windows: Redis Desktop Manager yoki WSL orqali
# Linux/Mac: redis-server
```

## 3. Loyihani ishga tushirish

```bash
# Development rejimi
npm run start:dev

# Server http://localhost:3000 da ishga tushadi
```

## 4. Birinchi Ma'lumotlarni Qo'shish

### Raqobatchi Qo'shish

```bash
POST http://localhost:3000/api/competitors
Content-Type: application/json

{
  "name": "Uzum Market",
  "platform": "uzum",
  "baseUrl": "https://uzum.uz",
  "isActive": true,
  "requiresProxy": false,
  "scrapingConfig": {
    "priceSelector": ".product-price",
    "nameSelector": "h1.product-title",
    "delay": 5000
  }
}
```

### Mahsulot Qo'shish

```bash
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "currentPrice": 12000000,
  "minPrice": 11000000,
  "costPrice": 10000000,
  "stockQuantity": 10,
  "autoPriceAdjustment": true,
  "autoAdjustmentMargin": 100,
  "isActive": true
}
```

### Mahsulotni Raqobatchiga Bog'lash

```bash
POST http://localhost:3000/api/competitors/1/link-product
Content-Type: application/json

{
  "productId": 1,
  "competitorUrl": "https://uzum.uz/ru/product/iphone-15-pro"
}
```

## 5. Scraping Ishga Tushirish

```bash
POST http://localhost:3000/api/scraping/schedule
```

Bu barcha raqobatchilar uchun scraping joblarini ishga tushiradi.

## 6. Narxlarni Tekshirish

```bash
POST http://localhost:3000/api/price/check-all
```

Bu barcha mahsulotlar uchun narxlarni tekshirib, kerak bo'lsa avtomatik o'zgartiradi.

## 7. WebSocket orqali Real-time Monitoring

```javascript
// Frontend yoki Node.js client
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// Narx yangilanishlariga obuna bo'lish
socket.emit('subscribe:price-updates', { productId: 1 });

// Narx o'zgarishlarini eshitish
socket.on('price-update', (data) => {
  console.log('Narx o\'zgardi:', data);
});

// Xabarnomalarni eshitish
socket.on('notification', (data) => {
  console.log('Yangi xabarnoma:', data);
});
```

## 8. Avtomatik Cron Jobs

Cron joblar avtomatik ishlaydi:
- **Har 15 minutda**: Scraping joblarini ishga tushiradi
- **Har 20 minutda**: Narxlarni tekshirib, optimallashtirish
- **Har kuni 9:00**: Kunlik statistika
- **Har hafta yakshanba 23:59**: Haftalik hisobot

## 9. Dashboard Statistikasi

```bash
GET http://localhost:3000/api/analytics/dashboard
```

## 10. Hisobotlar Olish

```bash
# Haftalik hisobot
GET http://localhost:3000/api/reports/weekly

# Oylik hisobot
GET http://localhost:3000/api/reports/monthly

# Custom hisobot
GET http://localhost:3000/api/reports/custom?startDate=2024-01-01&endDate=2024-01-31&format=excel
```

## Foydali Maslahatlar

1. **Scraping tezligi**: `SCRAPING_DELAY_MS` o'rtasida kechikish qo'shing (saytlar blok qilmasligi uchun)
2. **Avtomatik narx**: `autoPriceAdjustment` va `minPrice` sozlamalarini to'g'ri belgilang
3. **Proksi**: Agar saytlar blok qilayotgan bo'lsa, `PROXY_ENABLED=true` qilib proksi qo'shing
4. **Email xabarnomalar**: `NOTIFICATION_EMAIL_ENABLED=true` qilib email yuborishni yoqing

## Keyingi Qadamlar

- Admin panel frontend yaratish (React/Next.js)
- Telegram bot integratsiyasi
- SMS xabarnomalar
- Advanced analytics va grafiklar
