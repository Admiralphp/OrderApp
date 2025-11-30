# Docker Compose Infrastructure

## Overview

This directory contains Docker Compose configurations for local development and testing of the OrderApp+ microservices platform.

## Files

- **docker-compose.yml**: Main configuration with all services, databases, and monitoring stack
- **docker-compose.dev.yml**: Development-specific overrides with hot-reload and volume mounts

## Architecture

### Services (Port Mapping)
- **user-service**: 3001 - User authentication & profile management
- **product-service**: 3002 - Product catalog management
- **order-service**: 3003 - Order processing & cart
- **payment-service**: 3004 - Payment processing
- **notification-service**: 3005 - Email & notification queue

### Databases
- **postgres-product**: 5432 - Product service database
- **postgres-order**: 5433 - Order service database
- **mongodb-user**: 27017 - User service database
- **mongodb-payment**: 27018 - Payment service database
- **redis-notification**: 6379 - Notification queue & cache

### Monitoring Stack
- **Prometheus**: 9090 - Metrics collection
- **Grafana**: 3000 - Metrics visualization (admin/admin)
- **Elasticsearch**: 9200 - Log storage
- **Logstash**: 5000 - Log processing
- **Kibana**: 5601 - Log visualization

## Quick Start

### Prerequisites
- Docker 24.0+
- Docker Compose 2.20+
- 8GB+ RAM available
- 20GB+ disk space

### Starting All Services

```bash
# From infrastructure/docker directory
docker-compose up -d

# Or with development overrides (hot-reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Checking Service Health

```bash
# Check all container statuses
docker-compose ps

# View logs for specific service
docker-compose logs -f product-service

# Check health endpoints
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Payment Service
curl http://localhost:3005/health  # Notification Service
```

### Database Access

**PostgreSQL (Product Service)**
```bash
docker exec -it orderapp-postgres-product psql -U product_user -d product_db
```

**PostgreSQL (Order Service)**
```bash
docker exec -it orderapp-postgres-order psql -U order_user -d order_db
```

**MongoDB (User Service)**
```bash
docker exec -it orderapp-mongodb-user mongosh -u user_admin -p user_pass --authenticationDatabase admin user_db
```

**MongoDB (Payment Service)**
```bash
docker exec -it orderapp-mongodb-payment mongosh -u payment_admin -p payment_pass --authenticationDatabase admin payment_db
```

**Redis (Notification Service)**
```bash
docker exec -it orderapp-redis-notification redis-cli -a notification_pass
```

## Monitoring & Observability

### Prometheus
- **URL**: http://localhost:9090
- **Purpose**: Metrics collection from all microservices
- **Targets**: Check http://localhost:9090/targets for service health

### Grafana
- **URL**: http://localhost:3000
- **Credentials**: admin / admin
- **Dashboards**: Pre-configured dashboards in `../monitoring/grafana/dashboards/`

### Kibana (ELK Stack)
- **URL**: http://localhost:5601
- **Purpose**: Log aggregation and visualization
- **Logs**: All microservice logs forwarded via Logstash

## Development Workflow

### Hot Reload Mode

```bash
# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Code changes in services/*/src will auto-reload
```

### Running Tests

```bash
# Test specific service
docker-compose exec product-service npm test

# Test with coverage
docker-compose exec product-service npm run test:coverage
```

### Rebuilding Services

```bash
# Rebuild specific service
docker-compose build product-service

# Rebuild all services
docker-compose build

# Force rebuild without cache
docker-compose build --no-cache
```

## Environment Variables

Critical environment variables to configure:

### JWT Configuration
- `JWT_SECRET`: Shared secret for all services (CHANGE IN PRODUCTION!)
- `JWT_EXPIRY`: Token expiration time (default: 24h)

### Payment Service
- `STRIPE_SECRET_KEY`: Stripe API key
- `PAYPAL_CLIENT_ID`: PayPal client ID
- `PAYPAL_CLIENT_SECRET`: PayPal secret
- `PAYPAL_MODE`: sandbox | live

### Notification Service
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP port (587 for TLS)
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password or app password

## Networking

All services communicate via `orderapp-network` bridge network:
- Service-to-service: Use service names (e.g., `http://product-service:3002`)
- External access: Use localhost with mapped ports

## Data Persistence

Volumes for data persistence:
- `orderapp-postgres-product-data`
- `orderapp-postgres-order-data`
- `orderapp-mongodb-user-data`
- `orderapp-mongodb-payment-data`
- `orderapp-redis-notification-data`
- `orderapp-prometheus-data`
- `orderapp-grafana-data`
- `orderapp-elasticsearch-data`

### Cleaning Up Data

```bash
# Stop and remove containers, networks
docker-compose down

# Remove volumes (DELETES ALL DATA!)
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs service-name

# Check resource usage
docker stats

# Verify network connectivity
docker network inspect orderapp-network
```

### Database Connection Issues

```bash
# Check database health
docker-compose ps

# Test database connectivity
docker-compose exec service-name nc -zv postgres-product 5432
```

### Memory Issues

```bash
# Check Docker memory allocation
docker info | grep -i memory

# Increase Docker Desktop memory in settings (minimum 8GB recommended)
```

### Port Conflicts

If ports are already in use, modify port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3002:3002"  # Change left side to available port
```

## Production Considerations

⚠️ **DO NOT use this configuration in production!**

For production deployment:
1. Use Kubernetes manifests in `infrastructure/kubernetes/`
2. Change all default passwords
3. Enable TLS/SSL for all services
4. Configure proper secrets management
5. Set up proper backup strategies
6. Enable authentication for monitoring tools
7. Configure resource limits
8. Set up proper logging retention

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Main Project Documentation](../../README.md)
- [Architecture Overview](../../docs/architecture-overview.md)
- [API Documentation](../../docs/api-design.md)
