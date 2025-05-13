import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorHandler.js';
import { StatusCodes } from 'http-status-codes';

/**
 * Together.ai图像生成服务
 */
class ImageService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: config.together.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.together.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 生成图像
   * @param {Object} params - 生成参数
   * @param {string} params.prompt - 图像提示描述
   * @param {string} [params.model="stabilityai/stable-diffusion-xl-base-1.0"] - 模型名称
   * @param {number} [params.width=512] - 图像宽度
   * @param {number} [params.height=512] - 图像高度
   * @param {number} [params.steps=4] - 生成步数
   * @param {number} [params.n=1] - 生成图片数量
   * @returns {Promise<Array>} 生成的图像URL对象数组
   */
  async generateImage(params) {
    try {
      const { prompt, model = "stabilityai/stable-diffusion-xl-base-1.0", width = 512, height = 512, steps = 4, n = 1 } = params;
      
      if (!prompt) {
        throw new ApiError(StatusCodes.BAD_REQUEST, '缺少必要的图像描述');
      }

      logger.info(`开始生成图像，提示: ${prompt.substring(0, 50)}...，数量: ${n}`);
      
      const requestData = {
        model,
        prompt,
        width,
        height,
        steps,
        n: parseInt(n, 10),
        // 根据together.ai的API需求添加其他参数
      };

      const response = await this.apiClient.post('/v1/images/generations', requestData);
      
      // 记录API响应状态
      logger.info(`Together.ai API响应状态: ${response.status}`);
      
      // 处理API响应 - 新的响应结构
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        logger.error(`无效响应内容: ${JSON.stringify(response.data)}`);
        throw new ApiError(StatusCodes.BAD_GATEWAY, 'Together.ai返回无效响应格式');
      }

      const results = [];
      
      // 处理新的响应格式
      response.data.data.forEach(item => {
        if (item.url) {
          results.push({ url: item.url });
        }
      });

      logger.info(`成功获取${results.length}张图像`);
      return results;
    } catch (error) {
      logger.error(`图像生成失败: ${error.message}`);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // API调用错误处理
      if (error.response) {
        const statusCode = error.response.status;
        const message = error.response.data?.error || '调用Together.ai API失败';
        logger.error(`API错误详情: 状态码=${statusCode}, 响应体=${JSON.stringify(error.response.data)}`);
        throw new ApiError(statusCode, message);
      }
      
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, '图像生成服务异常');
    }
  }
}

export default new ImageService(); 