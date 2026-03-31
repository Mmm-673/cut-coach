import request from '@/utils/request'

// 获取待接单列表
export function getPendingOrders() {
  return request({
    url: '/coach-api/billiard/order/pending',
    method: 'get'
  })
}

// 接单
export function acceptOrder(data) {
  return request({
    url: '/coach-api/billiard/order/accept',
    method: 'post',
    data: data
  })
}

// 确认出发
export function confirmDeparture(data) {
  return request({
    url: '/coach-api/billiard/order/confirm-departure',
    method: 'post',
    data: data
  })
}

// 到达服务地址
export function arrive(data) {
  return request({
    url: '/coach-api/billiard/order/arrive',
    method: 'post',
    data: data
  })
}

// 拒单
export function rejectOrder(data) {
  return request({
    url: '/coach-api/billiard/order/reject',
    method: 'post',
    data: data
  })
}

// 开始服务
export function startService(data) {
  return request({
    url: '/coach-api/billiard/order/start',
    method: 'post',
    data: data
  })
}

// 结束服务
export function finishService(data) {
  return request({
    url: '/coach-api/billiard/order/finish',
    method: 'post',
    data: data
  })
}
