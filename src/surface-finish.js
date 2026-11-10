import * as THREE from 'three';

// Deterministic, non-color microtexture. Object-space projection avoids UV seams
// and keeps grain attached to a part while it moves in the exploded view.
let texture;
function microtexture() {
  if (texture) return texture;
  const size=128,data=new Uint8Array(size*size*4);
  let seed=1519;
  for(let i=0;i<size*size;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const n=seed>>>24;data.set([n,n,n,255],i*4);
  }
  texture=new THREE.DataTexture(data,size,size);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.generateMipmaps=true;texture.needsUpdate=true;
  return texture;
}

const installed=new WeakSet();
export function applySurfaceFinish(material) {
  const finish=material.userData.roboFinish;
  if(!finish||installed.has(material))return;
  installed.add(material);
  const base=material.onBeforeCompile.bind(material);
  const baseKey=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=(shader,renderer)=>{
    base(shader,renderer);
    // Threepipe clones may retain the source callback; make the patch idempotent.
    if(shader.vertexShader.includes('varying vec3 vFinishPosition;'))return;
    shader.uniforms.roboGrain={value:microtexture()};
    shader.uniforms.roboGrainScale={value:finish.scale};
    shader.uniforms.roboGrainHeight={value:finish.height};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      varying vec3 vFinishPosition;
      varying vec3 vFinishNormal;`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vFinishPosition=position;vFinishNormal=normal;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vFinishPosition;
      varying vec3 vFinishNormal;
      uniform sampler2D roboGrain;
      uniform float roboGrainScale;
      uniform float roboGrainHeight;
      float roboSurfaceGrain(){
        vec3 w=pow(abs(normalize(vFinishNormal)),vec3(6.0));
        w/=max(dot(w,vec3(1.0)),0.0001);
        vec3 p=vFinishPosition*roboGrainScale;
        return dot(w,vec3(texture2D(roboGrain,p.yz).r,texture2D(roboGrain,p.xz).r,texture2D(roboGrain,p.xy).r));
      }`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      float finishGrain=roboSurfaceGrain();
      roughnessFactor=clamp(roughnessFactor*(0.94+0.12*finishGrain),0.06,1.0);`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec3 fq0=dFdx(-vViewPosition),fq1=dFdy(-vViewPosition);
      vec3 fr1=cross(fq1,normal),fr2=cross(normal,fq0);
      float fdet=dot(fq0,fr1);
      float fh=finishGrain*roboGrainHeight;
      normal=normalize(abs(fdet)*normal-sign(fdet)*(dFdx(fh)*fr1+dFdy(fh)*fr2));`);
  };
  material.customProgramCacheKey=()=>baseKey()+'-robo-triplanar-finish-v1';
  material.needsUpdate=true;
}
