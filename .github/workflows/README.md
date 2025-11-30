# CI/CD Pipeline Documentation

## Overview

The OrderApp+ CI/CD pipeline is built with **GitHub Actions** and provides automated building, testing, security scanning, and deployment for all microservices.

## Pipeline Architecture

```
┌─────────────┐
│   Commit    │
│  Push/PR    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│              LINT STAGE                 │
│  ✓ ESLint for code quality             │
│  ✓ Runs in parallel for all services   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         TEST & SECURITY STAGE            │
│  ✓ Unit & integration tests             │
│  ✓ Code coverage (Codecov)              │
│  ✓ Trivy vulnerability scanning         │
│  ✓ NPM audit for dependencies           │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│          BUILD STAGE                     │
│  (Only on push to main/develop)          │
│  ✓ Docker multi-stage builds            │
│  ✓ Push to GitHub Container Registry    │
│  ✓ Image vulnerability scanning          │
│  ✓ Build caching for speed              │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│   STAGING   │ │ PRODUCTION  │
│  (develop)  │ │   (main)    │
│             │ │             │
│ ✓ Deploy    │ │ ✓ Deploy    │
│ ✓ Rollout   │ │ ✓ Rollout   │
│ ✓ Smoke     │ │ ✓ Smoke     │
│   Tests     │ │   Tests     │
│             │ │ ✓ Slack     │
│             │ │   Notify    │
└─────────────┘ └─────────────┘
```

## Workflow Triggers

### Push Events
- `main`: Triggers full pipeline + production deployment
- `develop`: Triggers full pipeline + staging deployment
- `feature/**`: Triggers lint and test only
- `hotfix/**`: Triggers lint and test only

### Pull Request Events
- To `main` or `develop`: Triggers lint, test, and security scan

## Stages Breakdown

### 1. Lint Stage

**Purpose:** Ensure code quality and consistency

**Matrix Strategy:** Runs in parallel for all 5 services
- user-service
- product-service
- order-service
- payment-service
- notification-service

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Run ESLint (`npm run lint`)

**Required:** Yes (blocking)

---

### 2. Test Stage

**Purpose:** Validate functionality and measure code coverage

**Services:** All services tested in parallel

**Test Databases:**
- PostgreSQL 15 (for product-service, order-service)
- MongoDB 6.0 (for user-service, payment-service)
- Redis 7 (for notification-service)

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Spin up service containers (PostgreSQL, MongoDB, Redis)
4. Install dependencies
5. Run tests with coverage (`npm run test:coverage`)
6. Upload coverage to Codecov

**Environment Variables:**
```yaml
NODE_ENV: test
JWT_SECRET: test-jwt-secret-key
DB_HOST: localhost
DB_PORT: 5432
DB_NAME: test_db
DB_USER: test_user
DB_PASSWORD: test_pass
MONGODB_URI: mongodb://test_admin:test_pass@localhost:27017/test_db
REDIS_HOST: localhost
REDIS_PORT: 6379
```

**Required:** Yes (blocking)

---

### 3. Security Scan Stage

**Purpose:** Identify vulnerabilities in code and dependencies

**Tools:**
1. **Trivy**: Filesystem scanning for vulnerabilities
2. **NPM Audit**: Dependency security checks

**Steps:**
1. Checkout code
2. Run Trivy scan on `services/<service-name>`
3. Upload SARIF results to GitHub Security tab
4. Run `npm audit --audit-level=high`

**Output:** GitHub Security Alerts

**Required:** Yes (blocking)

---

### 4. Build Stage

**Purpose:** Create production-ready Docker images

**Trigger:** Only on push to `main` or `develop`

**Registry:** GitHub Container Registry (ghcr.io)

**Image Naming:**
```
ghcr.io/<org>/orderapp-user-service:latest
ghcr.io/<org>/orderapp-user-service:main-<sha>
ghcr.io/<org>/orderapp-product-service:latest
...
```

**Steps:**
1. Checkout code
2. Setup Docker Buildx (for multi-platform builds)
3. Login to GitHub Container Registry
4. Extract metadata (tags, labels)
5. Build and push image with layer caching
6. Scan image with Trivy
7. Upload scan results

**Build Optimizations:**
- Multi-stage Dockerfile
- GitHub Actions cache (type=gha)
- Parallel builds for all services

**Required:** Yes (blocking for deployment)

---

### 5. Deploy to Staging

**Purpose:** Deploy to staging environment for validation

**Trigger:** Push to `develop` branch

**Environment:** `staging`
- URL: https://staging.orderapp.com
- Namespace: `orderapp-staging`

**Steps:**
1. Checkout code
2. Setup kubectl 1.28
3. Configure Kubernetes context from `KUBECONFIG_STAGING` secret
4. Update image for all deployments:
   ```bash
   kubectl set image deployment/<service> \
     <service>=ghcr.io/<org>/orderapp-<service>:<sha> \
     -n orderapp-staging
   ```
5. Wait for rollout completion (5min timeout)
6. Run smoke tests:
   - Health check endpoints
   - Basic API validation

**Rollback:** Manual via `kubectl rollout undo`

---

### 6. Deploy to Production

**Purpose:** Deploy to production environment

**Trigger:** Push to `main` branch

**Environment:** `production`
- URL: https://api.orderapp.com
- Namespace: `orderapp`

**Approval:** GitHub Environment protection rules (optional)

