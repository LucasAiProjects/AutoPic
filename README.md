# Together.ai Image Generation API

Node.js后端服务，集成together.ai的图像生成API，提供模块化设计和清晰的项目结构。

## 功能

- RESTful API设计
- Together.ai图像生成集成
- 在Render上自动部署
- 日志记录和错误处理
- 环境变量配置
- 支持多图片返回

## 项目结构

```
├── src
│   ├── config          # 配置文件
│   ├── controllers     # 路由控制器
│   ├── middleware      # 中间件
│   ├── routes          # API路由
│   ├── services        # 业务逻辑
│   ├── utils           # 工具函数
│   └── server.js       # 服务启动入口
├── .env-example        # 环境变量示例
├── .gitignore          # Git忽略文件
├── README.md           # 项目文档
├── package.json        # 项目依赖
└── render.yaml         # Render部署配置
```

## 安装

```bash
# 克隆项目
git clone <repository-url>

# 安装依赖
npm install

# 配置环境变量
cp .env-example .env
# 编辑.env文件，添加Together.ai API密钥
```

## 开发

```bash
# 启动开发服务器
npm run dev
```

## 部署

### 自动部署到Render

项目已配置为使用GitHub Actions自动部署到Render。每当代码推送到main分支时，Actions会自动触发Render的部署。

#### 配置GitHub Actions部署

1. 在Render上创建新服务
2. 连接到你的GitHub仓库
3. 添加环境变量`TOGETHER_API_KEY`
4. 在GitHub仓库设置中添加以下密钥（Settings > Secrets and variables > Actions）:

   **方法一: 使用Render API（推荐）**
   - `RENDER_SERVICE_ID`: 你的Render服务ID（从服务URL或设置中获取）
   - `RENDER_API_KEY`: 从Render的账户设置页面生成的API密钥

   **方法二: 使用Render Deploy Hook**
   - `RENDER_DEPLOY_HOOK`: 从Render服务设置中获取的Deploy Hook URL

5. 推送到main分支即可触发自动部署

详细信息请参阅`.github/workflows/render-deploy.yml`文件。

## API接口

### 生成图片

```
POST /api/images/generate
```

请求体:

```json
{
  "prompt": "描述你想生成的图片",
  "model": "stabilityai/stable-diffusion-xl-base-1.0", // 可选
  "width": 512, // 可选
  "height": 512, // 可选
  "steps": 4, // 可选
  "n": 2 // 可选，指定需要生成的图片数量，默认为1
}
```

响应:

```json
{
  "success": true,
  "data": [
    {
      "url": "https://api.together.ai/imgproxy/ZsOf07yx7rWteqmfk1bmUKq5ejX380x7yn3y8pGn"
    },
    {
      "url": "https://api.together.ai/imgproxy/9sFg45yx2qRtepmck7bmTSw2ejX380x7tm3p4cHn"
    }
  ]
}
```

注意：使用n参数可以控制Together.ai API生成并返回的图片数量。

## 许可

MIT