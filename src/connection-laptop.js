import * as THREE from 'three';
export function createConnectionLaptop(port){
 const group=new THREE.Group();group.position.copy(port);
 const metal=new THREE.MeshStandardMaterial({color:'#90999f',metalness:.6,roughness:.38}),black=new THREE.MeshStandardMaterial({color:'#20282e',roughness:.5});
 function box(size,pos,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);group.add(m);return m;}
 // Split the left edge around the USB-A socket, leaving a real open cavity.
 box([2.35,1.65,.12],[1.325,0,0],metal);
 for(const sign of [-1,1])box([.15,.645,.12],[.075,sign*.5025,0],metal);
 for(const sign of [-1,1])box([.15,.36,.017],[.075,0,sign*.0515],metal);
 box([.012,.34,.085],[.145,0,0],black);
 box([2.18,.87,.012],[1.25,.23,.067],black);
 for(let row=0;row<5;row++)for(let col=0;col<13;col++)box([.14,.12,.018],[.26+col*.165,-.1+row*.15,.082],metal);
 box([.83,.4,.007],[1.25,-.52,.064],metal);
 box([2.5,.075,1.5],[1.25,.8,.81],metal);
 box([2.36,.009,1.36],[1.25,.758,.81],black);
 const display=new THREE.Mesh(new THREE.PlaneGeometry(2.22,1.22),new THREE.MeshBasicMaterial({color:'#466465'}));display.rotation.x=Math.PI/2;display.position.set(1.25,.752,.81);group.add(display);
 box([.75,.008,.035],[1.02,.744,.9],metal);box([1.2,.008,.02],[1.25,.744,.78],metal);
 box([.028,.008,.028],[1.25,.75,1.51],black);
 return group;
}
