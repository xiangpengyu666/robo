import * as THREE from 'three';

// The orbit radius controls user magnification. Assembly expansion uses camera.zoom
// independently, so opening/closing the assembly never overwrites the user's zoom.
export function createViewControls({camera, controls, host}) {
  const canvas=controls.domElement;
  controls.enableDamping=true;
  controls.dampingFactor=.085;
  controls.rotateSpeed=.55;
  controls.zoomSpeed=.65;
  controls.enablePan=true;
  controls.screenSpacePanning=true;
  controls.panSpeed=.45;
  controls.zoomToCursor=false;
  controls.minPolarAngle=.001;
  controls.maxPolarAngle=Math.PI-.001;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_ROTATE};
  canvas.tabIndex=0;
  canvas.setAttribute('aria-label','三维产品：左键拖动旋转，右键拖动有限平移，滚轮缩放，支持查看顶部和底部');

  const zoomUI=document.createElement('div');
  zoomUI.className='zoom-control';
  zoomUI.setAttribute('role','group');
  zoomUI.setAttribute('aria-label','视图缩放');
  zoomUI.innerHTML='<button class="zoom-in" aria-label="放大模型" title="放大">+</button><input class="zoom-range" aria-label="模型缩放" type="range" min="0" max="100" step="1" value="50"><button class="zoom-out" aria-label="缩小模型" title="缩小">−</button><output class="zoom-value" aria-label="当前缩放">100%</output>';
  const range=zoomUI.querySelector('input'),output=zoomUI.querySelector('output');
  const plus=zoomUI.querySelector('.zoom-in'),minus=zoomUI.querySelector('.zoom-out');
  host.append(zoomUI);

  let baseline=camera.position.distanceTo(controls.target),pending=null,draggingRange=false;
  range.addEventListener('pointerdown',()=>{draggingRange=true;});
  const endRange=()=>{draggingRange=false;};
  range.addEventListener('pointerup',endRange);range.addEventListener('pointercancel',endRange);range.addEventListener('lostpointercapture',endRange);
  const offset=new THREE.Vector3();
  const panOrigin=controls.target.clone(),panOffset=new THREE.Vector3(),correction=new THREE.Vector3();
  // Keep the target within a small sphere around this scene's original center.
  // Translate camera and target together to preserve rotation and zoom at the edge.
  function clampPan(){
    panOffset.copy(controls.target).sub(panOrigin);
    const limit=baseline*.08;
    if(panOffset.lengthSq()>limit*limit){
      correction.copy(panOrigin).add(panOffset.setLength(limit)).sub(controls.target);
      controls.target.add(correction);camera.position.add(correction);
    }
  }
  function radius(){return camera.position.distanceTo(controls.target);}
  function bounds(){controls.minDistance=baseline/2.2;controls.maxDistance=baseline/.65;}
  function stop(){pending=null;}
  function flush(){const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;}
  function sync(){
    const distance=radius(),value=100*Math.log(controls.maxDistance/distance)/Math.log(controls.maxDistance/controls.minDistance);
    const sliderValue=String(Math.round(THREE.MathUtils.clamp(value,0,100)));
    if(!draggingRange&&range.value!==sliderValue)range.value=sliderValue;
    const percent=Math.round(baseline/distance*100);
    if(output.textContent!==`${percent}%`){output.textContent=`${percent}%`;range.setAttribute('aria-valuetext',`${percent}%`);}
    plus.disabled=distance<=controls.minDistance+.002;
    minus.disabled=distance>=controls.maxDistance-.002;
  }
  function zoomTo(distance){pending=THREE.MathUtils.clamp(distance,controls.minDistance,controls.maxDistance);}
  plus.onclick=()=>zoomTo((pending??radius())/1.18);
  minus.onclick=()=>zoomTo((pending??radius())*1.18);
  range.oninput=()=>zoomTo(controls.maxDistance*Math.pow(controls.minDistance/controls.maxDistance,Number(range.value)/100));
  // Intercept only wheel zoom; OrbitControls still handles pinch and orbit gestures.
  canvas.addEventListener('wheel',event=>{
    event.preventDefault();event.stopImmediatePropagation();
    const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?host.clientHeight:1);
    zoomTo((pending??radius())*Math.exp(THREE.MathUtils.clamp(pixels,-240,240)*.0014));
  },{capture:true,passive:false});
  controls.addEventListener('start',stop);
  canvas.addEventListener('pointerdown',()=>{canvas.focus({preventScroll:true});canvas.classList.add('is-orbiting');});
  const release=()=>canvas.classList.remove('is-orbiting');
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('keydown',event=>{
    if(event.key==='+'||event.key==='='){event.preventDefault();plus.click();}
    if(event.key==='-'){event.preventDefault();minus.click();}
  });
  bounds();sync();
  return {
    // Call after a lesson reframes its own models; limits must follow that scale.
    reframe(base=radius()){pending=null;baseline=base;panOrigin.copy(controls.target);bounds();sync();},
    get baseline(){return baseline;},
    get panOrigin(){return panOrigin.clone();},
    reset(position,target,origin=target){stop();flush();camera.position.copy(position);controls.target.copy(target);panOrigin.copy(origin);bounds();controls.update();sync();},
    update(dt){
      if(pending!==null){
        const current=radius(),next=THREE.MathUtils.lerp(current,pending,1-Math.exp(-13*dt));
        const distance=Math.abs(next-pending)<.0001?pending:next;
        offset.copy(camera.position).sub(controls.target).setLength(distance);
        camera.position.copy(controls.target).add(offset);
        if(distance===pending)pending=null;
      }
      controls.update(dt);clampPan();sync();
    },
  };
}
