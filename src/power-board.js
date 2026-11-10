import * as THREE from 'three';
// Reference: 22 x 8 mm, 2.54 mm pad pitch, 17 mm mounting pitch, R1.5 holes. Thickness is illustrative.
export function createPowerBoard(){
 const g=new THREE.Group(),mask=new THREE.MeshStandardMaterial({color:'#287747',roughness:.55}),tin=new THREE.MeshStandardMaterial({color:'#c8cccb',metalness:.75,roughness:.3}),ink=new THREE.MeshBasicMaterial({color:'#f0eedb'});
 const shape=new THREE.Shape();shape.moveTo(-9,-4);shape.lineTo(9,-4);shape.quadraticCurveTo(11,-4,11,-2);shape.lineTo(11,2);shape.quadraticCurveTo(11,4,9,4);shape.lineTo(-9,4);shape.quadraticCurveTo(-11,4,-11,2);shape.lineTo(-11,-2);shape.quadraticCurveTo(-11,-4,-9,-4);shape.closePath();
 for(const x of [-8.5,8.5]){const h=new THREE.Path();h.absarc(x,0,1.5,0,Math.PI*2,true);shape.holes.push(h);}
 for(let i=0;i<5;i++)for(const z of [-1.27,1.27]){const h=new THREE.Path();h.absarc((2-i)*2.54,z,.65,0,Math.PI*2,true);shape.holes.push(h);}
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.9,bevelEnabled:false});geo.rotateX(-Math.PI/2);g.add(new THREE.Mesh(geo,mask));
 function line(x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.025,d),ink);m.position.set(x,.94,z);g.add(m);}
 for(let i=0;i<5;i++)for(const z of [-1.27,1.27]){const m=new THREE.Mesh(new THREE.RingGeometry(.65,.95,24),tin);m.rotation.x=-Math.PI/2;m.position.set((2-i)*2.54,.93,z);g.add(m);}
 line(0,0,12.6,.10);line(0,-2.55,12.6,.10);line(0,2.55,12.6,.10);for(const x of [-6.3,6.3])line(x,0,.10,5.1);
 for(const x of [-7,7]){line(x,-2.8,1,.12);line(x,-2.8,.12,1);line(x,2.8,1,.12);}
 return g;
}
