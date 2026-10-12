import type { PatientPathologyState } from '../../types';
export type EyeSide = 'right' | 'left';
export type EyeFinding = 'case' | 'normal' | 'iii' | 'iii_spared' | 'iv' | 'vi' | 'rapd' | 'horner' | 'v1' | 'vii';
export type FaceAction = 'rest' | 'brows' | 'close' | 'smile' | 'mouth';
export interface EyeExamInput {
  finding: EyeFinding; affected: EyeSide; gaze: { x: number; y: number };
  light: 'none' | EyeSide | 'both'; cotton: EyeSide | null; liftLids: boolean; action: FaceAction;
}
export interface EyeResponse { pupil: number; x: number; y: number; lid: number; blink: number; ptosis: number; brow: number; smile: number }
export interface EyeExamResponse { right: EyeResponse; left: EyeResponse; mouth: number; lightDrive: number }
export const EYE_FINDINGS: { id: EyeFinding; label: string; note: string }[] = [
  { id:'case', label:'Current patient case', note:'Pupil sizes and reactivity come from the selected case; eye movements are not assigned a palsy automatically.' },
  { id:'normal', label:'Normal examination', note:'Both eyes track the target. Light in either eye constricts both pupils.' },
  { id:'iii', label:'CN III palsy · pupil involved', note:'The affected eye rests down and out, with ptosis and a poorly reactive enlarged pupil. Lift the lid to inspect the eye.' },
  { id:'iii_spared', label:'CN III palsy · pupil spared', note:'Ptosis and impaired eye movements occur with preserved light responses. Third-nerve palsy does not always involve the pupil.' },
  { id:'iv', label:'CN IV palsy', note:'The affected eye has difficulty depressing in adduction. Move the target down and toward the nose.' },
  { id:'vi', label:'CN VI palsy', note:'The affected eye cannot abduct normally. Move the target toward that eye’s temple.' },
  { id:'rapd', label:'Relative afferent defect · CN II', note:'Swing light from the unaffected eye to the affected eye: both pupils relatively dilate as the afferent light signal weakens.' },
  { id:'horner', label:'Horner pattern', note:'A smaller pupil and mild ptosis are shown. The light response remains present; anisocoria is greater with the light off.' },
  { id:'v1', label:'Corneal afferent loss · V1', note:'Cotton touching the affected cornea evokes neither blink; touching the other cornea evokes both.' },
  { id:'vii', label:'Peripheral facial weakness · VII', note:'The affected eyelid cannot close normally. Brow raising and smiling are also reduced on that side.' },
];
const clamp = (n:number, min:number, max:number) => Math.min(max, Math.max(min,n));
export function resolveEyeExam(input: EyeExamInput, pathology: Pick<PatientPathologyState,'pupilLeft'|'pupilRight'|'pupilReactLeft'|'pupilReactRight'>): EyeExamResponse {
  const afferent = (side:EyeSide) => input.finding==='rapd' && side===input.affected ? .15 : 1;
  const illuminated = (side:EyeSide) => input.light===side || input.light==='both';
  const drive = Math.max(illuminated('right') ? afferent('right') : 0, illuminated('left') ? afferent('left') : 0);
  const cornealSignal = !!input.cotton && !(input.finding==='v1' && input.cotton===input.affected);
  const eye = (side:EyeSide): EyeResponse => {
    const affected = side===input.affected;
    const outward = side==='right' ? -1 : 1;
    let pupil = input.finding==='case' ? (side==='right' ? pathology.pupilRight : pathology.pupilLeft) : 4;
    let reactive = input.finding==='case' ? (side==='right' ? pathology.pupilReactRight : pathology.pupilReactLeft) : true;
    let ptosis = 0, x=clamp(input.gaze.x,-1,1), y=clamp(input.gaze.y,-1,1);
    if (affected && (input.finding==='iii' || input.finding==='iii_spared')) {
      ptosis=.92; x=outward*Math.max(.65,x*outward); y=Math.max(.3,y*.5);
      if(input.finding==='iii') { pupil=6.5; reactive=false; }
    }
    if(affected && input.finding==='vi') x=outward*Math.min(-.18,x*outward);
    if(affected && input.finding==='iv') y=(x*outward<-.15 && y>.15) ? -.18 : y-.12;
    if(affected && input.finding==='horner') { pupil=2; ptosis=.22; }
    if(reactive) pupil -= (pupil-Math.min(pupil,Math.max(.5,pupil*.55)))*drive;
    const facialWeakness = affected && input.finding==='vii';
    const voluntaryClose = input.action==='close' && !facialWeakness;
    const reflexClose = cornealSignal && !facialWeakness;
    return { pupil:clamp(pupil,.5,10), x,y,
      lid:voluntaryClose || reflexClose ? 1 : input.liftLids ? 0 : ptosis,
      blink:voluntaryClose || reflexClose ? 1 : 0, ptosis:input.liftLids ? 0 : ptosis,
      brow:input.action==='brows' && !facialWeakness ? 1 : 0,
      smile:input.action==='smile' && !facialWeakness ? .8 : 0 };
  };
  return { right:eye('right'),left:eye('left'),mouth:input.action==='mouth' ? .6 : 0,lightDrive:drive };
}
