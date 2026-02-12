# Production Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create staticfiles directory
RUN mkdir -p /app/staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput --clear

# Cloud Run provides $PORT (default 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Run migrations, create cache table, and start server
CMD sh -c "python manage.py migrate --noinput && \
    python manage.py createcachetable --database default 2>/dev/null; \
    gunicorn bookofmonth_backend.wsgi:application \
        --bind 0.0.0.0:${PORT} \
        --workers 2 \
        --threads 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -"
