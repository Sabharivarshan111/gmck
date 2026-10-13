import React,{useCallback,useMemo,useState} from 'react';
import {FlatList,Modal,ScrollView,StyleSheet,TextInput,View,useWindowDimensions} from 'react-native';
import Svg,{Path,Rect,Text as SvgText} from 'react-native-svg';
import {Text} from '@/components/Text';import {Touchable} from '@/components/Touchable';import {Sheet} from '@/components/Sheet';import {Slider} from '@/components/Slider';import {useTheme} from '@/theme';import {OrbitAnatomy} from '@/native/OrbitAnatomy';
import {ORGAN_ANATOMY_DATABASE} from '@simulator/data/organAnatomyData';
import {ORGAN_CONNECTIONS,type OrganConnection} from '@simulator/data/organConnections';
import {getPreferredAnatomyIsolationTarget} from '@simulator/data/preferredAnatomyReferences';
import {ANATOMY_PARTS,ANATOMY_TARGETS,ANATOMY_REFERENCES} from './anatomyCatalog';
import {Action,Card,Copy,ui} from './SimulatorUi';
type Pick={model:string;ids:readonly string[];label:string;owner:string;connection?:OrganConnection};
const mainOrgans=['heart','lungs','liver','kidney','brain','stomach','pancreas','spleen','small_intestine','urinary_bladder'];
const owners=new Map<string,string>();
for(const owner of [...Object.keys(ORGAN_ANATOMY_DATABASE).filter(k=>!mainOrgans.includes(k)),...mainOrgans])for(const id of ANATOMY_TARGETS[owner]?.ids||[])owners.set(id,owner);
const partMap=new Map(ANATOMY_PARTS.map(p=>[p.id,p]));
const emptyPoints:Array<{id:string;x:number;y:number}>=[];
export function NativeAnatomyPanel(){
 const {colors}=useTheme();const {height}=useWindowDimensions();
 const [pick,setPick]=useState<Pick|null>(null),[region,setRegion]=useState('full'),[layer,setLayer]=useState('surface'),[details,setDetails]=useState<string|null>(null),[section,setSection]=useState('Overview');
 const [context,setContext]=useState(false),[hidden,setHidden]=useState<string[]>([]),[cut,setCut]=useState(false),[spread,setSpread]=useState(0),[camera,setCamera]=useState(0),[points,setPoints]=useState(emptyPoints),[status,setStatus]=useState('loading'),[message,setMessage]=useState('');
 const [browse,setBrowse]=useState(false),[query,setQuery]=useState(''),[diagram,setDiagram]=useState<OrganConnection|null>(null);
 const select=useCallback((owner:string,target?:string)=>{
  const key=target||getPreferredAnatomyIsolationTarget(owner)||owner,view=ANATOMY_TARGETS[key]||ANATOMY_TARGETS[owner];
  if(!view||!view.ids.length){setDetails(owner);return;}
  setPick({...view,label:ORGAN_ANATOMY_DATABASE[owner]?.name||partMap.get(key)?.name||owner,owner});setContext(false);setSpread(0);setDetails(null);setBrowse(false);setStatus('loading');
 },[]);
 const reset=()=>{setPick(null);setDetails(null);setContext(false);setSpread(0);setHidden([]);setCut(false);setStatus('loading');setCamera(v=>(Math.floor(v/10)+1)*10+5);};
 const inspect=(c:OrganConnection)=>{if(!c.targetId){setDiagram(c);return;}const view=ANATOMY_TARGETS[c.id];if(!view?.ids.length){setDiagram(c);return;}setPick({...view,label:c.label,owner:c.owner,connection:c});setDetails(null);setContext(c.kind==='relation');setSpread(0);};
 const contextIds=useMemo(()=>context&&pick?ANATOMY_TARGETS[pick.owner]?.model===pick.model?(ANATOMY_TARGETS[pick.owner]?.ids||[]).filter(id=>!pick.ids.includes(id)):[]:[],[context,pick]);
 const annotations=useMemo(()=>pick?pick.connection?.partIds.slice(0,3)||pick.ids.slice(0,1):mainOrgans.slice(0,4).map(id=>ANATOMY_TARGETS[id]?.ids.find(i=>partMap.get(i)?.model==='atlas')).filter((i):i is string=>!!i),[pick]);
 const selectedOrgan=details?ORGAN_ANATOMY_DATABASE[details]:null;
 const links=details?(ORGAN_CONNECTIONS[details]||[]).filter(c=>section==='Supply'?c.kind!=='relation':c.kind==='relation'):[];
 const browseItems=useMemo(()=>ANATOMY_PARTS.filter(p=>p.model==='atlas'&&p.name.toLowerCase().includes(query.toLowerCase())),[query]);
 const labelPositions=points.filter(p=>p.x>=0&&p.y>=80);
 return <View style={{flex:1}}>
  <View style={[styles.stage,{height:Math.max(420,height-232)}]}>
   <OrbitAnatomy testID="native-anatomy-renderer" style={StyleSheet.absoluteFill} model={pick?.model||'atlas'} visibleIds={pick?.ids.join(',')||''} contextIds={contextIds.join(',')} annotationIds={annotations.join(',')} hiddenIds={hidden.join(',')} region={region} layer={layer} spread={spread} cameraAction={camera}
    onModelStatus={e=>{setStatus(e.nativeEvent.status);setMessage(e.nativeEvent.message||'');}}
    onModelLabels={e=>setPoints(e.nativeEvent.points)}
    onModelSelection={e=>{const id=e.nativeEvent.id;if(cut){setHidden(v=>[...v,id]);return;}const owner=owners.get(id);if(owner)select(owner);else {const part=partMap.get(id);if(part)setPick({model:part.model,ids:[id],label:part.name,owner:id});}}}/>
   <View style={styles.region}><View style={ui.row}>{['full','head','thorax','abdomen'].map(r=><Action key={r} label={r[0].toUpperCase()+r.slice(1)} selected={region===r} onPress={()=>{setRegion(r);setPick(null);setContext(false);setSpread(0);}}/>)}</View></View>
   {status==='error'&&<View accessibilityRole="alert" style={styles.failure}><Copy>Offline 3D could not load: {message}</Copy><Action label="Retry offline model" onPress={reset}/></View>}
   {status==='loading'&&<View pointerEvents="none" style={styles.loading}><Text style={{color:'#cbd5e1'}}>Loading bundled anatomy…</Text></View>}
   <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
    {labelPositions.map((p,i)=>{const x=18,y=92+i*53,owner=owners.get(p.id),name=pick?.label||ORGAN_ANATOMY_DATABASE[owner||'']?.name||partMap.get(p.id)?.name||'';return <React.Fragment key={p.id}><Path d={`M ${x+25} ${y+34} V ${p.y-18} Q ${x+25} ${p.y-12} ${x+31} ${p.y-12} H ${p.x-6} Q ${p.x} ${p.y-12} ${p.x} ${p.y-6} V ${p.y}`} stroke={pick?.connection?.kind==='venous'?'#7db6ed':'#f0878d'} strokeWidth={1.4} fill="none"/><Path d={`M${p.x-4} ${p.y-7} L${p.x} ${p.y} L${p.x+4} ${p.y-7}`} stroke="#f0878d" strokeWidth={1.4} fill="none"/>{pick&&<><Rect x={x} y={y} width={210} height={34} rx={10} fill="#101e2b" stroke="#779cb5"/><SvgText x={x+10} y={y+22} fill="#e5edf6" fontSize={12}>{name.slice(0,31)}</SvgText></>}</React.Fragment>;})}
   </Svg>
   {!pick&&<View style={styles.shortcuts}>{mainOrgans.slice(0,4).map(owner=><Touchable key={owner} label={'Open '+ORGAN_ANATOMY_DATABASE[owner].name+' model'} onPress={()=>select(owner)} style={styles.organ}><Text style={{color:'#e5edf6',fontWeight:'700'}}>{owner==='kidney'?'Kidneys':owner[0].toUpperCase()+owner.slice(1)}</Text></Touchable>)}</View>}
   {pick&&<View style={[styles.selection,{backgroundColor:colors.card,borderColor:colors.border}]}><View style={{flex:1}}><Text style={{color:colors.text,fontWeight:'700'}}>{pick.label}</Text><Text style={{color:colors.textMuted,fontSize:11}}>{pick.model==='atlas'?'BodyParts3D · registered anatomy':'Separate source reference · '+pick.model}</Text></View><Action label="Details" onPress={()=>{setSection('Overview');setDetails(pick.owner);}}/><Action label="Restore" onPress={reset}/></View>}
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[ui.row,{padding:12}]}>
   <Action label="Browse" onPress={()=>setBrowse(true)}/><Action label={cut?'Scalpel on':'Scalpel'} selected={cut} onPress={()=>setCut(!cut)}/>
   <Action label="Zoom +" onPress={()=>setCamera(v=>(Math.floor(v/10)+1)*10+1)}/><Action label="Zoom −" onPress={()=>setCamera(v=>(Math.floor(v/10)+1)*10+2)}/>
   <Action label="Rotate" onPress={()=>setCamera(v=>(Math.floor(v/10)+1)*10+4)}/><Action label="Reset" onPress={reset}/>
   {pick&&<Action label={context?'Hide context':'Show context'} selected={context} onPress={()=>setContext(!context)}/>}
  </ScrollView>
  <Sheet visible={browse} onClose={()=>setBrowse(false)} title="Offline anatomy" scrollable={false}>
   <View style={ui.row}>{['surface','vessels','viscera','skeleton','nerves'].map(l=><Action key={l} label={l} selected={layer===l} onPress={()=>{setLayer(l);setPick(null);setBrowse(false);}}/>)}</View>
   <Copy muted>Spread anatomy: {Math.round(spread*100)}%</Copy><Slider label="Spread anatomy" value={spread} min={0} max={1} step={.05} format={v=>Math.round(v*100)+'%'} onChange={v=>{setPick(null);setSpread(v);}}/>
   <TextInput accessibilityLabel="Search anatomical parts" placeholder="Search 2,234 registered parts" placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} style={[styles.search,{color:colors.text,borderColor:colors.border}]}/>
   <FlatList style={{maxHeight:360}} data={browseItems} keyExtractor={p=>p.id} initialNumToRender={12} maxToRenderPerBatch={12} renderItem={({item})=><Touchable label={'View '+item.name} onPress={()=>{setPick({model:item.model,ids:[item.id],label:item.name,owner:owners.get(item.id)||item.id});setBrowse(false);}} style={styles.part}><Text style={{color:colors.text}}>{item.name}</Text><Text style={{color:colors.textMuted,fontSize:11}}>{item.system} · {item.id}</Text></Touchable>}/>
  </Sheet>
  <Sheet visible={!!details} onClose={()=>setDetails(null)} title={selectedOrgan?.name||pick?.label||'Anatomy details'}>
   <View style={ui.row}>{['Overview','Supply','Relations','Clinical','Lymph'].map(s=><Action key={s} label={s} selected={section===s} onPress={()=>setSection(s)}/>)}</View>
   {selectedOrgan&&section==='Overview'&&<><Card title="Surface anatomy"><Copy>{selectedOrgan.surfaceLandmarks}</Copy><Copy>{selectedOrgan.dimensionsAndWeight}</Copy></Card><Card title="Physiology & histology"><Copy>{selectedOrgan.histologyAndPhysiology}</Copy></Card>
    <Card title="Source reference views">{ANATOMY_REFERENCES.filter(r=>r.organ===details).map(r=><Action key={r.id+r.model} label={r.label+' · '+r.model.replace(/_/g,' ')} onPress={()=>{setPick({model:r.model,ids:r.ids,label:r.label,owner:details!});setDetails(null);setContext(false);}}/>)}</Card></>}
   {(section==='Supply'||section==='Relations')&&links.map(c=><Card key={c.id}><Text style={{color:c.kind==='arterial'?'#e77081':c.kind==='venous'?'#69a8e9':colors.text,fontWeight:'700'}}>{c.label}</Text><Copy muted>{c.direction} · {c.targetId?'Registered 3D anatomy':'Teaching schematic'}</Copy><Action label={'Inspect '+c.label} onPress={()=>inspect(c)}/><Copy>{c.note}</Copy></Card>)}
   {selectedOrgan&&section==='Supply'&&<Card title="Innervation">{Object.entries(selectedOrgan.innervation).map(([key,value])=><Copy key={key}>{key}: {value}</Copy>)}{selectedOrgan.nerveNodes?.map(n=><Card key={n.id} title={n.name}><Copy>{n.roots} · {n.origin}</Copy><Copy>{n.motorSupply} {n.sensorySupply}</Copy><Copy>{n.clinicalNote}</Copy>{ANATOMY_TARGETS[n.id]?.ids.length?<Action label={'View '+n.name} onPress={()=>select(details!,n.id)}/>:<Copy muted>No captured source mesh; course described above.</Copy>}</Card>)}</Card>}
   {selectedOrgan&&section==='Clinical'&&<><Card title="Bedside signs">{selectedOrgan.clinicalBedsideSigns.map(s=><Copy key={s}>• {s}</Copy>)}</Card><Card title="Viva & clinical correlation">{selectedOrgan.nmcMbbssVivaPearls.map(s=><Copy key={s}>• {s}</Copy>)}<Copy>{selectedOrgan.radiologicalCorrelation}</Copy><Copy>{selectedOrgan.surgicalApproaches}</Copy></Card></>}
   {selectedOrgan&&section==='Lymph'&&<Card title="Lymphatic drainage">{selectedOrgan.lymphaticDrainage.map(s=><Copy key={s}>• {s}</Copy>)}</Card>}
   {!selectedOrgan&&<Copy>{pick?.label} is a named source part. Its registered model can be rotated and inspected offline.</Copy>}
  </Sheet>
  <Sheet visible={!!diagram} onClose={()=>setDiagram(null)} title={diagram?.label}>
   <Copy muted>Teaching schematic. This relation has no captured mesh in the registered atlas.</Copy>
   <Svg viewBox="0 0 340 190" width="100%" height={190}><Rect x={18} y={65} width={125} height={64} rx={12} fill="#101e2b"/><Rect x={197} y={65} width={125} height={64} rx={12} fill="#101e2b"/><Path d="M143 97 H190 M183 90 L190 97 L183 104" fill="none" stroke="#7db6ed" strokeWidth={2}/><SvgText x={80} y={100} textAnchor="middle" fill="#e5edf6" fontSize={12}>{(ORGAN_ANATOMY_DATABASE[diagram?.owner||'']?.name||'Organ').slice(0,18)}</SvgText><SvgText x={260} y={100} textAnchor="middle" fill="#e5edf6" fontSize={12}>{diagram?.label.slice(0,19)}</SvgText><SvgText x={170} y={44} textAnchor="middle" fill="#7db6ed" fontSize={12}>{diagram?.direction}</SvgText></Svg>
   <Copy>{diagram?.note}</Copy>
  </Sheet>
  <Modal visible={false}/>
 </View>;
}
const styles=StyleSheet.create({stage:{position:'relative',backgroundColor:'#070b14',marginHorizontal:12,borderRadius:20,overflow:'hidden'},region:{position:'absolute',top:12,left:12,right:12},loading:{position:'absolute',bottom:100,left:16},failure:{position:'absolute',top:110,left:16,right:16,padding:16,backgroundColor:'#111827',borderRadius:12},shortcuts:{position:'absolute',bottom:16,left:16,right:16,flexDirection:'row',flexWrap:'wrap',gap:8},organ:{minHeight:44,padding:12,borderWidth:1,borderColor:'#475569',borderRadius:12,backgroundColor:'#101e2b'},selection:{position:'absolute',bottom:16,left:12,right:12,flexDirection:'row',alignItems:'center',gap:8,padding:12,borderWidth:1,borderRadius:16},search:{minHeight:44,borderWidth:1,borderRadius:12,padding:12,marginVertical:12},part:{minHeight:52,padding:12,gap:4}});
