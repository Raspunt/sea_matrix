import * as THREE from "three";

export class SeaChunk {
  geometry: THREE.BoxGeometry;
  material: THREE.MeshStandardMaterial;
  scene: THREE.Scene;
  chankSize: number = 10;
  fullChankSize: number = this.chankSize * this.chankSize;
  dummy: THREE.Object3D = new THREE.Object3D();
  color: THREE.Color = new THREE.Color();
  sea_color = new THREE.Color(0x004f6e);
  loadedChanks: Set<string>;
  radius_render: number = 100;

  constructor(scene: THREE.Scene) {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("textures/edge3.jpg");
    texture.colorSpace = THREE.SRGBColorSpace;

    this.geometry = new THREE.BoxGeometry();
    this.material = new THREE.MeshStandardMaterial({ map: texture });
    this.loadedChanks = new Set();

    this.scene = scene;
  }

  private getChunkKey(vec: THREE.Vector3): string {
    return `${vec.x}_${vec.z}`;
  }

  // Функия которая создает один чанк моря
  // start_vec - координаты начала чанка (левый нижний угол)
  createSeaChank(start_vec: THREE.Vector3): void {
    const mesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.fullChankSize
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(mesh);

    let i = 0;
    for (let x = 0; x < this.chankSize; x++) {
      for (let z = 0; z < this.chankSize; z++) {
        const posX = start_vec.x + x;
        const posZ = start_vec.z + z;

        this.dummy.position.set(posX, 0, posZ);
        this.dummy.scale.set(1, 2, 1);
        this.dummy.updateMatrix();

        this.color.setHSL(
          1,
          0.5 + Math.random() * 0.5,
          0.5 + Math.random() * 0.5
        );
        mesh.setMatrixAt(i, this.dummy.matrix);
        mesh.setColorAt(i, this.color.clone().multiply(this.sea_color));
        i++;
      }
    }

    // Только после успешной генерации
    this.loadedChanks.add(this.getChunkKey(start_vec));
  }

  // Функция которая создает чанки моря вокруг игрока
  // center_origin - координаты игрока (центр игрока)
  calculateCountChunks(center_origin: THREE.Vector3) {
    const count_chunks = Math.ceil(this.radius_render / this.chankSize);

    for (let x = -count_chunks; x <= count_chunks; x++) {
      for (let z = -count_chunks; z <= count_chunks; z++) {
        const posX =
          Math.floor((center_origin.x + x * this.chankSize) / this.chankSize) *
          this.chankSize;
        const posZ =
          Math.floor((center_origin.z + z * this.chankSize) / this.chankSize) *
          this.chankSize;

        const key = this.getChunkKey(new THREE.Vector3(posX, 0, posZ));
        if (this.loadedChanks.has(key)) continue;

        const dx = center_origin.x - posX;
        const dz = center_origin.z - posZ;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < this.radius_render) {
          this.createSeaChank(new THREE.Vector3(posX, 0, posZ));
        }
      }
    }
  }
}
