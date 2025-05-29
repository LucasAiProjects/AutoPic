import { StatusCodes } from 'http-status-codes';
import imageService from '../services/imageService.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/errorHandler.js';

/**
 * 图像生成控制器 - 异步任务版本
 */
export const generateImage = async (req, res, next) => {
  try {
    const { prompt, model, width, height, steps, n } = req.body;

    // 参数验证
    if (!prompt) {
      throw new ApiError(StatusCodes.BAD_REQUEST, '必须提供图像描述(prompt)');
    }

    logger.info(`接收到图像生成请求`);
    
    // 创建异步任务，检查是否已有缓存结果
    const { taskId, cached } = await imageService.createImageTask({
      prompt,
      model,
      width,
      height,
      steps,
      n
    });

    // 返回任务ID，如果是缓存命中则提示用户
    return res.status(StatusCodes.ACCEPTED).json({
      success: true,
      taskId,
      cached: !!cached,
      message: cached 
        ? '发现相同参数的图像已生成，可直接查询结果' 
        : '图像生成任务已创建，请使用任务ID查询结果'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 根据任务ID查询图像结果
 */
export const getImageResult = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, '必须提供任务ID');
    }
    
    logger.info(`接收到图像结果查询请求，任务ID: ${taskId}`);
    
    // 查询任务结果
    const result = await imageService.getImageResult(taskId);
    
    // 根据任务状态返回不同响应
    if (result.status === 'completed') {
      return res.status(StatusCodes.OK).json({
        success: true,
        status: result.status,
        data: result.data
      });
    } else if (result.status === 'not_found') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        status: result.status,
        message: result.message
      });
    } else {
      // pending, processing 或 failed
      return res.status(StatusCodes.OK).json({
        success: true,
        status: result.status,
        message: result.message
      });
    }
  } catch (error) {
    next(error);
  }
}; 