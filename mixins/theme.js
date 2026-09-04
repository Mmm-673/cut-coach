/**
 * 主题全局 mixin
 * 自动为每个页面根组件注入主题 class，配合 theme.scss 的 page.theme-warm 选择器工作
 *
 * 在 main.js 中注册：
 * import { themeMixin } from '@/mixins/theme'
 * app.mixin(themeMixin)
 *
 * 注意：Vue3 的全局 mixin 会影响所有组件，
 * 我们只在页面级组件中生效（通过 $page 判断）
 */
import { useThemeStore } from '@/store/modules/theme'

export const themeMixin = {
  data() {
    return {
      // 用于模板绑定的主题 class，绑定在页面根 view 上
      themeClass: 'theme-default'
    }
  },
  mounted() {
    // 只在页面根组件中生效
    if (this.$page || this.$root === this) {
      this.updateThemeClass()

      // 监听主题变化，自动更新 class
      if (typeof this.$watch === 'function') {
        const themeStore = useThemeStore()
        this.$watch(
          () => themeStore.currentTheme,
          () => {
            this.updateThemeClass()
          }
        )
      }
    }
  },
  methods: {
    updateThemeClass() {
      try {
        const themeStore = useThemeStore()
        this.themeClass = themeStore.currentTheme === 'warm' ? 'theme-warm' : 'theme-default'
      } catch (e) {
        console.warn('更新主题 class 失败，使用默认主题:', e)
        this.themeClass = 'theme-default'
      }
    }
  }
}
