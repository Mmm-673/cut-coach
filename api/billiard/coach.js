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

// 切换低碳出行开关
export function updateFreeTravel(data) {
  return request({
    url: '/coach-api/billiard/coach/free-travel',
    method: 'post',
    data: data
  })
}

// 获取助教看板数据
export function getCoachDashboard() {
  return request({
    url: '/coach-api/billiard/coach/dashboard',
    method: 'get'
  })
}

// 查询当前本人工作状态
export function getWorkStatus() {
  return request({
    url: '/coach-api/billiard/coach/work-status',
    method: 'get'
  })
}

// 注销账号
export function cancelAccount(data) {
  return request({
    url: '/coach-api/billiard/coach/account/cancel-account',
    method: 'post',
    data: data
  })
}

// 获取评价列表
export function getReviewPage(params) {
  return request({
    url: '/coach-api/billiard/coach/review/page',
    method: 'get',
    params: params
  })
}

// 助教评价用户
export function createUserReview(data) {
  return request({
    url: '/coach-api/billiard/coach/review/create-user-review',
    method: 'post',
    data: data
  })
}

// 查询用户历史被评价
export function getUserReviewHistoryPage(params) {
  return request({
    url: '/coach-api/billiard/coach/review/user-history-page',
    method: 'get',
    params: params
  })
}
