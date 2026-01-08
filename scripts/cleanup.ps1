#Requires -Version 5.1
<#
.SYNOPSIS
    Cleanup script for OrderApp+ Kubernetes deployment

.DESCRIPTION
    This script provides various cleanup options for the OrderApp+ deployment
    including removing Kubernetes resources, cleaning Docker images, and
    destroying the Vagrant cluster.

.PARAMETER Target
    What to clean up: k8s, docker, vagrant, all, logs

.PARAMETER Force
    Skip confirmation prompts

.EXAMPLE
    .\cleanup.ps1 -Target k8s
    .\cleanup.ps1 -Target all -Force
    .\cleanup.ps1 -Target logs

.NOTES
    Use with caution - some operations are destructive and irreversible.
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("k8s", "docker", "vagrant", "all", "logs", "cache")]
    [string]$Target,

    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# Configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$VagrantDir = Join-Path $ProjectRoot "infrastructure\vagrant"

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Confirm action
function Confirm-Action {
    param([string]$Message)

    if ($Force) {
        return $true
    }

    Write-Warning "$Message (y/N)"
    $confirm = Read-Host
    return ($confirm -eq "y" -or $confirm -eq "Y")
}

# Clean Kubernetes resources
function Clear-Kubernetes {
    Write-Info "Cleaning Kubernetes resources..."

    # Check if kubectl is available
    $kubectl = Get-Command kubectl -ErrorAction SilentlyContinue
    if (-not $kubectl) {
        Write-Warning "kubectl not found, skipping Kubernetes cleanup"
        return
    }

    # Check connection
    $null = & kubectl cluster-info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Cannot connect to Kubernetes cluster, skipping cleanup"
        return
    }

    if (-not (Confirm-Action "Delete all OrderApp+ Kubernetes resources?")) {
        return
    }

    Write-Info "Deleting orderapp namespace..."
    & kubectl delete namespace orderapp --ignore-not-found=true --timeout=120s

    Write-Info "Deleting monitoring namespace..."
    & kubectl delete namespace monitoring --ignore-not-found=true --timeout=120s

    Write-Info "Deleting sonarqube namespace..."
    & kubectl delete namespace sonarqube --ignore-not-found=true --timeout=120s

    Write-Info "Cleaning up cluster-wide resources..."
    & kubectl delete clusterrole prometheus --ignore-not-found=true
    & kubectl delete clusterrolebinding prometheus --ignore-not-found=true

    # Clean PVs if any are in Released state
    Write-Info "Cleaning up released PersistentVolumes..."
    $pvs = & kubectl get pv -o jsonpath='{.items[?(@.status.phase=="Released")].metadata.name}' 2>$null
    if ($pvs) {
        foreach ($pv in $pvs.Split(" ")) {
            if ($pv) {
                & kubectl delete pv $pv --ignore-not-found=true
            }
        }
    }

    Write-Success "Kubernetes resources cleaned"
}

# Clean Docker resources
function Clear-Docker {
    Write-Info "Cleaning Docker resources..."

    # Check if Docker is available
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $docker) {
        Write-Warning "Docker not found, skipping Docker cleanup"
        return
    }

    if (-not (Confirm-Action "Delete all OrderApp+ Docker images and unused resources?")) {
        return
    }

    Write-Info "Removing OrderApp+ images..."
    $images = & docker images --filter "reference=*orderapp*" -q 2>$null
    if ($images) {
        & docker rmi $images -f 2>$null
    }

    $images = & docker images --filter "reference=ghcr.io/*/orderapp/*" -q 2>$null
    if ($images) {
        & docker rmi $images -f 2>$null
    }

    Write-Info "Removing dangling images..."
    & docker image prune -f

    Write-Info "Removing unused volumes..."
    & docker volume prune -f

    Write-Info "Removing unused networks..."
    & docker network prune -f

    Write-Info "Removing build cache..."
    & docker builder prune -f

    Write-Success "Docker resources cleaned"

    # Show remaining disk usage
    Write-Info "Current Docker disk usage:"
    & docker system df
}

