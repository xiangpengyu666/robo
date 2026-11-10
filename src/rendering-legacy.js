import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createStudioEnvironment } from './studio-environment.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createRenderingPipeline(renderer, scene, camera) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  scene.background = new THREE.Color('#030508');

  const environment=createStudioEnvironment(renderer);
  const tutorialRoom=new RoomEnvironment(), tutorialGenerator=new THREE.PMREMGenerator(renderer);
  const tutorialEnvironment=tutorialGenerator.fromScene(tutorialRoom,.04);
  tutorialRoom.dispose();tutorialGenerator.dispose();
  scene.environment=environment.texture;
  scene.environmentIntensity=.55;

  // Neutral studio key and fill avoid tinting the white PLA green.
  const key = new THREE.DirectionalLight('#fff7ed', .5);
  key.position.set(2, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.1, far: 25 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.radius = 6; key.shadow.blurSamples=12;
  key.shadow.bias = 0.00008;
  key.shadow.normalBias = 0.003;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#e6edff', 0.35);
  fill.position.set(-4, 2, 1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight('#cbdfff', 0.55);
  rim.position.set(-3, 2, -4);
  scene.add(rim);

  RectAreaLightUniformsLib.init();
  const softbox=new THREE.RectAreaLight('#fffaf2',3.2,5,4);softbox.position.set(0,5,0);softbox.lookAt(0,.5,0);scene.add(softbox);
  const strip=new THREE.RectAreaLight('#b7d4ff',3.0,1.8,4.5);strip.position.set(-3,2,-3);strip.lookAt(0,.5,0);scene.add(strip);
  const front=new THREE.RectAreaLight('#f5f7ff',2.4,4,5);front.position.set(4,2.5,3);front.lookAt(0,.5,0);scene.add(front);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({color:'#030508', roughness:.82, metalness:0}),
  );
  const backdropFog=new THREE.FogExp2('#030508',.065);scene.fog=backdropFog;
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.visible = false;
  scene.add(floor);

  // HDR linear lighting -> contact occlusion -> edge AA -> display transform.
  // The renderer's antialias flag does not multisample offscreen post-processing.
  // Resolve real geometry edges in HDR before AO, bloom and the display transform.
  const hdrTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, samples: Math.min(4, renderer.capabilities.maxSamples),
  });
  const composer = new EffectComposer(renderer, hdrTarget);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 1, 1);
  ao.updateGtaoMaterial({radius:0.075, thickness:0.035, distanceExponent:2, distanceFallOff:0.6, scale:1});
  ao.updatePdMaterial({radius:5, lumaPhi:10, depthPhi:2, normalPhi:3});
  ao.blendIntensity = 0.22;
  composer.addPass(ao);
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.025,.2,3.5);
  composer.addPass(bloom);
  composer.addPass(new SMAAPass());
  composer.addPass(new OutputPass());
  let width = 1, height = 1, quality = 'studio', profile = 'explore';

  function resize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    // Bound GPU cost on high-DPI/mobile screens.
    const ratio = Math.min(window.devicePixelRatio || 1, quality === 'studio' ? 2 : 1);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);
    composer.setPixelRatio(ratio);
    composer.setSize(width, height);
  }

  return {
    resize,
    setProfile(value){
      profile=value;const teaching=value==='teach';
      scene.environment=teaching?tutorialEnvironment.texture:environment.texture;
      scene.background.set('#030508');
      scene.environmentIntensity=teaching?.65:.55;
      key.intensity=teaching?.8:.5;key.castShadow=!teaching;
      softbox.intensity=teaching?1.4:3.2;strip.intensity=teaching?.8:3;front.intensity=teaching?.6:2.4;
      rim.intensity=teaching?.3:.55;scene.fog=teaching?null:backdropFog;bloom.enabled=!teaching&&quality==='studio';
      ao.enabled=!teaching&&quality==='studio';floor.visible=!teaching;
    },
    render: dt => composer.render(dt),
    setQuality(value) {
      quality = value === 'studio' ? 'studio' : 'light';
      ao.enabled = quality === 'studio' && profile !== 'teach';
      bloom.enabled=ao.enabled;
      for (const target of [composer.renderTarget1, composer.renderTarget2]) {
        const samples = quality === 'studio' ? Math.min(4, renderer.capabilities.maxSamples) : 0;
        if (target.samples !== samples) { target.samples = samples; target.dispose(); }
      }
      key.shadow.mapSize.setScalar(quality === 'studio' ? 4096 : 2048);
      key.shadow.map?.dispose(); key.shadow.map = null;
      key.shadow.mapPass?.dispose(); key.shadow.mapPass = null;
      resize(width, height);
    },
    setFloorHeight(y) {
      floor.position.y = y - 0.025;
      floor.visible = profile !== 'teach';
    },
    dispose() {
      composer.passes.forEach(pass => pass.dispose?.());
      composer.dispose();
      environment.dispose();tutorialEnvironment.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      key.shadow.dispose();
      scene.remove(floor, key, fill, rim, softbox, strip, front);
      scene.environment = null;
    },
  };
}




