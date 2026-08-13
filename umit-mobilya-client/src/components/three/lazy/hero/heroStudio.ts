import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

import { colors } from '@/constants/colors';

/**
 * Hero sahnesinin ışığı, zemini ve kamerası. Konfigüratörün `useThreeScene`i
 * bilerek kullanılmıyor: o kemik rengi bir stüdyo kuruyor ve "kendiliğinden
 * hareket eden hiçbir şey yok" ilkesiyle yazılmış. Buradaki sahne karanlık bir
 * boşluk ve kaydırmaya bağlı sürekli hareket ediyor — ikisini tek dosyada
 * toplamak o dosyanın anlamını bozardı.
 */

/*
 * Sahnenin arka planı, altındaki bölümün zeminiyle AYNI olmak zorunda: canvas
 * saydamdan görünüre geçerken iki renk ayrışırsa açılış bir renk atlaması
 * gibi görünüyor. Tek kaynak paletteki `f-void`.
 */
const VOID_COLOR = colors['f-void'];

export interface IHeroStudio {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
}

const addLights = (target: Scene): void => {
  const key = new DirectionalLight(0xfff0d6, 4.4);
  key.position.set(3.8, 4.2, 2.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 18;
  key.shadow.camera.left = -3.6;
  key.shadow.camera.right = 3.6;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -1;
  key.shadow.bias = -0.0008;
  target.add(key);

  /* Pirinç bir kenar ışığı: karanlık zeminde dolabın sınırını çiziyor. */
  const rim = new DirectionalLight(0xc9a76b, 2.4);
  rim.position.set(-3.6, 2.2, -2.4);
  target.add(rim);

  /*
   * Öndeki dolgu ışığı montajın sonu için: kapak açıldığında gövdenin içi
   * anahtar ışığa sırtını dönüyor ve raflarla askılık kapkara kalıyordu.
   */
  const fill = new DirectionalLight(0xffe8c8, 1.05);
  fill.position.set(-1.6, 1.8, 4.6);
  target.add(fill);

  target.add(new HemisphereLight(0x6b5b45, 0x0b0a08, 0.55));
};

const addBackdrop = (target: Scene): void => {
  const floor = new Mesh(
    new PlaneGeometry(40, 40),
    new MeshStandardMaterial({ color: 0x171410, roughness: 0.82 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  target.add(floor);

  const wall = new Mesh(
    new PlaneGeometry(40, 24),
    new MeshStandardMaterial({ color: 0x211d16, roughness: 1 }),
  );
  wall.position.set(0, 12, -3.4);
  target.add(wall);
};

/**
 * WebGL her yerde yok — eski cihazlar, kurumsal politikalar, kapalı donanım
 * hızlandırması. Bağlam alınamazsa `null` dönüyor ve hero posteriyle kalıyor;
 * kırık bir canvas bırakmak sayfayı bozuk gösteriyordu.
 */
export const createHeroStudio = (
  canvas: HTMLCanvasElement,
): IHeroStudio | null => {
  let renderer: WebGLRenderer;

  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  scene.background = new Color(VOID_COLOR);
  scene.fog = new FogExp2(VOID_COLOR, 0.048);
  addLights(scene);
  addBackdrop(scene);

  return { renderer, scene, camera: new PerspectiveCamera(32, 1, 0.1, 80) };
};

export const disposeHeroStudio = (studio: IHeroStudio): void => {
  studio.scene.traverse((child) => {
    if (child instanceof Mesh) child.geometry.dispose();
  });
  studio.renderer.dispose();
};
