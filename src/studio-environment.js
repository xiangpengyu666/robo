import * as THREE from 'three';

// HDR reflection cards are captured only once. No remote HDRI or per-frame capture.
export function createStudioEnvironment(renderer) {
  const studio=new THREE.Scene();studio.background=new THREE.Color(.028,.032,.04);
  const cards=[];
  function card(color,intensity,width,height,position){
    const material=new THREE.ShaderMaterial({
      uniforms:{radiance:{value:new THREE.Color(color).multiplyScalar(intensity)}},
      vertexShader:'varying vec2 cardUV; void main(){cardUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec2 cardUV; uniform vec3 radiance; void main(){vec2 d=abs(cardUV-.5)*2.0; float feather=(1.0-smoothstep(.65,1.0,d.x))*(1.0-smoothstep(.65,1.0,d.y)); gl_FragColor=vec4(radiance*feather,1.0);}',
      side:THREE.DoubleSide,toneMapped:false,
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
    mesh.position.set(...position);mesh.lookAt(0,0,0);studio.add(mesh);cards.push(mesh);
  }
  card('#fff8ee',6.5,5,4,[1,4.5,.3]);
  card('#f3f7ff',4.5,2.5,5,[4,2,3]);
  card('#d2e3ff',7,1.2,4.5,[-3,1,-3]);
  card('#edf2ff',4,1.4,4,[1,1,-4]);
  card('#ecf2ff',6,.7,4,[-2,1,3]);
  card('#ffffff',1.2,4,4,[-3,1,4]);
  card('#d9e2ee',.6,3,2,[2,-2,2]);
  const generator=new THREE.PMREMGenerator(renderer);
  const target=generator.fromScene(studio,.025,.1,30);
  generator.dispose();cards.forEach(m=>{m.geometry.dispose();m.material.dispose();});
  return target;
}
