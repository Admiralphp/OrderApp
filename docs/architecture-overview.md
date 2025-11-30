# OrderApp+ - Architecture Overview

## 1. System Architecture

### 1.1 High-Level Architecture

OrderApp+ follows a **microservices architecture** pattern, ensuring scalability, maintainability, and independent deployment of services.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web Browser / Mobile App / Third-party Integrations)          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway / Ingress                         │
│              (NGINX Ingress Controller + TLS)                    │
└────┬──────────┬──────────┬──────────┬──────────┬────────────────┘
     │          │          │          │          │
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌──────────────┐
│  User   ││ Product ││  Order  ││ Payment ││Notification  │
│ Service ││ Service ││ Service ││ Service ││   Service    │
│         ││         ││         ││         ││              │
│ :3001   ││ :3002   ││ :3003   ││ :3004   ││   :3005      │
└────┬────┘└────┬────┘└────┬────┘└────┬────┘└──────┬───────┘
     │          │          │          │            │
     ▼          ▼          ▼          ▼            ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌──────────┐
│ MongoDB ││PostgreSQL│PostgreSQL││ MongoDB ││  Redis   │
│  User   ││ Product ││  Order  ││ Payment ││  Cache   │
│   DB    ││   DB    ││   DB    ││   DB    ││          │
└─────────┘└─────────┘└─────────┘└─────────┘└──────────┘
```

### 1.2 Communication Patterns

1. **Synchronous Communication**: REST APIs over HTTP/HTTPS
   - Client → API Gateway → Microservices
   - Service-to-Service calls (e.g., Order Service → Product Service)

2. **Asynchronous Communication** (Future enhancement):
   - Event-driven via Message Broker (RabbitMQ/Kafka)
   - For notifications and eventual consistency

### 1.3 Data Architecture

Each microservice follows the **Database per Service** pattern:

| Service | Database | Technology | Purpose |
|---------|----------|------------|---------|
| User Service | user_db | MongoDB | Flexible schema for user profiles |
| Product Service | product_db | PostgreSQL | Relational data for products/categories |
| Order Service | order_db | PostgreSQL | Transactional integrity for orders |
| Payment Service | payment_db | MongoDB | Flexible payment metadata storage |
| Notification Service | N/A | Redis + SMTP | Caching & email delivery |

## 2. Technology Stack

### 2.1 Core Technologies

**Backend Framework**
- Node.js 18+ (LTS)
- Express.js 4.x
- TypeScript (recommended for production)

**Databases**
- PostgreSQL 15 (Product & Order services)
- MongoDB 6.0 (User & Payment services)
- Redis 7.0 (Notification service & caching)

**Authentication & Security**
- JWT (JSON Web Tokens)
- bcrypt for password hashing
- Helmet.js for HTTP security headers
- Rate limiting with express-rate-limit

### 2.2 DevOps Stack

**Containerization**
- Docker 24+
- Docker Compose 2.x (local development)

**Orchestration**
- Kubernetes 1.28+
- Helm 3.x (optional, for package management)

**CI/CD**
- GitHub Actions
- Docker Hub / GitHub Container Registry

**Monitoring & Observability**
- Prometheus 2.x (metrics collection)
- Grafana 10.x (visualization)
- ELK Stack:
  - Elasticsearch 8.x (log storage)
  - Logstash 8.x (log processing)
  - Kibana 8.x (log visualization)
- Promtail/Fluentd (log forwarding)

### 2.3 External Integrations

**Payment Providers**
- Stripe API (v2023-10-16)
- PayPal REST SDK (sandbox mode)

**Email Service**
- SMTP (Gmail, SendGrid, or custom)
- Email templates with Handlebars

## 3. Microservices Details

### 3.1 User Service

**Responsibility**: User management and authentication

**Technology**: Node.js + Express + MongoDB + JWT

**Key Features**:
- User registration with email validation
- Login with JWT token generation
- Password reset functionality
- User profile management
- Role-based access control (USER, ADMIN)

**External Dependencies**: None

**Scalability**: Stateless, horizontally scalable

---

### 3.2 Product Service

**Responsibility**: Product catalog management

**Technology**: Node.js + Express + PostgreSQL

**Key Features**:
- CRUD operations for products
- Category management
- Stock tracking
- Advanced filtering (price range, category, availability)
- Pagination & sorting
- Product search

**External Dependencies**: None

**Scalability**: Read-heavy, cache-friendly

---

### 3.3 Order Service

**Responsibility**: Order lifecycle management

**Technology**: Node.js + Express + PostgreSQL

**Key Features**:
- Shopping cart management (session-based)
- Order creation and validation
- Order status tracking (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- Order history per user
- Integration with Product Service (stock validation)
- Integration with User Service (user validation)

**External Dependencies**: 
- User Service (validate user ID)
- Product Service (validate products & stock)

**Scalability**: Transaction-heavy, needs database optimization

---

### 3.4 Payment Service

**Responsibility**: Payment processing and reconciliation

**Technology**: Node.js + Express + MongoDB

**Key Features**:
- Create payment intents (Stripe/PayPal)
- Process payments via external providers
- Handle webhook notifications
- Store payment records and metadata
- Refund management
- Payment status tracking

**External Dependencies**:
- Stripe API
- PayPal API
- Order Service (update order status)

**Scalability**: Webhook-heavy, needs idempotency

---

### 3.5 Notification Service

**Responsibility**: Multi-channel notifications

**Technology**: Node.js + Express + Redis + SMTP

**Key Features**:
- Email notifications (order confirmation, payment success)
- SMS notifications (optional, via Twilio)
- Webhook notifications for third-party integrations
- Template management
- Notification queue with Redis

**External Dependencies**:
- SMTP server
- Twilio API (optional)

**Scalability**: Queue-based, asynchronous processing

## 4. Security Architecture

### 4.1 Authentication Flow

```
1. User registers/logs in → User Service
2. User Service generates JWT token (expiry: 24h)
3. Client stores JWT in localStorage or httpOnly cookie
4. Client includes JWT in Authorization header: "Bearer <token>"
5. Each service validates JWT using shared secret
6. Services extract user ID and roles from JWT payload
```

**JWT Payload**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### 4.2 Security Best Practices

1. **Secrets Management**
   - Environment variables for sensitive data
   - Kubernetes Secrets for production
   - Never commit secrets to Git

2. **HTTPS/TLS**
   - TLS termination at Ingress level
   - Let's Encrypt for certificates
   - Force HTTPS redirect

3. **Input Validation**
   - Validate all inputs with Joi/express-validator
   - Sanitize user inputs to prevent XSS
   - Use parameterized queries to prevent SQL injection

4. **Rate Limiting**
   - API rate limiting per IP/user
   - Prevent brute-force attacks
   - DDoS protection at Ingress level

5. **CORS Configuration**
   - Whitelist allowed origins
   - Secure cookie settings

## 5. Scalability Strategy

### 5.1 Horizontal Scaling

**Kubernetes HPA (Horizontal Pod Autoscaler)**:
- Auto-scale based on CPU/Memory metrics
- Target: 70% CPU utilization
- Min replicas: 2, Max replicas: 10

**Database Scaling**:
- PostgreSQL: Read replicas for Product Service
- MongoDB: Replica sets with sharding
- Redis: Cluster mode for high availability

### 5.2 Caching Strategy

**Redis Caching**:
- Product catalog (TTL: 10 minutes)
- User sessions
- API response caching

**CDN**:
- Static assets (images, CSS, JS)
- Product images

### 5.3 Load Balancing

- Kubernetes Service (ClusterIP) for internal load balancing
- NGINX Ingress for external load balancing
- Session affinity if needed (sticky sessions)

## 6. Monitoring & Observability

### 6.1 Metrics (Prometheus)

**Application Metrics**:
- HTTP request duration (histogram)
- HTTP request count (counter)
- HTTP error rate (counter)
- Active connections (gauge)

**Infrastructure Metrics**:
- CPU usage per pod
- Memory usage per pod
- Disk I/O
- Network throughput

**Business Metrics**:
- Orders per minute
- Revenue per hour
- Failed payments count
- User registrations

### 6.2 Logging (ELK Stack)

**Log Levels**: ERROR, WARN, INFO, DEBUG

**Structured Logging**:
```json
{
  "timestamp": "2025-11-29T10:30:45.123Z",
  "level": "INFO",
  "service": "product-service",
  "traceId": "abc-123-xyz",
  "userId": "user123",
  "message": "Product created successfully",
  "metadata": {
    "productId": "prod-456",
    "duration": "45ms"
  }
}
```

### 6.3 Alerting

**Critical Alerts**:
- Service down (health check failed)
- Error rate > 5%
- Response time > 1000ms (P95)
- Database connection pool exhausted

**Warning Alerts**:
- CPU usage > 80%
- Memory usage > 80%
- Disk usage > 85%
- Payment failure rate > 2%

## 7. Disaster Recovery & High Availability

### 7.1 Backup Strategy

**Databases**:
- PostgreSQL: Automated daily backups with WAL archiving
- MongoDB: Replica set with daily snapshots
- Retention: 30 days

**Configuration**:
- Git repository for Infrastructure as Code
- ConfigMaps versioned in Kubernetes

### 7.2 High Availability

- Multi-zone deployment (3 availability zones)
- Minimum 2 replicas per service
- Database replication (master-slave)
- Health checks and auto-restart policies

### 7.3 Disaster Recovery

**RTO (Recovery Time Objective)**: < 1 hour  
**RPO (Recovery Point Objective)**: < 15 minutes

**Recovery Plan**:
1. Restore database from latest backup
2. Deploy services from Docker images
3. Apply Kubernetes manifests
4. Verify health checks
5. Update DNS if needed

## 8. Development Workflow

### 8.1 Git Branching Strategy

**Main Branches**:
- `main` - production-ready code
- `develop` - integration branch
- `staging` - pre-production testing

**Feature Branches**:
- `feature/<feature-name>` - new features
- `bugfix/<bug-name>` - bug fixes
- `hotfix/<issue-name>` - urgent production fixes

### 8.2 CI/CD Pipeline

```
Code Commit → GitHub Actions
  ↓
