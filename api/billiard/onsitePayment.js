import request from '@/utils/request'

// 创建助教本机 App 支付尝试
export function createOnsitePayment(data) {
  return request({
    url: '/coach-api/billiard/onsite-payment/create',
    method: 'post',
    data
  })
}

// 创建助教本机 App 支付尝试
export function createOnsitePaymentSubmit(data) {
  return request({
    url: '/coach-api/billiard/onsite-payment/submit',
    method: 'post',
    data
  })
}

// 创建固定金额原生二维码
export function createOnsiteQrCode(data) {
  return request({
    url: '/coach-api/billiard/onsite-payment/create-qr',
    method: 'post',
    data
  })
}

// 查询支付和结算状态
export function getOnsitePaymentStatus(orderId) {
  return request({
    url: '/coach-api/billiard/onsite-payment/status',
    method: 'get',
    params: { orderId }
  })
}

// 获取应用已开启的支付渠道列表
export function getEnablePayChannelList(appId) {
  return request({
    url: '/coach-api/billiard/pay/channel/get-enable-code-list',
    method: 'get',
    params: { appId }
  })
}
