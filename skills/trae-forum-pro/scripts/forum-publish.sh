#!/usr/bin/env bash
set -euo pipefail

# forum-publish.sh — TRAE 论坛自动发帖辅助脚本 v0.1.0
# 用法: ./forum-publish.sh <markdown_file> <title> [category] [options]

readonly VERSION="0.1.0"
readonly FORUM_BASE="https://forum.trae.cn"

# 颜色定义（仅在终端支持时启用）
if [[ -t 1 ]] && [[ "${TERM:-dumb}" != "dumb" ]]; then
    COLOR_CYAN="\033[36m" COLOR_GREEN="\033[32m" COLOR_YELLOW="\033[33m"
    COLOR_RED="\033[31m" COLOR_RESET="\033[0m" COLOR_BOLD="\033[1m"
else
    COLOR_CYAN="" COLOR_GREEN="" COLOR_YELLOW="" COLOR_RED=""
    COLOR_RESET="" COLOR_BOLD=""
fi

color_echo() { local color="$1" text="$2"; echo -e "${color}${text}${COLOR_RESET}"; }
die() { color_echo "$COLOR_RED" "❌ 发布失败: $*"; echo ""; exit 1; }

# 板块编号 → 名称|URL 映射
get_category_info() {
    case "$1" in
        8)  echo "产品建议|/c/8-category/8" ;;
        22) echo "Bug 反馈|/c/22-category/22" ;;
        7)  echo "求助与支持|/c/7-category/7" ;;
        9)  echo "技巧分享|/c/9-category/9" ;;
        37) echo "技能创作赛|/c/37-category/37" ;;
        *)  echo "未知板块|/c/${1}-category/${1}" ;;
    esac
}

show_help() {
    cat <<EOF
${COLOR_BOLD}TRAE 论坛自动发帖工具${COLOR_RESET} v${VERSION}

${COLOR_CYAN}用法:${COLOR_RESET}
  forum-publish.sh <markdown_file> <title> [category] [options]

${COLOR_CYAN}参数:${COLOR_RESET}
  ${COLOR_GREEN}markdown_file${COLOR_RESET}   要发布的 Markdown 文件路径（必填）
  ${COLOR_GREEN}title${COLOR_RESET}           帖子标题（必填）
  ${COLOR_GREEN}category${COLOR_RESET}        目标板块编号（默认: 37）

${COLOR_CYAN}支持的板块:${COLOR_RESET}
  8   产品建议       /c/8-category/8
  22  Bug 反馈      /c/22-category/22
  7   求助与支持     /c/7-category/7
  9   技巧分享       /c/9-category/9
  37  技能创作赛（默认）/c/37-category/37

${COLOR_CYAN}选项:${COLOR_RESET}
  --dry-run              只预览不实际发布
  --cookie <path>        自定义 cookie 文件路径
  -h, --help             显示帮助信息

${COLOR_CYAN}示例:${COLOR_RESET}
  forum-publish.sh post.md "我的技能分享"
  forum-publish.sh post.md "发现一个Bug" 22
  forum-publish.sh post.md "测试帖子" 37 --dry-run
  forum-publish.sh post.md "产品建议" 8 --cookie /path/to/cookie.md
EOF
}

# 验证 cookie 文件是否包含必要字段
check_cookie() {
    local f="$1"
    [[ ! -f "$f" ]] && return 1
    local content
    content=$(cat "$f" 2>/dev/null || true)
    [[ -z "$content" ]] && return 1
    echo "$content" | grep -qi 'sessionid' || return 1
    echo "$content" | grep -qi '_forum_session' || return 1
    return 0
}

# 查找有效 cookie 文件：--cookie > ~/.trae/cookie.md > /workspace/cookie.md
find_cookie_file() {
    local custom="$1"
    if [[ -n "$custom" ]]; then
        check_cookie "$custom" && echo "$custom" && return 0
        die "指定的 cookie 文件无效或缺少 sessionid/_forum_session 字段\n   文件: ${custom}"
    fi
    for loc in "${HOME}/.trae/cookie.md" "/workspace/cookie.md"; do
        check_cookie "$loc" && echo "$loc" && return 0
    done
    die "未找到有效的 cookie 文件\n\n   获取步骤:\n   1. 浏览器登录 https://forum.trae.cn/\n   2. F12 → Application → Cookies → 复制 sessionid 和 _forum_session\n   3. 保存到 ~/.trae/cookie.md 或 /workspace/cookie.md\n   或通过 --cookie 指定路径\n\n   格式示例: sessionid=xxx; _forum_session=yyy"
}

