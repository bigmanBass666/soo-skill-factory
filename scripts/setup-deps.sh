#!/bin/bash
# ============================================================
# setup-deps.sh — 一键恢复开发依赖
# 用法: bash setup-deps.sh [--force] [--skip-apt]
#
# 下载优先级（从快到慢）:
#   1. 本地已存在 → 跳过 (0s)
#   2. 仓库内 .cache/ 或 /workspace/.cache/ 复制 (~5s)
#   3. ⭐ GitHub Release 下载 (~30s-2min, 取决于网络)
#   4. npx playwright install 兜底 (~10-16min)
#
# Release 地址: https://github.com/bigmanBass666/soo-skill-factory/releases/tag/v1.0.0-deps
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

FORCE=""
SKIP_APT=""

for arg in "$@"; do
  case "$arg" in
    --force) FORCE="--force" ;;
    --skip-apt) SKIP_APT="yes" ;;
  esac
done

# ── 配置 ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PW_CACHE="$REPO_DIR/.cache/playwright-chromium"
FALLBACK_CACHE="/workspace/.cache/playwright-chromium"
PW_TARGET="$HOME/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64"
CHROME_BIN="$PW_TARGET/chrome"

# GitHub Release 信息
RELEASE_REPO="bigmanBass666/soo-skill-factory"
RELEASE_TAG="v1.0.0-deps"
RELEASE_FILE="playwright-chromium-linux.tar.gz"
RELEASE_URL="https://github.com/${RELEASE_REPO}/releases/download/${RELEASE_TAG}/${RELEASE_FILE}"

log() { echo -e "${CYAN}[setup-deps]${NC} $*"; }
ok()  { echo -e "${GREEN}✅ $*${NC}"; }
warn(){ echo -e "${YELLOW}⚠️  $*${NC}"; }
err() { echo -e "${RED}❌ $*${NC}"; }

START_TIME=$(date +%s)

# ── Step 1: 系统依赖 (apt) ──────────────────────────────
if [ -z "$SKIP_APT" ]; then
  log "Step 1/4: 安装系统依赖..."
  apt-get update -qq 2>/dev/null
  apt-get install -y -qq \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libnspr4 libnss3 libxkbcommon1 wget curl unzip 2>/dev/null | tail -3
  ok "系统依赖安装完成"
else
  warn "跳过系统依赖 (--skip-apt)"
fi

# ── Step 2: Playwright npm 包 ───────────────────────────
log "Step 2/4: 检查 playwright npm 包..."
if [ ! -d "/workspace/node_modules/playwright" ] || [ "$FORCE" = "--force" ]; then
  log "安装 playwright 到 /workspace/node_modules/..."
  cd /workspace && npm config set registry https://registry.npmmirror.com && npm install playwright 2>&1 | tail -5
  ok "playwright npm 包安装完成"
else
  ok "playwright 已存在，跳过"
fi

export PATH="/workspace/node_modules/.bin:$PATH"

# ── Step 3: Chromium 浏览器二进制 ────────────────────
log "Step 3/4: 检查 chromium 二进制..."

install_chromium_from_local_cache() {
  local src="$1"
  log "从本地缓存复制 chromium ($src)..."
  mkdir -p "$(dirname "$PW_TARGET")"
  cp -r "$src/chrome-linux64" "$(dirname "$PW_TARGET")/"
  ok "chromium 从缓存恢复完成"
}

