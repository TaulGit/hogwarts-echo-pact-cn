// One persistent player survives dialogue and menu re-renders.
export function createThemeMusic({enabled=true,volume=.25,onError=()=>{}}={}) {
  const media=document.createElement('audio');
  media.id='theme-music';media.hidden=true;media.loop=true;media.preload='metadata';
  media.crossOrigin='anonymous';media.src=new URL('./assets/audio/autiletwing-castle.mp3',import.meta.url).href;
  document.body.append(media);
  let active=false,unlocked=false,suspended=false,pending=false,stopTimer=null;
  let context=null,gain=null,target=null,errorShown=false;
  const level=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:.25));
  volume=level(volume);
  const wanted=()=>active&&enabled&&!document.hidden&&!suspended;
  function ramp(value,seconds=.45) {
    if(target===value)return;
    target=value;
    if(gain){const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(value,now+seconds);}
    else media.volume=value;
  }
  function pause(immediate=false) {
    clearTimeout(stopTimer);
    if(immediate){ramp(0,0);media.pause();return;}
    ramp(0);
    stopTimer=setTimeout(()=>{if(!wanted())media.pause();},470);
  }
  function sync() {
    if(!wanted()){pause(document.hidden||suspended);return;}
    clearTimeout(stopTimer);
    if(!unlocked)return;
    if(context?.state==='suspended')context.resume().catch(()=>{});
    if(!media.paused){ramp(volume);return;}
    if(pending)return;
    pending=true;
    // play() is called synchronously by unlock() inside the input gesture.
    const started=media.play();
    Promise.resolve(started).then(()=>{
      pending=false;
      if(wanted())ramp(volume,.7);else pause(true);
    }).catch(error=>{
      pending=false;
      if(error.name!=='NotAllowedError'&&error.name!=='AbortError'&&!errorShown){errorShown=true;onError();}
    });
  }
  function unlock() {
    unlocked=true;
    if(!context){
      try{const Audio=window.AudioContext||window.webkitAudioContext;context=new Audio();gain=context.createGain();gain.gain.value=0;context.createMediaElementSource(media).connect(gain);gain.connect(context.destination);media.volume=1;target=0;}
      catch{context=null;gain=null;media.volume=0;target=0;}
    }
    sync();
  }
  media.addEventListener('error',()=>{if(!errorShown){errorShown=true;onError();}});
  document.addEventListener('visibilitychange',()=>sync());
  window.addEventListener('pagehide',()=>{suspended=true;pause(true);});
  window.addEventListener('pageshow',()=>{suspended=false;sync();});
  return {
    unlock,
    setActive(value){if(active!==value){active=value;sync();}},
    configure(next){enabled=next.music!==false;volume=level(next.musicVolume);sync();}
  };
}
