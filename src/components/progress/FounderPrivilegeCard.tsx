import { useState } from "react";
import { Crown, Orbit, Sparkles, ShieldCheck, Gem } from "lucide-react";

const secrets = [
  "Every universe begins with a first star. You're one of ours. ✦",
  "Hidden orbit discovered: Architect of possibilities. ✨",
  "Founder code unlocked: DREAM · BUILD · REPEAT.",
  "Secret constellation complete. Your story is part of ORBIT forever. ♛",
];

export default function FounderPrivilegeCard({ displayName }: { displayName: string }) {
  const [flipped, setFlipped] = useState(false);
  const [secret, setSecret] = useState(-1);
  const name = displayName.trim() || "ORBIT CO-FOUNDER";

  return (
    <section className="space-y-3" aria-label="Your exclusive ORBIT Co-Founder card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gem className="h-4 w-4 text-violet-500" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-bold">Your Founder Card</h4>
            <p className="text-[11px] text-muted-foreground">One of a kind. Made for you.</p>
          </div>
        </div>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-violet-700 dark:text-violet-200">✦ FOUNDERS EDITION</span>
      </div>

      <div className="mx-auto w-full max-w-[510px]" style={{ perspective: "1200px" }}>
        <button
          type="button"
          className="relative block w-full rounded-[20px] text-left outline-none focus-visible:ring-4 focus-visible:ring-violet-400/60"
          style={{ aspectRatio: "1.586 / 1" }}
          onClick={() => setFlipped((v) => !v)}
          aria-label={flipped ? "Flip your card to the front" : "Flip your founder card to find a secret"}
          aria-pressed={flipped}
        >
          <div className="absolute inset-0 rounded-[20px] transition-transform duration-700 motion-reduce:transition-none" style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
            <div className="absolute inset-0 isolate overflow-hidden rounded-[20px] border border-indigo-200/40 bg-[linear-gradient(125deg,#07152d,#142d65_56%,#493586)] shadow-[0_18px_35px_-14px_rgba(31,35,91,.8)]" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <div aria-hidden="true" className="absolute -top-24 left-0 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
              <div aria-hidden="true" className="absolute -bottom-16 -right-8 h-48 w-48 rounded-full bg-fuchsia-300/20 blur-3xl" />
              <svg aria-hidden="true" viewBox="0 0 510 320" className="pointer-events-none absolute inset-0 h-full w-full">
                <g fill="none" stroke="#d9e6ff" strokeOpacity=".33" strokeWidth="1.3">
                  <circle cx="400" cy="160" r="145" /><circle cx="400" cy="160" r="105" /><circle cx="400" cy="160" r="63" />
                  <ellipse cx="395" cy="160" rx="205" ry="63" transform="rotate(-33 395 160)" />
                </g>
                <circle cx="304" cy="85" r="4" fill="#f9e5ad" />
                <circle cx="460" cy="219" r="3" fill="#b0eafc" />
                <path d="M0 240 L105 180 L175 212 L275 90" fill="none" stroke="#d1c0fa" strokeOpacity=".3" strokeDasharray="4 8" />
              </svg>
              <div className="relative flex h-full flex-col justify-between p-[6%] text-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-white/50 bg-white/10 sm:h-10 sm:w-10"><Orbit className="h-5 w-5 text-cyan-100" aria-hidden="true" /></span>
                    <div><p className="text-base font-black leading-none tracking-[.18em] sm:text-xl">ORBIT</p><p className="mt-1 text-[8px] tracking-[.24em] text-blue-100/70 sm:text-[10px]">MBBS · PRIVATE EDITION</p></div>
                  </div>
                  <span className="text-[9px] font-semibold tracking-[.12em] text-[#f6e2aa] sm:text-xs">✦ 01 / ∞</span>
                </div>
                <div className="flex items-center gap-3">
                  <div aria-hidden="true" className="relative h-9 w-12 rounded-lg border border-amber-100/70 bg-[linear-gradient(130deg,#b59d70,#f9eac0_52%,#a08b63)] sm:h-11 sm:w-14">
                    <span className="absolute inset-x-1/3 inset-y-0 border-x border-amber-900/40" />
                    <span className="absolute inset-y-1/3 inset-x-0 border-y border-amber-900/40" />
                    <span className="absolute inset-[18%] rounded border border-amber-900/40" />
                  </div>
                  <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#fce5b7] sm:text-sm">Co-Founder</p><p className="mt-1 text-[8px] uppercase tracking-[.14em] text-blue-100/80">Limitless access · ∞</p></div>
                </div>
                <div>
                  <p className="mb-1 text-[8px] uppercase tracking-[.28em] text-blue-100/70">Cardholder</p>
                  <p className="truncate text-base font-bold uppercase tracking-[.08em] sm:text-2xl">{name}</p>
                  <p className="mt-1 text-[8px] uppercase tracking-[.17em] text-[#fce5b7] sm:text-[10px]">The ORBIT founders' universe</p>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px] border border-amber-200/40 bg-[linear-gradient(135deg,#151a35,#352c6e)] px-5 text-center text-white shadow-xl" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(199,173,255,.2),transparent_60%)]" />
              <Crown aria-hidden="true" className="relative h-9 w-9 text-amber-200 sm:h-12 sm:w-12" />
              <p className="relative text-[9px] uppercase tracking-[.3em] text-amber-200">A little secret</p>
              <p className="relative max-w-xs text-sm font-semibold leading-snug sm:text-xl">You aren't just in the ORBIT universe. You're helping create it.</p>
              <p className="relative text-[9px] tracking-widest text-blue-100/70">FOREVER PART OF THE STORY · ✦</p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">↻ Tap to flip your card.</p>
        <button type="button" onClick={() => setSecret((v) => (v + 1) % secrets.length)} className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-violet-200"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Find a secret</button>
      </div>
      {secret >= 0 && <div role="status" aria-live="polite" className="rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 p-3"><p className="text-xs font-medium">{secrets[secret]}</p><div aria-hidden="true" className="mt-2 flex gap-1.5">{secrets.map((_, i) => <span key={i} className={`h-1 rounded-full ${i === secret ? "w-5 bg-violet-500" : "w-2 bg-violet-300/50"}`} />)}</div></div>}
      <p className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Exclusive identity card · Not a payment card</p>
    </section>
  );
}
