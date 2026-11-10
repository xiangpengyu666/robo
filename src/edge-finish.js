import * as THREE from 'three';

// Optical micro bevel: alter shading normals only, never the CAD envelope,
// screw holes, picking surface or assembly coordinates. Width is in scene units.
export function prepareEdgeFinish(geometry) {
  const p=geometry.attributes.position,count=p.count;
  const distances=new Float32Array(count*3).fill(1000);
  const adjacent=Array.from({length:3},()=>new Float32Array(count*3));
  const edges=new Map();
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const key=v=>`${Math.round(v.x*1e6)},${Math.round(v.y*1e6)},${Math.round(v.z*1e6)}`;
  for(let i=0;i<count;i+=3){
    a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);
    const vertices=[a.clone(),b.clone(),c.clone()];
    const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    const face={i,vertices,normal};
    for(let e=0;e<3;e++){
      const ka=key(vertices[(e+1)%3]),kb=key(vertices[(e+2)%3]);
      const edgeKey=ka<kb?ka+'|'+kb:kb+'|'+ka;
      const list=edges.get(edgeKey)||[];list.push({face,e});edges.set(edgeKey,list);
    }
  }
  let finished=0;
  for(const entries of edges.values()){
    if(entries.length!==2)continue;
    const [left,right]=entries;
    if(left.face.normal.dot(right.face.normal)>.72)continue;
    for(const [entry,other] of [[left,right],[right,left]]){
      const {face,e}=entry,opposite=face.vertices[e];
      const start=face.vertices[(e+1)%3],end=face.vertices[(e+2)%3];
      const inward=end.clone().sub(start).normalize().cross(face.normal);
      if(inward.dot(opposite.clone().sub(start))<0)inward.negate();
      for(let v=0;v<3;v++){
        distances[(face.i+v)*3+e]=Math.max(0,inward.dot(face.vertices[v].clone().sub(start)));
        other.face.normal.toArray(adjacent[e],(face.i+v)*3);
      }
    }
    finished++;
  }
  geometry.setAttribute('edgeDistance',new THREE.BufferAttribute(distances,3));
  adjacent.forEach((data,i)=>geometry.setAttribute('edgeNormal'+i,new THREE.BufferAttribute(data,3)));
  return finished;
}

const installed=new WeakSet();
export function applyEdgeFinish(material){
  if(!material.userData.roboEdgeWidth||installed.has(material))return;
  installed.add(material);
  const base=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=(shader,renderer)=>{
    base(shader,renderer);
    if(shader.vertexShader.includes('varying vec3 vEdgeDistance,'))return;
    shader.uniforms.roboEdgeWidth={value:material.userData.roboEdgeWidth};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      attribute vec3 edgeDistance,edgeNormal0,edgeNormal1,edgeNormal2;
      varying vec3 vEdgeDistance,vEdgeNormal0,vEdgeNormal1,vEdgeNormal2;`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vEdgeDistance=edgeDistance;
      vEdgeNormal0=normalMatrix*edgeNormal0;vEdgeNormal1=normalMatrix*edgeNormal1;vEdgeNormal2=normalMatrix*edgeNormal2;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform float roboEdgeWidth;
      varying vec3 vEdgeDistance,vEdgeNormal0,vEdgeNormal1,vEdgeNormal2;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`
      vec3 edgeWeight=vec3(1.0)-smoothstep(vec3(0.0),vec3(roboEdgeWidth),vEdgeDistance);
      normal=normalize(normal+vEdgeNormal0*edgeWeight.x+vEdgeNormal1*edgeWeight.y+vEdgeNormal2*edgeWeight.z);
      #include <normal_fragment_maps>`);
  };
  material.customProgramCacheKey=()=>key()+'-robo-edge-finish-v1';
  material.needsUpdate=true;
}
