import express from 'express'
import cors from 'cors'
import cloudbase from '@cloudbase/node-sdk'

const app = express()
const port = Number(process.env.PORT || 3000)
const cloudApp = cloudbase.init({
  env: process.env.TCB_ENV_ID || process.env.CLOUDBASE_ENV_ID || 'ty01-d3gu33xur9acdf9d4',
  secretId: process.env.TCB_SECRET_ID,
  secretKey: process.env.TCB_SECRET_KEY
})
const db = cloudApp.database()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

function requireOpenid(req, res, next) {
  const openid = req.header('x-user-openid')
  if (!openid) return res.status(401).json({ message: '请先登录' })
  req.openid = openid
  next()
}

app.get('/health', async (_req, res) => {
  let database = 'error'
  try { await db.collection('trips').limit(1).get(); database = 'ok' } catch { database = 'not-configured' }
  res.json({ ok: true, service: 'travel-planner', database })
})

app.post('/api/auth/wechat-login', async (req, res) => {
  const code = String(req.body?.code || '')
  if (!code || !process.env.WECHAT_APPID || !process.env.WECHAT_APP_SECRET) {
    return res.status(400).json({ message: '缺少登录参数或云端微信配置' })
  }
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
  url.search = new URLSearchParams({
    appid: process.env.WECHAT_APPID,
    secret: process.env.WECHAT_APP_SECRET,
    js_code: code,
    grant_type: 'authorization_code'
  })
  const result = await fetch(url).then(response => response.json())
  if (!result.openid) return res.status(401).json({ message: result.errmsg || '微信登录失败' })
  const userCollection = db.collection('users')
  const existing = await userCollection.where({ openid: result.openid }).limit(1).get()
  if (!existing.data.length) await userCollection.add({ openid: result.openid, createdAt: db.serverDate(), updatedAt: db.serverDate() })
  res.json({ openid: result.openid })
})

app.get('/api/trips', requireOpenid, async (req, res) => {
  const result = await db.collection('trips').where({ openid: req.openid }).orderBy('updatedAt', 'desc').get()
  res.json(result.data.map(row => ({ ...row.payload, id: row.id, updatedAt: row.updatedAt })))
})

app.put('/api/trips/:id', requireOpenid, async (req, res) => {
  const payload = req.body || {}
  const collection = db.collection('trips')
  const existing = await collection.where({ id: req.params.id, openid: req.openid }).limit(1).get()
  const doc = { id: req.params.id, openid: req.openid, payload, updatedAt: db.serverDate() }
  if (existing.data.length) await collection.doc(existing.data[0]._id).update(doc)
  else await collection.add({ ...doc, createdAt: db.serverDate() })
  res.json({ ok: true })
})

app.delete('/api/trips/:id', requireOpenid, async (req, res) => {
  const existing = await db.collection('trips').where({ id: req.params.id, openid: req.openid }).limit(1).get()
  if (existing.data.length) await db.collection('trips').doc(existing.data[0]._id).remove()
  res.json({ ok: true })
})

app.post('/api/map/route', async (req, res) => {
  if (!process.env.AMAP_WEB_SERVICE_KEY) return res.status(503).json({ message: '高德 Key 尚未配置' })
  const { mode = 'walking', origin, destination } = req.body || {}
  const url = new URL(`https://restapi.amap.com/v3/direction/${mode}`)
  url.search = new URLSearchParams({ key: process.env.AMAP_WEB_SERVICE_KEY, origin, destination })
  const result = await fetch(url).then(response => response.json())
  res.status(result.status === '1' ? 200 : 502).json(result)
})

app.listen(port, () => console.log(`travel-planner service listening on ${port}`))
