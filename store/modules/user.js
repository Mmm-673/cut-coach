import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from '@/config'
import storage from '@/utils/storage'
import constant from '@/utils/constant'
import { isHttp, isEmpty } from "@/utils/validate"
import { getInfo, login, smsLogin, logout } from '@/api/login'
import { getAccessToken, setAuthInfo, removeAuthInfo, getUserId } from '@/utils/auth'
import { clearPushAlias } from '@/utils/jpush'
import { resetAuthExpiredState } from '@/utils/request'
import wsManager from '@/utils/websocket'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl

// 简单安全的从存储获取值
function safeGetStorage(key, defaultValue = '') {
  try {
    const value = storage.get(key)
    if (value === undefined || value === null || value === '') {
      return defaultValue
    }
    return value
  } catch (e) {
    console.error('获取存储失败:', key, e)
    return defaultValue
  }
}

// 安全的解析数组
function safeParseArray(value, defaultValue) {
  if (Array.isArray(value) && value.length > 0) {
    return value
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    } catch (e) {
      // 忽略
    }
  }
  return defaultValue
}

// 从本地存储恢复用户信息
function restoreFromStorage() {
  console.log('从本地存储恢复用户信息')

  const savedName = safeGetStorage(constant.name, '裁教')
  const savedAvatar = safeGetStorage(constant.avatar, defAva)
  const savedRoles = safeParseArray(storage.get(constant.roles), ['ROLE_COACH'])
  const savedPermissions = safeParseArray(storage.get(constant.permissions), ['*'])
  const savedId = getUserId() || safeGetStorage(constant.id, '')

  console.log('恢复的用户信息:', { savedName, savedAvatar, savedId })

  return {
    name: savedName,
    avatar: savedAvatar,
    roles: savedRoles,
    permissions: savedPermissions,
    id: savedId
  }
}

export const useUserStore = defineStore('user', () => {
  const restored = restoreFromStorage()

  const token = ref(getAccessToken() || '')
  const id = ref(restored.id)
  const name = ref(restored.name)
  const avatar = ref(restored.avatar)
  const roles = ref(restored.roles)
  const permissions = ref(restored.permissions)

  const SET_TOKEN = (val) => {
    token.value = val
  }
  const SET_ID = (val) => {
    id.value = val
    storage.set(constant.id, val)
  }
  const SET_NAME = (val) => {
    name.value = val
    storage.set(constant.name, val)
  }
  const SET_AVATAR = (val) => {
    avatar.value = val
    storage.set(constant.avatar, val)
  }
  const SET_ROLES = (val) => {
    roles.value = val
    storage.set(constant.roles, val)
  }
  const SET_PERMISSIONS = (val) => {
    permissions.value = val
    storage.set(constant.permissions, val)
  }

  // 处理登录响应
  const handleLoginResponse = (res) => {
    if (res.code === 0 || res.code === 200) {
      setAuthInfo(res.data)
      SET_TOKEN(res.data.accessToken)
      if (res.data.userId) {
        SET_ID(res.data.userId)
      }
      // 登录成功后连接 WebSocket，失败不影响登录流程
      try {
        wsManager.connect()
      } catch (e) {
        console.warn('WebSocket 连接失败:', e)
      }
      return Promise.resolve()
    } else {
      return Promise.reject(res.msg || '登录失败')
    }
  }

  // 账号密码登录
  const loginAction = (userInfo) => {
    return new Promise((resolve, reject) => {
      login({
        username: userInfo.username.trim(),
        password: userInfo.password
      }).then(res => {
        handleLoginResponse(res).then(resolve).catch(reject)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 短信登录
  const smsLoginAction = (userInfo) => {
    return new Promise((resolve, reject) => {
      smsLogin({
        mobile: userInfo.username.trim(),
        code: userInfo.smsCode
      }).then(res => {
        handleLoginResponse(res).then(resolve).catch(reject)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 获取用户信息
  const getInfoAction = () => {
    return new Promise((resolve, reject) => {
      console.log('开始获取用户信息')
      getInfo().then(res => {
        console.log('获取用户信息响应:', res)

        // 处理响应数据，兼容不同格式
        let data = res
        if (res.code === 0 || res.code === 200) {
          data = res.data || res
        }

        // 从 data 中提取用户信息
        const user = data.user || data
        let userAvatar = user.avatar || user.avatarUrl || ''
        if (!isHttp(userAvatar)) {
          userAvatar = (isEmpty(userAvatar)) ? defAva : (userAvatar.startsWith('http') ? userAvatar : baseUrl + userAvatar)
        }

        // 获取用户ID
        let userId = user.userId || user.id || getUserId()

        // 获取用户名
        let userName = user.userName || user.nickname || user.name || '裁教'

        // 处理角色和权限
        let userRoles = data.roles || user.roles || ['ROLE_COACH']
        let userPermissions = data.permissions || user.permissions || ['*']

        // 确保是数组格式
        if (!Array.isArray(userRoles)) userRoles = ['ROLE_COACH']
        if (!Array.isArray(userPermissions)) userPermissions = ['*']

        console.log('处理后的用户信息:', { userName, userAvatar, userId, userRoles })

        // 设置到 store
        SET_ID(userId)
        SET_NAME(userName)
        SET_AVATAR(userAvatar)
        SET_ROLES(userRoles)
        SET_PERMISSIONS(userPermissions)

        resolve(data)
      }).catch(error => {
        console.error('获取用户信息失败:', error)
        reject(error)
      })
    })
  }

  // 退出系统
  const logOutAction = () => {
    return new Promise((resolve, reject) => {
      logout().then(() => {
        SET_TOKEN('')
        SET_ROLES([])
        SET_PERMISSIONS([])
        removeAuthInfo()
        storage.clean()
        resetAuthExpiredState()
        wsManager.close()
        resolve()
        clearPushAlias()
      }).catch(() => {
        // 即使退出接口失败，也要清理本地状态
        SET_TOKEN('')
        SET_ROLES([])
        SET_PERMISSIONS([])
        removeAuthInfo()
        storage.clean()
        resetAuthExpiredState()
        wsManager.close()
        resolve()
      })
    })
  }

  return {
    token,
    id,
    name,
    avatar,
    roles,
    permissions,
    SET_AVATAR,
    login: loginAction,
    smsLogin: smsLoginAction,
    getInfo: getInfoAction,
    logOut: logOutAction
  }
})
