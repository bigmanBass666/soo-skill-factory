#!/usr/bin/env bash
set -euo pipefail

VERSION="0.1.0"

if [ -t 1 ] && [ "${TERM:-}" != "dumb" ]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  CYAN='\033[0;36m'
  RESET='\033[0m'
else
  GREEN=''
  RED=''
  YELLOW=''
  CYAN=''
  RESET=''
fi

info()    { printf "${CYAN}[INFO]${RESET} %s\n" "$*"; }
success() { printf "${GREEN}[✅]${RESET} %s\n" "$*"; }
warn()    { printf "${YELLOW}[⚠️]${RESET} %s\n" "$*"; }
error()   { printf "${RED}[❌]${RESET} %s\n" "$*" >&2; }

usage() {
  cat <<EOF
SOLO Skill Scaffold v${VERSION}

Usage: $(basename "$0") <command> [args]

Commands:
  init <skill-name>   Create complete Skill directory structure
  check               Validate current Skill directory completeness
  pack                Package Skill as .skill archive
  eval-init           Generate evals.json template in evals/

Options:
  -h, --help          Show this help message
  -v, --version       Show version
EOF
}

cmd_init() {
  local skill_name="${1:-}"
  if [ -z "$skill_name" ]; then
    error "Missing <skill-name> argument"
    info "Usage: $(basename "$0") init <skill-name>"
    exit 1
  fi

  if [ -d "$skill_name" ]; then
    error "Directory '$skill_name' already exists"
    exit 1
  fi

  info "Initializing Skill: $skill_name"

  mkdir -p "$skill_name/references" "$skill_name/scripts" "$skill_name/evals"

  local skill_title
  skill_title=$(echo "$skill_name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)$i=toupper(substr($i,1,1))tolower(substr($i,2))}1')

  cat > "$skill_name/SKILL.md" <<SKILLEOF
---
name: ${skill_name}
description: >
  {TODO: Write pushy description covering 10+ trigger keywords}
compatibility:
  - {TODO: List required tools}
---

# ${skill_title}

## 1. Skill 概述
{TODO: One-line positioning}

## 2. 触发场景
{TODO: List >=10 trigger scenarios}

## 3. 模块 A：{Module Name}
{TODO: Workflow + output format}

## 4. 模块 B：{Module Name}
{TODO: Workflow + output format}

## 5. 模块 C：{Module Name}
{TODO: Workflow + output format}

## 6. 模块 D：{Module Name}
{TODO: Workflow + output format}

## 7. 输出格式规范总览
{TODO: Output format table}

## 8. 最佳实践
{TODO: Best practices}
SKILLEOF

  success "Created $skill_name/SKILL.md"
  success "Created $skill_name/references/"
  success "Created $skill_name/scripts/"
  success "Created $skill_name/evals/"
  info "Skill '$skill_name' initialized successfully"
}

cmd_check() {
  local skill_dir="."
  local skill_name
  skill_name=$(basename "$(pwd)")

  local checks=0
  local passes=0
  local fails=0

  check_item() {
    local label="$1"
    local result="$2"
    checks=$((checks + 1))
    if [ "$result" = "pass" ]; then
      printf "  ${GREEN}✅${RESET} %s\n" "$label"
      passes=$((passes + 1))
    else
      printf "  ${RED}❌${RESET} %s\n" "$label"
      fails=$((fails + 1))
    fi
  }

  info "Checking Skill: $skill_name"
  echo ""

  local skill_md_result="fail"
  if [ -f "SKILL.md" ]; then
    skill_md_result="pass"
  fi
  check_item "SKILL.md exists" "$skill_md_result"

  local fm_name_result="fail"
  local fm_desc_result="fail"
  local fm_compat_result="fail"
  if [ -f "SKILL.md" ]; then
    if grep -q '^name:' SKILL.md; then
      fm_name_result="pass"
    fi
    if grep -q '^description:' SKILL.md; then
      fm_desc_result="pass"
    fi
    if grep -q '^compatibility:' SKILL.md; then
      fm_compat_result="pass"
    fi
  fi
  check_item "Frontmatter has 'name'" "$fm_name_result"
  check_item "Frontmatter has 'description'" "$fm_desc_result"
  check_item "Frontmatter has 'compatibility'" "$fm_compat_result"

  local refs_result="fail"
  if [ -d "references" ]; then
    refs_result="pass"
  fi
  check_item "references/ directory exists" "$refs_result"

  local scripts_result="fail"
  if [ -d "scripts" ]; then
    scripts_result="pass"
  fi
  check_item "scripts/ directory exists" "$scripts_result"

  local evals_dir_result="fail"
  if [ -d "evals" ]; then
    evals_dir_result="pass"
  fi
  check_item "evals/ directory exists" "$evals_dir_result"

  local evals_json_result="fail"
  if [ -f "evals/evals.json" ]; then
    if python3 -c "import json,sys; json.load(open('evals/evals.json'))" 2>/dev/null; then
      evals_json_result="pass"
    fi
  fi
  check_item "evals/evals.json is valid JSON" "$evals_json_result"

  if [ -f "SKILL.md" ]; then
    local line_count
    line_count=$(wc -l < SKILL.md)
    if [ "$line_count" -ge 500 ]; then
      warn "SKILL.md has ${line_count} lines (>= 500). Consider splitting."
    else
      info "SKILL.md has ${line_count} lines"
    fi
  fi

  if [ -f "evals/evals.json" ]; then
    local assertion_count
    assertion_count=$(python3 -c "
import json
data = json.load(open('evals/evals.json'))
total = sum(len(e.get('assertions', [])) for e in data)
print(total)
" 2>/dev/null || echo "0")
    if [ "$assertion_count" -lt 15 ]; then
      warn "Total assertions in evals.json: ${assertion_count} (< 15). Add more evals."
    else
      info "Total assertions in evals.json: ${assertion_count}"
    fi
  fi

  echo ""
  printf "  ${CYAN}Summary:${RESET} %d checks — ${GREEN}%d passed${RESET}, ${RED}%d failed${RESET}\n" "$checks" "$passes" "$fails"

  if [ "$fails" -gt 0 ]; then
    exit 1
  fi
}

cmd_pack() {
  if [ ! -f "SKILL.md" ]; then
    error "SKILL.md not found in current directory"
    error "Run this command from inside a Skill directory"
    exit 1
  fi

  local skill_name
  skill_name=$(basename "$(pwd)")
  local parent_dir
  parent_dir=$(dirname "$(pwd)")

  local output_file="${parent_dir}/${skill_name}.skill"

  info "Packaging Skill: $skill_name (zip format)"

  if ! command -v zip &>/dev/null; then
    warn "zip command not found, falling back to tar.gz (may cause nested directory issue)"
    tar czf "$output_file" -C "$parent_dir" "$skill_name/"
  else
    (cd "$parent_dir/$skill_name" && zip -rq "$output_file" .)
  fi

  if [ ! -f "$output_file" ]; then
    error "Failed to create .skill archive"
    exit 1
  fi

  local file_size
  file_size=$(du -h "$output_file" | cut -f1)

  success "Created $output_file ($file_size)"
}

cmd_eval_init() {
  if [ ! -d "evals" ]; then
    mkdir -p evals
    info "Created evals/ directory"
  fi

  if [ -f "evals/evals.json" ]; then
    warn "evals/evals.json already exists. Overwriting."
  fi

  cat > "evals/evals.json" <<'EVALEOF'
[
  {
    "id": "eval-001",
    "eval_name": "{TODO: Eval name}",
    "prompt": "{TODO: Prompt to send to the skill}",
    "expected_output": "{TODO: Expected output description}",
    "files": [],
    "assertions": []
  },
  {
    "id": "eval-002",
    "eval_name": "{TODO: Eval name}",
    "prompt": "{TODO: Prompt to send to the skill}",
    "expected_output": "{TODO: Expected output description}",
    "files": [],
    "assertions": []
  },
  {
    "id": "eval-003",
    "eval_name": "{TODO: Eval name}",
    "prompt": "{TODO: Prompt to send to the skill}",
    "expected_output": "{TODO: Expected output description}",
    "files": [],
    "assertions": []
  }
]
EVALEOF

  success "Created evals/evals.json with 3 eval templates"
  echo ""
  info "Next steps:"
  echo "  1. Fill in eval_name, prompt, and expected_output for each eval"
  echo "  2. Add file paths to 'files' array if the eval requires input files"
  echo "  3. Add assertion objects to 'assertions' array (aim for >= 15 total)"
  echo "  4. Run '$(basename "$0") check' to validate"
}

if [ $# -eq 0 ]; then
  usage
  exit 1
fi

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
  -v|--version)
    echo "skill-scaffold v${VERSION}"
    exit 0
    ;;
  init)
    cmd_init "${2:-}"
    ;;
  check)
    cmd_check
    ;;
  pack)
    cmd_pack
    ;;
  eval-init)
    cmd_eval_init
    ;;
  *)
    error "Unknown command: $1"
    usage
    exit 1
    ;;
esac
