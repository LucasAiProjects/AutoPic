import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 支持ES模块中的__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000 || '0.0.0.0',
  together: {
    apiKey: process.env.TOGETHER_API_KEY,
    apiUrl: process.env.TOGETHER_API_URL || 'https://api.together.xyz',
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 默认1分钟
    max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10), // 默认每窗口10次请求
    imageMax: parseInt(process.env.IMAGE_RATE_LIMIT_MAX || '5', 10), // 图像生成接口限制
  },
  cache: {
    imageExpiry: 60 * 60 * 1, // 1小时，单位秒 
  }
};

export default config; 