install_chromium_from_release() {
  log "⬇️  从 GitHub Release 下载 chromium (${RELEASE_TAG})..."
  log "   URL: ${RELEASE_URL}"

  local tmp_tar="/tmp/pw-chrome-download.tar.gz"

  # 尝试 curl（更快，支持进度显示）
  if command -v curl &>/dev/null; then
    curl -L --progress-bar "$RELEASE_URL" -o "$tmp_tar" 2>&1 || {
      warn "curl 下载失败，尝试 wget..."
      wget -q --show-progress "$RELEASE_URL" -O "$tmp_tar" 2>&1 || {
        err "GitHub Release 下载失败！请检查网络或手动下载:"
        err "  $RELEASE_URL"
        rm -f "$tmp_tar"
        return 1
      }
    }
  else
    wget -q --show-progress "$RELEASE_URL" -O "$tmp_tar" 2>&1 || {
      err "wget 下载失败！"
      rm -f "$tmp_tar"
      return 1
    }
  fi

  # 解压到目标位置
  mkdir -p "$PW_TARGET"
  tar -xzf "$tmp_tar" -C "$PW_TARGET/../"
  rm -f "$tmp_tar"

  if [ -f "$CHROME_BIN" ]; then
    ok "chromium 从 Release 下载并解压完成"

    # 缓存到 workspace 供下次使用
    log "缓存到 /workspace/.cache/..."
    rm -rf "$FALLBACK_CACHE"
    mkdir -p "$FALLBACK_CACHE"
    cp -r "$PW_TARGET" "$FALLBACK_CACHE/"
    return 0
  else
    err "解压后未找到 chrome 二进制！"
    return 1
  fi
}

install_chromium_from_playwright() {
  log "📦 使用 npx playwright install chromium (这需要几分钟)..."
  npx playwright install chromium 2>&1 || {
    warn "playwright 安装失败，尝试手动下载..."
    mkdir -p "$PW_TARGET"
    cd /tmp && \
      wget -q --show-progress "https://cdn.playwright.dev/builds/cft/148.0.7778.96/linux64/chrome-linux64.zip" \
        -O chrome.zip 2>&1 && \
      unzip -o chrome.zip -d "$PW_TARGET/../" && \
      rm -f chrome.zip
  }
}

# 主逻辑：按优先级尝试各种来源
if [ -f "$CHROME_BIN" ] && [ "$FORCE" != "--force" ]; then
  ok "chromium 已存在，跳过 ($CHROME_BIN)"

elif [ -d "$PW_CACHE/chrome-linux64" ] && [ -f "$PW_CACHE/chrome-linux64/chrome" ]; then
  install_chromium_from_local_cache "$PW_CACHE"

elif [ -d "$FALLBACK_CACHE/chrome-linux64" ] && [ -f "$FALLBACK_CACHE/chrome-linux64/chrome" ]; then
  install_chromium_from_local_cache "$FALLBACK_CACHE"

elif install_chromium_from_release; then
  ok "chromium 通过 GitHub Release 安装成功 ✨"

else
  warn "所有快速方式均失败，使用 playwright 官方源下载..."
  install_chromium_from_playwright

  if [ -f "$CHROME_BIN" ]; then
    # 缓存结果
    rm -rf "$FALLBACK_CACHE"
    mkdir -p "$FALLBACK_CACHE"
    cp -r "$PW_TARGET" "$FALLBACK_CACHE/" 2>/dev/null || true
    ok "chromium 通过官方源安装完成（已缓存）"
  else
    err "chromium 安装彻底失败！"
    exit 1
  fi
fi

# ── Step 4: 验证 + 汇总 ─────────────────────────────
log "Step 4/4: 验证..."
if [ -f "$CHROME_BIN" ]; then
  CHROME_SIZE=$(du -sh "$PW_TARGET" | cut -f1)
  CHROME_DATE=$(stat -c %y "$CHROME_BIN" | cut -d'.' -f1)
  ok "chromium 就绪: $CHROME_SIZE (${CHROME_DATE})"
else
  err "chromium 不存在于 $CHROME_BIN"
  exit 1
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}🎉 所有依赖就绪！耗时 ${MINUTES}分${SECONDS}秒${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "Playwright 启动参数:"
echo "  executablePath: '$CHROME_BIN'"
echo ""
echo "环境变量（可选）:"
echo "  PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright"
echo ""
echo "缓存位置:"
echo "  chromium:   $FALLBACK_CACHE/ (workspace 持久)"
echo "  npm:        /workspace/node_modules/"
echo "  Release:    $RELEASE_URL"
