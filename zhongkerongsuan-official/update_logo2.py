#!/usr/bin/env python3
import os
import re

def update_logo_in_html_files():
    # 获取所有HTML文件
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    
    # 新的logo路径（相对路径）
    new_logo = '../dist/images/logo3.png'
    
    for filename in html_files:
        print(f"处理文件: {filename}")
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 替换所有logo引用
        content = content.replace(
            'images/logo3.png',
            new_logo
        )
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ {filename} 更新完成")

if __name__ == '__main__':
    os.chdir('/Users/yululiu/Desktop/zhongke-gpu-website/zhongkerongsuan-official')
    update_logo_in_html_files()
    print("\n所有页面logo更新完成！")