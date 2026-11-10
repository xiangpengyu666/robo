import { PerspectiveCamera2 } from 'threepipe';
import { prepareEdgeFinish } from './edge-finish.js';
import { createFaceDiffusion } from './face-diffusion.js';
import { createPowerBoard } from './power-board.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createViewControls } from './view-controls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './chinese-fonts.css';
import './style.css';
import './composer-layout.css';
import './brand.css';
import { createTutorial } from './tutorial.js';
import { partDisplayName } from './part-names.js';
import { planExplosion, effectiveVisibility } from './explosion.js';
import { createPLAMaterial, createBearingMaterial, refineModuleMaterial } from './materials.js';
import { createRenderingPipeline } from './rendering.js';
import { BOM_PARTS, SHELL_PARTS } from './bom-config.js';
import { createPurchaseCallouts } from './purchase-callouts.js';
import { setupMaterialList } from './material-list.js';
import { setupFeedback } from './feedback.js';
import { setupLanguage } from './language.js';
import { createIntroAnimation } from './intro-animation.js';

const materialList=setupMaterialList({onOpen:()=>togglePurchase(),onBack:()=>togglePurchase(false),onSelect:index=>purchaseCallouts.select(index),onDismiss:()=>purchaseCallouts.dismiss()});
setupFeedback();
setupLanguage();

