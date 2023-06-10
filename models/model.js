const {DataTypes} = require('sequelize');
const sequelize = require('../sequelize');
const {Sequelize} = require('sequelize');
const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    {
        timestamps: false,
    }
);

const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    values: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    xIsNext: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    timestamps: false,
});

const UserRoom = sequelize.define('UserRoom', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        isX: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
    },
    {
        timestamps: false,
    });



UserRoom.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});
UserRoom.belongsTo(Room, {
    foreignKey: 'roomId',
});

module.exports = {User, UserRoom, Room};
