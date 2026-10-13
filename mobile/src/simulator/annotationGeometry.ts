/** Image coordinates are normalized in the displayed (radiological) orientation. */
export interface ImageRect {x:number;y:number;width:number;height:number}
export interface Annotation {id:string;name:string;x:number;y:number;note:string;provenance:'reference'|'personal'}
export function fittedImage(width:number,height:number,aspect:number,margin:number,zoom:number,panX=0,panY=0):ImageRect {
  const available=Math.max(1,width-2*margin);
  const w=Math.min(available,height*Math.max(.01,aspect)),h=w/Math.max(.01,aspect);
  return {x:(width-w*zoom)/2+panX,y:(height-h*zoom)/2+panY,width:w*zoom,height:h*zoom};
}
export function imagePoint(rect:ImageRect,x:number,y:number){return {x:rect.x+x*rect.width,y:rect.y+y*rect.height};}
export function sourcePoint(rect:ImageRect,x:number,y:number){return {x:(x-rect.x)/rect.width,y:(y-rect.y)/rect.height};}
export function layoutAnnotations(items:readonly Annotation[],rect:ImageRect,width:number,height:number,margin:number) {
  const shown=items.map(item=>({...item,point:imagePoint(rect,item.x,item.y)}))
    .filter(item=>item.x>=0&&item.x<=1&&item.y>=0&&item.y<=1&&item.point.x>=margin&&item.point.x<=width-margin&&item.point.y>=0&&item.point.y<=height);
  return (['left','right'] as const).flatMap(side=>{
    const sorted=shown.filter(item=>(item.x<.5?'left':'right')===side).sort((a,b)=>a.point.y-b.point.y);
    const gap=Math.min(54,Math.max(44,(height-24)/Math.max(1,sorted.length)));
    const ys=sorted.map((item,i)=>Math.max(24+i*gap,Math.min(height-24,item.point.y)));
    for(let i=1;i<ys.length;i++)ys[i]=Math.max(ys[i],ys[i-1]+gap);
    if(ys.length&&ys[ys.length-1]>height-24){const shift=ys[ys.length-1]-(height-24);for(let i=0;i<ys.length;i++)ys[i]-=shift;}
    return sorted.map((item,i)=>({...item,side,labelY:ys[i],labelX:side==='left'?8:width-margin+8,lineX:side==='left'?margin-8:width-margin+8}));
  });
}
