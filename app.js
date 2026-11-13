// Deps
const express = require('express');
const http = require('http');
const https = require('https');
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

// Pendo server-side Track Events
// The integration key is read from the environment and must never be committed.
const PENDO_DATA_HOST = process.env.PENDO_DATA_HOST || 'data.pendo.io';
const PENDO_TRACK_EVENT_SECRET = process.env.PENDO_TRACK_EVENT_SECRET;
// There are no accounts in Music Room, so every event uses the "system" account.
const PENDO_ACCOUNT_ID = 'system';

function pendoTrack(event, visitorId, properties) {
    if (!PENDO_TRACK_EVENT_SECRET) {
        return;
    }
    try {
        const body = JSON.stringify({
            type: 'track',
            event: event,
            visitorId: visitorId || 'system',
            accountId: PENDO_ACCOUNT_ID,
            timestamp: Date.now(),
            properties: properties || {}
        });
        const req = https.request({
            hostname: PENDO_DATA_HOST,
            path: '/data/track',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'x-pendo-integration-key': PENDO_TRACK_EVENT_SECRET
            }
        }, (res) => {
            if (res.statusCode >= 400) {
                console.error('Pendo track "' + event + '" failed with status ' + res.statusCode);
            }
            res.resume();
        });
        req.on('error', (err) => {
            console.error('Pendo track "' + event + '" failed: ' + err.message);
        });
        req.write(body);
        req.end();
    } catch (err) {
        // Tracking failures must never break the room
        console.error('Pendo track "' + event + '" failed: ' + err.message);
    }
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
    // Session stats for Pendo Track Events
    let connectedAt = Date.now();
    let notesPlayed = 0;

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

        notesPlayed++;

        // Pendo: the note was sent to every connected player
        pendoTrack('Note broadcast to room', socket.id, {
            note_freq: Number(props.noteFreq),
            note_type: String(props.noteType),
            note_vol: Number(props.noteVol),
            author_is_anonymous: playerBoard[socket.id].name === 'anonymous',
            listener_count: Object.keys(playerBoard).length
        });
    });

    // Get new username
    socket.on('change username', (username) => {
        let previousName = playerBoard[socket.id]['name'];
        playerBoard[socket.id]['name'] = username;

        // Pendo: the new name is stored for this session (only when it changes)
        if (previousName !== username) {
            pendoTrack('Player name updated', socket.id, {
                was_anonymous: previousName === 'anonymous',
                is_anonymous: username === 'anonymous',
                is_empty: !username,
                name_length: username ? String(username).length : 0
            });
        }
    });

    // Setup user
    playerBoard[socket.id] = {
        name: 'anonymous',
        color: getRandomColor(),
        isPlayingTimer: 0,
        isPlaying: false
    };

    // Pendo: a visitor joined the room as "anonymous" with a random color
    pendoTrack('Player joined room', socket.id, {
        player_color: playerBoard[socket.id].color,
        player_count: Object.keys(playerBoard).length
    });

    socket.on('disconnect', (reason) => {
        console.log(socket.id + " has disconnected.");
        let wasAnonymous = playerBoard[socket.id] ? playerBoard[socket.id].name === 'anonymous' : true;
        delete playerBoard[socket.id];

        // Pendo: the visitor left and their entry was removed from the player list
        pendoTrack('Player left room', socket.id, {
            session_duration_ms: Date.now() - connectedAt,
            notes_played: notesPlayed,
            was_anonymous: wasAnonymous,
            disconnect_reason: String(reason || 'unknown'),
            player_count: Object.keys(playerBoard).length
        });
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