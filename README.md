# peerbud-argo

简洁版 Cloudflare Argo 隧道订阅生成工具（基于 nodejs-argo 原理改写）。支持临时/固定隧道 + VLESS/VMess/Trojan 订阅输出，适合 Docker 一键部署。

## 🚀 快速部署

### 1. 使用 Docker（推荐）
```bash
docker run -d --restart unless-stopped --name peerbud-argo \
  -p 3000:3000 \
  -e ARGO_DOMAIN=xxxxxxx.trycloudflare.com \
  -e ARGO_AUTH=eyJhIjoi... \
  ghcr.io/yourusername/peerbud-argo
```

### 2. 本地运行（开发/测试）
```bash
git clone https://github.com/yourname/peerbud-argo.git
cd peerbud-argo
npm install
```

设置环境变量：
```bash
export ARGO_DOMAIN=xxxxxxx.trycloudflare.com
export ARGO_AUTH=eyJhIjoi...
export PORT=3000
export ARGO_PORT=8001
```

启动服务：
```bash
npm start
```

## 📡 路由说明

- `/sub` - 输出订阅内容
- `/uuid` - 返回固定 UUID
- `/health` - 健康检查

## 📋 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | HTTP 服务监听端口 | `3000` |
| `ARGO_PORT` | Argo 隧道代理目标端口 | `8001` |
| `ARGO_DOMAIN` | 固定 Cloudflare 隧道域名（trycloudflare.com） | 空（使用临时隧道） |
| `ARGO_AUTH` | Cloudflare 隧道 Token | 空（使用临时隧道） |
| `CF_IP` | 订阅伪装 IP/域名 | `icook.hk` |
| `CF_PORT` | 订阅伪装端口 | `443` |

## 📝 注意事项

- 未设置 `ARGO_DOMAIN`/`ARGO_AUTH` 则使用临时 Argo 隧道，每次可能不同
- 设置了 `ARGO_DOMAIN` + `ARGO_AUTH` 则使用固定隧道
- 订阅示例地址：`http://127.0.0.1:3000/sub`
- Docker 镜像已支持 `linux/amd64` 和 `linux/arm64` 构建

## 📄 License

MIT
