<template>
  <view class="mine-container">
    <!--顶部个人信息栏-->
    <uni-card :is-shadow="false" :border="false" class="header-card">
      <view class="header-section">
        <view class="flex align-center" @click="handleToInfo">
          <image v-if="avatar" :src="avatar" class="cu-avatar xl round" mode="aspectFill"></image>
          <view v-else class="cu-avatar xl round bg-blue">
            <uni-icons type="person" size="40" color="#fff"></uni-icons>
          </view>
          <view v-if="!name" @click="handleToLogin" class="login-tip">
            点击登录
          </view>
          <view v-if="name" class="user-info">
            <view class="u_title">
              用户名：{{ name }}
            </view>
          </view>
        </view>
        <view @click="handleToInfo" class="flex align-center">
          <text>个人信息</text>
          <uni-icons type="right" size="16" color="#999"></uni-icons>
        </view>
      </view>
    </uni-card>

    <view class="content-section">
      <!-- 快捷操作 -->
      <uni-card :is-shadow="true" :border="false" class="actions-card">
        <uni-grid :column="4" :showBorder="false">
          <uni-grid-item @click="handleJiaoLiuQun">
            <view class="action-item">
              <view class="icon-wrapper pink">
                <uni-icons type="chatbubble" size="28" color="#fff"></uni-icons>
              </view>
              <text class="text">交流群</text>
            </view>
          </uni-grid-item>
          <uni-grid-item @click="handleBuilding">
            <view class="action-item">
              <view class="icon-wrapper blue">
                <uni-icons type="help" size="28" color="#fff"></uni-icons>
              </view>
              <text class="text">在线客服</text>
            </view>
          </uni-grid-item>
          <uni-grid-item @click="handleBuilding">
            <view class="action-item">
              <view class="icon-wrapper mauve">
                <uni-icons type="chatboxes" size="28" color="#fff"></uni-icons>
              </view>
              <text class="text">反馈社区</text>
            </view>
          </uni-grid-item>
          <uni-grid-item @click="handleBuilding">
            <view class="action-item">
              <view class="icon-wrapper green">
                <uni-icons type="heart" size="28" color="#fff"></uni-icons>
              </view>
              <text class="text">点赞我们</text>
            </view>
          </uni-grid-item>
        </uni-grid>
      </uni-card>

      <!-- 菜单列表 -->
      <uni-card :is-shadow="true" :border="false" class="menu-card">
        <uni-list>
          <uni-list-item title="编辑资料" @click="handleToEditInfo" thumb="static/images/tabbar/mine.png" clickable>
            <template #header>
              <uni-icons type="person" size="20" color="#2F6BEE" style="margin-right: 12px;"></uni-icons>
            </template>
          </uni-list-item>
          <uni-list-item title="常见问题" @click="handleHelp" clickable>
            <template #header>
              <uni-icons type="help" size="20" color="#2F6BEE" style="margin-right: 12px;"></uni-icons>
            </template>
          </uni-list-item>
          <uni-list-item title="关于我们" @click="handleAbout" clickable>
            <template #header>
              <uni-icons type="info" size="20" color="#2F6BEE" style="margin-right: 12px;"></uni-icons>
            </template>
          </uni-list-item>
          <uni-list-item title="应用设置" @click="handleToSetting" clickable>
            <template #header>
              <uni-icons type="gear" size="20" color="#2F6BEE" style="margin-right: 12px;"></uni-icons>
            </template>
          </uni-list-item>
        </uni-list>
      </uni-card>
    </view>
  </view>
</template>

<script setup>
  import { useUserStore } from '@/store'
  import { computed, getCurrentInstance } from "vue"

  const { proxy } = getCurrentInstance()
  const name = computed(() => useUserStore().name)
  const avatar = computed(() => useUserStore().avatar)

  function handleToInfo() {
    proxy.$tab.navigateTo('/pages/mine/info/index')
  }

  function handleToEditInfo() {
    proxy.$tab.navigateTo('/pages/mine/info/edit')
  }

  function handleToSetting() {
    proxy.$tab.navigateTo('/pages/mine/setting/index')
  }

  function handleToLogin() {
    proxy.$tab.reLaunch('/pages/login/index')
  }

  function handleHelp() {
    proxy.$tab.navigateTo('/pages/mine/help/index')
  }

  function handleAbout() {
    proxy.$tab.navigateTo('/pages/mine/about/index')
  }

  function handleJiaoLiuQun() {
    proxy.$modal.showToast('QQ群：①133713780(满)、②146013835(满)、③189091635')
  }

  function handleBuilding() {
    proxy.$modal.showToast('模块建设中~')
  }
</script>

<style lang="scss" scoped>
  page {
    background-color: #f5f6f7;
  }

  .mine-container {
    width: 100%;
    min-height: 100vh;
    background: #F7F8FA;

    .header-card {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #3c96f3 0%, #2F6BEE 100%);
      border-radius: 0 0 40rpx 40rpx;

      .header-section {
        padding: 60rpx 30rpx 40rpx;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .cu-avatar {
          border: 3px solid rgba(255,255,255,0.3);
          width: 120rpx;
          height: 120rpx;
        }

        .login-tip {
          font-size: 32rpx;
          margin-left: 20rpx;
          font-weight: 500;
        }

        .user-info {
          margin-left: 20rpx;

          .u_title {
            font-size: 32rpx;
            line-height: 44rpx;
            font-weight: 500;
          }
        }
      }
    }

    .content-section {
      padding: 20rpx;
      margin-top: -30rpx;
      position: relative;

      .actions-card {
        margin-bottom: 20rpx;
      }

      .menu-card {
        padding: 0;
      }
    }

    .action-item {
      padding: 20rpx 0;
      text-align: center;

      .icon-wrapper {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12rpx;

        &.pink { background: linear-gradient(135deg, #FF6B81 0%, #F43F50 100%); }
        &.blue { background: linear-gradient(135deg, #60A5FA 0%, #2F6BEE 100%); }
        &.mauve { background: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%); }
        &.green { background: linear-gradient(135deg, #34D399 0%, #10B981 100%); }
      }

      .text {
        display: block;
        font-size: 24rpx;
        color: #333;
      }
    }
  }
</style>
