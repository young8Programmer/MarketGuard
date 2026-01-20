# MarketGuard - Arxitektura va Texnik Hujjat

## 🏗️ Loyiha Strukturasi

```
MarketGuard/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── app.controller.ts       # Root controller
│   ├── app.service.ts          # Root service
│   ├── config/                 # Konfiguratsiya fayllari
│   │   └── database.config.ts  # TypeORM sozlamalari
│   ├── entities/               # Database entitylar
│   │   ├── product.entity.ts
│   │   ├── competitor.entity.ts
│   │   ├── competitor-product.entity.ts
│   │   ├── price-history.entity.ts
│   │   ├── notification.entity.ts
│   │   └── scraping-log.entity.ts
│   ├── modules/                # Feature modullar
│   │   ├── product/           # Mahsulotlar boshqaruvi
│   │   ├── competitor/        # Raqobatchilar boshqaruvi
│   │   ├── scraping/          # Web scraping tizimi
│   │   │   ├── services/
│   │   │   │   ├── puppeteer.service.ts
│   │   │   │   ├── cheerio.service.ts
│   │   │   │   └── proxy.service.ts
│   │   │   └── scraping.processor.ts
│   │   ├── price/             # Narx monitoring va o'zgartirish
│   │   ├── notification/      # Xabarnomalar tizimi
│   │   ├── report/            # Hisobot yaratish
│   │   ├── analytics/         # Statistika va tahlil
│   │   ├── websocket/         # Real-time kommunikatsiya
│   │   └── cron/              # Avtomatik vazifalar
│   └── common/                # Umumiy fayllar
│       ├── dto/
│       ├── interfaces/
│       └── decorators/
├── reports/                    # Hisobotlar saqlanadi
├── package.json
├── tsconfig.json
└── README.md
```

## 📊 Database Arxitekturasi

### Entitylar va O'zaro Bog'lanish

```
Product (Mahsulot)
├── id
├── name
├── currentPrice
├── minPrice (minimal chegara)
├── costPrice (xarid narxi)
├── stockQuantity
├── autoPriceAdjustment
├── autoAdjustmentMargin
└── relations:
    ├── priceHistory[] (1:N)
    └── competitorProducts[] (1:N)

Competitor (Raqobatchi)
├── id
├── name
├── platform (uzum, olcha, amazon, ...)
├── baseUrl
├── scrapingConfig
└── relations:
    └── competitorProducts[] (1:N)

CompetitorProduct (Raqobatchi Mahsuloti)
├── id
├── productId (FK -> Product)
├── competitorId (FK -> Competitor)
├── competitorUrl
├── currentPrice
├── previousPrice
├── isAvailable
└── lastCheckedAt

PriceHistory (Narx Tarixi)
├── id
├── productId (FK -> Product)
├── price
├── previousPrice
├── changeAmount
├── changePercent
├── changeType (increase/decrease/stable)
├── isAutoAdjusted
└── createdAt

Notification (Xabarnomalar)
├── id
├── type (price_change, competitor_price_drop, ...)
├── productId (FK -> Product, nullable)
├── competitorId (FK -> Competitor, nullable)
├── title
├── message
├── status (pending/sent/read/failed)
└── metadata (JSON)

ScrapingLog (Scraping Loglari)
├── id
├── competitorId (FK -> Competitor)
├── status (pending/in_progress/success/failed)
├── url
├── productsScraped
├── productsUpdated
├── errorsCount
└── metadata (JSON)
```

## 🔄 Workflow va Data Flow

### 1. Scraping Workflow

```
Cron Job (har 15 minut)
    ↓
ScrapingService.scheduleScrapingJobs()
    ↓
BullMQ Queue ga joblar qo'shish
    ↓
ScrapingProcessor ishga tushadi
    ↓
PuppeteerService yoki CheerioService
    ↓
ScrapingLog yoziladi
    ↓
CompetitorProduct narxi yangilanadi
    ↓
WebSocket orqali real-time xabar
```

### 2. Price Adjustment Workflow

