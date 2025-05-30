import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

// 创建 Supabase 客户端
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

/**
 * 验证 Supabase JWT Token
 * @param {string} token - JWT token
 * @returns {Promise<Object|null>} 用户信息或null
 */
export const verifySupabaseToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
};

export default supabase; 