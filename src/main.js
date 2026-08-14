import * as THREE from 'three';

const $=s=>document.querySelector(s);
const game=$('#game'),stick=$('#joystick'),knob=$('#joystick-knob'),useBtn=$('#interact'),fps=$('#fps');
const menu=$('#main-menu'),settings=$('#settings-panel'),customize=$('#customize-panel');
const gameUI=[...document.querySelectorAll('.game-ui')];
let mode='menu',sensitivity=1,pixelRatio=1.5;

const scene=new THREE.Scene();scene.background=new THREE.Color(0xbfe3ff);scene.fog=new THREE.Fog(0xbfe3ff,24,58);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.05,80);camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,pixelRatio));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;game.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x64748b,2.25));const sun=new THREE.DirectionalLight(0xffffff,1.5);sun.position.set(-10,16,12);scene.add(sun);

const mat=(c,r=.82)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const M={floor:mat(0xe7e5e4),wall:mat(0xf8fafc),concrete:mat(0xb8b8b2),green:mat(0x15803d),red:mat(0xb91c1c),metal:mat(0x64748b,.55),glass:new THREE.MeshPhysicalMaterial({color:0xcffafe,transparent:true,opacity:.28,roughness:.08,metalness:0,side:THREE.DoubleSide}),wood:mat(0x9a6940)};
const geos=new Map(),colliders=[];
function box(x,y,z,w,h,d,m,solid=false){const k=`${w}/${h}/${d}`;if(!geos.has(k))geos.set(k,new THREE.BoxGeometry(w,h,d));const o=new THREE.Mesh(geos.get(k),m);o.position.set(x,y,z);scene.add(o);if(solid)colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});return o}

// Local mexicano vacío: piso de mosaico, muros blancos, fachada sencilla y un mostrador sin mercancía.
box(0,-.12,0,30,.24,24,M.floor);
for(let x=-14.5;x<=14.5;x+=1)box(x,.015,0,.025,.02,24,M.concrete);
for(let z=-11.5;z<=11.5;z+=1)box(0,.02,z,30,.025,.025,M.concrete);
box(0,2.4,-12,30,4.8,.32,M.wall,true);box(-15,2.4,0,.32,4.8,24,M.wall,true);box(15,2.4,0,.32,4.8,24,M.wall,true);
// Frente con dos laterales sólidos y entrada de vidrio al centro.
box(-10.4,2.4,12,.32,4.8,6.8,M.wall,true);box(10.4,2.4,12,.32,4.8,6.8,M.wall,true);
box(-6.9,3.65,11.82,6.6,1.1,.18,M.green);box(6.9,3.65,11.82,6.6,1.1,.18,M.red);
box(-4.2,2.2,11.92,4.8,3.2,.08,M.glass);box(4.2,2.2,11.92,4.8,3.2,.08,M.glass);
box(0,4.45,11.78,8.2,.55,.22,M.metal);
// Columnas estructurales.
box(-7.4,1.3,-4.2,.62,2.6,.62,M.concrete,true);box(7.4,1.3,-4.2,.62,2.6,.62,M.concrete,true);
// Mostrador inicial, vacío.
box(-9.7,.52,7.8,5.2,1.04,1.35,M.wood,true);box(-9.7,1.08,7.8,5.35,.12,1.48,M.metal,true);
// Cuarto trasero / bodega aún vacía.
box(9.8,1.55,-8.9,9.6,3.1,.24,M.wall,true);box(5.1,1.55,-10.3,.24,3.1,3.2,M.wall,true);

const player={x:0,z:9.1,yaw:Math.PI,pitch:0,r:.38};const keys=new Set();let joyX=0,joyY=0,joyId=null,lookId=null,lx=0,ly=0;const SPEED=4.15,LIM=Math.PI*.47;
function blocked(x,z){if(x-player.r<-14.7||x+player.r>14.7||z-player.r<-11.7||z+player.r>11.68)return true;for(const c of colliders){const qx=Math.max(c.minX,Math.min(x,c.maxX)),qz=Math.max(c.minZ,Math.min(z,c.maxZ));if((x-qx)**2+(z-qz)**2<player.r**2)return true}return false}
function tryMove(nx,nz){if(!blocked(nx,player.z))player.x=nx;if(!blocked(player.x,nz))player.z=nz}
function syncPlayer(){camera.position.set(player.x,1.67,player.z);camera.rotation.set(player.pitch,player.yaw,0)}
function move(dt){let x=joyX,y=joyY;if(keys.has('KeyA')||keys.has('ArrowLeft'))x--;if(keys.has('KeyD')||keys.has('ArrowRight'))x++;if(keys.has('KeyW')||keys.has('ArrowUp'))y--;if(keys.has('KeyS')||keys.has('ArrowDown'))y++;let l=Math.hypot(x,y);if(l>1){x/=l;y/=l}if(l<.04)return;const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=-Math.sin(player.yaw);tryMove(player.x+(rx*x+fx*-y)*SPEED*dt,player.z+(rz*x+fz*-y)*SPEED*dt)}

