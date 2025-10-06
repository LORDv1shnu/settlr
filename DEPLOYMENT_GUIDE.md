# Settlr - Cloud Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Heroku (Easiest)
### Option 2: Railway (Modern & Free)
### Option 3: AWS (Most Scalable)
### Option 4: Docker + Any Cloud

---

## ☁️ Option 1: Heroku Deployment

### Prerequisites
```bash
# Install Heroku CLI
https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login
```

### Backend Deployment

```bash
cd backend

# Create Heroku app
heroku create settlr-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Get database credentials (automatically set as DATABASE_URL)
heroku config:get DATABASE_URL

# Deploy
git init
heroku git:remote -a settlr-backend
git add .
git commit -m "Initial commit"
git push heroku main

# Set environment variables
heroku config:set CORS_ORIGINS=https://your-frontend-url.herokuapp.com

# Open app
heroku open
```

### Frontend Deployment

```bash
cd frontend

# Update API_BASE in all components
# Change: const API_BASE = 'http://localhost:8080/api';
# To: const API_BASE = 'https://settlr-backend.herokuapp.com/api';

# Create Heroku app
heroku create settlr-frontend

# Add buildpack
heroku buildpacks:set mars/create-react-app

# Deploy
git init
heroku git:remote -a settlr-frontend
git add .
git commit -m "Initial commit"
git push heroku main

# Open app
heroku open
```

### Update CORS
```bash
# Update backend CORS with frontend URL
heroku config:set CORS_ORIGINS=https://settlr-frontend.herokuapp.com -a settlr-backend
heroku restart -a settlr-backend
```

---

## 🚂 Option 2: Railway Deployment

### Prerequisites
- Create account at https://railway.app
- Install Railway CLI: `npm install -g @railway/cli`

### Backend Deployment

```bash
cd backend

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up

# Get backend URL
railway domain

# Set CORS
railway variables set CORS_ORIGINS=https://your-frontend-url
```

### Frontend Deployment

```bash
cd frontend

# Update API_BASE to Railway backend URL
# Edit all component files

# Create new Railway project
railway init

# Deploy
railway up

# Get frontend URL
railway domain
```

---

## ☁️ Option 3: AWS Deployment

### Backend (Elastic Beanstalk + RDS)

```bash
cd backend

# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p java-17 settlr-backend

# Create RDS database
# Go to AWS Console > RDS > Create Database
# Choose PostgreSQL
# Note down endpoint, username, password

# Create environment with database
eb create settlr-backend-env --database

# Set environment variables
eb setenv DATABASE_URL=jdbc:postgresql://<rds-endpoint>:5432/settlr_db
eb setenv DATABASE_USERNAME=<username>
eb setenv DATABASE_PASSWORD=<password>
eb setenv CORS_ORIGINS=http://<frontend-s3-bucket>.s3-website-us-east-1.amazonaws.com

# Deploy
eb deploy

# Get URL
eb status
```

### Frontend (S3 + CloudFront)

```bash
cd frontend

# Update API_BASE to EB backend URL
npm run build

# Upload to S3
aws s3 sync build/ s3://settlr-frontend --acl public-read

# Enable static website hosting
aws s3 website s3://settlr-frontend --index-document index.html

# Get URL
http://settlr-frontend.s3-website-us-east-1.amazonaws.com
```

---

## 🐳 Option 4: Docker Deployment

### Create Dockerfiles

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Frontend nginx.conf:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: settlr_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: jdbc:postgresql://database:5432/settlr_db
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: ${DB_PASSWORD}
      CORS_ORIGINS: http://localhost:3000
    ports:
      - "8080:8080"
    depends_on:
      database:
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres-data:
```

### Deploy with Docker

```bash
# Set environment variable
export DB_PASSWORD=your_secure_password

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Deploy to any cloud that supports Docker:
# - AWS ECS
# - Google Cloud Run
# - Azure Container Instances
# - DigitalOcean Apps
```

---

## 🔧 Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 8080 | No |
| `DATABASE_URL` | PostgreSQL connection URL | localhost | Yes |
| `DATABASE_USERNAME` | Database username | postgres | Yes |
| `DATABASE_PASSWORD` | Database password | root | Yes |
| `CORS_ORIGINS` | Allowed frontend URLs | localhost:3000 | Yes |
| `DDL_AUTO` | Hibernate DDL mode | update | No |
| `SHOW_SQL` | Show SQL logs | false | No |
| `LOG_LEVEL` | Application log level | INFO | No |
| `DB_POOL_SIZE` | Max DB connections | 10 | No |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_BASE` | Backend API URL | http://localhost:8080/api | Yes |

