import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { FlyControls } from 'three/examples/jsm/Addons.js';

import { Boat } from './boat.ts';
import { SeaChunk } from './sea_chanks.ts';

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene = new THREE.Scene();;
let renderer: THREE.WebGLRenderer;


let timer: any;
let controls: FlyControls;

const waveParams = {
  speed: 0.5,
  frequency: 0.2,
  amplitude: 2.0,
};

const boat = new Boat(scene);
const seaChunk = new SeaChunk(scene);

function init(): void {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  controls = new FlyControls(camera, renderer.domElement);
  controls.movementSpeed = 20;
  controls.rollSpeed = Math.PI / 24;
  controls.autoForward = false;
  controls.dragToLook = true;

  camera.position.set(0, 10, 20);
  renderer.domElement.tabIndex = 1;
  renderer.domElement.focus();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  scene.background = new THREE.Color(0xadd8e6);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  seaChunk.createSeaChank(new THREE.Vector3(0, 0, 0));
  seaChunk.createSeaChank(new THREE.Vector3(10, 0, 10));
  
  boat.spawnBoat();

  timer = new THREE.Timer();
  timer.connect(document);


  window.addEventListener('resize', onWindowResize);
}

function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function animate(): void {
  timer.update();
  const time = timer.getElapsed();

  TWEEN.update();
  controls.update(timer.getDelta());


  controls.update(timer.getDelta());

  renderer.render(scene, camera);
}


function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // белый, слабый
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;

  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;

  scene.add(directionalLight);
}

init();
addLights();

