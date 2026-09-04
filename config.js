// 应用全局配置
export default {
  baseUrl: 'https://qiulem.com',
  wsUrl: 'wss://www.qiulem.com/infra/ws',
  appInfo: {
    name: '初球裁教版',
    version: '1.0.2',
    logo: '/static/logo.png',
    payAppId: 12,
    customerServicePhone: '15900560488',
    customerServiceHours: '9:00-21:00',
    agreements: [
      { title: '隐私政策', url: 'https://qiulem.com/agreement/coachPrivacy.html' },
      { title: '用户服务协议', url: 'https://qiulem.com/agreement/coachAgreement.html' }
    ]
  }
}