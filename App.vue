<script setup>
import config from './config'
import { getToken, getUserId } from '@/utils/auth'
import { useConfigStore } from '@/store'
import { getCurrentInstance } from 'vue'
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { initPushService, syncPushForUser, retryPushSyncIfNeeded } from '@/utils/jpush'

const { proxy } = getCurrentInstance()

onLaunch(() => {
  initApp()
})

onShow(() => {
  // #ifdef APP-PLUS
  retryPushSyncIfNeeded()
  // #endif
})

function initApp() {
  initConfig()

  // #ifdef APP-PLUS
  initPushService()
  // #endif

  checkLogin()
}

function initConfig() {
  useConfigStore().setConfig(config)
}

function checkLogin() {
  const token = getToken()
  if (!token) {
    proxy.$tab.reLaunch('/pages/login/index')
    return
  }

  // #ifdef APP-PLUS
  const userId = getUserId()
  if (userId) {
    syncPushForUser(userId)
  }
  // #endif
}
</script>

<style lang="scss">
@import '@/static/scss/index.scss'
</style>