---

## 📝 Pre-Deployment Checklist

### Backend
- [ ] Update `application-production.properties`
- [ ] Set all environment variables
- [ ] Test database connection
- [ ] Verify CORS configuration
- [ ] Enable HTTPS
- [ ] Test all API endpoints
- [ ] Set up database backups

### Frontend
- [ ] Update `API_BASE` to production URL
- [ ] Test with production backend
- [ ] Enable production build optimizations
- [ ] Configure CDN for static assets
- [ ] Set up error tracking (Sentry)
- [ ] Test on multiple browsers

### Database
- [ ] Create production database
- [ ] Set strong password
- [ ] Enable automated backups
- [ ] Configure connection pooling
- [ ] Set up monitoring
- [ ] Plan scaling strategy

### Security
- [ ] Use HTTPS everywhere
- [ ] Rotate database credentials
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Configure CORS properly
- [ ] Review exposed endpoints

---

## 🔍 Testing Production Deployment

```bash
# Test backend health
curl https://your-backend-url/api/users

# Test frontend loads
curl https://your-frontend-url

# Test full flow:
# 1. Sign up new user
# 2. Create group
# 3. Add expense
# 4. Record settlement
# 5. Restart backend
# 6. Verify data persists ✅
```

---

## 📊 Monitoring & Maintenance

### Recommended Tools

**Backend Monitoring:**
- **New Relic** - Application performance monitoring
- **Datadog** - Infrastructure monitoring
- **Sentry** - Error tracking
- **Loggly** - Log aggregation

**Database Monitoring:**
- **pgAdmin** - PostgreSQL management
- **DataGrip** - Database IDE
- **AWS RDS Console** - If using AWS

**Frontend Monitoring:**
- **Google Analytics** - User analytics
- **LogRocket** - Session replay
- **Sentry** - Error tracking

### Health Checks

```bash
# Backend health endpoint (add this to BackendApplication.java)
@GetMapping("/health")
public ResponseEntity<Map<String, String>> health() {
    Map<String, String> health = new HashMap<>();
    health.put("status", "UP");
    health.put("timestamp", LocalDateTime.now().toString());
    return ResponseEntity.ok(health);
}
```

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check logs
heroku logs --tail -a settlr-backend

# Common issues:
# 1. Database URL format incorrect
# 2. Port conflict
# 3. Missing environment variables
# 4. Database not accessible
```

### Frontend can't connect to backend
```bash
# Check CORS configuration
# Check API_BASE URL
# Check network tab in browser DevTools
# Verify backend is running
```

### Database connection errors
```bash
# Verify database is running
# Check connection string format
# Verify username/password
# Check firewall rules
# Verify SSL mode if required
```

---

## 💰 Cost Estimates

### Heroku
- **Hobby tier:** $7/month (backend) + $7/month (frontend) + $5/month (PostgreSQL) = **$19/month**
- **Production tier:** $25/month + $25/month + $9/month = **$59/month**

### Railway
- **Free tier:** $0/month with limits
- **Paid tier:** ~$10-20/month depending on usage

### AWS
- **EC2 t2.micro:** $8.50/month
- **RDS db.t2.micro:** $12.60/month
- **S3 + CloudFront:** ~$1-5/month
- **Total:** ~$22-26/month

### DigitalOcean
- **Droplet:** $6/month
- **Managed PostgreSQL:** $15/month
- **Total:** ~$21/month

---

## 🎯 Recommended Deployment Path

**For Development/Testing:**
→ **Railway** (Free tier, easy setup)

**For MVP/Small Scale:**
→ **Heroku** (Easiest, good developer experience)

**For Production/Scale:**
→ **AWS** (Most flexible, better pricing at scale)

**For Full Control:**
→ **Docker + DigitalOcean** (Best value, full control)

---

## 📚 Additional Resources

- [Spring Boot Deployment Guide](https://spring.io/guides/gs/spring-boot-docker/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [PostgreSQL Production Checklist](https://www.postgresql.org/docs/current/runtime-config.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Last Updated:** October 6, 2025  
**Status:** Ready for production deployment ✅
