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

项目已配置为在Render上自动部署。只需要：

1. 在Render上创建新服务
2. 连接到你的Git仓库
3. 添加环境变量`TOGETHER_API_KEY`
4. 部署服务

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
      "url": "https://together-image-output.s3.amazonaws.com/image1.png"
    },
    {
      "url": "https://together-image-output.s3.amazonaws.com/image2.png"
    }
  ]
}
```

注意：使用n参数可以控制Together.ai API生成并返回的图片数量。

## 许可

MIT 