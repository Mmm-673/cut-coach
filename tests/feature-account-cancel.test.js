import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('个人中心账号注销', () => {
  const minePath = path.resolve(__dirname, '../pages/mine/index.vue')
  const settingPath = path.resolve(__dirname, '../subpkg/mine/setting/index.vue')
  const coachApiPath = path.resolve(__dirname, '../api/billiard/coach.js')
  const mineSource = fs.readFileSync(minePath, 'utf-8')
  const settingSource = fs.readFileSync(settingPath, 'utf-8')
  const coachApiSource = fs.readFileSync(coachApiPath, 'utf-8')

  it('个人中心应在退出登录前提供账号注销入口', () => {
    const cancelIndex = mineSource.indexOf('注销账号')
    const logoutIndex = mineSource.indexOf('退出登录')

    expect(cancelIndex).toBeGreaterThan(-1)
    expect(logoutIndex).toBeGreaterThan(-1)
    expect(cancelIndex).toBeLessThan(logoutIndex)
    expect(mineSource).toContain('@click="handleCancelAccount"')
    expect(settingSource).not.toContain('@click="handleCancelAccount"')
  })

  it('注销账号应先确认再弹出底部原因输入框', () => {
    expect(mineSource).toContain('确定注销账号吗')
    expect(mineSource).toContain('showCancelAccountPopup')
    expect(mineSource).toContain('注销原因')
    expect(mineSource).toContain('placeholder="请输入注销原因（选填）"')
  })

  it('提交注销账号应调用接口并成功后退出登录', () => {
    expect(mineSource).toContain('cancelAccount({')
    expect(mineSource).toContain('reason: cancelReason.value')
    expect(mineSource).toContain('useUserStore().logOut()')
    expect(mineSource).toContain("proxy.$tab.reLaunch('/pages/login/index')")
  })

  it('教练 API 应提供注销账号方法', () => {
    expect(coachApiSource).toContain('export function cancelAccount(data)')
    expect(coachApiSource).toContain("url: '/coach-api/billiard/coach/account/cancel-account'")
    expect(coachApiSource).toContain("method: 'post'")
  })
})
