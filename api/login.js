import request from '@/utils/request'

// 助教登录
export function login(data) {
  return request({
    url: '/coach-api/billiard/coach/auth/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 助教退出登录
export function logout() {
  return request({
    url: '/coach-api/billiard/coach/auth/logout',
    method: 'post'
  })
}

// 刷新 Token
export function refreshToken(refreshToken) {
  return request({
    url: '/coach-api/billiard/coach/auth/refresh-token',
    headers: {
      isToken: false
    },
    method: 'post',
    params: { refreshToken }
  })
}

// 以下为兼容旧代码的保留方法
export function register(data) {
  return Promise.reject('暂不支持注册')
}

export function getInfo() {
  return Promise.resolve({
    user: {
      userId: uni.getStorageSync('Coach-User-Id'),
      userName: '助教'
    },
    roles: ['ROLE_COACH'],
    permissions: ['*']
  })
}

export function getCodeImg() {
  return Promise.resolve({
    captchaEnabled: false
  })
}