parse_args() {
    MARKDOWN_FILE="" TITLE="" CATEGORY="37" DRY_RUN=false CUSTOM_COOKIE=""
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help) show_help; exit 0 ;;
            --dry-run) DRY_RUN=true; shift ;;
            --cookie)
                [[ -z "${2:-}" ]] && die "--cookie 需要指定文件路径"
                CUSTOM_COOKIE="$2"; shift 2 ;;
            -*)
                die "未知选项: $1（使用 -h 查看帮助）" ;;
            *)
                if [[ -z "$MARKDOWN_FILE" ]]; then MARKDOWN_FILE="$1"
                elif [[ -z "$TITLE" ]]; then TITLE="$1"
                elif [[ "$1" =~ ^[0-9]+$ ]]; then CATEGORY="$1"
                else die "无法识别的参数: $1"
                fi
                shift ;;
        esac
    done
    [[ -z "$MARKDOWN_FILE" ]] && { color_echo "$COLOR_RED" "错误: 缺少 markdown_file 参数"; echo ""; show_help; exit 1; }
    [[ ! -f "$MARKDOWN_FILE" ]] && die "Markdown 文件不存在: ${MARKDOWN_FILE}"
    [[ -z "$TITLE" ]] && { color_echo "$COLOR_RED" "错误: 缺少 title 参数"; echo ""; show_help; exit 1; }
    [[ ! "$CATEGORY" =~ ^[0-9]+$ ]] && die "板块编号必须为数字，当前值: ${CATEGORY}"
}

