require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');
const { User, Note, DailyPlan } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());

// CORS 配置
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8080', 'http://localhost:3000'];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// 压缩响应
app.use(compression());

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求频率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 最多 100 个请求
    message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/plans', require('./routes/plans'));

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? '服务器错误'
            : err.message
    });
});

// 数据库连接和服务器启动
async function startServer() {
    try {
        // 测试数据库连接
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');

        // 同步数据库（生产环境请使用迁移）
        await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('✅ 数据库同步完成');

        // 启动服务器
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ 服务器运行在端口 ${PORT}`);
            console.log(`   环境: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('收到 SIGINT 信号，正在关闭服务器...');
    await sequelize.close();
    process.exit(0);
});

startServer();
