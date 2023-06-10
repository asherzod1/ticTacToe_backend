require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const {getRandomSymbol, createUser, createRoom, createUserRoom, createOrUpdateRoom} = require("./utilits");
const {Room, UserRoom, User} = require("./models/model");

app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
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
    })

    socket.on("create_user_room", async (data) => {
        await createUserRoom(data.user, data.room, data.isX)
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
        console.log("Get users room", data)
        const userRooms = await UserRoom.findAll({where: {userId: data.user}})
        if(userRooms?.length > 0){
            const rooms = await Room.findAll({where: {id: userRooms.map((userRoom) => userRoom.roomId)}})
            const uniqueRooms = rooms.filter((value, index, self) => {
                return self.indexOf(value) === index;
            });
            console.log("Get users rooms Array", uniqueRooms)
            socket.emit("get_users_room", uniqueRooms)
            return;
        }
        console.log("Get users room", userRooms)
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

    socket.on('leave_room', (data) => {
        socket.leave(data.room)
        socket.to(data.room).emit('user_left')
    })
})

server.listen(8000, () => {
    console.log('Server is running on port 8000');
})