const $ = id => document.getElementById(id);
const host = $('viewport'), slider = $('explode');
const camera = new PerspectiveCamera2('', undefined, false, 35, 1);
camera.near=.01;camera.far=100;camera.updateProjectionMatrix();
let pipeline;
try { pipeline=createRenderingPipeline(host,camera); }
catch(error) { $('loading').textContent='无法启动 3D 显示，请开启浏览器硬件加速后刷新。'; throw error; }
const {renderer,scene}=pipeline;
const controls = new OrbitControls(camera,renderer.domElement);
controls.target=camera.target;
controls.enableDamping=true; controls.minDistance=1; controls.maxDistance=14;
const group=new THREE.Group(); scene.add(group);
let faceDiffusion=null;
let intro=null;
let parts=[], selected=null, target=0, current=0, internal=false, explodedZoom=1;
const hiddenParts=new Set(['part-19']);
const visibleOverrides=new Set();
const rows=new Map();
const eyeIcon=(visible)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${visible?'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>':'<path d="m3 3 18 18M10.6 5.1 12 5c6.5 0 10 7 10 7a20 20 0 0 1-3 3.8M6.2 6.2A20 20 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.5 4.5-1.2M10 10a3 3 0 0 0 4 4"/>'}</svg>`;
const partAction=document.createElement('div');partAction.className='part-action';partAction.hidden=true;partAction.setAttribute('role','group');partAction.setAttribute('aria-label','选中部件操作');
const actionName=document.createElement('span'),actionButton=document.createElement('button'),actionClose=document.createElement('button');
actionButton.className='part-action-hide';actionClose.className='part-action-close';actionClose.textContent='×';actionClose.setAttribute('aria-label','取消选择');actionClose.onclick=()=>choose(null);
actionButton.onclick=()=>{if(selected)setPartVisible(selected,!selected.visible);};partAction.append(actionName,actionButton,actionClose);host.append(partAction);
function setPartVisible(part,visible){const id=part.userData.partId;if(visible){hiddenParts.delete(id);if(internal&&SHELL_PARTS.has(id))visibleOverrides.add(id);}else{hiddenParts.add(id);visibleOverrides.delete(id);}updateVisibility();}
function placePartAction(){partAction.hidden=!selected||teaching;if(partAction.hidden)return;const point=new THREE.Box3().setFromObject(selected).getCenter(new THREE.Vector3()).project(camera);if(point.z<-1||point.z>1){partAction.hidden=true;return;}const w=host.clientWidth,h=host.clientHeight;partAction.style.left=`${Math.max(12,Math.min(w-partAction.offsetWidth-12,(point.x*.5+.5)*w-partAction.offsetWidth/2))}px`;partAction.style.top=`${Math.max(110,Math.min(h-partAction.offsetHeight-44,(-point.y*.5+.5)*h+38))}px`;}
const restoreParts=document.createElement('button');restoreParts.className='restore-parts';restoreParts.textContent='全部显示';restoreParts.onclick=()=>{hiddenParts.clear();if(internal)SHELL_PARTS.forEach(id=>visibleOverrides.add(id));updateVisibility();};document.querySelector('.parts-heading').append(restoreParts);

let tutorial=null,teaching=false,savedView=null;
// The front panel faces +X; keep the initial and reset views level and centered.
const homePosition=new THREE.Vector3(6.1,0,0);
camera.position.copy(homePosition);controls.target.set(0,0,0);controls.update();
const viewControls=createViewControls({camera,controls,host});
let purchaseActive=false,purchaseSnapshot=null;
const purchaseCallouts=createPurchaseCallouts({host,camera});
function togglePurchase(open=!purchaseActive){
  if(!parts.length||slider.disabled)return;
  intro?.finish();
  if(open){
    if(teaching){switchMode(false);history.replaceState(null,'','#explorer');}
    if(purchaseActive)return;
    purchaseSnapshot={target,hidden:new Set(hiddenParts),overrides:new Set(visibleOverrides),internal};
    purchaseActive=true;choose(null);
    parts.filter(p=>p.userData.bomModel).forEach(p=>hiddenParts.delete(p.userData.partId));
    internal=false;updateVisibility();setExplosion(1);
  }else{
    if(!purchaseActive)return;
    purchaseActive=false;
    hiddenParts.clear();purchaseSnapshot.hidden.forEach(id=>hiddenParts.add(id));
    visibleOverrides.clear();purchaseSnapshot.overrides.forEach(id=>visibleOverrides.add(id));
    internal=purchaseSnapshot.internal;updateVisibility();setExplosion(purchaseSnapshot.target);
  }
  materialList.trigger.setAttribute('aria-pressed',String(purchaseActive));
  purchaseCallouts.setActive(purchaseActive);
  materialList.setActive(purchaseActive);
}
function resetCamera(){viewControls.reset(homePosition,new THREE.Vector3());}
new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;pipeline.resize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();tutorial?.resize();}).observe(host);
function paintSelection(part,on){part?.traverse(obj=>{if(obj.isMesh&&obj.material.emissive){const m=obj.material;if(m.userData.baseEmissive===undefined)m.userData.baseEmissive=m.emissive.getHex();m.emissive.setHex(on&&m.emissiveIntensity<=1?0x5a2308:m.userData.baseEmissive);}});}
function choose(part){
  paintSelection(selected,false); selected=part; paintSelection(selected,true);
  for(const [id,row] of rows)row.select.setAttribute('aria-pressed',String(part?.userData.partId===id));
  actionName.textContent=part?.name||'';actionButton.innerHTML=eyeIcon(false)+(part?.visible?'隐藏部件':'显示部件');placePartAction();
}
function buildPartLists(){
  for(const part of parts){
    const id=part.userData.partId;
    const row=document.createElement('div');row.className='part-row';
    const select=document.createElement('button');select.className='part-select';select.setAttribute('aria-label',part.name);select.setAttribute('aria-pressed','false');
    const number=document.createElement('span');number.className='part-number';number.textContent=id.replace('part-','').padStart(2,'0');
    const name=document.createElement('span');name.className='part-name';name.title=part.name;
    const label=part.name.replace(/^部件\s*\d+\s*·\s*/,'');
    const segments=label.split(' · '),title=document.createElement('span');title.className='part-title';
    title.textContent=part.userData.bomModel&&segments.length>1?segments.slice(1).join(' · '):label;name.append(title);
    if(part.userData.bomModel&&segments.length>1){const model=document.createElement('span');model.className='part-model';model.textContent=segments[0];name.append(model);}
    select.append(number,name);
    select.onclick=()=>choose(selected===part?null:part);
    const visibility=document.createElement('button');visibility.className='part-visibility';visibility.onclick=()=>setPartVisible(part,!part.visible);
    row.append(select,visibility);
    $(part.userData.bomModel?'module-parts':'print-parts').append(row);rows.set(id,{row,select,visibility});
  }
}
function updateVisibility(){
  for(const part of parts){
    const id=part.userData.partId;part.visible=effectiveVisibility(id,hiddenParts,internal,SHELL_PARTS,visibleOverrides);
    const row=rows.get(id);if(row){row.visibility.innerHTML=eyeIcon(part.visible);row.visibility.setAttribute('aria-pressed',String(part.visible));row.visibility.setAttribute('aria-label',(part.visible?'隐藏':'显示')+part.name);row.visibility.title=part.visible?'隐藏部件':'显示部件';row.row.classList.toggle('is-hidden',!part.visible);}
  }
  if(selected&&!selected.visible)choose(null);
  $('count').textContent=`${parts.filter(p=>p.visible).length} / ${parts.length} 可见`;
  $('internal').setAttribute('aria-pressed',String(internal));
  $('internal').textContent=internal?'显示外壳':'查看内部';
}
const loader=new GLTFLoader();
const assetPath=file=>`${import.meta.env.BASE_URL}models/${file}`;
async function loadAssembly(){
  const [gltf, ...models]=await Promise.all([
    loader.loadAsync(assetPath('robocam.glb')),
    ...['servo','matrix','nano','camera','hub'].map(async key=>({key,scene:(await loader.loadAsync(assetPath(`components/${key}.glb`))).scene})),
  ]);
  const templates=Object.fromEntries(models.map(m=>[m.key,m.scene]));
  const original=[]; gltf.scene.traverse(obj=>{if(obj.isMesh)original.push(obj);});
  const box=new THREE.Box3().setFromObject(gltf.scene), center=box.getCenter(new THREE.Vector3());
  const scale=2.8/Math.max(...box.getSize(new THREE.Vector3()).toArray());
  const frontBasis=new THREE.Matrix4().makeBasis(new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0));
  for(const [index,mesh] of original.entries()){
    const id=mesh.userData.partId || `part-${index+1}`, config=BOM_PARTS[id];
    mesh.geometry.computeBoundingBox();
    const sourceCenter=mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
    const part=new THREE.Group();
    part.name=partDisplayName(id);
    part.userData={partId:id,note:config?.note,bomModel:config?.model};
    let visual;
    if(config&&!config.sourceGeometry){
      visual=templates[config.model].clone(true);
      if(config.frontFacing)visual.quaternion.setFromRotationMatrix(frontBasis);
      else visual.rotation.set(config.rotationX||0,config.rotationY||0,0);
      visual.position.copy(sourceCenter); visual.position.x+=config.offsetX||0;
      visual.position.sub(center).multiplyScalar(scale); visual.scale.setScalar(scale);
      visual.traverse(obj=>{if(obj.isMesh){obj.material=obj.material.clone();refineModuleMaterial(obj);}});
    }else{
      // OCCT exports analytic surface normals. Re-averaging across shared CAD
      // vertices bends planar faces around holes and produces triangle shadows.
      const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
      visual=new THREE.Mesh(geometry,config?.model==='bearing'?createBearingMaterial():createPLAMaterial(id));
      visual.geometry.translate(-center.x,-center.y,-center.z); visual.geometry.scale(scale,scale,scale);
      prepareEdgeFinish(visual.geometry);
    }
    part.add(visual); group.add(part);
    part.traverse(obj=>{if(obj.isMesh){obj.castShadow=!obj.userData.detailSurface;obj.receiveShadow=!obj.userData.detailSurface;obj.assemblyOwner=part;}});
    const bounds=new THREE.Box3().setFromObject(part);
    part.userData.minY=bounds.min.y;
    part.userData.bounds=bounds.clone();
    parts.push(part);
  }
  const power=new THREE.Group();power.name=partDisplayName('part-27');power.userData={partId:'part-27',bomModel:'power',note:'五组正负极分电板；22 × 8 mm，焊点间距 2.54 mm，安装孔中心距 17 mm、孔径 3 mm；置于上壳内侧，板厚与固定方式为展示示意。'};
  const board=createPowerBoard();board.scale.setScalar(scale);board.rotation.x=Math.PI;board.position.set(-.25,1.18,0);power.add(board);group.add(power);power.traverse(m=>{if(m.isMesh){m.assemblyOwner=power;m.castShadow=true;m.receiveShadow=true;}});power.userData.bounds=new THREE.Box3().setFromObject(power);power.userData.minY=power.userData.bounds.min.y;parts.push(power);
  pipeline.prepare(group);
  faceDiffusion=createFaceDiffusion(parts,scale);faceDiffusion.update();
  const offsets=planExplosion(parts.map(p=>({id:p.userData.partId,bounds:p.userData.bounds})));
  const originalBounds=new THREE.Box3(),expandedBounds=new THREE.Box3();
  parts.forEach((p,i)=>{p.userData.explode=offsets[i];originalBounds.union(p.userData.bounds);expandedBounds.union(p.userData.bounds.clone().translate(offsets[i]));});
  // Include the endpoint shift relative to the original orbit target.
  const sphere=expandedBounds.getBoundingSphere(new THREE.Sphere());
  explodedZoom=Math.min(1,originalBounds.getBoundingSphere(new THREE.Sphere()).radius/(sphere.radius+sphere.center.length())*.85);
  buildPartLists();purchaseCallouts.setParts(parts);updateVisibility(); $('loading').hidden=true;
  slider.disabled=false; $('toggle').disabled=false; $('internal').disabled=false;
  tutorial=createTutorial({scene,camera,controls,parts,onFrame:()=>viewControls.reframe()});$('mode-teach').disabled=false;
  if(location.hash==='#guide')switchMode(true);
  else if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    resetCamera();
    controls.enabled=false;
    intro=createIntroAnimation({parts,group,camera,onComplete:()=>{controls.enabled=true;pipeline.invalidate();}});
  }

}
loadAssembly().catch(error=>{$('loading').textContent='模型加载失败，请刷新页面重试。';console.error(error);});
function setExplosion(value){intro?.finish();target=value;slider.value=Math.round(value*100);$('percentage').textContent=`${Math.round(value*100)}%`;$('toggle').textContent=value>.5?'还原装配':'展开模型';}
slider.addEventListener('input',()=>setExplosion(Number(slider.value)/100));
$('toggle').onclick=()=>setExplosion(target>.5?0:1);
$('reset').onclick=()=>{if(teaching)tutorial.resetView();else{resetCamera();choose(null);}};
$('internal').onclick=()=>{internal=!internal;visibleOverrides.clear();updateVisibility();};

function switchMode(on){
 if(!tutorial||on===teaching)return;
 intro?.finish();
 if(on&&purchaseActive)togglePurchase(false);
 teaching=on;pipeline.setProfile(on?'teach':'explore');group.visible=!on;$('explore-panel').hidden=on;$('lesson-panel').hidden=!on;$('lesson-groups').hidden=!on;
 $('internal').hidden=on;host.querySelector('.scene-label strong').textContent=on?'接线教学':'robocam';
 $('mode-explore').setAttribute('aria-pressed',String(!on));$('mode-teach').setAttribute('aria-pressed',String(on));
 if(on){savedView={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom,baseline:viewControls.baseline,panOrigin:viewControls.panOrigin};tutorial.enter();pipeline.setFloorHeight(-100);}
 else {tutorial.exit();viewControls.reframe(savedView.baseline);viewControls.reset(savedView.position,savedView.target,savedView.panOrigin);camera.zoom=savedView.zoom;camera.updateProjectionMatrix();}
}
$('mode-explore').onclick=()=>{switchMode(false);history.replaceState(null,'','#explorer');};
$('mode-teach').onclick=()=>{switchMode(true);history.replaceState(null,'','#guide');};
for(const link of document.querySelectorAll('.site-nav a'))link.onclick=e=>{e.preventDefault();switchMode(link.hash==='#guide');history.replaceState(null,'',link.hash);document.querySelector('.mode-tabs').scrollIntoView({block:'start'});};
addEventListener('hashchange',()=>switchMode(location.hash==='#guide'));
addEventListener('keydown',e=>{if(e.key==='Escape'){choose(null);if(purchaseActive&&!document.querySelector('.bom-dialog[open]'))togglePurchase(false);}});
const raycaster=new THREE.Raycaster(); let down=null;const pointers=new Set();
renderer.domElement.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);down=e.button===0&&pointers.size===1?{x:e.clientX,y:e.clientY,id:e.pointerId,moved:false}:null;});
renderer.domElement.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.moved=true;});
renderer.domElement.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null;});
renderer.domElement.addEventListener('pointerup',e=>{
  pointers.delete(e.pointerId);const click=down;down=null;
  if(teaching||!click||click.id!==e.pointerId||click.moved||e.button!==0)return;
  const r=renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
  const hit=raycaster.intersectObjects(parts.filter(p=>p.visible),true)[0]?.object.assemblyOwner||null;
  if(purchaseActive)purchaseCallouts.selectPart(hit);else choose(hit);
});
const timer=new THREE.Clock();
// Intentional interaction takes over immediately instead of fighting the opening animation.
for(const element of [host,$('explore-panel')]){
  for(const type of ['pointerdown','wheel','keydown','click'])element.addEventListener(type,()=>intro?.finish(),{capture:true,passive:true});
}
pipeline.onFrame(()=>{
  if(intro?.active){
    const dt=Math.min(timer.getDelta(),.1);
    intro.update(performance.now());
    faceDiffusion?.update();pipeline.invalidate();pipeline.render(dt);return;
  }
  const dt=Math.min(timer.getDelta(),.1);placePartAction();if(teaching){viewControls.update(dt);tutorial.update(dt);pipeline.render(dt);return;} current=THREE.MathUtils.lerp(current,target,1-Math.exp(-7*dt));if(Math.abs(current-target)<.0001)current=target;
  parts.forEach(p=>p.position.copy(p.userData.explode).multiplyScalar(current));
  const zoom=THREE.MathUtils.lerp(1,explodedZoom,current);if(camera.zoom!==zoom){camera.zoom=zoom;camera.updateProjectionMatrix();}viewControls.update(dt);
  const visible=parts.filter(p=>p.visible);if(visible.length)pipeline.setFloorHeight(Math.min(...visible.map(p=>p.userData.minY+p.position.y)));
  purchaseCallouts.update();
  if(faceDiffusion?.update())pipeline.invalidate();placePartAction();pipeline.render(dt);
});


