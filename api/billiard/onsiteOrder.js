import request from '@/utils/request'

// 手机号后四位查询会员
export function searchMember(mobileSuffix) {
  return request({
    url: '/coach-api/billiard/onsite-order/member-search',
    method: 'get',
    params: { mobileSuffix }
  })
}

// 创建现场订单
export function createOnsiteOrder(data) {
  return request({
    url: '/coach-api/billiard/onsite-order/create',
    method: 'post',
    data
  })
}

// 现场订单分页列表
export function getOnsiteOrderPage(params) {
  return request({
    url: '/coach-api/billiard/onsite-order/page',
    method: 'get',
    params
  })
}

// 现场订单详情
export function getOnsiteOrderDetail(id) {
  return request({
    url: '/coach-api/billiard/onsite-order/get',
    method: 'get',
    params: { id }
  })
}

// 取消现场订单
export function cancelOnsiteOrder(orderId) {
  return request({
    url: '/coach-api/billiard/onsite-order/cancel',
    method: 'post',
    data: { orderId }
  })
}

// 开始服务
export function startOnsiteService(orderId) {
  return request({
    url: '/coach-api/billiard/onsite-order/start',
    method: 'post',
    data: { orderId }
  })
}

// 结束服务并锁价
export function finishOnsiteService(data) {
  return request({
    url: '/coach-api/billiard/onsite-order/finish',
    method: 'post',
    data
  })
}
