import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {BOM_PARTS,SHELL_PARTS} from '../src/bom-config.js';
import {planExplosion,effectiveVisibility} from '../src/explosion.js';
import {createPowerBoard} from '../src/power-board.js';
const loader=new GLTFLoader();
async function read(path){const b=await fs.readFile('public/models/'+path);return (await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
const assembly=await read('robocam.glb');
const box=new THREE.Box3().setFromObject(assembly),center=box.getCenter(new THREE.Vector3()),scale=2.8/Math.max(...box.getSize(new THREE.Vector3()).toArray());
const meshes=[];assembly.traverse(m=>{if(m.isMesh)meshes.push(m);});
const items=[];const solids=[];
for(let i=0;i<meshes.length;i++){
 const mesh=meshes[i],id=mesh.userData.partId||`part-${i+1}`,config=BOM_PARTS[id];mesh.geometry.computeBoundingBox();
 let visual;
 if(config){visual=await read(`components/${config.model}.glb`);if(config.frontFacing)visual.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0)));else visual.rotation.set(config.rotationX||0,config.rotationY||0,0);visual.position.copy(mesh.geometry.boundingBox.getCenter(new THREE.Vector3()));visual.position.x+=config.offsetX||0;visual.position.sub(center).multiplyScalar(scale);visual.scale.setScalar(scale);}
 else {visual=new THREE.Mesh(mesh.geometry.clone());visual.geometry.translate(-center.x,-center.y,-center.z);visual.geometry.scale(scale,scale,scale);}
 visual.updateMatrixWorld(true);solids.push(visual);items.push({id,bounds:new THREE.Box3().setFromObject(visual)});
}
const power=createPowerBoard();power.scale.setScalar(scale);power.rotation.x=Math.PI;power.position.set(-.25,1.18,0);items.push({id:'part-27',bounds:new THREE.Box3().setFromObject(power)});
power.updateMatrixWorld(true);
const obstacleMeshes=[];for(const solid of solids)solid.traverse(m=>{if(m.isMesh){m.material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});obstacleMeshes.push(m);}});
const ray=new THREE.Raycaster();let hits=0;
power.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position,ix=g.index;const count=ix?ix.count:p.count;for(let t=0;t<count;t+=3)for(let edge=0;edge<3;edge++){const a=m.localToWorld(new THREE.Vector3().fromBufferAttribute(p,ix?ix.getX(t+edge):t+edge)),b=m.localToWorld(new THREE.Vector3().fromBufferAttribute(p,ix?ix.getX(t+(edge+1)%3):t+(edge+1)%3)),d=b.sub(a);ray.set(a,d.clone().normalize());ray.near=.000001;ray.far=d.length();hits+=ray.intersectObjects(obstacleMeshes,false).length;}});
assert.equal(hits,0,'Distribution board geometry intersects existing assembly');
console.log('PASS: distribution board triangle edges clear existing assembly surfaces.');
const offsets=planExplosion(items),axes=['x','y','z'];
function volume(a,b){return axes.reduce((v,k)=>v*Math.max(0,Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])),1);}
let initialPairs=0;
for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
 let previous=volume(items[a].bounds,items[b].bounds);if(previous>1e-10)initialPairs++;
 // This intentionally includes hidden part 19: visibility must not alter paths.
 for(let step=0;step<=100;step++){
  const t=step/100,ba=items[a].bounds.clone().translate(offsets[a].clone().multiplyScalar(t)),bb=items[b].bounds.clone().translate(offsets[b].clone().multiplyScalar(t));
  const overlap=volume(ba,bb);assert(overlap<=previous+1e-9,`New/deeper overlap ${items[a].id}/${items[b].id} at ${step}%`);previous=overlap;
  if(step===100)assert(!ba.intersectsBox(bb),`Endpoint overlap ${items[a].id}/${items[b].id}`);
 }
}
const hidden=new Set(['part-19','part-14']);
assert(!effectiveVisibility('part-19',hidden,false,SHELL_PARTS));assert(!effectiveVisibility('part-14',hidden,false,SHELL_PARTS));assert(!effectiveVisibility('part-25',hidden,true,SHELL_PARTS));assert(effectiveVisibility('part-25',hidden,false,SHELL_PARTS));
console.log(`PASS: 27 parts / 351 pairs / 101 positions, no new or increased envelope overlaps; all endpoints separated. ${initialPairs} initially nested envelope pairs (not proof of surface collisions). Visibility precedence passed.`);

assert(effectiveVisibility('part-25',hidden,true,SHELL_PARTS,new Set(['part-25'])));
assert(!effectiveVisibility('part-18',hidden,true,SHELL_PARTS,new Set(['part-25'])));
