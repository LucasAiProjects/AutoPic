import { StatusCodes } from 'http-status-codes';
import imageService from '../services/imageService.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorHandler.js';

/**
 * 图像生成控制器
 */
export const generateImage = async (req, res, next) => {
  try {
    const { prompt, model, width, height, steps } = req.body;

    // 参数验证
    if (!prompt) {
      throw new ApiError(StatusCodes.BAD_REQUEST, '必须提供图像描述(prompt)');
    }

    logger.info('接收到图像生成请求');
    
    // 调用服务生成图像
    const imageUrls = await imageService.generateImage({
      prompt,
      model,
      width,
      height,
      steps
    });

    // 返回结果 - 数组格式
    return res.status(StatusCodes.OK).json({
      success: true,
      data: imageUrls
    });
  } catch (error) {
    next(error);
  }
}; 