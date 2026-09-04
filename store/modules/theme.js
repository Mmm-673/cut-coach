import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_STORAGE_KEY = 'coach_app_theme'

// 主题列表
export const themeList = [
  {
    name: 'default',
    label: '经典蓝调',
    desc: '清爽专业，商务首选'
  },
  {
    name: 'warm',
    label: '暮色柔雾',
    desc: '温柔高级，治愈暖调'
  }
]

// 主题名白名单校验
const isValidTheme = (name) => {
  return themeList.some(t => t.name === name)
}

// 默认主题（暮色柔雾）
const DEFAULT_THEME = 'warm'

// 从存储中安全读取主题（带白名单校验）
const readSavedTheme = () => {
  try {
    const saved = uni.getStorageSync(THEME_STORAGE_KEY)
    return isValidTheme(saved) ? saved : DEFAULT_THEME
  } catch (e) {
    console.warn('读取主题存储失败，使用默认主题:', e)
    return DEFAULT_THEME
  }
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref(readSavedTheme())

  // ========== H5 端：设置 html data-theme 属性 ==========
  // CSS 变量在 theme.scss 中通过 html[data-theme="warm"] page 选择器统一维护
  const applyThemeH5 = (themeName) => {
    // #ifdef H5
    try {
      const root = document.documentElement
      if (themeName === 'warm') {
        root.setAttribute('data-theme', 'warm')
      } else {
        root.removeAttribute('data-theme')
      }
    } catch (e) {
      console.error('H5 应用主题失败:', e)
    }
    // #endif
  }

  // ========== 小程序端：依赖全局 mixin 设置页面根元素 class ==========
  // mixins/theme.js 中已注册全局 mixin，自动为每个页面根组件设置 themeClass
  // CSS 变量在 theme.scss 中通过 page.theme-warm 选择器统一维护
  const applyThemeMp = () => {
    // 小程序端通过全局 mixin 响应式更新，无需手动操作 DOM
    // 此处留空，保持多端调用接口一致
  }

  // ========== APP 端：通过 webview evalJS 设置 page 的 className ==========
  const applyThemeApp = (themeName) => {
    // #ifdef APP-PLUS
    try {
      const pages = getCurrentPages()
      if (pages.length === 0) return

      const currentPage = pages[pages.length - 1]
      const webview = currentPage.$getAppWebview ? currentPage.$getAppWebview() : null

      if (webview) {
        // 使用 JSON.stringify 确保字符串安全，防止注入
        const warmClass = JSON.stringify('theme-warm')
        const isWarm = themeName === 'warm'
        const jsCode = `
          (function() {
            var page = document.querySelector('page') || document.body;
            if (!page) return;
            if (${isWarm ? 'true' : 'false'}) {
              if (!page.classList.contains(${warmClass})) {
                page.classList.add(${warmClass});
              }
            } else {
              page.classList.remove(${warmClass});
            }
          })();
        `
        webview.evalJS(jsCode)
      }
    } catch (e) {
      console.error('APP 应用主题失败:', e)
    }
    // #endif
  }

  // 应用主题（多端兼容，统一入口）
  const applyTheme = (themeName) => {
    const name = isValidTheme(themeName) ? themeName : 'default'

    // #ifdef H5
    applyThemeH5(name)
    // #endif

    // #ifdef MP-WEIXIN
    applyThemeMp(name)
    // #endif

    // #ifdef APP-PLUS
    applyThemeApp(name)
    // #endif

    // #ifdef MP-HARMONY
    // 鸿蒙小程序复用小程序 class 方案（全局 mixin）
    applyThemeMp(name)
    // #endif
  }

  // 切换主题
  const setTheme = (themeName) => {
    // 相同主题直接返回，避免重复操作
    if (currentTheme.value === themeName) return

    if (!isValidTheme(themeName)) {
      console.warn('未知主题，忽略切换:', themeName)
      return
    }

    currentTheme.value = themeName

    // 持久化存储（带错误处理）
    try {
      uni.setStorageSync(THEME_STORAGE_KEY, themeName)
    } catch (e) {
      console.error('保存主题到存储失败:', e)
    }

    applyTheme(themeName)
    updateNavigationBar()
    updateTabBar()
  }

  // 切换到下一个主题
  const toggleTheme = () => {
    const currentIndex = themeList.findIndex(t => t.name === currentTheme.value)
    const nextIndex = (currentIndex + 1) % themeList.length
    setTheme(themeList[nextIndex].name)
  }

  // 更新导航栏颜色
  const updateNavigationBar = () => {
    const bgColor = currentTheme.value === 'warm' ? '#D88A8A' : '#2f6bee'
    try {
      uni.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: bgColor,
        animation: {
          duration: 300,
          timingFunc: 'easeIn'
        },
        fail: (err) => {
          console.warn('设置导航栏颜色失败:', err)
        }
      })
    } catch (e) {
      console.error('设置导航栏颜色异常:', e)
    }
  }

  // 更新 TabBar 样式
  const updateTabBar = () => {
    const selectedColor = currentTheme.value === 'warm' ? '#B86B77' : '#2f6bee'
    const color = currentTheme.value === 'warm' ? '#8A858E' : '#707070'
    const bgColor = currentTheme.value === 'warm' ? '#FFFCFA' : '#ffffff'

    try {
      uni.setTabBarStyle({
        color,
        selectedColor,
        backgroundColor: bgColor,
        borderStyle: 'white',
        fail: (err) => {
          console.warn('设置 TabBar 样式失败:', err)
        }
      })
    } catch (e) {
      console.error('设置 TabBar 样式异常:', e)
    }
  }

  // 初始化主题（APP 启动时调用）
  const initTheme = () => {
    // 先立即应用主题（CSS 变量层）
    applyTheme(currentTheme.value)

    // 导航栏和 TabBar 稍作等待确保页面初始化完成
    setTimeout(() => {
      updateNavigationBar()
      updateTabBar()
    }, 50)
  }

  // 页面显示时刷新主题（用于新打开的页面）
  const applyThemeOnShow = () => {
    applyTheme(currentTheme.value)
    updateNavigationBar()
  }

  // 获取当前主题信息
  const currentThemeInfo = () => {
    return themeList.find(t => t.name === currentTheme.value) || themeList[0]
  }

  return {
    currentTheme,
    themeList,
    setTheme,
    toggleTheme,
    initTheme,
    applyThemeOnShow,
    currentThemeInfo,
    updateNavigationBar,
    updateTabBar,
    applyTheme,
    isValidTheme
  }
})
