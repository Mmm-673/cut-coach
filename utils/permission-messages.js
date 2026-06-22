/**
 * 统一的权限提示语配置文件
 * 集中管理所有权限相关的提示信息，便于维护和优化
 */

/**
 * 位置权限提示语
 */
export const locationPermissionMessages = {
  title: '定位权限说明',
  explanation: '为了更好地为您提供服务，我们需要获取您的位置信息。位置信息仅用于订单服务和导航功能，我们会严格保护您的隐私安全。是否同意获取位置权限？',
  guide: {
    title: '定位权限未开启',
    content: '您未开启定位权限，将无法接单和打卡。是否前往开启？'
  },
  updateGuide: {
    title: '位置权限',
    content: '需要位置权限才能更新位置，是否前往设置？'
  }
}

/**
 * 相机/相册权限提示语
 */
export const mediaPermissionMessages = {
  title: '相机/相册权限说明',
  avatar: '为了修改头像，我们需要访问您的相机或相册。我们会严格保护您的隐私安全，只会在您明确同意的情况下访问。是否同意获取相机/相册权限？',
  qrcode: '为了保存二维码/海报到相册，我们需要访问您的相册。我们会严格保护您的隐私安全，只会在您明确同意的情况下访问。是否同意获取相册权限？',
  saveFailed: '保存失败,未开启权限',
  exportFailed: '导出失败,未开启权限'
}

/**
 * 拨打电话权限提示语
 */
export const phonePermissionMessages = {
  title: '拨打电话权限说明',
  explanation: '为了联系客户，我们需要访问您的拨打电话权限。我们会严格保护您的隐私安全，只会在您明确同意的情况下访问。是否同意获取拨打电话权限？',
  callFailed: '拨打失败,未开启权限'
}

/**
 * 统一导出所有权限提示语
 */
export default {
  location: locationPermissionMessages,
  media: mediaPermissionMessages,
  phone: phonePermissionMessages
}