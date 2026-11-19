import * as THREE from 'three';

const app=document.querySelector('#app'), scene=new THREE.Scene();
scene.background=new THREE.Color(0xbdeaf4);scene.fog=new THREE.Fog(0xbdeaf4,18,48);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);camera.position.set(9,7,11);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;app.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xeafcff,0x91bbd0,2));const sun=new THREE.DirectionalLight(0xfff7df,3);sun.position.set(-10,18,-8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=sun.shadow.camera.bottom=-18;sun.shadow.camera.right=sun.shadow.camera.top=18;scene.add(sun);

const mat=(c,rough=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:rough});
const white=mat(0xf7faf8), cream=mat(0xeef3ee), black=mat(0x171b20), nose=mat(0x202326), ice=mat(0xeaf8fc,.45), fish=mat(0x87b7c7,.5);
const ground=new THREE.Mesh(new THREE.CircleGeometry(30,64),ice);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

// distant mountains
for(let i=0;i<9;i++){const r=7+Math.random()*5,h=5+Math.random()*5,x=(i-4)*7;const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,5),mat(i%2?0xd6edf3:0xc8e3ea));m.position.set(x,h/2-1,-18-Math.random()*8);m.rotation.y=i*.7;scene.add(m)}
// rounded ice islands
for(let i=0;i<16;i++){const x=(Math.random()-.5)*35,z=(Math.random()-.5)*30;if(Math.hypot(x,z)<5)continue;const p=new THREE.Mesh(new THREE.CylinderGeometry(1+Math.random(),1.4+Math.random(),.15,9),mat(0xffffff,.3));p.position.set(x,.08,z);p.scale.z=.55+Math.random();p.receiveShadow=true;scene.add(p)}

function mesh(g,m,parent=scene){const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function sphere(r,c,m,scale=[1,1,1]){const o=mesh(new THREE.SphereGeometry(r,24,16),m,c);o.scale.set(...scale);return o}

const bear=new THREE.Group();scene.add(bear);
// body and head
const body=sphere(1.15,scene,white,[1,.85,1.15]);body.position.set(0,1.45,0);bear.add(body);
const head=sphere(.78,scene,cream,[1.05,.95,1]);head.position.set(0,2.35,1.05);bear.add(head);
// legs
for(const x of [-.65,.65])for(const z of [-.55,.55]){const leg=mesh(new THREE.CapsuleGeometry(.28, .55,6,10),cream,bear);leg.position.set(x,.72,z);leg.rotation.z=x*.12}
// arms
for(const x of [-1.05,1.05]){const arm=mesh(new THREE.CapsuleGeometry(.25,.75,6,10),cream,bear);arm.position.set(x,1.45,.35);arm.rotation.z=x>0?-1:.8}
// ears
for(const x of [-.55,.55]){const ear=sphere(.23,scene,cream,[1,1,.45]);ear.position.set(x,2.91,1.13);bear.add(ear);ear.children;const inner=mesh(new THREE.SphereGeometry(.11,12,8),mat(0xb9c8c5),bear);inner.position.set(x,2.91,1.36)}
// snout and eyes
const snout=mesh(new THREE.SphereGeometry(.38,16,12),white,bear);snout.position.set(0,2.25,1.72);snout.scale.set(1,.65,.75);
const muzzle=mesh(new THREE.SphereGeometry(.09,12,8),nose,bear);muzzle.position.set(0,2.27,2.03);muzzle.scale.set(1.25,.8,.55);
for(const x of [-.29,.29]){const eye=mesh(new THREE.SphereGeometry(.075,12,8),black,bear);eye.position.set(x,2.48,1.82)}
// tail hint
const tail=sphere(.22,scene,cream,[1,1,1]);tail.position.set(0,1.25,-1.15);bear.add(tail);

const keys={},vel=new THREE.Vector3(),targetDir=new THREE.Vector3();let yaw=0,lookYaw=0,jumpV=0,grounded=true;
addEventListener('keydown',e=>keys[e.code]=true);addEventListener('keyup',e=>keys[e.code]=false);
let dragging=false,lastX=0;
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX});addEventListener('pointerup',()=>dragging=false);addEventListener('pointermove',e=>{if(dragging){lookYaw-= (e.clientX-lastX)*.006;lastX=e.clientX}});
// joystick
const joy=document.querySelector('#joy'),stick=document.querySelector('#stick');let joyX=0,joyY=0;
joy.addEventListener('pointerdown',e=>joy.setPointerCapture(e.pointerId));joy.addEventListener('pointermove',e=>{if(!joy.hasPointerCapture(e.pointerId))return;const r=joy.getBoundingRect(),dx=e.clientX-r.left-48,dy=e.clientY-r.top-48;const len=Math.hypot(dx,dy)||1,k=Math.min(1,48/len);joyX=dx*k/48;joyY=dy*k/48;stick.style.transform=`translate(${joyX*27}px,${joyY*27}px)`});joy.addEventListener('pointerup',()=>{joyX=joyY=0;stick.style.transform='' });

