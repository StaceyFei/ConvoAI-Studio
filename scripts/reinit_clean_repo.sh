#!/usr/bin/env bash

set -euo pipefail

print_usage() {
  cat <<'EOF'
用法:
  ./scripts/reinit_clean_repo.sh [目标目录] [--commit]

说明:
  - 默认把当前项目复制到同级目录下的 "<项目名>-clean"
  - 只在复制后的目录里删除 .git 并重新 git init
  - 默认不自动提交，传入 --commit 后会创建首个提交

示例:
  ./scripts/reinit_clean_repo.sh
  ./scripts/reinit_clean_repo.sh ../ConvoAI-Studio-Clean
  ./scripts/reinit_clean_repo.sh ../ConvoAI-Studio-Clean --commit
EOF
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "缺少必要命令: $cmd" >&2
    exit 1
  fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_PARENT_DIR="$(dirname "$SOURCE_DIR")"
SOURCE_BASENAME="$(basename "$SOURCE_DIR")"
DEFAULT_TARGET_DIR="${SOURCE_PARENT_DIR}/${SOURCE_BASENAME}-clean"

TARGET_DIR=""
CREATE_INITIAL_COMMIT="false"

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      print_usage
      exit 0
      ;;
    --commit)
      CREATE_INITIAL_COMMIT="true"
      ;;
    *)
      if [[ -n "$TARGET_DIR" ]]; then
        echo "不支持多个目标目录参数: $arg" >&2
        print_usage
        exit 1
      fi
      TARGET_DIR="$arg"
      ;;
  esac
done

TARGET_DIR="${TARGET_DIR:-$DEFAULT_TARGET_DIR}"

require_command rsync
require_command git

if [[ ! -f "$SOURCE_DIR/.gitignore" ]]; then
  echo "未在源目录找到 .gitignore: $SOURCE_DIR" >&2
  exit 1
fi

if [[ "$TARGET_DIR" != /* ]]; then
  TARGET_DIR="$(cd "$PWD" && pwd)/$TARGET_DIR"
fi

if [[ "$TARGET_DIR" == "$SOURCE_DIR" ]]; then
  echo "目标目录不能与源目录相同: $TARGET_DIR" >&2
  exit 1
fi

if [[ -e "$TARGET_DIR" ]]; then
  echo "目标目录已存在，请换一个目录名: $TARGET_DIR" >&2
  exit 1
fi

echo "源目录:   $SOURCE_DIR"
echo "目标目录: $TARGET_DIR"
echo "开始复制项目..."

mkdir -p "$TARGET_DIR"

rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='dist-ssr' \
  --exclude='.npm' \
  --exclude='Library' \
  --exclude='.trae' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.development.local' \
  --exclude='.env.test.local' \
  --exclude='.env.production.local' \
  --exclude='*.pem' \
  --exclude='*.key' \
  --exclude='*.p12' \
  --exclude='*.crt' \
  --exclude='*.cer' \
  --exclude='.DS_Store' \
  "$SOURCE_DIR/" "$TARGET_DIR/"

rm -rf "$TARGET_DIR/.git"

echo "检查复制结果中的敏感文件..."

mapfile -t suspicious_files < <(
  find "$TARGET_DIR" \
    \( -name '.env' \
    -o -name '.env.local' \
    -o -name '.env.development.local' \
    -o -name '.env.test.local' \
    -o -name '.env.production.local' \
    -o -name '*.pem' \
    -o -name '*.key' \
    -o -name '*.p12' \
    -o -name '*.crt' \
    -o -name '*.cer' \) \
    ! -name '.env.example' \
    -print
)

if [[ "${#suspicious_files[@]}" -gt 0 ]]; then
  echo "发现不应复制到新仓库的敏感文件，请处理后重试:" >&2
  printf '  - %s\n' "${suspicious_files[@]}" >&2
  exit 1
fi

echo "重新初始化 Git 仓库..."

(
  cd "$TARGET_DIR"
  git init >/dev/null
  git branch -M main >/dev/null 2>&1 || true

  if [[ "$CREATE_INITIAL_COMMIT" == "true" ]]; then
    git add .
    git commit -m "init: clean repository"
  fi
)

echo
echo "完成。新仓库目录:"
echo "  $TARGET_DIR"
echo
echo "下一步建议:"
echo "  1. cd \"$TARGET_DIR\""
echo "  2. git status"
if [[ "$CREATE_INITIAL_COMMIT" != "true" ]]; then
  echo "  3. git add . && git commit -m \"init: clean repository\""
else
  echo "  3. git remote add origin <你的新仓库地址>"
fi
echo "  4. git remote add origin <你的新仓库地址>"
echo "  5. git push -u origin main"
