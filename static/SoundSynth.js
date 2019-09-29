class SoundSynth {
    constructor(context) {
        this.context = context;
        this.adsrCurve = new Float32Array(100);
    }

    init(freq, type, vol) {
        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = 0.5; // ramp

        this.gainNode2 = this.context.createGain();
        this.gainNode2.gain.value = vol; // ramp

        
        this.oscillator = this.context.createOscillator();
        this.oscillator.type = type;
        this.oscillator.frequency.value = freq;

        let dest = this.context.createMediaStreamDestination();

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.gainNode2);
        this.gainNode2.connect(this.context.destination);
    }

    play(freq, type, adsr_t, adsr_a, vol) {
        this.init(freq, type, vol);
        this.makeRamp(adsr_t, adsr_a);
        this.oscillator.start(this.context.currentTime);
    }

    stop() {
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
        this.oscillator.stop(this.context.currentTime + 0.02);
    }

    makeRamp(adsr_t, asdr_a) {
        var duration = adsr_t[0] + adsr_t[1] + adsr_t[2] + adsr_t[3];
        this.adsrCurve = new Float32Array(Math.round(duration * 100));

        var a_t = adsr_t[0]; //0.3
        var a_a = adsr_a[0]; //0.3

        var d_t = adsr_t[1]; //0.3
        var d_a = adsr_a[1]; //0.3

        var s_t = adsr_t[2]; //0.3
        var s_a = adsr_a[2]; //0.3

        var r_t = adsr_t[3]; //0.3
        var r_a = adsr_a[3]; //0.3

        var i = 0;
        var c = 0;
        var t = Math.round(a_t * 100);
        var amp_step = a_a / t;
        for (i = 0; i < t; i++) {
            this.adsrCurve[c++] = 0 + i * amp_step;
        }

        var t = Math.round(d_t * 100);
        var amp_step = (d_a - a_a) / t;
        for (i = 0; i < t; i++) {
            this.adsrCurve[c++] = a_a + i * amp_step;
        }

        var t = Math.round(s_t * 100);
        var amp_step = (s_a - d_a) / t;
        for (i = 0; i < t; i++) {
            this.adsrCurve[c++] = d_a + i * amp_step;
        }

        var t = Math.round(r_t * 100);
        var amp_step = (r_a - s_a) / t;
        for (i = 0; i < t; i++) {
            this.adsrCurve[c++] = s_a + i * amp_step;
        }

        this.adsrCurve[this.adsrCurve.length - 1] = 0;

        this.gainNode.gain.setValueCurveAtTime(this.adsrCurve, this.context.currentTime, duration);
    }
}