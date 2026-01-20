# Docker Setup

MarketGuard loyihasini Docker orqali ishga tushirish uchun quyidagi qadamlarni bajaring:

## Docker Compose

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: marketguard
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USERNAME: root
      DB_PASSWORD: rootpassword
      DB_DATABASE: marketguard
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - mysql
      - redis
    volumes:
      - ./reports:/app/reports

volumes:
  mysql_data:
  redis_data:
```

## Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```
