import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('登录页协议勾选校验', () => {
  const loginPath = path.resolve(__dirname, '../pages/login/index.vue')
  const loginSource = fs.readFileSync(loginPath, 'utf-8')

  it('协议勾选应默认不勾选', () => {
    expect(loginSource).toContain('const isAgreed = ref(false)')
  })

  it('未勾选协议时登录应提示勾选协议和隐私政策', () => {
    const expectedMessage = '请先勾选并同意用户协议和隐私政策'

    expect(loginSource).toContain(`proxy.$modal.msgError("${expectedMessage}")`)
    expect(loginSource).not.toContain('const isAgreed = ref(true)')
  })
})
