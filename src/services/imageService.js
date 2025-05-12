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
   * @param {number} [params.width=1024] - 图像宽度
   * @param {number} [params.height=1024] - 图像高度
   * @param {number} [params.steps=30] - 生成步数
   * @returns {Promise<string>} 生成的图像URL
   */
  async generateImage(params) {
    try {
      const { prompt, model = "stabilityai/stable-diffusion-xl-base-1.0", width = 1024, height = 1024, steps = 30 } = params;
      
      if (!prompt) {
        throw new ApiError(StatusCodes.BAD_REQUEST, '缺少必要的图像描述');
      }

      logger.info(`开始生成图像，提示: ${prompt.substring(0, 50)}...`);
      
      const requestData = {
        model,
        prompt,
        width,
        height,
        steps,
        // 根据together.ai的API需求添加其他参数
      };

      const response = await this.apiClient.post('/inference', requestData);
      
      // 根据together.ai实际API响应格式调整
      if (!response.data.output || !response.data.output.image_url) {
        throw new ApiError(StatusCodes.BAD_GATEWAY, 'Together.ai返回无效响应');
      }

      logger.info('图像生成成功');
      return response.data.output.image_url;
    } catch (error) {
      logger.error(`图像生成失败: ${error.message}`);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // API调用错误处理
      if (error.response) {
        const statusCode = error.response.status;
        const message = error.response.data?.error || '调用Together.ai API失败';
        throw new ApiError(statusCode, message);
      }
      
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, '图像生成服务异常');
    }
  }
}

export default new ImageService(); 