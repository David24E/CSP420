require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const socket = require('socket.io');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = socket(server);
const port = process.env.PORT || 8000;

let hostRoom = { roomName: '', roomComms: '', roomType: '' };
const users = {};
const rooms = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

if (process.env.PROD) {
    app.use(express.static(path.join(_dirname, './client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(_dirname, './client/build/index.html'));
    });
}

const socketToRoom = {};

io.on('connection', socket => {
    socket.emit('your id', socket.id);

    socket.on("join room", (payload, callback) => {
        if (users[payload.roomID]) {
            const length = users[payload.roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }

            if (users[payload.roomID].some(user => { return (user.nickname === payload.nickname) })) {
                callback(false);
            } else {
                users[payload.roomID].push({ id: socket.id, nickname: payload.nickname });
            }
        } else {
            users[payload.roomID] = [{ id: socket.id, nickname: payload.nickname }];
        }

        callback(true);
        socket.nickname = payload.nickname;

        socketToRoom[socket.id] = payload.roomID;
        const usersInThisRoom = users[payload.roomID].filter(user => user.id !== socket.id);

        socket.emit("all users", usersInThisRoom);
        socket.emit("all users in room", users[payload.roomID]);


        console.log('all-users join room down ');
        console.dir(users);
        console.log('all-rooms join room down ');
        console.dir(rooms);
    });

    socket.on("sending signal", payload => {
        /* console.log('sending signal' + users[payload.roomID]);
        console.dir(users[payload.roomID]); */

        socket.emit("all users in room", users[payload.roomID]);
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID, callerNickname: payload.callerNickname });
    });

    socket.on("returning signal", payload => {
        /* console.log('returning signal' + users[payload.roomID]);
        console.dir(users[payload.roomID]); */

        socket.emit("all users in room", users[payload.roomID]);
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('send message', body => {
        io.emit('message', body)
    })

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }

        console.log('all-users disconnect down ');
        console.dir(users[roomID]);
        console.log('all-rooms disconnect down ');
        console.dir(rooms);
        console.log('socketToRoom disconnect down ');
        console.dir(socketToRoom);

        socket.broadcast.emit('user left', socket.id);
        socket.emit("all users in room", users[roomID]);
    });

});

app.post('/', (req, res) => {
    const { roomID, roomName, roomComms, roomType } = req.body;
    hostRoom = { roomName, roomComms, roomType };

    if (rooms[roomID] != null) {
        return res.redirect('/');
    }

    rooms[roomID] = { users: {}, roomName, roomComms, roomType }

    console.dir(rooms);
    console.log('rooms up, users down');
    console.dir(users);

    res.send(`POST request received.`);
})

app.get('/room/:roomID', (req, res) => {
    const { roomID } = req.params;
    const { roomName, roomComms, roomType } = rooms[roomID];

    console.log(`GET /room/${roomID}`);
    console.dir(roomName);
    console.log('roomName up, roomType down');
    console.dir(roomType);

    res.json({roomName, roomComms, roomType});
})

server.listen(port, () => console.log(`server runnning on port ${port}`));