// ============ 状态枚举 ============

// 服务类型
export const SERVICE_TYPE_MAP = {
  1: { name: '台球指导', color: '#2f6bff' },
  2: { name: '潮玩领航', color: '#10b981' },
  3: { name: '酒艺品鉴', color: '#8b5cf6' },
  4: { name: '影视赏析', color: '#f59e0b' }
}

// 订单类型
export const ORDER_TYPE_MAP = {
  1: { name: '普通订单', color: '#2f6bff' },
  2: { name: '现场订单', color: '#f59e0b' }
}

// 各服务起步时长（单位：小时）
export const SERVICE_MIN_HOURS = {
  1: 1,   // 台球指导
  2: 2,   // 潮玩领航
  3: 4,   // 酒艺品鉴
  4: 8    // 影视赏析
}

// 订单状态
export const ORDER_STATUS_MAP = {
  15: { name: '待开始', color: '#f59e0b' },
  40: { name: '进行中', color: '#2f6bff' },
  45: { name: '待付款', color: '#ef4444' },
  50: { name: '待评价', color: '#8b5cf6' },
  60: { name: '已完成', color: '#10b981' },
  70: { name: '已取消', color: '#9ca3af' }
}

// 支付主状态
export const PAYMENT_STATUS_MAP = {
  0: { name: '未支付', color: '#6b7280' },
  10: { name: '已支付', color: '#10b981' },
  20: { name: '支付异常', color: '#ef4444' }
}

// 结算状态
export const SETTLEMENT_STATUS_MAP = {
  0: { name: '未开始', color: '#6b7280' },
  10: { name: '处理中', color: '#f59e0b' },
  20: { name: '成功', color: '#10b981' },
  30: { name: '失败待重试', color: '#f59e0b' }
}

// ============ 计费规则工具 ============

/**
 * 获取服务计费规则提示文案
 * @param {number} serviceType 服务类型
 * @returns {string} 提示文案
 */
export function getBillingTip(serviceType) {
  const typeMap = {
    1: { name: '台球指导', hours: 1 },
    2: { name: '潮玩领航', hours: 2 },
    3: { name: '酒艺品鉴', hours: 4 },
    4: { name: '影视赏析', hours: 8 }
  }
  const info = typeMap[serviceType]
  if (!info) return ''
  return `温馨提示：${info.name}起步时长为${info.hours}小时，不足${info.hours}小时按${info.hours}小时计费，超出部分按分钟（单价/60）计费。`
}

// ============ 金额工具 ============

/**
 * 分转元，保留两位小数
 * @param {number} fen 分
 * @returns {string} 元，如 "12.30"
 */
export function formatFenToYuan(fen) {
  if (fen === null || fen === undefined || isNaN(fen)) return '0.00'
  return (Number(fen) / 100).toFixed(2)
}

// ============ UUID 生成 ============

/**
 * 生成 32 位无横线 UUID（用于 requestId）
 * @returns {string} 32 位十六进制字符串
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  // 降级方案
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16)
  })
}

// ============ 时间工具 ============

/**
 * 秒数格式化为 HH:MM:SS
 * @param {number} seconds 总秒数
 * @returns {string} 如 "01:23:45"
 */
export function formatDuration(seconds) {
  seconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/**
 * 将时间值转为毫秒时间戳
 * 兼容：数字时间戳(毫秒)、字符串时间戳、"YYYY-MM-DD HH:mm:ss" 格式字符串
 * @param {string|number} timeVal
 * @returns {number} 毫秒时间戳，无效返回 0
 */
function toTimestamp(timeVal) {
  if (!timeVal && timeVal !== 0) return 0
  // 已经是数字（毫秒时间戳）
  if (typeof timeVal === 'number') return timeVal
  const str = String(timeVal).trim()
  // 纯数字字符串（时间戳）
  if (/^\d+$/.test(str)) {
    const num = Number(str)
    // 如果是 10 位（秒级时间戳），转毫秒
    if (num < 1e12) return num * 1000
    return num
  }
  // 日期字符串，兼容 - 和 /
  const parsed = new Date(str.replace(/-/g, '/'))
  const t = parsed.getTime()
  return isNaN(t) ? 0 : t
}

/**
 * 计算从开始时间到现在的秒数
 * @param {string|number} startTime 开始时间（毫秒时间戳或日期字符串）
 * @param {string|number} endTime 结束时间，默认当前时间
 * @returns {number} 秒数
 */
export function diffSeconds(startTime, endTime) {
  const start = toTimestamp(startTime)
  if (!start) return 0
  const end = endTime ? toTimestamp(endTime) : Date.now()
  return Math.max(0, Math.floor((end - start) / 1000))
}

/**
 * 计算距离过期时间的剩余秒数
 * @param {string|number} expireTime 过期时间（毫秒时间戳或日期字符串）
 * @returns {number} 剩余秒数，过期返回 0
 */
export function getRemainingSeconds(expireTime) {
  const expire = toTimestamp(expireTime)
  if (!expire) return 0
  const now = Date.now()
  return Math.max(0, Math.floor((expire - now) / 1000))
}
