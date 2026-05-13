#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="$HOME/.trae/device-log.json"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ensure_jq() {
  if ! command -v jq &>/dev/null; then
    echo -e "${RED}错误: jq 未安装，请先安装 jq${NC}" >&2
    exit 1
  fi
}

ensure_log_file() {
  if [[ ! -f "$LOG_FILE" ]]; then
    echo -e "${RED}错误: 日志文件不存在，请先运行 init 命令初始化${NC}" >&2
    exit 1
  fi
  if ! jq empty "$LOG_FILE" 2>/dev/null; then
    echo -e "${RED}错误: 日志文件 JSON 格式无效${NC}" >&2
    exit 1
  fi
}

get_ip() {
  if command -v hostname &>/dev/null && ip=$(hostname -I 2>/dev/null); then
    echo "$ip" | awk '{print $1}'
  elif command -v ip &>/dev/null && ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}'); then
    echo "$ip"
  elif command -v ifconfig &>/dev/null && ip=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1); then
    echo "$ip"
  else
    echo "unknown"
  fi
}

cmd_init() {
  if [[ -f "$LOG_FILE" ]]; then
    echo -e "${YELLOW}警告: 日志文件已存在，将被覆盖${NC}"
  fi
  mkdir -p "$(dirname "$LOG_FILE")"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '{"created_at":"%s","devices":[]}\n' "$timestamp" > "$LOG_FILE"
  echo -e "${GREEN}✓ 日志文件已初始化: ${LOG_FILE}${NC}"
  echo -e "  创建时间: ${CYAN}${timestamp}${NC}"
}

cmd_add() {
  ensure_jq
  ensure_log_file
  local device_name="${1:-}"
  if [[ -z "$device_name" ]]; then
    echo -e "${RED}用法: $0 add <device_name>${NC}" >&2
    exit 1
  fi
  local hostname os_name timestamp ip_addr
  hostname=$(hostname 2>/dev/null || echo "unknown")
  os_name=$(uname -s 2>/dev/null || echo "unknown")
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  ip_addr=$(get_ip)
  local new_device
  new_device=$(jq -n \
    --arg name "$device_name" \
    --arg host "$hostname" \
    --arg os "$os_name" \
    --arg time "$timestamp" \
    --arg ip "$ip_addr" \
    '{name:$name,hostname:$host,os:$os,login_time:$time,ip:$ip,status:"active"}')
  local tmp_file
  tmp_file=$(mktemp)
  jq ".devices += [$new_device]" "$LOG_FILE" > "$tmp_file" && mv "$tmp_file" "$LOG_FILE"
  local count
  count=$(jq '.devices | length' "$LOG_FILE")
  echo -e "${GREEN}✓ 设备已添加 (第 ${count} 条记录)${NC}"
  echo -e "  ${BOLD}设备名:${NC}   ${CYAN}${device_name}${NC}"
  echo -e "  ${BOLD}主机名:${NC}   ${hostname}"
  echo -e "  ${BOLD}操作系统:${NC} ${os_name}"
  echo -e "  ${BOLD}IP 地址:${NC}  ${ip_addr}"
  echo -e "  ${BOLD}登录时间:${NC} ${timestamp}"
}

cmd_list() {
  ensure_jq
  ensure_log_file
  local count
  count=$(jq '.devices | length' "$LOG_FILE")
  if [[ "$count" -eq 0 ]]; then
    echo -e "${YELLOW}暂无设备记录${NC}"
    return
  fi
  printf "${BOLD}%-4s %-18s %-22s %-10s %-16s %-10s${NC}\n" "#" "设备名" "登录时间" "OS" "IP" "状态"
  printf "%s\n" "----------------------------------------------------------------------------------------"
  jq -r '.devices[] | "\(.name)|\(.login_time)|\(.os)|\(.ip)|\(.status)"' "$LOG_FILE" | while IFS='|' read -r name login_time os ip status; do
    local idx
    idx=$((idx + 1))
    local status_color="$GREEN"
    [[ "$status" != "active" ]] && status_color="$YELLOW"
    printf "%-4d %-18s %-22s %-10s %-16s ${status_color}%-10s${NC}\n" "$idx" "$name" "$login_time" "$os" "$ip" "$status"
  done
  jq -r '.devices[] | "\(.name)|\(.login_time)|\(.os)|\(.ip)|\(.status)"' "$LOG_FILE" | nl -ba | while IFS=$'\t' read -r idx rest; do
    IFS='|' read -r name login_time os ip status <<< "$rest"
    local status_color="$GREEN"
    [[ "$status" != "active" ]] && status_color="$YELLOW"
    printf "%-4s %-18s %-22s %-10s %-16s ${status_color}%-10s${NC}\n" "$idx" "$name" "$login_time" "$os" "$ip" "$status"
  done | tail -n +$((count + 2)) 2>/dev/null || true
  echo ""
  echo -e "${BOLD}设备总数:${NC} ${CYAN}${count}${NC}"
  if [[ "$count" -ge 2 ]]; then
    echo -e "${RED}⚠ 警告: 已记录 ${count} 台设备，超过安全阈值 (>=2)${NC}"
  fi
}

