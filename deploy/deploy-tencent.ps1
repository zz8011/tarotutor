param(
  [string]$ServerHost = $env:TENCENT_HOST,
  [string]$User = $(if ($env:TENCENT_USER) { $env:TENCENT_USER } else { "ubuntu" }),
  [string]$KeyPath = $env:TENCENT_KEY_PATH,
  [string]$RemoteDir = $(if ($env:TENCENT_REMOTE_DIR) { $env:TENCENT_REMOTE_DIR } else { "/var/www/tarot-tutor" }),
  [string]$SshPort = $(if ($env:TENCENT_SSH_PORT) { $env:TENCENT_SSH_PORT } else { "22" }),
  [string]$AssetBaseUrl = $(if ($env:ASSET_BASE_URL) { $env:ASSET_BASE_URL } elseif ($env:OSS_ASSET_BASE_URL) { $env:OSS_ASSET_BASE_URL } elseif ($env:ALI_OSS_ASSET_BASE_URL) { $env:ALI_OSS_ASSET_BASE_URL } else { $env:COS_ASSET_BASE_URL }),
  [string]$AssetManifestUrl = $(if ($env:VITE_ASSET_MANIFEST_URL) { $env:VITE_ASSET_MANIFEST_URL } else { "./cos-assets.json" })
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$PackagePath = Join-Path $ProjectRoot "dist.tar.gz"

if (-not $ServerHost) { throw "Missing TENCENT_HOST" }
if (-not $KeyPath) { throw "Missing TENCENT_KEY_PATH" }
if (-not (Test-Path $KeyPath)) { throw "SSH key not found: $KeyPath" }
if (-not $AssetBaseUrl) { throw "Missing ASSET_BASE_URL or OSS_ASSET_BASE_URL" }

Push-Location $ProjectRoot
try {
  $env:ASSET_BASE_URL = $AssetBaseUrl
  $env:VITE_ASSET_BASE_URL = $AssetBaseUrl
  $env:VITE_OSS_ASSET_BASE_URL = $AssetBaseUrl
  $env:VITE_ASSET_MANIFEST_URL = $AssetManifestUrl
  $env:NODE_ENV = "production"

  node .\scripts\generate-cos-manifest.mjs
  npm ci
  npm run build

  if (Test-Path $PackagePath) {
    Remove-Item -LiteralPath $PackagePath -Force
  }

  tar -czf $PackagePath -C dist .

  $SshTarget = "${User}@${ServerHost}"
  ssh -i $KeyPath -p $SshPort $SshTarget "sudo mkdir -p '$RemoteDir' && sudo chown -R `$(whoami):`$(whoami) '$RemoteDir'"
  scp -i $KeyPath -P $SshPort $PackagePath "${SshTarget}:/tmp/tarot-tutor-dist.tar.gz"
  ssh -i $KeyPath -p $SshPort $SshTarget "rm -rf '$RemoteDir'/* && tar -xzf /tmp/tarot-tutor-dist.tar.gz -C '$RemoteDir' && rm /tmp/tarot-tutor-dist.tar.gz"
  ssh -i $KeyPath -p $SshPort $SshTarget "sudo nginx -t && sudo systemctl reload nginx"
} finally {
  Pop-Location
}

Write-Host "Deployed to ${User}@${ServerHost}:${RemoteDir}"
