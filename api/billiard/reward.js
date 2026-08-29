import request from '@/utils/request'

// 获取打赏记录（分页）
export function getRewardPage(params) {
  return request({
    url: '/coach-api/billiard/reward/page',
    method: 'get',
    params
  })
}

// 打赏汇总（累计金额、笔数）
export function getRewardSummary() {
  return request({
    url: '/coach-api/billiard/reward/summary',
    method: 'get'
  })
}
