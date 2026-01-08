# OrderApp+ - Microservices Order & Payment Management Platform

## 🎯 Project Overview

**OrderApp+** is a comprehensive microservices-based web application designed for order and payment management, targeting small businesses. This project is part of a Master's degree in DevOps & Cloud Engineering.

### Key Features
- 🔐 JWT-based user authentication
- 📦 Product catalog management with filtering and pagination
- 🛒 Shopping cart and order management
- 💳 Online payment integration (Stripe/PayPal sandbox)
- 📊 Real-time order and payment status tracking
- 👨‍💼 Admin capabilities for product and order management
- 📈 Complete monitoring and logging solution
- 🚀 Horizontal scalability with Kubernetes

## 🏗️ Architecture

OrderApp+ follows a microservices architecture with the following services:

1. **User Service** - Authentication, registration, user management (MongoDB)
2. **Product Service** - Product catalog CRUD, categories, stock (PostgreSQL)
3. **Order Service** - Cart, orders, order history (PostgreSQL)
4. **Payment Service** - Payment processing, Stripe/PayPal integration (MongoDB)
5. **Notification Service** - Email/SMS notifications (Redis/SMTP)

Each microservice:
- Has its own dedicated database
- Exposes REST APIs
- Is containerized with Docker
- Can be scaled independently
- Includes metrics endpoint for Prometheus

## 📁 Project Structure

```
OrderApp-Plus/
├── docs/                           # Documentation
│   ├── Rapport_Final_DevOps.md     # Rapport final complet du projet
│   ├── architecture-overview.md    # System architecture
│   ├── microservices-specs.md      # Microservices specifications
│   ├── api-design.md               # API documentation
│   └── agile-backlog.md            # Product backlog
├── services/                       # Microservices
│   ├── user-service/
│   ├── product-service/
│   ├── order-service/
│   ├── payment-service/
│   └── notification-service/
├── infrastructure/                 # Infrastructure as Code
│   ├── docker/
│   │   └── docker-compose.yml
│   └── kubernetes/
│       ├── deployments/
│       ├── services/
│       ├── configmaps/
│       ├── secrets/
│       ├── ingress/
│       └── hpa/
├── ci-cd/                          # CI/CD pipelines
│   └── github-actions/
├── monitoring/                     # Observability
│   ├── prometheus/
│   ├── grafana/
│   └── elk/
├── SETUP_GUIDE.md                  # Guide d'installation
├── DEPLOYMENT_GUIDE.md             # Guide de déploiement K8s
└── README.md                       # Ce fichier
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Kubernetes cluster (Minikube, Kind, or cloud provider)
- kubectl configured
- Node.js 18+ (for local development)
- PostgreSQL & MongoDB clients (optional)

### Local Development with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd OrderApp-Plus

# Start all services
cd infrastructure/docker
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f
```

Access the application:
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003
- Payment Service: http://localhost:3004
- Notification Service: http://localhost:3005

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods -n orderapp

# Access via Ingress
# Configure /etc/hosts: 127.0.0.1 orderapp.local
# Access: https://orderapp.local
```

## 📊 Monitoring & Observability

### Prometheus & Grafana

```bash
# Access Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Open http://localhost:3000
# Default credentials: admin/admin
```

### ELK Stack (Logs)

```bash
# Access Kibana
kubectl port-forward -n monitoring svc/kibana 5601:5601
# Open http://localhost:5601
```

### Key Metrics
- Response time (target: < 500ms)
- Error rate
- Request throughput
- CPU/Memory usage
- Database connection pools

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi / express-validator
- **ORM**: Sequelize (PostgreSQL), Mongoose (MongoDB)

### Databases
- **PostgreSQL**: Product & Order services
- **MongoDB**: User & Payment services
- **Redis**: Notification service, caching

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Ingress**: NGINX Ingress Controller
- **Autoscaling**: Horizontal Pod Autoscaler (HPA)

### Payment Integration
- Stripe API (sandbox)
- PayPal SDK (sandbox)

## 🔐 Security

- JWT-based authentication
- HTTPS/TLS termination at Ingress
- Secrets managed via Kubernetes Secrets
- Environment variables for sensitive data
- Role-based access control (RBAC)
- Input validation on all endpoints

## 🧪 Testing

```bash
# Run unit tests for all services
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📖 Documentation

### Rapport Final du Projet
- [**Rapport Final DevOps**](./docs/Rapport_Final_DevOps.md) - Documentation complète du projet (conception, développement, déploiement)

### Documentation Technique
| Document | Description |
|----------|-------------|
| [Architecture Overview](./docs/architecture-overview.md) | Vue d'ensemble de l'architecture système |
| [Microservices Specifications](./docs/microservices-specs.md) | Spécifications détaillées des microservices |
| [API Design](./docs/api-design.md) | Documentation des APIs REST |
| [Agile Backlog](./docs/agile-backlog.md) | Product backlog et sprints |

### Guides de Déploiement
| Guide | Description |
|-------|-------------|
| [Setup Guide](./SETUP_GUIDE.md) | Guide d'installation de l'environnement |
| [Deployment Guide](./DEPLOYMENT_GUIDE.md) | Guide de déploiement Kubernetes |

### Documentation par Composant
| Composant | Documentation |
|-----------|---------------|
| [User Service](./services/user-service/README.md) | Service d'authentification |
| [Product Service](./services/product-service/README.md) | Service catalogue produits |
| [Order Service](./services/order-service/README.md) | Service commandes |
| [Payment Service](./services/payment-service/README.md) | Service paiements |
| [Notification Service](./services/notification-service/README.md) | Service notifications |
| [Docker Infrastructure](./infrastructure/docker/README.md) | Configuration Docker Compose |
| [Kubernetes Infrastructure](./infrastructure/kubernetes/README.md) | Manifestes Kubernetes |
| [Monitoring Stack](./monitoring/README.md) | Prometheus, Grafana, ELK |
| [CI/CD Workflows](./.github/workflows/README.md) | GitHub Actions pipelines |

### Documentation GitHub
| Document | Description |
|----------|-------------|
| [Branch Protection](./.github/BRANCH_PROTECTION.md) | Règles de protection des branches |
| [Pull Request Template](./.github/pull_request_template.md) | Template pour les PRs |

## 🤝 Contributing

This is an academic project. For collaboration:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is developed for educational purposes as part of a Master's degree program.

## 👥 Authors

Master DevOps & Cloud Engineering - 2025

## 📞 Support

For questions or issues, please refer to the documentation or create an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: November 2025
