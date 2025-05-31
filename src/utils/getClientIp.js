import logger from './logger.js';

/**
 * 安全获取客户端真实IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} 客户端IP地址
 */
export const getClientIp = (req) => {
  // Express在设置trust proxy后，req.ip会自动处理X-Forwarded-For
  let clientIp = req.ip;
  
  // 如果req.ip不可用，尝试其他方法
  if (!clientIp || clientIp === '::1' || clientIp === '127.0.0.1') {
    // 尝试从X-Forwarded-For头获取
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For可能包含多个IP，取第一个
      clientIp = forwardedFor.split(',')[0].trim();
    } else {
      // 尝试从其他常见头获取
      clientIp = req.headers['x-real-ip'] ||
                 req.headers['x-client-ip'] ||
                 req.connection?.remoteAddress ||
                 req.socket?.remoteAddress ||
                 (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
                 '127.0.0.1';
    }
  }
  
  // 处理IPv6本地地址
  if (clientIp === '::1') {
    clientIp = '127.0.0.1';
  }
  
  // 处理IPv4映射的IPv6地址 (::ffff:192.168.1.1 -> 192.168.1.1)
  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  
  // 验证IP格式
  if (!isValidIp(clientIp)) {
    logger.warn(`获取到无效IP地址: ${clientIp}, 使用默认值`);
    clientIp = '127.0.0.1';
  }
  
  return clientIp;
};

/**
 * 验证IP地址格式
 * @param {string} ip - IP地址
 * @returns {boolean} 是否为有效IP
 */
const isValidIp = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4正则
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6正则（简化版）
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Regex.test(ip)) {
    // 验证IPv4各段范围
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
};

/**
 * 获取IP地址的地理位置信息（可选，用于日志）
 * @param {string} ip - IP地址
 * @returns {string} IP位置描述
 */
export const getIpLocation = (ip) => {
  if (!ip) return 'Unknown';
  
  // 私有IP地址检测
  if (isPrivateIp(ip)) {
    return 'Private Network';
  }
  
  // 本地地址
  if (ip === '127.0.0.1' || ip === '::1') {
    return 'Localhost';
  }
  
  return 'Public Network';
};

/**
 * 检测是否为私有IP地址
 * @param {string} ip - IP地址
 * @returns {boolean} 是否为私有IP
 */
const isPrivateIp = (ip) => {
  if (!ip) return false;
  
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // 169.254.0.0/16 (链路本地)
    /^fc00:/,                   // IPv6 私有范围
    /^fe80:/                    // IPv6 链路本地
  ];
  
  return privateRanges.some(range => range.test(ip));
};

export default getClientIp; 