cmd_remove() {
  ensure_jq
  ensure_log_file
  local target="${1:-}"
  if [[ -z "$target" ]]; then
    echo -e "${RED}用法: $0 remove <index_or_name>${NC}" >&2
    exit 1
  fi
  local count
  count=$(jq '.devices | length' "$LOG_FILE")
  if [[ "$count" -eq 0 ]]; then
    echo -e "${YELLOW}暂无设备记录可移除${NC}"
    return
  fi
  local tmp_file removed_name
  tmp_file=$(mktemp)
  if [[ "$target" =~ ^[0-9]+$ ]]; then
    local idx=$((target - 1))
    if (( idx < 0 || idx >= count )); then
      echo -e "${RED}错误: 序号超出范围 (1-${count})${NC}" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    removed_name=$(jq -r ".devices[$idx].name" "$LOG_FILE")
    jq "del(.devices[$idx])" "$LOG_FILE" > "$tmp_file" && mv "$tmp_file" "$LOG_FILE"
  else
    local found
    found=$(jq --arg name "$target" '[.devices[].name] | index($name)' "$LOG_FILE")
    if [[ "$found" == "null" ]]; then
      echo -e "${RED}错误: 未找到设备 '${target}'${NC}" >&2
      rm -f "$tmp_file"
      exit 1
    fi
    removed_name="$target"
    jq 'map(select(.name != $name)) | {created_at:.created_at, devices:map(.)}' --arg name "$target" "$LOG_FILE" > "$tmp_file" && mv "$tmp_file" "$LOG_FILE"
  fi
  echo -e "${GREEN}✓ 已移除设备: ${CYAN}${removed_name}${NC}"
}

cmd_clean() {
  ensure_jq
  ensure_log_file
  echo -e "${RED}⚠ 此操作将清除所有设备记录！${NC}"
  echo -e "输入 ${BOLD}YES${NC} 确认继续:"
  read -r confirm
  if [[ "$confirm" != "YES" ]]; then
    echo -e "${YELLOW}操作已取消${NC}"
    return
  fi
  local created_at
  created_at=$(jq -r '.created_at' "$LOG_FILE")
  printf '{"created_at":"%s","devices":[]}\n' "$created_at" > "$LOG_FILE"
  echo -e "${GREEN}✓ 所有设备记录已清除${NC}"
}

cmd_status() {
  ensure_jq
  ensure_log_file
  local count file_size last_op
  count=$(jq '.devices | length' "$LOG_FILE")
  file_size=$(stat -c%s "$LOG_FILE" 2>/dev/null || stat -f%z "$LOG_FILE" 2>/dev/null || echo "unknown")
  last_op=$(jq -r 'if (.devices | length) > 0 then [.devices[].login_time] | max else .created_at end' "$LOG_FILE")
  echo -e "${BOLD}${CYAN}═══ TRAE 设备日志状态概览 ═══${NC}"
  echo -e "  ${BOLD}日志文件:${NC}   ${LOG_FILE}"
  echo -e "  ${BOLD}设备总数:${NC}   ${CYAN}${count}${NC}"
  echo -e "  ${BOLD}安全阈值:${NC}   $(if [[ "$count" -ge 2 ]]; then echo -e "${RED}⚠ 超过阈值 (>=2)${NC}"; else echo -e "${GREEN}✓ 正常 (<2)${NC}"; fi)"
  echo -e "  ${BOLD}最后操作:${NC}   ${last_op}"
  echo -e "  ${BOLD}文件大小:${NC}   ${file_size} bytes"
  echo -e "${BOLD}${CYAN}═════════════════════════════${NC}"
}

usage() {
  cat <<EOF
${BOLD}TRAE 设备日志管理工具${NC}

用法: $0 <命令> [参数]

命令:
  init                  初始化空的日志文件
  add <device_name>     添加新设备记录
  list                  列出所有已记录设备
  remove <index_or_name> 移除指定设备记录
  clean                 清除所有设备记录（需确认）
  status                快速状态概览

示例:
  $0 init
  $0 add my-laptop
  $0 list
  $0 remove 1
  $0 remove my-laptop
  $0 clean
  $0 status
EOF
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    init)   cmd_init ;;
    add)    cmd_add "$@" ;;
    list)   cmd_list ;;
    remove) cmd_remove "$@" ;;
    clean)  cmd_clean ;;
    status) cmd_status ;;
    -h|--help|help) usage ;;
    *)      echo -e "${RED}未知命令: ${cmd}${NC}" >&2; usage; exit 1 ;;
  esac
}

main "$@"
