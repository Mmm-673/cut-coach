<template>
  <view class="create-page">
    <!-- 服务类型选择 -->
    <view class="section-card">
      <view class="form-label">服务类型</view>
      <view class="service-list">
        <view
          v-for="item in serviceItemList"
          :key="item.serviceType"
          class="service-item"
          :class="{ active: selectedServiceType === item.serviceType, disabled: !item.enabled }"
          @click="selectService(item)"
        >
          <view class="service-left">
            <view class="service-name">{{ item.serviceName }}</view>
            <view class="service-price" v-if="item.enabled">
              <text class="price-num">¥{{ formatFenToYuan(item.price) }}</text>
              <text class="price-unit">/{{ item.priceUnit }}</text>
            </view>
            <view class="service-disabled" v-else>暂不可预约</view>
          </view>
          <view class="service-check" v-if="selectedServiceType === item.serviceType">
            <uni-icons type="checkmarkempty" size="20" :color="primaryColor"></uni-icons>
          </view>
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
          <uni-icons type="search" size="18" :color="textTertiaryColor"></uni-icons>
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
              <uni-icons type="checkmarkempty" size="18" :color="primaryColor"></uni-icons>
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

    <!-- 计费规则提示 -->
    <view class="billing-tip">
      <uni-icons type="info" size="14" color="#92400e"></uni-icons>
      <text class="billing-tip-text">{{ billingTipText }}</text>
    </view>

    <!-- 底部创建按钮 -->
      <button
        class="create-btn"
        :class="{ disabled: !canCreate }"
        :loading="creating"
        @click="handleCreate"
      >
        创建订单
      </button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getCoachProfile } from '@/api/billiard/coach'
import { searchMember, createOnsiteOrder } from '@/api/billiard/onsiteOrder'
import { usePageTheme, useThemeColor } from '@/utils/theme'
import {
  SERVICE_TYPE_MAP,
  generateUUID,
  getBillingTip,
  CATALOG_PRICING_MODE,
  formatFenToYuan,
  getCatalogPriceUnit
} from '@/utils/onsiteOrder'

// 页面主题初始化
usePageTheme()

const primaryColor = useThemeColor('primary')
const textTertiaryColor = useThemeColor('textTertiary')

// 服务目录列表（带价格、计价模式等信息）
const serviceItemList = ref([])

const selectedServiceType = ref(null)
const customerType = ref(2) // 默认散客
const mobileSuffix = ref('')
const memberList = ref([])
const selectedMember = ref(null)
const searched = ref(false)
const creating = ref(false)
let currentRequestId = ''
let searchTimer = null

// 从教练档案获取服务目录（含价格和计价模式）
const fetchCoachServiceTypes = async () => {
  try {
    const res = await getCoachProfile()
    const data = res.data || {}
    const list = Array.isArray(data.serviceItemList) ? data.serviceItemList : []

    if (list.length > 0) {
      serviceItemList.value = list.map(item => ({
        serviceType: item.serviceType,
        serviceName: SERVICE_TYPE_MAP[item.serviceType]?.name || `服务${item.serviceType}`,
        price: item.price,
        pricingMode: item.pricingMode,
        priceUnit: item.priceUnit || getCatalogPriceUnit(item.pricingMode),
        // 固定价且 price 为 null 时不可选
        enabled: !(item.pricingMode === CATALOG_PRICING_MODE.FIXED && (item.price === null || item.price === undefined))
      }))
      // 默认选中第一个可用的服务
      const firstEnabled = serviceItemList.value.find(item => item.enabled)
      if (firstEnabled) {
        selectedServiceType.value = firstEnabled.serviceType
      }
    }
  } catch (e) {
    console.error('获取教练服务类型失败', e)
    // 失败保留兜底
  }
}

const selectService = (item) => {
  if (!item.enabled) return
  selectedServiceType.value = item.serviceType
}

// 获取当前选中服务的计价模式
const currentPricingMode = computed(() => {
  const item = serviceItemList.value.find(s => s.serviceType === selectedServiceType.value)
  return item?.pricingMode
})

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

// 是否可以创建
const canCreate = computed(() => {
  if (!selectedServiceType.value) return false
  const item = serviceItemList.value.find(s => s.serviceType === selectedServiceType.value)
  if (!item || !item.enabled) return false
  if (customerType.value === 1 && !selectedMember.value) return false
  return true
})

