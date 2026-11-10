import * as THREE from 'three';
import { PURCHASE_ITEMS } from './purchase-links.js';

export const PURCHASE_BINDINGS=[['part-1',5],['part-4',5],['part-8',5],['part-13',1],['part-14',4],['part-15',0],['part-16',2],['part-27',6],['part-3',10]];
export function createPurchaseCallouts({host,camera}){
  const layer=document.createElement('div');layer.className='purchase-callouts';layer.hidden=true;
  layer.innerHTML='<svg class="purchase-leaders" aria-hidden="true"><polyline class="purchase-line" pathLength="1"/><polyline class="purchase-bridge"/></svg><section class="purchase-card" aria-label="元器件购买" hidden><button type="button" class="purchase-card-close" aria-label="关闭购买信息">×</button><span class="purchase-card-eyebrow">ROBO / COMPONENT</span><div class="purchase-card-heading"><strong class="purchase-card-name"></strong><span class="purchase-card-quantity"></span></div><span class="purchase-card-model"></span><a class="purchase-card-link" target="_blank" rel="noopener noreferrer">购买 ↗</a></section>';
  host.append(layer);
  const card=layer.querySelector('.purchase-card'),line=layer.querySelector('.purchase-line'),bridge=layer.querySelector('.purchase-bridge');
  const entries=[],point=new THREE.Vector3();let activeIndex=null,activeEntry=null,closeTimer=null;
  function keep(){clearTimeout(closeTimer);}
  function dismiss(){keep();closeTimer=setTimeout(()=>{if(!card.contains(document.activeElement))clear();},450);}
  card.addEventListener('pointerenter',keep);card.addEventListener('pointerleave',dismiss);
  card.addEventListener('focusin',keep);card.addEventListener('focusout',dismiss);
  bridge.addEventListener('pointerenter',keep);bridge.addEventListener('pointerleave',dismiss);
  function clear(){keep();layer.classList.remove('is-revealed');bridge.style.display='none';activeIndex=null;activeEntry=null;card.hidden=true;line.style.display='none';entries.forEach(e=>e.button.setAttribute('aria-pressed','false'));document.querySelectorAll('.rail-bom-link').forEach(e=>e.classList.remove('is-active'));}
  function select(index,entry){
    if(layer.hidden)return;
    const item=PURCHASE_ITEMS[index];if(!item)return;
    keep();
    const changed=activeIndex!==index||card.hidden;
    activeIndex=index;activeEntry=entry||entries.find(e=>e.index===index&&!e.button.hidden)||entries.find(e=>e.index===index);
    card.querySelector('.purchase-card-name').textContent=item.name;
    card.querySelector('.purchase-card-model').textContent=item.model;
    card.querySelector('.purchase-card-quantity').textContent=/^\d+/.test(item.quantity)?`×${parseInt(item.quantity,10)}`:item.quantity;
    const buy=card.querySelector('a');
    if(item.url){buy.href=item.url;buy.textContent='购买 ↗';buy.setAttribute('aria-label',`购买${item.name}（新窗口）`);buy.removeAttribute('aria-disabled');buy.style.opacity='';buy.style.pointerEvents='';}
    else{buy.removeAttribute('href');buy.textContent='链接待补充';buy.removeAttribute('aria-label');buy.setAttribute('aria-disabled','true');buy.style.opacity='.5';buy.style.pointerEvents='none';}
    entries.forEach(e=>e.button.setAttribute('aria-pressed',String(e.index===index)));
    document.querySelectorAll('.rail-bom-link').forEach(e=>e.classList.toggle('is-active',Number(e.dataset.purchaseIndex)===index));
    card.hidden=false;
    if(changed){
      line.animate?.([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:220,easing:'ease-out'});
      card.animate?.([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,delay:130,fill:'backwards',easing:'ease-out'});
    }
  }
  card.querySelector('button').onclick=()=>{const button=activeEntry?.button;button?.focus({preventScroll:true});clear();};
  layer.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeIndex!==null){e.stopPropagation();card.querySelector('button').click();}});
  return {
    select,dismiss,
    selectPart(part){const entry=entries.find(e=>e.part===part);if(entry)select(entry.index,entry);else clear();},
    setActive(active){layer.hidden=!active;host.classList.toggle('show-purchases',active);clear();},
    setParts(parts){
      for(const [id,index] of PURCHASE_BINDINGS){
        const part=parts.find(p=>p.userData.partId===id);if(!part)continue;
        const button=document.createElement('button');button.className='purchase-hotspot';button.type='button';button.setAttribute('aria-label',part.name);button.setAttribute('aria-pressed','false');
        const entry={part,index,button,anchor:part.userData.bounds.getCenter(new THREE.Vector3()),x:0,y:0};
        button.onclick=()=>select(index,entry);button.onpointerenter=e=>{if(e.pointerType==='mouse')select(index,entry);};button.onfocus=()=>select(index,entry);button.onpointerleave=dismiss;button.onblur=dismiss;
        layer.append(button);entries.push(entry);
      }
    },
    update(){
      if(layer.hidden)return;
      const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
      camera.updateMatrixWorld();
      for(const e of entries){
        e.part.updateWorldMatrix(true,false);point.copy(e.anchor).applyMatrix4(e.part.matrixWorld).project(camera);
        e.button.hidden=!e.part.visible||point.z < -1||point.z > 1||Math.abs(point.x)>1||Math.abs(point.y)>1;
        e.x=(point.x*.5+.5)*w;e.y=(-point.y*.5+.5)*h;e.button.style.left=`${e.x}px`;e.button.style.top=`${e.y}px`;
      }
      if(activeIndex===null)return;
      if(!activeEntry||activeEntry.button.hidden)activeEntry=entries.find(e=>e.index===activeIndex&&!e.button.hidden);
      if(!activeEntry){card.hidden=true;line.style.display=bridge.style.display='none';return;}
      card.hidden=false;
      const cw=Math.min(244,w-24);card.style.width=`${cw}px`;
      const ch=card.offsetHeight,anchor=activeEntry;
      const gap=Math.min(110,Math.max(36,w*.10));
      const right=w-anchor.x>=anchor.x;
      const x=THREE.MathUtils.clamp(right?anchor.x+gap:anchor.x-cw-gap,12,Math.max(12,w-cw-12));
      const y=THREE.MathUtils.clamp(anchor.y-ch*.5,12,Math.max(12,h-ch-12));
      card.style.left=`${x}px`;card.style.top=`${y}px`;
      const endX=right?x:x+cw,endY=THREE.MathUtils.clamp(anchor.y,y+24,y+ch-24);
      const points=`${anchor.x},${anchor.y} ${endX+(right?-18:18)},${endY} ${endX},${endY}`;
      for(const el of [line,bridge]){el.style.display='';el.setAttribute('points',points);}
    },
  };
}
