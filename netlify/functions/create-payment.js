// netlify/functions/create-payment.js
// 调用 YPay 发起支付，返回跳转链接
import crypto from 'crypto'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { orderId, amount, name, payType } = JSON.parse(event.body || '{}')

  const pid    = process.env.YPAY_PID
  const key    = process.env.YPAY_KEY
  // 默认官方节点，自建节点改成对应域名（不加斜杠）
  const apiUrl = process.env.YPAY_API_URL || 'https://ypay.yvdian.cn'
  const siteUrl = process.env.URL || 'http://localhost:5173' // Netlify 自动注入

  if (!pid || !key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'YPay 配置缺失，请检查环境变量 YPAY_PID / YPAY_KEY' }) }
  }

  // YPay 参数（与标准易支付规范一致）
  // sign、sign_type 不参与签名，空值不参与签名
  const params = {
    money:        parseFloat(amount).toFixed(2),
    name:         name,
    notify_url:   `${siteUrl}/.netlify/functions/payment-notify`,
    out_trade_no: orderId,
    pid:          String(pid),
    return_url:   `${siteUrl}/order/${orderId}`,
    sitename:     '卡密商店',
    type:         payType, // 'alipay' | 'wxpay' | 'qqpay'
  }

  // 签名：参数按 key ASCII 升序排列，拼接后追加 key，MD5 小写
  const signStr = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] != null)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + key

  const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex')

  // 拼接跳转 URL（YPay 页面支付入口）
  const query = new URLSearchParams({ ...params, sign, sign_type: 'MD5' }).toString()
  const payUrl = `${apiUrl}/pay/apisubmit?${query}`

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payUrl }),
  }
}
