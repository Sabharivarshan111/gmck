import React, { useId } from 'react';

export type Activation = 'rest' | 'atria' | 'delay' | 'ventricles' | 'plateau' | 'recovery';
interface Props { activation?: Activation; progress?: number; labels?: boolean; territory?: 'inferior' | 'anterior' | 'lateral'; mitralOpen?: boolean; aorticOpen?: boolean; }

/** Original vector cutaway. Examiner-facing: anatomical right is screen left.
 * Colour encodes the teaching circuit; it is not the actual colour of blood.
 * Electrical highlighting is a schematic sequence, not a patient-specific map. */
export function EcgHeartModel({ activation = 'rest', progress = 0, labels = true, territory, mitralOpen, aorticOpen }: Props) {
  const id = useId().replace(/:/g, '');
  const url = (name: string) => `url(#${id}-${name})`;
  const atrial = activation === 'atria';
  const ventricular = activation === 'ventricles';
  const recovery = activation === 'recovery';
  const conducting = atrial || ventricular;
  const line = conducting ? '#fff3a8' : '#a5b8c6';
  return <svg className="ecg-heart-model" viewBox="0 0 400 400" role="img" aria-label={`Heart cutaway: ${activation}; right heart on the left of the image`} data-activation={activation}>
    <defs>
      <radialGradient id={`${id}-muscle`} cx="35%" cy="25%" r="80%"><stop stopColor="#f88991"/><stop offset=".4" stopColor="#b9314f"/><stop offset="1" stopColor="#4b173b"/></radialGradient>
      <radialGradient id={`${id}-right`} cx="30%" cy="20%" r="90%"><stop stopColor="#5eaccb"/><stop offset=".5" stopColor="#235578"/><stop offset="1" stopColor="#102339"/></radialGradient>
      <radialGradient id={`${id}-left`} cx="30%" cy="15%" r="90%"><stop stopColor="#e87985"/><stop offset=".55" stopColor="#7e2446"/><stop offset="1" stopColor="#30152e"/></radialGradient>
      <linearGradient id={`${id}-aorta`} x2="1" y2="1"><stop stopColor="#f98e91"/><stop offset=".5" stopColor="#c5415d"/><stop offset="1" stopColor="#73203d"/></linearGradient>
      <linearGradient id={`${id}-vein`} x2="1" y2="0"><stop stopColor="#183e60"/><stop offset=".5" stopColor="#62a9c1"/><stop offset="1" stopColor="#235276"/></linearGradient>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dy="8" stdDeviation="9" floodColor="#000" floodOpacity=".25"/></filter>
      <marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#9bd7ee"/></marker>
    </defs>
    <ellipse cx="213" cy="365" rx="103" ry="13" fill="#000" opacity=".12"/>
    <g filter={url('shadow')}>
      {/* Great vessels remain continuous with the chambers. */}
      <path d="M113 142L105 59Q117 50 129 58L136 140M129 262L120 325Q109 331 99 324L103 259" fill={url('vein')} stroke="#8cc9dd" strokeWidth="1.5"/>
      <path d="M207 196L192 111Q179 75 155 89L140 96L127 73Q180 38 207 78L229 179" fill={url('vein')} stroke="#81bdd4" strokeWidth="1.5"/>
      <path d="M216 205L213 97Q210 51 246 48Q290 46 306 89L285 101Q274 69 251 76Q240 81 242 103L247 203" fill={url('aorta')} stroke="#efb0b1" strokeWidth="2"/>
      <path d="M240 54L238 28M263 54L270 27M281 64L296 40" stroke="#c95169" strokeWidth="14"/>
      <path d="M265 148L329 127M273 168L340 157" stroke="#b85572" strokeWidth="14"/>
      {/* Myocardial cut surface and atria. */}
      <path d="M145 173Q160 140 207 146Q247 121 292 161Q333 214 316 268Q294 332 232 355Q160 334 116 291Q79 245 93 203Q109 177 145 173Z" fill={url('muscle')} stroke="#f3a4b2" strokeWidth="2"/>
      <path d="M100 137Q118 113 151 121Q181 132 178 177L168 203Q141 215 111 200Q80 181 100 137Z" fill={url('right')} stroke="#81c0d8" strokeWidth="3"/>
      <path d="M228 133Q248 112 275 124Q305 140 292 179L281 202L228 191Q213 158 228 133Z" fill={url('left')} stroke="#f2a0b0" strokeWidth="3"/>
      {/* RV crescent and thick-walled LV, separated by intact septum. */}
      <path d="M114 220Q141 211 174 219Q181 262 202 294L224 333Q171 318 133 286Q107 259 114 220Z" fill={url('right')} stroke="#6cbbd6" strokeWidth="2"/>
      <path d="M222 218Q251 205 285 214Q304 254 275 293Q251 322 236 326Q219 302 214 273Q208 247 222 218Z" fill={url('left')} stroke="#f2a0b0" strokeWidth="2"/>
      <path d="M189 207Q184 264 230 340" stroke="#e27991" strokeWidth="12" fill="none" strokeLinecap="round"/>
      {/* Papillary muscles and chordae. */}
      <path d="M135 281L143 265L149 284M249 290L250 272L258 289M269 269L278 252L280 272" fill="#ae506c" stroke="#e999aa"/>
      <path d="M131 215L144 266L159 216M232 209L250 273L260 209M260 209L277 252L284 208" stroke="#efcbd3" strokeWidth="1.2" fill="none" opacity=".7"/>
      {/* AV leaflets: meaningful open versus closed states, no scaling of organ. */}
      <path d={mitralOpen ? 'M222 207L242 226M285 205L262 225' : 'M222 207L253 214L285 205'} stroke="#ffdab5" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M112 213L145 222L173 214" stroke="#e4d6bd" strokeWidth="3" fill="none"/>
      {aorticOpen !== undefined && <path d={aorticOpen ? 'M219 186L222 171M241 185L238 171' : 'M219 182Q230 192 241 182'} stroke="#ffdab5" strokeWidth="3" fill="none"/>}
    </g>
    {/* Activation envelopes are separate from blood-flow colour. */}
    {atrial && <g fill="#ffe889" opacity={.18 + progress * .2}><path d="M100 137Q118 113 151 121Q181 132 178 177L168 203Q141 215 111 200Q80 181 100 137Z"/><path d="M228 133Q248 112 275 124Q305 140 292 179L281 202L228 191Q213 158 228 133Z"/></g>}
    {(ventricular || activation === 'plateau' || recovery) && <path d="M112 220Q140 210 174 220L224 332Q251 338 280 305Q311 268 289 216" fill="none" stroke={recovery ? '#bf99ff' : '#ffe889'} strokeWidth="10" opacity={recovery ? .6 * (1 - progress) : .45}/>}
    {territory && <path d={territory === 'inferior' ? 'M147 306Q189 346 233 351Q270 333 291 309' : territory === 'anterior' ? 'M190 211Q183 263 231 341M257 219Q284 259 256 304' : 'M299 202Q331 259 289 309'} fill="none" stroke="#ffc15b" strokeWidth="13" opacity=".9" strokeLinecap="round"/>}
    <g fill="none" stroke={line} strokeLinecap="round" strokeLinejoin="round">
      <path d="M115 143Q136 144 159 172L184 192M115 143Q158 109 227 146L244 162" strokeWidth="2.5" opacity={atrial ? 1 : .32}/>
      <path d="M184 192L193 219L202 253L231 319M196 228L165 252L141 270M202 252L230 270L254 283M231 319Q268 310 283 271M231 319Q194 302 164 281" strokeWidth="3" opacity={ventricular ? 1 : .45}/>
      <path d="M142 270L128 252M142 270L145 285M164 281L158 294M254 283L270 287M254 283L252 302M283 271L290 252M230 270L237 250" strokeWidth="1.6" opacity={ventricular ? 1 : .35}/>
    </g>
    <circle cx="115" cy="143" r="6" fill={atrial ? '#fff5b3' : '#d7c785'} stroke="#fff6d7" strokeWidth="2"/>
    <circle cx="184" cy="192" r={activation === 'delay' ? 7 : 5} fill={activation === 'delay' ? '#fff5b3' : '#d7c785'} stroke="#fff6d7" strokeWidth="2"/>
    {conducting && <circle cx={atrial ? 115 + 69 * progress : 193 + 38 * progress} cy={atrial ? 143 + 49 * progress : 219 + 100 * progress} r="5" fill="#fff9cb"/>}
    {labels && <g fontFamily="inherit" fontSize="12" fill="currentColor">
      <g fill="none" stroke="currentColor" opacity=".45" strokeWidth="1"><path d="M24 140H75L108 145M30 200H66L124 174M29 291H78L144 256M314 197H375M270 257L334 280H378M254 84L316 76H378M185 192L173 98H26"/></g>
      <text x="18" y="132">SA node</text><text x="18" y="191">Right atrium</text><text x="18" y="310">Right ventricle</text>
      <text x="382" y="190" textAnchor="end">Left atrium</text><text x="382" y="298" textAnchor="end">Left ventricle</text><text x="382" y="69" textAnchor="end">Aorta</text><text x="18" y="89">AV node</text>
      <text x="203" y="377" textAnchor="middle" opacity=".65">Examiner-facing cutaway · schematic</text>
    </g>}
  </svg>;
}
