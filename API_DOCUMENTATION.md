# API Documentation

## Book of the Month API v1

This API provides access to age-appropriate news content, reading progress tracking, achievements, quizzes, and user management for the Book of the Month platform.

### Base URL
- Development: `http://localhost:8000/api`
- Production: `https://api.bookofmonth.com/api`

### Authentication

Most endpoints require Token-based authentication. Include the token in the Authorization header:

```
Authorization: Token your-api-token-here
```

#### Get Token
1. Register a new account via `POST /auth/register/`
2. Login with your credentials via `POST /auth/login/`
3. Use the returned token in subsequent requests

### API Response Format

All API responses follow a consistent format:

#### Success Response
```json
{
    "success": true,
    "data": {...},
    "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
    "success": false,
    "error": {
        "message": "Error description",
        "code": "ERROR_CODE",
        "details": {...}
    }
}
```

### Rate Limiting
- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour

### Pagination

List endpoints support pagination:

```json
{
    "success": true,
    "data": [...],
    "pagination": {
        "count": 150,
        "next": "https://api.example.com/items/?page=3",
        "previous": "https://api.example.com/items/?page=1",
        "page_size": 20
    }
}
```

## Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|--------------|
| POST | `/auth/register/` | Register new user | No |
| POST | `/auth/login/` | User login | No |
| POST | `/auth/logout/` | User logout | Yes |

#### Register (POST /auth/register/)
```json
{
    "username": "string",
    "email": "string",
    "password": "string (min 8 chars)"
}
```

#### Login (POST /auth/login/)
```json
{
    "username": "string",
    "password": "string"
}
```

### User Management
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/users/me/` | Get current user profile |
| PATCH | `/users/me/` | Update current user profile |
| GET | `/users/` | List users (admin only) |

### Content Pipeline
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|--------------|
| GET | `/news/` | List news events | No |
| GET | `/news/{id}/` | Get specific news event | No |

### Reading Progress
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/progress/` | Get reading progress |
| POST | `/progress/` | Create/update reading progress |
| GET | `/progress/{id}/` | Get specific progress |
| PATCH | `/progress/{id}/` | Update progress |

#### Progress Data
```json
{
    "news_event": "uuid",
    "completed": "boolean"
}
```

### Bookmarks
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/bookmarks/` | List bookmarks |
| POST | `/bookmarks/` | Create bookmark |
| GET | `/bookmarks/{id}/` | Get specific bookmark |
| DELETE | `/bookmarks/{id}/` | Delete bookmark |

#### Bookmark Data
```json
{
    "news_event": "uuid"
}
```

### Child Profiles
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/children/` | List child profiles |
| POST | `/children/` | Create child profile |
| GET | `/children/{id}/` | Get specific child profile |
| PATCH | `/children/{id}/` | Update child profile |
| DELETE | `/children/{id}/` | Delete child profile |

#### Child Profile Data
```json
{
    "name": "string",
    "age": "integer",
    "reading_level": "AGE_4_6|AGE_7_9|AGE_10_12"
}
```

### Reading Streaks
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/streaks/` | Get reading streak |
| POST | `/streaks/update/` | Update reading streak |
| POST | `/streaks/mark-content-complete/` | Mark content as complete |

#### Mark Content Complete
```json
{
    "news_event_id": "uuid"
}
```

### Achievements
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/achievements/` | List all available achievements |
| GET | `/my-achievements/` | Get user's achievements |

#### Achievement Data
```json
{
    "name": "string",
    "description": "string",
    "image_url": "string",
    "achieved_at": "datetime"
}
```

### Quizzes
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|--------------|
| GET | `/quizzes/` | List quizzes | No |
| GET | `/quizzes/{id}/` | Get specific quiz | No |
| GET | `/questions/` | List quiz questions | No |
| GET | `/questions/{id}/` | Get specific question | No |

#### Quiz Data
```json
{
    "id": "uuid",
    "monthly_book": "uuid",
    "title": "string",
    "questions": [...],
    "created_at": "datetime"
}
```

#### Question Data
```json
{
    "id": "uuid",
    "quiz": "uuid",
    "text": "string",
    "options": ["string1", "string2", "string3", "string4"],
    "correct_answer": "string"
}
```

### Quiz Submissions
| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/quiz-submissions/` | List user's quiz submissions |
| POST | `/quiz-submissions/` | Submit quiz answers |
| GET | `/quiz-submissions/by-quiz/?quiz_id={uuid}` | Get submission for specific quiz |

#### Submit Quiz Answers
```json
{
    "quiz": "uuid",
    "answers": [
        {
            "question": "uuid",
            "selected_answer": "string"
        }
    ]
}
```

#### Submission Result
```json
{
    "id": "uuid",
    "quiz": "uuid",
    "score": "integer",
    "total_questions": "integer",
    "completed_at": "datetime",
    "answers": [
        {
            "question": "uuid",
            "selected_answer": "string",
            "is_correct": "boolean"
        }
    ]
}
```

## Error Codes

| Code | Description |
|-------|-------------|
| VALIDATION_ERROR | Input validation failed |
| AUTHENTICATION_FAILED | Invalid credentials |
| PERMISSION_DENIED | Access denied |
| NOT_FOUND | Resource not found |
| RATE_LIMIT_EXCEEDED | Too many requests |
| MISSING_FIELDS | Required fields missing |
| INTERNAL_SERVER_ERROR | Server error |

## Development & Testing

### Running Locally
1. Install dependencies: `pip install -r requirements.txt`
2. Run migrations: `python manage.py migrate`
3. Start server: `python manage.py runserver`
4. API available at: `http://localhost:8000/api`

### Testing
- Unit tests: `python manage.py test tests.test_users`
- API tests: `python manage.py test tests.test_quizzes`
- All tests: `python manage.py test tests`

## Deployment

### Environment Variables
See `.env.production` for required environment variables:
- `SECRET_KEY`: Django secret key
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CORS_ALLOWED_ORIGINS`: Allowed frontend origins

### Docker Deployment
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop services
docker-compose down
```

## Support

For API support and questions:
- Email: support@bookofmonth.com
- Documentation: https://docs.bookofmonth.com
- Status: https://status.bookofmonth.com