# Clean Vagrant/VirtualBox resources
function Clear-Vagrant {
    Write-Info "Cleaning Vagrant/VirtualBox resources..."

    # Check if Vagrant is available
    $vagrant = Get-Command vagrant -ErrorAction SilentlyContinue
    if (-not $vagrant) {
        Write-Warning "Vagrant not found, skipping Vagrant cleanup"
        return
    }

    if (-not (Confirm-Action "Destroy all Vagrant VMs? This is irreversible!")) {
        return
    }

    Push-Location $VagrantDir
    try {
        Write-Info "Destroying Vagrant VMs..."
        & vagrant destroy -f

        Write-Info "Removing Vagrant box cache..."
        & vagrant box prune -f

        # Clean up shared folder
        $sharedDir = Join-Path $VagrantDir "shared"
        if (Test-Path $sharedDir) {
            Write-Info "Cleaning shared folder..."
            Remove-Item -Path "$sharedDir\*" -Force -ErrorAction SilentlyContinue
        }

        # Remove .vagrant folder
        $vagrantHidden = Join-Path $VagrantDir ".vagrant"
        if (Test-Path $vagrantHidden) {
            Write-Info "Removing .vagrant folder..."
            Remove-Item -Path $vagrantHidden -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    finally {
        Pop-Location
    }

    # Clean kubeconfig
    $kubeConfig = Join-Path $env:USERPROFILE ".kube\config"
    if (Test-Path $kubeConfig) {
        if (Confirm-Action "Remove kubeconfig file?") {
            Remove-Item $kubeConfig -Force
            Write-Info "kubeconfig removed"
        }
    }

    Write-Success "Vagrant resources cleaned"
}

# Clean log files
function Clear-Logs {
    Write-Info "Cleaning log files..."

    $logPaths = @(
        (Join-Path $ProjectRoot "services\*\logs"),
        (Join-Path $ProjectRoot "services\*\*.log"),
        (Join-Path $ProjectRoot "logs"),
        (Join-Path $ProjectRoot "*.log")
    )

    foreach ($path in $logPaths) {
        $files = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            Write-Info "  Removing $($file.FullName)"
            Remove-Item $file.FullName -Force -Recurse -ErrorAction SilentlyContinue
        }
    }

    Write-Success "Log files cleaned"
}

# Clean cache and temporary files
function Clear-Cache {
    Write-Info "Cleaning cache and temporary files..."

    $cachePaths = @(
        (Join-Path $ProjectRoot "services\*\node_modules"),
        (Join-Path $ProjectRoot "services\*\.cache"),
        (Join-Path $ProjectRoot "services\*\coverage"),
        (Join-Path $ProjectRoot "services\*\dist"),
        (Join-Path $ProjectRoot ".scannerwork"),
        (Join-Path $ProjectRoot ".sonar")
    )

    if (-not (Confirm-Action "Delete node_modules and cache folders? You'll need to run npm install again.")) {
        return
    }

    foreach ($path in $cachePaths) {
        $folders = Get-ChildItem -Path $path -Directory -ErrorAction SilentlyContinue
        foreach ($folder in $folders) {
            Write-Info "  Removing $($folder.FullName)"
            Remove-Item $folder.FullName -Force -Recurse -ErrorAction SilentlyContinue
        }

        # Also handle as files
        if (Test-Path $path) {
            Remove-Item $path -Force -Recurse -ErrorAction SilentlyContinue
        }
    }

    # Clean npm cache
    Write-Info "Cleaning npm cache..."
    & npm cache clean --force 2>$null

    Write-Success "Cache cleaned"
}

# Clean everything
function Clear-All {
    Write-Warning "This will clean ALL resources (Kubernetes, Docker, Vagrant)."
    Write-Warning "This action is IRREVERSIBLE!"

    if (-not (Confirm-Action "Are you absolutely sure?")) {
        return
    }

    Clear-Kubernetes
    Clear-Docker
    Clear-Vagrant
    Clear-Logs
    Clear-Cache

    Write-Host ""
    Write-Success "All resources cleaned!"
    Write-Host ""
    Write-Info "To redeploy, run:"
    Write-Info "  1. .\scripts\setup-cluster.ps1 -Action start"
    Write-Info "  2. .\scripts\deploy-apps.ps1 -Component all"
}

# Main execution
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   OrderApp+ Cleanup Script            " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

switch ($Target) {
    "k8s" { Clear-Kubernetes }
    "docker" { Clear-Docker }
    "vagrant" { Clear-Vagrant }
    "logs" { Clear-Logs }
    "cache" { Clear-Cache }
    "all" { Clear-All }
}

Write-Host ""
