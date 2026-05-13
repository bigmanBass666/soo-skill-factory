#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# forum-search.sh — TRAE 论坛搜索辅助脚本
# 版本: 0.1.0
# =============================================================================

readonly VERSION="0.1.0"
readonly SCRIPT_NAME="forum-search"

# 基础目录配置
BASE_DIR="${HOME}/.trae/forum-search"
CACHE_DIR="${BASE_DIR}/cache"
SAVED_DIR="${BASE_DIR}/saved"
HISTORY_FILE="${BASE_DIR}/history.log"
FORUM_API_BASE="https://forum.trae.cn"

# 缓存 TTL（秒），可通过环境变量覆盖
CACHE_TTL="${FORUM_CACHE_TTL:-1800}"

# 历史记录最大条数
MAX_HISTORY=100

# 颜色定义（仅在终端支持时启用）
if [[ -t 1 ]] && [[ "${TERM:-dumb}" != "dumb" ]]; then
    COLOR_CYAN="\033[36m"
    COLOR_GREEN="\033[32m"
    COLOR_BLUE="\033[34m"
    COLOR_YELLOW="\033[33m"
    COLOR_RED="\033[31m"
    COLOR_RESET="\033[0m"
    COLOR_BOLD="\033[1m"
else
    COLOR_CYAN=""
    COLOR_GREEN=""
    COLOR_BLUE=""
    COLOR_YELLOW=""
    COLOR_RED=""
    COLOR_RESET=""
    COLOR_BOLD=""
fi

# =============================================================================
# 工具函数
# =============================================================================

# 输出带颜色的文本
color_echo() {
    local color="$1" text="$2"
    echo -e "${color}${text}${COLOR_RESET}"
}

# 输出错误信息并退出
die() {
    color_echo "$COLOR_RED" "❌ 错误: $*" >&2
    exit 1
}

# 输出警告信息
warn() {
    color_echo "$COLOR_YELLOW" "⚠️  警告: $*" >&2
}

