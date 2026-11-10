import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BOM_PARTS } from '../src/bom-config.js';
const expected={servo:[42.05,31.22,12.55],matrix:[63.6,11.23,37],nano:[18,14.8,44],camera:[25,4.54,8],hub:[53,9.54,35]};
const loader=new GLTFLoader();
for(const [key,dimensions] of Object.entries(expected)){
 const buffer=await fs.readFile(`public/models/components/${key}.glb`);
 const asset=await loader.parseAsync(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
 const actual=new THREE.Box3().setFromObject(asset.scene).getSize(new THREE.Vector3()).toArray();
 actual.forEach((value,i)=>assert(Math.abs(value-dimensions[i])<.02,`${key}: unexpected dimensions`));
 if(key==='matrix'){let frosted=false;asset.scene.traverse(m=>{if(m.isMesh&&m.material.transmission>.8&&m.material.roughness>.4)frosted=true;});assert(frosted,'Matrix rear must retain frosted transmission');}
 if(key==='servo'){let shell=false;asset.scene.traverse(m=>{if(m.isMesh&&m.material.transmission>.4)shell=true;});assert(shell,'Servo must retain translucent physical shell');}
 let count=0;
 asset.scene.traverse(obj=>{if(!obj.isMesh)return;count++;assert(obj.material.color);assert(obj.geometry.getAttribute('position').array.every(Number.isFinite));if(obj.geometry.index)assert(obj.geometry.index.array.every(i=>i<obj.geometry.getAttribute('position').count));else assert.equal(obj.geometry.getAttribute('position').count%3,0);});
 assert(count>1&&count<28,`${key}: expected batched, multi-material model`);
}
assert.equal(Object.keys(BOM_PARTS).length,7);
assert(!BOM_PARTS['part-19']&&!BOM_PARTS['part-26']);
assert.equal(BOM_PARTS['part-4'].rotationX,Math.PI/2);
assert.equal(BOM_PARTS['part-8'].rotationX,-Math.PI/2);
console.log('PASS: 5 GLBs parse with valid geometry, expected millimeter bounds, material batches and 7 assembly mappings.');
// Regression: silkscreen must not project beneath any raised Nano component.
const { factories } = await import('./bom-geometry.mjs');
const nano=factories.nano();nano.updateMatrixWorld(true);
const labels=[],raised=[];
nano.traverse(mesh=>{
 if(!mesh.isMesh)return;
 const bounds=new THREE.Box3().setFromObject(mesh);
 if(mesh.name.startsWith('Silkscreen '))labels.push({mesh,bounds});
 else if(bounds.max.y>.9)raised.push({mesh,bounds});
});
for(const label of labels)for(const item of raised){
 const overlapX=Math.min(label.bounds.max.x,item.bounds.max.x)-Math.max(label.bounds.min.x,item.bounds.min.x);
 const overlapZ=Math.min(label.bounds.max.z,item.bounds.max.z)-Math.max(label.bounds.min.z,item.bounds.min.z);
 assert(!(overlapX>.01&&overlapZ>.01),`${label.mesh.name} obscured by ${item.mesh.name}`);
}
assert.equal(labels.length,32);
const original=await fs.readFile('public/models/robocam.glb');
const assembly=await loader.parseAsync(original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength),'');
let assemblyMeshes=0;
assembly.scene.traverse(mesh=>{if(!mesh.isMesh)return;assemblyMeshes++;for(const name of ['position','normal']){const attr=mesh.geometry.getAttribute(name);assert(attr&&attr.array.every(Number.isFinite),`Invalid assembly ${name}`);}});
assert.equal(assemblyMeshes,26);
console.log('PASS: 32 Nano labels clear of raised components; all 26 original assembly meshes have finite positions and normals.');
