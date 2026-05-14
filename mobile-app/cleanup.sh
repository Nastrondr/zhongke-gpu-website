#!/bin/bash
# 删除 mobile-app 中无用目录的脚本

echo "即将删除以下目录:"
echo "  - /Users/yululiu/Desktop/zhongke-gpu-website/mobile-app/images/"
echo "  - /Users/yululiu/Desktop/zhongke-gpu-website/mobile-app/js/"
echo ""
read -p "确认删除? (y/n): " confirm

if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    rm -rf /Users/yululiu/Desktop/zhongke-gpu-website/mobile-app/images/
    rm -rf /Users/yululiu/Desktop/zhongke-gpu-website/mobile-app/js/
    echo "已删除完成"
else
    echo "已取消"
fi