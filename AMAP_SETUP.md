# 高德路线接入

当前地图已经使用微信小程序原生 `map` 组件。高德 Web 服务用于获取步行、骑行和驾车的道路轨迹、距离与预计时间。

## 1. 配置 Key

复制 `.env.local.example` 为 `.env.local`，填写高德开放平台创建的 Web 服务 Key：

```text
VITE_AMAP_WEB_SERVICE_KEY=你的Web服务Key
```

`.env.local` 已加入 `.gitignore`，不要提交到 GitHub。

## 2. 配置请求域名

在微信公众平台的“开发管理 -> 开发设置 -> 服务器域名”中，将下面的域名加入 request 合法域名：

```text
https://restapi.amap.com
```

## 3. 重新启动编译

```powershell
npm run dev:weapp
```

环境变量只在启动编译时读取，修改 Key 后需要停止并重新运行编译命令。

## 上线说明

当前直连方式适合本地演示和面试项目。正式上线时建议把高德请求移动到微信云函数或自己的后端，并在服务端保存 Key。
