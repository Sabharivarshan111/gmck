import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Slider } from '@/components/Slider';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import Radiology from '@/native/NativeOrbitRadiology';
import { chestXrayCases, type ChestXrayCase } from '@simulator/instruments/radiology/chestXrayCases';
import meta from '../../../public/clinical-reference/radiology/brain-t1.json';

type Plane = 'axial' | 'coronal' | 'sagittal';
type Frame = { uri: string; width: number; height: number };
type Point = [number, number];
const AXES: Record<Plane, [number, number, number]> = { axial: [0,1,2], coronal: [0,2,1], sagittal: [1,2,0] };
const categories = ['All', ...new Set(chestXrayCases.map(c => c.category))];
const landmarks: Array<[string,number,number]> = [['Trachea',49,17],['Right lung',30,43],['Left lung',67,40],['Heart border',63,64],['Right hemidiaphragm',30,78]];

/** Actual native Image/SVG/gesture controls; no hosted renderer or network needed. */
export default function NativeRadiologyViewer({ onBack, theme = 'dark' }: { onBack: () => void; theme?: 'dark' | 'light' }) {
  const insets = useSafeAreaInsets();
  const palette = useMemo(() => (theme==='light'?{bg:'#f7f7fa',card:'#fff',ink:'#202027',border:'#d5d3dd'}:{bg:'#131019',card:'#19161d',ink:'#f6effa',border:'#38313d'}),[theme]);
  const styles=useMemo(() => makeStyles(palette),[palette]);
  const { width, height } = useWindowDimensions();
  const [mode,setMode] = useState<'xray'|'mri'>('xray');
  const [selected,setSelected] = useState(chestXrayCases[0]);
  const [query,setQuery] = useState(''), [category,setCategory] = useState('All');
  const [picker,setPicker] = useState(false), [filters,setFilters] = useState(false);
  const [notes,setNotes] = useState(true), [similar,setSimilar] = useState(false), [credits,setCredits] = useState(false);
  const [plane,setPlane] = useState<Plane>('axial');
  const [pos,setPos] = useState(meta.dimensions.map(n => Math.floor(n/2)));
  const [contrast,setContrast] = useState(1), [brightness,setBrightness] = useState(1), [zoom,setZoom] = useState(1);
  const [labels,setLabels] = useState(true), [moving,setMoving] = useState(false), [measuring,setMeasuring] = useState(false);
  const [points,setPoints] = useState<Point[]>([]), [pan,setPan] = useState<Point>([0,0]);
  const [full,setFull] = useState(false), [frame,setFrame] = useState<Frame|null>(null);
  const [error,setError] = useState(''), [loading,setLoading] = useState(false), [retry,setRetry] = useState(0);
  const drag = useRef<[number,number,number,number]|null>(null);
  const generation = useRef(0);
  const [u,v,slice] = AXES[plane];
  const slicePosition = pos[slice];
  const filtered = chestXrayCases.filter(c => (category==='All'||c.category===category) && `${c.title} ${c.category} ${c.tags}`.toLowerCase().includes(query.trim().toLowerCase()));
  const index = filtered.findIndex(c => c.id===selected.id);
  const dimensions = mode==='mri' ? [meta.dimensions[u]*meta.spacing[u],meta.dimensions[v]*meta.spacing[v]] : frame ? [frame.width,frame.height] : null;
  const aspect = dimensions ? dimensions[0]/dimensions[1] : 1;
  const distance = points.length===2 && dimensions ? Math.hypot((points[1][0]-points[0][0])*dimensions[0],(points[1][1]-points[0][1])*dimensions[1]) : null;

  useEffect(() => {
    const id = ++generation.current;
    let cancelled = false;
    setLoading(true); setError(''); setFrame(null);
    // Debounce raster requests during adjustments. Only the current request may paint.
    const timer = setTimeout(() => {
      if (!Radiology) { setError('The native radiology renderer is unavailable in this build.'); setLoading(false); return; }
      const task = mode==='mri' ? Radiology.renderMri(plane,slicePosition,contrast,brightness) : Radiology.renderXray(selected.image.replace(/^\//,''),contrast,brightness);
      task.then(json => {
        if (cancelled || generation.current!==id) return;
        const next = JSON.parse(json) as Frame;
        if (!next.uri.startsWith('data:image/png;base64,') || !(next.width>0 && next.height>0)) throw Error('Invalid image response');
        setFrame(next); setLoading(false);
      }).catch(e => { if (!cancelled && generation.current===id) { setError(String(e.message||e)); setLoading(false); } });
    },80);
    return () => { clearTimeout(timer); cancelled=true; };
  },[mode,plane,slicePosition,selected.image,contrast,brightness,retry]);

  const reset = () => { setZoom(1); setPan([0,0]); setContrast(1); setBrightness(1); setPoints([]); drag.current=null; };
  const choose = (c: ChestXrayCase) => { setSelected(c); setPicker(false); setError(''); reset(); };
  const switchMode = (next: 'xray'|'mri') => { setMode(next); setMoving(false); setMeasuring(false); reset(); };
  const button = (label: string, onPress: () => void, active=false, disabled=false) => <Touchable key={label} label={label} onPress={onPress} disabled={disabled} state={{selected:active,disabled}} style={[styles.button,{backgroundColor:active?'#e879f9':palette.card,opacity:disabled?.4:1}]}><Text style={[styles.ink,{color:active?'#24102a':palette.ink}]}>{label}</Text></Touchable>;
  const link = (label: string, uri: string) => button(label,() => { void Linking.openURL(uri).catch(() => setError('Unable to open this link.')); });

  const stage = (fullscreen: boolean) => {
    const availableWidth = width-32;
    const availableHeight = fullscreen ? height-insets.top-insets.bottom-110 : 440;
    const fw = Math.min(availableWidth,availableHeight*aspect), fh=fw/aspect;
    return <View style={[styles.stage,{height:availableHeight}]}
      accessibilityLabel="Radiology image stage"
      onStartShouldSetResponder={() => moving}
      onMoveShouldSetResponder={() => moving}
      onResponderGrant={e => { drag.current=[e.nativeEvent.pageX,e.nativeEvent.pageY,...pan]; }}
      onResponderMove={e => { if (drag.current) { const [x,y,px,py]=drag.current;setPan([px+e.nativeEvent.pageX-x,py+e.nativeEvent.pageY-y]); } }}
      onResponderRelease={() => { drag.current=null; }} onResponderTerminate={() => { drag.current=null; }}>
      {frame && <View style={{width:fw,height:fh,transform:[{translateX:pan[0]},{translateY:pan[1]},{scale:zoom}]}}
        onStartShouldSetResponder={() => !moving && (measuring||mode==='mri')}
        onResponderRelease={e => {
          const x=e.nativeEvent.locationX/fw, y=e.nativeEvent.locationY/fh;
          if (x<0||x>1||y<0||y>1) return;
          if (measuring) setPoints(p => p.length===1 ? [p[0],[x,y]] : [[x,y]]);
          else if (mode==='mri') setPos(p => { const n=[...p];n[u]=Math.round((1-x)*(meta.dimensions[u]-1));n[v]=Math.round((1-y)*(meta.dimensions[v]-1));return n; });
        }}>
        <Image pointerEvents="none" source={{uri:frame.uri}} accessibilityLabel={mode==='xray'?selected.alt:`${plane} MRI slice ${slicePosition+1}`} style={{width:fw,height:fh}} resizeMode="stretch" />
        {mode==='xray' && selected.id==='normal' && labels && landmarks.map(([label,x,y]) => <Text pointerEvents="none" key={label} style={[styles.landmark,{left:`${x}%`,top:`${y}%`}]}>{label}</Text>)}
        <Svg pointerEvents="none" width={fw} height={fh} style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
          {mode==='mri' && labels && <><Line x1={(1-pos[u]/(meta.dimensions[u]-1))*100} x2={(1-pos[u]/(meta.dimensions[u]-1))*100} y1={0} y2={100} stroke="#e879f9" strokeWidth={.3}/><Line x1={0} x2={100} y1={(1-pos[v]/(meta.dimensions[v]-1))*100} y2={(1-pos[v]/(meta.dimensions[v]-1))*100} stroke="#e879f9" strokeWidth={.3}/></>}
          {points.map(([x,y],i) => <Circle key={i} cx={x*100} cy={y*100} r={1} fill="#facc15"/>)}
          {points.length===2 && <Line x1={points[0][0]*100} y1={points[0][1]*100} x2={points[1][0]*100} y2={points[1][1]*100} stroke="#facc15" strokeWidth={.5}/>}
        </Svg>
      </View>}
      {loading && <ActivityIndicator color="#e879f9" style={StyleSheet.absoluteFill}/>}
      <Text pointerEvents="none" style={styles.orientationTop}>{mode==='xray'?selected.projection:plane==='axial'?'A':'S'}</Text>
      {(mode==='mri'||selected.orientation) && <><Text pointerEvents="none" style={styles.orientationLeft}>{mode==='mri'&&plane==='sagittal'?'A':'R'}</Text><Text pointerEvents="none" style={styles.orientationRight}>{mode==='mri'&&plane==='sagittal'?'P':'L'}</Text></>}
    </View>;
  };

  return <View style={[styles.screen,{paddingTop:insets.top,paddingBottom:insets.bottom}]}>
    <View style={styles.header}><View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1}}><View style={{width:10,height:10,borderRadius:5,backgroundColor:'#06b6d4'}}/><Text style={{color:'#e879f9',fontWeight:'700',fontSize:14}}>X-ray & MRI</Text></View><Touchable label="Back to clinical studio" onPress={onBack} style={{minHeight:44,minWidth:44,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#94a3b8',fontSize:23}}>×</Text></Touchable></View>
    <KeyboardSafe>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:32,gap:14}} keyboardShouldPersistTaps="handled">
      <View style={styles.tabs}><View style={{flex:1}}>{button('Chest X-ray',() => switchMode('xray'),mode==='xray')}</View><View style={{flex:1}}>{button('Brain MRI',() => switchMode('mri'),mode==='mri')}</View></View>
      <Text style={styles.muted}>Real acquired teaching images · independent of the simulated patient.</Text>
      {mode==='xray' && <View style={styles.card}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:'#edaff9',fontWeight:'800',fontSize:11}}>CHEST CASE LIBRARY</Text><Text style={{color:'#c6bccd',fontSize:11}}>{chestXrayCases.length} real films</Text></View>
        <Text style={{color:'#c8c1ce',fontSize:12}}>Choose a reference</Text>
        <Touchable label="Choose a reference" onPress={() => setPicker(true)} style={[styles.button,{backgroundColor:'#0f0c14',flexDirection:'row',justifyContent:'space-between'}]}><Text style={{color:'#f6effa',fontSize:14,flex:1}}>{selected.title}</Text><Text style={{color:'#f6effa'}}>⌄</Text></Touchable>
        {button('Search & categories',() => setFilters(x => !x),filters)}
        {filters && <><TextInput accessibilityLabel="Search chest X-ray cases" placeholder="Pneumothorax, pleural, TB…" placeholderTextColor="#b8b1c0" value={query} onChangeText={setQuery} style={styles.input}/><View style={styles.row}>{categories.map(c => button(c,() => setCategory(c),category===c))}</View></>}
        <View style={styles.row}>{button('← Previous',() => choose(filtered[index-1]),false,index<=0)}<Text style={{color:'#c8c1ce'}}>{!filtered.length?'No matches':index>=0?`${index+1} / ${filtered.length}`:`${filtered.length} matches`}</Text>{button('Next →',() => choose(filtered[index+1]),false,index<0||index>=filtered.length-1)}</View>
        {(query||category!=='All') && button('Show all cases',() => {setQuery('');setCategory('All');})}
        <Text style={styles.muted}>{selected.category}</Text><Text style={styles.title}>{selected.title}</Text>
      </View>}
      {mode==='mri' && <View style={styles.tabs}>{(['axial','coronal','sagittal'] as Plane[]).map(p => button(p[0].toUpperCase()+p.slice(1),() => {setPlane(p);reset();},plane===p))}</View>}
      <View style={styles.row}>{button('Move',() => {setMoving(x => !x);setMeasuring(false);},moving)}{button('Measure',() => {setMeasuring(x => !x);setMoving(false);setPoints([]);},measuring)}{(mode==='mri'||selected.id==='normal') && button(mode==='mri'?'Crosshair':'Labels',() => setLabels(x => !x),labels)}{button('Reset',reset)}{button('Full screen',() => setFull(true))}</View>
      {!full && stage(false)}
      {!!error && <View accessibilityRole="alert" style={styles.card}><Text style={{color:'#fca5a5'}}>{error}</Text>{button('Retry',() => setRetry(x => x+1))}</View>}
      {mode==='mri' && <><Text style={styles.ink}>Slice {slicePosition+1} / {meta.dimensions[slice]}</Text><Slider label="MRI slice" min={0} max={meta.dimensions[slice]-1} step={1} value={slicePosition} format={n => `Slice ${n+1}`} onChange={n => {setPos(p => {const next=[...p];next[slice]=n;return next;});setPoints([]);}}/></>}
      <View style={styles.ranges}>{[{label:'Contrast',value:contrast,set:setContrast,max:2},{label:'Brightness',value:brightness,set:setBrightness,max:1.8},{label:'Zoom',value:zoom,set:setZoom,max:3}].map(r => <View key={r.label} style={{flex:1}}><Text style={{color:palette.ink,fontSize:12}}>{r.label} <Text style={{color:'#dec3e7',fontSize:11}}>{r.value.toFixed(2)}×</Text></Text><Slider label={`Radiology ${r.label}`} min={r.label==='Zoom'?1:.5} max={r.max} step={.05} value={r.value} format={n => `${n.toFixed(2)} times`} onChange={r.set}/></View>)}</View>
      {measuring && <Text style={styles.ink}>{distance===null?'Tap two points on the image.':`${distance.toFixed(1)} ${mode==='mri'?'mm · resampled voxel spacing':'pixels · no X-ray physical calibration'}`}</Text>}
      {mode==='xray' && <View style={styles.card}><Text style={styles.title}>What to look for</Text>{button(notes?'Hide notes':'Reveal notes',() => setNotes(x => !x))}{notes && <><Text style={styles.muted}>{selected.context}</Text>{selected.findings.map(f => <Text style={{color:'#f6effa',lineHeight:21}} key={f}>• {f}</Text>)}<Text style={styles.title}>Remember</Text><Text style={{color:'#f6effa',lineHeight:21}}>{selected.pitfall}</Text>{button('Compare with similar patterns',() => setSimilar(x => !x),similar)}{similar && <Text style={{color:'#f6effa',lineHeight:21}}>{selected.differential}</Text>}</>}</View>}
      {button('Image credits and limitations',() => setCredits(x => !x),credits)}
      {credits && (mode==='xray' ? <View style={styles.card}><Text style={styles.muted}>{selected.author} · {selected.license}. ORBIT copy resized and JPEG encoded; source annotations retained. {selected.id==='normal'?'Landmark labels are approximate. ':''}Image copies remain under their listed licences. No DICOM physical calibration. Teaching references do not establish a diagnosis in the simulated patient.</Text>{link('Original image and source caption',selected.source)}{link('Image licence',selected.licenseUrl)}{link('Radiology Assistant','https://radiologyassistant.nl/chest/chest-x-ray/lung-disease')}{link('BTS pleural guidance','https://www.brit-thoracic.org.uk/clinical-resources/guidelines/pleural-disease/')}</View> : <View style={styles.card}><Text style={styles.muted}>T1 research MRI from OpenNeuro ds000114, CC0, by Gorgolewski and colleagues. Axial, coronal and sagittal cuts share the same RAS-oriented, resampled volume. This is a brain reference, not a lumbar study or a diagnostic viewer.</Text>{link('Dataset and credits',meta.doi)}</View>)}
    </ScrollView>
    </KeyboardSafe>
    <Modal visible={picker} onRequestClose={() => setPicker(false)} transparent><View style={[styles.screen,{paddingTop:insets.top,paddingBottom:insets.bottom}]}>{button('Close reference picker',() => setPicker(false))}<ScrollView contentContainerStyle={{padding:16,gap:8}}>{filtered.map(c => button(c.title,() => choose(c),c.id===selected.id))}{!filtered.length && <Text style={styles.ink}>No matches</Text>}</ScrollView></View></Modal>
    <Modal visible={full} onRequestClose={() => setFull(false)}><View style={[styles.screen,{paddingTop:insets.top,paddingBottom:insets.bottom,paddingHorizontal:16}]}>{button('Close full screen',() => setFull(false))}{full && stage(true)}</View></Modal>
  </View>;
}
const makeStyles=(palette:{bg:string;card:string;ink:string;border:string})=>StyleSheet.create({
  screen:{flex:1,backgroundColor:palette.bg}, header:{paddingHorizontal:12,flexDirection:'row',alignItems:'center',backgroundColor:palette.card,borderBottomWidth:1,borderColor:palette.border}, title:{color:'#f6effa',fontWeight:'700',fontSize:17},ink:{color:palette.ink,lineHeight:21},muted:{color:'#b8b1c0',lineHeight:21},
  tabs:{flexDirection:'row',gap:8},ranges:{flexDirection:'row',gap:12},row:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8},button:{minHeight:44,padding:10,borderRadius:10,borderWidth:1,borderColor:'#38313d',justifyContent:'center'},
  card:{backgroundColor:'#131019',padding:14,borderRadius:14,borderWidth:1,borderColor:'#38313d',gap:10},input:{minHeight:48,color:'#f6effa',borderColor:'#51405a',borderWidth:1,borderRadius:10,padding:12},
  stage:{backgroundColor:'#000',overflow:'hidden',alignItems:'center',justifyContent:'center',borderRadius:12},landmark:{position:'absolute',transform:[{translateX:-30},{translateY:-10}],backgroundColor:'#131019cc',color:'#fff',fontSize:10,padding:2},
  orientationTop:{position:'absolute',top:8,color:'#e879f9'},orientationLeft:{position:'absolute',left:8,top:'50%',color:'#e879f9'},orientationRight:{position:'absolute',right:8,top:'50%',color:'#e879f9'},
});
