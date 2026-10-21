/**
 * 押金模块纯函数单元测试
 * 覆盖：金额分转元、流水类型标签、带符号金额、上线预检判断
 */
import { describe, it, expect } from 'vitest'
import {
  formatDepositAmount,
  getBizTypeText,
  formatSignedAmount,
  checkDepositBeforeOnline,
  validatePayAmount,
  getChannelText
} from '@/utils/deposit'

describe('formatDepositAmount 金额分转元', () => {
  it('正常分转元', () => {
    expect(formatDepositAmount(30000)).toBe('300.00')
  })

  it('0 分显示 0.00', () => {
    expect(formatDepositAmount(0)).toBe('0.00')
  })

  it('null 显示 —（不默认 0）', () => {
    expect(formatDepositAmount(null)).toBe('—')
  })

  it('空字符串显示 —', () => {
    expect(formatDepositAmount('')).toBe('—')
  })

  it('undefined 显示 —', () => {
    expect(formatDepositAmount(undefined)).toBe('—')
  })

  it('非数字显示 —', () => {
    expect(formatDepositAmount('abc')).toBe('—')
  })

  it('负数金额转元', () => {
    expect(formatDepositAmount(-500)).toBe('-5.00')
  })
})

describe('getBizTypeText 流水类型标签', () => {
  it('PAYMENT 显示押金缴纳', () => {
    expect(getBizTypeText('PAYMENT')).toBe('押金缴纳')
  })

  it('PENALTY 显示押金处罚', () => {
    expect(getBizTypeText('PENALTY')).toBe('押金处罚')
  })

  it('未知类型显示通用标签', () => {
    expect(getBizTypeText('SOMETHING_NEW')).toBe('资金变动')
    expect(getBizTypeText(undefined)).toBe('资金变动')
  })
})

describe('formatSignedAmount 带符号金额', () => {
  it('正数带加号且为收入', () => {
    expect(formatSignedAmount(30000)).toEqual({ text: '+300.00', isIncome: true })
  })

  it('负数带减号且为支出', () => {
    expect(formatSignedAmount(-500)).toEqual({ text: '-5.00', isIncome: false })
  })

  it('0 视为收入', () => {
    expect(formatSignedAmount(0)).toEqual({ text: '+0.00', isIncome: true })
  })

  it('空值显示 —', () => {
    expect(formatSignedAmount(null)).toEqual({ text: '—', isIncome: true })
  })
})

describe('checkDepositBeforeOnline 上线预检', () => {
  it('未配置押金（enabled=false）放行', () => {
    expect(checkDepositBeforeOnline({ enabled: false, balance: 0 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('overview 为空放行（预检失败不阻塞上线）', () => {
    expect(checkDepositBeforeOnline(null)).toEqual({ allowed: true, shortfall: null })
  })

  it('已配置且余额等于门槛放行', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: 10000, requiredAmount: 10000 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('已配置且余额高于门槛放行', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: 30000, requiredAmount: 10000 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('已配置且余额低于门槛拦截', () => {
    const result = checkDepositBeforeOnline({
      enabled: true, balance: 5000, requiredAmount: 10000, onlineShortfall: 5000
    })
    expect(result.allowed).toBe(false)
    expect(result.shortfall).toBe(5000)
  })

  it('拦截时优先使用后端 onlineShortfall', () => {
    const result = checkDepositBeforeOnline({
      enabled: true, balance: 5000, requiredAmount: 10000, onlineShortfall: 7000
    })
    expect(result.shortfall).toBe(7000)
  })

  it('无 onlineShortfall 时按门槛减余额计算', () => {
    const result = checkDepositBeforeOnline({ enabled: true, balance: 5000, requiredAmount: 10000 })
    expect(result.shortfall).toBe(5000)
  })

  it('balance 为 null 时不拦截（数据不完整，交给后端判定）', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: null, requiredAmount: 10000 }))
      .toEqual({ allowed: true, shortfall: null })
  })

  it('requiredAmount 为 null 时不拦截', () => {
    expect(checkDepositBeforeOnline({ enabled: true, balance: 0, requiredAmount: null }))
      .toEqual({ allowed: true, shortfall: null })
  })
})

describe('validatePayAmount 缴纳金额校验', () => {
  it('整元金额转分', () => {
    expect(validatePayAmount('300')).toEqual({ valid: true, fen: 30000, error: '' })
  })

  it('一位小数转分', () => {
    expect(validatePayAmount('300.5')).toEqual({ valid: true, fen: 30050, error: '' })
  })

  it('两位小数转分', () => {
    expect(validatePayAmount('300.55')).toEqual({ valid: true, fen: 30055, error: '' })
  })

  it('三位小数拒绝', () => {
    expect(validatePayAmount('300.555').valid).toBe(false)
  })

  it('0 拒绝（需大于 0）', () => {
    expect(validatePayAmount('0').valid).toBe(false)
  })

  it('负数拒绝', () => {
    expect(validatePayAmount('-5').valid).toBe(false)
  })

  it('非数字拒绝', () => {
    expect(validatePayAmount('abc').valid).toBe(false)
  })

  it('空字符串拒绝', () => {
    expect(validatePayAmount('').valid).toBe(false)
  })

  it('纯空白字符串拒绝', () => {
    expect(validatePayAmount('  ').valid).toBe(false)
  })

  it('21474836.47 元等于上限 2147483647 分，通过', () => {
    expect(validatePayAmount('21474836.47')).toEqual({ valid: true, fen: 2147483647, error: '' })
  })

  it('21474836.48 元超出上限，拒绝', () => {
    expect(validatePayAmount('21474836.48').valid).toBe(false)
  })
})

describe('getChannelText 渠道文案', () => {
  it('wx_app 显示微信支付', () => {
    expect(getChannelText('wx_app')).toBe('微信支付')
  })

  it('alipay_app 显示支付宝', () => {
    expect(getChannelText('alipay_app')).toBe('支付宝')
  })

  it('未知渠道原样展示 code', () => {
    expect(getChannelText('union_app')).toBe('union_app')
  })

  it('空值返回空字符串', () => {
    expect(getChannelText(undefined)).toBe('')
  })
})
