import { StatusCodes } from 'http-status-codes';

/**
 * 健康检查
 */
export const healthCheck = (req, res) => {
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString()
  });
}; 