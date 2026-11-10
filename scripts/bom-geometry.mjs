import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import fontData from '../source-models/bom/helvetiker_regular.typeface.json' with { type: 'json' };
const labelFont=new FontLoader().parse(fontData);

// Original, dimension-led display geometry; not supplier-certified manufacturing CAD.
const mat = (color, metalness=0, roughness=.48) => new THREE.MeshStandardMaterial({color,metalness,roughness});
const pcb=mat('#155b48'),black=mat('#15191c'),silver=mat('#a9b1ba',.8,.28),gold=mat('#c3a05d',.7,.32),ivory=mat('#e9e5d5'),blue=mat('#164cad',0,.32),white=mat('#f3f0e9');
function box(g,name,size,position,material){
 // Keep contact faces and thin traces exact; inset micro bevels on solid housings.
 const round=Math.min(...size)>.45&&!/opening|socket|contact|pin|lead|silk|trace|label/i.test(name);
 const geometry=round?new RoundedBoxGeometry(...size,2,Math.min(.09,Math.min(...size)*.12)):new THREE.BoxGeometry(...size);
 const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(...position);g.add(m);return m;
}
function cylinder(g,name,r,h,position,material){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,64),material);m.name=name;m.position.set(...position);g.add(m);return m;}
function board(g,w,d,t,holes=[],material=pcb){const shape=new THREE.Shape();shape.moveTo(-w/2,-d/2);shape.lineTo(w/2,-d/2);shape.lineTo(w/2,d/2);shape.lineTo(-w/2,d/2);shape.closePath();for(const [x,z,r] of holes){const h=new THREE.Path();h.absarc(x,z,r,0,Math.PI*2,true);shape.holes.push(h);}const geo=new THREE.ExtrudeGeometry(shape,{depth:t,bevelEnabled:false,curveSegments:16});geo.rotateX(-Math.PI/2);geo.translate(0,-t/2,0);const m=new THREE.Mesh(geo,material);m.name='PCB';g.add(m);}
function chip(g,x,z,w,d,pins=8){box(g,'IC package',[w,1.4,d],[x,1.4,z],black);for(let i=0;i<pins;i++){const dz=z+(i-(pins-1)/2)*d/pins;for(const side of [-1,1])box(g,'IC lead',[1,.25,.35],[x+side*(w/2+.35),.8,dz],silver);}}
function connector(g,x,z,w=9){box(g,'Connector body',[w,5,6],[x,3,z],ivory);box(g,'Connector opening',[w-1.6,2.5,.3],[x,3.4,z+3.01],black);for(let i=0;i<4;i++)box(g,'Connector contact',[.45,1,.4],[x+(i-1.5)*1.8,3.1,z+3.25],gold);}
function smd(g,x,z){box(g,'SMD body',[1.7,.65,.85],[x,1.1,z],black);for(const dx of [-.85,.85])box(g,'SMD termination',[.3,.7,.9],[x+dx,1.1,z],silver);}
export function nano(){
 const g=new THREE.Group(),mask=mat('#171c20',0,.45),ink=mat('#e7e7df',0,.65);
 board(g,18,44,1.5,[[-7,-20,1],[7,-20,1],[-7,20,1],[7,20,1]],mask);
 for(const side of [-1,1]){
  box(g,'15-pin header insulator',[2.4,2.5,38],[side*7.6,-2,0],black);
  for(let i=0;i<15;i++){
   box(g,'Soldered header pin',[.6,6.85,.6],[side*7.6,-2.475,(i-7)*2.54],silver);
   cylinder(g,'Header solder joint',.72,.3,[side*7.6,.88,(i-7)*2.54],silver);
  }
 }
 // Rounded, hollow Type-C receptacle with central tongue; not the earlier Mini-B box.
 function rounded(path,w,h,r){path.moveTo(-w/2+r,-h/2);path.lineTo(w/2-r,-h/2);path.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);path.lineTo(w/2,h/2-r);path.quadraticCurveTo(w/2,h/2,w/2-r,h/2);path.lineTo(-w/2+r,h/2);path.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);path.lineTo(-w/2,-h/2+r);path.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return path;}
 const shell=rounded(new THREE.Shape(),8.8,3.2,1.2);shell.holes.push(rounded(new THREE.Path(),7.9,2.3,.85));
 const usbGeo=new THREE.ExtrudeGeometry(shell,{depth:6.5,bevelEnabled:false,curveSegments:12});usbGeo.translate(0,2.4,-22);const usb=new THREE.Mesh(usbGeo,silver);usb.name='USB Type-C metal shell';g.add(usb);
 box(g,'USB-C inner socket',[7.6,2.2,.25],[0,2.4,-15.6],black);
 box(g,'USB-C central tongue',[6.4,.55,4.9],[0,2.4,-18.9],black);
 for(let i=0;i<12;i++)box(g,'USB-C contact',[.2,.05,1.5],[(i-5.5)*.45,2.7,-20.4],gold);
 for(const x of [-4.15,4.15])box(g,'USB solder anchor',[.9,.35,2.3],[x,1,-17.2],silver);
 // CH340G lies between the USB connector and the four-sided main processor.
 chip(g,0,-10.3,4.7,7.8,8);
 const mcu=new THREE.Group();box(mcu,'ATmega328P-AU package',[5.7,1.2,5.7],[0,1.45,0],black);
 for(let i=0;i<8;i++)for(const side of [-1,1]){
  box(mcu,'MCU lead',[.8,.22,.28],[side*3.2,.95,(i-3.5)*.65],silver);
  box(mcu,'MCU lead',[.28,.22,.8],[(i-3.5)*.65,.95,side*3.2],silver);
 }
 mcu.rotation.y=Math.PI/4;mcu.position.z=1;g.add(mcu);
 box(g,'Crystal can',[2.3,1.1,2.8],[3.4,1.35,7.2],silver);
 box(g,'Reset switch',[3.8,1.5,3.8],[0,1.5,11.2],silver);
 cylinder(g,'Reset button',1.15,.5,[0,2.5,11.2],black);
 box(g,'Rear regulator',[1.7,1.1,2.8],[3.8,1.3,16],black);
 box(g,'Six-pin ISP insulator',[5.1,2.5,7.6],[0,2,17.5],black);
 for(const x of [-1.27,1.27])for(const z of [14.96,17.5,20.04])box(g,'ISP pin',[.55,7,.55],[x,5.4,z],silver);
 // Silk occupies a reserved band; fit every label into its own footprint.
 function print(value,x,z,size,maxWidth=Infinity){
  const geo=new THREE.ShapeGeometry(labelFont.generateShapes(value,size));geo.computeBoundingBox();
  const bounds=geo.boundingBox, factor=Math.min(1,maxWidth/(bounds.max.x-bounds.min.x));
  geo.translate(-(bounds.min.x+bounds.max.x)/2,-(bounds.min.y+bounds.max.y)/2,0);
  geo.scale(factor,factor,1);geo.rotateX(-Math.PI/2);geo.translate(x,.79,z);
  const mesh=new THREE.Mesh(geo,ink);mesh.name='Silkscreen '+value;g.add(mesh);
 }
 const left=['D1','D0','RST','GND','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12'];
 const right=['VIN','GND','RST','5V','A7','A6','A5','A4','A3','A2','A1','A0','REF','3V3','D13'];
 for(let i=0;i<15;i++){print(left[i],-5.95,(i-7)*2.54,.68,1.6);print(right[14-i],5.95,(i-7)*2.54,.68,1.6);}
 print('NANO',-1.3,7.9,.8,3.2);print('CH340G',0,-5.45,.55,3.4);
 for(const x of [-3.8,3.8])for(const z of [-5.9,11.1])smd(g,x,z);
 for(let i=0;i<3;i++){box(g,'Status LED',[.85,.6,.65],[-3.9,1.05,6.5+i*1.3],ivory);}
 return g;
}
export function hub(){
 const g=new THREE.Group(),solderMask=mat('#16191c',0,.48),silkscreen=mat('#dfdfd5',0,.7),plastic=mat('#eeeade',0,.42),capTop=mat('#c6c9cc',.65,.32);
 // 53 x 35 mm outline and 47.4 x 27 mm mounting pattern from supplied drawing.
 const outline=new THREE.Shape(),w=26.5,d=17.5,r=2;
 outline.moveTo(-w+r,-d);outline.lineTo(w-r,-d);outline.quadraticCurveTo(w,-d,w,-d+r);outline.lineTo(w,d-r);outline.quadraticCurveTo(w,d,w-r,d);outline.lineTo(-w+r,d);outline.quadraticCurveTo(-w,d,-w,d-r);outline.lineTo(-w,-d+r);outline.quadraticCurveTo(-w,-d,-w+r,-d);
 for(const x of [-23.7,23.7])for(const z of [-13.5,13.5]){const hole=new THREE.Path();hole.absarc(x,z,1.6,0,Math.PI*2,true);outline.holes.push(hole);}
 const geo=new THREE.ExtrudeGeometry(outline,{depth:1.2,bevelEnabled:false,curveSegments:16});geo.rotateX(-Math.PI/2);geo.translate(0,-.6,0);g.add(new THREE.Mesh(geo,solderMask));
 function print(value,x,y,z,size,material=silkscreen){const geom=new THREE.ShapeGeometry(labelFont.generateShapes(value,size));geom.computeBoundingBox();geom.translate(-(geom.boundingBox.min.x+geom.boundingBox.max.x)/2,0,0);geom.rotateX(-Math.PI/2);geom.translate(x,y,z);g.add(new THREE.Mesh(geom,material));}
 function socket(x,z,upstream=false){
  const c=new THREE.Group();
  box(c,'PH socket floor',[10.5,.8,6],[0,1,0],plastic);
  box(c,'PH socket rear wall',[10.5,4.5,.8],[0,3.1,-2.6],plastic);
  for(const side of [-1,1]){box(c,'PH socket side wall',[.8,4.5,6],[side*4.85,3.1,0],plastic);box(c,'Locking shoulder',[1.4,.7,3.2],[side*4.55,5.1,0],plastic);}
  box(c,'Front retaining lip',[8.9,1.2,.65],[0,1.8,2.7],plastic);
  for(let i=0;i<4;i++){
   box(c,'PH internal contact',[.45,.45,3.5],[(i-1.5)*2,2.25,-.4],silver);
   box(c,'PH solder tail',[.5,.3,1.8],[(i-1.5)*2,.78,-3.4],silver);
  }
  if(upstream)c.rotation.y=Math.PI;c.position.set(x,0,z);g.add(c);
 }
 function capacitor(x,z){
  box(g,'Capacitor black base',[6.8,.7,6.8],[x,1,z],black);
  cylinder(g,'Aluminum capacitor',3.15,7.5,[x,5.05,z],silver);
  cylinder(g,'Capacitor top',2.94,.12,[x,8.86,z],capTop);
  // Printed markings visible in the reference; component values are visual labels only.
  print('RT',x,8.94,z-1.1,.85,black);print('100',x,8.94,z+.25,.95,black);print('16V',x,8.94,z+1.65,.85,black);
  for(const side of [-1,1])box(g,'Capacitor solder foot',[1.1,.2,2.2],[x+side*3.45,.82,z],silver);
 }
 for(const [i,x] of [-18.75,-6.25,6.25,18.75].entries()){
  socket(x,13);capacitor(x,3.5);
  for(const z of [8.7,10])smd(g,x-3.8,z);
  print('USB'+(i+1),x,.63,8.6,1.05);
  box(g,'Indicator LED',[1.2,.55,.8],[x+3.9,.95,8.8],mat('#d4d8b6',0,.4));
 }
 socket(-10,-12,true);capacitor(0,-9.5);
 chip(g,12,-7,5.8,10.5,14);
 print('USB HUB',13,.63,-14,1.2);
 box(g,'Crystal metal can',[3.2,1.2,5],[19.5,1.3,-3.5],silver);
 for(let i=0;i<5;i++){smd(g,5,-11+i*2.2);smd(g,23,-10+i*1.5);}
 print('5V D- D+ G',-10,.63,-6.7,.75);
 return g;
}
export function camera(){
 const g=new THREE.Group(),mask=mat('#202721',0,.58),lensPlastic=mat('#171b1a',0,.32),ceramic=mat('#aaa78c',0,.65),socketPlastic=mat('#e6dfbb',0,.48),trace=mat('#4d554b',.15,.65);
 board(g,25,8,1,[],mask);
 // Low square lens carrier, stepped black barrel, and a small blue optical aperture.
 box(g,'Square sensor carrier',[7,1.05,7],[-8,1.025,0],lensPlastic);
 box(g,'Lens mount flange',[6.5,.35,6.5],[-8,1.725,0],black);
 cylinder(g,'Lens lower barrel',2.85,1.1,[-8,2.45,0],lensPlastic);
 cylinder(g,'Lens focus ring',2.65,.65,[-8,3.325,0],black);
 cylinder(g,'Lens front face',2.38,.33,[-8,3.815,0],lensPlastic);
 cylinder(g,'Optical aperture',.7,.035,[-8,3.9975,0],black);
 cylinder(g,'Blue optical glass',.48,.04,[-8,4.02,0],new THREE.MeshPhysicalMaterial({color:'#12255e',metalness:.25,roughness:.09,clearcoat:1,clearcoatRoughness:.06}));
 for(let i=0;i<12;i++){const t=i*Math.PI/6;cylinder(g,'Focus ring grip',.17,.65,[-8+2.55*Math.cos(t),3.325,2.55*Math.sin(t)],lensPlastic);}
 // Controller footprint and secondary IC follow the visible photo layout.
 chip(g,-.4,-1,5.8,3.5,9);
 box(g,'Secondary IC',[3.3,.85,2.2],[1,1.025,2.55],black);
 for(let i=0;i<5;i++)for(const z of [1.25,3.75])box(g,'Secondary IC lead',[.25,.15,.45],[i*.6-.2,.66,z],silver);
 function component(x,z){box(g,'Ceramic component',[.95,.6,.65],[x,.9,z],ceramic);for(const dx of [-.5,.5])box(g,'Solder termination',[.23,.5,.7],[x+dx,.85,z],silver);}
 for(const [x,z] of [[-4,2.2],[-4,3.2],[-2.7,2.6],[3.8,2.6],[5.1,2.6],[6.4,2.6],[4.3,-2.7],[5.6,-2.7],[7,-2.7],[8,2.9]])component(x,z);
 box(g,'Oscillator',[2,1,1.6],[6.1,1,-.4],silver);
 box(g,'Regulator',[1.5,.9,1.5],[7.5,1.05,.7],black);
 // Fine board tracks are illustrative, not an electrical routing reproduction.
 for(let i=0;i<7;i++){
  box(g,'PCB trace',[1.6,.025,.08],[-4.1,.52,-2.8+i*.65],trace);
  cylinder(g,'PCB via',.12,.03,[3.4+i*.65,.53,-3.4],silver);
 }
 // Cream 4-pin connector at the end opposite the lens, 0.8 mm contact pitch.
 box(g,'Camera connector base',[2.7,.5,6.1],[10.7,.75,0],socketPlastic);
 box(g,'Camera connector cover',[2.4,1.15,5.7],[10.8,1.5,0],socketPlastic);
 box(g,'Socket opening',[.12,.65,4.4],[12.06,1.2,0],black);
 for(let i=0;i<4;i++){
  box(g,'0.8mm socket contact',[1.1,.15,.25],[11.6,1.15,(i-1.5)*.8],gold);
  box(g,'Connector solder tail',[.7,.16,.3],[9.1,.65,(i-1.5)*.8],silver);
 }
 for(const z of [-2.8,2.8])box(g,'Connector anchor',[1.1,.25,.7],[10.6,.7,z],silver);
 return g;
}
export function matrix(){
 const g=new THREE.Group(),diffuser=mat('#69716e',0,.65),backPlastic=mat('#e9e8df',0,.4),driverPCB=mat('#217346',0,.36),ink=mat('#eeeee3',0,.65);
 const eyeLight=new THREE.MeshStandardMaterial({name:'Pale yellow default eye pixels',color:'#FFF0B3',emissive:'#FFF0B3',emissiveIntensity:1.25,roughness:.35,metalness:0});
 const frosted=new THREE.MeshPhysicalMaterial({name:'Frosted translucent LED rear membrane',color:'#f2f0e7',metalness:0,roughness:.43,transmission:.83,thickness:.38,ior:1.46,clearcoat:.08});
 const internalLED=mat('#929a97',0,.65),innerReflector=mat('#e2e3dd',0,.65);
 function roundedSquare(size,r){const h=size/2,shape=new THREE.Shape();shape.moveTo(-h+r,-h);shape.lineTo(h-r,-h);shape.quadraticCurveTo(h,-h,h,-h+r);shape.lineTo(h,h-r);shape.quadraticCurveTo(h,h,h-r,h);shape.lineTo(-h+r,h);shape.quadraticCurveTo(-h,h,-h,h-r);shape.lineTo(-h,-h+r);shape.quadraticCurveTo(-h,-h,-h+r,-h);return shape;}
 // Two 32 mm modules retained to match the original dual-eye mounting envelope.
 for(const x of [-16,16]){
  // Hollow housing: thin translucent rear membrane, raised perimeter and internal LED silhouettes.
  box(g,'Frosted rear membrane',[30.6,.38,30.6],[x,.89,0],frosted);
  for(const side of [-1,1]){
   box(g,'Raised rear perimeter',[.5,7.5,31.6],[x+side*15.55,4.45,0],backPlastic);
   box(g,'Raised rear perimeter',[30.6,7.5,.5],[x,4.45,side*15.55],backPlastic);
  }
  box(g,'Internal white reflector',[30.5,.25,30.5],[x,7.9,0],innerReflector);
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   const lx=x+(col-3.5)*3.9,lz=(row-3.5)*3.9;
   cylinder(g,'LED body visible through frosted back',.8,.75,[lx,1.72,lz],internalLED);
   if((row+col)%3===0){const dome=new THREE.Mesh(new THREE.SphereGeometry(.3,10,6),backPlastic);dome.name='Rear moulding dimple';dome.scale.y=.4;dome.position.set(lx,.7,lz);g.add(dome);}
  }
  for(const edge of [-1,1])for(const z of [-12,0,12])box(g,'Moulded edge clip',[.75,.3,1.1],[x+edge*15.2,.7,z],backPlastic);
  box(g,'Black matrix face grid',[31.6,.85,31.6],[x,8.625,0],black);
  const lensGeometry=new THREE.ExtrudeGeometry(roundedSquare(3.22,.38),{depth:.18,bevelEnabled:false,curveSegments:5});
  lensGeometry.rotateX(-Math.PI/2);
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   const lit=((row===2||row===5)&&(col===3||col===4))||((row===3||row===4)&&col>=2&&col<=5);
   const lens=new THREE.Mesh(lensGeometry,lit?eyeLight:diffuser);lens.name=lit?'Lit pale-yellow eye pixel':'Unlit rounded-square LED diffuser';lens.position.set(x+(col-3.5)*3.9,9.05,(row-3.5)*3.9);g.add(lens);
  }
  // Narrow rear driver board with pointed mounting ears and actual through-holes.
  const outline=new THREE.Shape();outline.moveTo(-5.3,-13);outline.lineTo(-1.5,-18);outline.quadraticCurveTo(0,-19,1.5,-18);outline.lineTo(5.3,-13);outline.lineTo(5.3,13);outline.lineTo(1.5,18);outline.quadraticCurveTo(0,19,-1.5,18);outline.lineTo(-5.3,13);outline.closePath();
  for(const z of [-16.7,16.7]){const hole=new THREE.Path();hole.absarc(0,z,.85,0,Math.PI*2,true);outline.holes.push(hole);}
  const geom=new THREE.ExtrudeGeometry(outline,{depth:1,bevelEnabled:false,curveSegments:12});geom.rotateX(Math.PI/2);geom.translate(x,.5,0);g.add(new THREE.Mesh(geom,driverPCB));
  box(g,'MAX7219 rear driver IC',[7.6,1.5,3.8],[x,-1.25,5],black);
  for(let i=0;i<12;i++)for(const z of [7.3,2.7])box(g,'MAX7219 soldered leg',[.28,.35,1.1],[x+(i-5.5)*.6,-.7,z],silver);
  // Rear 5-pin input/output headers run outwards along the board sides.
  for(const side of [-1,1]){
   box(g,'Five-pin header insulator',[1.4,1.5,6.7],[x+side*5,-1.25,-4.5],black);
   for(let i=0;i<5;i++)box(g,'Right angle header pin',[4,.35,.35],[x+side*7,-1.25,-4.5+(i-2)*1.27],silver);
  }
  for(const z of [-11.9,11.9])for(let i=0;i<8;i++)cylinder(g,'Matrix solder joint',.32,.3,[x+(i-3.5)*1.25,-.65,z],silver);
  for(let i=0;i<3;i++){box(g,'Rear SMD resistor',[1.25,.5,.6],[x+(.7*(i%2)),-.75,-.8+i*.9],black);for(const dx of [-.65,.65])box(g,'SMD termination',[.2,.5,.65],[x+(.7*(i%2))+dx,-.75,-.8+i*.9],silver);}
  function print(value,px,pz,size){const text=new THREE.ShapeGeometry(labelFont.generateShapes(value,size));text.computeBoundingBox();text.translate(-(text.boundingBox.min.x+text.boundingBox.max.x)/2,0,0);text.rotateX(Math.PI/2);text.translate(x+px,-.52,pz);g.add(new THREE.Mesh(text,ink));}
  print('JY-MCU',0,13.2,1.35);print('MAX7219 MODULE',0,9.1,.68);print('V2.0',0,-14.5,1.25);
  for(let i=0;i<5;i++){print(['CLK','CS','DIN','GND','VCC'][i],-2.9,-2.3-i*1.27,.55);print(['CLK','CS','DOUT','GND','VCC'][i],2.8,-2.3-i*1.27,.55);}
  const arrow=new THREE.Shape();arrow.moveTo(-3,8.3);arrow.lineTo(1.3,8.3);arrow.lineTo(1.3,7.3);arrow.lineTo(3.8,9.2);arrow.lineTo(1.3,11.1);arrow.lineTo(1.3,10.1);arrow.lineTo(-3,10.1);arrow.closePath();const arrowGeo=new THREE.ShapeGeometry(arrow);arrowGeo.rotateX(Math.PI/2);arrowGeo.translate(x,-.53,-18.4);g.add(new THREE.Mesh(arrowGeo,ink));
 }
 return g;
}
export function servo(){
 const g=new THREE.Group();
 const shell=new THREE.MeshPhysicalMaterial({color:'#2448bf',metalness:0,roughness:.16,transmission:.76,thickness:.55,ior:1.49,clearcoat:.6,clearcoatRoughness:.18});
 shell.name='SG90 translucent cobalt-blue shell';
 const rim=mat('#142b7d',0,.27),labelBlack=mat('#101313',0,.55),labelGold=mat('#d7ce91',0,.63);
 // Thin walls keep the enclosure translucent without treating the body as solid glass.
 for(const z of [-5.7,5.7])box(g,'Translucent case wall',[22.8,23,.6],[0,-4.1,z],shell);
 for(const x of [-11.1,11.1])box(g,'Translucent case end',[.6,23,10.8],[x,-4.1,0],shell);
 box(g,'Lower cap',[22.8,.8,12],[0,-15.2,0],shell);
 box(g,'Gearcase lid',[22.8,.8,12],[0,7,0],shell);
 for(const y of [-12.1,3.3,7.1]){
  for(const z of [-5.85,5.85])box(g,'Moulded case seam',[22.8,.34,.3],[0,y,z],rim);
 }
 // A restrained internal motor/gear silhouette, rather than invented detailed internals.
 cylinder(g,'Internal motor',4.6,15,[5.1,-6.5,0],silver);
 box(g,'Internal gearbox',[10,15,8.4],[-5,-5,0],black);
 cylinder(g,'Large gear cover',5.9,4,[-5.3,9.4,0],shell);
 cylinder(g,'Secondary gear cover',3.1,2,[2.8,8.4,0],shell);
 for(const [x,z,r] of [[-5.3,0,4.8],[2.8,0,2.4]])cylinder(g,'Internal gear silhouette',r,.7,[x,8.2,z],ivory);
 cylinder(g,'White output shaft',2.15,4.2,[-5.3,13.5,0],white);
 for(let i=0;i<20;i++){
  const angle=i*Math.PI/10;
  cylinder(g,'Output spline ridge',.14,3.5,[-5.3+2.2*Math.cos(angle),13.5,2.2*Math.sin(angle)],white);
 }
 cylinder(g,'Output shaft recess',.65,.08,[-5.3,15.58,0],ivory);
 // Actual open screw holes in both mounting ears.
 for(const x of [-13.8,13.8]){
  const ear=new THREE.Group();board(ear,4.8,12,2.3,[[0,0,1.35]],shell);ear.position.set(x,4.5,0);g.add(ear);
 }
 for(const x of [-9.5,9.5])for(const z of [-4,4]){
  cylinder(g,'Case screw',.65,.3,[x,-15.45,z],silver);
 }
 box(g,'Black label',[17.8,13,.12],[0,-4.6,6.03],labelBlack);
 box(g,'Gold label band',[16.3,4.7,.04],[0,-3.8,6.11],labelGold);
 for(const y of [-10.6,1.4])box(g,'Label border',[16.8,.12,.035],[0,y,6.12],labelGold);
 for(const x of [-8.4,8.4])box(g,'Label border',[.12,12,.035],[x,-4.6,6.12],labelGold);
 function text(value,y,size,material){const geo=new THREE.ShapeGeometry(labelFont.generateShapes(value,size));geo.computeBoundingBox();const mid=(geo.boundingBox.min.x+geo.boundingBox.max.x)/2;geo.translate(-mid,y,6.15);const mesh=new THREE.Mesh(geo,material);mesh.name='Label '+value;g.add(mesh);}
 text('Micro Servo',-3.4,1.65,labelBlack);text('9g',-5.6,1.6,labelBlack);text('SG90',-8.9,2.1,labelGold);
 // Short illustrative lead; this is not a specified in-product wiring route.
 const colors=['#60382a','#b62a20','#dd851e'];
 colors.forEach((color,i)=>{
  const dz=(i-1)*.95;
  const points=[[11,-10,dz],[15,-10,dz],[18+(i-1)*1.1,-7,-3+dz],[22+(i-1)*2.54,-2,-5],[22+(i-1)*2.54,2,-5]].map(p=>new THREE.Vector3(...p));
  const wire=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.43,16,false),mat(color,0,.4));wire.name='Short illustrative servo lead';g.add(wire);
 });
 box(g,'Three-pin female plug',[7.7,5.5,2.8],[22,4.5,-5],black);
 for(let i=0;i<3;i++){
  box(g,'Connector contact window',[1.2,1.7,.08],[22+(i-1)*2.54,4.6,-3.56],silver);
  box(g,'Connector socket',[1.3,.1,1.2],[22+(i-1)*2.54,7.26,-5],labelBlack);
 }
 return g;
}
export const factories={nano,hub,camera,matrix,servo};



