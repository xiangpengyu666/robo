import * as THREE from 'three';
import { EYE_EMISSION_GAIN } from './materials.js';

// Real-time diffusion approximation driven by LED positions, not path tracing.
export function createFaceDiffusion(parts, mmScale) {
  const panel=parts.find(p=>p.userData.partId==='part-25');
  const leds=parts.find(p=>p.userData.partId==='part-13');
  const mesh=panel.children[0], visual=leds.children[0], pixels=[], blinkRows=[];
  for(const x of [-16,16])for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    if(((row===2||row===5)&&(col===3||col===4))||((row===3||row===4)&&col>=2&&col<=5)){
      pixels.push(new THREE.Vector3(x+(col-3.5)*3.9,9.23,(row-3.5)*3.9));
      // Local +Z maps to world +Y: row 4 is the fourth row from the top.
      blinkRows.push(row===4?1:0);
    }
  }
  const startedAt=performance.now(), blink={value:0};
  const uniforms={roboAssemblyInverse:{value:new THREE.Matrix4()},roboPixels:{value:pixels.map(()=>new THREE.Vector3())},roboPixelOn:{value:pixels.map(()=>1)},roboEnabled:{value:1},roboScale:{value:mmScale}};
  // The exported LED lenses are batched; mask their local row without hiding geometry.
  const offColor=new THREE.Color('#69716e');
  visual.traverse(obj=>{
    if(!obj.isMesh||obj.userData.surfaceRole!=='emitter')return;
    const material=obj.material, compile=material.onBeforeCompile.bind(material), key=material.customProgramCacheKey.bind(material);
    material.onBeforeCompile=(shader,renderer)=>{
      compile(shader,renderer);
      shader.uniforms.roboBlink=blink;
      shader.uniforms.roboUnlitColor={value:offColor};
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float vEyeRow;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEyeRow=position.z;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vEyeRow;\nuniform float roboBlink;\nuniform vec3 roboUnlitColor;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float eyeOn=1.0-roboBlink*(1.0-step(abs(vEyeRow-1.95),1.7));
        diffuseColor.rgb=mix(roboUnlitColor,diffuseColor.rgb,eyeOn);
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=eyeOn;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(0.65,roughnessFactor,eyeOn);');
    };
    material.customProgramCacheKey=()=>key()+'-robo-blink-v1';
    material.needsUpdate=true;
  });
  const baseCompile=mesh.material.onBeforeCompile.bind(mesh.material);
  mesh.material.onBeforeCompile=(shader,renderer)=>{
    baseCompile(shader,renderer);
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 roboAssemblyInverse;\nvarying vec3 vRoboPosition;\nvarying vec3 vRoboNormal;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRoboPosition=(roboAssemblyInverse*modelMatrix*vec4(position,1.0)).xyz;\nvRoboNormal=normalize(mat3(roboAssemblyInverse*modelMatrix)*normal);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vRoboPosition;
      varying vec3 vRoboNormal;
      uniform vec3 roboPixels[24];
      uniform float roboPixelOn[24];
      uniform float roboEnabled;
      uniform float roboScale;
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      float glow=0.0;
      for(int i=0;i<24;i++){
        vec3 delta=(vRoboPosition-roboPixels[i])/roboScale;
        float depth=max(delta.x,0.0);
        float blur=0.45+depth*0.10;
        vec2 outside=max(abs(delta.yz)-vec2(1.48),vec2(0.0));
        float footprint=exp(-dot(outside,outside)/(2.0*blur*blur));
        float halo=exp(-dot(delta.yz,delta.yz)/(2.0*pow(blur+2.0,2.0)));
        // A sharp transmitted core plus a restrained broad scattering lobe.
        // Fade out once the front cover moves away in the exploded view.
        glow+=roboPixelOn[i]*(0.97*footprint+0.03*halo)*exp(-depth*0.09)*step(-0.1,delta.x)*(1.0-smoothstep(8.0,22.0,depth));
      }
      float front=smoothstep(0.65,0.95,vRoboNormal.x);
      totalEmissiveRadiance+=vec3(1.0,0.72,0.22)*min(glow,1.5)*2.6*${EYE_EMISSION_GAIN.toFixed(8)}*front*roboEnabled;
    `);
  };
  const baseKey=mesh.material.customProgramCacheKey.bind(mesh.material);
  mesh.material.customProgramCacheKey=()=>baseKey()+'-robo-front-diffusion-v6';
  mesh.material.needsUpdate=true;
  return {update(now=performance.now()){
    const elapsed=Math.max(0,now-startedAt);
    const closed=elapsed>=3000&&elapsed%3000<225?1:0;
    const changed=blink.value!==closed;
    blink.value=closed;
    uniforms.roboPixelOn.value.forEach((_,i)=>{uniforms.roboPixelOn.value[i]=closed?blinkRows[i]:1;});
    visual.updateWorldMatrix(true,false);
    uniforms.roboAssemblyInverse.value.copy(panel.parent.matrixWorld).invert();
    pixels.forEach((p,i)=>uniforms.roboPixels.value[i].copy(p).applyMatrix4(visual.matrixWorld).applyMatrix4(uniforms.roboAssemblyInverse.value));
    uniforms.roboEnabled.value=leds.visible&&panel.visible?1:0;
    return changed;
  }};
}
