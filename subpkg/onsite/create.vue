<template>
  <view class="create-page">
    <!-- 服务类型选择 -->
    <view class="section-card">
      <view class="form-item">
        <view class="form-label">服务类型</view>
        <view class="form-value">
          <uni-data-select
            v-model="selectedServiceType"
            :localdata="serviceTypeOptions"
            placeholder="请选择服务类型"
            @change="onServiceTypeChange"
          ></uni-data-select>
        </view>
      </view>
    </view>

    <!-- 客户类型选择 -->
    <view class="section-card">
      <view class="section-title">客户类型</view>
      <view class="customer-tabs">
        <view
          class="customer-tab"
          :class="{ active: customerType === 1 }"
          @click="customerType = 1"
        >
          平台会员
        </view>
        <view
          class="customer-tab"
          :class="{ active: customerType === 2 }"
          @click="customerType = 2"
        >
          无会员/散客
        </view>
      </view>

      <!-- 会员查询 -->
      <view v-if="customerType === 1" class="member-search">
        <view class="search-input-wrap">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input
            class="search-input"
            type="number"
            v-model="mobileSuffix"
            maxlength="4"
            placeholder="请输入手机号后四位"
            @input="onMobileInput"
          />
        </view>

        <!-- 查询结果 -->
        <view v-if="memberList.length > 0" class="member-list">
          <view class="member-list-title">请选择会员</view>
          <view
            v-for="member in memberList"
            :key="member.userId"
            class="member-item"
            :class="{ active: selectedMember?.userId === member.userId }"
            @click="selectMember(member)"
          >
            <image
              class="member-avatar"
              :src="member.avatar || '/static/images/default-avatar.png'"
              mode="aspectFill"
            ></image>
            <view class="member-info">
              <view class="member-name">{{ member.nickname }}</view>
              <view class="member-mobile">{{ member.maskedMobile }}</view>
            </view>
            <view v-if="selectedMember?.userId === member.userId" class="member-check">
              <uni-icons type="checkmarkempty" size="18" color="#2f6bee"></uni-icons>
            </view>
          </view>
        </view>

        <!-- 空结果 -->
        <view v-else-if="searched && mobileSuffix.length === 4" class="member-empty">
          <text>未找到对应会员</text>
          <text class="switch-tip" @click="customerType = 2">切换为无会员</text>
        </view>
      </view>
    </view>

    <!-- 返程车费 -->
    <view class="section-card">
      <view class="form-item">
        <view class="form-label">返程车费</view>
        <view class="amount-input-box">
          <text class="amount-symbol">¥</text>
          <input
            class="amount-input"
            type="digit"
            v-model="returnTravelYuan"
            placeholder="0.00"
            @blur="onTravelBlur"
          />
          <text class="amount-unit">元</text>
        </view>
        <view class="amount-tip">
          <uni-icons type="info" size="14" color="#9ca3af"></uni-icons>
          <text>范围 0 ~ 50 元，按实际情况填写</text>
        </view>
      </view>
    </view>

    <!-- 底部创建按钮 -->
    <view class="bottom-bar">
      <button
        class="create-btn"
        :class="{ disabled: !canCreate }"
        :loading="creating"
        @click="handleCreate"
      >
        创建订单
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getCoachProfile } from '@/api/billiard/coach'
import { searchMember, createOnsiteOrder } from '@/api/billiard/onsiteOrder'
import { SERVICE_TYPE_MAP, generateUUID } from '@/utils/onsiteOrder'

// 服务类型选项（uni-data-select 格式）
const serviceTypeOptions = ref([
  { value: 1, text: '台球指导' }
])

const selectedServiceType = ref(1)
const customerType = ref(2) // 默认散客
const mobileSuffix = ref('')
const memberList = ref([])
const selectedMember = ref(null)
const searched = ref(false)
const returnTravelYuan = ref('0')
const creating = ref(false)
let currentRequestId = ''
let searchTimer = null

// 从教练档案获取服务类型
// serviceItems 是逗号分隔的字符串，如 "1,2,3"
const fetchCoachServiceTypes = async () => {
  try {
    const res = await getCoachProfile()
    const data = res.data || {}
    let types = []

    if (data.serviceItems) {
      types = String(data.serviceItems)
        .split(',')
        .map(t => Number(t.trim()))
        .filter(t => !isNaN(t) && t > 0)
    }

    if (types.length > 0) {
      serviceTypeOptions.value = types.map(typeValue => ({
        value: typeValue,
        text: SERVICE_TYPE_MAP[typeValue]?.name || `服务${typeValue}`
      }))
      selectedServiceType.value = serviceTypeOptions.value[0].value
    }
  } catch (e) {
    console.error('获取教练服务类型失败', e)
    // 失败保留兜底
  }
}

