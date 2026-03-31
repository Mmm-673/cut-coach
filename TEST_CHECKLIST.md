# 测试检查清单

## 项目功能测试清单

### 1. 登录流程
- [ ] 账号密码登录成功
- [ ] 登录后自动获取位置权限
- [ ] 位置上报成功（调用 /coach-api/billiard/coach/location）
- [ ] 自动跳转到工作台页面

### 2. 工作台 - 工作状态切换
- [ ] 点击上线开关
- [ ] 弹出位置权限请求
- [ ] 调用 /coach-api/billiard/coach/work-status 接口
- [ ] 成功上线，显示"在线接单中"
- [ ] 开始5秒轮询待接单列表

- [ ] 点击下线开关
- [ ] 弹出二次确认对话框
- [ ] 确认后调用下线接口
- [ ] 成功下线，停止轮询

### 3. 待接单流程
- [ ] 上线后自动轮询（每5秒）调用 /coach-api/billiard/order/pending
- [ ] 收到待接单后停止轮询
- [ ] 显示订单信息（球厅、价格、预约时间等）
- [ ] 显示倒计时（如果有expireAt）

- [ ] 点击"拒绝"按钮
- [ ] 弹出确认对话框，可输入原因
- [ ] 调用 /coach-api/billiard/order/reject
- [ ] 订单取消，恢复轮询

- [ ] 点击"接单"按钮
- [ ] 调用 /coach-api/billiard/order/accept
- [ ] 订单状态变为"已接单"

### 4. 已接单流程
- [ ] 显示"确认出发"按钮
- [ ] 点击"确认出发"
- [ ] 调用 /coach-api/billiard/order/confirm-departure
- [ ] 显示"已确认出发"提示
- [ ] 显示"到达服务地址"按钮

- [ ] 点击"到达服务地址"
- [ ] 调用 /coach-api/billiard/order/arrive
- [ ] 显示"已到达"提示
- [ ] 显示"开始服务"按钮

- [ ] 点击"开始服务"
- [ ] 调用 /coach-api/billiard/order/start
- [ ] 订单状态变为"服务中"
- [ ] 开始服务计时

### 5. 服务中流程
- [ ] 显示已服务时长和剩余时长
- [ ] 计时正常走动
- [ ] 显示订单详情卡片
- [ ] 导航按钮可用
- [ ] 联系客户按钮可用

- [ ] 点击"结束服务"
- [ ] 弹出确认对话框
- [ ] 调用 /coach-api/billiard/order/finish
- [ ] 停止计时
- [ ] 订单状态变为"空闲"
- [ ] 恢复待接单轮询

### 6. 导航和联系功能
- [ ] 点击导航按钮
- [ ] 正确打开地图应用
- [ ] 坐标正确传递

- [ ] 点击联系客户
- [ ] 正确拨打电话

## API 接口清单

### 助教模块 (coach.js)
1. `PUT /coach-api/billiard/coach/work-status` - 切换工作状态
2. `POST /coach-api/billiard/coach/location` - 更新坐标
3. `GET /coach-api/billiard/coach/profile` - 获取个人信息

### 订单模块 (order.js)
1. `GET /coach-api/billiard/order/pending` - 获取待接单列表
2. `POST /coach-api/billiard/order/accept` - 接单
3. `POST /coach-api/billiard/order/confirm-departure` - 确认出发
4. `POST /coach-api/billiard/order/arrive` - 到达服务地址
5. `POST /coach-api/billiard/order/reject` - 拒单
6. `POST /coach-api/billiard/order/start` - 开始服务
7. `POST /coach-api/billiard/order/finish` - 结束服务

## 潜在问题检查

### 已修复的问题
1. ✅ API函数名冲突 - 已重命名为 *Api 后缀
2. ✅ 缺少"开始服务"按钮 - 已在到达后添加
3. ✅ 轮询逻辑 - 5秒一次，查到订单后停止

### 需要注意的点
1. 位置权限需要用户授权
2. 订单数据结构需要与后端API返回一致
3. 所有API都需要token验证
4. 时间格式化基于ISO 8601格式
