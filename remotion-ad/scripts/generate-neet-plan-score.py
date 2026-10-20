import numpy as np, wave
sr=24000; duration=75; audio=np.zeros((sr*duration,2),dtype=np.float64); rng=np.random.default_rng(20261020)
def tone(at,length,freq,amp,pan=0,kind='soft'):
 n=int(length*sr);t=np.arange(n)/sr
 if kind=='pad': env=np.minimum(t/.7,1)*np.minimum((length-t)/1.5,1);x=(np.sin(2*np.pi*freq*t)+.2*np.sin(2*np.pi*2.003*freq*t))*env
 else: x=(np.sin(2*np.pi*freq*t)+.18*np.sin(2*np.pi*freq*2*t))*np.minimum(t/.015,1)*np.exp(-t*4.2)
 i=int(at*sr);n=min(n,len(audio)-i)
 if n>0: audio[i:i+n,0]+=x[:n]*amp*(1-pan*.35);audio[i:i+n,1]+=x[:n]*amp*(1+pan*.35)
chords=[[57,60,64,71],[53,57,60,64],[48,55,59,64],[55,59,62,69]]
for bar in range(25):
 chord=chords[(bar//2)%4];start=bar*3
 for note in chord: tone(start,6,440*2**((note-69)/12),.023,pan=(note%3-1)*.6,kind='pad')
 for step in range(8):
  note=chord[(step+bar)%4]+12;tone(start+step*.375,1.2,440*2**((note-69)/12),.045,pan=(-1 if step%2 else 1)*.7)
 for beat in range(4):
  at=start+beat*.75;n=int(sr*.25);t=np.arange(n)/sr;kick=np.sin(2*np.pi*(48*t+55*.025*(1-np.exp(-t/.025))))*np.exp(-t*22)*.12;i=int(at*sr);audio[i:i+n]+=kick[:,None]
  n=int(sr*.06);h=rng.normal(0,1,n)*np.exp(-np.arange(n)/sr*85)*.012;i=int((at+.375)*sr);audio[i:i+n]+=h[:,None]
fade=np.minimum(np.arange(len(audio))/sr/2,1)*np.minimum((len(audio)-np.arange(len(audio)))/sr/3,1);audio*=fade[:,None];audio=np.tanh(audio*1.3);pcm=(audio*32767).astype('<i2')
with wave.open('remotion-ad/public/audio/neet-plan/original-score.wav','wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(pcm.tobytes())
