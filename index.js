require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const {getRandomSymbol, createUser, createRoom, createUserRoom, createOrUpdateRoom} = require("./utilits");
const {Room, UserRoom, User} = require("./models/model");
const {Sequelize} = require("sequelize");

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000",
            "https://tic-tac-toe-frontend-ten.vercel.app",
            "https://tic-tac-toe-frontend-4z2364r5o-asherzod1.vercel.app"
        ],
        methods: ["GET", "POST"]
    }
})

io.on('connection', (socket) => {
    console.log('User connected', socket.id)

    socket.on('login',async (data)=>{
        const user = await createUser(data.name)
        console.log("User", user)
        socket.emit('login', user)
    })

    let room = null;
    let roomObj = null
    socket.on('join_room', async ({roomId, userId}) => {
        console.log("RoomID",roomId)
        socket.join(roomId)
        room = roomId
        const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
        const userCount = clientsInRoom ? clientsInRoom.size : 0;
        console.log("User count", userCount)
        if(userCount > 2){
            socket.leave(roomId)
            socket.emit('room_full', roomId)
            return;
        }

        socket.emit('user_joined', socket.id)
        socket.emit('users_in_room', userCount)
        socket.to(roomId).emit('users_in_room', userCount)
        if(userCount === 2){
            let firstPlayer = getRandomSymbol()
            socket.emit('start_game', {youAre: firstPlayer, roomId})
            socket.to(roomId).emit('start_game', {youAre: firstPlayer === 'X' ? 'O' : 'X', roomId})
        }

        socket.on('send_selected',  async (data) => {
            console.log(data)
            await createOrUpdateRoom(data.room, data.selected, data.isXNext)
            socket.to(data.room).emit("receive_selected", {selected: data.selected, isXNext: data.isXNext})
        })

        socket.on('game_finished', async (data) => {
            const room = await Room.destroy({where:{roomId: data.room}})
            console.log("Game finished",data)
        })
        socket.on('leave_room', (data) => {
            socket.leave(data.room)
            socket.to(data.room).emit('user_left')
        })
    })

    socket.on("create_user_room", async (data) => {
        console.log("FFFFFFFf", data)
        await createUserRoom(data.user, data.room, true)
        console.log("Create user room", data)
    })

    socket.on('create_room', async (data) => {
        const newRoomId = await createRoom()
        console.log("New room", newRoomId)
        socket.emit('room_created', {canCreate: true, roomId: newRoomId})
    })

    socket.on("send_message", (data)=>{
        console.log(data)
        socket.to(data.room).emit("receive_message", {message: data.message})
    });

    socket.on("get_users_room", async (data) => {
        console.log("Get users room QQQ", data)
        const userRooms = await UserRoom.findAll({where: {userId: data.user}})
        if(userRooms?.length > 0){
            const rooms = await Room.findAll({where: {id: userRooms.map((userRoom) => userRoom.roomId)}})
            const uniqueRooms = rooms.filter((value, index, self) => {
                return self.indexOf(value) === index;
            });
            const resultData = []
            for (let i = 0; i < uniqueRooms.length; i++) {
                const usersRoom = await UserRoom.findAll({
                    where: {
                        userId: {
                            [Sequelize.Op.not]: data.user
                        },
                        roomId: uniqueRooms[i].id
                    }
                });
                console.log("Users room", usersRoom)
                if(usersRoom.length > 0){
                    const opponentUser = await User.findByPk(usersRoom[0].userId)
                    resultData.push({
                        ...uniqueRooms[i].dataValues,
                        opponentUser: opponentUser.dataValues
                    })
                }
            }
            console.log("Result data", resultData)

            // const resultData = uniqueRooms.map(async (room) => {
            //     console.log("Room", room)
            //     const usersRoom2 = await UserRoom.findAll({
            //         where: {
            //             userId: {
            //                 [Sequelize.Op.not]: data.user
            //             },
            //             roomId: room.id
            //         }
            //     });
            //     console.log("Users room 2", usersRoom2)
            //     if(usersRoom2){
            //         const opponentUser = await User.findByPk(usersRoom2[0].userId)
            //         console.log("Opponent user", opponentUser)
            //         return {
            //             ...room,
            //             opponentUser
            //         }
            //     }
            //     return room
            // })
            // console.log("Result DATA", resultData)
            // console.log("Get users rooms Array", uniqueRooms)
            socket.emit("get_users_room", resultData)
            return;
        }
        // console.log("Get users room", userRooms)
        socket.emit("get_users_room", {users: userRooms})
    })

    socket.on("join_dont_finished_game", async (data)=>{
        const roomId = data.room.roomId
        socket.join(roomId)
        const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
        const userCount = clientsInRoom ? clientsInRoom.size : 0;
        console.log("User count", userCount)
        if(userCount > 2){
            socket.leave(roomId)
            socket.emit('room_full', roomId)
            return;
        }
        socket.emit('users_in_room', userCount)
        socket.to(roomId).emit('users_in_room', userCount)
        if(userCount === 2){
            const room = await Room.findByPk(data.room.id)
            const userRooms = await UserRoom.findAll({where:{userId: data.user, roomId: data.room.id}})
            console.log("User rooms", userRooms)
            console.log("Rooom", room)
            const currentUser = userRooms.find((item)=> item.userId === data.user)
            socket.emit("start_dont_finished_game", {youAre: currentUser.isX ? 'X' : 'O'})
            socket.to(roomId).emit("start_dont_finished_game", {youAre: currentUser.isX ? 'O' : 'X'})
            socket.to(roomId).emit("receive_selected", {selected:JSON.parse(room.values), isXNext: room.xIsNext})
            socket.emit("receive_selected", {selected: JSON.parse(room.values), isXNext: room.xIsNext})
        }

        socket.on('send_selected',  async (data) => {
            await createOrUpdateRoom(data.room, data.selected, data.isXNext)
            socket.to(data.room).emit("receive_selected", {selected: data.selected, isXNext: data.isXNext, roomId:roomId})
        })

        socket.on('game_finished', async (data) => {
            const room = await Room.destroy({where:{roomId: data.room}})
            console.log("Game finished",data)
        })
    })
})

server.listen(8000, () => {
    console.log('Server is running on port 8000');
})
