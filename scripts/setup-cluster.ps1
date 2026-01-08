#Requires -Version 5.1
<#
.SYNOPSIS
    Setup Kubernetes cluster for OrderApp+ using Vagrant and VirtualBox

.DESCRIPTION
    This script provisions a 3-node Kubernetes cluster (1 master + 2 workers)
    using Vagrant and VirtualBox, then configures kubectl for local access.

.PARAMETER Action
    The action to perform: start, stop, status, destroy, ssh

.PARAMETER Node
    The node to SSH into (k8s-master, k8s-worker1, k8s-worker2)

.EXAMPLE
    .\setup-cluster.ps1 -Action start
    .\setup-cluster.ps1 -Action status
    .\setup-cluster.ps1 -Action ssh -Node k8s-master
    .\setup-cluster.ps1 -Action destroy

.NOTES
    Prerequisites:
    - VirtualBox 7.0+
    - Vagrant 2.4+
    - At least 16GB RAM
    - At least 50GB free disk space
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "status", "destroy", "ssh", "provision", "reload")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [ValidateSet("k8s-master", "k8s-worker1", "k8s-worker2")]
    [string]$Node = "k8s-master"
)

# Configuration
$ErrorActionPreference = "Stop"
$VagrantDir = Join-Path $PSScriptRoot "..\infrastructure\vagrant"
$KubeConfigDir = Join-Path $env:USERPROFILE ".kube"
$KubeConfigFile = Join-Path $KubeConfigDir "config"

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."

    # Check VirtualBox
    $vboxManage = Get-Command VBoxManage -ErrorAction SilentlyContinue
    if (-not $vboxManage) {
        Write-Error "VirtualBox is not installed or not in PATH"
        Write-Info "Download from: https://www.virtualbox.org/wiki/Downloads"
        exit 1
    }
    $vboxVersion = & VBoxManage --version
    Write-Success "VirtualBox version: $vboxVersion"

    # Check Vagrant
    $vagrant = Get-Command vagrant -ErrorAction SilentlyContinue
    if (-not $vagrant) {
        Write-Error "Vagrant is not installed or not in PATH"
        Write-Info "Download from: https://www.vagrantup.com/downloads"
        exit 1
    }
    $vagrantVersion = & vagrant --version
    Write-Success "Vagrant version: $vagrantVersion"

    # Check kubectl (optional but recommended)
    $kubectl = Get-Command kubectl -ErrorAction SilentlyContinue
    if (-not $kubectl) {
        Write-Warning "kubectl is not installed. Install it for cluster management."
        Write-Info "Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/"
    } else {
        $kubectlVersion = (& kubectl version --client -o json 2>$null | ConvertFrom-Json).clientVersion.gitVersion
        Write-Success "kubectl version: $kubectlVersion"
    }

    # Check available resources
    $ram = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
    if ($ram -lt 16) {
        Write-Warning "System has less than 16GB RAM ($([math]::Round($ram, 2))GB). Cluster may be slow."
    } else {
        Write-Success "System RAM: $([math]::Round($ram, 2))GB"
    }

    # Check disk space
    $drive = (Get-Item $VagrantDir).PSDrive.Name
    $freeSpace = (Get-PSDrive $drive).Free / 1GB
    if ($freeSpace -lt 50) {
        Write-Warning "Less than 50GB free disk space on drive $drive ($([math]::Round($freeSpace, 2))GB)"
    } else {
        Write-Success "Free disk space on $drive`: $([math]::Round($freeSpace, 2))GB"
    }

    Write-Info "Prerequisites check completed"
}

# Start the cluster
function Start-Cluster {
    Write-Info "Starting Kubernetes cluster..."

    Push-Location $VagrantDir
    try {
        # Create shared directory if it doesn't exist
        $sharedDir = Join-Path $VagrantDir "shared"
        if (-not (Test-Path $sharedDir)) {
            New-Item -ItemType Directory -Path $sharedDir -Force | Out-Null
        }

        # Start VMs
        Write-Info "Provisioning VMs (this may take 15-30 minutes on first run)..."
        & vagrant up

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to start VMs"
            exit 1
        }

        Write-Success "VMs started successfully"

        # Setup kubeconfig
        Setup-KubeConfig

        Write-Success "Cluster is ready!"
        Write-Info "Run 'kubectl get nodes' to verify"
    }
    finally {
        Pop-Location
    }
}

