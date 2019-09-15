var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext({
  latencyHint: 'interactive',
  sampleRate: 44100,
});

let socket = io();

let noteFreq = 440;
let gNoteVol = 0.5;

// Create frequency table
let freqTable = [];
function createFreqTable(baseFrequency, size) {
    for(i = 0; i < size; i++) {
        freqTable.push(baseFrequency * Math.pow(2, (i - 9)/12));
    }
}
createFreqTable(440.0, 25);

let noteTypeElem = document.querySelector('#note-type-list');
let volumeElem = document.querySelector('#volume-knob');

// Set new username
document.querySelector('#set-username').addEventListener('click', function() {
    let username = document.getElementById('user').value;

    socket.emit('change username', username);
});

// Update playboard
socket.on('update playerboard', (playerBoard) => {
    // Reset list
    document.querySelector('#player-board').innerHTML = '';
    for(const [key, value] of Object.entries(playerBoard)) {
        var node = document.createElement('li');
        var textnode = document.createTextNode(value.name);
        node.appendChild(textnode);

        if(value.isPlaying)
            node.style.color = value.color;
        else    
            node.style.color = '#000000';

        document.getElementById('player-board').appendChild(node);
    }
});

// Play tone
socket.on('play tone', (props) => {
    console.log("Receveing tone. Frequency: " + props.noteFreq + ', author: ' + props.author);
    let osc = new SoundSynth(audioCtx);
    adsr_t = [0.1, 0.2, 0.2, 0.2]; // in seconds
    adsr_a = [0.5, 0.4, 0.4, 0.0]; // [0 ~1];
    osc.play(props.noteFreq, props.noteType, adsr_t, adsr_a, props.noteVol);
});

// Set keyboard
var keyboard = document.getElementById('keyboard');
keyboard.addEventListener('change', (e) => {
    if(e.note[0]) { // note[0] == 1 -> noteOn
        console.log("Note-On:"+e.note[1]); 
        var thisNoteIdx = e.note[1];

        socket.emit('broadcast tone', {
            noteFreq: freqTable[thisNoteIdx],
            noteType: noteTypeElem.value,
            noteVol: gNoteVol,
        });
    }
	else
		console.log("Note-Off:"+e.note[1]);
});

var volKnob = document.getElementById('volume-knob');
volKnob.addEventListener('change', (e) => {
    let volume = e.target.value;
    gNoteVol = (volume / 100.0);
});