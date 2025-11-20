const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Note = sequelize.define('Note', {
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
    type: {
        type: DataTypes.ENUM('book', 'movie', 'daily'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    tags: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('tags');
            return rawValue ? rawValue.split(',') : [];
        },
        set(value) {
            if (Array.isArray(value)) {
                this.setDataValue('tags', value.join(','));
            } else {
                this.setDataValue('tags', value);
            }
        }
    },
    createdAt: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'updated_at'
    }
}, {
    tableName: 'notes',
    timestamps: false,
    indexes: [
        {
            fields: ['user_id', 'type']
        },
        {
            fields: ['created_at']
        }
    ]
});

module.exports = Note;