# Setup kubeconfig for local kubectl access
function Setup-KubeConfig {
    Write-Info "Setting up kubeconfig..."

    # Create .kube directory if it doesn't exist
    if (-not (Test-Path $KubeConfigDir)) {
        New-Item -ItemType Directory -Path $KubeConfigDir -Force | Out-Null
    }

    Push-Location $VagrantDir
    try {
        # Copy kubeconfig from master node
        Write-Info "Copying kubeconfig from master node..."
        & vagrant ssh k8s-master -c "sudo cat /etc/kubernetes/admin.conf" > $KubeConfigFile 2>$null

        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $KubeConfigFile)) {
            Write-Warning "Could not copy kubeconfig automatically"
            Write-Info "Try manually: vagrant ssh k8s-master -c 'sudo cat /etc/kubernetes/admin.conf' > ~/.kube/config"
            return
        }

        # Update server address to use master IP
        $config = Get-Content $KubeConfigFile -Raw
        $config = $config -replace "server: https://[^:]+:6443", "server: https://192.168.56.10:6443"
        $config | Set-Content $KubeConfigFile

        Write-Success "kubeconfig configured at $KubeConfigFile"
    }
    finally {
        Pop-Location
    }
}

# Stop the cluster
function Stop-Cluster {
    Write-Info "Stopping Kubernetes cluster..."

    Push-Location $VagrantDir
    try {
        & vagrant halt
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Cluster stopped"
        } else {
            Write-Error "Failed to stop cluster"
        }
    }
    finally {
        Pop-Location
    }
}

# Get cluster status
function Get-ClusterStatus {
    Write-Info "Getting cluster status..."

    Push-Location $VagrantDir
    try {
        & vagrant status

        # If kubectl is available and cluster is running, show node status
        $kubectl = Get-Command kubectl -ErrorAction SilentlyContinue
        if ($kubectl -and (Test-Path $KubeConfigFile)) {
            Write-Info ""
            Write-Info "Kubernetes nodes status:"
            & kubectl get nodes -o wide 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Info ""
                Write-Info "Kubernetes namespaces:"
                & kubectl get namespaces
            }
        }
    }
    finally {
        Pop-Location
    }
}

# Destroy the cluster
function Remove-Cluster {
    Write-Warning "This will destroy all VMs and data. Are you sure? (y/N)"
    $confirm = Read-Host
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Info "Cancelled"
        return
    }

    Write-Info "Destroying Kubernetes cluster..."

    Push-Location $VagrantDir
    try {
        & vagrant destroy -f
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Cluster destroyed"

            # Clean up shared directory
            $sharedDir = Join-Path $VagrantDir "shared"
            if (Test-Path $sharedDir) {
                Remove-Item -Path "$sharedDir\*" -Force -ErrorAction SilentlyContinue
            }
        } else {
            Write-Error "Failed to destroy cluster"
        }
    }
    finally {
        Pop-Location
    }
}

# SSH into a node
function Enter-Node {
    param([string]$NodeName)

    Write-Info "Connecting to $NodeName..."

    Push-Location $VagrantDir
    try {
        & vagrant ssh $NodeName
    }
    finally {
        Pop-Location
    }
}

# Provision/re-provision nodes
function Invoke-Provision {
    Write-Info "Re-provisioning cluster..."

    Push-Location $VagrantDir
    try {
        & vagrant provision
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Provisioning completed"
        } else {
            Write-Error "Provisioning failed"
        }
    }
    finally {
        Pop-Location
    }
}

# Reload VMs
function Invoke-Reload {
    Write-Info "Reloading cluster VMs..."

    Push-Location $VagrantDir
    try {
        & vagrant reload
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Reload completed"
        } else {
            Write-Error "Reload failed"
        }
    }
    finally {
        Pop-Location
    }
}

# Main execution
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  OrderApp+ Kubernetes Cluster Setup   " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Check if Vagrantfile exists
if (-not (Test-Path (Join-Path $VagrantDir "Vagrantfile"))) {
    Write-Error "Vagrantfile not found at $VagrantDir"
    Write-Info "Please ensure the infrastructure/vagrant/Vagrantfile exists"
    exit 1
}

switch ($Action) {
    "start" {
        Test-Prerequisites
        Start-Cluster
    }
    "stop" {
        Stop-Cluster
    }
    "status" {
        Get-ClusterStatus
    }
    "destroy" {
        Remove-Cluster
    }
    "ssh" {
        Enter-Node -NodeName $Node
    }
    "provision" {
        Invoke-Provision
    }
    "reload" {
        Invoke-Reload
    }
}

Write-Host ""
