// Deps
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const { Client } = require('pg');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const BinaryServer = require('binaryjs').BinaryServer;
const binaryserver = new BinaryServer({server: server, path: '/binary-endpoint'})

var port = process.env.PORT || 3000;

let playerBoard = {};

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

app.use('/static', express.static(__dirname + '/static')); // routing
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
server.listen(port, () => {
    console.log('Starting server on port ' + port);
});

// Add websocket handlers
io.on('connection', function(socket) {
    let user_id = socket.id;
    console.log(user_id + " has connected.");
    
    let timer = 100;
    // Send tone to everyone
    socket.on('broadcast tone', (props) => {
        console.log('Broadcast received (freq: ' + props.noteFreq + ', from id: + ' + socket.id + ')');

        let user = socket.id;
        playerBoard[user].isPlaying = true;
        playerBoard[user].isPlayingTimer = timer;

        io.emit('play tone', {
            for: 'everyone',
            noteFreq: props.noteFreq,
            noteType: props.noteType,
            noteVol: props.noteVol,
            author: playerBoard[socket.id].name
        });
    });

    // Get new username
    socket.on('change username', (username) => {
        playerBoard[socket.id]['name'] = username;
    });

    // Setup user
    playerBoard[socket.id] = {
        name: 'anonymous',
        color: getRandomColor(),
        isPlayingTimer: 0,
        isPlaying: false
    };

    socket.on('disconnect', () => {
        console.log(socket.id + " has disconnected.");
        delete playerBoard[socket.id];
    });
});

// Refresh playerboard
refreshRate = 5;
setInterval(() => {
    // Update isPlaying
    for(const [key, value] of Object.entries(playerBoard)) {
        if(value.isPlayingTimer == 0) {
            value.isPlaying = false;
        }
        if(value.isPlayingTimer > 0) {
            value.isPlayingTimer--;
        }
    }
}, refreshRate);

// Update playerboard
setInterval(() => {
    let players = Object.keys(io.sockets.sockets);
    io.emit('update playerboard', playerBoard);
}, 500);