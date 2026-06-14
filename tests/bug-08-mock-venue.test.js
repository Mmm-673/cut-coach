/**
 * BUG-08 测试：教学地点 Mock 数据前端过滤
 * - 场馆名含 "Mock" 应视为无效数据
 * - 场馆地址含 "Mock" 应视为无效数据
 * - 有效数据不应被误过滤
 */
import { describe, it, expect } from 'vitest'
import { isMockVenue } from '@/utils/platform'

describe('BUG-08 Mock 场馆数据过滤', () => {
  it('含 "Mock" 的场馆名应被识别为无效', () => {
    expect(isMockVenue('Mock球厅-10', 'Mock地址-10')).toBe(true)
    expect(isMockVenue('mock球厅', '某地址')).toBe(true)
    expect(isMockVenue('MOCK球厅', '某地址')).toBe(true)
  })

  it('含 "Mock" 的场馆地址应被识别为无效', () => {
    expect(isMockVenue('正常球厅', 'Mock地址-10')).toBe(true)
    expect(isMockVenue('正常球厅', 'mock测试地址')).toBe(true)
  })

  it('空值和"-"应被视为无效', () => {
    expect(isMockVenue('', '')).toBe(true)
    expect(isMockVenue('', null)).toBe(true)
    expect(isMockVenue('-', '-')).toBe(true)
    expect(isMockVenue(null, null)).toBe(true)
    expect(isMockVenue(undefined, undefined)).toBe(true)
  })

  it('正常场馆数据不应被误过滤', () => {
    expect(isMockVenue('台球俱乐部', '北京市朝阳区xx路')).toBe(false)
    expect(isMockVenue('星牌台球厅', '上海市浦东新区xx号')).toBe(false)
    expect(isMockVenue('初球裁教版球房', '杭州市西湖区xx街')).toBe(false)
  })

  it('部分匹配 "Mock" 但非模拟数据的不应被误过滤', () => {
    // 正常名称中不太可能出现 "mock"，但以防万一
    expect(isMockVenue('Mock不是名字', '正常地址')).toBe(true) // 含mock确实应过滤
    expect(isMockVenue('台球俱乐部', '北京市朝阳区Amock路88号')).toBe(true) // 地址含mock
  })
})
