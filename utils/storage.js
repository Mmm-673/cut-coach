import constant from './constant'

// 存储变量名
let storageKey = 'storage_data'

// 存储节点变量名
let storageNodeKeys = [constant.avatar, constant.id, constant.name, constant.roles, constant.permissions]

// 安全获取存储数据
function getStorageData() {
  try {
    let data = uni.getStorageSync(storageKey)
    if (!data || typeof data !== 'object') {
      return {}
    }
    return data
  } catch (e) {
    console.error('读取存储数据失败:', e)
    return {}
  }
}

// 安全保存存储数据
function setStorageData(data) {
  try {
    uni.setStorageSync(storageKey, data)
  } catch (e) {
    console.error('保存存储数据失败:', e)
  }
}

const storage = {
  set: function(key, value) {
    if (storageNodeKeys.indexOf(key) != -1) {
      let tmp = getStorageData()
      tmp[key] = value
      setStorageData(tmp)
    }
  },
  get: function(key) {
    let storageData = getStorageData()
    let value = storageData[key]
    // 如果是 undefined 或 null，返回空字符串
    if (value === undefined || value === null) {
      return ""
    }
    return value
  },
  remove: function(key) {
    let storageData = getStorageData()
    delete storageData[key]
    setStorageData(storageData)
  },
  clean: function() {
    try {
      uni.removeStorageSync(storageKey)
    } catch (e) {
      console.error('清理存储数据失败:', e)
    }
  },
  // 检查是否有存储的用户信息
  hasUserInfo: function() {
    let storageData = getStorageData()
    return !!(storageData[constant.name] && storageData[constant.name] !== '裁教')
  }
}

export default storage
