import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const app = express()
const port = Number(process.env.PORT || 3000)
const pool = process.env.DB_HOST ? mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5
}) : null

app.use(cors())
app.use(express.json({ limit: '2mb' }))

function requireOpenid(req, res, next) {
  const openid = req.header('x-user-openid')
  if (!openid) return res.status(401).json({ message: '请先登录' })
  req.openid = openid
  next()
}

app.get('/health', async (_req, res) => {
  let database = 'not-configured'
  if (pool) {
    try { await pool.query('SELECT 1'); database = 'ok' } catch { database = 'error' }
  }
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
  if (pool) await pool.execute('INSERT INTO users (openid) VALUES (?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP', [result.openid])
  res.json({ openid: result.openid })
})

app.get('/api/trips', requireOpenid, async (req, res) => {
  if (!pool) return res.json([])
  const [rows] = await pool.execute('SELECT id, payload, updated_at AS updatedAt FROM trips WHERE openid = ? ORDER BY updated_at DESC', [req.openid])
  res.json(rows.map(row => ({ ...JSON.parse(row.payload), updatedAt: row.updatedAt })))
})

app.put('/api/trips/:id', requireOpenid, async (req, res) => {
  if (!pool) return res.status(503).json({ message: '数据库尚未配置' })
  const payload = JSON.stringify(req.body || {})
  await pool.execute('INSERT INTO trips (id, openid, payload) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = CURRENT_TIMESTAMP', [req.params.id, req.openid, payload])
  res.json({ ok: true })
})

app.delete('/api/trips/:id', requireOpenid, async (req, res) => {
  if (pool) await pool.execute('DELETE FROM trips WHERE id = ? AND openid = ?', [req.params.id, req.openid])
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
