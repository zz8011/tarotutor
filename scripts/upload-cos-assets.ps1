param(
  [string]$Bucket = $env:COS_BUCKET,
  [string]$Region = $env:COS_REGION,
  [string]$Prefix = $(if ($env:COS_REMOTE_PREFIX) { $env:COS_REMOTE_PREFIX } else { "taro" }),
  [string]$Coscli = $(if ($env:COSCLI_BIN) { $env:COSCLI_BIN } else { "coscli" })
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$WorkspaceRoot = Resolve-Path (Join-Path $ProjectRoot "..")

if (-not $Bucket) {
  throw "Missing COS_BUCKET, for example: tarot-assets-1250000000"
}

if (-not $Region) {
  throw "Missing COS_REGION, for example: ap-shanghai"
}

$AssetBaseUrl = $env:COS_ASSET_BASE_URL
if (-not $AssetBaseUrl) {
  $AssetBaseUrl = "https://$Bucket.cos.$Region.myqcloud.com/$Prefix"
}
$env:COS_ASSET_BASE_URL = $AssetBaseUrl.TrimEnd("/")

Push-Location $ProjectRoot
try {
  node .\scripts\generate-cos-manifest.mjs
} finally {
  Pop-Location
}

$uploads = @(
  @{
    Local = Join-Path $WorkspaceRoot "card\eastern-mystic-tarot"
    Remote = "cos://$Bucket/$Prefix/cards/eastern-mystic-tarot"
  },
  @{
    Local = Join-Path $WorkspaceRoot "card\chinese-ink-tarot"
    Remote = "cos://$Bucket/$Prefix/cards/chinese-ink-tarot"
  },
  @{
    Local = Join-Path $ProjectRoot "public\mentors"
    Remote = "cos://$Bucket/$Prefix/mentors"
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
  & $Coscli sync $item.Local $item.Remote -r
  if ($LASTEXITCODE -ne 0) {
    throw "coscli sync failed for $($item.Local)"
  }
}

Write-Host "COS assets are ready at $AssetBaseUrl"
