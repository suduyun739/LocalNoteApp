const User = require('./User');
const Note = require('./Note');
const DailyPlan = require('./DailyPlan');

// 定义关联关系
User.hasMany(Note, { foreignKey: 'userId', onDelete: 'CASCADE' });
Note.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DailyPlan, { foreignKey: 'userId', onDelete: 'CASCADE' });
DailyPlan.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Note,
    DailyPlan
};
