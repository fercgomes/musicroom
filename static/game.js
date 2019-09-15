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
    console.log(this.value);
});

document.querySelector("#play-tone").addEventListener('click', () => {
    console.log("Broadcasting (from client) tone.");
    //playTone();
    socket.emit('broadcast tone', { noteFreq: noteFreq });
});

socket.on('update playerboard', (props) => {
    // Reset list
    document.querySelector('#player-board').innerHTML = '';
    for(const player of props.players) {
        var node = document.createElement('li');
        var textnode = document.createTextNode(player);
        node.appendChild(textnode);
        document.getElementById('player-board').appendChild(node);
    }
});

socket.on('play tone', (props) => {
    console.log("Playing tone " + props.noteFreq + ' | author: ' + props.author);
    playTone(props.noteFreq);
});