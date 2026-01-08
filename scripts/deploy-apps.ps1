#Requires -Version 5.1
<#
.SYNOPSIS
    Deploy OrderApp+ applications to Kubernetes cluster

.DESCRIPTION
    This script deploys all OrderApp+ components including databases,
    microservices, monitoring stack, and SonarQube to the Kubernetes cluster.

.PARAMETER Component
    The component to deploy: all, databases, services, monitoring, sonarqube, ingress

.PARAMETER Environment
    The target environment: development, staging, production

.PARAMETER Action
    The action to perform: deploy, delete, status, logs

.PARAMETER Service
    Specific service for logs action

.EXAMPLE
    .\deploy-apps.ps1 -Component all -Environment development -Action deploy
    .\deploy-apps.ps1 -Component services -Action status
    .\deploy-apps.ps1 -Action logs -Service user-service

.NOTES
    Prerequisites:
    - kubectl configured with cluster access
    - Kubernetes cluster running
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "databases", "services", "monitoring", "sonarqube", "ingress", "base")]
    [string]$Component = "all",

    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development",

    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "delete", "status", "logs", "restart")]
    [string]$Action = "deploy",

    [Parameter(Mandatory=$false)]
    [ValidateSet("user-service", "product-service", "order-service", "payment-service", "notification-service")]
    [string]$Service
)

# Configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$K8sDir = Join-Path $ProjectRoot "infrastructure\kubernetes"
$MonitoringDir = Join-Path $ProjectRoot "monitoring\kubernetes"

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Check kubectl connection
function Test-KubeConnection {
    Write-Info "Testing Kubernetes connection..."

    try {
        $null = & kubectl cluster-info 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Cannot connect to cluster"
        }
        Write-Success "Connected to Kubernetes cluster"
        return $true
    }
    catch {
        Write-Error "Cannot connect to Kubernetes cluster"
        Write-Info "Ensure the cluster is running and kubectl is configured"
        return $false
    }
}

# Apply Kubernetes manifests from a directory
function Deploy-Manifests {
    param(
        [string]$Path,
        [string]$Description
    )

    if (-not (Test-Path $Path)) {
        Write-Warning "Path not found: $Path"
        return $false
    }

    Write-Info "Deploying $Description..."

    # Get all YAML files sorted by name (for ordering)
    $yamlFiles = Get-ChildItem -Path $Path -Filter "*.yaml" -Recurse | Sort-Object Name

    foreach ($file in $yamlFiles) {
        Write-Info "  Applying $($file.Name)..."
        & kubectl apply -f $file.FullName
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "  Failed to apply $($file.Name)"
        }
    }

    Write-Success "$Description deployed"
    return $true
}

# Delete Kubernetes manifests from a directory
function Remove-Manifests {
    param(
        [string]$Path,
        [string]$Description
    )

    if (-not (Test-Path $Path)) {
        Write-Warning "Path not found: $Path"
        return $false
    }

    Write-Info "Removing $Description..."

    & kubectl delete -f $Path --ignore-not-found=true

    Write-Success "$Description removed"
    return $true
}

# Deploy base infrastructure (namespaces, RBAC)
function Deploy-Base {
    Write-Info "Deploying base infrastructure..."

    $basePath = Join-Path $K8sDir "base"
    Deploy-Manifests -Path $basePath -Description "Base infrastructure"
}

# Deploy databases
function Deploy-Databases {
    Write-Info "Deploying databases..."

    $dbPath = Join-Path $K8sDir "databases"
    Deploy-Manifests -Path $dbPath -Description "Databases (MongoDB, PostgreSQL, Redis)"

    # Wait for databases to be ready
    Write-Info "Waiting for databases to be ready..."
    Start-Sleep -Seconds 10

    $databases = @("mongodb-user", "mongodb-payment", "postgresql-product", "postgresql-order", "redis-notification")
    foreach ($db in $databases) {
        Write-Info "  Waiting for $db..."
        & kubectl wait --for=condition=available deployment/$db -n orderapp --timeout=300s 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  $db is ready"
        } else {
            Write-Warning "  $db may not be ready yet"
        }
    }
}

