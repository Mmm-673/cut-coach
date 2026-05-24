<script setup>
import config from './config'
import { getToken } from '@/utils/auth'
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

  // 2. 注入极光推送初始化（仅在 App 端运行，防止 H5 端报错）
  // #ifdef APP-PLUS
  initPushService()
  // #endif

  // 检查用户登录状态
  // #ifdef H5
  checkLogin()
  // #endif
}

function initConfig() {
  useConfigStore().setConfig(config)
}

function checkLogin() {
  if (!getToken()) {
    proxy.$tab.reLaunch('/pages/login/index')
  }
}

// 3. 极光推送核心逻辑
function initPushService() {
  console.log('--- 极光推送初始化开始 ---')

  // 如果是安卓设备，必须显式调用初始化
  if (uni.getSystemInfoSync().platform === 'android') {
    JPush.initJPush()
  }

  // 开启调试日志，开发阶段方便在 HBuilderX 控制台看效果
  JPush.setLoggerEnable(true)

  // 监听：【收到】通知（App在前台或后台挂起时收到消息）
  JPush.addNotificationListener((result) => {
    console.log('【极光】App 收到新通知:', result)
  })

  // 监听：【点击】通知栏消息（用户点击弹窗，触发业务跳转）
  JPush.addConnectInterfaceListener((result) => {
    console.log('【极光】用户点击了通知栏消息:', result)
    const extras = result.extras
    if (extras) {
      // 🛠️ 场景 A：教练端接收新订单通知
      if (extras.type === 'new_order' && extras.orderId) {
        proxy.$tab.navigateTo(`/pages/order/detail?id=${extras.orderId}`)
      }
      // 🛠️ 场景 B：用户端接收预约状态通知
      if (extras.type === 'coach_accept' && extras.bookingId) {
        proxy.$tab.navigateTo(`/pages/booking/info?id=${extras.bookingId}`)
      }
    }
  })

  // 获取当前设备的唯一 RegistrationID (RegID)
  JPush.getRegistrationID((result) => {
    if (result.registerID) {
      console.log('【极光】成功获取当前设备 RegID:', result.registerID)
      // 存入本地缓存，方便后面用户登录成功后，跟用户 userId 一起传给后端做绑定
      uni.setStorageSync('device_reg_id', result.registerID)
    } else {
      console.log('【极光】暂未获取到 RegID，等待网络重试...')
    }
  })
}
</script>

<style lang="scss">
  @import '@/static/scss/index.scss'
</style>