import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import TWEEN from 'three/addons/libs/tween.module.js';
import { FlyControls } from 'three/examples/jsm/Addons.js';
import { FBXLoader } from 'three/examples/jsm/Addons.js';

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene = new THREE.Scene();;
let renderer: THREE.WebGLRenderer;
let timer: any;
let mesh: THREE.InstancedMesh;

const amount = 100;
const count = amount * amount;

const dummy = new THREE.Object3D();

const seeds: number[] = [];
const baseColors: number[] = [];

const color = new THREE.Color();
const colors = [
  new THREE.Color(0x004f6e), // deep ocean
  new THREE.Color(0x007b8a), // mid-sea
  new THREE.Color(0x00bfae), // turquoise
  new THREE.Color(0x50d8d7), // shallow water
];

const animation = { t: 0 };
let currentColorIndex = 0;
let nextColorIndex = 1;

const maxDistance = 75;

let controls: FlyControls;


const waveParams = {
  speed: 0.5,
  frequency: 0.2,
  amplitude: 2.0,
};



const verticalSpeed = 10;
const keys = {
  up: false,
  down: false,
};

let boat: THREE.Object3D | null = null;



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

  timer = new THREE.Timer();
  timer.connect(document);

  const loader = new THREE.TextureLoader();
  const texture = loader.load('textures/edge3.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ map: texture });

  mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  const offset = (amount - 1) / 2;

  let i = 0;

  for (let x = 0; x < amount; x++) {
    for (let z = 0; z < amount; z++) {
      dummy.position.set(offset - x, 0, offset - z);
      dummy.scale.set(1, 2, 1);
      dummy.updateMatrix();

      color.setHSL(1, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5);
      baseColors.push(color.getHex());

      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.clone().multiply(colors[0]));

      seeds.push(Math.random());
      i++;
    }
  }

  window.addEventListener('resize', onWindowResize);
  setInterval(startTween, 5000);
}

function startTween(): void {
  new TWEEN.Tween(animation)
    .to({ t: 1 }, 2000)
    .easing(TWEEN.Easing.Sinusoidal.In)
    .onComplete(() => {
      animation.t = 0;
      currentColorIndex = nextColorIndex;
      nextColorIndex = (nextColorIndex + 1) % colors.length;
    })
    .start();
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


  if (keys.up) {
    camera.position.y += verticalSpeed * timer.getDelta();
  }
  if (keys.down) {
    camera.position.y -= verticalSpeed * timer.getDelta();
  }




  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, dummy.matrix);
    dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

    const px = dummy.position.x;
    const pz = dummy.position.z;

    dummy.position.y =
      Math.sin(px * waveParams.frequency + time * waveParams.speed) +
      Math.sin(pz * waveParams.frequency + time * waveParams.speed) * 0.5;
    dummy.position.y *= waveParams.amplitude;

    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);



    // Цветовая интерполяция
    if (animation.t > 0) {
      const currentColor = colors[currentColorIndex];
      const nextColor = colors[nextColorIndex];

      const f = dummy.position.length() / maxDistance;

      if (f <= animation.t) {
        color.setHex(baseColors[i]).multiply(nextColor);
      } else {
        color.setHex(baseColors[i]).multiply(currentColor);
      }

      mesh.setColorAt(i, color);
    }
  }

  if (boat) {
    const x = boat.position.x;
    const z = boat.position.z;
    const waveHeight = waveParams.amplitude *
      (Math.sin(x * waveParams.frequency + time * waveParams.speed) +
        Math.sin(z * waveParams.frequency + time * waveParams.speed) * 0.5);

    boat.position.y = waveHeight +5;

    // Плавное покачивание
    boat.rotation.x = 0.02 * Math.sin(time * 1.5);
    boat.rotation.z = 0.02 * Math.cos(time * 1.2);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (animation.t > 0) mesh.instanceColor!.needsUpdate = true;

  mesh.computeBoundingSphere();
  renderer.render(scene, camera);
}



function up_down_control() {
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') keys.up = true;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keys.down = true;
  });

  window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') keys.up = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keys.down = false;
  });

}
function bindWaveControls() {
  const speedInput = document.querySelector<HTMLInputElement>('input[name="waveSpeed"]');
  const freqInput = document.querySelector<HTMLInputElement>('input[name="waveFrequency"]');
  const ampInput = document.querySelector<HTMLInputElement>('input[name="waveAmplitude"]');

  speedInput?.addEventListener('input', () => {
    waveParams.speed = parseFloat(speedInput.value);
  });

  freqInput?.addEventListener('input', () => {
    waveParams.frequency = parseFloat(freqInput.value);
  });

  ampInput?.addEventListener('input', () => {
    waveParams.amplitude = parseFloat(ampInput.value);
  });
}


function spawnBoat() {
  const fbxLoader = new FBXLoader()
  fbxLoader.load(
    'models/Boat.fbx',
    (object) => {
      object.scale.set(10, 10, 10);
      object.position.set(10, 0, 0);
      boat = object;
      scene.add(object)
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
      console.log(error)
    }
  )
}

function addLights() {
  // Мягкий рассеянный свет
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // белый, слабый
  scene.add(ambientLight);

  // Направленный свет (имитация солнца)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;

  // Настройки теней (по желанию)
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

bindWaveControls();
up_down_control();
spawnBoat();

