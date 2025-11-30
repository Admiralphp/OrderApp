# Monitoring Stack Documentation

## Overview

The OrderApp+ monitoring stack consists of:
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Metrics visualization and dashboards
- **Elasticsearch**: Log storage
- **Logstash**: Log processing and aggregation
- **Kibana**: Log visualization and analysis

## Architecture

```
┌─────────────────┐
│  Microservices  │
│  (Metrics @     │
│   /metrics)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────┐
│   Prometheus    │◄─────┤   Alerts    │
│  (Port 9090)    │      │   Manager   │
└────────┬────────┘      └─────────────┘
         │
         ▼
┌─────────────────┐
│    Grafana      │
│  (Port 3000)    │
└─────────────────┘

┌─────────────────┐
│  Microservices  │
│  (JSON Logs)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Logstash     │
│  (Port 5000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────┐
│ Elasticsearch   │◄─────┤   Kibana    │
│  (Port 9200)    │      │ (Port 5601) │
└─────────────────┘      └─────────────┘
```

## Directory Structure

```
monitoring/
├── prometheus/
│   ├── prometheus.yml          # Prometheus configuration
│   ├── alerts.yml              # Alert rules
│   └── README.md
├── grafana/
│   ├── datasources/
│   │   └── prometheus.yml      # Prometheus datasource
│   ├── dashboards/
│   │   └── dashboard-provider.yml  # Dashboard provisioning
│   └── README.md
├── logstash/
│   ├── logstash.conf           # Logstash pipeline
│   └── README.md
└── README.md                   # This file
```

## Prometheus Configuration

### Scrape Targets

Prometheus scrapes metrics from the following targets every 15 seconds:

1. **Microservices** (auto-discovery via Kubernetes)
   - user-service:3001/metrics
   - product-service:3002/metrics
   - order-service:3003/metrics
   - payment-service:3004/metrics
   - notification-service:3005/metrics

2. **Database Exporters**
   - PostgreSQL Exporter (port 9187)
   - MongoDB Exporter (port 9216)
   - Redis Exporter (port 9121)

3. **Kubernetes Metrics**
   - Nodes
   - Pods
   - Services

### Metrics Collected

Each microservice exposes the following metrics:

**HTTP Metrics:**
- `http_request_total`: Total HTTP requests (counter)
- `http_request_duration_seconds`: Request duration histogram
- `http_request_size_bytes`: Request size histogram
- `http_response_size_bytes`: Response size histogram

**Database Metrics:**
- `db_connections_active`: Active database connections
- `db_connections_max`: Maximum connections
- `db_query_duration_seconds`: Query execution time

**Custom Metrics:**
- `payment_transaction_total`: Payment transactions count
- `email_sent_total`: Emails sent count
- `redis_queue_length`: Queue lengths

### Alert Rules

Prometheus evaluates 20+ alert rules covering:

**Service Health:**
- Service down
- High restart rate
- Crash loops

**Performance:**
- High HTTP error rate (>5%)
- High latency (p95 > 1s)
- Slow database queries (p95 > 2s)

**Resources:**
- High CPU usage (>80%)
- High memory usage (>85%)
- OOM kills

**Business Metrics:**
- High payment failure rate (>10%)
- Email queue backlog
- High email failure rate (>20%)

**Kubernetes:**
- Pods not ready
- Nodes not ready
- HPA maxed out

## Grafana Dashboards

### Access

- **URL**: http://localhost:3000 (local) or https://monitoring.orderapp.com/grafana (production)
- **Default Credentials**: admin / admin (change on first login)

### Pre-configured Dashboards

1. **OrderApp+ Overview**
   - Service health status
   - Request rate and latency
   - Error rates
   - Resource usage

2. **Service Details** (per microservice)
   - HTTP metrics
   - Response times
   - Top endpoints
   - Error breakdown

3. **Database Performance**
   - Connection pool usage
   - Query performance
   - Slow queries
   - Transaction rates

4. **Kubernetes Cluster**
   - Node resources
   - Pod status
   - Namespace overview
   - HPA activity

5. **Business Metrics**
   - Payment transactions
   - Order funnel
   - Email delivery
   - User registrations

### Creating Custom Dashboards

1. Log in to Grafana
2. Click "+" → "Dashboard"
3. Add panel with PromQL query
4. Configure visualization
5. Save dashboard

**Example PromQL Queries:**

Request rate:
```promql
sum(rate(http_request_total[5m])) by (service)
```

Error rate:
```promql
sum(rate(http_request_total{status=~"5.."}[5m])) by (service)
```

P95 latency:
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
```

## Logstash Configuration

### Log Pipeline

1. **Input**: Receives JSON logs via TCP/UDP on port 5000
2. **Filter**: Parses, enriches, and transforms logs
3. **Output**: Sends to Elasticsearch

### Log Format

Microservices should log in JSON format:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "service": "product-service",
  "message": "Product created successfully",
  "userId": "user123",
  "correlationId": "abc-def-ghi",
  "method": "POST",
  "url": "/api/v1/products",
  "statusCode": 201,
  "responseTime": 145,
  "clientIp": "192.168.1.100"
}
```

