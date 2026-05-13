#!/bin/bash
# ============================================================
# setup-deps.sh — 一键恢复开发依赖（全量缓存版）
# 用法: bash scripts/setup-deps.sh [--force] [--skip-apt]
#
# 下载优先级（从快到慢）:
#   1. 本地已存在 → 跳过 (0s)
#   2. 仓库内 cache/ node_modules tar.gz 解压 (~1s, clone 自带)
#   3. 仓库内 cache/ chromium tar.gz 解压 (~2s, clone 自带)
#   4. ⭐ jsDelivr CDN 下载 chromium (国内超快, ~10-30s)
#   5. npm install playwright (~30s-2min, 取决于网络)
#   6. apt 缺失包安装 (~10-30s, 仅~74KB下载)
#   7. npx playwright install 兜底 (~10-16min)
#
# jsDelivr: https://cdn.jsdelivr.net/gh/bigmanBass666/soo-skill-factory@main/cache/
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
PW_CACHE="$REPO_DIR/cache"
PW_TARGET="$HOME/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64"
CHROME_BIN="$PW_TARGET/chrome"
NM_TARGET="$REPO_DIR/node_modules"
NM_TAR="$PW_CACHE/node-modules-playwright.tar.gz"
PW_TAR="$PW_CACHE/playwright-chromium-linux.tar.gz"

RELEASE_REPO="bigmanBass666/soo-skill-factory"
JSDELIVR_BASE="https://cdn.jsdelivr.net/gh/${RELEASE_REPO}@main/cache"

JSDELIVR_CHROME="${JSDELIVR_BASE}/playwright-chromium-linux.tar.gz"

APT_PKGS="libatk1.0-0t libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1"

log() { echo -e "${CYAN}[setup-deps]${NC} $*"; }
ok()  { echo -e "${GREEN}✅ $*${NC}"; }
warn(){ echo -e "${YELLOW}⚠️  $*${NC}"; }
err() { echo -e "${RED}❌ $*${NC}"; }

START_TIME=$(date +%s)

# ── Step 1: 系统依赖 (apt) — 智能检测，仅安装缺失包 ────
install_apt_deps() {
  local need_install=""
  for pkg in $APT_PKGS; do
    if ! dpkg -l "$pkg" 2>/dev/null | grep -q "^ii"; then
      if apt-cache show "$pkg" >/dev/null 2>&1; then
        need_install="$need_install $pkg"
      fi
    fi
  done
  if [ -n "$need_install" ]; then
    log "安装缺失的系统依赖:$need_install"
    apt-get update -qq 2>/dev/null || true
    apt-get install -y -qq $need_install 2>&1 | tail -3 || true
    ok "系统依赖安装完成"
  else
    ok "所有系统依赖已满足，跳过"
  fi
}

if [ -z "$SKIP_APT" ]; then
  log "Step 1/5: 检查系统依赖..."
  install_apt_deps
else
  warn "跳过系统依赖 (--skip-apt)"
fi

# ── Step 2: Playwright npm 包 — 优先从缓存恢复 ────────
log "Step 2/5: 检查 playwright npm 包..."

if [ -d "$NM_TARGET/playwright-core" ] && [ "$FORCE" != "--force" ]; then
  ok "node_modules/playwright 已存在，跳过"

elif [ -f "$NM_TAR" ]; then
  log "从仓库 cache/ 恢复 node_modules (3.6MB)..."
  tar -xzf "$NM_TAR" -C "$REPO_DIR/"
  if [ -f "$NM_TARGET/playwright-core/package.json" ]; then
    ok "node_modules 从缓存恢复完成 ⚡"
  else
    err "node_modules 缓存解压失败！回退到 npm 安装..."
    rm -rf "$NM_TARGET"
    cd /workspace && npm config set registry https://registry.npmmirror.com && npm install playwright 2>&1 | tail -5 || true
    ok "playwright npm 包安装完成（在线回退）"
  fi
else
  log "安装 playwright npm 包..."
  cd /workspace && npm config set registry https://registry.npmmirror.com && npm install playwright 2>&1 | tail -5 || true
  ok "playwright npm 包安装完成"
fi

export PATH="$NM_TARGET/.bin:$PATH"

# ── Step 3: Chromium 浏览器二进制 ────────────────────
log "Step 3/5: 检查 chromium 二进制..."

