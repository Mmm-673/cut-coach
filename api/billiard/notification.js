import request from '@/utils/request'

const BASE_PATH = '/coach-api/billiard/notification-center'

// 分页获取通知列表
export function getNotificationPage(params) {
  return request({
    url: `${BASE_PATH}/page`,
    method: 'get',
    params: params
  })
}

// 获取通知详情
export function getNotificationDetail(id) {
  return request({
    url: `${BASE_PATH}/get`,
    method: 'get',
    params: { id }
  })
}

// 获取未读数量
export function getUnreadCount() {
  return request({
    url: `${BASE_PATH}/unread-count`,
    method: 'get'
  })
}

// 标记单条通知为已读
export function readNotification(id) {
  return request({
    url: `${BASE_PATH}/read`,
    method: 'post',
    data: { id }
  })
}

// 标记全部通知为已读
export function readAllNotification() {
  return request({
    url: `${BASE_PATH}/read-all`,
    method: 'post'
  })
}
