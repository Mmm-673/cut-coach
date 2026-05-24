<script setup>
import config from './config'
import { getToken, getUserId } from '@/utils/auth'
import { useConfigStore } from '@/store'
import { getCurrentInstance } from "vue"
import { onLaunch } from '@dcloudio/uni-app'

// 1. 引入极光推送在 uni_modules 中导出的 JS SDK
import JPush from '@/uni_modules/jg-jpush-u/js_sdk/jpush-u.js'

const { proxy } = getCurrentInstance()

onLaunch(() => {
  initApp()
})

// 初始化应用
function initApp() {
  // 初始化应用配置
  initConfig()

  // 2. 注入极光推送初始化（仅在 App 端运行，防止 H5/小程序端报错）
  // #ifdef APP-PLUS
  initPushService()
  // #endif

  // 检查用户登录状态
  checkLogin()
}

function initConfig() {
  useConfigStore().setConfig(config)
}

function checkLogin() {
  // 判断是否有有效 Token
  const token = getToken()
  if (!token) {
    proxy.$tab.reLaunch('/pages/login/index')
    return
  }

  // 🔥【新增补丁 A】静态登录状态有效时，自动触发极光别名绑定
  // #ifdef APP-PLUS
  const userId = getUserId() || ''
  if (userId) {
    bindPushAlias(userId)
  }
  // #endif
}

// 3. 极光推送核心逻辑
function initPushService() {
  console.log('--- 【球了么教练端】极光推送环境检查 ---')

  // 如果是安卓设备，必须显式调用初始化
  if (uni.getSystemInfoSync().platform === 'android') {
    JPush.initJPush()
  }

  // 开启调试日志，开发阶段方便在 HBuilderX 控制台看效果
  JPush.setLoggerEnable(true)

  // 监听：【收到】通知（App在前台或后台挂起时收到消息）
  JPush.addNotificationListener((result) => {
    console.log('【极光教练端】App 收到新通知:', result)
  })

  // 监听：【点击】通知栏消息（用户点击弹窗，触发业务跳转）
  JPush.addConnectInterfaceListener((result) => {
    console.log('【极光教练端】用户点击了通知栏消息:', result)
    const extras = result.extras
    if (extras) {
      // 🔥【新增补丁 B】加一个 300ms 延时保护，防止进程被杀后冷启动时页面栈未初始化导致跳转失败
      setTimeout(() => {
        // 🛠️ 场景 A：教练端接收新订单通知，点击直接进入订单详情页接单
        if (extras.type === 'new_order' && extras.orderId) {
          proxy.$tab.navigateTo(`/pages/order/detail?id=${extras.orderId}`)
        }

        // 🛠️ 场景 B：结算或收益到账通知，跳转到收益明细页
        if (extras.type === 'income_wallet') {
          proxy.$tab.navigateTo(`/pages/mine/bonus/index`)
        }
      }, 300)
    }
  })

  // 获取当前设备的唯一 RegistrationID (RegID)
  JPush.getRegistrationID((result) => {
    if (result.registerID) {
      console.log('【极光教练端】成功获取当前设备 RegID:', result.registerID)
      // 存入本地缓存，方便后面用户登录成功后，跟用户 userId 一起传给后端做绑定
      uni.setStorageSync('device_reg_id', result.registerID)
    } else {
      console.log('【极光教练端】暂未获取到 RegID，等待网络重试...')
    }
  })
}

// 🔥【新增补丁 C】封装统一的教练端别名绑定函数
function bindPushAlias(userId) {
  // 为教练/助教端定制唯一的别名规则，形如 coach_user_1001，彻底与学员端隔离
  const targetAlias = `3_${userId}`

  JPush.setAlias({
    alias: targetAlias,
    sequence: 1 // 操作序列号
  })
  console.log('【极光教练端】已向云端发起别名绑定，目标别名:', targetAlias)
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss'
</style>