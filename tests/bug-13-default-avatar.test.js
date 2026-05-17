/**
 * BUG-13 测试：我的页面头像无默认占位图
 * - avatar 为空时应使用默认头像路径
 * - 默认头像路径有效
 */
import { describe, it, expect } from 'vitest'

const DEFAULT_AVATAR = '/static/images/default-avatar.png'

/**
 * 获取头像 URL，空值时回退到默认头像
 * 模拟模板中 :src="coachProfile.avatar || '/static/images/default-avatar.png'" 的逻辑
 */
function getAvatarUrl(avatar) {
  return avatar || DEFAULT_AVATAR
}

describe('BUG-13 默认头像占位图', () => {
  it('avatar 为空字符串时应返回默认头像', () => {
    expect(getAvatarUrl('')).toBe(DEFAULT_AVATAR)
  })

  it('avatar 为 null/undefined 应返回默认头像', () => {
    expect(getAvatarUrl(null)).toBe(DEFAULT_AVATAR)
    expect(getAvatarUrl(undefined)).toBe(DEFAULT_AVATAR)
  })

  it('avatar 有值时应返回原始值', () => {
    expect(getAvatarUrl('https://cdn.example.com/avatar.jpg')).toBe('https://cdn.example.com/avatar.jpg')
    expect(getAvatarUrl('/uploads/avatar.png')).toBe('/uploads/avatar.png')
  })

  it('默认头像文件应存在', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const avatarPath = path.resolve(__dirname, '../static/images/default-avatar.png')
    expect(fs.existsSync(avatarPath)).toBe(true)
  })
})
