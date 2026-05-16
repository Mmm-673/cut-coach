/**
 * CODE-02 测试：Android 定位权限名称拼写检查
 * - ACCESS_COARSE_LOC 应拼写为 ACCESS_COARSE_LOCATION
 * - 所有权限名称应符合 Android 规范
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('CODE-02 Android 权限名称拼写', () => {
  const manifestPath = path.resolve(__dirname, '../manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  const permissions = manifest['app-plus'].distribute.android.permissions

  it('不应包含拼写错误的 ACCESS_COARSE_LOC', () => {
    const hasTypo = permissions.some(p => p.includes('ACCESS_COARSE_LOC"') && !p.includes('ACCESS_COARSE_LOCATION'))
    expect(hasTypo).toBe(false)
  })

  it('应包含正确的 ACCESS_COARSE_LOCATION 权限', () => {
    const hasCorrect = permissions.some(p => p.includes('ACCESS_COARSE_LOCATION'))
    expect(hasCorrect).toBe(true)
  })

  it('不应包含其他常见的权限名称拼写错误', () => {
    const knownTypos = [
      { wrong: 'ACCESS_FINE_LOC', correct: 'ACCESS_FINE_LOCATION' },
      { wrong: 'ACCESS_COARSE_LOC', correct: 'ACCESS_COARSE_LOCATION' }
    ]

    knownTypos.forEach(({ wrong, correct }) => {
      const hasTypo = permissions.some(p => p.includes(wrong) && !p.includes(correct))
      expect(hasTypo).toBe(false)
    })
  })
})
