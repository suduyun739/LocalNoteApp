const express = require('express');
const router = express.Router();
const { Note } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// 所有笔记路由都需要认证
router.use(authMiddleware);

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

        const { count, rows } = await Note.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                notes: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('获取笔记列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * GET /api/notes/stats
 * 获取笔记统计信息
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
        const { id, type, title, content, rating, tags } = req.body;

        if (!id || !type || !title) {
            return res.status(400).json({
                success: false,
                message: 'ID、类型和标题不能为空'
            });
        }

        const now = Date.now();

        const note = await Note.create({
            id,
            userId: req.userId,
            type,
            title,
            content: content || '',
            rating: rating || null,
            tags: tags || [],
            createdAt: now,
            updatedAt: now
        });

        res.status(201).json({
            success: true,
            message: '笔记创建成功',
            data: { note }
        });
    } catch (error) {
        console.error('创建笔记错误:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: '笔记ID已存在'
            });
        }
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
            type: type || note.type,
            title: title || note.title,
            content: content !== undefined ? content : note.content,
            rating: rating !== undefined ? rating : note.rating,
            tags: tags !== undefined ? tags : note.tags,
            updatedAt: Date.now()
        });

        res.json({
            success: true,
            message: '笔记更新成功',
            data: { note }
        });
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

/**
 * POST /api/notes/import
 * 导入笔记
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

        // 添加userId和时间戳
        const notesWithUser = notes.map(note => ({
            ...note,
            userId: req.userId,
            createdAt: note.createdAt || Date.now(),
            updatedAt: note.updatedAt || Date.now()
        }));

        await Note.bulkCreate(notesWithUser, {
            updateOnDuplicate: ['type', 'title', 'content', 'rating', 'tags', 'updatedAt']
        });

        res.json({
            success: true,
            message: `成功导入 ${notes.length} 条笔记`
        });
    } catch (error) {
        console.error('导入笔记错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;
