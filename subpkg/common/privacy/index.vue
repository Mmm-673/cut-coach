<template>
  <view class="privacy-wrapper">
    <view class="header">
      <uni-icons type="back" size="20" @click="goBack"></uni-icons>
      <text class="header-title">隐私政策</text>
      <view class="placeholder"></view>
    </view>
    <scroll-view class="content" scroll-y>
      <view class="text-content">
        <text class="section-title">一、隐私保护原则</text>
        <text class="paragraph">我们重视您的隐私保护，遵循合法、正当、必要的原则处理您的个人信息。</text>

        <text class="section-title">二、信息收集</text>
        <text class="paragraph">我们会收集您提供的注册信息、位置信息、订单信息等，以便为您提供服务。</text>

        <text class="section-title">三、信息使用</text>
        <text class="paragraph">我们会将收集的信息用于提供服务、安全保障、客户支持等用途。</text>

        <text class="section-title">四、信息保护</text>
        <text class="paragraph">我们会采取相应的安全措施保护您的个人信息安全。</text>

        <text class="section-title">五、信息共享</text>
        <text class="paragraph">未经您同意，我们不会向第三方共享您的个人信息，法律法规要求的情况除外。</text>

        <text class="section-title">六、您的权利</text>
        <text class="paragraph">您有权访问、更正、删除您的个人信息，以及撤回同意。</text>

        <text class="section-title">七、政策更新</text>
        <text class="paragraph">我们会适时更新本政策，更新后的政策一经公布即生效。</text>

        <text class="section-title">八、联系我们</text>
        <text class="paragraph">如有任何问题，请通过客服联系我们。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.privacy-wrapper {
  min-height: 100vh;
  background: #f8fbff;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  padding-top: calc(30rpx + var(--status-bar-height));
  background: #fff;
  border-bottom: 1rpx solid #f3f4f6;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2937;
}

.placeholder {
  width: 40rpx;
}

.content {
  padding: 30rpx;
  height: calc(100vh - 100rpx);
}

.text-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10rpx;
}

.paragraph {
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.8;
}
</style>
