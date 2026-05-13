#!/bin/bash
# ============================================================
# setup-deps.sh — 一键恢复开发依赖
# 用法: bash setup-deps.sh [--force] [--skip-apt]
# 
# 缓存策略：
#   - chromium 二进制: /workspace/.cache/playwright-chromium/ (377MB, 跨会话持久)
#   - npm 包:         /workspace/node_modules/ (跨会话持久)
#   - 系统apt包:     无法缓存，每次需重装 (~30s)
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

FORCE="${1:-}"
SKIP_APT=""

for arg in "$@"; do
  case "$arg" in
    --force) FORCE="--force" ;;
    --skip-apt) SKIP_APT="yes" ;;
  esac
done

# 缓存位置：优先从仓库内查找，回退到 /workspace/.cache/
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PW_CACHE="$REPO_DIR/.cache/playwright-chromium"
FALLBACK_CACHE="/workspace/.cache/playwright-chromium"
PW_TARGET="$HOME/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64"
CHROME_BIN="$PW_TARGET/chrome"

log() { echo -e "${CYAN}[setup-deps]${NC} $*"; }
ok()  { echo -e "${GREEN}✅ $*${NC}"; }
warn(){ echo -e "${YELLOW}⚠️  $*${NC}"; }
err() { echo -e "${RED}❌ $*${NC}"; }

START_TIME=$(date +%s)

# ── Step 1: 系统依赖 (apt) ──────────────────────────────
if [ -z "$SKIP_APT" ]; then
  log "安装系统依赖 (apt)..."
  apt-get update -qq 2>/dev/null
  apt-get install -y -qq \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libnspr4 libnss3 libxkbcommon0 2>/dev/null | tail -3
  ok "系统依赖安装完成"
else
  warn "跳过系统依赖安装 (--skip-apt)"
fi

# ── Step 2: Playwright npm 包 ───────────────────────────
log "检查 playwright npm 包..."
if [ ! -d "/workspace/node_modules/playwright" ] || [ "$FORCE" = "--force" ]; then
  log "安装 playwright 到 /workspace/node_modules/..."
  cd /workspace && npm install playwright 2>&1 | tail -5
  ok "playwright npm 包安装完成"
else
  ok "playwright 已存在，跳过"
fi

# 确保 npx 可用（通过 node_modules）
export PATH="/workspace/node_modules/.bin:$PATH"

# ── Step 3: Chromium 浏览器二进制 ────────────────────
log "检查 chromium 二进制..."
NEED_DOWNLOAD="no"

if [ -f "$CHROME_BIN" ] && [ "$FORCE" != "--force" ]; then
  ok "chromium 已存在 ($CHROME_BIN)"
elif [ -d "$PW_CACHE/chrome-linux64" ] && [ -f "$PW_CACHE/chrome-linux64/chrome" ]; then
  log "从仓库缓存复制 chromium..."
  mkdir -p "$(dirname "$PW_TARGET")"
  cp -r "$PW_CACHE/chrome-linux64" "$(dirname "$PW_TARGET")/"
  ok "chromium 从仓库缓存恢复完成"
elif [ -d "$FALLBACK_CACHE/chrome-linux64" ] && [ -f "$FALLBACK_CACHE/chrome-linux64/chrome" ]; then
  log "从 /workspace 缓存复制 chromium..."
  mkdir -p "$(dirname "$PW_TARGET")"
  cp -r "$FALLBACK_CACHE/chrome-linux64" "$(dirname "$PW_TARGET")/"
  ok "chromium 从 /workspace 缓存恢复完成"
else
  NEED_DOWNLOAD="yes"
fi

if [ "$NEED_DOWNLOAD" = "yes" ]; then
  log "下载 chromium (175MB, 这需要几分钟)..."
  # 先用 playwright 自带下载器
  npx playwright install chromium 2>&1 || {
    warn "playwright 安装失败，尝试手动 wget..."
    mkdir -p "$PW_TARGET"
    cd /tmp && \
      wget -q --show-progress "https://cdn.playwright.dev/builds/cft/148.0.7778.96/linux64/chrome-linux64.zip" \
        -O chrome.zip && \
      unzip -o chrome.zip -d "$PW_TARGET/../" && \
      rm -f chrome.zip
  }
  
  # 下载完成后立即缓存到 workspace
  if [ -f "$CHROME_BIN" ]; then
    log "缓存 chromium 到 /workspace/.cache/..."
    rm -rf "$PW_CACHE/chrome-linux64"
    cp -r "$PW_TARGET" "$PW_CACHE/"
    du -sh "$PW_CACHE/"
    ok "chromium 下载并缓存完成"
  else
    err "chromium 下载失败！"
    exit 1
  fi
fi

# 验证
if [ -f "$CHROME_BIN" ]; then
  CHROME_SIZE=$(du -sh "$PW_TARGET" | cut -f1)
  ok "chromium 就绪: $CHROME_SIZE"
else
  err "chromium 不存在于 $CHROME_BIN"
  exit 1
fi

# ── Step 4: 汇总 ───────────────────────────────────────
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}🎉 所有依赖就绪！耗时 ${MINUTES}分${SECONDS}秒${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "使用方式:"
echo "  const browser = await chromium.launch({"
echo "    headless: true,"
echo "    executablePath: '$CHROME_BIN'"
echo "  });"
echo ""
echo "缓存位置:"
echo "  chromium:   $PW_CACHE/"
echo "  npm:        /workspace/node_modules/"
