#!/usr/bin/env python3
import os
import re

def update_logo_in_html_files():
    # 获取所有HTML文件
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    
    # 需要替换的logo引用模式
    # 匹配base64编码的img标签或其他logo引用
    logo_pattern = r'<img\s+src="[^"]*"\s*'
    new_logo = 'images/logo3.png'
    
    for filename in html_files:
        print(f"处理文件: {filename}")
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 替换导航栏logo（.logo类下的img）
        # 使用更精确的模式匹配logo部分的img标签
        content = re.sub(
            r'(<a\s+href="index\.html"\s+class="logo">)\s*<img\s+src="[^"]*"\s*',
            r'\1\n          <img src="' + new_logo + '" ',
            content
        )
        
        # 替换移动端菜单logo（如果是img标签）
        content = re.sub(
            r'(<a\s+href="index\.html"\s+class="mobile-menu-logo">)\s*<img\s+src="[^"]*"\s*',
            r'\1\n          <img src="' + new_logo + '" ',
            content
        )
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ {filename} 更新完成")

if __name__ == '__main__':
    os.chdir('/Users/yululiu/Desktop/zhongke-gpu-website/zhongkerongsuan-official')
    update_logo_in_html_files()
    print("\n所有页面logo更新完成！")