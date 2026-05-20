<template>
  <view class="agreement-wrapper">
    <view class="header">
      <uni-icons type="back" size="20" @click="goBack"></uni-icons>
      <text class="header-title">用户协议</text>
      <view class="placeholder"></view>
    </view>
    <scroll-view class="content" scroll-y>
      <view class="text-content">
        <text class="section-title">一、服务条款</text>
        <text class="paragraph">欢迎使用球了么裁教端服务。在使用本服务前，请您仔细阅读以下条款。</text>

        <text class="section-title">二、用户资格</text>
        <text class="paragraph">您需要具备完全民事行为能力才能使用本服务。</text>

        <text class="section-title">三、服务内容</text>
        <text class="paragraph">本平台提供台球教练预约、教学管理、收益结算等服务。</text>

        <text class="section-title">四、用户行为规范</text>
        <text class="paragraph">您在使用本服务时，应遵守相关法律法规，不得从事违法活动。</text>

        <text class="section-title">五、隐私保护</text>
        <text class="paragraph">我们重视您的隐私保护，具体请参考隐私政策。</text>

        <text class="section-title">六、免责声明</text>
        <text class="paragraph">在法律允许的范围内，我们对服务不作任何明示或暗示的保证。</text>

        <text class="section-title">七、协议修改</text>
        <text class="paragraph">我们有权根据需要修改本协议，修改后的协议一经公布即生效。</text>

        <text class="section-title">八、争议解决</text>
        <text class="paragraph">如发生争议，双方应友好协商解决；协商不成的，可向平台所在地法院提起诉讼。</text>
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
.agreement-wrapper {
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
