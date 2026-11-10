import * as THREE from 'three';
// Leave each connector along its insertion axis, then use a shallow service
// plane outside all module envelopes. Round only short, clearance-safe corners.
export function routeWire(a,b,normalA,normalB,boxA,boxB,boxes,style='direct',lane=0){
 const clearance=.12+lane*.065;
 function exit(p,n,box){if(!box)return p.clone();let distance=0;for(const axis of ['x','y','z'])if(Math.abs(n[axis])>.5)distance=Math.max(distance,((n[axis]>0?box.max[axis]+clearance:box.min[axis]-clearance)-p[axis])/n[axis]);return p.clone().addScaledVector(n,Math.max(clearance,distance));}
 const startExit=exit(a,normalA,boxA),endExit=exit(b,normalB,boxB);
 const z=Math.max(...boxes.map(box=>box.max.z),startExit.z,endExit.z)+clearance;
 const frontA=new THREE.Vector3(startExit.x,startExit.y,z),frontB=new THREE.Vector3(endExit.x,endExit.y,z);
 // Use the direct connector-exit segment whenever it clears all envelopes.
 const direction=endExit.clone().sub(startExit),length=direction.length(),ray=new THREE.Ray(startExit,direction.clone().normalize());
 const clear=boxes.every(box=>{const hit=ray.intersectBox(box.clone().expandByScalar(.05),new THREE.Vector3());return !hit||hit.distanceTo(startExit)>length;});
 let raw=clear?[a,startExit,endExit,b]:[a,startExit,frontA,frontB,endExit,b];
 if(style==='overhead'){
  const left=boxA.min.x-.24-lane*.065,top=Math.max(...boxes.map(box=>box.max.y))+.38+lane*.065;
  raw=[a,startExit,frontA,new THREE.Vector3(left,frontA.y,z),new THREE.Vector3(left,top,z),new THREE.Vector3(endExit.x,top,endExit.z),endExit,b];
 }
 const points=raw.filter((p,i)=>i===0||p.distanceTo(raw[i-1])>1e-6);
 // Shortcut visibility-safe interior spans; retain only the connector leads.
 if(style!=='overhead')for(let i=1;i<points.length-2;i++)for(let j=points.length-2;j>i+1;j--){
  const delta=points[j].clone().sub(points[i]),distance=delta.length(),testRay=new THREE.Ray(points[i],delta.normalize());
  const safe=boxes.every(box=>{const hit=testRay.intersectBox(box.clone().expandByScalar(.05),new THREE.Vector3());return !hit||hit.distanceTo(points[i])>distance;});
  if(safe){points.splice(i+1,j-i-1);break;}
 }
 // Remove collinear waypoints rather than rounding artificial joints.
 for(let i=points.length-2;i>0;i--){const incoming=points[i].clone().sub(points[i-1]).normalize(),outgoing=points[i+1].clone().sub(points[i]).normalize();if(incoming.dot(outgoing)>.99999)points.splice(i,1);}
 const curve=new THREE.CurvePath();let last=points[0];
 for(let i=1;i<points.length-1;i++){const previous=points[i-1],corner=points[i],next=points[i+1],r=Math.min(style==='overhead'?.18:.045,corner.distanceTo(previous)*.22,corner.distanceTo(next)*.22);const before=corner.clone().add(previous.clone().sub(corner).normalize().multiplyScalar(r)),after=corner.clone().add(next.clone().sub(corner).normalize().multiplyScalar(r));curve.add(new THREE.LineCurve3(last,before));curve.add(new THREE.QuadraticBezierCurve3(before,corner,after));last=after;}
 curve.add(new THREE.LineCurve3(last,b));return curve;
}
