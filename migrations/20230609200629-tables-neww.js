'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
    });

    await queryInterface.createTable('Rooms', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      values: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      xIsNext: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });

    await queryInterface.createTable('UserRooms', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      isX: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Rooms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserRooms');
    await queryInterface.dropTable('Rooms');
    await queryInterface.dropTable('Users');
  },
};
