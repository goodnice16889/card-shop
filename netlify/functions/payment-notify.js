// netlify/functions/payment-notify.js
// 易支付协议回调：验签 → 更新订单状态 → 按商品/规格分配卡密
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  const params = event.queryStringParameters || {}
  const key = process.env.YPAY_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!key || !supabaseUrl || !supabaseServiceKey) {
    return { statusCode: 500, body: 'Config missing' }
  }

  // 1. Verify signature
  const { sign, sign_type, ...rest } = params
  const signStr = Object.keys(rest).sort()
    .filter(k => rest[k] !== '')
    .map(k => `${k}=${rest[k]}`).join('&') + key
  const expectedSign = crypto.createHash('md5').update(signStr).digest('hex')

  if (sign !== expectedSign) {
    console.error('Signature mismatch', { sign, expectedSign })
    return { statusCode: 200, body: 'fail' }
  }

  // 2. Check trade status
  if (params.trade_status !== 'TRADE_SUCCESS') {
    return { statusCode: 200, body: 'ok' }
  }

  const orderId = params.out_trade_no
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 3. Check order not already processed (idempotency)
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!order || order.status === 'paid') {
    return { statusCode: 200, body: 'success' }
  }

  // 4. Allocate cards (matching product + variant)
  let cardQuery = supabase.from('cards').select('id')
    .eq('product_id', order.product_id).eq('is_sold', false)

  if (order.variant_id) {
    cardQuery = cardQuery.eq('variant_id', order.variant_id)
  } else {
    cardQuery = cardQuery.is('variant_id', null)
  }

  const { data: availableCards } = await cardQuery.limit(order.quantity)

  if (!availableCards || availableCards.length < order.quantity) {
    console.error('Not enough cards for order', orderId)
  }

  const cardIds = (availableCards || []).map(c => c.id)

  // 5. Update cards → sold, linked to order
  if (cardIds.length) {
    await supabase.from('cards').update({ is_sold: true, order_id: orderId, sold_at: new Date().toISOString() })
      .in('id', cardIds)
  }

  // 6. Mark order as paid
  await supabase.from('orders').update({
    status: 'paid',
    trade_no: params.trade_no,
    paid_at: new Date().toISOString(),
  }).eq('id', orderId)

  return { statusCode: 200, body: 'success' }
}
