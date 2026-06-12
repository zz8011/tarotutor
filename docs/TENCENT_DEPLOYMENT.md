# Tencent Cloud deployment

This project is a static Vite app. Your production layout is:

- Tencent CVM + Nginx serves `dist/`.
- Alibaba Cloud OSS stores tarot card images and optional mentor images.
- `public/cos-assets.json` maps app card ids to OSS URLs at runtime.

## 1. Configure image asset base URL

Images are not uploaded to Tencent Cloud in this setup. Point the app to your Alibaba OSS public endpoint or CDN domain:

```powershell
$env:ASSET_BASE_URL="https://your-bucket.oss-cn-shanghai.aliyuncs.com/taro"
$env:VITE_ASSET_BASE_URL=$env:ASSET_BASE_URL
$env:VITE_OSS_ASSET_BASE_URL=$env:ASSET_BASE_URL
```

If you also want this repo to upload images, configure `ossutil` once on the machine:

```powershell
ossutil config
```

Do not commit AccessKey values. Prefer a RAM user that can only write the target bucket/prefix.

## 2. Fill local environment variables

Copy `.env.tencent.example` and fill the real values:

```powershell
Copy-Item .env.tencent.example .env.tencent.local
```

Load it in PowerShell before deployment:

```powershell
Get-Content .env.tencent.local | ForEach-Object {
  if ($_ -and -not $_.StartsWith("#")) {
    $name, $value = $_ -split "=", 2
    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}
```

Important values:

- `ASSET_BASE_URL`: Alibaba OSS or CDN URL prefix ending with `/taro`.
- `OSS_BUCKET`: Alibaba OSS bucket name, for example `your-bucket`.
- `OSS_ENDPOINT`: Alibaba OSS endpoint, for example `oss-cn-shanghai.aliyuncs.com`.
- `OSS_REMOTE_PREFIX`: object prefix, default `taro`.
- `TENCENT_HOST`: CVM public IP or domain.
- `TENCENT_KEY_PATH`: SSH private key path.

## 3. Upload or generate the image manifest

```powershell
npm run oss:upload
```

This uploads:

- `../card/eastern-mystic-tarot` to `oss://$OSS_BUCKET/$OSS_REMOTE_PREFIX/cards/eastern-mystic-tarot`
- `../card/chinese-ink-tarot` to `oss://$OSS_BUCKET/$OSS_REMOTE_PREFIX/cards/chinese-ink-tarot`
- optional `public/mentors` to `oss://$OSS_BUCKET/$OSS_REMOTE_PREFIX/mentors`

If the images are already in OSS, only regenerate the manifest:

```powershell
npm run cos:manifest
```

The manifest command name is kept for compatibility, but the generated URLs come from `ASSET_BASE_URL` / `OSS_ASSET_BASE_URL`.
It generates `public/cos-assets.json`, which the app loads at runtime.

## 4. Prepare the CVM once

Copy and run the setup script on the server:

```bash
DOMAIN=your-domain.com APP_DIR=/var/www/tarot-tutor bash setup-tencent-server.sh
```

If you do not have a domain yet, keep `DOMAIN=_` and access the server by IP.

## 5. Deploy the app

From the local project directory:

```powershell
npm run deploy:tencent
```

The script:

1. Generates the COS manifest.
2. Runs `npm ci`.
3. Builds the Vite app.
4. Packs `dist/`.
5. Uploads it to the CVM through SSH.
6. Reloads Nginx.

## Notes

- The app trusts Alibaba OSS domains ending in `.aliyuncs.com` and common Alibaba CDN domains ending in `.alicdn.com`.
- It also still supports Tencent COS/CDN domains, so the same code can move image buckets later.
- For a custom image/CDN domain, set `VITE_TRUSTED_ASSET_HOSTS=img.example.com`.
- Keep OSS objects public-readable or put a CDN in front of OSS. The frontend should not use permanent AccessKey values.
