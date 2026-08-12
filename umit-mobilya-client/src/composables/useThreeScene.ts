import { onBeforeUnmount, shallowRef } from 'vue';

import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

import type { Ref } from 'vue';

/**
 * Ürün bilmeyen sahne kabuğu: renderer, kamera, ışık, zemin ve duvar. İçine ne
 * konduğuyla ilgilenmez — `setContent` bir `Object3D` alır, öncekini çıkarır.
 *
 * Sürekli dönen bir animasyon döngüsü YOK. Sahnede kendiliğinden hareket eden
 * hiçbir şey olmadığı için yalnızca bir şey değiştiğinde tek kare çiziliyor;
 * `requestRender` bunu bir sonraki kareye toplar.
 */
export interface IThreeScene {
  camera: Ref<PerspectiveCamera | null>;
  requestRender: () => void;
  setContent: (next: Object3D | null) => void;
  resize: () => void;
  mount: () => void;
}

export const useThreeScene = (
  container: Ref<HTMLElement | null>,
  canvas: Ref<HTMLCanvasElement | null>,
  onResize?: () => void,
): IThreeScene => {
  const camera = shallowRef<PerspectiveCamera | null>(null);

  let renderer: WebGLRenderer | null = null;
  let scene: Scene | null = null;
  let content: Object3D | null = null;
  let observer: ResizeObserver | null = null;
  let frame = 0;

  const requestRender = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (renderer && scene && camera.value) renderer.render(scene, camera.value);
    });
  };

  const setContent = (next: Object3D | null) => {
    if (!scene) return;
    if (content) scene.remove(content);
    content = next;
    if (next) scene.add(next);
    requestRender();
  };

  const resize = () => {
    if (!renderer || !camera.value || !container.value) return;

    const { clientWidth, clientHeight } = container.value;
    if (!clientWidth || !clientHeight) return;

    renderer.setSize(clientWidth, clientHeight, false);
    camera.value.aspect = clientWidth / clientHeight;
    camera.value.updateProjectionMatrix();
    onResize?.();
    requestRender();
  };

  const addLights = (target: Scene) => {
    const key = new DirectionalLight(0xfff6e8, 2.1);
    key.position.set(2.6, 4.2, 3.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 18;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.0007;
    target.add(key);

    const fill = new DirectionalLight(0xdfe6ea, 0.5);
    fill.position.set(-3.2, 2.4, 1.8);
    target.add(fill);

    target.add(new HemisphereLight(0xffffff, 0xcfc6b6, 0.85));
  };

  const addBackdrop = (target: Scene) => {
    const floor = new Mesh(
      new PlaneGeometry(30, 30),
      new MeshStandardMaterial({ color: 0xf3ece0, roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    target.add(floor);

    const wall = new Mesh(
      new PlaneGeometry(30, 18),
      new MeshStandardMaterial({ color: 0xeee8dd, roughness: 1 }),
    );
    wall.position.set(0, 9, -1.6);
    wall.receiveShadow = true;
    target.add(wall);
  };

  const mount = () => {
    if (!canvas.value || !container.value) return;

    renderer = new WebGLRenderer({ canvas: canvas.value, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    scene = new Scene();
    scene.background = new Color(0xeae4d9);
    addLights(scene);
    addBackdrop(scene);

    camera.value = new PerspectiveCamera(38, 1, 0.1, 100);

    observer = new ResizeObserver(resize);
    observer.observe(container.value);
  };

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame);
    observer?.disconnect();

    scene?.traverse((child) => {
      if (child instanceof Mesh) child.geometry.dispose();
    });
    renderer?.dispose();

    renderer = null;
    scene = null;
    content = null;
    camera.value = null;
  });

  return { camera, requestRender, setContent, resize, mount };
};
