#!/bin/bash
# 删除 mobile-app 中无用目录的脚本

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "即将删除以下目录:"
echo "  - \$SCRIPT_DIR/images/"
echo "  - \$SCRIPT_DIR/js/"
echo ""
read -p "确认删除? (y/n): " confirm

if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    rm -rf "$SCRIPT_DIR/images/"
    rm -rf "$SCRIPT_DIR/js/"
    echo "已删除完成"
else
    echo "已取消"
fi