const onServiceTypeChange = (e) => {
  // uni-data-select 的 change 事件
  selectedServiceType.value = typeof e === 'object' ? e.value : e
}

// 手机号输入
const onMobileInput = (e) => {
  const val = e.detail.value.replace(/\D/g, '').slice(0, 4)
  mobileSuffix.value = val
  searched.value = false
  memberList.value = []
  selectedMember.value = null

  if (searchTimer) clearTimeout(searchTimer)
  if (val.length === 4) {
    // 满 4 位自动查询，加 300ms 防抖
    searchTimer = setTimeout(() => {
      doSearchMember(val)
    }, 300)
  }
}

const doSearchMember = async (suffix) => {
  try {
    const res = await searchMember(suffix)
    memberList.value = res.data || []
    searched.value = true
    // 只有一个结果时自动选中
    if (memberList.value.length === 1) {
      selectedMember.value = memberList.value[0]
    }
  } catch (e) {
    console.error('查询会员失败', e)
    memberList.value = []
    searched.value = true
  }
}

const selectMember = (member) => {
  selectedMember.value = member
}

// 返程车费输入失焦校验
const onTravelBlur = () => {
  let val = parseFloat(returnTravelYuan.value)
  if (isNaN(val) || val < 0) val = 0
  if (val > 50) val = 50
  returnTravelYuan.value = val.toFixed(2)
}

// 是否可以创建
const canCreate = computed(() => {
  if (!selectedServiceType.value) return false
  if (customerType.value === 1 && !selectedMember.value) return false
  const travel = parseFloat(returnTravelYuan.value)
  if (isNaN(travel) || travel < 0 || travel > 50) return false
  return true
})

// 创建订单
const handleCreate = async () => {
  if (!canCreate.value || creating.value) return

  if (!currentRequestId) {
    currentRequestId = generateUUID()
  }

  const returnTravelAmount = Math.round(parseFloat(returnTravelYuan.value) * 100)

  const data = {
    requestId: currentRequestId,
    serviceType: selectedServiceType.value,
    customerType: customerType.value,
    returnTravelAmount
  }

  if (customerType.value === 1 && selectedMember.value) {
    data.memberUserId = selectedMember.value.userId
  }

  creating.value = true
  try {
    const res = await createOnsiteOrder(data)
    if (res.code === 0 || res.code === 200) {
      uni.showToast({ title: '创建成功', icon: 'success' })
      const orderId = res.data?.id
      setTimeout(() => {
        uni.redirectTo({ url: `/subpkg/onsite/detail?id=${orderId}` })
      }, 500)
    }
  } catch (e) {
    console.error('创建订单失败', e)
    // 失败后保留 requestId，便于重试
  } finally {
    creating.value = false
  }
}

// 初始化
fetchCoachServiceTypes()
</script>

<style lang="scss" scoped>
.create-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.section-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 表单项通用 */
.form-item {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.form-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.form-value {
  width: 100%;
}

/* 客户类型 */
.customer-tabs {
  display: flex;
  background: #f3f4f6;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
}

.customer-tab {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 28rpx;
  color: #666;
  border-radius: 12rpx;
  transition: all 0.2s;

  &.active {
    background: #fff;
    color: #2f6bee;
    font-weight: 600;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  }
}

/* 会员查询 */
.member-search {
  margin-top: 8rpx;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background: #f7f8fa;
  border-radius: 16rpx;
  border: 2rpx solid transparent;

  &:focus-within {
    border-color: #2f6bee;
    background: #fff;
  }
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.member-list {
  margin-top: 20rpx;
}

.member-list-title {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #f8f9fb;
  margin-bottom: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    background: rgba(47, 107, 238, 0.06);
    border-color: #2f6bee;
  }

  &:active {
    opacity: 0.7;
  }
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #e5e7eb;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.member-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.member-mobile {
  font-size: 24rpx;
  color: #999;
}

.member-empty {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  color: #999;
}

.switch-tip {
  color: #2f6bee;
  font-size: 26rpx;
}

/* 金额输入框 */
.amount-input-box {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10rpx;
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%);
  border-radius: 20rpx;
  border: 2rpx solid #2f6bee22;
}

.amount-symbol {
  font-size: 40rpx;
  font-weight: 600;
  color: #ef4444;
}

.amount-input {
  flex: 1;
  text-align: center;
  font-size: 64rpx;
  font-weight: bold;
  color: #ef4444;
  line-height: 1;
}

.amount-unit {
  font-size: 28rpx;
  color: #666;
}

.amount-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #9ca3af;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);
  z-index: 100;
}

.create-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  color: #fff;
  border-radius: 20rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 238, 0.3);

  &.disabled {
    opacity: 0.5;
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
