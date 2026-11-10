import {ThreeViewer,GBufferPlugin,SSAAPlugin,SSAOPlugin,ProgressivePlugin,TonemapPlugin} from 'threepipe';
import {BloomPlugin,SSReflectionPlugin,TemporalAAPlugin,DepthOfFieldPlugin} from '@threepipe/webgi-plugins';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createStudioEnvironment } from './studio-environment.js';
import { applySurfaceFinish } from './surface-finish.js';
import { applyEdgeFinish } from './edge-finish.js';

export function createRenderingPipeline(host, camera) {
  const canvas=document.createElement('canvas');
  canvas.style.width='100%';canvas.style.height='100%';
  host.prepend(canvas);
  const viewer=new ThreeViewer({
    canvas,camera,msaa:true,rgbm:false,renderScale:'auto',
    backgroundColor:'#f9f9f9',
    plugins:[GBufferPlugin,BloomPlugin,SSAAPlugin,SSAOPlugin,SSReflectionPlugin,TemporalAAPlugin,DepthOfFieldPlugin],
  });
  const scene=viewer.scene,renderer=viewer.renderManager.webglRenderer;
  // Both prefiltered environments are reused when switching teaching modes.
  scene.autoDisposeSceneMaps=false;
  camera.userData.autoLookAtTarget=false;
  camera.userData.autoNearFar=false;
  camera.userData.minNearPlane=.01;camera.userData.maxFarPlane=100;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene.background = new THREE.Color('#f9f9f9');

  const environment=createStudioEnvironment(renderer);
  const tutorialRoom=new RoomEnvironment(), tutorialGenerator=new THREE.PMREMGenerator(renderer);
  const tutorialEnvironment=tutorialGenerator.fromScene(tutorialRoom,.04);
  tutorialRoom.dispose();tutorialGenerator.dispose();
  scene.environment=environment.texture;
  scene.environmentIntensity=.68;

  // Neutral studio key and fill avoid tinting the white PLA green.
  const key = new THREE.DirectionalLight('#fff7ed', .65);
  key.position.set(2, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 0.1, far: 20 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.radius = 6; key.shadow.blurSamples=12;
  key.shadow.bias = 0.00008;
  key.shadow.normalBias = 0.001;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#f3f5ff', 0.5);
  fill.position.set(3, 1, -4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight('#d8e5ff', 0.85);
  rim.position.set(-3, 2, -4);
  scene.add(rim);

  RectAreaLightUniformsLib.init();
  const softbox=new THREE.RectAreaLight('#fffaf2',4.0,4,3);softbox.position.set(.5,4.5,0);softbox.lookAt(0,.5,0);scene.add(softbox);
  const strip=new THREE.RectAreaLight('#d2e3ff',5,1.2,4.5);strip.position.set(-3,1,-3);strip.lookAt(0,.2,0);scene.add(strip);
  // Broad frontal fill lifts the face and black support without flat ambient wash.
  const front=new THREE.RectAreaLight('#fffaf4',2.7,4.5,5);front.position.set(4.5,1.6,1.5);front.lookAt(0,.2,0);scene.add(front);
  const bounce=new THREE.RectAreaLight('#f0f3fa',1.2,3,2);bounce.position.set(3,-1.7,1);bounce.lookAt(0,-.5,0);scene.add(bounce);
  const edge=new THREE.RectAreaLight('#e8efff',4,.65,3.5);edge.position.set(-2,.5,3);edge.lookAt(0,-.25,0);scene.add(edge);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(10, 96),
    new THREE.ShadowMaterial({color:'#594536',opacity:.16,transparent:true,depthWrite:false,toneMapped:false}),
  );
  // Transparent shadow catcher keeps the studio continuous with the page.
  scene.fog=null;
  floor.rotation.x = -Math.PI / 2;
  // Ground projection is disabled; keep self-shadowing on the product.
  floor.receiveShadow = false;
  floor.visible = false;
  scene.add(floor);

  // Same official pipeline as webgi.dev: G-buffer, SSR/AO, temporal and
  // progressive AA, HDR bloom, then a single display tone mapping pass.
  const ssaa=viewer.getPlugin(SSAAPlugin);
  ssaa.rendersPerFrame=2;
  ssaa.jitterRenderCamera=true;
  ssaa.jitterLightCameras=true;
  ssaa.trackedJitterCameras.set(key.shadow.camera,key.shadow.mapSize);
  ssaa.setDirty();
  viewer.getPlugin(ProgressivePlugin).maxFrameCount=64;
  const ao=viewer.getPlugin(SSAOPlugin);
  Object.assign(ao.pass,{intensity:.3,bias:.001,falloff:1.25,numSamples:16});
  const reflection=viewer.getPlugin(SSReflectionPlugin);
  Object.assign(reflection.pass,{intensity:.65,objectRadius:.001,tolerance:.8});
  const taa=viewer.getPlugin(TemporalAAPlugin);
  taa.pass.feedBack.set(.82,.94);
  const bloom=viewer.getPlugin(BloomPlugin);
  Object.assign(bloom.pass,{intensity:.085,threshold:2,bloomIterations:4});
  // Keep all parts legible for inspection and wiring; optical blur is off.
  viewer.getPlugin(DepthOfFieldPlugin).enabled=false;
  const tonemap=viewer.getPlugin(TonemapPlugin);
  tonemap.toneMapping=THREE.ACESFilmicToneMapping;
  tonemap.exposure=0.64*0.85; // Reduce the approved studio exposure by 15%.
  // Keep the backdrop in display color so it matches the CSS warm white.
  tonemap.tonemapBackground=false;
  canvas.dataset.renderer='threepipe-webgi';
  viewer.addEventListener('postFrame',()=>{canvas.dataset.renderSamples=String(viewer.renderManager.frameCount);});
  let lastState='';
  const registered=new WeakSet();
  function prepare(root){
    root.traverse(obj=>{
      if(!obj.isMesh)return;
      const convert=material=>{
        if(registered.has(material))return material;
        const upgraded=viewer.assetManager.materials.convertToIMaterial(material);
        viewer.assetManager.materials.registerMaterial(upgraded);
        applySurfaceFinish(upgraded);
        applyEdgeFinish(upgraded);
        if(upgraded.userData.roboGroundFade){
          const base=upgraded.onBeforeCompile.bind(upgraded),cacheKey=upgraded.customProgramCacheKey.bind(upgraded);
          upgraded.onBeforeCompile=(shader,renderer)=>{
            base(shader,renderer);
            shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGroundPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGroundPosition=(modelMatrix*vec4(position,1.0)).xyz;');
            shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGroundPosition;').replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=1.0-smoothstep(3.0,10.0,length(vGroundPosition.xz));');
          };
          upgraded.customProgramCacheKey=()=>cacheKey()+'-robo-ground-fade-v1';
          upgraded.needsUpdate=true;
        }
        registered.add(upgraded);
        return upgraded;
      };
      obj.material=Array.isArray(obj.material)?obj.material.map(convert):convert(obj.material);
    });
  }
  function render(){
    prepare(scene);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const state=[profile,quality,camera.zoom,...camera.matrixWorld.elements];
    scene.traverse(obj=>{
      state.push(obj.id,obj.visible,...obj.matrix.elements);
      if(obj.isMesh){
        state.push(obj.geometry.drawRange.count,obj.geometry.attributes.position?.version);
        for(const m of (Array.isArray(obj.material)?obj.material:[obj.material])){
          state.push(m.id,m.color?.getHex(),m.emissive?.getHex(),m.opacity);
        }
      }
    });
    const stamp=state.join(',');
    if(stamp!==lastState){lastState=stamp;viewer.setDirty();}
  }
  let width = 1, height = 1, quality = 'studio', profile = 'explore';

  function resize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    // Bound GPU memory on large/high-DPI monitors without sacrificing ordinary desktop sharpness.
    const desired=quality==='studio'?Math.max(1.25,Math.min(window.devicePixelRatio||1,2)):1;
    viewer.renderManager.renderScale=Math.min(desired,Math.sqrt((quality==='studio'?5000000:2500000)/(width*height)));
    viewer.resize();
  }

  return {
    resize, renderer, scene, camera, prepare,
    invalidate(){viewer.setDirty();},
    onFrame(callback){viewer.addEventListener('preFrame',callback);},
    setProfile(value){
      profile=value;const teaching=value==='teach';
      scene.environment=teaching?tutorialEnvironment.texture:environment.texture;
      scene.background.set('#f9f9f9');
      scene.environmentIntensity=teaching?.65:.68;
      key.intensity=teaching?.8:.65;key.castShadow=!teaching;
      fill.intensity=teaching?.35:.5;
      softbox.intensity=teaching?1.4:4;strip.intensity=teaching?.8:5;front.intensity=teaching?.6:2.7;bounce.intensity=teaching?0:1.2;
      edge.intensity=teaching?0:4;
      tonemap.exposure=teaching?.65:.64*0.85;
      rim.intensity=teaching?.3:.85;scene.fog=null;bloom.enabled=!teaching&&quality==='studio';
      ao.enabled=!teaching&&quality==='studio';reflection.enabled=ao.enabled;taa.enabled=quality==='studio'&&!teaching;floor.visible=false;viewer.setDirty();
    },
    render,
    setQuality(value) {
      quality = value === 'studio' ? 'studio' : 'light';
      ao.enabled = quality === 'studio' && profile !== 'teach';
      bloom.enabled=ao.enabled;
      reflection.enabled=ao.enabled;
      taa.enabled=quality==='studio'&&profile!=='teach';
      ssaa.enabled=quality==='studio';
      ssaa.rendersPerFrame=quality==='studio'?2:1;ssaa.setDirty();
      resize(width, height);
    },
    setFloorHeight(y) {
      floor.position.y = y - 0.025;
      floor.visible = false;
    },
    dispose() {
      environment.dispose();tutorialEnvironment.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      key.shadow.dispose();
      scene.remove(floor, key, fill, rim, softbox, strip, front, bounce, edge);
      scene.environment = null;viewer.dispose();
    },
  };
}




