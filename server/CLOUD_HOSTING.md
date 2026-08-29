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
TCB_ENV_ID=ty01-d3gu33xur9acdf9d4
TCB_SECRET_ID=（云托管运行身份提供时填写）
TCB_SECRET_KEY=（云托管运行身份提供时填写）
```

## 数据库

后端使用 CloudBase 原生文档数据库，集合为 `users` 和 `trips`。部署完成后访问：

```text
https://云托管服务域名/health
```

返回 `{"ok":true,"database":"ok"}` 即表示服务和数据库连通。
