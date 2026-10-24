/** Test-only provider fixture for content tests that assume a paid reader.
 * The runtime still executes its real authenticated entitlement check.
 * Access-control denial and checkout behavior are covered in payment-flow-e2e.
 */
export async function installPremiumTestAccount(context) {
  const user={id:'00000000-0000-4000-8000-000000000024',email:'premium-content-test@example.invalid',is_anonymous:false,app_metadata:{provider:'google',providers:['google']},user_metadata:{},aud:'authenticated',role:'authenticated',created_at:'2026-01-01T00:00:00Z'};
  const expiry=new Date(Date.now()+365*86400000).toISOString();
  const token=`${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.fixture`;
  await context.addInitScript(({user,token})=>localStorage.setItem('sb-pmtgeydtqypwrypshhsx-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user})),{user,token});
  await context.route('https://pmtgeydtqypwrypshhsx.supabase.co/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','content-type':'application/json'};
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    if(url.pathname==='/auth/v1/user')return route.fulfill({headers,body:JSON.stringify(user)});
    if(url.pathname==='/rest/v1/premium_subscriptions')return route.fulfill({headers,body:JSON.stringify({expires_at:expiry})});
    return route.fallback();
  });
}
