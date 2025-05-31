import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 支持ES模块中的__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 3000,
  together: {
    apiKey: process.env.TOGETHER_API_KEY,
    apiUrl: process.env.TOGETHER_API_URL || 'https://api.together.xyz',
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  cache: {
    imageExpiry: 60 * 60 * 24, // 24小时，单位秒
  }
};

export default config; 