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

### 裁教模块 (coach.js)
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

## 押金模块 (2026-10-15)

### 手动验收项
- [ ] 旧助教未配置押金，上线不被误拦（不弹缺口弹窗）
- [ ] 已配置且余额不足：点击上线弹缺口 + 联系客服按钮，不触发位置授权
- [ ] 上线被后端 101000310 拒绝时提示「押金余额不足，请联系客服补齐后再上线」
- [ ] 押金处罚导致在线转离线：在服订单不中断，仅阻止新接单
- [ ] 审核缺口与上线缺口分别展示、不相加
- [ ] 流水列表分页加载、正负金额颜色区分、orderId 跳转订单详情正确（联调必验：用真实长 ID 流水验证；详情页内部 parseInt 对超 2^53 的雪花 ID 会截断，如确认存在需另行修复 subpkg/order/detail.vue）
- [ ] 后台录入补缴到账后刷新概览，需手动再次上线
- [ ] 金额分转元展示、空值显示「—」、未知流水类型显示「资金变动」
- [ ] 钱包页押金卡片：正常显示摘要；押金接口失败时静默降级只留入口

### 在线缴纳 (2026-10-18)
- [ ] 缺口态主按钮为「在线缴纳」，联系客服为次入口
- [ ] 渠道列表为空显示「暂不可缴纳，请联系客服」且确认禁用
- [ ] 金额默认填缺口、可修改；非法金额（0/负数/三位小数/超上限）被拦截提示
- [ ] 微信/支付宝拉起支付成功 → 提示缴纳成功，概览余额与流水刷新
- [ ] SDK 取消/超时/杀进程后回 App：以查单为准，不重复扣款、不误报失败（CREATED 显示确认中）
- [ ] CREDITED 后不自动上线，需手动再点上线
- [ ] H5/小程序端提交提示「请在 App 中缴纳」
- [ ] 同金额同渠道重复确认不重复创建支付单（复用 depositPaymentId）

### API 接口清单

### 押金模块 (deposit.js)
1. `GET /coach-api/billiard/deposit/get` - 押金概览（门槛/余额/双缺口）
2. `GET /coach-api/billiard/deposit/flow/page` - 押金流水（分页，最新在前）