**Steps:**
1. Checkout code
2. Setup kubectl 1.28
3. Configure Kubernetes context from `KUBECONFIG_PRODUCTION` secret
4. Update image for all deployments
5. Wait for rollout completion
6. Run smoke tests
7. Send Slack notification (success/failure)

**Notifications:**
- ✅ Success: Green notification to Slack
- ❌ Failure: Red notification with logs link

**Rollback:** 
```bash
kubectl rollout undo deployment/<service> -n orderapp
```

---

## Required Secrets

Configure these in GitHub repository settings → Secrets:

### GitHub Packages
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Kubernetes
- `KUBECONFIG_STAGING`: Base64-encoded kubeconfig for staging cluster
- `KUBECONFIG_PRODUCTION`: Base64-encoded kubeconfig for production cluster

### Notifications
- `SLACK_WEBHOOK_URL`: Slack webhook for deployment notifications

### Optional
- `CODECOV_TOKEN`: For private repository coverage uploads

---

## Setting Up Secrets

### 1. Kubernetes Config

Generate base64-encoded kubeconfig:
```bash
# For staging
cat ~/.kube/config-staging | base64 -w 0 > kubeconfig-staging.txt

# For production
cat ~/.kube/config-production | base64 -w 0 > kubeconfig-production.txt
```

Add to GitHub:
1. Go to repository → Settings → Secrets → Actions
2. Click "New repository secret"
3. Name: `KUBECONFIG_STAGING` / `KUBECONFIG_PRODUCTION`
4. Value: Contents of the base64 file

### 2. Slack Webhook

Create Slack webhook:
1. Go to https://api.slack.com/apps
2. Create new app → Incoming Webhooks
3. Activate webhooks and add to workspace
4. Copy webhook URL
5. Add to GitHub Secrets as `SLACK_WEBHOOK_URL`

---

## Branch Strategy

```
main (production)
  ↑
  │ PR + review required
  │
develop (staging)
  ↑
  │ PR from feature branches
  │
feature/feature-name
hotfix/issue-123
```

**Branch Protection Rules:**
- `main`: Require PR reviews (2+), status checks pass
- `develop`: Require status checks pass

---

## Monitoring Pipeline

### GitHub Actions Dashboard
- View all workflow runs: https://github.com/<org>/<repo>/actions
- Filter by branch, status, workflow

### Status Badges

Add to README.md:
```markdown
![CI/CD Pipeline](https://github.com/<org>/<repo>/workflows/CI%2FCD%20Pipeline/badge.svg)
```

### Codecov Dashboard
- Coverage trends: https://codecov.io/gh/<org>/<repo>
- Per-service coverage reports

### GitHub Security
- View vulnerabilities: Security tab → Code scanning alerts
- Trivy findings categorized by severity

---

## Local Testing

### Run Tests Locally

```bash
cd services/product-service
npm install
npm test
npm run test:coverage
```

### Lint Locally

```bash
npm run lint
```

### Build Docker Image Locally

```bash
cd services/product-service
docker build -t orderapp/product-service:local .
docker run -p 3002:3002 --env-file .env orderapp/product-service:local
```

### Security Scan Locally

```bash
# Install Trivy
brew install trivy  # macOS
# or
apt-get install trivy  # Debian/Ubuntu

# Scan filesystem
trivy fs services/product-service

# Scan Docker image
trivy image orderapp/product-service:local
```

---

## Troubleshooting

### Build Failures

**Issue:** Docker build fails with "out of memory"

**Solution:**
- Increase runner resources
- Use smaller base images
- Optimize Dockerfile layer caching

**Issue:** Tests fail on CI but pass locally

**Solution:**
- Check environment variable differences
- Verify database service health
- Review test timeouts

### Deployment Failures

**Issue:** `kubectl` cannot connect to cluster

**Solution:**
- Verify `KUBECONFIG_*` secret is correct
- Check cluster connectivity from GitHub Actions
- Ensure service account has proper permissions

**Issue:** Rollout stuck / timeout

**Solution:**
```bash
# Check pod status
kubectl get pods -n orderapp

# View events
kubectl get events -n orderapp --sort-by='.lastTimestamp'

# Check logs
kubectl logs -n orderapp <pod-name>

# Rollback
kubectl rollout undo deployment/<service> -n orderapp
```

### Notification Issues

**Issue:** Slack notifications not received

**Solution:**
- Verify webhook URL is correct
- Check Slack app permissions
- Test webhook manually:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test"}' \
    $SLACK_WEBHOOK_URL
  ```

---

## Performance Optimization

### Build Time Improvements

1. **Layer Caching:** Already implemented with `cache-from: type=gha`
2. **Parallel Builds:** Matrix strategy for all services
3. **Dependency Caching:** Node.js cache enabled

### Test Time Improvements

1. **Parallel Execution:** All services tested simultaneously
2. **Service Containers:** Shared across test jobs
3. **Test Splitting:** Consider sharding for large test suites

---

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to repository
   - Use GitHub Secrets for sensitive data
   - Rotate secrets regularly

2. **Image Scanning**
   - Trivy scans on every build
   - Fail build on critical vulnerabilities
   - Regular base image updates

3. **Dependency Management**
   - NPM audit on every PR
   - Dependabot for automated updates
   - Lock file integrity checks

4. **Access Control**
   - GITHUB_TOKEN with minimum permissions
   - Kubernetes RBAC for deployments
   - Environment protection rules

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Codecov Documentation](https://docs.codecov.com/)
- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Main Project README](../../README.md)
