import Redis from 'ioredis';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Redis服务类
 */
class RedisService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  /**
   * 初始化Redis连接
   */
  initialize() {
    try {
      // 连接Upstash Redis，配置与BullMQ兼容
      this.client = new Redis(config.redis.url, {
        maxRetriesPerRequest: null, // BullMQ要求设置为null
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
      });

      this.client.on('connect', () => {
        logger.info('Redis连接成功');
      });

      this.client.on('error', (err) => {
        logger.error(`Redis错误: ${err.message}`);
      });
    } catch (error) {
      logger.error(`Redis初始化失败: ${error.message}`);
    }
  }

  /**
   * 设置键值对，可选过期时间
   * @param {string} key - 键
   * @param {string|Object} value - 值
   * @param {number} [ttl] - 过期时间（秒）
   * @returns {Promise<boolean>} 是否设置成功
   */
  async set(key, value, ttl) {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error(`Redis设置键值对失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取键对应的值
   * @param {string} key - 键
   * @returns {Promise<any>} 值，不存在返回null
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return null;
    } catch (error) {
      logger.error(`Redis获取值失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 删除键
   * @param {string} key - 键
   * @returns {Promise<boolean>} 是否删除成功
   */
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis删除键失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查键是否存在
   * @param {string} key - 键
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis检查键是否存在失败: ${error.message}`);
      return false;
    }
  }
}

// 单例模式导出
const redisService = new RedisService();
export default redisService; 