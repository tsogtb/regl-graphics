// AudioProcessor.js
export class AudioProcessor {
  constructor() {
    this.context = null;
    this.analyzer = null;
    this.dataArray = null;
    this.source = null;
  }

  // Synchronous init: create AudioContext and AnalyserNode
  init() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.analyzer = this.context.createAnalyser();
    this.analyzer.fftSize = 512;
    this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
  }

  // Async microphone start (optional timeout)
  async startMic(timeout = 5000) {
    if (!this.context) this.init();

    // Resume suspended context
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    try {
      const stream = await withTimeout(
        navigator.mediaDevices.getUserMedia({ audio: true }),
        timeout
      );
      this.source = this.context.createMediaStreamSource(stream);
      this.source.connect(this.analyzer);
    } catch (err) {
      console.error("Microphone access denied or unavailable", err);
      throw err; // propagate if needed
    }
  }

  // Connect any audio element to the analyser
  connectAudioElement(audioEl) {
    if (!this.context) this.init();
    if (this.context.state === 'suspended') this.context.resume();

    const elementSource = this.context.createMediaElementSource(audioEl);
    elementSource.connect(this.analyzer);
    this.analyzer.connect(this.context.destination); // output to speakers
    this.source = elementSource;
  }

  // Get frequency data
  getFrequencyData() {
    if (!this.analyzer) return null;
    this.analyzer.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}

// Helper: timeout for any Promise
async function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
