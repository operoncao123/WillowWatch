# 北京柳絮多源传播版

一个面向移动端传播的北京柳絮专题页，覆盖北京 16 区。  
现在支持两种运行方式：

- 默认推荐：`GitHub Pages 静态前端 + data/overview.json 静态数据`
- 可选：`前端 + Node 后端 API`

## 当前能力

- 北京 16 区风险矩阵
- 单区实时详情，包含今日 / 明日风险
- 区级生态修正因子和热点区域提示
- 海报化首屏，适合截图传播
- 可生成静态 `data/overview.json`，直接挂 GitHub Pages
- 支持本机定时刷新并推送最新静态数据
- 原生 HTML / CSS / JS 前端
- Node 后端 API

## 项目结构

```text
liuxu_forecast/
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   └── districts.js
│   │   ├── lib/
│   │   │   ├── ecology-service.js
│   │   │   ├── overview-service.js
│   │   │   ├── risk-engine.js
│   │   │   ├── weather-service.js
│   │   └── server.js
│   └── tests/
├── docs/
├── data/
│   └── overview.json
├── index.html
├── style.css
├── script.js
├── app-config.js
├── package.json
├── scripts/
│   ├── build-static-data.js
│   ├── publish-static-update.sh
│   └── install-launch-agent.sh
└── tests/
    └── frontend.test.js
```

## 本地启动 API 模式

先启动后端：

```bash
npm start
```

默认地址：

- 页面与 API：`http://127.0.0.1:8787`
- 健康检查：`http://127.0.0.1:8787/api/health`

浏览器直接打开：

```text
http://127.0.0.1:8787
```

## 生成静态数据

```bash
npm run build:static-data
```

会生成：

- [data/overview.json](/Users/operoncao/Desktop/dagong/OPC/liuxu_forecast/data/overview.json)

GitHub Pages 默认直接读取这份静态数据，不需要公网后端。

## 测试

```bash
node --test
```

## API

### `GET /api/overview?district=haidian`

返回：

- 海报首屏信息
- 16 区排行
- 当前区详情

## 部署说明

当前版本推荐的正式部署方式：

1. `前端 + data/overview.json` 一起放 GitHub Pages
2. 你的电脑定时运行静态数据刷新脚本
3. 刷新后自动提交并推送到 GitHub

### 前端放 GitHub Pages

项目里的静态资源已经使用相对路径，适合部署到：

- `https://<username>.github.io/<repo>/`

步骤：

1. 把仓库推到 GitHub
2. 在仓库 `Settings -> Pages` 选择 `main` 分支和根目录
3. 保持 [app-config.js](/Users/operoncao/Desktop/dagong/OPC/liuxu_forecast/app-config.js) 里的 `apiBase` 为空
4. 等待 Pages 生效

### 本机定时刷新静态数据

先确认仓库已经是 git 仓库，并且配置好了远端 `origin`。

手动刷新一次：

```bash
npm run update:static-site
```

这个脚本会做三件事：

1. 调 Open-Meteo 拉最新数据
2. 重写 [data/overview.json](/Users/operoncao/Desktop/dagong/OPC/liuxu_forecast/data/overview.json)
3. 如果数据有变化，就自动 `commit + push`

### macOS 定时任务

安装本机定时任务：

```bash
bash scripts/install-launch-agent.sh
```

默认每 30 分钟运行一次。

日志目录：

- `logs/launchd.out.log`
- `logs/launchd.err.log`

### 可选的实时 API 模式

如果你以后还是想让前端直连后端 API，再把 [app-config.js](/Users/operoncao/Desktop/dagong/OPC/liuxu_forecast/app-config.js) 改成：

```js
window.LIUXU_APP_CONFIG = {
  apiBase: "https://your-api.example.com",
  staticDataPath: "data/overview.json",
};
```

也可以临时用查询参数覆盖：

```text
https://<username>.github.io/<repo>/?api=https://your-api.example.com
```

## 资源优化

- 页面现在默认加载 `assets/stickers/*.webp`
- 原始手绘大图仍保留在仓库根目录，作为源文件备份
- GitHub Pages 和移动端实际访问的是压缩后的前端资源

## 注意事项

- 这是区级综合估计，不是街道级精确预报
- 当前主模型仅使用天气与生态暴露因子