# Deploy ConfigMaps and Secrets
function Deploy-Config {
    Write-Info "Deploying ConfigMaps and Secrets..."

    $configPath = Join-Path $K8sDir "configmaps"
    Deploy-Manifests -Path $configPath -Description "ConfigMaps"

    $secretsPath = Join-Path $K8sDir "secrets"
    Deploy-Manifests -Path $secretsPath -Description "Secrets"
}

# Deploy microservices
function Deploy-Services {
    Write-Info "Deploying microservices..."

    # Deploy configs first
    Deploy-Config

    $servicesPath = Join-Path $K8sDir "services"
    Deploy-Manifests -Path $servicesPath -Description "Microservices"

    # Wait for services to be ready
    Write-Info "Waiting for services to be ready..."

    $services = @("user-service", "product-service", "order-service", "payment-service", "notification-service")
    foreach ($svc in $services) {
        Write-Info "  Waiting for $svc..."
        & kubectl wait --for=condition=available deployment/$svc -n orderapp --timeout=300s 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  $svc is ready"
        } else {
            Write-Warning "  $svc may not be ready yet"
        }
    }

    # Deploy HPA
    $hpaPath = Join-Path $K8sDir "hpa"
    Deploy-Manifests -Path $hpaPath -Description "Horizontal Pod Autoscalers"
}

# Deploy Ingress
function Deploy-Ingress {
    Write-Info "Deploying Ingress..."

    $ingressPath = Join-Path $K8sDir "ingress"
    Deploy-Manifests -Path $ingressPath -Description "Ingress resources"
}

# Deploy monitoring stack
function Deploy-Monitoring {
    Write-Info "Deploying monitoring stack..."

    # Deploy namespace first
    $nsFile = Join-Path $MonitoringDir "00-namespace.yaml"
    if (Test-Path $nsFile) {
        & kubectl apply -f $nsFile
    }

    # Deploy Prometheus
    $prometheusPath = Join-Path $MonitoringDir "prometheus"
    Deploy-Manifests -Path $prometheusPath -Description "Prometheus"

    # Deploy Grafana
    $grafanaPath = Join-Path $MonitoringDir "grafana"
    Deploy-Manifests -Path $grafanaPath -Description "Grafana"

    # Deploy ELK Stack
    $elkPath = Join-Path $MonitoringDir "elk"
    Deploy-Manifests -Path $elkPath -Description "ELK Stack"

    Write-Info "Waiting for monitoring components..."
    Start-Sleep -Seconds 30

    Write-Success "Monitoring stack deployed"
    Write-Info "Access URLs (add to hosts file):"
    Write-Info "  Grafana: http://monitoring.orderapp.local/grafana (admin/orderapp2024)"
    Write-Info "  Prometheus: http://monitoring.orderapp.local/prometheus"
    Write-Info "  Kibana: http://monitoring.orderapp.local/kibana"
}

# Deploy SonarQube
function Deploy-SonarQube {
    Write-Info "Deploying SonarQube..."

    $sonarPath = Join-Path $K8sDir "sonarqube"
    Deploy-Manifests -Path $sonarPath -Description "SonarQube"

    Write-Info "Waiting for SonarQube (this may take a few minutes)..."
    & kubectl wait --for=condition=available deployment/sonarqube -n sonarqube --timeout=600s 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Success "SonarQube is ready"
        Write-Info "Access URL: http://sonarqube.orderapp.local (admin/admin)"
    } else {
        Write-Warning "SonarQube may not be ready yet. Check with: kubectl get pods -n sonarqube"
    }
}

# Get deployment status
function Get-DeploymentStatus {
    Write-Info "Getting deployment status..."
    Write-Host ""

    Write-Host "=== Namespaces ===" -ForegroundColor Yellow
    & kubectl get namespaces | Select-String -Pattern "orderapp|monitoring|sonarqube|ingress"
    Write-Host ""

    Write-Host "=== OrderApp Pods ===" -ForegroundColor Yellow
    & kubectl get pods -n orderapp -o wide
    Write-Host ""

    Write-Host "=== OrderApp Services ===" -ForegroundColor Yellow
    & kubectl get svc -n orderapp
    Write-Host ""

    Write-Host "=== Monitoring Pods ===" -ForegroundColor Yellow
    & kubectl get pods -n monitoring -o wide 2>$null
    Write-Host ""

    Write-Host "=== SonarQube Pods ===" -ForegroundColor Yellow
    & kubectl get pods -n sonarqube -o wide 2>$null
    Write-Host ""

    Write-Host "=== Ingress ===" -ForegroundColor Yellow
    & kubectl get ingress -A
    Write-Host ""

    Write-Host "=== HPA Status ===" -ForegroundColor Yellow
    & kubectl get hpa -n orderapp 2>$null
}

