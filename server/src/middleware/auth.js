const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    try {
        // 从 Header 中获取 token
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const token = authHeader.substring(7);

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 查找用户
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 将用户信息附加到请求对象
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的令牌'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '令牌已过期'
            });
        }
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

module.exports = authMiddleware;
