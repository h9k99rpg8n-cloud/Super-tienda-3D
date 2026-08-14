import * as THREE from 'three';

const game=document.querySelector('#game');
const stick=document.querySelector('#joystick');
const knob=document.querySelector('#joystick-knob');
const useBtn=document.querySelector('#interact');
const fps=document.querySelector('#fps');

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdbeafe);
scene.fog=new THREE.Fog(0xdbeafe,20,48);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,70);
camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
game.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff,0x64748b,2.2));
const sun=new THREE.DirectionalLight(0xffffff,1.2);sun.position.set(8,12,5);scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8});
const M={floor:mat(0xe5e7eb),wall:mat(0xf8fafc),shelf:mat(0x64748b),blue:mat(0x1e3a8a),wood:mat(0x8b5a2b),red:mat(0xdc2626),yellow:mat(0xfacc15),green:mat(0x16a34a)};
const geo=new Map();
function box(x,y,z,w,h,d,m){const k=`${w}/${h}/${d}`;if(!geo.has(k))geo.set(k,new THREE.BoxGeometry(w,h,d));const o=new THREE.Mesh(geo.get(k),m);o.position.set(x,y,z);scene.add(o);return o;}
box(0,-.12,0,36,.24,28,M.floor);box(0,2.3,-14,36,4.6,.28,M.wall);box(-18,2.3,0,.28,4.6,28,M.wall);box(18,2.3,0,.28,4.6,28,M.wall);box(0,3.95,-13.82,35.7,.34,.08,M.blue);
for(let i=0;i<3;i++){const x=-9+i*4.4;box(x,.5,10.3,3.2,1,1.25,M.wood);box(x+.8,1.25,10.25,.42,.55,.22,M.blue);}
const productMats=[M.red,M.yellow,M.green,M.blue];
for(const z of[-8.6,-4.4,-.2,4])for(const x of[-6.2,2,10.2]){
 box(x,.18,z,5.4,.16,.8,M.shelf);
 for(const y of[.58,1.08,1.58])box(x,y,z,5.4,.09,.78,M.shelf);
 for(const sx of[-2.62,2.62])box(x+sx,.88,z,.12,1.75,.78,M.shelf);
 for(let r=0;r<3;r++)for(let i=0;i<10;i++)box(x-2.38+i*.529,.35+r*.5,z-.01,.28,.33,.5,productMats[(i+r)%4]);
}

const player={x:0,z:12.3,yaw:Math.PI,pitch:0};
const keys=new Set();let joyX=0,joyY=0,joyId=null,lookId=null,lx=0,ly=0;
const SPEED=4.2,TOUCH=.0042,MOUSE=.0022,LIM=Math.PI*.48;
function sync(){camera.position.set(player.x,1.68,player.z);camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;}
function move(dt){let x=joyX,y=joyY;if(keys.has('KeyA')||keys.has('ArrowLeft'))x--;if(keys.has('KeyD')||keys.has('ArrowRight'))x++;if(keys.has('KeyW')||keys.has('ArrowUp'))y--;if(keys.has('KeyS')||keys.has('ArrowDown'))y++;let l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}if(l<.04)return;const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=-Math.sin(player.yaw);player.x=THREE.MathUtils.clamp(player.x+(rx*x+fx*-y)*SPEED*dt,-17.4,17.4);player.z=THREE.MathUtils.clamp(player.z+(rz*x+fz*-y)*SPEED*dt,-13.4,13.2);}
addEventListener('keydown',e=>{keys.add(e.code);if(/Key[WASD]|Arrow/.test(e.code))e.preventDefault();});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
renderer.domElement.addEventListener('click',e=>{if(e.pointerType!=='touch'&&document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==renderer.domElement)return;player.yaw-=e.movementX*MOUSE;player.pitch=THREE.MathUtils.clamp(player.pitch-e.movementY*MOUSE,-LIM,LIM);});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||lookId!==null)return;lookId=e.pointerId;lx=e.clientX;ly=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId!==lookId)return;player.yaw-=(e.clientX-lx)*TOUCH;player.pitch=THREE.MathUtils.clamp(player.pitch-(e.clientY-ly)*TOUCH,-LIM,LIM);lx=e.clientX;ly=e.clientY;});
const endLook=e=>{if(e.pointerId===lookId)lookId=null;};renderer.domElement.addEventListener('pointerup',endLook);renderer.domElement.addEventListener('pointercancel',endLook);
function setStick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.33;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max;}joyX=dx/max;joyY=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;}
stick.addEventListener('pointerdown',e=>{joyId=e.pointerId;stick.setPointerCapture?.(e.pointerId);setStick(e);e.preventDefault();e.stopPropagation();});stick.addEventListener('pointermove',e=>{if(e.pointerId===joyId)setStick(e);});
function resetStick(e){if(e.pointerId!==joyId)return;joyId=null;joyX=joyY=0;knob.style.transform='translate(-50%,-50%)';}stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);
useBtn.addEventListener('pointerdown',e=>{e.stopPropagation();useBtn.textContent='OK';setTimeout(()=>useBtn.textContent='USAR',450);});
const clock=new THREE.Clock();let frames=0,acc=0;function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);move(dt);sync();renderer.render(scene,camera);frames++;acc+=dt;if(acc>.5){fps.textContent=`${Math.round(frames/acc)} FPS`;frames=0;acc=0;}}sync();loop();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));});