Lint & Unit Tests
  ↓
Build Docker Image
  ↓
Push to Container Registry
  ↓
Deploy to Staging (K8s)
  ↓
Integration Tests
  ↓
Manual Approval
  ↓
Deploy to Production (K8s)
  ↓
Smoke Tests
```

## 9. Repository Structure

### 9.1 Monorepo vs Multi-repo

**Decision: MONOREPO** ✅

**Justification**:
- Easier code sharing and refactoring
- Unified CI/CD pipeline
- Simpler version management
- Better for small teams and academic projects
- Single source of truth

**Trade-offs**:
- Larger repository size
- Requires good tooling (lerna, nx, turborepo)
- All services versioned together

### 9.2 Folder Structure

```
OrderApp-Plus/
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
├── docs/                    # Documentation
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
├── infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml
│   └── kubernetes/
│       ├── base/            # Base manifests
│       ├── overlays/        # Kustomize overlays (dev/staging/prod)
│       └── helm/            # Helm charts (optional)
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   └── elk/
├── shared/                  # Shared libraries
│   ├── logger/
│   ├── auth-middleware/
│   └── error-handler/
├── scripts/                 # Utility scripts
├── .gitignore
├── README.md
└── package.json             # Root package.json for monorepo
```

## 10. Performance Targets

### 10.1 Response Time SLOs

| Endpoint Type | Target (P95) | Target (P99) |
|---------------|--------------|--------------|
| GET requests | < 200ms | < 500ms |
| POST/PUT requests | < 300ms | < 700ms |
| Payment processing | < 2000ms | < 5000ms |
| Search queries | < 500ms | < 1000ms |

### 10.2 Availability SLO

- **Target**: 99.9% uptime (8.76 hours downtime/year)
- **Measurement window**: 30 days
- **Exclusions**: Planned maintenance (announced 48h in advance)

### 10.3 Capacity Planning

**Expected Load**:
- 1000 concurrent users
- 100 requests/second
- 10,000 orders/day
- 1 TB storage (first year)

**Resource Allocation (per service)**:
- CPU: 500m (request), 1000m (limit)
- Memory: 512Mi (request), 1Gi (limit)
- Disk: 10Gi persistent volume (databases)

## 11. Future Enhancements

1. **Event-Driven Architecture**
   - Implement RabbitMQ/Kafka for async communication
   - Event sourcing for order history

2. **Service Mesh**
   - Istio for advanced traffic management
   - Mutual TLS between services

3. **API Gateway**
   - Kong or Ambassador for centralized API management
   - GraphQL gateway for flexible queries

4. **Advanced Monitoring**
   - Distributed tracing with Jaeger/Zipkin
   - APM with New Relic or Datadog

5. **Multi-tenancy**
   - Support multiple businesses
   - Tenant isolation

---

**Document Version**: 1.0  
**Last Updated**: November 29, 2025  
**Author**: Master DevOps Team
