import { createConnectionLaptop } from './connection-laptop.js';
import * as THREE from 'three';
import { createUsbHarness } from './usb-harness.js';
import { routeWire } from './wire-routing.js';
import { LESSONS, visibleLessonParts } from './lessons.js';
export function createTutorial({scene,camera,controls,parts,onFrame=()=>{}}){
 const root=new THREE.Group();scene.add(root);root.visible=false;
 const $=id=>document.getElementById(id);let step=0,elapsed=0,startedAt=performance.now(),active=false,models=new Map(),wires=[],harnesses=[],insertionAnimations=[],markers=[],usbIndex=0,nanoStep=0;
 const labelLayer=$('lesson-labels');
 const usbStep=LESSONS.findIndex(l=>l.kind==='usb');
 ['Nano 接线','USB Hub 接线'].forEach((name,index)=>{const button=document.createElement('button');button.textContent=name;button.onclick=()=>show(index?usbStep:nanoStep);$('lesson-groups').append(button);});
 function clear(){root.children.slice().forEach(c=>root.remove(c));for(const m of markers)m.element.remove();markers=[];for(const wire of wires){if(!wire.userData.harness){wire.geometry.dispose();wire.material.dispose();}}for(const group of harnesses)group.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});wires=[];harnesses=[];insertionAnimations=[];for(const obj of models.values())obj.traverse(m=>{if(m.isMesh)m.material.dispose();});models.clear();}
 function marker(text,point){const element=document.createElement('span');element.className='connection-label';element.textContent=text;labelLayer.append(element);markers.push({element,point});}
 function clonePart(n){const original=parts.find(p=>p.userData.partId===`part-${n}`);const copy=original.clone(true);copy.position.set(0,0,0);copy.visible=true;copy.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.emissive?.setHex(0);}});models.set(n,copy);root.add(copy);return copy;}
 function frame(){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const distance=Math.max(size.y,size.x/Math.max(camera.aspect,.4),size.z)*(LESSONS[step].kind==='led'?2.8:LESSONS[step].kind==='servo'?2.35:1.9)+.5;
  const damping=controls.enableDamping;
  controls.enableDamping=false;
  controls.update();
  controls.enableDamping=damping;
  controls.target.copy(center);
  // Wiring layouts face +Z; every step starts level and straight-on.
  camera.up.set(0,1,0);
  camera.position.copy(center).add(new THREE.Vector3(0,0,distance));
  camera.zoom=1;
  camera.updateProjectionMatrix();
  onFrame();
  controls.update();
 }
 function local(n,xyz){return models.get(n).children[0].localToWorld(new THREE.Vector3(...xyz));}
 function normal(n,xyz){return new THREE.Vector3(...xyz).transformDirection(models.get(n).children[0].matrixWorld);}
 function connect(a,b,start,end,source,destination,axisA,axisB,options={}){
 const boxes=[...models.values()].map(m=>new THREE.Box3().setFromObject(m));
 if(LESSONS[step].kind==='usb'){
 const harness=createUsbHarness({a,b,normalA:normal(source,axisA),normalB:destination?normal(destination,axisB):new THREE.Vector3(-1,0,0),sideA:normal(source,source===15?[0,0,1]:[1,0,0]),sideB:destination?normal(destination,[1,0,0]):new THREE.Vector3(0,-1,0),boxA:new THREE.Box3().setFromObject(models.get(source)),boxB:destination?new THREE.Box3().setFromObject(models.get(destination)):null,boxes,typeA:source===14?'typeC':'four',typeB:destination?'four':'usbA',widthA:source===15?.24:source===14?.25:.24,widthB:destination?.24:.3,profileA:source===15?'camera':'hub'});
 root.add(harness.group);harnesses.push(harness.group);insertionAnimations.push(harness.updateInsertion);harness.updateInsertion(0);for(const wire of harness.wires){wire.userData.harness=true;wires.push(wire);}marker(start,a.clone().add(new THREE.Vector3(0,.24,0)));marker(end,b.clone().add(new THREE.Vector3(.28,.22,0)));return;
 }
 const curve=routeWire(a,b,normal(source,axisA),destination?normal(destination,axisB):new THREE.Vector3(0,1,0),new THREE.Box3().setFromObject(models.get(source)),destination?new THREE.Box3().setFromObject(models.get(destination)):null,boxes,LESSONS[step].kind==='usb'?'direct':'overhead',options.lane??0);
 const wire=new THREE.Mesh(new THREE.TubeGeometry(curve,240,.01,12,false),new THREE.MeshStandardMaterial({color:options.color??'#b98240',roughness:.55}));root.add(wire);wires.push(wire);if(!options.hideMarkers){marker(start,a);marker(end,b);}elapsed=0;
 }
 function show(i){step=i;clear();const lesson=LESSONS[step],visibleParts=visibleLessonParts(lesson,usbIndex),isUsb=lesson.kind==='usb';
 if(!isUsb)nanoStep=step;
 $('lesson-connections').replaceChildren();$('lesson-steps').replaceChildren();
 [...$('lesson-groups').children].forEach((button,index)=>button.setAttribute('aria-pressed',String(index===(isUsb?1:0))));
 if(!isUsb)LESSONS.slice(0,usbStep).forEach((item,index)=>{const button=document.createElement('button');button.textContent=item.title;button.dataset.step=String(index+1).padStart(2,'0');button.setAttribute('aria-current',index===step?'step':'false');button.onclick=()=>show(index);$('lesson-steps').append(button);});
 $('lesson-steps').hidden=isUsb;
 for(const n of visibleParts){const copy=clonePart(n);{
 const visual=copy.children[0];visual.position.set(0,0,0);visual.rotation.set(0,0,0);visual.scale.setScalar(1);
 if(n===27)visual.rotation.x=Math.PI/2;if(n===14)visual.rotation.x=Math.PI/2;if(n===13)visual.rotation.x=-Math.PI/2;if(n===15||n===16)visual.rotation.x=Math.PI/2;
 const b=new THREE.Box3().setFromObject(copy),size=b.getSize(new THREE.Vector3());const scale=1.5/Math.max(...size.toArray());visual.position.copy(b.getCenter(new THREE.Vector3())).multiplyScalar(-scale);visual.scale.setScalar(scale);copy.position.set((visibleParts.indexOf(n)-(visibleParts.length-1)/2)*2.4,0,0);
 }}
 if(lesson.kind==='usb'&&usbIndex===2){models.get(16).rotation.z=-Math.PI/2;models.get(16).position.x=-2;}
 root.updateMatrixWorld(true);
 if(lesson.kind==='servo'){
 connect(local(14,[-7.6,1.05,lesson.z]),local(lesson.servo,[24.54,7.32,-5]),`Nano ${lesson.pin}`,'舵机 SIG',14,lesson.servo,[0,1,0],[0,1,0],{lane:2});
 for(let j=0;j<2;j++)connect(local(27,[(2-lesson.pair)*2.54,.95,j?1.27:-1.27]),local(lesson.servo,[j?19.46:22,7.32,-5]),'','',27,lesson.servo,[0,1,0],[0,1,0],{color:j?'#24282c':'#d34635',lane:j,hideMarkers:true});
 marker(`分电板第 ${lesson.pair+1} 组 · + / −`,local(27,[(2-lesson.pair)*2.54,.95,-1.27]));
 for(const [name,color] of [[`${lesson.pin} → SIG`,'#b98240'],['+ → 电源（红）','#d34635'],['− → GND（棕）','#24282c']]){const key=document.createElement('span');key.className='signal-key';key.style.setProperty('--signal-color',color);key.textContent=name;$('lesson-connections').append(key);}
 }
 if(lesson.kind==='led'){
  for(const signal of lesson.signals){
   connect(local(14,[-7.6,1.05,signal.z]),local(13,[-25,-1.25,signal.endZ]),`Nano ${signal.pin}`,`MAX7219 ${signal.dest}`,14,13,[0,1,0],[-1,0,0],{...signal,hideMarkers:true});
   const key=document.createElement('span');key.className='signal-key';key.style.setProperty('--signal-color',signal.color);key.textContent=`${signal.pin} → ${signal.dest}`;$('lesson-connections').append(key);
  }
  marker('Nano D10 / D11 / D12',local(14,[-7.6,1.05,12.7]));

 }
 if(lesson.kind==='power'||lesson.kind==='led'){
  const sourcePins=lesson.sourcePins??[[(2-lesson.pair)*2.54,.95,-1.27],[(2-lesson.pair)*2.54,.95,1.27]],destPins=lesson.destPins??[[22,7.32,-5],[19.46,7.32,-5]];
  for(let j=0;j<2;j++)connect(local(lesson.source,sourcePins[j]),local(lesson.destination,destPins[j]),j?'GND / −':'5V / +',j?'GND / −':'5V / +',lesson.source,lesson.destination,[0,1,0],lesson.destination===13?[-1,0,0]:[0,1,0],{color:j?'#24282c':'#d34635',lane:j+(lesson.kind==='led'?3:0),hideMarkers:true});
  marker('5V / GND',local(lesson.source,sourcePins[0]));if(lesson.kind!=='led')marker(lesson.destination===27?'第 1 组 · 电源输入':'电源 + / 地线 −',local(lesson.destination,destPins[0]));
 }
 if(lesson.kind==='led'){
  const pins=[['CLK',-1.96,'#368b91'],['CS',-3.23,'#b98240'],['DOUT → DIN',-4.5,'#8b68b2'],['GND',-5.77,'#24282c'],['VCC',-7.04,'#d34635']];
  for(const [name,z,color] of pins){const a=local(13,[-7,-1.25,z]),b=local(13,[7,-1.25,z]),curve=new THREE.LineCurve3(a,b),wire=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.008,10,false),new THREE.MeshStandardMaterial({color,roughness:.55}));root.add(wire);wires.push(wire);const key=document.createElement('span');key.className='signal-key';key.style.setProperty('--signal-color',color);key.textContent=name;$('lesson-connections').append(key);}
  marker('第一块 → 第二块 · 五线级联',local(13,[0,-1.25,-20]));
 }
 if(lesson.kind==='usb'){
 const links=[['摄像头 → Hub',15,[12.15,1.2,0],16,[-18.75,3.65,16.1],'配套四针线束','Hub 下行'],['Nano → Hub',14,[0,2.4,-22.02],16,[-6.25,3.65,16.1],'Nano Type-C','Hub 下行'],['Hub → 电脑',16,[-10,3.65,-15.1],null,null,'Hub 上行','电脑 USB']];
 links.forEach((l,j)=>{const button=document.createElement('button');button.textContent=l[0];button.dataset.step=String(j+1).padStart(2,'0');button.setAttribute('aria-pressed',String(j===usbIndex));button.onclick=()=>{usbIndex=j;show(step);};$('lesson-connections').append(button);});const pinLegend=document.createElement('div');pinLegend.className='usb-pin-order';pinLegend.textContent=usbIndex===2?'Hub 上行针序（板正面左 → 右）：5V · D− · D+ · GND':'Hub 下行针序（板正面左 → 右）：GND · D+ · D− · 5V';$('lesson-connections').append(pinLegend);const l=links[usbIndex],a=local(l[1],l[2]),b=l[3]?local(l[3],l[4]):a.clone().add(new THREE.Vector3(1.1,0,0));if(usbIndex===2){const laptop=createConnectionLaptop(b);root.add(laptop);harnesses.push(laptop);}connect(a,b,l[5],l[6],l[1],l[3],usbIndex===0?[1,0,0]:[0,0,-1],[0,0,1]);
 }
 frame();elapsed=0;startedAt=performance.now();
 }
 return {resetView(){if(active)frame();},enter(){active=true;root.visible=true;show(step);},exit(){active=false;root.visible=false;labelLayer.hidden=true;},resize(){if(active)frame();},update(dt){if(!active)return;labelLayer.hidden=false;elapsed=(performance.now()-startedAt)/1000;const t=Math.min(elapsed/(insertionAnimations.length?2.4:2),1),ease=t*t*(3-2*t);for(const animate of insertionAnimations)animate(ease);for(const wire of wires)if(!wire.userData.harness)wire.geometry.setDrawRange(0,Math.max(0,Math.floor(ease*wire.geometry.index.count/3)*3));root.updateMatrixWorld(true);for(const m of markers){const p=m.point.clone().project(camera);m.element.hidden=p.z>1||p.z<-1;m.element.style.left=`${(p.x*.5+.5)*100}%`;m.element.style.top=`${(-p.y*.5+.5)*100}%`;}}};
}
