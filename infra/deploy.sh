#!/usr/bin/env bash
# Deploy bookofmonth to GCP staging environment
# Builds & pushes the Docker image, deploys Cloud Run service,
# updates Cloud Run Jobs, builds frontend, and deploys Firebase Hosting.
#
# Usage: bash infra/deploy.sh [--skip-frontend] [--skip-api]

set -euo pipefail

PROJECT_ID="bookofmonth"
REGION="europe-west2"
REPO_NAME="bookofmonth"
SERVICE_NAME="bookofmonth-api"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/api"
SA_EMAIL="bookofmonth-api@${PROJECT_ID}.iam.gserviceaccount.com"

SKIP_FRONTEND=false
SKIP_API=false

for arg in "$@"; do
    case $arg in
        --skip-frontend) SKIP_FRONTEND=true ;;
        --skip-api) SKIP_API=true ;;
    esac
done

TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

# ── API Deployment ──────────────────────────────────────────────────────────
if [ "$SKIP_API" = false ]; then
    echo "==> Building Docker image (tag: ${TAG})..."
    docker build -t "${IMAGE}:${TAG}" -t "${IMAGE}:latest" .

    echo "==> Configuring Docker auth for Artifact Registry..."
    gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

    echo "==> Pushing image..."
    docker push "${IMAGE}:${TAG}"
    docker push "${IMAGE}:latest"

    echo "==> Deploying Cloud Run service..."
    gcloud run deploy "${SERVICE_NAME}" \
        --image="${IMAGE}:${TAG}" \
        --region="${REGION}" \
        --platform=managed \
        --service-account="${SA_EMAIL}" \
        --memory="256Mi" \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=2 \
        --timeout=300 \
        --cpu-boost \
        --allow-unauthenticated \
        --set-secrets="\
DATABASE_URL=DATABASE_URL:latest,\
DJANGO_SECRET_KEY=DJANGO_SECRET_KEY:latest,\
NEWS_API_KEY=NEWS_API_KEY:latest,\
GEMINI_API_KEY=GEMINI_API_KEY:latest,\
BRAVE_API_KEY=BRAVE_API_KEY:latest" \
        --set-env-vars="\
ENVIRONMENT=production,\
DJANGO_DEBUG=False,\
DJANGO_ALLOWED_HOSTS=*.run.app,\
CORS_ALLOWED_ORIGINS=https://bookofmonth.web.app,\
LOG_LEVEL=INFO"

    # Get the service URL
    SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
        --region="${REGION}" \
        --format="value(status.url)")
    echo "   API deployed at: ${SERVICE_URL}"

    echo "==> Updating Cloud Run Jobs with latest image..."
    JOBS=("process-daily-content" "send-reading-reminder" "cleanup-old-sessions" "generate-monthly-book")
    for JOB_NAME in "${JOBS[@]}"; do
        echo "   Updating job: ${JOB_NAME}"
        gcloud run jobs update "${JOB_NAME}" \
            --image="${IMAGE}:${TAG}" \
            --region="${REGION}" \
            --quiet
    done
else
    # Still need SERVICE_URL for frontend build
    SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
        --region="${REGION}" \
        --format="value(status.url)" 2>/dev/null || echo "")
    echo "==> Skipping API deployment"
fi

# ── Frontend Deployment ─────────────────────────────────────────────────────
if [ "$SKIP_FRONTEND" = false ]; then
    if [ -z "${SERVICE_URL:-}" ]; then
        echo "ERROR: Cannot build frontend without API URL. Deploy API first or set SERVICE_URL."
        exit 1
    fi

    echo "==> Building frontend..."
    cd frontend
    npm ci
    VITE_API_BASE_URL="${SERVICE_URL}/api" npm run build
    cd ..

    echo "==> Deploying to Firebase Hosting..."
    firebase deploy --only hosting --project="${PROJECT_ID}"

    echo "   Frontend deployed at: https://${PROJECT_ID}.web.app"
else
    echo "==> Skipping frontend deployment"
fi

echo ""
echo "=== Deployment complete! ==="
echo "   API:      ${SERVICE_URL:-'(not deployed)'}"
echo "   Frontend: https://${PROJECT_ID}.web.app"
echo "   Health:   ${SERVICE_URL:-''}/api/health/"
