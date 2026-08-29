import { createPinia } from 'pinia'
import { useUserStore } from './modules/user'
import { useConfigStore } from './modules/config'
import { useNotificationStore } from './modules/notification'

const pinia = createPinia()

export default pinia

export { useUserStore, useConfigStore, useNotificationStore }
