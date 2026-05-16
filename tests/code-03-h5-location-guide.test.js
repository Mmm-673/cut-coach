/**
 * CODE-03 测试：H5 端定位权限拒绝后应显示详细引导
 * - H5 端 PERMISSION_DENIED 错误应显示详细的操作指引弹窗
 * - 引导内容应告知用户如何在浏览器中开启权限
 */
import { describe, it, expect } from 'vitest'
import { getLocationErrorGuide } from '@/utils/platform'

describe('CODE-03 H5 端定位权限引导', () => {
  it('H5 端 PERMISSION_DENIED (code=1) 应返回详细引导', () => {
    const err = { code: 1, errMsg: 'getLocation:fail auth deny' }
    const guide = getLocationErrorGuide(err, 'h5')
    expect(guide).not.toBeNull()
    expect(guide.title).toBe('定位权限未开启')
    expect(guide.content).toContain('浏览器')
  })

  it('H5 端 auth deny 错误应返回引导', () => {
    const err = { errMsg: 'getLocation:fail auth deny' }
    const guide = getLocationErrorGuide(err, 'h5')
    expect(guide).not.toBeNull()
    expect(guide.title).toBe('定位权限未开启')
  })

  it('H5 端非权限错误应不返回引导', () => {
    const err = { code: 2, errMsg: 'getLocation:fail no location data' }
    const guide = getLocationErrorGuide(err, 'h5')
    expect(guide).toBeNull()
  })

  it('非 H5 平台应不返回 H5 引导', () => {
    const err = { code: 1, errMsg: 'getLocation:fail auth deny' }
    expect(getLocationErrorGuide(err, 'android')).toBeNull()
    expect(getLocationErrorGuide(err, 'ios')).toBeNull()
    expect(getLocationErrorGuide(err, 'mp-weixin')).toBeNull()
  })
})