const billingTipText = computed(() => {
  // 固定价服务不显示起步时长提示
  if (currentPricingMode.value === CATALOG_PRICING_MODE.FIXED) {
    return '温馨提示：本服务为固定单次价，服务时长仅供履约记录，不影响最终费用。返程车费将在结束服务时另行结算。'
  }
  return getBillingTip(selectedServiceType.value)
})

// 重置表单状态
const resetForm = () => {
  // 默认选中第一个可用的服务
  const firstEnabled = serviceItemList.value.find(item => item.enabled)
  selectedServiceType.value = firstEnabled ? firstEnabled.serviceType : null
  customerType.value = 2 // 默认散客
  mobileSuffix.value = ''
  memberList.value = []
  selectedMember.value = null
  searched.value = false
  currentRequestId = '' // 重置 requestId，下次创建生成新的
}

// 创建订单
const handleCreate = async () => {
  if (!canCreate.value || creating.value) return

  if (!currentRequestId) {
    currentRequestId = generateUUID()
  }

  const data = {
    requestId: currentRequestId,
    serviceType: selectedServiceType.value,
    customerType: customerType.value
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
      // 重置表单状态，返回时是干净的初始状态
      resetForm()
      setTimeout(() => {
        uni.navigateTo({ url: `/subpkg/onsite/detail?id=${orderId}` })
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
  background: var(--bg-input, #f7f8fa);
  padding: 24rpx;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.section-card {
  background: var(--bg-card, #fff);
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
  color: var(--text-primary, #333);
  margin-bottom: 20rpx;
}

.form-value {
  width: 100%;
}

/* 服务列表 */
.service-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.service-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  background: #f8f9fb;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    background: rgba(47, 107, 238, 0.06);
    border-color: var(--color-primary, #2f6bee);
  }

  &.disabled {
    opacity: 0.5;
  }

  &:active:not(.disabled) {
    opacity: 0.8;
  }
}

.service-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.service-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.service-price {
  display: flex;
  align-items: baseline;
}

.price-num {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-primary, #2f6bee);
}

.price-unit {
  font-size: 24rpx;
  color: var(--text-secondary, #6b7280);
  margin-left: 4rpx;
}

.service-disabled {
  font-size: 24rpx;
  color: var(--text-tertiary, #9ca3af);
}

.service-check {
  flex-shrink: 0;
}

/* 客户类型 */
.customer-tabs {
  display: flex;
  background: var(--border-light, #f3f4f6);
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
}

.customer-tab {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  font-size: 28rpx;
  color: var(--text-secondary, #666);
  border-radius: 12rpx;
  transition: all 0.2s;

  &.active {
    background: var(--bg-card, #fff);
    color: var(--color-primary, #2f6bee);
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
  background: var(--bg-input, #f7f8fa);
  border-radius: 16rpx;
  border: 2rpx solid transparent;

  &:focus-within {
    border-color: var(--color-primary, #2f6bee);
    background: var(--bg-card, #fff);
  }
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text-primary, #333);
}

.member-list {
  margin-top: 20rpx;
}

.member-list-title {
  font-size: 26rpx;
  color: var(--text-secondary, #666);
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
    border-color: var(--color-primary, #2f6bee);
  }

  &:active {
    opacity: 0.7;
  }
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--border-color, #e5e7eb);
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.member-name {
  font-size: 28rpx;
  color: var(--text-primary, #333);
  font-weight: 500;
}

.member-mobile {
  font-size: 24rpx;
  color: var(--text-tertiary, #999);
}

.member-empty {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  color: var(--text-tertiary, #999);
}

.switch-tip {
  color: var(--color-primary, #2f6bee);
  font-size: 26rpx;
}

/* 计费规则提示 */
.billing-tip {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  padding: 20rpx 24rpx;
  background: #fef9e7;
  border-radius: 12rpx;
  margin: 0 24rpx 24rpx;
}

.billing-tip-text {
  flex: 1;
  font-size: 24rpx;
  color: #92400e;
  line-height: 1.5;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: var(--bg-card, #fff);
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.04);
  z-index: 100;
}

.create-btn {
  margin-top: 40rpx;
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  background: var(--gradient-primary, linear-gradient(135deg, var(--color-primary, #2f6bee) 0%, var(--color-primary-dark, #1a50d9) 100%));
  color: #fff;
  border-radius: 20rpx;
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx var(--color-primary-shadow, rgba(47, 107, 238, 0.3));

  &.disabled {
    opacity: 0.5;
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