function fishMesh(){const g=new THREE.Group();const b=mesh(new THREE.SphereGeometry(.24,16,10),fish,g);b.scale.set(1.4,.45,.7);const tail=mesh(new THREE.ConeGeometry(.25,.45,3),fish,g);tail.position.x=-.34;tail.rotation.z=Math.PI/2;const eye=mesh(new THREE.SphereGeometry(.035,8,6),black,g);eye.position.set(.26,.08,.12);g.rotation.x=.08;return g}
const fishes=[];for(let i=0;i<8;i++){let a=i*Math.PI*2/8,r=5+(i%3)*3;const f=fishMesh();f.position.set(Math.cos(a)*r,1+Math.sin(i*2)*.15,Math.sin(a)*r);f.scale.setScalar(.9);scene.add(f);fishes.push(f)}
let score=0;
function resetMotion(){bear.position.y=0}

const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.03);const forward=(keys.KeyW||keys.ArrowUp?-1:0)+(keys.KeyS||keys.ArrowDown?1:0)-joyY;const side=(keys.KeyD||keys.ArrowRight?1:0)+(keys.KeyA||keys.ArrowLeft?-1:0)+joyX;
const len=Math.hypot(forward,side);targetDir.set(-side,0,-forward);if(len>.1){targetDir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),lookYaw);bear.position.addScaledVector(targetDir,dt*4);yaw=Math.atan2(targetDir.x,targetDir.z);bear.rotation.y=THREE.MathUtils.lerp(bear.rotation.y,yaw,.16);for(const l of bear.children.filter(o=>o.geometry?.type==='CapsuleGeometry'))l.rotation.x=Math.sin(clock.elapsedTime*9)*.12}
if((keys.Space||keys.KeyK)&&grounded){jumpV=5.2;grounded=false}jumpV-=10*dt;bear.position.y+=jumpV*dt;if(bear.position.y<0){bear.position.y=0;jumpV=0;grounded=true}bear.position.x=THREE.MathUtils.clamp(bear.position.x,-24,24);bear.position.z=THREE.MathUtils.clamp(bear.position.z,-24,24);
for(let i=fishes.length-1;i>=0;i--){const f=fishes[i];f.rotation.y+=dt*2;f.position.y=1+.25*Math.sin(clock.elapsedTime*3+i);if(f.position.distanceTo(bear.position.clone().add(new THREE.Vector3(0,1,0)))<1.25){scene.remove(f);fishes.splice(i,1);score++;document.querySelector('#score').textContent=score;if(!fishes.length)document.querySelector('.title').textContent='🏆 Voyage accompli !'}}
const behind=new THREE.Vector3(-Math.sin(lookYaw)*7,5,-Math.cos(lookYaw)*7).add(bear.position);camera.position.lerp(behind,1-Math.pow(.001,dt));camera.lookAt(bear.position.x,bear.position.y+1.5,bear.position.z);renderer.render(scene,camera)}
resetMotion();animate();addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
