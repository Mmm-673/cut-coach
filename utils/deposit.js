/**
 * 押金模块纯函数：金额展示、流水类型标签、上线预检判断
 * 金额契约：服务端为整数「分」，展示层转元；空值显示「—」不默认 0
 */

const YUAN_PER_FEN = 100
const EMPTY_AMOUNT_TEXT = '—'

/**
 * 金额分转元展示；空值显示「—」
 * @param {number|null|undefined} fen 金额（分）
 * @returns {string}
 */
export function formatDepositAmount(fen) {
  if (fen === null || fen === undefined || fen === '' || isNaN(Number(fen))) return EMPTY_AMOUNT_TEXT
  return (Number(fen) / YUAN_PER_FEN).toFixed(2)
}

const BIZ_TYPE_TEXT_MAP = {
  PAYMENT: '押金缴纳',
  PENALTY: '押金处罚'
}

/**
 * 流水类型标签；未知类型用通用标签（后端可能新增枚举）
 * @param {string|undefined} bizType
 * @returns {string}
 */
export function getBizTypeText(bizType) {
  return BIZ_TYPE_TEXT_MAP[bizType] || '资金变动'
}

/**
 * 带符号流水金额：正/0 为收入（+），负为支出（-）
 * @param {number|null|undefined} fen 带符号金额（分）
 * @returns {{ text: string, isIncome: boolean }}
 */
export function formatSignedAmount(fen) {
  if (fen === null || fen === undefined || isNaN(Number(fen))) {
    return { text: EMPTY_AMOUNT_TEXT, isIncome: true }
  }
  const value = Number(fen)
  const sign = value < 0 ? '-' : '+'
  return { text: `${sign}${formatDepositAmount(Math.abs(value))}`, isIncome: value >= 0 }
}

/**
 * 上线预检：押金已配置且余额低于门槛时拦截。
 * 预检数据缺失/不完整时放行——最终以后端 POST work-status 结果为准。
 * @param {{ enabled?: boolean, balance?: number|null, requiredAmount?: number|null, onlineShortfall?: number|null }|null} overview
 * @returns {{ allowed: boolean, shortfall: number|null }}
 */
export function checkDepositBeforeOnline(overview) {
  if (!overview || !overview.enabled) return { allowed: true, shortfall: null }
  const { balance, requiredAmount, onlineShortfall } = overview
  if (balance === null || balance === undefined || requiredAmount === null || requiredAmount === undefined) {
    return { allowed: true, shortfall: null }
  }
  if (Number(balance) >= Number(requiredAmount)) return { allowed: true, shortfall: null }
  const shortfall = onlineShortfall !== null && onlineShortfall !== undefined
    ? Number(onlineShortfall)
    : Number(requiredAmount) - Number(balance)
  return { allowed: false, shortfall }
}

const MAX_PAY_FEN = 2147483647
const PAY_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

/**
 * 校验缴纳金额（元字符串 → 正整数分）
 * 先正则校验格式（纯数字、最多两位小数），通过后用 Math.round 整数化转分，规避浮点误差
 * @param {string} yuanInput 用户输入的元金额
 * @returns {{ valid: boolean, fen: number|null, error: string }}
 */
export function validatePayAmount(yuanInput) {
  const raw = typeof yuanInput === 'string' ? yuanInput.trim() : ''
  if (!raw) return { valid: false, fen: null, error: '请输入缴纳金额' }
  if (!PAY_AMOUNT_PATTERN.test(raw)) return { valid: false, fen: null, error: '请输入正确金额' }
  const fen = Math.round(Number(raw) * 100)
  if (fen <= 0) return { valid: false, fen: null, error: '缴纳金额需大于 0' }
  if (fen > MAX_PAY_FEN) return { valid: false, fen: null, error: '超出单笔缴纳上限' }
  return { valid: true, fen, error: '' }
}

const CHANNEL_TEXT_MAP = {
  wx_app: '微信支付',
  alipay_app: '支付宝'
}

/**
 * 支付渠道文案；未知渠道原样展示 code
 * @param {string|undefined} channelCode
 * @returns {string}
 */
export function getChannelText(channelCode) {
  return CHANNEL_TEXT_MAP[channelCode] || channelCode || ''
}