install_chromium_from_local_tar() {
  local src="$1"
  log "从仓库 cache/ tar.gz 解压 chromium (98MB, UPX压缩)..."
  mkdir -p "$PW_TARGET"
  tar -xzf "$src" -C "$PW_TARGET/../"
  if [ -f "$CHROME_BIN" ]; then
    ok "chromium 从仓库 tar.gz 解压完成 ⚡"
  else
    err "解压后未找到 chrome 二进制！"
    return 1
  fi
}

install_chromium_from_jsdelivr() {
  log "⚡ 从 jsDelivr CDN 下载 chromium（国内加速）..."
  log "   URL: ${JSDELIVR_CHROME}"
  local tmp_tar="/tmp/pw-chrome-jsdl.tar.gz"
  if command -v curl &>/dev/null; then
    curl -L --progress-bar "$JSDELIVR_CHROME" -o "$tmp_tar" 2>&1 || { warn "jsDelivr 失败"; rm -f "$tmp_tar"; return 1; }
  else
    wget -q --show-progress "$JSDELIVR_CHROME" -O "$tmp_tar" 2>&1 || { rm -f "$tmp_tar"; return 1; }
  fi
  mkdir -p "$PW_TARGET"
  tar -xzf "$tmp_tar" -C "$PW_TARGET/../"
  rm -f "$tmp_tar"
  if [ -f "$CHROME_BIN" ]; then
    ok "chromium 通过 jsDelivr CDN 下载完成 ⚡"
    return 0
  else
    err "jsDelivr 解压后未找到 chrome！"
    return 1
  fi
}

install_chromium_from_playwright() {
  log "📦 使用 npx playwright install chromium (这需要几分钟)..."
  npx playwright install chromium 2>&1 || {
    warn "playwright 安装失败，尝试手动下载..."
    mkdir -p "$PW_TARGET"
    cd /tmp && wget -q --show-progress "https://cdn.playwright.dev/builds/cft/148.0.7778.96/linux64/chrome-linux64.zip" -O chrome.zip 2>&1 && unzip -o chrome.zip -d "$PW_TARGET/../" && rm -f chrome.zip
  }
}

if [ -f "$CHROME_BIN" ] && [ "$FORCE" != "--force" ]; then
  ok "chromium 已存在，跳过 ($CHROME_BIN)"

elif [ -f "$PW_TAR" ]; then
  install_chromium_from_local_tar "$PW_TAR"

elif install_chromium_from_jsdelivr; then
  ok "jsDelivr CDN 下载成功 ✨"

else
  warn "所有快速方式均失败，使用 playwright 官方源下载..."
  install_chromium_from_playwright
  if [ -f "$CHROME_BIN" ]; then
    ok "chromium 通过官方源安装完成"
  else
    err "chromium 安装彻底失败！"
    exit 1
  fi
fi

# ── Step 4: 验证 ─────────────────────────────────────
log "Step 4/5: 验证..."

ERRORS=0
if [ ! -f "$CHROME_BIN" ]; then err "chromium 不存在于 $CHROME_BIN"; ERRORS=$((ERRORS+1)); fi
if [ ! -d "$NM_TARGET/playwright-core" ]; then err "node_modules/playwright 不完整"; ERRORS=$((ERRORS+1)); fi

if [ $ERRORS -gt 0 ]; then
  err "验证失败: $ERRORS 项错误"
  exit 1
fi

CHROME_SIZE=$(du -sh "$PW_TARGET" | cut -f1)
NM_SIZE=$(du -sh "$NM_TARGET" | cut -f1)
ok "chromium 就绪: $CHROME_SIZE"
ok "node_modules 就绪: $NM_SIZE"

# ── Step 5: 汇总 ─────────────────────────────────────
log "Step 5/5: 汇总..."

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
echo "缓存状态:"
if [ -f "$PW_TAR" ]; then echo "  ⚡chromium tar.gz: $PW_TAR ($(ls -lh "$PW_TAR" | awk '{print $5}'))"; fi
if [ -f "$NM_TAR" ]; then echo "  ⚡node_modules tar.gz: $NM_TAR ($(ls -lh "$NM_TAR" | awk '{print $5}'))"; fi
echo "  jsDelivr CDN: $JSDELIVR_CHROME"
