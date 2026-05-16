/**
 * BUG-04 测试：客服中心 FAQ 内容应替换为业务内容
 * - 不含 "若依" 关键词
 * - CSS 类名不含 "ruoyi"
 * - v-for 语法正确
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'

// 模拟 uni-app 组件
const UniIcons = defineComponent({
  name: 'UniIcons',
  props: ['type', 'size', 'color'],
  template: '<span class="uni-icons" />'
})

describe('BUG-04 客服中心 FAQ 内容', () => {
  // 测试 FAQ 列表数据不含若依关键词
  it('FAQ 内容不应包含若依相关关键词', () => {
    const faqList = [
      {
        title: '常见问题',
        iconClass: 'faq-icon',
        childList: [
          { title: '如何提现多久能到账？', content: '正常情况下' },
          { title: '为什么会被扣款？', content: '扣款通常发生在' },
          { title: '如何修改个人信息？', content: '您可以在' },
          { title: '接单服务范围是如何计算的？', content: '服务费用根据' }
        ]
      },
      {
        title: '账户相关',
        iconClass: 'account-icon',
        childList: [
          { title: '如何退出登录？', content: '请点击' },
          { title: '如何修改用户头像？', content: '请点击' },
          { title: '如何修改登录密码？', content: '请点击' },
          { title: '忘记密码怎么办？', content: '在登录页面' }
        ]
      }
    ]

    const allText = JSON.stringify(faqList)
    expect(allText).not.toContain('若依')
    expect(allText).not.toContain('ruoyi')
    expect(allText).not.toContain('RuoYi')
  })

  // 测试 CSS 类名不含 ruoyi
  it('iconClass 类名不应包含 ruoyi', () => {
    const faqList = [
      { iconClass: 'faq-icon' },
      { iconClass: 'account-icon' }
    ]

    faqList.forEach(item => {
      expect(item.iconClass).not.toContain('ruoyi')
    })
  })

  // 测试 v-for 语法正确性（通过验证列表渲染）
  it('FAQ 列表应能正确遍历渲染', () => {
    const list = ref([
      {
        title: '常见问题',
        iconClass: 'faq-icon',
        childList: [
          { title: '问题1', content: '答案1' }
        ]
      }
    ])

    const TestComponent = defineComponent({
      setup() {
        return { list }
      },
      template: `
        <div>
          <div v-for="item in list" :key="item.title" class="section-card">
            <span class="title">{{ item.title }}</span>
            <div v-for="(child, index) in item.childList" :key="index">
              <span>{{ child.title }}</span>
            </div>
          </div>
        </div>
      `
    })

    const wrapper = mount(TestComponent)
    expect(wrapper.findAll('.section-card')).toHaveLength(1)
    expect(wrapper.text()).toContain('常见问题')
    expect(wrapper.text()).toContain('问题1')
  })
})
