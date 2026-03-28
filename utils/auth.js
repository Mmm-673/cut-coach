const ACCESS_TOKEN_KEY = 'Coach-Access-Token'
const REFRESH_TOKEN_KEY = 'Coach-Refresh-Token'
const EXPIRES_TIME_KEY = 'Coach-Expires-Time'
const USER_ID_KEY = 'Coach-User-Id'

export function getAccessToken() {
  return uni.getStorageSync(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token) {
  return uni.setStorageSync(ACCESS_TOKEN_KEY, token)
}

export function getRefreshToken() {
  return uni.getStorageSync(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token) {
  return uni.setStorageSync(REFRESH_TOKEN_KEY, token)
}

export function getExpiresTime() {
  return uni.getStorageSync(EXPIRES_TIME_KEY)
}

export function setExpiresTime(time) {
  return uni.setStorageSync(EXPIRES_TIME_KEY, time)
}

export function getUserId() {
  return uni.getStorageSync(USER_ID_KEY)
}

export function setUserId(userId) {
  return uni.setStorageSync(USER_ID_KEY, userId)
}

// 判断 token 是否快过期（提前5分钟刷新）
export function isTokenExpiring() {
  const expiresTime = getExpiresTime()
  if (!expiresTime) return true
  const now = Date.now()
  return now > expiresTime - 5 * 60 * 1000
}

export function setAuthInfo(data) {
  setAccessToken(data.accessToken)
  setRefreshToken(data.refreshToken)
  setExpiresTime(data.expiresTime)
  if (data.userId) {
    setUserId(data.userId)
  }
}

export function removeAuthInfo() {
  uni.removeStorageSync(ACCESS_TOKEN_KEY)
  uni.removeStorageSync(REFRESH_TOKEN_KEY)
  uni.removeStorageSync(EXPIRES_TIME_KEY)
  uni.removeStorageSync(USER_ID_KEY)
}

// 兼容旧代码的 getToken/setToken/removeToken
export function getToken() {
  return getAccessToken()
}

export function setToken(token) {
  return setAccessToken(token)
}

export function removeToken() {
  return removeAuthInfo()
}
