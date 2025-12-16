# Book of the Month - Next Steps

This document outlines the remaining tasks to complete and deploy the application.

---

## Immediate Setup (Required to Run)

### 1. Install Backend Dependencies
```bash
cd /Users/allansmeyatsky/bookofmonth
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Edit `.env` file with your actual API keys:
```env
DJANGO_SECRET_KEY=<generate-a-secure-key>
NEWS_API_KEY=<your-newsapi-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

To generate a secure Django secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Run Database Migrations
```bash
python manage.py migrate
```

### 4. Create Admin User
```bash
python manage.py createsuperuser
```

### 5. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 6. Run the Application
```bash
# Terminal 1 - Backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm start
```

---

## Missing Features to Implement

### Authentication & Users
- [ ] Email verification on registration
- [ ] Password reset functionality
- [ ] Social login (Google, Apple)
- [ ] User profile editing in frontend

### Content Pipeline
- [ ] Implement actual news ingestion (currently stub)
- [ ] Set up scheduled task for daily content fetching (Celery/cron)
- [ ] Image generation for articles
- [ ] Content moderation workflow

### Child Profiles
- [ ] Reading level auto-adjustment based on progress
- [ ] Per-child content filtering
- [ ] Avatar/profile picture upload

### Reading Features
- [ ] Reading streak auto-calculation on backend
- [ ] Achievement awarding logic
- [ ] Quiz completion tracking
- [ ] Reading time tracking

### Parent Dashboard
- [ ] Notification preferences management
- [ ] Subscription/billing integration
- [ ] Privacy controls
- [ ] Content restriction settings

### Quizzes
- [ ] Quiz answer submission endpoint
- [ ] Score calculation
- [ ] Quiz result history

---

## Production Deployment Checklist

### Security
- [ ] Generate new `DJANGO_SECRET_KEY`
- [ ] Set `DJANGO_DEBUG=False`
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Set up HTTPS/SSL certificates
- [ ] Enable HSTS headers
- [ ] Configure CSRF trusted origins
- [ ] Set secure cookie settings

### Database
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Set up database backups
- [ ] Configure connection pooling

### Infrastructure
- [ ] Set up Redis for caching (currently configured but not running)
- [ ] Configure Celery for background tasks
- [ ] Set up logging and monitoring
- [ ] Configure error tracking (Sentry)

### Frontend
- [ ] Build production React Native app
- [ ] Configure app signing (iOS/Android)
- [ ] Submit to App Store / Play Store
- [ ] Set up push notification certificates

### API Keys
- [ ] Get production NewsAPI key
- [ ] Get production Gemini API key
- [ ] Configure Firebase for push notifications

---

## Environment Configuration

### Development (.env)
```env
DJANGO_SECRET_KEY=your-dev-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://127.0.0.1:6379/1
NEWS_API_KEY=your-dev-key
GEMINI_API_KEY=your-dev-key
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

### Production (.env.production)
```env
DJANGO_SECRET_KEY=<secure-production-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
DATABASE_URL=postgres://user:pass@host:5432/bookofmonth
REDIS_URL=redis://:password@redis-host:6379/1
NEWS_API_KEY=<production-key>
GEMINI_API_KEY=<production-key>
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

---

## API Endpoints Reference

### Authentication (No auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register/` | Register new user |
| POST | `/api/users/login/` | Login, returns token |
| POST | `/api/users/logout/` | Logout (auth required) |

### Users (Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/users/me/` | Get current user |
| PATCH | `/api/users/users/me/` | Update current user |

### Content (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content/news-events/` | List news events |
| GET | `/api/assembly/monthly-books/` | List monthly books |
| GET | `/api/quizzes/quizzes/` | List quizzes |

### User Data (Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/users/bookmarks/` | User bookmarks |
| GET/POST | `/api/users/reading-progress/` | Reading progress |
| GET/POST | `/api/users/child-profiles/` | Child profiles |
| GET | `/api/users/reading-streaks/` | Reading streaks |
| GET | `/api/users/achievements/` | All achievements |
| GET | `/api/users/user-achievements/` | User's achievements |

---

## Testing

### Backend Tests
```bash
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## Support & Resources

- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [React Native Docs](https://reactnative.dev/)
- [NewsAPI Documentation](https://newsapi.org/docs)
- [Google Gemini API](https://ai.google.dev/)