# 检查依赖命令是否存在
check_dependencies() {
    local missing=()
    command -v jq &>/dev/null || missing+=("jq")
    if ! command -v curl &>/dev/null && ! command -v wget &>/dev/null; then
        missing+=("curl 或 wget")
    fi
    if [[ ${#missing[@]} -gt 0 ]]; then
        die "缺少必要依赖: ${missing[*]}\n   请先安装: ${missing[*]}"
    fi
}

# 初始化目录结构
init_dirs() {
    mkdir -p "$CACHE_DIR" "$SAVED_DIR" "$(dirname "$HISTORY_FILE")"
    touch "$HISTORY_FILE"
}

# 生成缓存键（基于关键词+category+sort的hash）
generate_cache_key() {
    local keyword="$1" category="$2" sort="$3"
    echo -n "${keyword}|${category}|${sort}" | md5sum | awk '{print $1}'
}

# 获取当前 ISO8601 时间戳
iso_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# 获取文件大小（人类可读）
human_size() {
    local bytes="$1"
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ $bytes -lt 1048576 ]]; then
        echo "$(( bytes / 1024 ))KB"
    else
        local mb=$(( bytes / 1048576 ))
        local frac=$(( (bytes % 1048576) * 10 / 1048576 ))
        echo "${mb}.${frac}MB"
    fi
}

# HTTP 请求封装（优先使用curl，fallback到wget）
http_get() {
    local url="$1"
    if command -v curl &>/dev/null; then
        curl -sS --max-time 15 "$url" 2>/dev/null
    else
        wget -qO- --timeout=15 "$url" 2>/dev/null
    fi
}

# =============================================================================
# 帮助与版本信息
# =============================================================================

show_help() {
    cat <<EOF
${COLOR_BOLD}TRAE 论坛搜索工具${COLOR_RESET} v${VERSION}

${COLOR_CYAN}用法:${COLOR_RESET}
  forum-search.sh <命令> [参数]

${COLOR_CYAN}命令:${COLOR_RESET}
  ${COLOR_GREEN}search${COLOR_RESET} <关键词>          执行搜索
  ${COLOR_GREEN}cache${COLOR_RESET} [clear|status]     缓存管理
  ${COLOR_GREEN}history${COLOR_RESET} [list|clear]     搜索历史
  ${COLOR_GREEN}save${COLOR_RESET} <名称>              保存最近搜索结果
  ${COLOR_GREEN}saved${COLOR_RESET} [list|remove]      管理保存的搜索

${COLOR_CYAN}search 参数:${COLOR_RESET}
  --category <板块>            过滤板块 (product-suggestion/bug-report/help-support/general)
  --sort <排序方式>             排序方式 (latest/top/replies/views, 默认 replies)
  --limit <数字>                返回结果上限 (默认 10)
  --json                       以 JSON 格式输出
  --no-cache                   忽略缓存强制重新搜索

${COLOR_CYAN}通用选项:${COLOR_RESET}
  -h, --help                   显示帮助信息
  -v, --version                显示版本号

${COLOR_CYAN}示例:${COLOR_RESET}
  forum-search.sh search "性能优化"
  forum-search.sh search "bug" --category bug-report --sort latest --limit 5 --json
  forum-search.sh cache status
  forum-search.sh history list
  forum-search.sh save my-favorite
  forum-search.sh saved list
EOF
}

show_version() {
    echo "forum-search v${VERSION}"
}

# =============================================================================
# 缓存管理
# =============================================================================

# 从缓存读取结果
cache_read() {
    local key="${1:-}"
    [[ -z "$key" ]] && return 1
    local cache_file="${CACHE_DIR}/${key}.json"
    if [[ ! -f "$cache_file" ]]; then
        return 1
    fi
    local file_age=$(( $(date +%s) - $(stat -c %Y "$cache_file" 2>/dev/null || stat -f %m "$cache_file" 2>/dev/null || echo 0) ))
    if [[ $file_age -gt $CACHE_TTL ]]; then
        return 1
    fi
    cat "$cache_file"
    return 0
}

# 写入缓存
cache_write() {
    local key="$1" data="$2"
    echo "$data" > "${CACHE_DIR}/${key}.json"
}

# 清除所有缓存
cache_clear() {
    rm -rf "${CACHE_DIR:?}"/*
    color_echo "$COLOR_GREEN" "✅ 缓存已清除"
}

# 显示缓存状态
cache_status() {
    if [[ ! -d "$CACHE_DIR" ]]; then
        echo "缓存目录不存在"
        return
    fi
    local count=0 total_size=0 newest=""
    while IFS= read -r -d '' f; do
        ((count++)) || true
        local s=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null || echo 0)
        ((total_size += s)) || true
        local ft=$(stat -c%Y "$f" 2>/dev/null || stat -f%m "$f" 2>/dev/null || echo 0)
        if [[ -z "$newest" || $ft -gt $(date -d "$newest" +%s 2>/dev/null || echo 0) ]]; then
            newest=$(date -d "@$ft" -Iseconds 2>/dev/null || date -r "$ft" -Iseconds 2>/dev/null || echo "未知")
        fi
    done < <(find "$CACHE_DIR" -name "*.json" -print0 2>/dev/null)
    echo "📦 缓存状态:"
    echo "   文件数: ${COLOR_GREEN}${count}${COLOR_RESET}"
    echo "   总大小: ${COLOR_GREEN}$(human_size $total_size)${COLOR_RESET}"
    echo "   最新时间: ${COLOR_GREEN}${newest:-无}${COLOR_RESET}"
    echo "   TTL: ${CACHE_TTL} 秒 ($(( CACHE_TTL / 60 )) 分钟)"
}

# 缓存命令入口
cmd_cache() {
    init_dirs
    case "${1:-}" in
        clear)  cache_clear ;;
        status) cache_status ;;
        "")     cache_status ;;
        *)      die "未知缓存子命令: $1 (可用: clear, status)" ;;
    esac
}

# =============================================================================
# 搜索历史
# =============================================================================

# 追加一条历史记录
history_add() {
    local keyword="$1" result_count="$2"
    local entry="$(iso_timestamp) | ${keyword} | ${result_count}"
    echo "$entry" >> "$HISTORY_FILE"
    # 保持最大条数限制
    if [[ $(wc -l < "$HISTORY_FILE") -gt $MAX_HISTORY ]]; then
        tail -n $MAX_HISTORY "$HISTORY_FILE" > "${HISTORY_FILE}.tmp"
        mv "${HISTORY_FILE}.tmp" "$HISTORY_FILE"
    fi
}

# 列出搜索历史
history_list() {
    if [[ ! -s "$HISTORY_FILE" ]]; then
        echo "📭 暂无搜索历史"
        return
    fi
    echo "📜 最近搜索记录:"
    echo ""
    tail -n 20 "$HISTORY_FILE" | tac | nl -w3 -s'. ' | while IFS= read -r line; do
        local ts=$(echo "$line" | awk -F'|' '{print $1}' | xargs)
        local kw=$(echo "$line" | awk -F'|' '{print $2}' | xargs)
        local cnt=$(echo "$line" | awk -F'|' '{print $3}' | xargs)
        printf "   ${COLOR_CYAN}%s${COLOR_RESET}  关键词: ${COLOR_BOLD}%s${COLOR_RESET}  结果: ${COLOR_GREEN}%s${COLOR_RESET}\n" \
            "$ts" "$kw" "$cnt"
    done
}

# 清除搜索历史
history_clear() {
    > "$HISTORY_FILE"
    color_echo "$COLOR_GREEN" "✅ 搜索历史已清除"
}

# 历史命令入口
cmd_history() {
    init_dirs
    case "${1:-}" in
        list|"") history_list ;;
        clear)   history_clear ;;
        *)       die "未知历史子命令: $1 (可用: list, clear)" ;;
    esac
}

# =============================================================================
# 保存的搜索
# =============================================================================

# 保存最近一次搜索
cmd_save() {
    local name="${1:-}"
    [[ -z "$name" ]] && die "请指定保存名称: save <名称>"
    init_dirs
    local last_cache=$(ls -t "${CACHE_DIR}"/*.json 2>/dev/null | head -1)
    if [[ -z "$last_cache" ]]; then
        die "没有可保存的搜索结果，请先执行一次搜索"
    fi
    cp "$last_cache" "${SAVED_DIR}/${name}.json"
    color_echo "$COLOR_GREEN" "✅ 已保存为: ${name}"
}

# 管理保存的搜索
cmd_saved() {
    init_dirs
    case "${1:-}" in
        list|"")
            if [[ -z "$(ls -A "${SAVED_DIR}" 2>/dev/null)" ]]; then
                echo "📭 暂无保存的搜索"
                return
            fi
            echo "📌 已保存的搜索:"
            echo ""
            for f in "${SAVED_DIR}"/*.json; do
                [[ -f "$f" ]] || continue
                local name=$(basename "$f" .json)
                local title=$(jq -r '.query // "未知"' "$f" 2>/dev/null)
                local count=$(jq -r '.total // 0' "$f" 2>/dev/null)
                local time=$(stat -c%y "$f" 2>/dev/null | cut -d'.' -f1 || stat -Sm "$f" 2>/dev/null | cut -d'.' -f1)
                printf "   ${COLOR_GREEN}%s${COLOR_RESET}  查询: ${COLOR_BOLD}%s${COLOR_RESET}  结果: %s  保存于: %s\n" \
                    "$name" "$title" "$count" "$time"
            done
            ;;
        remove)
            local name="${2:-}"
            [[ -z "$name" ]] && die "请指定要删除的名称: saved remove <名称>"
            local target="${SAVED_DIR}/${name}.json"
            [[ ! -f "$target" ]] && die "未找到保存: ${name}"
            rm "$target"
            color_echo "$COLOR_GREEN" "✅ 已删除: ${name}"
            ;;
        *)
            die "未知保存子命令: $1 (可用: list, remove <名称>)"
            ;;
    esac
}

# =============================================================================
# 核心搜索功能
# =============================================================================

# 执行论坛搜索
do_search() {
    local keyword="$1" category="${2:-}" sort="${3:-replies}" limit="${4:-10}" use_json=false no_cache=false

    # 解析剩余参数
    shift 4 2>/dev/null || true
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --json)     use_json=true ;;
            --no-cache) no_cache=true ;;
            *) warn "忽略未知参数: $1" ;;
        esac
        shift
    done

    init_dirs
    local cache_key=$(generate_cache_key "$keyword" "$category" "$sort")

    # 尝试从缓存读取
    if [[ "$no_cache" != true ]]; then
        local cached
        if cached=$(cache_read "$cache_key"); then
            if $use_json; then
                echo "$cached" | jq '.cached = true'
            else
                format_text_output "$cached" "$keyword" true
            fi
            return 0
        fi
    fi

    # 构建模拟搜索数据（实际项目中应调用真实API）
    # 这里使用模拟数据以演示完整流程
    local search_results
    search_results=$(generate_mock_results "$keyword" "$category" "$sort" "$limit")

    # 写入缓存
    cache_write "$cache_key" "$search_results"

    # 记录历史
    local result_count=$(echo "$search_results" | jq '.total')
    history_add "$keyword" "$result_count"

    # 格式化输出
    if $use_json; then
        echo "$search_results" | jq '.cached = false'
    else
        format_text_output "$search_results" "$keyword" false
    fi
}

# 生成模拟搜索结果（演示用，实际应替换为真实 API 调用）
generate_mock_results() {
    local keyword="$1" category="$2" sort="$3" limit="$4"
    local timestamp=$(iso_timestamp)

    # 基于关键词生成确定性但看似真实的模拟数据
    local seed=$(echo -n "${keyword}${category}${sort}" | md5sum | awk '{print $1}')
    local total=$(( (0x${seed:0:2} % 20) + 1 ))
    [[ $total -gt $limit ]] && total=$limit

    local results="[]"
    for i in $(seq 1 $total); do
        local idx_seed=$(echo -n "${seed}${i}" | md5sum)
        local topic_id=$(( 0x${idx_seed:0:6} % 100000 + 10000 ))
        local replies=$(( (0x${idx_seed:6:4} % 200) + 1 ))
        local views=$(( replies * ( (0x${idx_seed:10:4} % 50) + 10 ) ))
        local type_name="general"
        case $(( i % 4 )) in
            0) type_name="product-suggestion" ;;
            1) type_name="bug-report" ;;
            2) type_name="help-support" ;;
            3) type_name="general" ;;
        esac

        results=$(echo "$results" | jq \
            --argjson rank "$i" \
            --arg title "关于「${keyword}」的讨论 #${topic_id}" \
            --arg url "${FORUM_API_BASE}/t/topic/${topic_id}" \
            --argjson replies "$replies" \
            --argjson views "$views" \
            --arg type "$type_name" \
            --arg summary "这是关于「${keyword}」的第${i}个相关帖子摘要信息。" \
            '. + [{
                rank: $rank,
                title: $title,
                url: $url,
                replies: $replies,
                views: $views,
                type: $type,
                summary: $summary
            }]')
    done

    jq -n \
        --arg query "$keyword" \
        --argjson total "$total" \
        --argjson results "$results" \
        --arg timestamp "$timestamp" \
        '{
            query: $query,
            total: $total,
            results: $results,
            timestamp: $timestamp
        }'
}

# 文本格式输出
format_text_output() {
    local json_data="$1" keyword="$2" is_cached="$3"
    local query=$(echo "$json_data" | jq -r '.query')
    local total=$(echo "$json_data" | jq -r '.total')

    echo ""
    color_echo "$COLOR_BOLD" "🔍 搜索: ${query}"
    color_echo "$COLOR_CYAN" "📊 找到 ${COLOR_GREEN}${total}${COLOR_CYAN} 个结果"
    if $is_cached; then
        color_echo "$COLOR_YELLOW" "(来自缓存)"
    fi
    echo ""

    echo "$json_data" | jq -c '.results[]' | while read -r item; do
        local rank=$(echo "$item" | jq -r '.rank')
        local title=$(echo "$item" | jq -r '.title')
        local url=$(echo "$item" | jq -r '.url')
        local replies=$(echo "$item" | jq -r '.replies')
        local views=$(echo "$item" | jq -r '.views')
        local type_name=$(echo "$item" | jq -r '.type')
        local summary=$(echo "$item" | jq -r '.summary')

        printf "   ${COLOR_GREEN}[${rank}]${COLOR_RESET} ${COLOR_BOLD}%s${COLOR_RESET}\n" "$title"
        printf "       ${COLOR_BLUE}URL: %s${COLOR_RESET}\n" "$url"
        printf "       类型: %s | 结论: %s\n" "$type_name" "$summary"
        echo ""
    done

    echo "---"
    color_echo "$COLOR_YELLOW" "💡 提示: 使用 --json 获取结构化输出"
    echo ""
}

# =============================================================================
# 主程序入口
# =============================================================================

main() {
    # 处理全局选项
    case "${1:-}" in
        -h|--help|-?)
            show_help
            exit 0
            ;;
        -v|--version)
            show_version
            exit 0
            ;;
    esac

    # 至少需要一个命令
    [[ $# -lt 1 ]] && { show_help; exit 1; }

    local command="$1"; shift

    # 分发到各命令处理函数
    case "$command" in
        search)
            check_dependencies
            [[ $# -lt 1 ]] && die "用法: search <关键词> [选项]"
            local keyword="$1"; shift
            local category="" sort="replies" limit=10
            # 解析 search 子命令选项
            while [[ $# -gt 0 ]]; do
                case "$1" in
                    --category) category="${2:-}"; shift 2 ;;
                    --sort)     sort="${2:-}"; shift 2 ;;
                    --limit)    limit="${2:-}"; shift 2 ;;
                    --json|--no-cache) break ;;  # 留给 do_search 处理
                    *)          shift ;;           # 跳过其他参数
                esac
            done
            do_search "$keyword" "$category" "$sort" "$limit" "$@"
            ;;
        cache)
            check_dependencies
            cmd_cache "$@"
            ;;
        history)
            cmd_history "$@"
            ;;
        save)
            cmd_save "$@"
            ;;
        saved)
            cmd_saved "$@"
            ;;
        *)
            color_echo "$COLOR_RED" "❌ 未知命令: ${command}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
