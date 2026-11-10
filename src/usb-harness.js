import * as THREE from 'three';

// Hub pin order follows the supplied front-view drawing. Connector geometry
// remains illustrative; Type-C and camera cable internals require matched cables.
export function createUsbHarness({a,b,normalA,normalB,sideA,sideB,boxA,boxB,boxes,typeA='four',typeB='four',widthA=.19,widthB=.24,profileA='hub',profileB='hub'}){
 const group=new THREE.Group(),wires=[],curves=[];
 function plug(point,normal,side,type,width,profile){
  const depth=type==='four'?.035:.13,height=type==='four'?(profile==='camera'?.035:.06):.085;
  const insertion=type==='four'?(profile==='camera'?.022:.125):type==='typeC'?.10:0;
  const holder=new THREE.Group(),up=new THREE.Vector3().crossVectors(normal,side).normalize();
  holder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,up,normal));holder.position.copy(point);group.add(holder);
  function block(size,position,color,metalness=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.3:.52}));mesh.position.set(...position);holder.add(mesh);return mesh;}
  if(type==='four'){
   const body=block([width,height,depth+insertion],[0,0,(depth-insertion)/2],'#eee9db');body.name='Seated 4-pin plug housing';
   holder.userData.seating={insertion,exposed:depth,profile};
   // Raised latch and four moulded wire-entry channels.
   block([width*.38,.018,depth*.55],[0,height/2+.009,-insertion*.25],'#faf5e8');
   for(let i=0;i<4;i++)block([width*.115,height*.52,.006],[(i-1.5)*width*.2,0,depth+.002],'#424442');
  }else{
   if(type==='typeC'){
    // Hollow mating sleeve surrounds the receptacle tongue, seated behind its lip.
    for(const sign of [-1,1]){block([width,.009,insertion],[0,sign*.028,-insertion/2],'#b9bec3',.85);block([.009,.047,insertion],[sign*(width/2-.0045),0,-insertion/2],'#b9bec3',.85);}
    holder.userData.seating={insertion,exposed:depth,profile:'typeC'};
   }else block([width,.065,.12],[0,0,-.06],'#b9bec3',.85);
   block([width*1.06,height,depth],[0,0,depth/2],'#292c2d');
   for(let i=0;i<3;i++)block([width*.7,height*.8,.01],[0,0,depth+.012+i*.015],'#343839');
  }
  return {holder,back:point.clone().addScaledVector(normal,depth+(type==='four'?.006:.05)),pitch:width*.2};
 }
 const first=plug(a,normalA,sideA,typeA,widthA,profileA),last=plug(b,normalB,sideB,typeB,widthB,profileB);
 // Tangent-continuous bends follow the plug axes with a generous turn radius.
 const span=first.back.distanceTo(last.back);
 const center=new THREE.CurvePath();
 if(typeB==='usbA'){
  // The upstream lead has facing ends: use one direct, tangent-aligned span.
  center.add(new THREE.CubicBezierCurve3(first.back,first.back.clone().addScaledVector(normalA,span/3),last.back.clone().addScaledVector(normalB,span/3),last.back));
 }else{
 const approach=last.back.clone().sub(first.back);approach.addScaledVector(normalB,-approach.dot(normalB)).normalize();
 const radius=Math.max(.28,span*.32);
 const turnStart=last.back.clone().addScaledVector(normalB,radius).addScaledVector(approach,-radius);
 if(normalA.dot(approach)<.5){
  const startTurn=first.back.clone().addScaledVector(normalA,radius).addScaledVector(approach,radius);
  center.add(new THREE.CubicBezierCurve3(first.back,first.back.clone().addScaledVector(normalA,radius*.55228475),startTurn.clone().addScaledVector(approach,-radius*.55228475),startTurn));
  center.add(new THREE.CubicBezierCurve3(startTurn,startTurn.clone().addScaledVector(approach,span*.22),turnStart.clone().addScaledVector(approach,-span*.22),turnStart));
 }else center.add(new THREE.CubicBezierCurve3(first.back,first.back.clone().addScaledVector(normalA,span*.32),turnStart.clone().addScaledVector(approach,-span*.25),turnStart));
 center.add(new THREE.CubicBezierCurve3(turnStart,turnStart.clone().addScaledVector(approach,radius*.55228475),last.back.clone().addScaledVector(normalB,radius*.55228475),last.back));
 }
 // Parallel transport the cable cross-section along the curve. Interpolating
 // world-space offsets can collapse the ribbon and make the conductors cross.
 const frames=[],tangents=[];let frame=sideA.clone(),previous=center.getTangentAt(0);
 for(let j=0;j<=240;j++){
  const tangent=center.getTangentAt(j/240).normalize();
  frame.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(previous,tangent));
  frame.addScaledVector(tangent,-frame.dot(tangent)).normalize();
  frames.push(frame.clone());tangents.push(tangent);previous=tangent;
 }
 // Downstream Hub pins run GND, D+, D-, 5V along local +X.
 // Reverse wire order without rotating the plug body or its latch.
 const wireSideB=sideB.clone().multiplyScalar(typeB==='four'&&profileB==='hub'?-1:1);
 const twist=Math.atan2(tangents[240].dot(new THREE.Vector3().crossVectors(frames[240],wireSideB)),frames[240].dot(wireSideB));
 const palette=['#ca4136','#e7e7dc','#398a55','#26282a'];
 for(let i=0;i<4;i++){
  const points=[];
  for(let j=0;j<=240;j++){
   const t=j/240,p=center.getPointAt(t),smooth=t*t*(3-2*t);
   const offset=frames[j].clone().applyAxisAngle(tangents[j],twist*smooth).multiplyScalar(first.pitch*(1-smooth)+last.pitch*smooth);
   p.addScaledVector(offset,i-1.5);points.push(p);
  }
  const curve=new THREE.CatmullRomCurve3(points);curves.push(curve);
  const wire=new THREE.Mesh(new THREE.TubeGeometry(curve,320,.009,10,false),new THREE.MeshStandardMaterial({color:palette[i],roughness:.48}));wire.name=['5V','D−','D+','GND'][i];wire.userData.signal=wire.name;group.add(wire);wires.push(wire);
 }
 // Deform the existing cable mesh: keep its source fixed and carry the
 // complete destination cross-section with the plug along its insertion axis.
 const seatedPosition=last.holder.position.clone();
 const rest=wires.map(w=>w.geometry.attributes.position.array.slice());
 let previousProgress=-1;
 function updateInsertion(progress){
  progress=THREE.MathUtils.clamp(progress,0,1);if(progress===previousProgress)return;previousProgress=progress;
  const displacement=normalB.clone().multiplyScalar(.32*(1-progress));
  last.holder.position.copy(seatedPosition).add(displacement);
  for(let i=0;i<wires.length;i++){
   const geometry=wires[i].geometry,position=geometry.attributes.position,uv=geometry.attributes.uv;
   for(let j=0;j<position.count;j++){
    const t=THREE.MathUtils.clamp((uv.getX(j)-.35)/.65,0,1),weight=t*t*(3-2*t);
    position.setXYZ(j,rest[i][j*3]+displacement.x*weight,rest[i][j*3+1]+displacement.y*weight,rest[i][j*3+2]+displacement.z*weight);
   }
   position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  }
 }
 return {group,wires,curves,updateInsertion,movingPlug:last.holder};
}

