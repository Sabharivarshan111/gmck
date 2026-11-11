// Render the real bank screen and run the real row answer handler. No provider call.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';
const screenSource = fs.readFileSync(new URL('../src/screens/BrowseNodeScreen.tsx', import.meta.url), 'utf8');
const rowSource = fs.readFileSync(new URL('../src/components/QuestionRow.tsx', import.meta.url), 'utf8');
const screenCode = transformSync(screenSource.replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm, '').replace('export default function BrowseNodeScreen', 'function BrowseNodeScreen'), {loader:'tsx',jsx:'transform'}).code;
const answerCode = rowSource.slice(rowSource.indexOf('  const askAnswer = useCallback('), rowSource.indexOf('  const askMcq = useCallback(')).replace('const askAnswer =', 'globalThis.answer =');
const component = name => name;
const element = (type, props, ...children) => ({type,props:{...props,children}});
function find(node, type) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === type) return node;
  for (const child of [node.props?.ListFooterComponent,...(node.props?.children??[])].flat(Infinity)) { const match=find(child,type); if(match)return match; }
  return null;
}
for (const kind of ['essay','short-notes','mcq']) for (const footer of [false,true]) {
  const question = kind === 'mcq' ? 'original-mcq' : `Describe ${kind} question`;
  let stateIndex=0;
  const hooks={useCallback:fn=>fn,useMemo:fn=>fn(),useEffect:()=>{},useLayoutEffect:()=>{},useRef:value=>({current:value}),useState:value=>[stateIndex++===0?kind:typeof value==='function'?value():value,()=>{}]};
  const sandbox={...hooks,React:{createElement:element,Fragment:'Fragment'},
    StyleSheet:{create:x=>x,hairlineWidth:1},useTheme:()=>({colors:{}}),useSafeAreaInsets:()=>({top:0}),
    useNavigation:()=>({setOptions(){},navigate(){},push(){},goBack(){},getParent(){return {navigate(){}};}}),
    useRoute:()=>({params:{year:'third-year',path:['forensic-medicine','injuries'],title:'Injuries'}}),
    useCountDone:()=>()=>0,useProfile:()=>({university:'tnmgr'}),availableBankUniversity:x=>x,
    getTopicChildren:()=>footer?[{key:'subtopic',name:'Subtopic',node:{}}]:[],resolveNode:()=>({}),
    partitionUniversityQuestions:()=>({essay:kind==='essay'?[question]:[],'short-notes':kind==='short-notes'?[question]:[],mcq:kind==='mcq'?[question]:[]}),
    findTypeQuestions:()=>[],getCleanQuestionText:x=>x,useSettings:()=>({showPageRefs:false}),usePageRefs:()=>({pages:{},refresh(){}}),
    isUniversityMcq:q=>q==='original-mcq',getSubjects:()=>[{key:'forensic-medicine',name:'Forensic Medicine'}],hasTextbook:()=>true,
    YEAR_LABEL:{'third-year':'Third Year'},SUBJECT_ICON:{},LIST_TUNING:{},typeScale:{},collectAllQuestions:()=>[question],
  };
  for(const name of ['FlatList','View','Text','Touchable','EmptyState','Muted','SegmentedControl','GradientText','ThinBar','QuestionRow','FilterField','SingleQuestionNote','PageRefSheet','UniversityMcqAnswer','BookOpen','ArrowLeft','ChevronRight','Search'])sandbox[name]=component(name);
  vm.runInNewContext(screenCode+'\nglobalThis.output=BrowseNodeScreen();',sandbox);
  const list=find(sandbox.output,'FlatList');assert.ok(list);
  const row=footer?find(list.props.ListFooterComponent,'QuestionRow'):list.props.renderItem({item:{index:0,question}});
  assert.ok(row,'Question row is rendered');
  assert.equal(typeof row.props.onNote,'function');
  assert.equal(typeof row.props.onMcqAnswer,kind==='mcq'?'function':'undefined',`${kind}, footer=${footer}: MCQ handler must not intercept handwritten notes`);
  const calls=[];
  const action={useCallback:fn=>fn,question,originalMcq:kind==='mcq',onMcqAnswer:row.props.onMcqAnswer?()=>calls.push('mcq'):undefined,onNote:()=>calls.push('note'),onAskAi:()=>calls.push('ai'),noteQuestionText:x=>x,getCleanQuestionText:x=>x,tripleTapPrompt:x=>x};
  vm.runInNewContext(answerCode,action);action.answer();
  assert.deepEqual(calls,[kind==='mcq'?'mcq':'note']);
}
console.log('PASS real bank screen + row: essays and short notes open handwritten notes; original MCQs open sourced answers, in leaf and topic-footer lists.');
