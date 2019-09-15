// Deps
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

var port = process.env.PORT || 3000;

let playerBoard = {};

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

    // Send tone to everyone
    socket.on('broadcast tone', (props) => {
        console.log('Broadcast received (freq: ' + props.noteFreq + ', from id: + ' + socket.id + ')');

        io.emit('play tone', {
            for: 'everyone',
            noteFreq: props.noteFreq,
            author: socket.id
        });
    });

    // Get new username
    socket.on('change username', (username) => {
        playerBoard[socket.id]['name'] = username;
    });

    // Setup user
    playerBoard[socket.id] = { name: 'anonymous' };

    socket.on('disconnect', () => {
        console.log(socket.id + " has disconnected.");
        delete playerBoard[socket.id];
    });
});

setInterval(() => {
    let players = Object.keys(io.sockets.sockets);
    io.emit('update playerboard', playerBoard);
}, 1000);