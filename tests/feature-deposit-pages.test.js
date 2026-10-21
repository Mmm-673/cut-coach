/**
 * 押金模块页面注册检查
 * - subpkg/mine 分包应注册押金相关页面
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('押金模块页面注册', () => {
  const pagesJsonRaw = fs.readFileSync(path.resolve(__dirname, '../pages.json'), 'utf-8')

  it('应注册押金概览页 wallet/deposit/index', () => {
    expect(pagesJsonRaw).toContain('"wallet/deposit/index"')
  })

  it('应注册押金流水页 wallet/deposit-flow/index', () => {
    expect(pagesJsonRaw).toContain('"wallet/deposit-flow/index"')
  })
})