function enterGame(){mode='play';menu.classList.add('hidden');settings.classList.add('hidden');customize.classList.add('hidden');gameUI.forEach(e=>e.classList.remove('hidden'));player.x=0;player.z=9.1;player.yaw=Math.PI;player.pitch=0;syncPlayer()}
$('#play-btn').addEventListener('click',enterGame);$('#settings-btn').addEventListener('click',()=>settings.classList.remove('hidden'));$('#customize-btn').addEventListener('click',()=>customize.classList.remove('hidden'));document.querySelectorAll('.close-panel').forEach(b=>b.addEventListener('click',()=>b.closest('.modal').classList.add('hidden')));
$('#sensitivity').addEventListener('input',e=>sensitivity=+e.target.value/100);$('#quality').addEventListener('change',e=>{pixelRatio=+e.target.value;renderer.setPixelRatio(Math.min(devicePixelRatio,pixelRatio))});document.querySelectorAll('[data-accent]').forEach(b=>b.addEventListener('click',()=>document.documentElement.style.setProperty('--accent',b.dataset.accent)));

addEventListener('keydown',e=>{if(mode!=='play')return;keys.add(e.code);if(/Key[WASD]|Arrow/.test(e.code))e.preventDefault()});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
renderer.domElement.addEventListener('click',e=>{if(mode==='play'&&e.pointerType!=='touch'&&document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.()});document.addEventListener('mousemove',e=>{if(mode!=='play'||document.pointerLockElement!==renderer.domElement)return;player.yaw-=e.movementX*.0022*sensitivity;player.pitch=THREE.MathUtils.clamp(player.pitch-e.movementY*.0022*sensitivity,-LIM,LIM)});
renderer.domElement.addEventListener('pointerdown',e=>{if(mode!=='play'||e.pointerType!=='touch'||lookId!==null)return;lookId=e.pointerId;lx=e.clientX;ly=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId!==lookId)return;player.yaw-=(e.clientX-lx)*.0042*sensitivity;player.pitch=THREE.MathUtils.clamp(player.pitch-(e.clientY-ly)*.0042*sensitivity,-LIM,LIM);lx=e.clientX;ly=e.clientY});const endLook=e=>{if(e.pointerId===lookId)lookId=null};renderer.domElement.addEventListener('pointerup',endLook);renderer.domElement.addEventListener('pointercancel',endLook);
function setStick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.33;let dx=e.clientX-cx,dy=e.clientY-cy,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max}joyX=dx/max;joyY=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`}
stick.addEventListener('pointerdown',e=>{joyId=e.pointerId;stick.setPointerCapture?.(e.pointerId);setStick(e);e.preventDefault();e.stopPropagation()});stick.addEventListener('pointermove',e=>{if(e.pointerId===joyId)setStick(e)});function resetStick(e){if(e.pointerId!==joyId)return;joyId=null;joyX=joyY=0;knob.style.transform='translate(-50%,-50%)'}stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);useBtn.addEventListener('pointerdown',e=>{e.stopPropagation();useBtn.textContent='OK';setTimeout(()=>useBtn.textContent='USAR',350)});

const clock=new THREE.Clock();let frames=0,acc=0,menuT=0;function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);if(mode==='play'){move(dt);syncPlayer()}else{menuT+=dt;const a=.52+Math.sin(menuT*.18)*.13;camera.position.set(Math.sin(a)*20,6.5,Math.cos(a)*20);camera.lookAt(0,1.4,0)}renderer.render(scene,camera);frames++;acc+=dt;if(acc>.5){fps.textContent=`${Math.round(frames/acc)} FPS`;frames=0;acc=0}}loop();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,pixelRatio))});
