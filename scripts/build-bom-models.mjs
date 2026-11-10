import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { factories } from './bom-geometry.mjs';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
function surfaceRole(m){
 const n=m.name.toLowerCase();
 if(m.material.emissiveIntensity>1)return 'emitter';
 if(m.material.transmission>0)return 'translucent';
 if(m.material.metalness>.5)return /solder|joint|termination/.test(n)?'solder':'metal';
 if(/pcb|board/.test(n)||[0x155b48,0x171c20,0x16191c,0x202721,0x217346].includes(m.material.color.getHex()))return 'pcb';
 if(/socket|connector|plug/.test(n))return 'connector';
 if(/ic |mcu|chip|smd body/.test(n))return 'chip';
 return 'plastic';
}
const report=[];
for(const [key,make] of Object.entries(factories)){
 const raw=make();raw.updateMatrixWorld(true);
 const batches=new Map();
 raw.traverse(m=>{if(!m.isMesh)return;const material=m.material;const role=surfaceRole(m);const detailSurface=m.geometry.type==='ShapeGeometry'||/lead|pin|solder|contact|termination|silkscreen|label/i.test(m.name);const id=[material.type,material.color.getHex(),material.metalness,material.roughness,material.clearcoat,material.transmission,material.thickness,material.ior,material.side,material.emissive?.getHex(),material.emissiveIntensity,role,detailSurface].join(':');if(!batches.has(id))batches.set(id,{material,role,detailSurface,geometries:[]});batches.get(id).geometries.push(m.geometry.clone().applyMatrix4(m.matrixWorld));});
 const model=new THREE.Group();for(const {material,role,detailSurface,geometries} of batches.values()){const mixed=geometries.some(g=>g.index)&&geometries.some(g=>!g.index);const geometry=mergeGeometries(mixed?geometries.map(g=>g.index?g.toNonIndexed():g):geometries);if(!geometry)throw Error('Cannot merge component geometry');const mesh=new THREE.Mesh(geometry,material);mesh.userData.detailSurface=detailSurface;mesh.userData.surfaceRole=role;mesh.name=role;model.add(mesh);}
 model.name=key;model.userData={units:'millimeter',provenance:'Dimension-led display reconstruction; not manufacturer CAD'};
 const glb=await new GLTFExporter().parseAsync(model,{binary:true});
 await fs.writeFile(`public/models/components/${key}.glb`,Buffer.from(glb));
 const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
 report.push({model:key,sizeMM:size.toArray(),bytes:glb.byteLength});
}
await fs.writeFile('source-models/bom/geometry-report.json',JSON.stringify(report,null,2));
console.log(report);

