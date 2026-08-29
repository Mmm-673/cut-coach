import config from '@/config'
import { getAccessToken } from '@/utils/auth'

// 重连间隔序列（秒）
const RECONNECT_DELAYS = [1, 2, 5, 10, 30]
// 心跳间隔（毫秒）
const HEARTBEAT_INTERVAL = 30000
// 心跳超时时间（毫秒）
const HEARTBEAT_TIMEOUT = 10000

class WsManager {
  constructor() {
    this.socketTask = null
    this.isConnected = false
    this.reconnectIndex = 0
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.heartbeatTimeoutTimer = null
    this.manualClose = false
    this.listeners = {}
    this.networkOff = false
    this._bindNetworkChange()
  }

  /**
   * 构建 WebSocket 连接地址
   */
  _buildUrl() {
    const token = getAccessToken()
    if (!token) {
      return ''
    }
    // 优先使用 config.wsUrl（如果配置了）
    if (config.wsUrl) {
      return `${config.wsUrl}?token=${encodeURIComponent(token)}`
    }
    // 根据 baseUrl 推导 ws 地址
    // https://xxx/test -> wss://xxx/test/infra/ws
    let base = config.baseUrl || ''
    let wsBase = base.replace(/^https?:\/\//, '')
    const protocol = base.startsWith('https') ? 'wss' : 'ws'
    return `${protocol}://${wsBase}/infra/ws?token=${encodeURIComponent(token)}`
  }

  /**
   * 建立连接
   */
  connect() {
    if (this.isConnected || this.socketTask) {
      return
    }
    const url = this._buildUrl()
    if (!url) {
      console.warn('[WS] 无 token，不建立连接')
      return
    }

    console.log('[WS] 正在连接...')
    console.log('[WS] 连接URL:', url)
    console.log('[WS] URL长度:', url.length)
    this.manualClose = false

    this.socketTask = uni.connectSocket({
      url: url,
      success: () => {
        console.log('[WS] connectSocket 调用成功')
      },
      fail: (err) => {
        console.error('[WS] connectSocket 调用失败:', err)
      },
      complete: (res) => {
        console.log('[WS] connectSocket complete:', res)
      }
    })

    this.socketTask.onOpen(() => {
      console.log('[WS] 连接成功')
      this.isConnected = true
      this.reconnectIndex = 0
      this._clearReconnectTimer()
      this._startHeartbeat()
      this._emit('connected')
    })

    this.socketTask.onMessage((res) => {
      this._handleMessage(res.data)
    })

    this.socketTask.onError((err) => {
      console.error('========== WS 错误 ==========')
      console.error('[WS] err:', err)
      console.error('[WS] err.errMsg:', err?.errMsg)
      console.error('[WS] Object.keys:', Object.keys(err || {}))
      for (const key in err) {
        console.error(`[WS] err.${key}:`, err[key])
      }
      console.error('============================')
      this._emit('error', err)
    })

    this.socketTask.onClose((res) => {
      console.log('========== WS 关闭 ==========')
      console.log('[WS] code:', res?.code)
      console.log('[WS] reason:', res?.reason)
      console.log('[WS] wasClean:', res?.wasClean)
      console.log('[WS] Object.keys:', Object.keys(res || {}))
      console.log('============================')
      this.isConnected = false
      this._stopHeartbeat()
      this.socketTask = null
      this._emit('disconnected', { code: res?.code, reason: res?.reason })

      // 非手动关闭，自动重连
      if (!this.manualClose && !this.networkOff) {
        this._scheduleReconnect()
      }
    })
  }

  /**
   * 主动关闭连接（停止重连）
   */
  close() {
    this.manualClose = true
    this._clearReconnectTimer()
    this._stopHeartbeat()
    if (this.socketTask) {
      this.socketTask.close({
        code: 1000,
        reason: 'manual close'
      })
      this.socketTask = null
    }
    this.isConnected = false
  }

  /**
   * Token 刷新后重连（用新 token 建立新连接）
   */
  reconnect() {
    console.log('[WS] Token 刷新，使用新 Token 重连')
    // 关闭旧连接（标记为手动关闭，不触发自动重连）
    if (this.socketTask) {
      this.manualClose = true
      this._clearReconnectTimer()
      this._stopHeartbeat()
      try {
        this.socketTask.close({
          code: 1000,
          reason: 'token refresh'
        })
      } catch (e) {
        // ignore
      }
      this.socketTask = null
      this.isConnected = false
    }
    // 重置状态，用新 token 连接
    this.reconnectIndex = 0
    this.manualClose = false
    // 延迟 100ms，确保 storage 中的 token 已更新
    setTimeout(() => {
      this.connect()
    }, 100)
  }

  /**
   * 发送消息
   * @param {string|object} data
   */
  send(data) {
    if (!this.isConnected || !this.socketTask) {
      return false
    }
    const msg = typeof data === 'string' ? data : JSON.stringify(data)
    this.socketTask.send({ data: msg })
    return true
  }

  // ========== 心跳 ==========

  _startHeartbeat() {
    this._stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (!this.isConnected) return
      this.send('ping')
      // 设置超时检测
      this._clearHeartbeatTimeout()
      this.heartbeatTimeoutTimer = setTimeout(() => {
        console.warn('[WS] 心跳超时，断开重连')
        this.close()
        this.manualClose = false
        this._scheduleReconnect()
      }, HEARTBEAT_TIMEOUT)
    }, HEARTBEAT_INTERVAL)
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this._clearHeartbeatTimeout()
  }

  _clearHeartbeatTimeout() {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
  }

  // ========== 重连 ==========

  _scheduleReconnect() {
    this._clearReconnectTimer()
    const delay = RECONNECT_DELAYS[this.reconnectIndex] || RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1]
    console.log(`[WS] ${delay}s 后重连...`)
    this.reconnectTimer = setTimeout(() => {
      if (this.reconnectIndex < RECONNECT_DELAYS.length - 1) {
        this.reconnectIndex++
      }
      this.connect()
    }, delay * 1000)
  }

  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // ========== 消息处理 ==========

  _handleMessage(raw) {
    // 心跳响应
    if (raw === 'pong') {
      this._clearHeartbeatTimeout()
      return
    }

    console.log('[WS] 收到原始消息:', raw)

    try {
      const frame = JSON.parse(raw)
      const type = frame.type
      if (!type) {
        console.warn('[WS] 消息无 type 字段:', frame)
        return
      }
      console.log('[WS] 解析后 frame:', frame)

      // 业务消息：content 是 JSON 字符串，需二次 parse
      let payload = null
      if (frame.content !== undefined) {
        if (typeof frame.content === 'string') {
          try {
            payload = JSON.parse(frame.content)
          } catch (e) {
            payload = frame.content
          }
        } else {
          payload = frame.content
        }
      }

      // 分发事件
      this._emit(type, payload)
    } catch (e) {
      console.warn('[WS] 消息解析失败:', raw, e)
    }
  }

  // ========== 事件系统 ==========

  /**
   * 监听事件
   * @param {string} event 事件名
   * @param {Function} callback 回调
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
    // 返回取消函数
    return () => this.off(event, callback)
  }

  /**
   * 取消监听
   */
  off(event, callback) {
    if (!this.listeners[event]) return
    const idx = this.listeners[event].indexOf(callback)
    if (idx > -1) {
      this.listeners[event].splice(idx, 1)
    }
  }

  _emit(event, data) {
    const cbs = this.listeners[event]
    if (cbs && cbs.length) {
      cbs.forEach(cb => {
        try {
          cb(data)
        } catch (e) {
          console.error(`[WS] 事件 ${event} 回调出错:`, e)
        }
      })
    }
    // 同时通过 uni.$emit 广播，方便各页面监听
    uni.$emit(`ws:${event}`, data)
  }

  // ========== 网络变化 ==========

  _bindNetworkChange() {
    uni.onNetworkStatusChange((res) => {
      const isConnected = res.isConnected
      this.networkOff = !isConnected
      if (isConnected) {
        // 网络恢复，立即尝试重连
        if (!this.isConnected && !this.manualClose) {
          console.log('[WS] 网络恢复，立即重连')
          this.reconnectIndex = 0
          this._clearReconnectTimer()
          this.connect()
        }
      } else {
        // 网络断开，清理重连定时器（等网络恢复再连）
        this._clearReconnectTimer()
      }
    })
  }
}

// 单例
const wsManager = new WsManager()

export default wsManager
