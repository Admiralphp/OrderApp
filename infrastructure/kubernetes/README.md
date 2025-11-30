# Kubernetes Deployment Guide

## Overview

This directory contains Kubernetes manifests for deploying the OrderApp+ microservices platform to production.

## Prerequisites

- Kubernetes cluster 1.28+ (EKS, GKE, AKS, or self-hosted)
- kubectl 1.28+
- Helm 3.0+ (for monitoring stack)
- cert-manager (for TLS certificates)
- NGINX Ingress Controller
- Metrics Server (for HPA)

## Architecture

### Services Deployed
- **user-service**: 2-10 replicas with HPA
- **product-service**: 2-10 replicas with HPA
- **order-service**: 2-15 replicas with HPA
- **payment-service**: 2-8 replicas with HPA
- **notification-service**: 2-8 replicas with HPA

### Resources per Pod
- CPU: 250m (request) / 500m (limit)
- Memory: 256Mi (request) / 512Mi (limit)

### Health Probes
- Liveness: `/health/live` (30s initial delay)
- Readiness: `/health/ready` (15s initial delay)

## File Structure

```
kubernetes/
├── 00-namespace.yaml           # Namespace: orderapp
├── 01-configmaps.yaml          # Environment configs for all services
├── 02-secrets.yaml             # Sensitive data (JWT, DB credentials, API keys)
├── 03-user-service.yaml        # User Service Deployment + Service
├── 04-product-service.yaml     # Product Service Deployment + Service
├── 05-order-service.yaml       # Order Service Deployment + Service
├── 06-payment-service.yaml     # Payment Service Deployment + Service
├── 07-notification-service.yaml # Notification Service Deployment + Service
├── 08-hpa.yaml                 # Horizontal Pod Autoscalers
├── 09-ingress.yaml             # Ingress rules for API and monitoring
├── 10-pdb.yaml                 # Pod Disruption Budgets
└── README.md                   # This file
```

## Deployment Steps

### 1. Install Prerequisites

**NGINX Ingress Controller:**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml
```

**cert-manager (for TLS):**
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

**Metrics Server (for HPA):**
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 2. Update Secrets

⚠️ **CRITICAL: Update all secrets before deployment!**

Edit `02-secrets.yaml` and replace placeholder values:
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- Database passwords: Use strong passwords
- `STRIPE_SECRET_KEY`: Your Stripe production key
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`: PayPal credentials
- `SMTP_USER` / `SMTP_PASSWORD`: Email service credentials

### 3. Update ConfigMaps

Edit `01-configmaps.yaml` for your environment:
- Service URLs (if using external databases)
- SMTP settings
- PayPal mode (sandbox → live)

### 4. Deploy to Kubernetes

```bash
# Navigate to kubernetes directory
cd infrastructure/kubernetes

# Apply manifests in order
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmaps.yaml
kubectl apply -f 02-secrets.yaml
kubectl apply -f 03-user-service.yaml
kubectl apply -f 04-product-service.yaml
kubectl apply -f 05-order-service.yaml
kubectl apply -f 06-payment-service.yaml
kubectl apply -f 07-notification-service.yaml
kubectl apply -f 08-hpa.yaml
kubectl apply -f 09-ingress.yaml
kubectl apply -f 10-pdb.yaml

# Or apply all at once
kubectl apply -f .
```

### 5. Verify Deployment

```bash
# Check namespace
kubectl get all -n orderapp

# Check pod status
kubectl get pods -n orderapp

# Check services
kubectl get svc -n orderapp

# Check HPA status
kubectl get hpa -n orderapp

# Check ingress
kubectl get ingress -n orderapp
```

### 6. Configure DNS

Point your domain to the Ingress LoadBalancer IP:
```bash
kubectl get ingress -n orderapp orderapp-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

Create DNS A records:
- `api.orderapp.com` → LoadBalancer IP
- `monitoring.orderapp.com` → LoadBalancer IP

### 7. Setup TLS Certificates

Create ClusterIssuer for Let's Encrypt:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply:
```bash
kubectl apply -f cluster-issuer.yaml
```

Certificates will be automatically provisioned by cert-manager.

## Monitoring & Observability

### Check Logs

```bash
# All pods in namespace
kubectl logs -n orderapp -l app=product-service --tail=100 -f

# Specific pod
kubectl logs -n orderapp <pod-name> -f

# Previous crashed pod
kubectl logs -n orderapp <pod-name> --previous
```

### Port Forwarding for Local Access

```bash
# Product Service
kubectl port-forward -n orderapp svc/product-service 3002:3002

# Grafana
kubectl port-forward -n orderapp svc/grafana 3000:3000

