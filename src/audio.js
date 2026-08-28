export class AudioSystem {
  constructor(enabled=true){ this.enabled=enabled; this.ctx=null; }
  setEnabled(v){ this.enabled=v; }
  ensure(){ if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); if(this.ctx.state==='suspended') this.ctx.resume(); }
  tone(freq=440,duration=.045,type='sine',gain=.035,delay=0){
    if(!this.enabled) return;
    this.ensure();
    const t=this.ctx.currentTime+delay, osc=this.ctx.createOscillator(), amp=this.ctx.createGain();
    osc.type=type; osc.frequency.setValueAtTime(freq,t); amp.gain.setValueAtTime(gain,t); amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(amp).connect(this.ctx.destination); osc.start(t); osc.stop(t+duration);
  }
  key(){ this.tone(520,.025,'sine',.018); }
  miss(){ this.tone(150,.07,'square',.025); }
  slash(gain=.026,delay=0){
    if(!this.enabled) return;
    this.ensure();
    const t=this.ctx.currentTime+delay, osc=this.ctx.createOscillator(), amp=this.ctx.createGain();
    osc.type='sawtooth'; osc.frequency.setValueAtTime(1450,t); osc.frequency.exponentialRampToValueAtTime(170,t+.11);
    amp.gain.setValueAtTime(gain,t); amp.gain.exponentialRampToValueAtTime(.0001,t+.12);
    osc.connect(amp).connect(this.ctx.destination); osc.start(t); osc.stop(t+.12);
  }
  attack(){ this.slash(); this.tone(240,.05,'triangle',.04); this.tone(560,.07,'triangle',.035,.045); }
  special(){ this.slash(.035); this.slash(.024,.055); [330,494,659,988].forEach((f,i)=>this.tone(f,.16,'sine',.045,i*.035)); }
  damage(){ this.tone(130,.15,'sawtooth',.045); }
  defeat(){ this.tone(740,.08,'triangle',.04); }
  record(){ [523,659,784,1047].forEach((f,i)=>this.tone(f,.22,'sine',.04,i*.09)); }
  badge(){ [660,880,1100].forEach((f,i)=>this.tone(f,.2,'sine',.035,i*.08)); }
}
