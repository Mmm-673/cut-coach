/**
 * 主题工具函数
 *
 * 使用方式（在每个页面中）：
 * import { usePageTheme, useThemeColor } from '@/utils/theme'
 * const themeStore = usePageTheme()
 * const primaryColor = useThemeColor('primary')
 */
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store/modules/theme'

/**
 * 页面级主题初始化 hook
 * 在每个页面的 setup 中调用，确保页面显示时主题正确应用
 */
export function usePageTheme() {
  const themeStore = useThemeStore()

  // 页面显示时应用主题（每次切回来都刷新，覆盖首次显示）
  onShow(() => {
    themeStore.applyTheme(themeStore.currentTheme)
    themeStore.updateNavigationBar()
  })

  return themeStore
}

/**
 * 获取当前主题色值（用于内联样式 / 组件 props 中需要动态颜色的场景）
 * @param {string} colorName - 颜色名: primary / success / warning / danger / text / textSecondary / textTertiary
 * @returns {import('vue').ComputedRef<string>} 响应式颜色值
 *
 * 使用方式：
 *   const primaryColor = useThemeColor('primary')
 *   模板中: :color="primaryColor"
 */
export function useThemeColor(colorName) {
  const themeStore = useThemeStore()

  return computed(() => {
    const isWarm = themeStore.currentTheme === 'warm'

    const colorMap = {
      primary: isWarm ? '#B86B77' : '#2f6bee',
      primaryDark: isWarm ? '#9a5762' : '#1a50d9',
      success: isWarm ? '#6CA89B' : '#10b981',
      warning: isWarm ? '#EEA768' : '#f59e0b',
      danger: isWarm ? '#D65B5B' : '#ef4444',
      text: isWarm ? '#2D2A32' : '#1f2937',
      textSecondary: isWarm ? '#6b6572' : '#6b7280',
      textTertiary: isWarm ? '#9a95a0' : '#9ca3af',
      bgCard: isWarm ? '#FFFCFA' : '#ffffff',
      bgPage: isWarm ? '#FAF7F5' : '#F8FBFF',
      border: isWarm ? '#E8E0DC' : '#e5e7eb',
    }

    return colorMap[colorName] || colorMap.primary
  })
}

/**
 * 批量获取多个主题色值
 * @param {string[]} colorNames - 颜色名数组
 * @returns {import('vue').ComputedRef<Object>} 响应式颜色值对象
 *
 * 使用方式：
 *   const colors = useThemeColors(['primary', 'success', 'text'])
 *   模板中: :color="colors.primary"
 */
export function useThemeColors(colorNames) {
  const themeStore = useThemeStore()

  return computed(() => {
    const isWarm = themeStore.currentTheme === 'warm'

    const colorMap = {
      primary: isWarm ? '#B86B77' : '#2f6bee',
      primaryDark: isWarm ? '#9a5762' : '#1a50d9',
      success: isWarm ? '#6CA89B' : '#10b981',
      warning: isWarm ? '#EEA768' : '#f59e0b',
      danger: isWarm ? '#D65B5B' : '#ef4444',
      text: isWarm ? '#2D2A32' : '#1f2937',
      textSecondary: isWarm ? '#6b6572' : '#6b7280',
      textTertiary: isWarm ? '#9a95a0' : '#9ca3af',
      bgCard: isWarm ? '#FFFCFA' : '#ffffff',
      bgPage: isWarm ? '#FAF7F5' : '#F8FBFF',
      border: isWarm ? '#E8E0DC' : '#e5e7eb',
    }

    const result = {}
    colorNames.forEach(name => {
      result[name] = colorMap[name] || colorMap.primary
    })
    return result
  })
}
