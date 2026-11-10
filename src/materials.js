import * as THREE from 'three';

// Lift eyes by 20% before tone mapping, compensating for the 15% exposure cut.
export const EYE_EMISSION_GAIN = 1.2 / 0.85;

// PLA Basic visual approximation; PBR values are not manufacturer measurements.
export const PLA_BASIC = Object.freeze({
  metalness: 0,
  roughness: 0.48,
  ior: 1.46,
  specularIntensity: 1,
  clearcoat: 0,
  transmission: 0,
});

// Photo-matched palette, inferred under non-neutral lighting rather than measured.
export const EXTERIOR_PALETTE = Object.freeze({
  head: '#F4F3ED',
  orange: '#F29324',
  structure: '#242629',
  arm: '#777B80',
  joint: '#DADBD6',
});
const HEAD = new Set(['part-18', 'part-25']);
// User-confirmed mapping: parts 23 and 24 are gray; part 17 stays black.
const ARMS = new Set(['part-23', 'part-24']);
const JOINTS = new Set(['part-5', 'part-6', 'part-7', 'part-9', 'part-10', 'part-11']);

export function refineModuleMaterial(mesh){
 const m=mesh.material;if(!m.isMeshStandardMaterial)return;
 const role=mesh.userData.surfaceRole;
 if(role==='emitter')m.emissiveIntensity*=EYE_EMISSION_GAIN;
 m.envMapIntensity=1;
 if(role==='metal'){m.metalness=1;m.roughness=.22;}
 if(role==='solder'){m.metalness=1;m.roughness=.29;}
 if(role==='pcb'){m.metalness=0;m.roughness=.34;}
 if(role==='chip'){m.metalness=0;m.roughness=.72;}
 if(role==='connector'){m.metalness=0;m.roughness=.46;}
 if(['pcb','chip','connector','plastic'].includes(role))m.userData.roboFinish={scale:.18,height:role==='chip'?.000045:.000025};
 // Preserve the authored transmission of the blue servo shell and LED membrane.
}
// Purchased ball bearing: polished silver steel (visual approximation).
export function createBearingMaterial() {
  return new THREE.MeshPhysicalMaterial({
    name: 'Bearing steel — polished silver',
    // The studio environment is mostly dark, so pure metalness renders near-black;
    // a partly diffuse response reads as brushed silver under this lighting.
    color: '#CDD1D6',
    metalness: .5,
    roughness: .26,
    clearcoat: .4,
    clearcoatRoughness: .12,
    envMapIntensity: 1.8,
  });
}
export function createPLAMaterial(partId) {
  const color = partId === 'part-26' ? EXTERIOR_PALETTE.orange
    : HEAD.has(partId) ? EXTERIOR_PALETTE.head
    : ARMS.has(partId) ? EXTERIOR_PALETTE.arm
    : JOINTS.has(partId) ? EXTERIOR_PALETTE.joint
    : EXTERIOR_PALETTE.structure;
  const material=new THREE.MeshPhysicalMaterial({
    ...PLA_BASIC,
    name: 'PLA Basic — photo-matched exterior',
    color,
    roughness: HEAD.has(partId)?.34:ARMS.has(partId)?.42:.32,
    envMapIntensity:HEAD.has(partId)?1:1.35,
    // Stable depth ordering at the STEP front cover's coincident seam.
    polygonOffset: partId === 'part-25',
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  material.userData.roboFinish={scale:18,height:HEAD.has(partId)?.000055:.00007};
  material.userData.roboEdgeWidth=.0014;
  return material;
}
