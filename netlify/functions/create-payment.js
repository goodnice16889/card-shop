// netlify/functions/create-payment.js
// 调用易支付协议接口（码支付 mzf3.mapay.cc），生成跳转链接
import crypto from 'crypto'

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const { orderId, amount, name, payType } = JSON.parse(event.body || '{}')

  const pid    = process.env.YPAY_PID
  const key    = process.env.YPAY_KEY
  const apiUrl = process.env.YPAY_API_URL // 例如 https://mzf3.mapay.cc
  const siteUrl = process.env.URL || 'http://localhost:5173'

  if (!pid || !key || !apiUrl) {
    return { statusCode: 500, body: JSON.stringify({ error: '支付配置缺失，请检查 YPAY_PID / YPAY_KEY / YPAY_API_URL 环境变量' }) }
  }

  const params = {
    money:        parseFloat(amount).toFixed(2),
    name:         name,
    notify_url:   `${siteUrl}/.netlify/functions/payment-notify`,
    out_trade_no: orderId,
    pid:          String(pid),
    return_url:   `${siteUrl}/order/${orderId}`,
    sitename:     '卡密商店',
    type:         payType,
  }

  const signStr = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] != null)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + key

  const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex')

  // 去掉 API 地址结尾的斜杠，避免出现 // 双斜杠
  const base = apiUrl.replace(/\/+$/, '')
  const query = new URLSearchParams({ ...params, sign, sign_type: 'MD5' }).toString()
  const payUrl = `${base}/submit.php?${query}`

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payUrl }),
  }
}
