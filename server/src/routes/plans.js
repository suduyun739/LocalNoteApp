const express = require('express');
const router = express.Router();
const { DailyPlan } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// 所有计划路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/plans
 * 获取所有计划
 */
router.get('/', async (req, res) => {
    try {
        const plans = await DailyPlan.findAll({
            where: { userId: req.userId },
            order: [['date', 'DESC'], ['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            data: { plans }
        });
    } catch (error) {
        console.error('获取计划列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * GET /api/plans/:date
 * 获取指定日期的计划
 */
router.get('/:date', async (req, res) => {
    try {
        const plans = await DailyPlan.findAll({
            where: {
                userId: req.userId,
                date: req.params.date
            },
            order: [['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            data: { plans }
        });
    } catch (error) {
        console.error('获取日期计划错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * POST /api/plans
 * 创建任务
 */
router.post('/', async (req, res) => {
    try {
        const { id, date, text, completed } = req.body;

        if (!id || !date || !text) {
            return res.status(400).json({
                success: false,
                message: 'ID、日期和内容不能为空'
            });
        }

        const plan = await DailyPlan.create({
            id,
            userId: req.userId,
            date,
            text,
            completed: completed || false,
            createdAt: Date.now()
        });

        res.status(201).json({
            success: true,
            message: '任务创建成功',
            data: { plan }
        });
    } catch (error) {
        console.error('创建任务错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * PUT /api/plans/:id
 * 更新任务
 */
router.put('/:id', async (req, res) => {
    try {
        const plan = await DailyPlan.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: '任务不存在'
            });
        }

        const { text, completed } = req.body;

        await plan.update({
            text: text !== undefined ? text : plan.text,
            completed: completed !== undefined ? completed : plan.completed
        });

        res.json({
            success: true,
            message: '任务更新成功',
            data: { plan }
        });
    } catch (error) {
        console.error('更新任务错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * DELETE /api/plans/:id
 * 删除任务
 */
router.delete('/:id', async (req, res) => {
    try {
        const plan = await DailyPlan.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: '任务不存在'
            });
        }

        await plan.destroy();

        res.json({
            success: true,
            message: '任务删除成功'
        });
    } catch (error) {
        console.error('删除任务错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * DELETE /api/plans/date/:date
 * 删除指定日期的所有任务
 */
router.delete('/date/:date', async (req, res) => {
    try {
        const deleted = await DailyPlan.destroy({
            where: {
                userId: req.userId,
                date: req.params.date
            }
        });

        res.json({
            success: true,
            message: `成功删除 ${deleted} 个任务`
        });
    } catch (error) {
        console.error('删除日期任务错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;
