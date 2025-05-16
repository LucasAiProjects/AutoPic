# Together.ai Image Generation API

Node.js后端服务，集成together.ai的图像生成API，提供模块化设计和清晰的项目结构。

## 功能

- RESTful API设计
- Together.ai图像生成集成
- 在Render上自动部署
- 日志记录和错误处理
- 环境变量配置
- 支持多图片返回
- Upstash Redis缓存与频率限制
- BullMQ异步任务队列处理图片生成
- 实时任务状态和进度追踪

## 项目结构

```
├── src
│   ├── config          # 配置文件
│   ├── controllers     # 路由控制器
│   ├── middleware      # 中间件
│   ├── queues          # BullMQ队列配置
│   ├── routes          # API路由
│   ├── services        # 业务逻辑
│   ├── utils           # 工具函数
│   ├── workers         # BullMQ工作进程
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
# 编辑.env文件，添加Together.ai API密钥和Upstash Redis配置
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
3. 添加以下环境变量:
   - `TOGETHER_API_KEY`: Together.ai的API密钥
   - `REDIS_URL`: Upstash Redis的连接URL
   - `REDIS_TOKEN`: Upstash Redis的访问令牌
4. 在GitHub仓库设置中添加以下密钥（Settings > Secrets and variables > Actions）:

   **方法一: 使用Render API（推荐）**
   - `RENDER_SERVICE_ID`: 你的Render服务ID（从服务URL或设置中获取）
   - `RENDER_API_KEY`: 从Render的账户设置页面生成的API密钥

   **方法二: 使用Render Deploy Hook**
   - `RENDER_DEPLOY_HOOK_URL`: 从Render服务设置中获取的Deploy Hook URL

5. 推送到main分支即可触发自动部署

详细信息请参阅`.github/workflows/render-webhook.yml`文件。

## 技术实现

### 异步图像生成

本项目使用BullMQ和Redis实现了异步图像生成流程：

1. 客户端提交图像生成请求
2. 服务器创建任务并立即返回任务ID
3. BullMQ工作进程在后台异步处理图像生成
4. 工作进程实时更新任务进度
5. 结果保存到Redis缓存
6. 客户端可以通过任务ID查询进度和结果

这种实现有以下优点：
- 减少客户端等待时间
- 支持长时间运行的生成任务
- 避免API超时问题
- 提供任务状态和进度跟踪
- 自动重试失败的任务

### 幂等性与结果缓存

系统对请求参数实现了幂等性处理：
- 相同的图像生成参数会产生相同的任务ID（基于MD5哈希）
- 重复提交相同参数的请求不会触发重复的图像生成
- 已生成的图像结果会被缓存并在后续相同请求中复用
- 系统会自动检测并跳过已经在处理中的任务

这种设计有以下优势：
- 节省计算资源，避免重复生成
- 提高响应速度，缓存命中时可即时返回结果
- 减少API调用次数，降低运营成本
- 提供更一致的用户体验

## API接口

### 创建图像生成任务

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

响应 (新任务):

```json
{
  "success": true,
  "taskId": "a1b2c3d4e5f6g7h8i9j0",
  "cached": false,
  "message": "图像生成任务已创建，请使用任务ID查询结果"
}
```

响应 (缓存命中):

```json
{
  "success": true,
  "taskId": "a1b2c3d4e5f6g7h8i9j0",
  "cached": true,
  "message": "发现相同参数的图像已生成，可直接查询结果"
}
```

### 查询图像生成结果

```
GET /api/images/:taskId
```

响应 (完成状态):

```json
{
  "success": true,
  "status": "completed",
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

响应 (处理中状态):

```json
{
  "success": true,
  "status": "processing",
  "progress": 70,
  "message": "任务processing中 (70%)"
}
```

响应 (失败状态):

```json
{
  "success": true,
  "status": "failed",
  "message": "图像生成失败：[错误详情]"
}
```

响应 (不存在):

```json
{
  "success": false,
  "status": "not_found",
  "message": "任务不存在或已过期"
}
```

### 频率限制

所有API接口都有请求频率限制:

- 通用接口: 默认每分钟10次请求
- 图像生成接口: 默认每分钟5次请求

超过限制将返回429错误:

```json
{
  "success": false,
  "statusCode": 429,
  "message": "请求频率过高，请稍后再试"
}
```

## 许可

MIT