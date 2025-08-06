import { FBXLoader } from 'three/examples/jsm/Addons.js';
import * as THREE from 'three';


export class Boat {
  boat: THREE.Object3D | null;
  scene: THREE.Scene;

    

  constructor(scene: THREE.Scene) {
      this.boat = null;
      this.scene = scene;
  }

  spawnBoat() {
    const fbxLoader = new FBXLoader()
    fbxLoader.load(
      'models/Boat.fbx',
      (object) => {
        object.scale.set(5, 5, 5);
        object.position.set(0, 2.1, 0);
        this.boat = object;
        this.scene.add(object)
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      },
      (error) => {
        console.log(error)
      }
    )
  }
  
  boatAtWaves(amplitude = 2.0, frequency = 0.2, speed = 0.5,time = 0) {
      if (this.boat) {
      const x = this.boat.position.x ;
      const z = this.boat.position.z;
      const waveHeight = amplitude *
        (Math.sin(x * frequency + time * speed) +
          Math.sin(z * frequency + time * speed) * 0.5);
  
      this.boat.position.y = waveHeight +5;
  
      this.boat.rotation.x = 0.02 * Math.sin(time * 1.5);
      this.boat.rotation.z = 0.02 * Math.cos(time * 1.2);
    }
  }

  goForward(vector: THREE.Vector3): void {
    if (this.boat) {
      this.boat.position.add(vector);
    }
  }

    
}    




