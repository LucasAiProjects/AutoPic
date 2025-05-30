import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * 用户模型
 */
class User {
  /**
   * 根据用户ID查找用户
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息或null
   */
  static async findByUserId(userId) {
    try {
      const result = await query(
        'SELECT * FROM tb_user WHERE user_id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('查找用户失败:', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object|null>} 用户信息或null
   */
  static async findByEmail(email) {
    try {
      const result = await query(
        'SELECT * FROM tb_user WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('根据邮箱查找用户失败:', { email, error: error.message });
      throw error;
    }
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @param {string} userData.user_id - 用户ID
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @param {string} userData.priority - 优先级
   * @returns {Promise<Object>} 创建的用户信息
   */
  static async create(userData) {
    try {
      const { user_id, username, email, priority = 'normal' } = userData;
      
      const result = await query(
        `INSERT INTO tb_user (user_id, username, email, priority, create_time, update_time)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [user_id, username, email, priority]
      );
      
      logger.info('用户创建成功:', { user_id, email });
      return result.rows[0];
    } catch (error) {
      logger.error('创建用户失败:', { userData, error: error.message });
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object|null>} 更新后的用户信息
   */
  static async update(userId, updateData) {
    try {
      const { username, email, priority } = updateData;
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (username !== undefined) {
        setClause.push(`username = $${paramIndex++}`);
        values.push(username);
      }
      if (email !== undefined) {
        setClause.push(`email = $${paramIndex++}`);
        values.push(email);
      }
      if (priority !== undefined) {
        setClause.push(`priority = $${paramIndex++}`);
        values.push(priority);
      }

      if (setClause.length === 0) {
        throw new Error('没有提供更新数据');
      }

      setClause.push(`update_time = CURRENT_TIMESTAMP`);
      values.push(userId);

      const result = await query(
        `UPDATE tb_user SET ${setClause.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return null;
      }

      logger.info('用户更新成功:', { userId });
      return result.rows[0];
    } catch (error) {
      logger.error('更新用户失败:', { userId, updateData, error: error.message });
      throw error;
    }
  }

  /**
   * 删除用户
   * @param {string} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(userId) {
    try {
      const result = await query(
        'DELETE FROM tb_user WHERE user_id = $1',
        [userId]
      );
      
      const deleted = result.rowCount > 0;
      if (deleted) {
        logger.info('用户删除成功:', { userId });
      }
      return deleted;
    } catch (error) {
      logger.error('删除用户失败:', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取所有用户（分页）
   * @param {number} page - 页码（从1开始）
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} 分页用户列表
   */
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // 获取总数
      const countResult = await query('SELECT COUNT(*) FROM tb_user');
      const total = parseInt(countResult.rows[0].count);
      
      // 获取分页数据
      const result = await query(
        `SELECT * FROM tb_user 
         ORDER BY create_time DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取用户列表失败:', { page, limit, error: error.message });
      throw error;
    }
  }

  /**
   * 确保用户存在（如果不存在则创建）
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 用户信息
   */
  static async upsert(userData) {
    try {
      const { user_id } = userData;
      
      // 先尝试查找用户
      let user = await this.findByUserId(user_id);
      
      if (!user) {
        // 用户不存在，创建新用户
        user = await this.create(userData);
        logger.info('新用户已创建:', { user_id });
      } else {
        logger.info('用户已存在:', { user_id });
      }
      
      return user;
    } catch (error) {
      logger.error('用户upsert操作失败:', { userData, error: error.message });
      throw error;
    }
  }
}

export default User; 