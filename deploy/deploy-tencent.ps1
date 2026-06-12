param(
  [string]$ServerHost = $(if ($env:TENCENT_HOST) { $env:TENCENT_HOST } else { "110.42.233.244" }),
  [string]$User = $(if ($env:TENCENT_USER) { $env:TENCENT_USER } else { "ubuntu" }),
  [string]$KeyPath = $(if ($env:TENCENT_KEY_PATH) { $env:TENCENT_KEY_PATH } else { "C:\Users\sstam\Desktop\塔罗项目\sink.pem" }),
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
if (-not $AssetBaseUrl) { Write-Warning "Missing ASSET_BASE_URL - images may not load" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 塔罗导师 - 腾讯云部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "服务器: ${User}@${ServerHost}:${SshPort}"
Write-Host "部署目录: ${RemoteDir}"
Write-Host "资源地址: ${AssetBaseUrl}"
Write-Host ""

Push-Location $ProjectRoot
try {
  $env:ASSET_BASE_URL = $AssetBaseUrl
  $env:VITE_ASSET_BASE_URL = $AssetBaseUrl
  $env:VITE_OSS_ASSET_BASE_URL = $AssetBaseUrl
  $env:VITE_ASSET_MANIFEST_URL = $AssetManifestUrl
  $env:NODE_ENV = "production"

  Write-Host "[1/5] 生成资源清单..." -ForegroundColor Yellow
  node .\scripts\generate-cos-manifest.mjs

  Write-Host "[2/5] 安装依赖..." -ForegroundColor Yellow
  npm ci

  Write-Host "[3/5] 构建生产包..." -ForegroundColor Yellow
  npm run build

  if (Test-Path $PackagePath) {
    Remove-Item -LiteralPath $PackagePath -Force
  }

  Write-Host "[4/5] 打包 dist..." -ForegroundColor Yellow
  tar -czf $PackagePath -C dist .

  Write-Host "[5/5] 上传到服务器并部署..." -ForegroundColor Yellow
  $SshTarget = "${User}@${ServerHost}"

  # Ensure directory exists
  ssh -i $KeyPath -p $SshPort -o StrictHostKeyChecking=accept-new $SshTarget "sudo mkdir -p '$RemoteDir' && sudo chown -R `$(whoami):`$(whoami) '$RemoteDir'"

  # Upload package
  scp -i $KeyPath -P $SshPort $PackagePath "${SshTarget}:/tmp/tarot-tutor-dist.tar.gz"

  # Extract and cleanup
  ssh -i $KeyPath -p $SshPort $SshTarget "rm -rf '$RemoteDir'/* && tar -xzf /tmp/tarot-tutor-dist.tar.gz -C '$RemoteDir' && rm /tmp/tarot-tutor-dist.tar.gz"

  # Reload nginx
  ssh -i $KeyPath -p $SshPort $SshTarget "sudo nginx -t && sudo systemctl reload nginx"

  Write-Host ""
  Write-Host "========================================" -ForegroundColor Green
  Write-Host " 部署成功!" -ForegroundColor Green
  Write-Host "========================================" -ForegroundColor Green
  Write-Host "访问地址:"
  Write-Host "  HTTP:  http://${ServerHost}"
  Write-Host "  HTTPS: https://taro.renchengzhang.com (配置 SSL 后)"
  Write-Host ""
  Write-Host "如需配置 SSL 证书，请在服务器上运行:"
  Write-Host "  sudo certbot --nginx -d taro.renchengzhang.com"
  Write-Host "========================================"
} finally {
  Pop-Location
}
