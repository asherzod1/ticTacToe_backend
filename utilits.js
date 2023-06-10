const {User, Room, UserRoom} = require("./models/model");
const getRandomSymbol = () => {
    const symbols = ["X", "O"];
    const randomIndex = Math.floor(Math.random() * symbols.length);
    return symbols[randomIndex];
};

const createUser = async (name) =>{
    const user = await User.findOne({ where: { name } });
    if(user){
        return user
    }
    const new_user = await User.create({ name, createdAt: new Date(), updatedAt: new Date() })
    return new_user
}

const createRoom = async () =>{
    const randomIndex = Math.floor(Math.random() * 100000);
    console.log("LOADED")
    const room = await Room.findOne({ where: { roomId: randomIndex } });
    if(room){
        return createRoom()
    }
    const new_room = await Room.create({
        roomId: randomIndex,
        // createdAt: new Date(),
        // updatedAt: new Date(),
        xIsNext: true,
        values: JSON.stringify(Array(9).fill(null))
    })
    return new_room.roomId
}

const createUserRoom = async (userId, roomId, isX) =>{
    const room = await Room.findOne({ where: { roomId: parseInt(roomId) } });
    // console.log("Created room", room)
    const userRoom = await UserRoom.findOne({ where: { userId, roomId:room.id } });
    console.log("Created user room", userRoom)
    if(await userRoom){
        return;
    }
    console.log("userId", userId, "roomId", roomId)
    const new_user_room = await UserRoom.create({
        userId,
        roomId: room.id,
        isX,
        createdAt: new Date(),
        updatedAt: new Date()
    })
    return new_user_room
}

const editUserRoom = async (userId, roomId, isX) =>{
    const userRoom = await UserRoom.findOne({ where: { userId, roomId } });
    if(userRoom){
        userRoom.isX = isX
        await userRoom.save()
        return userRoom
    }
    return null
}

const createOrUpdateRoom = async (roomId, values, xIsNext) =>{
    const room = await Room.findOne({ where: { roomId: parseInt(roomId) } });
    if(room){
        room.values = JSON.stringify(values)
        room.xIsNext = xIsNext
        await room.save()
        return room
    }
}

module.exports = {
    getRandomSymbol,
    createUser,
    createRoom,
    createUserRoom,
    editUserRoom,
    createOrUpdateRoom
}
