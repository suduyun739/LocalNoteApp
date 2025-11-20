const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authMiddleware = require('../middleware/auth');

// 生成 JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 验证必填字段
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名、邮箱和密码不能为空'
            });
        }

        // 检查用户名是否已存在
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: '用户名已被使用'
            });
        }

        // 检查邮箱是否已存在
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: '邮箱已被注册'
            });
        }

        // 创建用户
        const user = await User.create({
            username,
            email,
            password
        });

        // 生成 token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证必填字段
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码不能为空'
            });
        }

        // 查找用户
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 验证密码
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 生成 token
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user.toJSON()
        }
    });
});

module.exports = router;
