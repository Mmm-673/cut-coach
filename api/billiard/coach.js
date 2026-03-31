import request from '@/utils/request'

// 切换工作状态（上线/下线）
export function updateWorkStatus(data) {
  return request({
    url: '/coach-api/billiard/coach/work-status',
    method: 'post',
    data: data
  })
}

// 更新助教坐标
export function updateLocation(data) {
  return request({
    url: '/coach-api/billiard/coach/location',
    method: 'post',
    data: data
  })
}

// 获取助教个人信息
export function getCoachProfile() {
  return request({
    url: '/coach-api/billiard/coach/profile',
    method: 'get'
  })
}