```
Cron Job (har 20 minut)
    ↓
PriceService.checkAndAdjustPrices()
    ↓
Har bir product uchun:
    ├── Eng arzon competitor price topiladi
    ├── Price difference hisoblanadi
    ├── Notification yaratiladi
    └── Agar autoPriceAdjustment = true:
        ├── Recommended price hisoblanadi
        ├── Min price tekshiriladi
        └── Price o'zgartiriladi
            ↓
        PriceHistory yoziladi
        ↓
        WebSocket xabari
        ↓
        Notification yuboriladi
```

### 3. Notification Flow

```
Event (Price change, scraping error, ...)
    ↓
NotificationService.createNotification()
    ↓
Database ga yoziladi
    ↓
Email yuboriladi (agar enabled)
    ↓
WebSocket orqali real-time xabar
```

## 🔧 Texnologiyalar

### Backend Stack

- **NestJS 10** - Framework
- **TypeScript** - Programming language
- **TypeORM** - ORM
- **MySQL 8** - Database
- **Redis** - Cache va Queue
- **BullMQ** - Queue management
- **Puppeteer** - Browser automation (JS render kerak bo'lgan saytlar uchun)
- **Cheerio** - HTML parsing (tez scraping)
- **Socket.IO** - WebSocket
- **ExcelJS** - Excel fayl yaratish
- **PDFKit** - PDF fayl yaratish
- **Nodemailer** - Email yuborish

### Patterns va Best Practices

1. **Module-based Architecture** - Har bir feature alohida modul
2. **Repository Pattern** - TypeORM repositories
3. **Queue Pattern** - BullMQ orqali async processing
4. **Event-Driven** - WebSocket orqali real-time events
5. **Cron Jobs** - Avtomatik vazifalar
6. **Dependency Injection** - NestJS DI container
7. **DTO Pattern** - Data validation

## 🔐 Xavfsizlik

- Helmet.js - HTTP headers security
- CORS sozlamalari
- Input validation (class-validator)
- Environment variables
- SQL injection protection (TypeORM prepared statements)

## 📈 Scalability

1. **Queue System**: BullMQ orqali yuk taqsimlash
2. **Connection Pooling**: TypeORM connection pool
3. **Caching**: Redis cache (keyingi versiyada)
4. **Horizontal Scaling**: Stateless API, Redis orqali queue sharing
5. **Proxy Rotation**: Scraping uchun proxy rotatsiyasi

## 🚀 Performance Optimizations

1. **Puppeteer Browser Reuse**: Browser bir necha request uchun ishlatiladi
2. **Delay Management**: Scraping o'rtasida kechikish (rate limiting)
3. **Batch Processing**: BullMQ orqali parallel processing
4. **Database Indexing**: Frequently queried fields indexed
5. **Selective Loading**: Faqat kerakli relations yuklanadi

## 🔮 Keyingi Rivojlantirishlar

1. **Admin Panel Frontend** - React/Next.js dashboard
2. **Telegram Bot** - Xabarnomalar uchun
3. **SMS Integration** - SMS xabarnomalar
4. **Advanced Analytics** - Machine learning orqali narx bashoratlari
5. **Multi-tenant Support** - Bir nechta foydalanuvchi qo'llab-quvvatlash
6. **API Authentication** - JWT authentication
7. **Rate Limiting** - API rate limiting
8. **Caching Layer** - Redis caching
9. **Monitoring** - Prometheus, Grafana integratsiyasi
10. **Logging** - Winston orqali structured logging

## 📝 API Endpoints Summary

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Competitors
- `GET /api/competitors` - List all competitors
- `POST /api/competitors` - Create competitor
- `POST /api/competitors/:id/link-product` - Link product to competitor

### Price
- `POST /api/price/check-all` - Check all prices
- `POST /api/price/adjust/:productId` - Adjust product price
- `GET /api/price/history/:productId` - Get price history

### Scraping
- `POST /api/scraping/schedule` - Schedule scraping jobs

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/products/:id/price-changes` - Price changes
- `GET /api/analytics/products/:id/competitors` - Competitor comparison

### Reports
- `GET /api/reports/weekly` - Weekly report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/custom` - Custom report

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/:id/read` - Mark as read

## 🌐 WebSocket Events

### Client -> Server
- `subscribe:price-updates` - Subscribe to price updates

### Server -> Client
- `price-update` - Price changed
- `notification` - New notification
- `scraping-status` - Scraping status update
