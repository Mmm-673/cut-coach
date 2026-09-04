import { createSSRApp } from 'vue'
import App from './App'
import store from './store' // store
import { install } from './plugins' // plugins
import './permission' // permission
import { useDict } from '@/utils/dict'
import { themeMixin } from '@/mixins/theme' // 全局主题 mixin

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  app.config.globalProperties.useDict = useDict
  // 注册全局主题 mixin：为每个页面根组件自动注入 themeClass
  app.mixin(themeMixin)
  install(app)
  return {
    app
  }
}
