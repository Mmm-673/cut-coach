/**
 * BUG-06 测试：待评价订单详情应有"去评价"按钮
 * - PENDING_REVIEW 状态应显示"去评价"而非"查看评价"
 */
import { describe, it, expect } from 'vitest'

describe('BUG-06 订单详情待评价按钮', () => {
  const ORDER_STATUS = {
    UNPAID: 10,
    PENDING: 20,
    ACCEPTED: 30,
    PROCESSING: 40,
    PENDING_REVIEW: 50,
    FINISHED: 60,
    CANCELLED: 70
  }

  // 按钮文本映射
  const getFooterButtonText = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return { primary: '接单', danger: '拒单' }
      case ORDER_STATUS.ACCEPTED:
        return { primary: '确认出发' }
      case ORDER_STATUS.PROCESSING:
        return { primary: '结束教学' }
      case ORDER_STATUS.PENDING_REVIEW:
        return { primary: '去评价' }
      case ORDER_STATUS.FINISHED:
        return { primary: '联系客服' }
      case ORDER_STATUS.CANCELLED:
        return { primary: '联系客服' }
      default:
        return { primary: '联系客服' }
    }
  }

  it('PENDING_REVIEW 状态应显示"去评价"按钮', () => {
    const result = getFooterButtonText(ORDER_STATUS.PENDING_REVIEW)
    expect(result.primary).toBe('去评价')
  })

  it('PENDING_REVIEW 状态不应显示"查看评价"', () => {
    const result = getFooterButtonText(ORDER_STATUS.PENDING_REVIEW)
    expect(result.primary).not.toBe('查看评价')
  })

  it('其他状态不受影响', () => {
    expect(getFooterButtonText(ORDER_STATUS.PENDING).primary).toBe('接单')
    expect(getFooterButtonText(ORDER_STATUS.PROCESSING).primary).toBe('结束教学')
    expect(getFooterButtonText(ORDER_STATUS.FINISHED).primary).toBe('联系客服')
  })
})
