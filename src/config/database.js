import { Pool } from 'pg';
import config from './index.js';
import logger from '../utils/logger.js';

// 创建数据库连接池
const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 连接空闲超时时间
  connectionTimeoutMillis: 10000, // 连接超时时间
});

// 监听连接池事件
pool.on('connect', () => {
  logger.info('数据库连接池：新连接已建立');
});

pool.on('error', (err) => {
  logger.error('数据库连接池错误:', err);
});

/**
 * 执行查询
 * @param {string} text - SQL 查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise<Object>} 查询结果
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info(`SQL 查询执行完成: ${duration}ms`);
    return res;
  } catch (error) {
    logger.error('SQL 查询错误:', { query: text, params, error: error.message });
    throw error;
  }
};

/**
 * 获取数据库客户端（用于事务）
 * @returns {Promise<Object>} 数据库客户端
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
export const testConnection = async () => {
  try {
    await query('SELECT NOW()');
    logger.info('数据库连接测试成功');
    return true;
  } catch (error) {
    logger.error('数据库连接测试失败:', error.message);
    return false;
  }
};

export default pool; 