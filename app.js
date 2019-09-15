// Deps
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

var port = process.env.PORT || 3000;

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

    socket.on('broadcast tone', (props) => {
        console.log('Broadcast received (freq: ' + props.noteFreq + ')');
        io.emit('play tone', { for: 'everyone', noteFreq: props.noteFreq });
    });

});