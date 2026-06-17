import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from '@/config'
import storage from '@/utils/storage'
import constant from '@/utils/constant'
import { isHttp, isEmpty } from "@/utils/validate"
import { getInfo, login, smsLogin, logout } from '@/api/login'
import { getAccessToken, setAuthInfo, removeAuthInfo, getUserId } from '@/utils/auth'
import { clearPushAlias } from '@/utils/jpush'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl

export const useUserStore = defineStore('user', () => {
  const token = ref(getAccessToken())
  const id = ref(getUserId())
  const name = ref(storage.get(constant.name) || '裁教')
  const avatar = ref(storage.get(constant.avatar) || defAva)
  const roles = ref(storage.get(constant.roles) || ['ROLE_COACH'])
  const permissions = ref(storage.get(constant.permissions) || ['*'])

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
    if (res.code === 0) {
      setAuthInfo(res.data)
      SET_TOKEN(res.data.accessToken)
      SET_ID(res.data.userId)
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
      getInfo().then(res => {
        const user = res.user
        let userAvatar = user.avatar || ""
        if (!isHttp(userAvatar)) {
          userAvatar = (isEmpty(userAvatar)) ? defAva : baseUrl + userAvatar
        }
        const userid = (isEmpty(user) || isEmpty(user.userId)) ? getUserId() : user.userId
        const username = (isEmpty(user) || isEmpty(user.userName)) ? '裁教' : user.userName
        if (res.roles && res.roles.length > 0) {
          SET_ROLES(res.roles)
          SET_PERMISSIONS(res.permissions)
        } else {
          SET_ROLES(['ROLE_COACH'])
        }
        SET_ID(userid)
        SET_NAME(username)
        SET_AVATAR(userAvatar)
        resolve(res)
      }).catch(error => {
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
        resolve()
        clearPushAlias()
      }).catch(() => {
        // 即使退出接口失败，也要清理本地状态
        SET_TOKEN('')
        SET_ROLES([])
        SET_PERMISSIONS([])
        removeAuthInfo()
        storage.clean()
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
