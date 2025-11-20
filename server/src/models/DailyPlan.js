const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyPlan = sequelize.define('DailyPlan', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    text: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'created_at'
    }
}, {
    tableName: 'daily_plans',
    timestamps: false,
    indexes: [
        {
            fields: ['user_id', 'date']
        }
    ]
});

module.exports = DailyPlan;
