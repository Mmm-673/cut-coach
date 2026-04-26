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

// 发起提现申请
export function createWithdrawal(data) {
  return request({
    url: '/coach-api/billiard/wallet/withdrawal/create',
    method: 'post',
    data
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

// 提交扣款申诉
export function postDeductionAppeal(data) {
  return request({
    url: '/coach-api/billiard/wallet/deduction/appeal',
    method: 'post',
    data
  })
}
