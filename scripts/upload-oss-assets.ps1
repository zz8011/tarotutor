param(
  [string]$Bucket = $env:OSS_BUCKET,
  [string]$Endpoint = $(if ($env:OSS_ENDPOINT) { $env:OSS_ENDPOINT } else { "oss-cn-shanghai.aliyuncs.com" }),
  [string]$Prefix = $(if ($env:OSS_REMOTE_PREFIX) { $env:OSS_REMOTE_PREFIX } else { "taro" }),
  [string]$Ossutil = $(if ($env:OSSUTIL_BIN) { $env:OSSUTIL_BIN } else { "ossutil" })
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$WorkspaceRoot = Resolve-Path (Join-Path $ProjectRoot "..")

if (-not $Bucket) {
  throw "Missing OSS_BUCKET, for example: your-bucket"
}

$AssetBaseUrl = $env:ASSET_BASE_URL
if (-not $AssetBaseUrl) {
  $AssetBaseUrl = "https://$Bucket.$Endpoint/$Prefix"
}
$env:ASSET_BASE_URL = $AssetBaseUrl.TrimEnd("/")
$env:OSS_ASSET_BASE_URL = $env:ASSET_BASE_URL
$env:VITE_ASSET_BASE_URL = $env:ASSET_BASE_URL
$env:VITE_OSS_ASSET_BASE_URL = $env:ASSET_BASE_URL

Push-Location $ProjectRoot
try {
  node .\scripts\generate-cos-manifest.mjs
} finally {
  Pop-Location
}

$uploads = @(
  @{
    Local = Join-Path $WorkspaceRoot "card\eastern-mystic-tarot"
    Remote = "oss://$Bucket/$Prefix/cards/eastern-mystic-tarot"
  },
  @{
    Local = Join-Path $WorkspaceRoot "card\chinese-ink-tarot"
    Remote = "oss://$Bucket/$Prefix/cards/chinese-ink-tarot"
  },
  @{
    Local = Join-Path $ProjectRoot "public\mentors"
    Remote = "oss://$Bucket/$Prefix/mentors"
    Optional = $true
  }
)

foreach ($item in $uploads) {
  if (-not (Test-Path $item.Local)) {
    if ($item.Optional) {
      Write-Host "Skip optional path: $($item.Local)"
      continue
    }
    throw "Asset path does not exist: $($item.Local)"
  }

  Write-Host "Sync $($item.Local) -> $($item.Remote)"
  & $Ossutil sync $item.Local $item.Remote -e $Endpoint -f
  if ($LASTEXITCODE -ne 0) {
    throw "ossutil sync failed for $($item.Local)"
  }
}

Write-Host "OSS assets are ready at $AssetBaseUrl"
