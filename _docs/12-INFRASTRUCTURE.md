# BossZap — Infrastructure

## Environments
| Environment | Purpose | URL |
|---|---|---|
| Development | Local development | localhost |
| Staging | Pre-production testing | staging.bosszap.com |
| Production | Live system | bosszap.com |

## Docker Setup

### docker-compose.yml (Development)
Services:
- **backend:** NestJS app, port 3000
- **frontend-subscriber:** Next.js app, port 3001
- **frontend-admin:** Next.js app, port 3002
- **landing-page:** Next.js app, port 3003
- **postgres:** PostgreSQL 16, port 5432
- **redis:** Redis 7, port 6379

### Dockerfiles
- Each service has its own `Dockerfile`.
- Multi-stage builds: build stage + production stage.
- Node.js 20 LTS as base image.
- Non-root user in production containers.
- `.dockerignore` in each service directory.

## CI/CD (GitHub Actions)

### deploy-staging.yml
- Trigger: push to `develop` branch.
- Steps:
  1. Checkout code.
  2. Run linter (ESLint).
  3. Run tests (Jest).
  4. Build Docker images.
  5. Push to container registry.
  6. Deploy to staging environment.

### deploy-production.yml
- Trigger: push to `main` branch (after PR merge).
- Steps:
  1. Checkout code.
  2. Run full test suite.
  3. Build Docker images with version tag.
  4. Push to container registry.
  5. Deploy to production with rolling update.
  6. Run smoke tests.
  7. Notify on success/failure.

## Database Management

### Migrations
- TypeORM migrations in `backend/src/database/migrations/`.
- Every schema change must be a migration. Never edit the database directly.
- Migration naming: `YYYYMMDDHHMMSS-description.ts`.
- Run migrations on deployment (automated in CI/CD pipeline).
- Rollback plan: every migration has an `up()` and `down()` method.

### Backups
- Automated daily backups of PostgreSQL.
- Retain daily backups for 30 days.
- Retain weekly backups for 6 months.
- Store backups in separate S3 bucket (different region).
- Test restore process monthly.

### Connection Pooling
- Use `pg-pool` or PgBouncer for connection pooling.
- Max connections: 20 per backend instance.
- Idle timeout: 30 seconds.
- Monitor pool utilization in admin dashboard.

## Redis Configuration
- Persistence: AOF (append-only file) for durability.
- Max memory: configured per environment.
- Eviction policy: `allkeys-lru` for cache, no eviction for queues.
- Separate Redis databases or instances for cache vs queues.

## Security

### Secrets Management
- Environment variables for all secrets.
- Never commit secrets to git.
- Use `.env.example` with placeholder values.
- Production: use cloud provider's secrets manager (AWS Secrets Manager, GCP Secret Manager).

### Network Security
- HTTPS everywhere (SSL/TLS certificates via Let's Encrypt or cloud provider).
- Firewall: only expose ports 80 and 443 to the internet.
- Database and Redis: accessible only from backend containers (internal network).
- Rate limiting at reverse proxy level (nginx/cloudflare).

### Authentication Security
- Passwords: bcrypt with 12 salt rounds.
- JWT: RS256 signing algorithm preferred (or HS256 with strong secret).
- Refresh token rotation: new refresh token on every use, old one invalidated.
- Session revocation: ability to invalidate all tokens for a subscriber.

## Monitoring & Alerting

### Health Checks
- `/api/v1/health` endpoint: checks database, Redis, external APIs.
- Docker health checks on all containers.
- Uptime monitoring (UptimeRobot or similar).

### Logging
- Centralized logging (CloudWatch, Datadog, or ELK stack).
- Structured JSON logs from all services.
- Log retention: 30 days hot, 90 days cold storage.
- Search and filter capabilities.

### Metrics
- API response times (p50, p95, p99).
- Queue depth and processing time.
- Error rates per module.
- External API latency (WhatsApp, OpenAI, Stripe).
- Database query performance.

### Alerts
- Error rate > 5% in any 5-minute window.
- Queue depth > 1000 messages.
- API response time p95 > 5 seconds.
- Database connection pool exhaustion.
- Payment webhook failures.
- Worker process crashes.

## Scaling Strategy

### Horizontal Scaling
- Backend: stateless, can run multiple instances behind load balancer.
- Workers: can scale independently based on queue depth.
- Frontend: static builds served via CDN (Vercel, Cloudflare Pages, or custom).

### Database Scaling
- Read replicas for dashboard queries (read-heavy).
- Connection pooling to manage connections efficiently.
- Query optimization: indexes on all filtered/sorted columns.
- Partitioning: consider for `conversation_history` and `audit_log` after high volume.

### CDN
- Static assets (JS, CSS, images) served via CDN.
- S3 + CloudFront for subscriber-uploaded files (logos, PDFs).
- Cache headers configured appropriately.

## Disaster Recovery
- RTO (Recovery Time Objective): 4 hours.
- RPO (Recovery Point Objective): 1 hour (maximum data loss).
- Documented recovery procedures for: database failure, container crashes, cloud region outage.
- Annual disaster recovery drill.
