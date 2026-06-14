#!/usr/bin/env bash
# ============================================================
# 腾讯云 CVM 部署（Linux / macOS）
# 等价于 deploy/deploy-tencent.ps1：
#   1. 生成 cos-assets.json
#   2. npm ci && npm run build
#   3. 打包 dist/ 并通过 SSH 上传到服务器
#   4. reload nginx
#
# 用法：
#   export TENCENT_HOST=1.2.3.4
#   export TENCENT_KEY_PATH=~/.ssh/sink.pem
#   export ASSET_BASE_URL=https://your-bucket.oss-cn-shanghai.aliyuncs.com/taro
#   bash deploy/deploy-tencent.sh
#
# 或在项目根目录放置 .env.tencent.local（见 .env.tencent.example），
# 脚本会自动 source。
#
# 若 ~/.ssh/config 里已有 Host 别名，可设 TENCENT_SSH_HOST=tencent-cloud
# 省略 HOST / KEY_PATH / PORT。
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PACKAGE_PATH="$PROJECT_ROOT/dist.tar.gz"
ENV_FILE="$PROJECT_ROOT/.env.tencent.local"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SERVER_HOST="${TENCENT_HOST:-}"
USER="${TENCENT_USER:-ubuntu}"
KEY_PATH="${TENCENT_KEY_PATH:-}"
REMOTE_DIR="${TENCENT_REMOTE_DIR:-/var/www/tarot-tutor}"
SSH_PORT="${TENCENT_SSH_PORT:-22}"
SSH_HOST_ALIAS="${TENCENT_SSH_HOST:-}"
ASSET_BASE_URL="${ASSET_BASE_URL:-${OSS_ASSET_BASE_URL:-${ALI_OSS_ASSET_BASE_URL:-${COS_ASSET_BASE_URL:-}}}}"
ASSET_MANIFEST_URL="${VITE_ASSET_MANIFEST_URL:-./cos-assets.json}"

die() {
  echo "error: $*" >&2
  exit 1
}

ssh_cmd() {
  if [[ -n "$SSH_HOST_ALIAS" ]]; then
    ssh "$SSH_HOST_ALIAS" "$@"
  else
    ssh -i "$KEY_PATH" -p "$SSH_PORT" "${USER}@${SERVER_HOST}" "$@"
  fi
}

scp_to_remote() {
  local src="$1"
  local dest="$2"
  if [[ -n "$SSH_HOST_ALIAS" ]]; then
    scp "$src" "${SSH_HOST_ALIAS}:${dest}"
  else
    scp -i "$KEY_PATH" -P "$SSH_PORT" "$src" "${USER}@${SERVER_HOST}:${dest}"
  fi
}

scp_from_remote() {
  local remote_path="$1"
  local local_path="$2"
  if [[ -n "$SSH_HOST_ALIAS" ]]; then
    scp "${SSH_HOST_ALIAS}:${remote_path}" "$local_path"
  else
    scp -i "$KEY_PATH" -P "$SSH_PORT" "${USER}@${SERVER_HOST}:${remote_path}" "$local_path"
  fi
}

if [[ -z "$SSH_HOST_ALIAS" ]]; then
  [[ -n "$SERVER_HOST" ]] || die "Missing TENCENT_HOST (或设置 TENCENT_SSH_HOST 使用 ~/.ssh/config 别名)"
  [[ -n "$KEY_PATH" ]] || die "Missing TENCENT_KEY_PATH"
  [[ -f "$KEY_PATH" ]] || die "SSH key not found: $KEY_PATH"
fi

[[ -n "$ASSET_BASE_URL" ]] || die "Missing ASSET_BASE_URL / OSS_ASSET_BASE_URL / COS_ASSET_BASE_URL"

count_manifest_cards() {
  node -e "
    const m = require('$PROJECT_ROOT/public/cos-assets.json');
    process.stdout.write(String(Object.keys(m.cards || {}).length));
  "
}

maybe_restore_manifest_from_remote() {
  local card_count
  card_count="$(count_manifest_cards)"

  if [[ "$card_count" != "0" ]]; then
    echo "Manifest OK: $card_count cards"
    return
  fi

  echo "warn: 本地未找到卡牌图片目录，生成的 manifest 为空（Cards: 0）"
  echo "      尝试从服务器拉取现有 cos-assets.json …"

  if scp_from_remote "${REMOTE_DIR}/cos-assets.json" "$PROJECT_ROOT/public/cos-assets.json"; then
    card_count="$(count_manifest_cards)"
    if [[ "$card_count" != "0" ]]; then
      echo "      已恢复远程 manifest：$card_count cards"
      return
    fi
  fi

  if [[ "${ALLOW_EMPTY_MANIFEST:-}" == "1" ]]; then
    echo "warn: ALLOW_EMPTY_MANIFEST=1，继续部署空 manifest"
    return
  fi

  die "manifest 仍为空。请上传卡牌到 OSS 后运行 npm run cos:manifest，或设置 ALLOW_EMPTY_MANIFEST=1 强制继续"
}

cd "$PROJECT_ROOT"

export ASSET_BASE_URL
export VITE_ASSET_BASE_URL="$ASSET_BASE_URL"
export VITE_OSS_ASSET_BASE_URL="$ASSET_BASE_URL"
export VITE_ASSET_MANIFEST_URL="$ASSET_MANIFEST_URL"
export NODE_ENV=production

echo "==> 生成资源 manifest"
node scripts/generate-cos-manifest.mjs
maybe_restore_manifest_from_remote

echo "==> 安装依赖并构建"
npm ci
npm run build

[[ -d dist ]] || die "dist/ 不存在，构建失败"

rm -f "$PACKAGE_PATH"
tar -czf "$PACKAGE_PATH" -C dist .

echo "==> 上传到 ${SSH_HOST_ALIAS:-${USER}@${SERVER_HOST}}:${REMOTE_DIR}"
ssh_cmd "sudo mkdir -p '$REMOTE_DIR' && sudo chown -R \$(whoami):\$(whoami) '$REMOTE_DIR'"
scp_to_remote "$PACKAGE_PATH" "/tmp/tarot-tutor-dist.tar.gz"
ssh_cmd "rm -rf '$REMOTE_DIR'/* && tar -xzf /tmp/tarot-tutor-dist.tar.gz -C '$REMOTE_DIR' && rm /tmp/tarot-tutor-dist.tar.gz"
ssh_cmd "sudo nginx -t && sudo systemctl reload nginx"

rm -f "$PACKAGE_PATH"

echo "Deployed to ${SSH_HOST_ALIAS:-${USER}@${SERVER_HOST}}:${REMOTE_DIR}"
