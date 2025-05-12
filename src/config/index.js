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
  port: process.env.PORT || 3000,
  together: {
    apiKey: process.env.TOGETHER_API_KEY,
    apiUrl: process.env.TOGETHER_API_URL || 'https://api.together.xyz',
  },
  // 根据需要添加其他配置
};

export default config; 