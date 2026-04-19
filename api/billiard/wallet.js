import request from '@/utils/request'

// 查询助教可提现余额
export function getWalletBalance() {
  return request({
    url: '/coach-api/billiard/wallet/balance',
    method: 'get'
  })
}

// 获取提现记录（分页）
export function getWithdrawalPage(params) {
  return request({
    url: '/coach-api/billiard/wallet/withdrawal/page',
    method: 'get',
    params
  })
}

// 获取扣款记录（分页）
export function getDeductionPage(params) {
  return request({
    url: '/coach-api/billiard/wallet/deduction/page',
    method: 'get',
    params
  })
}
