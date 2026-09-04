#!/usr/bin/env python3
"""
批量将 Vue 文件 style 部分的硬编码颜色替换为 CSS 变量
用于 UniApp 主题切换适配
"""
import re
import os
import sys

# 颜色替换映射（按优先级排序，长的在前）
REPLACEMENTS = [
    # ===== 渐变（先替换，防止里面的单色被先替换） =====
    # 主渐变蓝
    ('linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%)', 'var(--gradient-primary, linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%))'),
    # 深蓝渐变
    ('linear-gradient(135deg, #1a50d9 0%, #1a40b8 100%)', 'linear-gradient(135deg, var(--color-primary-dark, #1a50d9) 0%, var(--color-blue-dark, #1a40b8) 100%)'),
    # 绿色渐变
    ('linear-gradient(135deg, #10b981 0%, #0da271 100%)', 'linear-gradient(135deg, var(--color-success, #10b981) 0%, var(--color-green-dark, #0da271) 100%)'),
    # 红色渐变
    ('linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 'linear-gradient(135deg, var(--color-danger, #ef4444) 0%, var(--color-red-dark, #dc2626) 100%)'),
    # 橘色渐变
    ('linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 'linear-gradient(135deg, var(--color-warning, #f59e0b) 0%, var(--color-orange-dark, #d97706) 100%)'),
    # 紫色渐变
    ('linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 'linear-gradient(135deg, var(--color-purple, #8b5cf6) 0%, var(--color-purple-dark, #7c3aed) 100%)'),
    # 青色渐变
    ('linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 'linear-gradient(135deg, var(--color-cyan, #06b6d4) 0%, var(--color-cyan-dark, #0891b2) 100%)'),
    # 粉色渐变
    ('linear-gradient(135deg, #ec4899 0%, #db2777 100%)', 'linear-gradient(135deg, var(--color-pink, #ec4899) 0%, var(--color-pink-dark, #db2777) 100%)'),
    # 灰色渐变
    ('linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', 'linear-gradient(135deg, var(--color-gray, #6b7280) 0%, var(--color-gray-dark, #4b5563) 100%)'),

    # ===== 页面背景渐变 =====
    ('linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)', 'var(--bg-page-gradient, linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%))'),
    ('linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)', 'var(--bg-page-gradient, linear-gradient(180deg, #f8fbff 0%, #ffffff 100%))'),
    ('linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%)', 'var(--bg-page-gradient, linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%))'),

    # ===== 单色（精确匹配，不包含在渐变里的） =====
    # 主色
    ('#2f6bee', 'var(--color-primary, #2f6bee)'),
    ('#2F6BEE', 'var(--color-primary, #2F6BEE)'),
    ('#1a50d9', 'var(--color-primary-dark, #1a50d9)'),
    ('#1A50D9', 'var(--color-primary-dark, #1A50D9)'),
    # 成功/绿色
    ('#10b981', 'var(--color-success, #10b981)'),
    ('#10B981', 'var(--color-success, #10B981)'),
    ('#0da271', 'var(--color-green-dark, #0da271)'),
    # 警告/橘色
    ('#f59e0b', 'var(--color-warning, #f59e0b)'),
    ('#F59E0B', 'var(--color-warning, #F59E0B)'),
    ('#d97706', 'var(--color-orange-dark, #d97706)'),
    # 危险/红色
    ('#ef4444', 'var(--color-danger, #ef4444)'),
    ('#EF4444', 'var(--color-danger, #EF4444)'),
    ('#dc2626', 'var(--color-red-dark, #dc2626)'),
    ('#DC2626', 'var(--color-red-dark, #DC2626)'),
    # 紫色
    ('#8b5cf6', 'var(--color-purple, #8b5cf6)'),
    ('#7c3aed', 'var(--color-purple-dark, #7c3aed)'),
    # 青色
    ('#06b6d4', 'var(--color-cyan, #06b6d4)'),
    ('#0891b2', 'var(--color-cyan-dark, #0891b2)'),
    # 粉色
    ('#ec4899', 'var(--color-pink, #ec4899)'),
    ('#db2777', 'var(--color-pink-dark, #db2777)'),
    # 评分金
    ('#ff9500', 'var(--color-warning, #ff9500)'),

    # ===== 文字色 =====
    ('#1f2937', 'var(--text-primary, #1f2937)'),
    ('#374151', 'var(--text-primary, #374151)'),
    ('#4b5563', 'var(--text-secondary, #4b5563)'),
    ('#6b7280', 'var(--text-secondary, #6b7280)'),
    ('#9ca3af', 'var(--text-tertiary, #9ca3af)'),
    ('#d1d5db', 'var(--text-tertiary, #d1d5db)'),
    ('#333333', 'var(--text-primary, #333333)'),
    ('#333', 'var(--text-primary, #333)'),
    ('#666666', 'var(--text-secondary, #666666)'),
    ('#666', 'var(--text-secondary, #666)'),
    ('#888888', 'var(--text-secondary, #888888)'),
    ('#888', 'var(--text-secondary, #888)'),
    ('#999999', 'var(--text-tertiary, #999999)'),
    ('#999', 'var(--text-tertiary, #999)'),
    ('#aaa', 'var(--text-tertiary, #aaa)'),
    ('#B0B4BC', 'var(--text-tertiary, #B0B4BC)'),

    # ===== 背景色 =====
    ('#F8FBFF', 'var(--bg-page, #F8FBFF)'),
    ('#f8fbff', 'var(--bg-page, #f8fbff)'),
    ('#F7F8FA', 'var(--bg-page, #F7F8FA)'),
    ('#f7f8fa', 'var(--bg-input, #f7f8fa)'),
    ('#F8F9FB', 'var(--bg-page, #F8F9FB)'),

    # ===== 边框/分割线 =====
    ('#f3f4f6', 'var(--border-light, #f3f4f6)'),
    ('#e5e7eb', 'var(--border-color, #e5e7eb)'),
    ('#eaeef1', 'var(--border-light, #eaeef1)'),
    ('#f0f0f0', 'var(--border-light, #f0f0f0)'),
    ('#f9fafb', 'var(--border-lighter, #f9fafb)'),

    # ===== 浅背景色（状态类） =====
    ('#fff7ed', 'var(--color-warning-light, #fff7ed)'),
    ('#FFF7ED', 'var(--color-warning-light, #FFF7ED)'),
    ('#ecfdf5', 'var(--color-success-light, #ecfdf5)'),
    ('#ECFDF5', 'var(--color-success-light, #ECFDF5)'),
    ('#eff6ff', 'var(--color-primary-light, #eff6ff)'),
    ('#EFF6FF', 'var(--color-primary-light, #EFF6FF)'),

    # ===== 半透明色 =====
    ('rgba(47, 107, 238, 0.3)', 'var(--color-primary-shadow, rgba(47, 107, 238, 0.3))'),
    ('rgba(47, 107, 238, 0.08)', 'var(--color-primary-light, rgba(47, 107, 238, 0.08))'),
    ('rgba(16, 185, 129, 0.1)', 'var(--color-success-light, rgba(16, 185, 129, 0.1))'),
    ('rgba(239, 68, 68, 0.1)', 'var(--color-danger-light, rgba(239, 68, 68, 0.1))'),
    ('rgba(255, 149, 0, 0.05)', 'rgba(255, 149, 0, 0.05)'),  # 保持不动

    # ===== 卡片阴影 =====
    ('rgba(0, 0, 0, 0.05)', 'var(--shadow-card, rgba(0, 0, 0, 0.05))'),
]

# 不需要替换的白名单（匹配到这些类名/属性时不替换颜色）
# 白色文字在深色背景上应该保持白色
KEEP_WHITE_CONTEXT = [
    'color: #fff',
    'color: #ffffff',
    'color:#fff',
    'color:#ffffff',
]


def process_style_content(style_content):
    """处理样式内容，替换颜色为 CSS 变量"""
    result = style_content

    for old, new in REPLACEMENTS:
        result = result.replace(old, new)

    # 修正：深色背景上的白色文字应该保持白色
    # 把 color: var(--bg-card, #fff) 之类的改回 #fff
    # 因为按钮/渐变背景上的白色文字在任何主题下都是白色
    result = result.replace('color: var(--bg-card, #fff)', 'color: #fff')
    result = result.replace('color: var(--bg-card, #ffffff)', 'color: #fff')
    result = result.replace('color:var(--bg-card, #fff)', 'color:#fff')
    result = result.replace('color:var(--bg-card, #ffffff)', 'color:#ffffff')

    # 修正嵌套的 var(var(...)) 问题
    # 由于替换是顺序的，有些颜色可能被多次替换造成嵌套
    for var_name in ['--color-primary', '--color-primary-dark', '--color-success',
                     '--color-warning', '--color-danger', '--text-primary',
                     '--text-secondary', '--text-tertiary', '--bg-page',
                     '--bg-card', '--border-light', '--color-green-dark',
                     '--color-orange-dark', '--color-red-dark']:
        pattern = f'var({var_name}, var({var_name}, '
        while pattern in result:
            # 找到后修正
            idx = result.find(pattern)
            # 找到对应的结束 ))
            depth = 0
            end_idx = idx
            for i in range(idx, len(result)):
                if result[i] == '(':
                    depth += 1
                elif result[i] == ')':
                    depth -= 1
                    if depth == 0:
                        end_idx = i
                        break
            # 提取内层值
            inner_start = idx + len(pattern)
            inner_end = end_idx - 1  # 去掉最后的 )
            inner_val = result[inner_start:inner_end]
            # 替换为单层 var
            replacement = f'var({var_name}, {inner_val})'
            result = result[:idx] + replacement + result[end_idx+1:]

    return result


def process_vue_file(filepath):
    """处理单个 Vue 文件"""
    with open(filepath, 'r') as f:
        content = f.read()

    # 查找所有 <style> 块
    pattern = re.compile(r'(<style[^>]*>)(.*?)(</style>)', re.DOTALL)
    matches = list(pattern.finditer(content))

    if not matches:
        return False

    modified = False
    # 从后往前替换，避免偏移问题
    for match in reversed(matches):
        style_start_tag = match.group(1)
        style_content = match.group(2)
        style_end_tag = match.group(3)

        # 检查是否是 scss 或 css
        if 'lang="scss"' in style_start_tag or 'lang="css"' in style_start_tag or True:
            new_style = process_style_content(style_content)
            if new_style != style_content:
                content = content[:match.start()] + style_start_tag + new_style + style_end_tag + content[match.end():]
                modified = True

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python batch_theme.py <file_or_directory> [file2 ...]")
        sys.exit(1)

    targets = sys.argv[1:]
    vue_files = []

    for target in targets:
        if os.path.isfile(target) and target.endswith('.vue'):
            vue_files.append(target)
        elif os.path.isdir(target):
            for root, dirs, files in os.walk(target):
                for f in files:
                    if f.endswith('.vue'):
                        vue_files.append(os.path.join(root, f))

    modified_count = 0
    for fpath in sorted(vue_files):
        try:
            if process_vue_file(fpath):
                print(f"✓ {fpath}")
                modified_count += 1
        except Exception as e:
            print(f"✗ {fpath}: {e}")

    print(f"\nTotal modified: {modified_count}/{len(vue_files)} files")


if __name__ == '__main__':
    main()
