// Production entitlement/ad modules with fixture APIs; never initializes AdMob.
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname,'..'));
function moduleAt(path,bindings={}){const source=fs.readFileSync(path,'utf8').replace(/import[\s\S]*?from ['"][^'"]+['"];?/g,'');const ctx={exports:{},Date,Promise,Set,Map,setTimeout,clearTimeout,setInterval,clearInterval,console,...bindings};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx);return ctx.exports;}
async function run(days,offline=false){
 const user={id:'fixture-user'},map=new Map();const expiry=days?new Date(Date.now()+days*86400000).toISOString():null;
 if(days&&offline){map.set('orbit:premium-owner-v1',user.id);map.set('orbit:premium-until',expiry);}
 const storage={getItem:async key=>map.get(key)??null,setItem:async(key,value)=>{map.set(key,value);},removeItem:async key=>{map.delete(key);}};
 const auth={getSession:async()=>({data:{session:{user}}})};
 const query={select(){return this;},eq(){return this;},order(){return this;},limit(){return this;},maybeSingle:async()=>({data:expiry?{expires_at:expiry}:null,error:offline?{}:null})};
 const premium=moduleAt('src/lib/premium.ts',{supabase:{auth,from:()=>query},secureStorage:storage});
 await premium.hydratePremium();let prompts=0,ads=0;
 const daily=moduleAt('src/lib/dailyAd.ts',{ADS_ENABLED:true,AsyncStorage:storage,isPremiumCached:premium.isPremiumCached,mayShowAds:premium.mayShowAds,showRewardedAd:async()=>{ads++;return {completed:true};}});
 daily.subscribeDailyAd(()=>prompts++);
 await daily.requestDailyAd('progress');await daily.confirmDailyAd('progress');
 if(days||offline){assert.equal(prompts,0);assert.equal(ads,0);}else{assert.equal(prompts,1);assert.equal(ads,1);}
 if(days){assert.equal(premium.isPremiumCached(),true);let sdk=0;const ad=moduleAt('src/lib/ads.ts',{__DEV__:false,ADS_ENABLED:true,isPremiumCached:premium.isPremiumCached,mayShowAds:premium.mayShowAds,mobileAds:()=>{sdk++;},TestIds:{},warn(){}});await ad.showRewardedAd();ad.showInterstitialAd();assert.equal(sdk,0);}
 return {days,offline,prompts,ads};
}
(async()=>{for(const args of [[180],[365],[365,true],[0,true],[0]])console.log(await run(...args));console.log('Native paid users: no consent popup or rewarded/interstitial display; unknown offline access defers ads.');})().catch(e=>{console.error(e);process.exitCode=1;});
