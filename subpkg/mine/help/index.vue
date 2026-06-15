<template>
  <view class="help-page">
    <view v-for="item in list" :key="item.title" class="section-card">
      <view class="section-header">
        <view class="icon-wrapper" :class="item.iconClass">
          <uni-icons :type="item.iconType" :size="20" :color="item.iconColor"></uni-icons>
        </view>
        <text class="section-title">{{ item.title }}</text>
      </view>
      <view class="question-list">
        <view
          v-for="(child, index) in item.childList"
          :key="index"
          class="question-item"
          hover-class="hover"
          @click="handleText(child)"
        >
          <text class="question-text">{{ child.title }}</text>
          <uni-icons type="right" size="16" color="#d1d5db"></uni-icons>
        </view>
      </view>
    </view>

    <!-- 联系客服 -->
    <view class="contact-section">
      <view class="contact-card">
        <view class="contact-icon">
          <uni-icons type="chatbubble" size="32" color="#2f6bee"></uni-icons>
        </view>
        <text class="contact-title">仍有问题？</text>
        <text class="contact-desc">联系客服获取更多帮助</text>
        <button class="contact-btn" @click="handleContact">联系客服</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import config from '@/config'

const list = ref([
  {
    iconType: 'help',
    iconColor: '#fff',
    iconClass: 'faq-icon',
    title: '常见问题',
    childList: [
      {
        title: '如何提现多久能到账？',
        content: '正常情况下，提现申请提交后1-3个工作日内到账，具体到账时间取决于收款银行卡的处理速度，遇节假日可能会顺延。'
      },
      {
        title: '为什么会被扣款？',
        content: '扣款通常发生在以下情况：1) 未按时接单导致用户取消订单；2) 服务过程中出现违规行为；3) 被用户投诉并核实成立。具体扣款原因会在扣款记录中详细说明。'
      },
      {
        title: '接单服务范围是如何计算的？',
        content: '服务费用根据您的裁教等级和服务时长计算，具体计算方式为：基础费用 + 时长费用。您可以在个人信息中查看您的等级对应的费用标准。'
      }
    ]
  },
  {
    iconType: 'gear',
    iconColor: '#fff',
    iconClass: 'other-icon',
    title: '账户相关',
    childList: [
      {
        title: '如何退出登录？',
        content: '请点击"我的" - "设置" - "退出登录"即可退出登录。'
      },
      {
        title: '如何修改登录密码？',
        content: '请点击"我的" - "设置" - "修改密码"即可修改登录密码。'
      },
      {
        title: '忘记密码怎么办？',
        content: '在登录页面点击"忘记密码"，通过手机号验证后可以重置密码。'
      }
    ]
  }
])

function handleText(item) {
  uni.navigateTo({
    url: `/subpkg/common/textview/index?title=${encodeURIComponent(item.title)}&content=${encodeURIComponent(item.content)}`
  })
}

function handleContact() {
  uni.showModal({
    title: '联系客服',
    content: `客服电话：${config.appInfo.customerServicePhone}\n工作时间：${config.appInfo.customerServiceHours}`,
    showCancel: false
  })
}
</script>

<style lang="scss" scoped>
.help-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 24rpx;
  padding-bottom: 60rpx;
}

/* 分类卡片 */
.section-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 0;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 30rpx;
  padding-bottom: 24rpx;
  background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
}

.icon-wrapper {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.faq-icon {
    background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  }

  &.other-icon {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

/* 问题列表 */
.question-list {
  padding: 0 30rpx;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &.hover {
    background: #f8fafc;
  }
}

.question-text {
  font-size: 28rpx;
  color: #374151;
  flex: 1;
}

/* 联系客服 */
.contact-section {
  margin-top: 24rpx;
}

.contact-card {
  background: linear-gradient(135deg, #2f6bee 0%, #1a50d9 100%);
  border-radius: 24rpx;
  padding: 48rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(47, 107, 238, 0.25);
}

.contact-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.contact-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.contact-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 28rpx;
}

.contact-btn {
  background: #fff;
  color: #2f6bee;
  border-radius: 40rpx;
  padding: 16rpx 48rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: none;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.9;
  }
}
</style>
