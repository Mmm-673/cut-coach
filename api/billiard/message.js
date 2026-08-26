import request from '@/utils/request'

// ============================================================
// 后台消息 / 霸屏打赏动效 相关 API
// TODO: 等后端接口确认后替换路径和字段
// ============================================================

/**
 * 查询最新的一条"打赏消息"
 * 后台推送用户打赏通知，用于触发霸屏小心心动效
 *
 * 后端返回示例（暂定）：
 * {
 *   code: 200,
 *   data: {
 *     id: 123,
 *     avatar: 'http://xxx.jpg',
 *     nickname: '小美同学',
 *     content: '教练教得太棒啦！',
 *     amount: '99.00',
 *     tags: ['老客户', '豪爽'],
 *     createTime: '2026-08-19 12:00:00'
 *   }
 * }
 */
export const getLatestHeartMessage = () => {
  // 先返回模拟数据，等接口就绪后替换为真实请求
  return new Promise((resolve) => {
    // 30% 概率返回一条新打赏消息
    const hasNew = Math.random() < 0.3
    if (!hasNew) {
      resolve({ code: 200, data: null })
      return
    }

    const mockList = [
      {
        id: Date.now() + 1,
        avatar: '',
        nickname: '小美同学',
        content: '教练教得超棒，下次还约！💕',
        amount: '88.00',
        tags: ['萌新', '颜值高'],
      },
      {
        id: Date.now() + 2,
        avatar: '',
        nickname: '台球小王子',
        content: '一杯咖啡，辛苦了☕',
        amount: '38.00',
        tags: ['老客户', '豪爽'],
      },
      {
        id: Date.now() + 3,
        avatar: '',
        nickname: '匿名用户',
        content: '送你一束鲜花💐',
        amount: '66.66',
        tags: ['神秘人'],
      },
      {
        id: Date.now() + 4,
        avatar: '',
        nickname: '爱打球的小李',
        content: '涨球了！感谢教练',
        amount: '188.00',
        tags: ['VIP', '铁粉'],
      },
      {
        id: Date.now() + 5,
        avatar: '',
        nickname: '小白',
        content: '小心意，请笑纳😉',
        amount: '52.00',
        tags: ['萌新'],
      },
    ]

    const pick = mockList[Math.floor(Math.random() * mockList.length)]
    resolve({
      code: 200,
      data: pick,
    })
  })

  // 真实接口（后面替换为这个）：
  // return request({
  //   url: '/billiard/coach/reward/latest',
  //   method: 'get',
  // })
}