read_post_content() {
    POST_CONTENT=$(cat "$MARKDOWN_FILE")
    CHAR_COUNT=${#POST_CONTENT}
    local cat_info
    cat_info=$(get_category_info "$CATEGORY")
    CATEGORY_NAME=$(echo "$cat_info" | cut -d'|' -f1)
    CATEGORY_URL=$(echo "$cat_info" | cut -d'|' -f2)
    color_echo "$COLOR_CYAN" "🚀 正在发布到 TRAE 论坛..."
    echo ""
    color_echo "$COLOR_CYAN" "📄 文件: ${COLOR_BOLD}${MARKDOWN_FILE}${COLOR_RESET}${COLOR_CYAN} (${CHAR_COUNT} 字符)"
    color_echo "$COLOR_CYAN" "📌 标题: ${COLOR_BOLD}${TITLE}"
    color_echo "$COLOR_CYAN" "📍 板块: ${COLOR_BOLD}[${CATEGORY}] ${CATEGORY_NAME}"
    echo ""
}

do_dry_run() {
    color_echo "$COLOR_YELLOW" "🔍 [DRY-RUN] 预览模式（不会实际发布）"
    echo ""
    read_post_content
    local preview="${POST_CONTENT:0:200}"
    echo "--- 帖子预览 ---"
    echo "$preview"
    [[ ${#POST_CONTENT} -gt 200 ]] && echo "...（省略剩余 $(( CHAR_COUNT - 200 )) 字符）"
    echo "--- 预览结束 ---"
    echo ""
    color_echo "$COLOR_GREEN" "✅ DRY-RUN 完成。如需发布，去掉 --dry-run 参数。"
    exit 0
}

# 通过 heredoc 生成临时 Node.js Playwright 发帖脚本并执行
generate_and_run_node_script() {
    local cookie_file="$1" tmp_js="/tmp/publish-node-$$.js"

    cat > "$tmp_js" <<'NODE_SCRIPT'
const { chromium } = require('playwright');
const FB = process.env.FORUM_BASE || 'https://forum.trae.cn';
async function main() {
    let browser;
    try {
        const fs = require('fs');
        const cookieRaw = fs.readFileSync(process.env.COOKIE_FILE, 'utf-8').trim();
        const cookies = cookieRaw.split(';').map(p => { const [n,...r]=p.trim().split('='); return {name:n.trim(),value:r.join('=').trim(),domain:'.trae.cn',path:'/'}; }).filter(c=>c.name);
        const body = fs.readFileSync(process.env.MARKDOWN_FILE, 'utf-8');
        browser = await chromium.launch({ headless: false });
        const ctx = await browser.newContext();
        await ctx.addCookies(cookies);
        const page = await ctx.newPage();
        const url = `${FB}${process.env.CATEGORY_URL}`;
        console.error(`[INFO] 导航到: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        const btn = page.locator('#create-topic');
        if (await btn.count() === 0) throw new Error('未找到 #create-topic 按钮，可能未登录或页面结构已变更');
        await btn.click(); await page.waitForTimeout(1500);
        const titleInput = page.locator('#reply-title');
        await titleInput.waitFor({ state: 'visible', timeout: 10000 });
        await titleInput.fill(process.env.POST_TITLE);
        const editor = page.locator('.d-editor-input');
        await editor.click();
        await page.evaluate(t => navigator.clipboard.writeText(t), body);
        await page.keyboard.press('Control+A'); await page.waitForTimeout(200);
        await page.keyboard.press('Control+V'); await page.waitForTimeout(500);
        await page.locator('.create-topic-button, #create-topic .btn-primary').first().click();
        console.error('[INFO] 已点击发布按钮，等待跳转...');
        await page.waitForURL(/\/t\//, { timeout: 30000 });
        await page.waitForTimeout(2000);
        const finalUrl = page.url(), m = finalUrl.match(/\/t\/(?:topic\/)?(\d+)/);
        if (!m) throw new Error('无法从 URL 提取话题 ID: ' + finalUrl);
        console.log(JSON.stringify({success:true,title:process.env.POST_TITLE,url:`${FB}/t/topic/${m[1]}`,id:m[1],category:process.env.CATEGORY_ID}));
    } catch(e) { console.log(JSON.stringify({success:false,error:e.message})); process.exitCode=1; }
    finally { if(browser) await browser.close(); }
}
main().catch(e => { console.log(JSON.stringify({success:false,error:e.message})); process.exit(1); });
NODE_SCRIPT

    export FORUM_BASE COOKIE_FILE="$cookie_file" MARKDOWN_FILE="$MARKDOWN_FILE" \
           POST_TITLE="$TITLE" CATEGORY_ID="$CATEGORY" CATEGORY_URL="$CATEGORY_URL"

    local result_json exit_code=0
    set +e; result_json=$(node "$tmp_js" 2>&1); exit_code=$?; set -e
    rm -f "$tmp_js"

    if [[ $exit_code -ne 0 ]]; then
        local err_msg
        err_msg=$(echo "$result_json" | grep -o '"error":"[^"]*"' | sed 's/"error":"//;s/"$//' || echo "未知错误（退出码: ${exit_code}）")
        echo ""
        die "${err_msg}\n\n💡 建议:\n   1. 检查网络连接\n   2. 确认 cookie 未过期\n   3. 确认账号有目标板块的发帖权限\n\n📎 手动发布: ${FORUM_BASE}${CATEGORY_URL}"
    fi

    local r_url r_id
    r_url=$(echo "$result_json" | grep -o '"url":"[^"]*"' | sed 's/"url":"//;s/"$//')
    r_id=$(echo "$result_json" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"$//')
    [[ -z "$r_url" || -z "$r_id" ]] && die "发布响应解析失败，原始输出: ${result_json}"

    echo ""
    color_echo "$COLOR_GREEN" "✅ 发布成功！"
    echo ""
    color_echo "$COLOR_CYAN" "📎 标题: ${COLOR_BOLD}${TITLE}"
    color_echo "$COLOR_CYAN" "📎 URL:  ${COLOR_BOLD}${r_url}"
    color_echo "$COLOR_CYAN" "📎 ID:   ${COLOR_BOLD}#${r_id}"
    echo ""
}

main() {
    parse_args "$@"
    [[ "$DRY_RUN" == true ]] && do_dry_run
    read_post_content
    local cf; cf=$(find_cookie_file "$CUSTOM_COOKIE")
    generate_and_run_node_script "$cf"
}

main "$@"
