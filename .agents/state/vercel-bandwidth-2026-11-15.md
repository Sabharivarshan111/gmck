# 2026-11-15 — Reduce Vercel repeat asset traffic

### DONE
Worker now migrates identical content-hashed offline assets from the prior release instead of downloading them on every install; repeated hashed-asset reads use cache-first without background fetch. Mutable PG packs still refresh, HTML stays network-first, and auth/cross-origin/POST/range-video bypass is preserved. Activation deletes only ORBIT caches. Vercel gives /assets a one-year immutable browser cache; sw.js revalidates. node scripts/service-worker-bandwidth-check.mjs executes real worker install/activate/fetch handlers and passes, as do node --check public/sw.js and git diff --check.

### HALF-DONE
Production deployment must be verified after push. No measured monthly savings or no-quota guarantee. Vercel billing export for a full month exceeded connector response limit; one-day export worked and showed zero Fast Data Transfer billed cost, with Deployment/Function Storage charges. This is not an invoice or a complete monthly usage total.

### NEXT
Verify READY deployment and live worker/Cache-Control. Owner wants to avoid the recurring Pro fee. ORBIT sells Premium and Vercel Hobby is non-commercial only; optimizing usage does not remove the subscription fee. A hosting migration must precede cancellation; custom domain can move, vercel.app hostname cannot move off Vercel.

### DO NOT
Do not cancel Pro or change DNS without a working replacement; owner said they will cancel. Do not claim exact $23 invoice/tax composition was verified. No native APK changes required.


## Production verification
Deployment dpl_7A6z2F74qxSueiahWjbg3iNHaTCH, commit d5c7fc0086c2ab6638c7db3f56892b372d701594 reached READY. Live vercel.app worker contains v41-bandwidth-reuse and cacheFirstImmutable. HEAD /assets/browser-B-sJ9r3b.js returned 200 and public,max-age=31536000,immutable; sw.js on vercel.app and orbitmbbs.site returned 200 and max-age=0,must-revalidate. All 444 /assets entries in the 471-entry live offline manifest match the content-hash classifier. No monthly savings guarantee or invoice verification.

## Migration compatibility finding
Several shipped Android paths still use https://orbitmbbs.vercel.app/simulator (nativeSimulatorRouting.ts, SimulatorScreen.tsx, NotesScreen.tsx, simulatorNavigation.ts). Moving orbitmbbs.site alone will not replace those links on older installed APKs. Account access to a replacement host is not available; Cloudflare plugin search returned no results. No hosting move, DNS change or Pro cancellation performed. Plan old-version compatibility and a custom-domain routing update before cancellation.
