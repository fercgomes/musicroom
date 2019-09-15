var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext({
  latencyHint: 'interactive',
  sampleRate: 44100,
});

let socket = io();

const freqControl = document.querySelector("#frequency");
let noteFreq = 440;

// Create frequency table
let freqTable = [];
function createFreqTable(baseFrequency, size) {
    for(i = 0; i < size; i++) {
        freqTable.push(baseFrequency * Math.pow(2, (i - 9)/12));
    }
}
createFreqTable(440.0, 25);

// Change test frequency
freqControl.addEventListener('input', function() {
    noteFreq = this.value;
});

let noteTypeElem = document.querySelector('#note-type-list');

// Play test tone
document.querySelector("#play-tone").addEventListener('click', () => {
    console.log("Broadcasting tone.");

    socket.emit('broadcast tone', {
        noteFreq: noteFreq,
        noteType: noteTypeElem.value,
    });
});

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
        document.getElementById('player-board').appendChild(node);
    }
});

// Play tone
socket.on('play tone', (props) => {
    console.log("Receveing tone. Frequency: " + props.noteFreq + ', author: ' + props.author);
    let osc = new SoundSynth(audioCtx);
    osc.init(props.noteFreq, 'sine');
    adsr_t = [0.1, 0.2, 0.2, 0.2]; // in seconds
    adsr_a = [0.5, 0.4, 0.4, 0.0]; // [0 ~1];
    osc.play(props.noteFreq, props.noteType, adsr_t, adsr_a);
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
        });
    }
	else
		console.log("Note-Off:"+e.note[1]);
});