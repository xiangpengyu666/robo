import { PURCHASE_ITEMS } from './purchase-links.js';

export function setupMaterialList({onOpen,onBack,onSelect,onDismiss} = {}) {
  const rail=document.querySelector('.resource-rail');
  const actions=rail.querySelector('.product-actions');
  const trigger=actions.querySelector('button[aria-label="元器件材料清单，待上线"]');
  trigger.disabled=false;
  trigger.title='查看元器件材料清单与购买链接';
  trigger.setAttribute('aria-label','元器件材料清单');
  trigger.setAttribute('aria-pressed','false');
  trigger.setAttribute('aria-controls','rail-bom');
  trigger.querySelector('small').textContent='查看清单';
  const panel=document.createElement('section');
  panel.id='rail-bom';panel.className='rail-bom';panel.hidden=true;
  panel.setAttribute('aria-label','元器件材料清单');
  panel.innerHTML='<button type="button" class="rail-back" aria-label="返回产品资源"><svg viewBox="0 0 16 28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 3 2 14l11 11"/></svg><span>返回产品资源</span></button><div class="rail-bom-content" tabindex="-1"></div>';
  const categories=[['电子元器件',[0,1,2,4,5,6]],['机械件',[10]],['连接线材',[3,9]],['紧固件',[7,8]]];
  for(const [label,indices] of categories){
    const section=document.createElement('section');section.className='rail-bom-group';
    const heading=document.createElement('h2');heading.textContent=label;section.append(heading);
    for(const index of indices){
      const item=PURCHASE_ITEMS[index];
      const link=document.createElement(item.url?'a':'div');link.className='rail-bom-link';link.dataset.purchaseIndex=String(index);
      if([0,1,2,4,5,6,10].includes(index)){
        link.addEventListener('pointerenter',()=>onSelect?.(index));
        link.addEventListener('focus',()=>onSelect?.(index));
        link.addEventListener('pointerleave',()=>onDismiss?.());
        link.addEventListener('blur',()=>onDismiss?.());
        link.addEventListener('click',event=>{if(!event.ctrlKey&&!event.metaKey&&!event.shiftKey){event.preventDefault();onSelect?.(index);}});
      }
      link.title=`${item.model} · ${item.quantity}${item.url?'':' · 链接待补充'}`;
      if(item.url){link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',`购买${item.name}（新窗口）`);}
      else link.classList.add('is-pending');
      const name=document.createElement('span');name.textContent=item.name;
      const quantity=document.createElement('small');quantity.textContent=/^\d+/.test(item.quantity)?`×${parseInt(item.quantity,10)}`:'若干';
      link.append(name,quantity);section.append(link);
    }
    panel.querySelector('.rail-bom-content').append(section);
  }
  const note=document.createElement('p');note.className='rail-bom-note';note.textContent='DIY 需要准备焊接工具。';
  panel.querySelector('.rail-bom-content').append(note);
  rail.append(panel);
  const back=panel.querySelector('.rail-back'),content=panel.querySelector('.rail-bom-content');
  trigger.addEventListener('click',()=>onOpen?.());
  back.addEventListener('click',()=>onBack?.());
  return {
    trigger,
    setActive(active){
      actions.hidden=active;panel.hidden=!active;rail.classList.toggle('is-bom',active);
      if(active){back.focus({preventScroll:true});}
      else if(panel.contains(document.activeElement))trigger.focus({preventScroll:true});
    },
    showList(){content.focus({preventScroll:true});},
  };
}
