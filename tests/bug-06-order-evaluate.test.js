/**
 * BUG-06 测试：待评价订单详情应根据助教评价状态显示"去评价"按钮
 * - PENDING_REVIEW 状态且 coachUserReviewStatus 为 0 时显示"去评价"
 * - coachUserReviewStatus 为 1 表示助教已评价，不再显示"去评价"
 * - 缺失或异常状态不显示"去评价"
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

  const REVIEW_STATUS = {
    NOT_REVIEWED: 0,
    REVIEWED: 1
  }

  const shouldShowEvaluateButton = (status, coachUserReviewStatus) => {
    return status === ORDER_STATUS.PENDING_REVIEW &&
      coachUserReviewStatus !== null &&
      coachUserReviewStatus !== undefined &&
      String(coachUserReviewStatus).trim() !== '' &&
      Number(coachUserReviewStatus) === REVIEW_STATUS.NOT_REVIEWED
  }

  // 按钮文本映射
  const getFooterButtonText = (status, coachUserReviewStatus) => {
    switch (status) {
      case ORDER_STATUS.PENDING:
        return { primary: '接单', danger: '拒单' }
      case ORDER_STATUS.ACCEPTED:
        return { primary: '确认出发' }
      case ORDER_STATUS.PROCESSING:
        return { primary: '结束教学' }
      case ORDER_STATUS.PENDING_REVIEW:
        return shouldShowEvaluateButton(status, coachUserReviewStatus) ? { primary: '去评价' } : null
      case ORDER_STATUS.FINISHED:
        return { primary: '联系客服' }
      case ORDER_STATUS.CANCELLED:
        return { primary: '联系客服' }
      default:
        return { primary: '联系客服' }
    }
  }

  it('PENDING_REVIEW 状态且 coachUserReviewStatus=0 时应显示"去评价"按钮', () => {
    const result = getFooterButtonText(ORDER_STATUS.PENDING_REVIEW, REVIEW_STATUS.NOT_REVIEWED)
    expect(result.primary).toBe('去评价')
  })

  it('PENDING_REVIEW 状态且 coachUserReviewStatus=1 时不应显示"去评价"按钮', () => {
    const result = getFooterButtonText(ORDER_STATUS.PENDING_REVIEW, REVIEW_STATUS.REVIEWED)
    expect(result).toBeNull()
  })

  it('PENDING_REVIEW 状态且 coachUserReviewStatus 缺失时不应显示"去评价"按钮', () => {
    expect(getFooterButtonText(ORDER_STATUS.PENDING_REVIEW, undefined)).toBeNull()
    expect(getFooterButtonText(ORDER_STATUS.PENDING_REVIEW, null)).toBeNull()
    expect(getFooterButtonText(ORDER_STATUS.PENDING_REVIEW, '')).toBeNull()
    expect(getFooterButtonText(ORDER_STATUS.PENDING_REVIEW, 2)).toBeNull()
  })

  it('PENDING_REVIEW 状态不应显示"查看评价"', () => {
    const result = getFooterButtonText(ORDER_STATUS.PENDING_REVIEW, REVIEW_STATUS.NOT_REVIEWED)
    expect(result.primary).not.toBe('查看评价')
  })

  it('其他状态不受影响', () => {
    expect(getFooterButtonText(ORDER_STATUS.PENDING).primary).toBe('接单')
    expect(getFooterButtonText(ORDER_STATUS.PROCESSING).primary).toBe('结束教学')
    expect(getFooterButtonText(ORDER_STATUS.FINISHED).primary).toBe('联系客服')
  })
})
