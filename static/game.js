var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext({
  latencyHint: 'interactive',
  sampleRate: 44100,
});

let socket = io();

function playTone(freq) {
    let osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

const freqControl = document.querySelector("#frequency");
let noteFreq = 440;

freqControl.addEventListener('input', function() {
    noteFreq = this.value;
});

let noteTypeElem = document.querySelector('#note-type-list');

document.querySelector("#play-tone").addEventListener('click', () => {
    console.log("Broadcasting tone.");

    socket.emit('broadcast tone', {
        noteFreq: noteFreq,
        noteType: noteTypeElem.value,
    });
});

document.querySelector('#set-username').addEventListener('click', function() {
    let username = document.getElementById('user').value;

    socket.emit('change username', username);
});

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

socket.on('play tone', (props) => {
    console.log("Receveing tone. Frequency: " + props.noteFreq + ', author: ' + props.author);
    let osc = new SoundSynth(audioCtx);
    osc.init(props.noteFreq, 'sine');
    adsr_t = [0.1, 0.2, 0.2, 0.5]; // in seconds
    adsr_a = [0.5, 0.4, 0.4, 0.0]; // [0 ~1];
    osc.play(props.noteFreq, props.noteType, adsr_t, adsr_a);
});