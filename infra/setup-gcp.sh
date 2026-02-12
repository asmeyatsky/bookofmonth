#!/usr/bin/env bash
# One-time GCP setup for bookofmonth staging environment
# Run this once to provision all GCP resources.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Firebase CLI installed (npm i -g firebase-tools)
#   - GCP project "bookofmonth" already created
#
# Usage: bash infra/setup-gcp.sh

set -euo pipefail

PROJECT_ID="bookofmonth"
REGION="europe-west2"
REPO_NAME="bookofmonth"
SERVICE_ACCOUNT="bookofmonth-api"
SA_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "==> Setting project to ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

# ── Enable APIs ──────────────────────────────────────────────────────────────
echo "==> Enabling GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudscheduler.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com

# ── Artifact Registry ───────────────────────────────────────────────────────
echo "==> Creating Artifact Registry repository..."
gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Book of Month Docker images" \
    2>/dev/null || echo "   (repository already exists)"

# ── Service Account ─────────────────────────────────────────────────────────
echo "==> Creating service account..."
gcloud iam service-accounts create "${SERVICE_ACCOUNT}" \
    --display-name="Book of Month API" \
    2>/dev/null || echo "   (service account already exists)"

# Grant necessary roles
echo "==> Granting IAM roles..."
for ROLE in \
    roles/secretmanager.secretAccessor \
    roles/run.invoker \
    roles/logging.logWriter \
    roles/cloudtrace.agent; do
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="${ROLE}" \
        --quiet
done

# ── Secret Manager ──────────────────────────────────────────────────────────
echo "==> Creating secrets (you'll need to set values separately)..."
SECRETS=(
    "DATABASE_URL"
    "DJANGO_SECRET_KEY"
    "NEWS_API_KEY"
    "GEMINI_API_KEY"
    "BRAVE_API_KEY"
    "SENTRY_DSN"
    "EMAIL_HOST_PASSWORD"
)

for SECRET in "${SECRETS[@]}"; do
    gcloud secrets create "${SECRET}" \
        --replication-policy="automatic" \
        2>/dev/null || echo "   Secret '${SECRET}' already exists"

    # Grant access to service account
    gcloud secrets add-iam-policy-binding "${SECRET}" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
done

echo ""
echo "   Set secret values with:"
echo "   echo -n 'value' | gcloud secrets versions add SECRET_NAME --data-file=-"
echo ""

# ── Cloud Run Jobs (scheduled tasks) ────────────────────────────────────────
echo "==> Creating Cloud Run Jobs..."
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/api:latest"

declare -A JOBS=(
    ["process-daily-content"]="users.tasks.process_daily_content"
    ["send-reading-reminder"]="users.tasks.send_reading_reminder"
    ["cleanup-old-sessions"]="users.tasks.cleanup_old_sessions"
    ["generate-monthly-book"]="users.tasks.generate_monthly_book"
)

for JOB_NAME in "${!JOBS[@]}"; do
    TASK_PATH="${JOBS[$JOB_NAME]}"
    echo "   Creating job: ${JOB_NAME} -> ${TASK_PATH}"

    gcloud run jobs create "${JOB_NAME}" \
        --image="${IMAGE}" \
        --region="${REGION}" \
        --service-account="${SA_EMAIL}" \
        --memory="256Mi" \
        --cpu=1 \
        --max-retries=1 \
        --task-timeout="300s" \
        --set-secrets="DATABASE_URL=DATABASE_URL:latest,DJANGO_SECRET_KEY=DJANGO_SECRET_KEY:latest" \
        --set-env-vars="ENVIRONMENT=production,DJANGO_ALLOWED_HOSTS=*" \
        --command="python" \
        --args="manage.py,run_task,${TASK_PATH}" \
        2>/dev/null || echo "   (job '${JOB_NAME}' already exists - will update on deploy)"
done

# ── Cloud Scheduler ─────────────────────────────────────────────────────────
echo "==> Creating Cloud Scheduler triggers..."

# Get the project number for the invoker SA
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")

declare -A SCHEDULES=(
    ["process-daily-content"]="0 6 * * *"
    ["send-reading-reminder"]="0 18 * * *"
    ["cleanup-old-sessions"]="0 3 * * 0"
    ["generate-monthly-book"]="0 0 1 * *"
)

declare -A DESCRIPTIONS=(
    ["process-daily-content"]="Process daily content at 6 AM UTC"
    ["send-reading-reminder"]="Send reading reminders at 6 PM UTC"
    ["cleanup-old-sessions"]="Clean up old sessions on Sundays at 3 AM UTC"
    ["generate-monthly-book"]="Generate monthly book on the 1st at midnight UTC"
)

for JOB_NAME in "${!SCHEDULES[@]}"; do
    SCHEDULE="${SCHEDULES[$JOB_NAME]}"
    DESC="${DESCRIPTIONS[$JOB_NAME]}"
    echo "   Creating scheduler: ${JOB_NAME} (${SCHEDULE})"

    gcloud scheduler jobs create http "trigger-${JOB_NAME}" \
        --location="${REGION}" \
        --schedule="${SCHEDULE}" \
        --time-zone="UTC" \
        --description="${DESC}" \
        --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/${JOB_NAME}:run" \
        --http-method=POST \
        --oauth-service-account-email="${SA_EMAIL}" \
        2>/dev/null || echo "   (scheduler '${JOB_NAME}' already exists)"
done

# ── Firebase Hosting ────────────────────────────────────────────────────────
echo "==> Initializing Firebase Hosting..."
echo "   Run: firebase init hosting --project=${PROJECT_ID}"
echo "   (Select 'frontend/dist' as public directory, configure as SPA)"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Set secret values:  echo -n 'value' | gcloud secrets versions add DATABASE_URL --data-file=-"
echo "  2. Build & push image: bash infra/deploy.sh"
echo "  3. Init Firebase:      firebase init hosting --project=${PROJECT_ID}"
