import { createPinia } from 'pinia'
import { useUserStore } from './modules/user'
import { useConfigStore } from './modules/config'
import { useNotificationStore } from './modules/notification'
import { useThemeStore } from './modules/theme'

const pinia = createPinia()

export default pinia

export { useUserStore, useConfigStore, useNotificationStore, useThemeStore }
