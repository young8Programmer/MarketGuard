# 🛡️ MarketGuard - Avtomatlashtirilgan Narx Monitoringi va Arbitraj Platformasi

Professional darajadagi NestJS orqali yaratilgan to'liq funksional narx monitoring va avtomatik narx optimallashtirish tizimi.

## ✨ Xususiyatlar

### 🎯 Asosiy Funksiyalar

- **Multi-Platform Scraper**: Uzum, Olcha, Amazon va boshqa saytlardan narxlarni real vaqtda yig'ish
- **Price War Logic**: Raqobatchilar narxini tushirganda darhol xabar berish
- **Automatic Pricing**: Minimal chegara bilan avtomatik narx o'zgartirish
- **Inventory Analytics**: Ombordagi tovarlar va sotuvlar dinamikasini tahlil qilish
- **Professional Reports**: Haftalik/oylik Excel va PDF hisobotlar

### 🛠 Texnik Xususiyatlar

- ✅ **NestJS** - Modern, scalable Node.js framework
- ✅ **TypeORM** - Database ORM (MySQL)
- ✅ **BullMQ** - Queue system (Redis bilan)
- ✅ **Puppeteer/Cheerio** - Web scraping
- ✅ **WebSocket** - Real-time yangilanishlar
- ✅ **Cron Jobs** - Avtomatik narx tekshiruvlari
- ✅ **Proxy Support** - Scraping uchun proksi integratsiyasi
- ✅ **Email Notifications** - Xabarnomalar yuborish

## 📦 O'rnatish

### Talablar

- Node.js 18+
- MySQL 8+
- Redis 6+

### Qadamlar

1. **Repositoryni clone qiling**:
```bash
git clone <repository-url>
cd MarketGuard
```

2. **Dependencies o'rnating**:
```bash
npm install
```

3. **Environment sozlamalarini yarating**:
```bash
cp env.example .env
```

4. **.env faylini to'ldiring**:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=marketguard

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=3000
NODE_ENV=development
```

5. **Databaseni yarating**:
```bash
# MySQL terminalda
CREATE DATABASE marketguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

6. **Migrationlarni ishga tushiring** (yoki development rejimida synchronize: true):
```bash
npm run migration:run
```

7. **Serverini ishga tushiring**:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🚀 Ishlatish

### API Endpoints

#### Products
- `GET /api/products` - Barcha mahsulotlarni olish
- `GET /api/products/:id` - Bitta mahsulotni olish
- `POST /api/products` - Yangi mahsulot qo'shish
- `PUT /api/products/:id` - Mahsulotni yangilash
- `DELETE /api/products/:id` - Mahsulotni o'chirish

#### Competitors
- `GET /api/competitors` - Barcha raqobatchilarni olish
- `POST /api/competitors` - Yangi raqobatchi qo'shish
- `POST /api/competitors/:id/link-product` - Mahsulotni raqobatchiga bog'lash

#### Price Monitoring
- `POST /api/price/check-all` - Barcha narxlarni tekshirish
- `POST /api/price/adjust/:productId` - Narxni o'zgartirish
- `GET /api/price/history/:productId` - Narx tarixini olish

#### Scraping
- `POST /api/scraping/schedule` - Scraping joblarini ishga tushirish

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistikasi
- `GET /api/analytics/products/:id/price-changes` - Mahsulot narx o'zgarishlari
- `GET /api/analytics/products/:id/competitors` - Raqobatchilar taqqoslash

#### Reports
- `GET /api/reports/weekly` - Haftalik hisobot
- `GET /api/reports/monthly` - Oylik hisobot
- `GET /api/reports/custom?startDate=&endDate=&format=excel` - Custom hisobot

#### Notifications
- `GET /api/notifications` - Barcha xabarnomalar
- `POST /api/notifications/:id/read` - Xabarnomani o'qilgan deb belgilash

### WebSocket Events

```javascript
import io from 'socket.io-client';

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

// Scraping statusini eshitish
socket.on('scraping-status', (data) => {
  console.log('Scraping status:', data);
});
```

## ⚙️ Konfiguratsiya

### Scraping Sozlamalari

```env
SCRAPING_DELAY_MS=5000              # Scraping o'rtasidagi kechikish (ms)
SCRAPING_TIMEOUT_MS=30000           # Request timeout (ms)
SCRAPING_RETRY_ATTEMPTS=3           # Qayta urinishlar soni
```

### Narx Monitoring

```env
PRICE_CHECK_INTERVAL_MINUTES=15     # Narx tekshirish intervali
AUTO_PRICE_ADJUSTMENT_ENABLED=true  # Avtomatik o'zgartirish
MIN_PRICE_MARGIN_SOMS=100           # Minimal marja (so'm)
```

### Proxy Sozlamalari

```env
PROXY_ENABLED=false
PROXY_LIST=http://proxy1:port,http://proxy2:port
```

### Email Xabarnomalar

```env
NOTIFICATION_EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## 📊 Database Struktura

### Asosiy Jadvalar

- `products` - Mahsulotlar
- `competitors` - Raqobatchilar
- `competitor_products` - Raqobatchi mahsulotlari
- `price_history` - Narx tarixi
- `notifications` - Xabarnomalar
- `scraping_logs` - Scraping loglari

## 🔄 Workflow

1. **Mahsulot qo'shish**: Foydalanuvchi o'z mahsulotlarini qo'shadi
2. **Raqobatchi bog'lash**: Har bir mahsulot uchun raqobatchi saytlardagi linklarni qo'shadi
3. **Avtomatik scraping**: Cron job har 15 minutda narxlarni yig'adi
4. **Narx tahlili**: Eng arzon narxni topadi va taqqoslaydi
5. **Avtomatik o'zgartirish**: Agar kerak bo'lsa, narxni avtomatik o'zgartiradi
6. **Xabarnomalar**: Barcha o'zgarishlar haqida xabar beradi

## 🎨 Admin Panel (Keyingi Versiya)

Admin panel React/Next.js orqali yaratiladi va quyidagi funksiyalarni o'z ichiga oladi:
- Real-time dashboard
- Narx grafiklar
- Mahsulotlar boshqaruvi
- Xabarnomalar paneli
- Hisobotlar ko'rish

## 🔒 Xavfsizlik

- Helmet.js orqali HTTP headers xavfsizligi
- CORS sozlamalari
- Input validation (class-validator)
- Environment variables orqali secret keys

## 📝 Development

```bash
# Linting
npm run lint

# Formatting
npm run format

# Testing
npm run test

# E2E Testing
npm run test:e2e
```

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/AmazingFeature`)
3. Commit qiling (`git commit -m 'Add some AmazingFeature'`)
4. Push qiling (`git push origin feature/AmazingFeature`)
5. Pull Request oching

## 📄 License

MIT License

## 👥 Mualliflar

MarketGuard Team

## 📞 Support

Savollar yoki muammolar bo'lsa, issue oching yoki biz bilan bog'laning.

---

**MarketGuard** - Raqobatda oldinda bo'ling! 🚀
