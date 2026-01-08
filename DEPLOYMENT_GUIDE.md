# OrderApp+ Deployment Guide

Complete guide for deploying OrderApp+ microservices on a local Kubernetes cluster using Vagrant and VirtualBox.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [SonarQube Configuration](#sonarqube-configuration)
7. [Monitoring Stack](#monitoring-stack)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance](#maintenance)

---

## Prerequisites

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 16 GB | 32 GB |
| Disk | 50 GB | 100 GB SSD |

### Software Requirements

Install the following on your Windows host machine:

1. **VirtualBox 7.0+**
   - Download: https://www.virtualbox.org/wiki/Downloads
   - Enable VT-x/AMD-V in BIOS

2. **Vagrant 2.4+**
   - Download: https://www.vagrantup.com/downloads

3. **kubectl**
   - Download: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
   ```powershell
   # Using Chocolatey
   choco install kubernetes-cli

   # Or using winget
   winget install Kubernetes.kubectl
   ```

4. **Git**
   - Download: https://git-scm.com/download/win

5. **Docker Desktop** (optional, for local image building)
   - Download: https://www.docker.com/products/docker-desktop

### Network Configuration

Ensure these IP ranges are available:
- `192.168.56.0/24` - VirtualBox Host-Only Network
- `10.244.0.0/16` - Kubernetes Pod Network (Flannel)

---

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────────┐
                                    │              Ingress Controller                  │
                                    │          (api.orderapp.local)                   │
                                    └─────────────────┬───────────────────────────────┘
                                                      │
              ┌───────────────┬──────────────┬───────┴──────┬──────────────┬─────────────┐
              │               │              │              │              │             │
        ┌─────▼─────┐   ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐       │
        │   User    │   │  Product  │  │   Order   │  │  Payment  │  │Notification│       │
        │  Service  │   │  Service  │  │  Service  │  │  Service  │  │  Service  │       │
        │  :3001    │   │  :3002    │  │  :3003    │  │  :3004    │  │  :3005    │       │
        └─────┬─────┘   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘       │
              │               │              │              │              │             │
        ┌─────▼─────┐   ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐       │
        │  MongoDB  │   │PostgreSQL │  │PostgreSQL │  │  MongoDB  │  │   Redis   │       │
        │  (User)   │   │ (Product) │  │  (Order)  │  │ (Payment) │  │  (Queue)  │       │
        └───────────┘   └───────────┘  └───────────┘  └───────────┘  └───────────┘       │
                                                                                          │
┌─────────────────────────────────────────────────────────────────────────────────────────┘
│
│   Monitoring Stack (monitoring.orderapp.local)
│   ┌────────────┐  ┌────────────┐  ┌────────────────────────────────┐
│   │ Prometheus │  │  Grafana   │  │     ELK Stack                  │
│   │   :9090    │  │   :3000    │  │ Elasticsearch/Logstash/Kibana  │
│   └────────────┘  └────────────┘  └────────────────────────────────┘
│
│   Code Quality (sonarqube.orderapp.local)
│   ┌────────────┐  ┌────────────┐
│   │ SonarQube  │  │ PostgreSQL │
│   │   :9000    │  │   (Sonar)  │
│   └────────────┘  └────────────┘
└─────────────────────────────────────────────────────────────────────────────────────────

Kubernetes Cluster (Vagrant/VirtualBox):
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   k8s-master    │  │   k8s-worker1   │  │   k8s-worker2   │
│  192.168.56.10  │  │  192.168.56.11  │  │  192.168.56.12  │
│   4GB RAM       │  │   4GB RAM       │  │   4GB RAM       │
│   2 CPU         │  │   2 CPU         │  │   2 CPU         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Quick Start

### 1. Clone the Repository

```powershell
git clone https://github.com/your-org/OrderApp-Plus.git
cd OrderApp-Plus
```

### 2. Start the Kubernetes Cluster

```powershell
.\scripts\setup-cluster.ps1 -Action start
```

This will:
- Create 3 VMs (master + 2 workers)
- Install Kubernetes 1.29
- Configure Flannel CNI
- Install MetalLB for LoadBalancer
- Install Nginx Ingress Controller
- Configure kubectl on your host

### 3. Deploy All Applications

```powershell
.\scripts\deploy-apps.ps1 -Component all
```

### 4. Configure Hosts File

Add to `C:\Windows\System32\drivers\etc\hosts`:

```
192.168.56.200  api.orderapp.local
192.168.56.200  monitoring.orderapp.local
192.168.56.200  sonarqube.orderapp.local
```

### 5. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| API Gateway | http://api.orderapp.local | - |
| SonarQube | http://sonarqube.orderapp.local | admin / admin |
| Grafana | http://monitoring.orderapp.local/grafana | admin / orderapp2024 |
| Prometheus | http://monitoring.orderapp.local/prometheus | - |
| Kibana | http://monitoring.orderapp.local/kibana | - |

---

## Detailed Setup

### Step 1: Cluster Setup

```powershell
# Check prerequisites
.\scripts\setup-cluster.ps1 -Action start

# Monitor progress
.\scripts\setup-cluster.ps1 -Action status

# SSH into master node (if needed)
.\scripts\setup-cluster.ps1 -Action ssh -Node k8s-master
```

### Step 2: Verify Cluster

```powershell
# Check nodes
kubectl get nodes

# Expected output:
# NAME          STATUS   ROLES           AGE   VERSION
# k8s-master    Ready    control-plane   5m    v1.29.x
# k8s-worker1   Ready    <none>          3m    v1.29.x
# k8s-worker2   Ready    <none>          3m    v1.29.x
```

### Step 3: Deploy Components Individually

```powershell
# Deploy base infrastructure (namespaces, RBAC)
.\scripts\deploy-apps.ps1 -Component base

# Deploy databases
.\scripts\deploy-apps.ps1 -Component databases

# Deploy microservices
.\scripts\deploy-apps.ps1 -Component services

# Deploy Ingress
.\scripts\deploy-apps.ps1 -Component ingress

# Deploy monitoring
.\scripts\deploy-apps.ps1 -Component monitoring

# Deploy SonarQube
.\scripts\deploy-apps.ps1 -Component sonarqube
```

### Step 4: Verify Deployments

```powershell
# Check all pods
kubectl get pods -A

# Check services
kubectl get svc -n orderapp

# Check ingress
kubectl get ingress -A

# Check HPA
kubectl get hpa -n orderapp
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

The pipeline (`.github/workflows/ci-cd-pipeline.yml`) includes:

1. **Lint** - ESLint code quality
2. **Test** - Unit and integration tests with coverage
3. **SonarQube** - Code analysis and quality gate
4. **Security** - Trivy vulnerability scanning
5. **Build** - Docker image build and push to GHCR
6. **Deploy Staging** - Auto-deploy on `develop` branch
7. **Deploy Production** - Auto-deploy on `main` branch

### Required GitHub Secrets

Configure these in your repository settings:

```yaml
# SonarQube
SONAR_TOKEN: <your-sonarqube-token>
SONAR_HOST_URL: http://sonarqube.orderapp.local:9000

# Kubernetes
KUBE_CONFIG_STAGING: <base64-encoded-kubeconfig>
KUBE_CONFIG_PRODUCTION: <base64-encoded-kubeconfig>

# Notifications
SLACK_WEBHOOK_URL: <your-slack-webhook>

# Code Coverage
CODECOV_TOKEN: <your-codecov-token>
```

### Generate Kubeconfig for CI/CD

```powershell
# Get kubeconfig from cluster
$kubeconfig = kubectl config view --raw --minify

# Encode to base64
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($kubeconfig))

# Copy to clipboard
$encoded | Set-Clipboard
```

---

## SonarQube Configuration

### Initial Setup

1. Access SonarQube at http://sonarqube.orderapp.local
2. Login with `admin` / `admin`
3. Change password when prompted
4. Create a new project token

### Configure Projects

Each service has a `sonar-project.properties` file. To scan locally:

```powershell
# Install SonarScanner
npm install -g sonarqube-scanner

# Run scan (from service directory)
cd services/user-service
sonar-scanner -Dsonar.token=<your-token>
```

### Quality Gate Configuration

Recommended quality gate settings:

| Metric | Operator | Value |
|--------|----------|-------|
| Coverage | >= | 80% |
| Duplicated Lines | <= | 3% |
| Maintainability Rating | <= | A |
| Reliability Rating | <= | A |
| Security Rating | <= | A |
| Security Hotspots Reviewed | >= | 100% |

---

## Monitoring Stack

### Prometheus

Access: http://monitoring.orderapp.local/prometheus

Pre-configured targets:
- All 5 microservices
- Kubernetes nodes
- Database exporters

Example queries:
```promql
# Request rate per service
rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage
process_resident_memory_bytes / 1024 / 1024
```

### Grafana

Access: http://monitoring.orderapp.local/grafana

Credentials: `admin` / `orderapp2024`

Pre-configured data sources:
- Prometheus
- Elasticsearch

### ELK Stack

- **Kibana**: http://monitoring.orderapp.local/kibana
- **Elasticsearch**: Port 9200 (internal)
- **Logstash**: Ports 5044 (Beats), 5000 (TCP)

Configure log shipping from services using Winston logger.

---

## Troubleshooting

### Common Issues

#### Pods stuck in Pending

```powershell
# Check events
kubectl describe pod <pod-name> -n orderapp

# Check node resources
kubectl top nodes
```

#### Database connection errors

```powershell
# Check database pods
kubectl get pods -n orderapp | grep -E "mongo|postgres|redis"

# Check database logs
kubectl logs -l app=mongodb-user -n orderapp
```

#### Ingress not working

```powershell
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress orderapp-ingress -n orderapp

# Check MetalLB
kubectl get svc -n ingress-nginx
```

#### SonarQube not starting

```powershell
# SonarQube needs increased vm.max_map_count
# SSH into worker nodes and run:
sudo sysctl -w vm.max_map_count=262144

# Check SonarQube logs
kubectl logs -l app=sonarqube -n sonarqube
```

### Useful Commands

```powershell
# View all logs for a service
kubectl logs -l app=user-service -n orderapp --tail=100 -f

# Execute command in pod
kubectl exec -it deployment/user-service -n orderapp -- /bin/sh

# Port forward for debugging
kubectl port-forward svc/user-service 3001:3001 -n orderapp

# Restart all deployments
kubectl rollout restart deployment -n orderapp

# Force delete stuck pod
kubectl delete pod <pod-name> -n orderapp --force --grace-period=0
```

---

## Maintenance

### Cluster Operations

```powershell
# Stop cluster (preserves data)
.\scripts\setup-cluster.ps1 -Action stop

# Start cluster
.\scripts\setup-cluster.ps1 -Action start

# Restart cluster
.\scripts\setup-cluster.ps1 -Action reload

# Destroy cluster (deletes everything)
.\scripts\setup-cluster.ps1 -Action destroy
```

### Application Updates

```powershell
# Update specific service
kubectl set image deployment/user-service \
  user-service=ghcr.io/orderapp/user-service:v1.2.0 -n orderapp

# Rollback deployment
kubectl rollout undo deployment/user-service -n orderapp

# Scale deployment
kubectl scale deployment/user-service --replicas=5 -n orderapp
```

### Cleanup

```powershell
# Clean Kubernetes resources only
.\scripts\cleanup.ps1 -Target k8s

# Clean Docker resources
.\scripts\cleanup.ps1 -Target docker

# Clean everything
.\scripts\cleanup.ps1 -Target all -Force
```

### Backup

```powershell
# Backup all Kubernetes resources
kubectl get all -A -o yaml > backup-all.yaml

# Backup specific namespace
kubectl get all -n orderapp -o yaml > backup-orderapp.yaml

# Backup secrets (encrypted)
kubectl get secrets -n orderapp -o yaml > backup-secrets.yaml
```

---

## File Structure

```
OrderApp-Plus/
├── .github/
│   └── workflows/
│       └── ci-cd-pipeline.yml      # Complete CI/CD pipeline
├── infrastructure/
│   ├── vagrant/
│   │   ├── Vagrantfile             # 3-node K8s cluster
│   │   └── shared/                 # Shared files between VMs
│   └── kubernetes/
│       ├── base/                   # Namespaces, RBAC
│       ├── databases/              # MongoDB, PostgreSQL, Redis
│       ├── services/               # 5 microservices
│       ├── configmaps/             # Service configurations
│       ├── secrets/                # Sensitive data
│       ├── ingress/                # Ingress rules
│       ├── hpa/                    # Horizontal Pod Autoscalers
│       └── sonarqube/              # SonarQube deployment
├── monitoring/
│   └── kubernetes/
│       ├── prometheus/             # Prometheus config & deployment
│       ├── grafana/                # Grafana config & deployment
│       └── elk/                    # Elasticsearch, Logstash, Kibana
├── scripts/
│   ├── setup-cluster.ps1           # Cluster management
│   ├── deploy-apps.ps1             # Application deployment
│   └── cleanup.ps1                 # Cleanup utilities
├── services/
│   ├── user-service/
│   │   └── sonar-project.properties
│   ├── product-service/
│   │   └── sonar-project.properties
│   ├── order-service/
│   │   └── sonar-project.properties
│   ├── payment-service/
│   │   └── sonar-project.properties
│   └── notification-service/
│       └── sonar-project.properties
└── DEPLOYMENT_GUIDE.md             # This file
```

---

## Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs: `.\scripts\deploy-apps.ps1 -Action logs -Service <service-name>`
3. Open an issue on GitHub

---

**OrderApp+ Team** - Master DevOps 2025
