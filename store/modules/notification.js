import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getUnreadCount,
  readNotification,
  readAllNotification
} from '@/api/billiard/notification'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  // 获取未读数量
  const fetchUnreadCount = () => {
    return new Promise((resolve, reject) => {
      getUnreadCount().then(res => {
        if (res.code === 0 || res.code === 200) {
          unreadCount.value = Number(res.data) || 0
        }
        resolve(res)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 标记单条通知为已读
  const markRead = (id) => {
    return new Promise((resolve, reject) => {
      readNotification(id).then(res => {
        if (res.code === 0 || res.code === 200) {
          fetchUnreadCount()
        }
        resolve(res)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 标记全部通知为已读
  const markAllRead = () => {
    return new Promise((resolve, reject) => {
      readAllNotification().then(res => {
        if (res.code === 0 || res.code === 200) {
          unreadCount.value = 0
        }
        resolve(res)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 新增未读消息（WebSocket 推送时调用）
  const incrementUnread = () => {
    unreadCount.value++
  }

  return {
    unreadCount,
    fetchUnreadCount,
    markRead,
    markAllRead,
    incrementUnread
  }
})