# Get service logs
function Get-ServiceLogs {
    param([string]$ServiceName)

    if (-not $ServiceName) {
        Write-Error "Please specify a service with -Service parameter"
        return
    }

    Write-Info "Getting logs for $ServiceName..."
    & kubectl logs -l app=$ServiceName -n orderapp --tail=100 -f
}

# Restart services
function Restart-Services {
    Write-Info "Restarting all services..."

    $services = @("user-service", "product-service", "order-service", "payment-service", "notification-service")
    foreach ($svc in $services) {
        Write-Info "  Restarting $svc..."
        & kubectl rollout restart deployment/$svc -n orderapp
    }

    Write-Info "Waiting for rollout to complete..."
    foreach ($svc in $services) {
        & kubectl rollout status deployment/$svc -n orderapp --timeout=120s
    }

    Write-Success "All services restarted"
}

# Delete component
function Remove-Component {
    param([string]$ComponentName)

    Write-Warning "This will delete $ComponentName. Are you sure? (y/N)"
    $confirm = Read-Host
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Info "Cancelled"
        return
    }

    switch ($ComponentName) {
        "databases" {
            Remove-Manifests -Path (Join-Path $K8sDir "databases") -Description "Databases"
        }
        "services" {
            Remove-Manifests -Path (Join-Path $K8sDir "services") -Description "Services"
            Remove-Manifests -Path (Join-Path $K8sDir "hpa") -Description "HPAs"
        }
        "monitoring" {
            & kubectl delete namespace monitoring --ignore-not-found=true
        }
        "sonarqube" {
            & kubectl delete namespace sonarqube --ignore-not-found=true
        }
        "ingress" {
            Remove-Manifests -Path (Join-Path $K8sDir "ingress") -Description "Ingress"
        }
        "all" {
            & kubectl delete namespace orderapp --ignore-not-found=true
            & kubectl delete namespace monitoring --ignore-not-found=true
            & kubectl delete namespace sonarqube --ignore-not-found=true
        }
    }

    Write-Success "$ComponentName deleted"
}

# Deploy all components
function Deploy-All {
    Write-Info "Deploying all OrderApp+ components..."
    Write-Host ""

    Deploy-Base
    Start-Sleep -Seconds 5

    Deploy-Databases
    Start-Sleep -Seconds 10

    Deploy-Services
    Start-Sleep -Seconds 5

    Deploy-Ingress

    Deploy-Monitoring

    Deploy-SonarQube

    Write-Host ""
    Write-Success "All components deployed!"
    Write-Host ""

    # Show status
    Get-DeploymentStatus

    Write-Host ""
    Write-Info "Add these entries to your hosts file (C:\Windows\System32\drivers\etc\hosts):"
    Write-Host "192.168.56.200  api.orderapp.local" -ForegroundColor Yellow
    Write-Host "192.168.56.200  monitoring.orderapp.local" -ForegroundColor Yellow
    Write-Host "192.168.56.200  sonarqube.orderapp.local" -ForegroundColor Yellow
}

# Main execution
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   OrderApp+ Deployment Script         " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Check kubectl
if (-not (Test-KubeConnection)) {
    exit 1
}

# Execute action
switch ($Action) {
    "deploy" {
        switch ($Component) {
            "all" { Deploy-All }
            "base" { Deploy-Base }
            "databases" { Deploy-Databases }
            "services" { Deploy-Services }
            "monitoring" { Deploy-Monitoring }
            "sonarqube" { Deploy-SonarQube }
            "ingress" { Deploy-Ingress }
        }
    }
    "delete" {
        Remove-Component -ComponentName $Component
    }
    "status" {
        Get-DeploymentStatus
    }
    "logs" {
        Get-ServiceLogs -ServiceName $Service
    }
    "restart" {
        Restart-Services
    }
}

Write-Host ""
