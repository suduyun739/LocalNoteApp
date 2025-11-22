const express = require('express');
const router = express.Router();
const { Note } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// 所有笔记路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/notes/stats
 * 获取笔记统计信息
 * 注意：此路由必须在 /:id 之前，否则 stats 会被当作 id 处理
 */
router.get('/stats', async (req, res) => {
    try {
        const total = await Note.count({ where: { userId: req.userId } });
        const book = await Note.count({ where: { userId: req.userId, type: 'book' } });
        const movie = await Note.count({ where: { userId: req.userId, type: 'movie' } });
        const daily = await Note.count({ where: { userId: req.userId, type: 'daily' } });

        res.json({
            success: true,
            data: {
                total,
                book,
                movie,
                daily
            }
        });
    } catch (error) {
        console.error('获取统计信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * POST /api/notes/import
 * 导入笔记
 * 注意：此路由必须在 /:id 之前
 */
router.post('/import', async (req, res) => {
    try {
        const { notes } = req.body;

        if (!Array.isArray(notes) || notes.length === 0) {
            return res.status(400).json({
                success: false,
                message: '导入数据格式错误'
            });
        }

        // 逐个创建笔记以避免 ID 冲突，跳过已存在的
        let successCount = 0;
        let skipCount = 0;

        for (const noteData of notes) {
            try {
                // 移除旧的 id，让系统自动生成新的
                const { id, ...noteWithoutId } = noteData;

                await Note.create({
                    ...noteWithoutId,
                    userId: req.userId,
                    createdAt: noteData.createdAt || Date.now(),
                    updatedAt: noteData.updatedAt || Date.now()
                });
                successCount++;
            } catch (error) {
                // 跳过失败的笔记
                skipCount++;
                console.warn('导入单条笔记失败:', error.message);
            }
        }

        res.json({
            success: true,
            message: `成功导入 ${successCount} 条笔记${skipCount > 0 ? `，跳过 ${skipCount} 条` : ''}`
        });
    } catch (error) {
        console.error('导入笔记错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * GET /api/notes
 * 获取笔记列表
 * Query: type, search, page, limit
 */
router.get('/', async (req, res) => {
    try {
        const { type, search, page = 1, limit = 100 } = req.query;
        const offset = (page - 1) * limit;

        // 构建查询条件
        const where = { userId: req.userId };

        if (type && type !== 'all') {
            where.type = type;
        }

        if (search) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { content: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const notes = await Note.findAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // 直接返回笔记数组，与前端 api.js 期望的格式一致
        res.json(notes);
    } catch (error) {
        console.error('获取笔记列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * GET /api/notes/:id
 * 获取单个笔记
 */
router.get('/:id', async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: '笔记不存在'
            });
        }

        res.json({
            success: true,
            data: { note }
        });
    } catch (error) {
        console.error('获取笔记错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * POST /api/notes
 * 创建笔记
 */
router.post('/', async (req, res) => {
    try {
        const { type, title, content, rating, tags } = req.body;

        if (!type || !title) {
            return res.status(400).json({
                success: false,
                message: '类型和标题不能为空'
            });
        }

        const note = await Note.create({
            userId: req.userId,
            type,
            title,
            content: content || '',
            rating: rating || null,
            tags: tags || []
        });

        // 直接返回笔记对象
        res.status(201).json(note);
    } catch (error) {
        console.error('创建笔记错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * PUT /api/notes/:id
 * 更新笔记
 */
router.put('/:id', async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: '笔记不存在'
            });
        }

        const { type, title, content, rating, tags } = req.body;

        await note.update({
            type: type !== undefined ? type : note.type,
            title: title !== undefined ? title : note.title,
            content: content !== undefined ? content : note.content,
            rating: rating !== undefined ? rating : note.rating,
            tags: tags !== undefined ? tags : note.tags
        });

        // 直接返回笔记对象
        res.json(note);
    } catch (error) {
        console.error('更新笔记错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * DELETE /api/notes/:id
 * 删除笔记
 */
router.delete('/:id', async (req, res) => {
    try {
        const note = await Note.findOne({
            where: {
                id: req.params.id,
                userId: req.userId
            }
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: '笔记不存在'
            });
        }

        await note.destroy();

        res.json({
            success: true,
            message: '笔记删除成功'
        });
    } catch (error) {
        console.error('删除笔记错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;
