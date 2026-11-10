import {createConnectionLaptop} from '../src/connection-laptop.js';
import * as THREE from 'three';
import assert from 'node:assert/strict';
import {factories} from './bom-geometry.mjs';
import {LESSONS,visibleLessonParts} from '../src/lessons.js';
import {createUsbHarness} from '../src/usb-harness.js';
import {routeWire} from '../src/wire-routing.js';
import {createPowerBoard} from '../src/power-board.js';
factories.power=createPowerBoard;
const kinds={1:'servo',4:'servo',8:'servo',13:'matrix',14:'nano',15:'camera',16:'hub',27:'power'};
const routes=[];
for(const lesson of LESSONS){
 const definitions=lesson.kind==='servo'?[[14,[-7.6,1.05,lesson.z],lesson.servo,[24.54,7.32,-5],[0,1,0],[0,1,0]],...[0,1].map(j=>[27,[(2-lesson.pair)*2.54,.95,j?1.27:-1.27],lesson.servo,[j?19.46:22,7.32,-5],[0,1,0],[0,1,0]])]:lesson.kind==='led'?[...lesson.signals.map(signal=>[14,[-7.6,1.05,signal.z],13,[-25,-1.25,signal.endZ],[0,1,0],[-1,0,0]]),...[0,1].map(j=>[27,[-5.08,.95,j?1.27:-1.27],13,lesson.destPins[j],[0,1,0],[-1,0,0]]),...[-1.96,-3.23,-4.5,-5.77,-7.04].map(z=>[13,[-7,-1.25,z],13,[7,-1.25,z],[1,0,0],[-1,0,0]])]:lesson.kind==='power'?[0,1].map(j=>[lesson.source,(lesson.sourcePins??[[(2-lesson.pair)*2.54,.95,-1.27],[(2-lesson.pair)*2.54,.95,1.27]])[j],lesson.destination,(lesson.destPins??[[22,7.32,-5],[19.46,7.32,-5]])[j],[0,1,0],lesson.destination===13?[-1,0,0]:[0,1,0]]):lesson.kind==='cascade'?[-1.96,-3.23,-4.5,-5.77,-7.04].map(z=>[13,[-7,-1.25,z],13,[7,-1.25,z],[1,0,0],[-1,0,0]]):[[15,[12.15,1.2,0],16,[-18.75,3.65,16.1],[1,0,0],[0,0,1]],[14,[0,2.4,-22.02],16,[-6.25,3.65,16.1],[0,0,-1],[0,0,1]],[16,[-10,3.65,-15.1],null,null,[0,0,-1],[0,1,0]]];
 for(const [branch,[src,pa,dst,pb,na,nb]] of definitions.entries()){
 const activeParts=visibleLessonParts(lesson,branch);
 assert.deepEqual(activeParts,lesson.kind==='usb'?[[15,16],[14,16],[16]][branch]:lesson.parts);
 const models=new Map();
 for(const [i,n] of activeParts.entries()){
  const model=factories[kinds[n]]();if(n===14||n===15||n===16||n===27)model.rotation.x=Math.PI/2;if(n===13)model.rotation.x=-Math.PI/2;
  let b=new THREE.Box3().setFromObject(model),scale=1.5/Math.max(...b.getSize(new THREE.Vector3()).toArray());model.scale.setScalar(scale);model.position.copy(b.getCenter(new THREE.Vector3())).multiplyScalar(-scale);model.position.x+=(i-(activeParts.length-1)/2)*2.4;model.updateMatrixWorld(true);models.set(n,model);
 }

  if(lesson.kind==='usb'&&branch===2){const hub=models.get(16);hub.rotateOnWorldAxis(new THREE.Vector3(0,0,1),-Math.PI/2);hub.position.applyAxisAngle(new THREE.Vector3(0,0,1),-Math.PI/2);hub.position.x-=2;hub.updateMatrixWorld(true);}
  const source=models.get(src),destination=models.get(dst),a=source.localToWorld(new THREE.Vector3(...pa)),b=destination?destination.localToWorld(new THREE.Vector3(...pb)):a.clone().add(new THREE.Vector3(1.1,0,0));
  const boxes=[...models.values()].map(m=>new THREE.Box3().setFromObject(m));
  const curve=src===dst?new THREE.LineCurve3(a,b):routeWire(a,b,new THREE.Vector3(...na).transformDirection(source.matrixWorld),destination?new THREE.Vector3(...nb).transformDirection(destination.matrixWorld):new THREE.Vector3(...nb),new THREE.Box3().setFromObject(source),destination?new THREE.Box3().setFromObject(destination):null,boxes,lesson.kind==='usb'?'direct':'overhead',lesson.kind==='servo'?(branch===0?2:branch-1):lesson.kind==='power'?branch:(lesson.signals?.[branch]?.lane??branch));
  const harness=lesson.kind==='usb'?createUsbHarness({a,b,normalA:new THREE.Vector3(...na).transformDirection(source.matrixWorld),normalB:destination?new THREE.Vector3(...nb).transformDirection(destination.matrixWorld):new THREE.Vector3(-1,0,0),sideA:new THREE.Vector3(...(src===15?[0,0,1]:[1,0,0])).transformDirection(source.matrixWorld),sideB:destination?new THREE.Vector3(1,0,0).transformDirection(destination.matrixWorld):new THREE.Vector3(0,-1,0),boxA:new THREE.Box3().setFromObject(source),boxB:destination?new THREE.Box3().setFromObject(destination):null,boxes,typeA:src===14?'typeC':'four',typeB:dst?'four':'usbA',widthA:src===15?.24:src===14?.25:.24,widthB:dst?.24:.3,profileA:src===15?'camera':'hub'}):null;
  if(harness){
   const hubModel=models.get(16);
   const hubPins=harness.curves.map((c,i)=>({signal:harness.wires[i].userData.signal,x:hubModel.worldToLocal(c.getPointAt(dst?1:0)).x})).sort((a,b)=>a.x-b.x).map(p=>p.signal);
   assert.deepEqual(hubPins,dst?['GND','D+','D−','5V']:['5V','D−','D+','GND'],'Hub front-view electrical pin order must match supplied drawing');
   harness.group.updateMatrixWorld(true);
   const plugs=harness.group.children.filter(c=>c.userData.seating);
   assert.equal(plugs.length,dst?2:1,'Each board-connected plug must have a seated mating section');
   for(const plug of plugs){
    const front=Math.min(...plug.children.map(m=>{m.geometry.computeBoundingBox();return m.geometry.boundingBox.min.z+m.position.z;}));
    assert.ok(front<-.015,'Plug geometry must extend inside the socket mouth');
    if(plug.userData.seating.profile==='hub'){
     const model=dst?destination:source,body=plug.getObjectByName('Seated 4-pin plug housing');
     const pos=body.geometry.getAttribute('position');
     for(let v=0;v<pos.count;v++){
      const p=model.worldToLocal(body.localToWorld(new THREE.Vector3().fromBufferAttribute(pos,v)));
      const hubX=dst?(branch===0?-18.75:-6.25):-10;
      assert.ok(Math.abs(p.x-hubX)<4.45&&p.y>2.4&&p.y<5.35,'Plug must fit between socket walls and above the retaining lip');
      assert.ok(dst?p.z>10.8&&p.z<17.6:p.z< -9.8&&p.z> -16.6,'Hub plug must seat within socket depth');
     }
    }
   }
   const samples=harness.curves.map(c=>c.getSpacedPoints(400));
   for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){
    let gap=Infinity;for(const p of samples[i])for(const q of samples[j])gap=Math.min(gap,p.distanceTo(q));
    assert.ok(gap>.018,`USB branch ${branch}: conductors overlap (${gap})`);
   }
  }
  if(lesson.kind==='usb'&&branch===2){const laptop=createConnectionLaptop(b);laptop.updateMatrixWorld(true);models.set('computer',laptop);}
  for(const testedCurve of harness?.curves??[curve]){
  const meshes=[];for(const model of models.values())model.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.side=THREE.DoubleSide;meshes.push(m);}});
  if(harness&&testedCurve===harness.curves[0]){
   const seated=harness.movingPlug.position.clone(),rest=harness.wires.map(w=>w.geometry.attributes.position.array.slice());
   for(const progress of [0,.25,.5,.75,1,0,1]){
    harness.updateInsertion(progress);const delta=harness.movingPlug.position.clone().sub(seated);
    assert.ok(Math.abs(delta.length()-.32*(1-progress))<1e-6,'Insertion progress must move the plug toward its seated position');
    for(const [wi,wire] of harness.wires.entries()){
     const pos=wire.geometry.attributes.position,last=pos.count-1;
     assert.ok(new THREE.Vector3().fromBufferAttribute(pos,0).distanceTo(new THREE.Vector3(...rest[wi].slice(0,3)))<1e-6,'Source cable end stays attached');
     assert.ok(new THREE.Vector3().fromBufferAttribute(pos,last).sub(new THREE.Vector3(...rest[wi].slice(last*3,last*3+3))).distanceTo(delta)<1e-6,'Cable end follows plug exactly');
     const ray=new THREE.Raycaster();
     for(let segment=1;segment<=320;segment++)for(let ring=0;ring<10;ring++){
      const p=new THREE.Vector3().fromBufferAttribute(pos,(segment-1)*11+ring),q=new THREE.Vector3().fromBufferAttribute(pos,segment*11+ring),d=q.clone().sub(p);
      ray.set(p,d.clone().normalize());ray.near=.00001;ray.far=d.length();assert.equal(ray.intersectObjects(meshes,false).length,0,`Animated cable collision at ${progress}, branch ${branch}`);
     }
    }
   }
  }
  const points=testedCurve.getSpacedPoints(700),ray=new THREE.Raycaster();let collisions=0;
  for(let i=1;i<points.length;i++){
   // The endpoint itself touches the intended contact surface; trim only 0.001 units.
   const delta=points[i].clone().sub(points[i-1]),length=delta.length();ray.set(points[i-1],delta.normalize());ray.near=i===1?.001:0;ray.far=length-(i===points.length-1?.001:0);
   if(ray.intersectObjects(meshes,false).length)collisions++;
  }
  // Check the rendered cable radius too: all longitudinal tube edges.
  const tube=new THREE.TubeGeometry(testedCurve,700,.01,8,false),vertices=tube.getAttribute('position');
  for(let i=1;i<=700;i++)for(let ring=0;ring<8;ring++){
   const p=new THREE.Vector3().fromBufferAttribute(vertices,(i-1)*9+ring),q=new THREE.Vector3().fromBufferAttribute(vertices,i*9+ring);
   if(p.distanceTo(a)<.018||q.distanceTo(b)<.018)continue;
   const delta=q.clone().sub(p);ray.set(p,delta.clone().normalize());ray.near=0;ray.far=delta.length();
   if(ray.intersectObjects(meshes,false).length)collisions++;
  }
  tube.dispose();
  assert.equal(collisions,0,`${lesson.title} ${src}->${dst}: wire crosses module surfaces`);
  }
  routes.push(`${lesson.title} ${src}->${dst??'PC'}`);
 }
}
console.log(`PASS: ${routes.length} routes, 700 centerline segments plus 8 tube-edge samples per segment each, no module surface crossings outside connector endpoints.`);
