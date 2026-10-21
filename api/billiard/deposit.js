import request from '@/utils/request'

// 查询当前助教押金概览（门槛/余额/双缺口），后端绑定本人，无需传 coachId
export function getDepositOverview() {
  return request({
    url: '/coach-api/billiard/deposit/get',
    method: 'get'
  })
}

// 押金流水分页，最新在前
export function getDepositFlowPage(params) {
  return request({
    url: '/coach-api/billiard/deposit/flow/page',
    method: 'get',
    params
  })
}

// 获取押金可用缴纳渠道列表（返回渠道字符串数组，如 ['wx_app','alipay_app']）
export function getDepositChannelList() {
  return request({
    url: '/coach-api/billiard/deposit/channel-list',
    method: 'get'
  })
}

// 创建押金支付单（amount 正整数分；channelCode wx_app/alipay_app；requestId 1~64 字符幂等键）
export function createDepositPayment(data) {
  return request({
    url: '/coach-api/billiard/deposit/payment/create',
    method: 'post',
    data
  })
}

// 提交押金支付单（channelExtras 可省略）
export function submitDepositPayment(data) {
  return request({
    url: '/coach-api/billiard/deposit/payment/submit',
    method: 'post',
    data
  })
}

// 查询押金支付单入账状态（status: CREATED 未入账 / CREDITED 已入账）
export function getDepositPayment(id) {
  return request({
    url: '/coach-api/billiard/deposit/payment/get',
    method: 'get',
    params: { id }
  })
}