### Log Enrichment

Logstash automatically:
- Parses JSON structure
- Extracts HTTP metadata
- Tags critical errors
- Identifies slow requests
- Adds geolocation for IPs
- Extracts trace IDs for correlation

## Elasticsearch & Kibana

### Elasticsearch

**Index Pattern**: `orderapp-YYYY.MM.DD`

**Retention Policy**: 30 days (configure in ILM policy)

**Query Examples:**

Search for errors in last hour:
```
GET /orderapp-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "ERROR" } },
        { "range": { "timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}
```

### Kibana

**URL**: http://localhost:5601 (local) or https://monitoring.orderapp.com/kibana (production)

**Index Pattern Setup:**
1. Go to Management → Index Patterns
2. Create pattern: `orderapp-*`
3. Select timestamp field: `timestamp`

**Discover Queries:**

Filter by service:
```
service: "product-service"
```

Find slow requests:
```
responseTime > 1000
```

Search for specific user:
```
userId: "user123"
```

Find errors with trace:
```
level: ERROR AND correlationId: *
```

**Visualizations:**

1. **Log Volume**: Line chart of log count over time
2. **Error Rate**: Percentage of ERROR logs
3. **Top Services**: Pie chart of logs by service
4. **Response Time Distribution**: Histogram of responseTime
5. **Geographic Distribution**: Map of clientIp locations

## Accessing Monitoring Tools

### Local Development (Docker Compose)

```bash
# Start monitoring stack
docker-compose up -d

# Access URLs
Prometheus:     http://localhost:9090
Grafana:        http://localhost:3000
Kibana:         http://localhost:5601
Elasticsearch:  http://localhost:9200
```

### Production (Kubernetes)

```bash
# Port forward to access locally
kubectl port-forward -n orderapp svc/prometheus 9090:9090
kubectl port-forward -n orderapp svc/grafana 3000:3000
kubectl port-forward -n orderapp svc/kibana 5601:5601

# Or access via Ingress
https://monitoring.orderapp.com/prometheus
https://monitoring.orderapp.com/grafana
https://monitoring.orderapp.com/kibana
```

## Alert Notifications

### Slack Integration

1. **Create Slack App**: https://api.slack.com/apps
2. **Enable Incoming Webhooks**
3. **Add webhook URL to Alertmanager config**

**Alertmanager Configuration:**

```yaml
route:
  receiver: 'slack-notifications'
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 4h

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'YOUR_WEBHOOK_URL'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

### Email Notifications

```yaml
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'ops@orderapp.com'
        from: 'alerts@orderapp.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@orderapp.com'
        auth_password: 'YOUR_APP_PASSWORD'
```

## Monitoring Best Practices

### Metrics

1. **Use labels wisely**: Don't use high-cardinality values (like user IDs) as labels
2. **Instrument code**: Add metrics at key points (API endpoints, database queries, external calls)
3. **Use histograms**: For timing metrics (request duration, query time)
4. **Use counters**: For events (requests, errors, transactions)
5. **Use gauges**: For current state (active connections, queue length)

### Logging

1. **Structured logging**: Always log in JSON format
2. **Include context**: userId, correlationId, service name
3. **Log levels**: INFO for normal, WARN for issues, ERROR for failures
4. **Correlation IDs**: Use for request tracing across services
5. **Avoid sensitive data**: Never log passwords, tokens, credit cards

### Alerting

1. **Alert on symptoms, not causes**: Alert when users are affected
2. **Actionable alerts**: Every alert should require human action
3. **Reduce noise**: Tune thresholds to avoid false positives
4. **Escalation**: Route critical alerts to on-call engineers
5. **Documentation**: Include runbooks in alert annotations

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service /metrics endpoint
curl http://product-service:3002/metrics

# View Prometheus logs
docker logs orderapp-prometheus
```

### Grafana Dashboard Not Loading

```bash
# Check Prometheus datasource
curl -u admin:admin http://localhost:3000/api/datasources

# Check Grafana logs
docker logs orderapp-grafana
```

### Logs Not Appearing in Kibana

```bash
# Check Logstash pipeline
curl http://localhost:9600/_node/stats/pipelines

# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices?v

# View Logstash logs
docker logs orderapp-logstash
```

## Performance Tuning

### Prometheus

- Increase retention: `--storage.tsdb.retention.time=30d`
- Reduce scrape interval for less critical metrics
- Use recording rules for expensive queries

### Elasticsearch

- Increase heap size: `ES_JAVA_OPTS=-Xms2g -Xmx2g`
- Configure ILM for automatic index rotation
- Use index templates for field mappings

### Logstash

- Increase batch size: `pipeline.batch.size: 250`
- Add worker threads: `pipeline.workers: 4`
- Use persistent queues for reliability

## Security

1. **Authentication**: Enable authentication for all tools
2. **TLS**: Use HTTPS for all monitoring endpoints
3. **RBAC**: Implement role-based access control
4. **Secrets**: Store credentials in Kubernetes Secrets
5. **Network Policies**: Restrict access between components

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/)
- [Main Project README](../README.md)
- [Architecture Overview](../docs/architecture-overview.md)
