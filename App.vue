<script setup>
import config from './config'
import { getToken, getUserId } from '@/utils/auth'
import { useConfigStore } from '@/store'
import { getCurrentInstance } from "vue"
import { onLaunch } from '@dcloudio/uni-app'

// 1. 【核心修改】放弃 import UTS 组件，改为引入传统原生插件对象
// #ifdef APP-PLUS
const jpushModule = uni.requireNativePlugin("JG-JPush");
// #endif

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

  // 🔥【静态登录状态有效时，自动触发极光别名绑定】
  // #ifdef APP-PLUS
  const userId = getUserId() || ''
  if (userId) {
    bindPushAlias(userId)
  }
  // #endif
}

// 3. 传统极光原生插件核心逻辑
function initPushService() {
  console.log('--- 【球了么教练端】传统极光原生插件环境检查 ---')

  // 开启调试日志，开发阶段方便在 HBuilderX 控制台看原生日志
  jpushModule.setDebugMode(true);

  // 初始化极光服务
  jpushModule.initJPushService();

  // 监听：【收到】通知（App在前台或后台挂起时收到消息）
  jpushModule.addNotificationListener((result) => {
    console.log('【极光教练端】App 收到新通知:', result)
    // 传统插件收到通知后，result 里会包含 title 和 content 等
  })

  // 监听：【点击】通知栏消息（用户点击弹窗，触发业务跳转）
  // 传统原生插件的点击监听 API 为 addCustomMessageListener 或者是通过通知监听判断
  // 极光经典插件通常在用户点击通知时触发该回调
  jpushModule.addCustomMessageListener((result) => {
    console.log('【极光教练端】用户点击了通知栏消息:', result)

    // 传统插件的附加字段在 notificationExtras 中，通常是 JSON 字符串，需要解析
    if (result && result.notificationExtras) {
      try {
        const extras = JSON.parse(result.notificationExtras)

        // 🔥 加一个 300ms 延时保护，防止进程被杀后冷启动时页面栈未初始化导致跳转失败
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
      } catch (e) {
        console.error('【极光教练端】解析附加字段 extras 失败:', e)
      }
    }
  })

  // 获取当前设备的唯一 RegistrationID (RegID)
  // 传统原生插件需要加个小延时获取更稳定
  setTimeout(() => {
    jpushModule.getRegistrationID((result) => {
      // 传统原生插件返回的字段名为 registerID
      if (result && result.registerID) {
        console.log('========================================');
        console.log('【极光教练端】成功获取当前设备 RegID:', result.registerID)
        console.log('========================================');

        // 存入本地缓存，方便后面用户登录成功后，跟用户 userId 一起传给后端做绑定
        uni.setStorageSync('device_reg_id', result.registerID)

        // 测试阶段：直接在屏幕弹窗显示 RegID，方便你长按复制去极光后台做单推测试
        uni.showModal({
          title: '测试 RegID (长按可复制)',
          content: result.registerID,
          editable: true,
          confirmText: '去复制'
        });
      } else {
        console.log('【极光教练端】暂未获取到 RegID，等待网络重试...')
      }
    })
  }, 3000)
}

// 🔥 统一的教练端别名绑定函数（适配传统原生插件 API）
function bindPushAlias(userId) {
  // 为教练/助教端定制唯一的别名规则，形如 3_1001
  const targetAlias = `3_${userId}`

  // 传统原生插件设置别名的参数格式：{ alias: string, sequence: number }
  jpushModule.setAlias({
    'alias': targetAlias,
    'sequence': 1
  })
  console.log('【极光教练端】已向云端发起传统别名绑定，目标别名:', targetAlias)
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss'
</style>