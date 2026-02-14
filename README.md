# Book of the Month

A children's educational platform that delivers daily age-appropriate news stories, compiles them into monthly books, and gamifies reading with streaks, quizzes, and achievements. Designed for kids ages 4-12 across three reading levels.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 6 + Django REST Framework |
| Frontend | React Native (iOS, Android, Web via react-native-web) |
| Database | PostgreSQL (Neon in production), SQLite for local dev |
| Task Queue | Django Q2 (PostgreSQL-backed) |
| AI | Google Gemini API for content processing |
| Hosting | GCP Cloud Run (API) + Firebase Hosting (frontend) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana, Sentry |

## Project Structure

```
bookofmonth/
├── bookofmonth_backend/     # Django project settings, URLs, WSGI
├── content_pipeline/        # News ingestion & AI processing (DDD)
├── book_assembly/           # Monthly book generation (DDD)
├── users/                   # Auth, child profiles, streaks, achievements
├── quizzes/                 # Quiz system tied to monthly books
├── frontend/                # React Native app
│   ├── src/screens/         # App screens (Home, Login, Quiz, etc.)
│   ├── src/services/        # API & auth service clients
│   ├── src/context/         # React Context (AuthContext)
│   ├── src/components/      # Shared components (BottomNavBar, ErrorBoundary)
│   └── src/theme/           # Colors, spacing, typography tokens
├── tests/                   # Backend pytest test suite
├── infra/                   # GCP deployment scripts
├── monitoring/              # Prometheus config & alert rules
├── loadtests/               # Locust performance tests
├── docs/                    # Backup/DR documentation
├── .github/workflows/       # CI and deploy pipelines
├── Dockerfile               # Production container
├── docker-compose.yml       # Local/staging orchestration
└── firebase.json            # Frontend hosting config
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+ (22 recommended)
- PostgreSQL (or use SQLite for local dev)

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # then edit with your keys
# Required: DJANGO_SECRET_KEY, NEWS_API_KEY, GEMINI_API_KEY

# Run migrations
python manage.py migrate
python manage.py createcachetable

# Create a superuser
python manage.py createsuperuser

# Start the dev server
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/`.

### Frontend

```bash
cd frontend
npm install

# Web
npm run web

# iOS (requires macOS + Xcode)
bundle install && bundle exec pod install
npm run ios

# Android
npm run android
```

### Running with Docker

```bash
docker-compose up
```

This starts the Django app, Django Q2 worker, and Nginx reverse proxy.

## Running Tests

### Backend

```bash
pytest --cov
```

### Frontend

```bash
cd frontend
npm test
```

## API

Full API documentation is available at:
- **Swagger UI**: `/swagger/` (dev only)
- **ReDoc**: `/redoc/` (dev only)
- **Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Key endpoints:
- `POST /api/users/login/` — Token authentication
- `GET /api/content/news-events/` — Daily news stories (public)
- `GET /api/assembly/monthly-books/` — Monthly book compilations
- `POST /api/quizzes/{id}/submit/` — Submit quiz answers
- `GET /api/users/streaks/` — Reading streak data
- `GET /api/users/achievements/` — User achievements

## Scheduled Jobs

| Job | Frequency | Description |
|-----|-----------|-------------|
| `process-daily-content` | Daily | Fetches and processes news via AI |
| `send-reading-reminder` | Daily | Email reminders to readers |
| `generate-monthly-book` | Monthly | Compiles stories into a book + quiz |
| `cleanup-old-sessions` | Daily | Removes expired sessions |

## Deployment

Production deploys via GitHub Actions to:
- **API**: GCP Cloud Run (europe-west2)
- **Frontend**: Firebase Hosting (`bookofmonth.web.app`)

See `infra/deploy.sh` for the full deployment script.

## License

Private — all rights reserved.
