# 微信云托管部署

环境 ID：`prod-d6gu5f0kna1b50256`

服务名：`express-2o8b-001`

## 构建配置

- 构建方式：Dockerfile
- Dockerfile：`server/Dockerfile`
- 服务端口：`3000`
- 健康检查：`GET /health`

## 环境变量

在云托管服务的环境变量中填写，不要写入小程序代码或 Git：

```text
PORT=3000
WECHAT_APPID=小程序 AppID
WECHAT_APP_SECRET=小程序 AppSecret
AMAP_WEB_SERVICE_KEY=高德 Web 服务 Key
DB_HOST=数据库内网地址
DB_PORT=3306
DB_NAME=travel_planner
DB_USER=数据库用户
DB_PASSWORD=数据库密码
```

## 数据库

当前环境使用 PostgreSQL。已在 `public` Schema 创建 `users`、`trips` 表。云托管环境变量使用 PostgreSQL 连接信息，并增加 `DB_SSL=true`（如控制台要求 SSL）。部署完成后访问：

```text
https://云托管服务域名/health
```

返回 `{"ok":true,"database":"ok"}` 即表示服务和数据库连通。
