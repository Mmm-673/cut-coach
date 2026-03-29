import config from '@/config'
import { getAccessToken, getRefreshToken, isTokenExpiring, setAuthInfo, removeAuthInfo } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { toast, showConfirm, tansParams } from '@/utils/common'
import { refreshToken } from '@/api/login'

let timeout = 10000
const baseUrl = config.baseUrl

// 是否正在刷新 token
let isRefreshing = false
// 刷新 token 时的等待队列
let refreshSubscribers = []

// 订阅刷新 token 回调
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

// 执行所有订阅的回调
function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

// 刷新 token 的统一处理
function doRefreshToken() {
  if (isRefreshing) {
    return new Promise(resolve => {
      subscribeTokenRefresh(() => {
        resolve()
      })
    })
  }

  isRefreshing = true
  const rt = getRefreshToken()

  return new Promise((resolve, reject) => {
    refreshToken(rt).then(res => {
      if (res.code === 0) {
        setAuthInfo(res.data)
        onTokenRefreshed(res.data.accessToken)
        resolve(res.data.accessToken)
      } else {
        reject(res)
      }
    }).catch(err => {
      reject(err)
    }).finally(() => {
      isRefreshing = false
    })
  })
}

const request = config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  config.header = config.header || {}

  // 添加 tenant-id
  config.header['tenant-id'] = '122'

  if (getAccessToken() && !isToken) {
    config.header['Authorization'] = 'Bearer ' + getAccessToken()
  }

  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.url = url
  }

  return new Promise((resolve, reject) => {
    const doRequest = () => {
      uni.request({
        method: config.method || 'get',
        timeout: config.timeout || timeout,
        url: config.baseUrl || baseUrl + config.url,
        data: config.data,
        header: config.header,
        dataType: 'json'
      }).then(async response => {
        const res = response
        const code = res.data.code !== undefined ? res.data.code : 200
        const msg = errorCode[code] || res.data.msg || errorCode['default']

        if (code === 0 || code === 200) {
          resolve(res.data)
        } else if (code === 401) {
          // 尝试刷新 token
          if (getRefreshToken()) {
            try {
              await doRefreshToken()
              // 刷新成功，重新发送请求
              config.header['Authorization'] = 'Bearer ' + getAccessToken()
              doRequest()
            } catch (e) {
              // 刷新失败，跳转登录
              handleAuthExpired()
              reject('无效的会话，或者会话已过期，请重新登录。')
            }
          } else {
            handleAuthExpired()
            reject('无效的会话，或者会话已过期，请重新登录。')
          }
        } else if (code === 500) {
          toast(msg)
          reject('500')
        } else {
          toast(msg)
          reject(code)
        }
      }).catch(error => {
        let { message } = error
        if (message === 'Network Error') {
          message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
          message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
          message = '系统接口' + message.slice(-3) + '异常'
        }
        toast(message)
        reject(error)
      })
    }

    // 如果 token 快过期，先刷新再请求（排除刷新 token 接口本身）
    const isRefreshTokenApi = config.url && config.url.includes('/refresh-token')
    if (!isToken && !isRefreshTokenApi && isTokenExpiring() && getRefreshToken()) {
      doRefreshToken().then(() => {
        config.header['Authorization'] = 'Bearer ' + getAccessToken()
        doRequest()
      }).catch(() => {
        doRequest()
      })
    } else {
      doRequest()
    }
  })
}

function handleAuthExpired() {
  showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
    if (res.confirm) {
      removeAuthInfo()
      uni.reLaunch({ url: '/pages/login/index' })
    }
  })
}

export default request
