#!/usr/bin/env python3
import os

def update_logo_in_html_files():
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    old_logo = '../dist/images/logo3.png'
    new_logo = 'images/logo3.png'
    
    for filename in html_files:
        print(f"处理文件: {filename}")
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace(old_logo, new_logo)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ {filename} 更新完成")

if __name__ == '__main__':
    os.chdir('/Users/yululiu/Desktop/zhongke-gpu-website/zhongkerongsuan-official')
    update_logo_in_html_files()
    print("\n所有页面logo路径更新完成！")