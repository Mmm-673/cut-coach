<template>
  <view class="pay-popup-mask" v-if="show" @click="handleClose">
    <view class="pay-popup-sheet" @click.stop>
      <!-- 标题栏 -->
      <view class="popup-header">
        <text class="popup-title">缴纳押金</text>
        <uni-icons type="closeempty" size="24" color="#9ca3af" @click="handleClose" />
      </view>

      <view class="popup-body">
        <!-- 金额输入 -->
        <view class="field-label">缴纳金额（元）</view>
        <input
          class="amount-input"
          type="digit"
          v-model="amountYuan"
          placeholder="请输入缴纳金额"
          placeholder-class="amount-placeholder"
        />

        <!-- 渠道选择 -->
        <view class="field-label">支付方式</view>
        <view class="channel-loading" v-if="channelLoading">渠道加载中...</view>
        <template v-else>
          <view class="channel-empty" v-if="channels.length === 0">暂不可缴纳，请联系客服</view>
          <view class="channel-list" v-else>
            <view
              class="channel-item"
              :class="{ active: channelCode === channel }"
              v-for="channel in channels"
              :key="channel"
              @click="channelCode = channel"
            >{{ getChannelText(channel) }}</view>
          </view>
        </template>
      </view>

      <!-- 确认按钮 -->
      <button class="confirm-btn" :disabled="!canConfirm" @click="handleConfirm">确认缴纳</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getDepositChannelList } from '@/api/billiard/deposit'
import { validatePayAmount, getChannelText } from '@/utils/deposit'

const props = defineProps({
  show: { type: Boolean, default: false },
  defaultFen: { type: Number, default: null }
})
const emit = defineEmits(['close', 'confirm'])

const FEN_PER_YUAN = 100

const amountYuan = ref('')
const channels = ref([])
const channelCode = ref('')
const channelLoading = ref(false)

// 渠道未就绪或为空时禁用确认
const canConfirm = computed(() => !channelLoading.value && channels.value.length > 0)

// 缺口分 → 元文本（固定两位小数），无缺口时留空不限金额
const defaultYuanText = () => {
  if (props.defaultFen === null || props.defaultFen === undefined || isNaN(Number(props.defaultFen))) {
    return ''
  }
  return (Number(props.defaultFen) / FEN_PER_YUAN).toFixed(2)
}

const fetchChannels = async () => {
  channelLoading.value = true
  try {
    const res = await getDepositChannelList()
    const list = res && Array.isArray(res.data) ? res.data : []
    channels.value = list
    channelCode.value = list.length > 0 ? list[0] : ''
  } catch (err) {
    // 渠道加载失败按空列表降级，确认按钮禁用
    channels.value = []
    channelCode.value = ''
  } finally {
    channelLoading.value = false
  }
}

watch(() => props.show, (visible) => {
  if (!visible) return
  amountYuan.value = defaultYuanText()
  fetchChannels()
})

const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  const result = validatePayAmount(amountYuan.value)
  if (!result.valid) {
    uni.showToast({ title: result.error, icon: 'none' })
    return
  }
  emit('confirm', { amountFen: result.fen, channelCode: channelCode.value })
}
</script>

<style lang="scss" scoped>
.pay-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.pay-popup-sheet {
  width: 100%;
  background: var(--bg-card, #fff);
  border-radius: 32rpx 32rpx 0 0;
  padding: 36rpx 32rpx calc(36rpx + env(safe-area-inset-bottom));
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.popup-title {
  font-size: 34rpx;
  font-weight: bold;
  color: var(--text-primary, #1f2937);
}

.field-label {
  font-size: 26rpx;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 16rpx;
}

.amount-input {
  height: 88rpx;
  background: var(--bg-page, #f7f8fa);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 32rpx;
  color: var(--text-primary, #1f2937);
  margin-bottom: 32rpx;
}

.amount-placeholder {
  color: var(--text-tertiary, #9ca3af);
}

.channel-loading,
.channel-empty {
  font-size: 26rpx;
  color: var(--text-tertiary, #9ca3af);
  padding: 20rpx 0;
  margin-bottom: 32rpx;
}

.channel-empty {
  color: var(--color-warning, #f59e0b);
}

.channel-list {
  display: flex;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.channel-item {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  font-size: 28rpx;
  color: var(--text-secondary, #6b7280);
  background: var(--bg-page, #f7f8fa);
  border: 2rpx solid var(--border, #e5e7eb);
  border-radius: 16rpx;
}

.channel-item.active {
  color: var(--color-primary, #2f6bee);
  background: rgba(47, 107, 238, 0.06);
  border-color: var(--color-primary, #2f6bee);
  font-weight: 500;
}

.confirm-btn {
  background: var(--color-primary, #2f6bee);
  color: #fff;
  font-size: 30rpx;
  border-radius: 44rpx;
  line-height: 88rpx;

  &::after {
    border: none;
  }

  &[disabled] {
    background: var(--border, #e5e7eb);
    color: var(--text-tertiary, #9ca3af);
  }
}
</style>
