import React,{useEffect,useMemo,useRef,useState} from 'react';
import {FlatList,Image,PanResponder,Platform,ScrollView,StyleSheet,TextInput,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Sheet} from '@/components/Sheet';
import {Slider} from '@/components/Slider';
import {Text} from '@/components/Text';
import {Touchable} from '@/components/Touchable';
import {useTheme} from '@/theme';
import {OrbitMRI} from '@/native/OrbitMRI';
import {chestXrayCases} from '@simulator/instruments/radiology/chestXrayCases';
import {Action,Card,Copy,ui} from './SimulatorUi';
import {MRI_REFERENCE_LABELS,XRAY_REFERENCE_LABELS} from './radiologyAnnotations';
import {ImageCallouts} from './ImageCallouts';
import {fittedImage,sourcePoint,type Annotation} from './annotationGeometry';
const normal:Annotation[]=[
 ['Trachea',.49,.17],['Right lung',.30,.43],['Left lung',.67,.40],['Heart border',.63,.64],['Right hemidiaphragm',.30,.78],
].map(([name,x,y],i)=>({id:'normal-'+i,name:String(name),x:Number(x),y:Number(y),note:'Approximate surface landmark on this normal reference. Image positioning can change appearances.',provenance:'reference' as const}));
const axes={axial:[0,1,2],coronal:[0,2,1],sagittal:[1,2,0]} as const;
const dimensions=[112,128,112],spacing=[2.2857142857142856,1.5836143679916859,2.2857142857142856];
export function NativeRadiology(){
 const {colors}=useTheme();
 const [mode,setMode]=useState<'xray'|'mri'>('xray'),[index,setIndex]=useState(0),[plane,setPlane]=useState<keyof typeof axes>('axial'),[slice,setSlice]=useState(56);
 const [zoom,setZoom]=useState(1),[contrast,setContrast]=useState(1),[labels,setLabels]=useState(true),[mark,setMark]=useState(false),[choose,setChoose]=useState(false),[query,setQuery]=useState('');
 const [size,setSize]=useState({width:360,height:520}),[imageAspect,setImageAspect]=useState(1),[pan,setPan]=useState({x:0,y:0});
 const [personal,setPersonal]=useState<Annotation[]>([]),[selected,setSelected]=useState<Annotation|null>(null),[draft,setDraft]=useState<{x:number;y:number}|null>(null),[name,setName]=useState('');
 const current=chestXrayCases[index],key=mode==='mri'?`mri:${plane}:${slice}`:`xray:${current.id}`;
 const storageKey='orbit-radiology-labels-v1:'+key;
 const margin=labels?86:0,[u,v,s]=axes[plane];
 const aspect=mode==='mri'?dimensions[u]*spacing[u]/(dimensions[v]*spacing[v]):imageAspect;
 const rect=fittedImage(size.width,size.height,aspect,margin,zoom,pan.x,pan.y);
 const refs=mode==='mri'?(MRI_REFERENCE_LABELS[plane+':'+slice]||[]):current.id==='normal'?normal:(XRAY_REFERENCE_LABELS[current.id]||[]);
 const allLabels=[...refs,...personal];
 const sideCount=Math.max(allLabels.filter(p=>p.x<.5).length,allLabels.filter(p=>p.x>=.5).length);
 const stageHeight=Math.max(260,Math.min(720,(size.width-2*margin)/aspect*(mode==='mri'?1.3:1)+32),Math.min(720,(sideCount+1)*54));
 const state=useRef({rect,mark,pan,key});
 state.current={rect,mark,pan,key};
 const gestureStart=useRef({x:0,y:0});
 const responder=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>true,
  onMoveShouldSetPanResponder:()=>true,
  onPanResponderGrant:()=>{gestureStart.current=state.current.pan;},
  onPanResponderMove:(_,g)=>{if(!state.current.mark)setPan({x:gestureStart.current.x+g.dx,y:gestureStart.current.y+g.dy});},
  onPanResponderRelease:(e,g)=>{if(state.current.mark&&Math.hypot(g.dx,g.dy)<8){const p=sourcePoint(state.current.rect,e.nativeEvent.locationX,e.nativeEvent.locationY);if(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1){setDraft(p);setName('');}}},
 }),[]);
 useEffect(()=>{let live=true;setPersonal([]);void AsyncStorage.getItem(storageKey).then(raw=>{if(!live||!raw)return;try{const items=JSON.parse(raw);if(Array.isArray(items))setPersonal(items.filter(p=>p.provenance==='personal'&&typeof p.name==='string'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1).slice(0,16));}catch{/* Bad local data does not affect reference images. */}});return()=>{live=false;};},[storageKey]);
 const reset=(nextMode:typeof mode=mode)=>{setZoom(nextMode==='mri'?1.3:1);setPan({x:0,y:0});setContrast(1);setDraft(null);setSelected(null);};
 const saveLabel=()=>{if(!draft||!name.trim())return;const items=[...personal,{...draft,id:String(Date.now()),name:name.trim().slice(0,80),note:'Personal study label. Not an expert-verified anatomical annotation.',provenance:'personal' as const}].slice(-16);setPersonal(items);void AsyncStorage.setItem(storageKey,JSON.stringify(items));setDraft(null);setMark(false);};
 const uri=Platform.OS==='android'?'asset:/simulator/'+current.image.replace('/clinical-reference/',''):'/native-simulator/'+current.image.replace('/clinical-reference/','');
 useEffect(()=>{let live=true;Image.getSize(uri,(width,height)=>{if(live&&width>0&&height>0)setImageAspect(width/height);},()=>undefined);return()=>{live=false;};},[uri]);
 return <ScrollView contentContainerStyle={ui.page}>
  <View style={ui.row}><Action label="Chest X-ray" selected={mode==='xray'} onPress={()=>{setMode('xray');reset('xray');}}/><Action label="Brain MRI" selected={mode==='mri'} onPress={()=>{setMode('mri');reset('mri');}}/></View>
  <Copy muted>Acquired teaching reference · independent of the simulated patient.</Copy>
  {mode==='xray'?<><Card title={current.title}><Copy>{current.context}</Copy><Action label="Choose X-ray case" onPress={()=>setChoose(true)}/></Card><View style={ui.row}><Action label="Previous film" disabled={index===0} onPress={()=>{setIndex(index-1);reset();}}/><Copy>{index+1} / {chestXrayCases.length}</Copy><Action label="Next film" disabled={index===chestXrayCases.length-1} onPress={()=>{setIndex(index+1);reset();}}/></View></>:<><View style={ui.row}>{Object.keys(axes).map(p=><Action key={p} label={p} selected={plane===p} onPress={()=>{setPlane(p as keyof typeof axes);setSlice(Math.floor(dimensions[axes[p as keyof typeof axes][2]]/2));reset();}}/>)}</View><Slider label="MRI slice" min={0} max={dimensions[s]-1} step={1} value={slice} onChange={setSlice} format={n=>`${n+1} / ${dimensions[s]}`}/><View style={ui.row}><Action label="Reviewed axial landmarks" onPress={()=>{setPlane('axial');setSlice(64);reset();}}/><Action label="Reviewed coronal landmarks" onPress={()=>{setPlane('coronal');setSlice(64);reset();}}/><Action label="Reviewed sagittal landmarks" onPress={()=>{setPlane('sagittal');setSlice(56);reset();}}/></View><Slider label="MRI contrast" min={.4} max={2.5} step={.1} value={contrast} format={n=>n.toFixed(1)+'×'} onChange={setContrast}/></>}
  <View style={ui.row}><Action label={labels?'Hide labels':'Show labels'} onPress={()=>setLabels(!labels)}/><Action label={mark?'Tap image to mark':'Add study label'} selected={mark} onPress={()=>{setLabels(true);setMark(!mark);}}/><Action label="Reset view" onPress={reset}/></View>
  <View testID="radiology-image-stage" style={[styles.stage,{height:stageHeight}]} onLayout={e=>setSize({width:e.nativeEvent.layout.width,height:e.nativeEvent.layout.height})}>
   <View {...responder.panHandlers} style={StyleSheet.absoluteFill}><View pointerEvents="none" style={{position:'absolute',left:margin,right:margin,top:0,bottom:0,overflow:'hidden'}}>
    {mode==='xray'?<Image accessibilityLabel={current.alt} source={{uri}} resizeMode="stretch" style={{position:'absolute',left:rect.x-margin,top:rect.y,width:rect.width,height:rect.height}} onLoad={e=>{const img=e.nativeEvent.source;if(img?.width&&img?.height)setImageAspect(img.width/img.height);}}/>:<OrbitMRI accessibilityLabel={`T1 ${plane}, slice ${slice+1}; radiological orientation`} plane={plane} slice={slice} contrast={contrast} zoom={zoom} style={{position:'absolute',left:pan.x,right:-pan.x,top:pan.y,bottom:-pan.y}}/>}
   </View></View>
   {labels&&<ImageCallouts items={allLabels} rect={rect} width={size.width} height={size.height} margin={margin} onSelect={setSelected}/>}
   {(mode==='mri'&&plane!=='sagittal')||(mode==='xray'&&current.orientation)?<View pointerEvents="none" style={[styles.orientation,{left:margin+4,right:margin+4}]}><Text style={{color:'#ced4da'}}>R</Text><Text style={{color:'#ced4da'}}>L</Text></View>:null}
  </View>
  <Slider label="Image zoom" min={1} max={3} step={.1} value={zoom} format={n=>n.toFixed(1)+'×'} onChange={setZoom}/>
  {selected&&<Card title={selected.name}><Copy>{selected.note}</Copy>{selected.provenance==='personal'&&<Action label="Delete this study label" onPress={()=>{const next=personal.filter(p=>p.id!==selected.id);setPersonal(next);void AsyncStorage.setItem(storageKey,JSON.stringify(next));setSelected(null);}}/>}</Card>}
  {mode==='xray'?<><Card title="Identify the findings">{current.findings.map(f=><Copy key={f}>{f}</Copy>)}<Copy>{current.pitfall}</Copy><Copy>{current.differential}</Copy></Card><Copy muted>{current.author} · {current.license} · {current.source}</Copy></>:<><Copy muted>Source-specific teaching labels appear on reviewed slices. Personal labels are saved for this exact plane and slice. Individual gyri and lesions are not inferred from this low-resolution reference.</Copy><Copy muted>OpenNeuro ds000114 · Gorgolewski and colleagues · CC0. Resampled research T1 volume; not a diagnostic scan.</Copy></>}
  <Sheet visible={!!draft} onClose={()=>setDraft(null)} title="Name your study marker"><Copy muted>Personal study annotation on this exact image/slice.</Copy><TextInput accessibilityLabel="Study label name" value={name} onChangeText={setName} maxLength={80} placeholder="Structure name" placeholderTextColor={colors.textMuted} style={[styles.input,{color:colors.text,borderColor:colors.border}]}/><Action label="Save study label" disabled={!name.trim()} onPress={saveLabel}/></Sheet>
  <Sheet visible={choose} onClose={()=>setChoose(false)} title="Chest X-ray cases" scrollable={false}>
   <TextInput accessibilityLabel="Search X-ray cases" placeholder="Pneumothorax, pleural effusion…" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} style={[styles.input,{color:colors.text,borderColor:colors.border}]}/>
   <FlatList style={{maxHeight:420}} data={chestXrayCases.filter(c=>`${c.title} ${c.tags}`.toLowerCase().includes(query.toLowerCase()))} keyExtractor={c=>c.id} initialNumToRender={10} renderItem={({item})=><Touchable label={'Open '+item.title} onPress={()=>{setIndex(chestXrayCases.indexOf(item));setChoose(false);reset();}} style={styles.case}><Copy>{item.title}</Copy><Copy muted>{item.category}</Copy></Touchable>}/>
  </Sheet>
 </ScrollView>;
}
const styles=StyleSheet.create({stage:{backgroundColor:'#050a12',overflow:'hidden',borderRadius:16,marginHorizontal:-12},orientation:{position:'absolute',left:90,right:90,top:12,flexDirection:'row',justifyContent:'space-between'},input:{minHeight:44,borderWidth:1,borderRadius:12,padding:12,marginVertical:12},case:{minHeight:60,paddingVertical:12,gap:4}});