# Prometheus
kubectl port-forward -n orderapp svc/prometheus 9090:9090
```

### Exec into Pod

```bash
kubectl exec -it -n orderapp <pod-name> -- /bin/sh
```

## Scaling

### Manual Scaling

```bash
# Scale specific service
kubectl scale deployment -n orderapp product-service --replicas=5

# Check current replicas
kubectl get deployment -n orderapp
```

### HPA (Automatic)

HPA is configured to scale based on:
- CPU utilization (70% threshold)
- Memory utilization (80% threshold)

Check HPA status:
```bash
kubectl get hpa -n orderapp
kubectl describe hpa -n orderapp product-service-hpa
```

## Rolling Updates

```bash
# Update image
kubectl set image deployment/product-service -n orderapp product-service=orderapp/product-service:v2.0.0

# Check rollout status
kubectl rollout status deployment/product-service -n orderapp

# View rollout history
kubectl rollout history deployment/product-service -n orderapp

# Rollback to previous version
kubectl rollout undo deployment/product-service -n orderapp

# Rollback to specific revision
kubectl rollout undo deployment/product-service -n orderapp --to-revision=2
```

## Database Setup

⚠️ **Note:** This configuration assumes external managed databases. For production:

### PostgreSQL (Product & Order Services)
- Use managed services (AWS RDS, GCP Cloud SQL, Azure Database)
- Update connection strings in `02-secrets.yaml`
- Enable automated backups and replication

### MongoDB (User & Payment Services)
- Use managed services (MongoDB Atlas, AWS DocumentDB)
- Update connection strings in `02-secrets.yaml`
- Enable sharding for scalability

### Redis (Notification Service)
- Use managed services (AWS ElastiCache, GCP Memorystore, Azure Cache)
- Update connection string in `02-secrets.yaml`
- Enable persistence and clustering

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod -n orderapp <pod-name>

# Check logs
kubectl logs -n orderapp <pod-name>

# Check resource quotas
kubectl get resourcequota -n orderapp
```

### Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n orderapp

# Create Docker registry secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email> \
  -n orderapp

# Add to deployment
spec:
  imagePullSecrets:
  - name: regcred
```

### Service Not Reachable

```bash
# Check service endpoints
kubectl get endpoints -n orderapp

# Check network policies
kubectl get networkpolicy -n orderapp

# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n orderapp -- wget -qO- http://product-service:3002/health
```

### HPA Not Scaling

```bash
# Check metrics server
kubectl get apiservice v1beta1.metrics.k8s.io -o yaml

# Check pod metrics
kubectl top pods -n orderapp

# Check HPA events
kubectl describe hpa -n orderapp product-service-hpa
```

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to Git
   - Use external secret managers (AWS Secrets Manager, HashiCorp Vault)
   - Rotate secrets regularly

2. **Network Policies**
   - Implement NetworkPolicies to restrict pod-to-pod communication
   - Use service mesh (Istio/Linkerd) for mTLS

3. **RBAC**
   - Apply principle of least privilege
   - Create service accounts with minimal permissions

4. **Image Security**
   - Scan images for vulnerabilities
   - Use image signing
   - Pull from trusted registries only

5. **Pod Security**
   - Run containers as non-root users
   - Use read-only root filesystems
   - Set security contexts

## Backup Strategy

### Database Backups
- Configure automated daily backups
- Test restore procedures monthly
- Store backups in different region/zone

### Kubernetes Resources
```bash
# Backup all resources
kubectl get all -n orderapp -o yaml > backup-$(date +%Y%m%d).yaml

# Backup specific resources
kubectl get configmap,secret,deployment,service,ingress -n orderapp -o yaml > backup.yaml
```

## Disaster Recovery

### Service Failure
1. Check pod status and logs
2. Review recent deployments
3. Rollback if necessary
4. Scale horizontally if needed

### Database Failure
1. Promote read replica to primary
2. Update connection strings
3. Restore from backup if needed

### Complete Cluster Failure
1. Provision new cluster
2. Apply all manifests
3. Restore database from backups
4. Update DNS records

## Cost Optimization

1. **Right-sizing**
   - Monitor actual resource usage
   - Adjust requests/limits based on metrics
   - Use VPA (Vertical Pod Autoscaler)

2. **Spot Instances**
   - Use spot/preemptible nodes for non-critical workloads
   - Configure PodDisruptionBudgets

3. **Cluster Autoscaler**
   - Enable cluster autoscaler to scale nodes
   - Set appropriate min/max node counts

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Main Project Documentation](../../README.md)
- [Architecture Overview](../../docs/architecture-overview.md)
