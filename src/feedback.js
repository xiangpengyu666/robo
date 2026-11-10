export const purchaseTitle = '想把 ROBO 带回家？';
export const purchaseBody = '<p>感谢你对 ROBO 的关注！目前整机暂未开放批量销售，我们正在了解大家的购买需求。</p><p class="community-note">如果你有兴趣，可以联系我咨询。当前不接受在线下单或付款，具体供货安排与交付时间将另行确认。</p><a class="purchase-interest-contact" href="mailto:xiangpengyu020104@gmail.com">咨询购买 ↗</a>';

export function trackPurchaseInquiry(purchase) {
  function interestEvent(action){
    const en=document.documentElement.lang==='en';
    window.dispatchEvent(new CustomEvent('robo:purchase-interest',{detail:{action,currency:en?'USD':'CNY',price:en?58:368,language:en?'en':'zh'}}));
  }
  interestEvent('open');
  purchase.querySelector('.purchase-interest-contact').onclick=event=>{
    const en=document.documentElement.lang==='en';
    const subject=en?'ROBO purchase inquiry':'ROBO 整机购买咨询';
    const body=en?'Hi, I am interested in purchasing a complete ROBO unit. I would like to learn about availability and delivery arrangements.':'你好，我对ROBO整机购买感兴趣，想了解供货与交付安排。';
    event.currentTarget.href=`mailto:xiangpengyu020104@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    interestEvent('contact');
  };
}

export function setupFeedback(){
  function createDialog(title,body,trigger){
    const dialog=document.createElement('dialog');dialog.className='community-dialog';
    const id=`community-${title==='联系我们'?'contact':title==='想把 ROBO 带回家？'?'purchase':'feedback'}`;
    dialog.setAttribute('aria-labelledby',id);
    dialog.innerHTML=`<button type="button" class="community-close" aria-label="关闭窗口">×</button><p class="community-eyebrow">ROBO / COMMUNITY</p><h2 id="${id}">${title}</h2>${body}`;
    document.body.append(dialog);trigger.onclick=()=>dialog.showModal();
    dialog.querySelector('.community-close').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>trigger.focus());dialog.addEventListener('keydown',e=>e.stopPropagation());return dialog;
  }
  createDialog('联系我们','<p><a class="contact-email" href="mailto:xiangpengyu020104@gmail.com">xiangpengyu020104@gmail.com</a></p>',document.querySelector('.contact-trigger'));
  const buy=document.querySelector('#buy-robo');
  const purchase=createDialog(purchaseTitle,purchaseBody,buy);
  purchase.classList.add('purchase-interest-dialog');
  purchase.querySelector('.community-eyebrow').textContent='ROBO / EARLY INTEREST';
  buy.onclick=()=>{purchase.showModal();trackPurchaseInquiry(purchase);};
  const trigger=document.querySelector('.feedback-trigger');
  const dialog=createDialog('功能建议','<p class="community-note">你的想法，让 ROBO 更好。</p><div class="message-form"><label for="feature-message">你希望 ROBO 能做什么？</label><textarea id="feature-message" data-clarity-mask="true" rows="4" maxlength="2000"></textarea><div class="message-compose-actions"><a class="feedback-email-action" href="mailto:xiangpengyu020104@gmail.com">发送邮件 ↗</a></div><p class="message-public-note">通过邮件与我们分享建议，不会在网站公开。</p><p class="draft-status" role="status"></p></div>',trigger);
  dialog.classList.add('message-board');
  dialog.querySelector('.community-eyebrow').remove();
  const header=document.createElement('div');header.className='message-board-header';
  const close=dialog.querySelector('.community-close');
  close.innerHTML='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8"/></svg>';
  header.append(dialog.querySelector('h2'),close);
  const content=document.createElement('div');content.className='message-board-body';
  while(dialog.firstChild)content.append(dialog.firstChild);
  dialog.append(header,content);
  const input=dialog.querySelector('textarea'),send=dialog.querySelector('.feedback-email-action'),status=dialog.querySelector('.draft-status');
  function updateEmail(){
    const en=document.documentElement.lang==='en';
    const subject=en?'ROBO feature suggestion':'ROBO 功能建议';
    send.href=`mailto:xiangpengyu020104@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(input.value.trim())}`;
  }
  input.addEventListener('input',updateEmail);
  trigger.onclick=()=>{status.textContent='';updateEmail();dialog.showModal();};
  send.onclick=()=>{
    updateEmail();
    status.textContent='请在邮件应用中确认发送。如未打开，请复制留言并发送至上方邮箱。';
  };
  const email=document.createElement('a');email.className='feedback-address';
  email.href='mailto:xiangpengyu020104@gmail.com';email.textContent='xiangpengyu020104@gmail.com';
  dialog.querySelector('.message-form').insertBefore(email,status);
}
