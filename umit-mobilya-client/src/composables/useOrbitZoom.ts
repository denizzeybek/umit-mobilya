import { onBeforeUnmount, ref } from 'vue';

import { Spherical, Vector3 } from 'three';

import type { PerspectiveCamera } from 'three';
import type { Ref } from 'vue';

/**
 * Kamerayı hedef etrafında döndürür ve yakınlaştırır. `OrbitControls` yerine
 * elle yazıldı çünkü ihtiyacın tamamı bu: kaydırma yok, panning yok, sönümleme
 * yok — üçünü de getiren bir bağımlılık paket boyutuna değmiyor.
 *
 * Yakınlaştırma mutlak mesafe değil, "sığdıran mesafe"nin katı olarak tutulur:
 * kullanıcı yakınlaşmışken nesnenin ölçüsü değişince yakınlık oranı korunur,
 * kamera sıçramaz.
 */
const START_THETA = Math.PI * 0.13;
const START_PHI = Math.PI * 0.42;
const MIN_PHI = 0.25;
const MAX_PHI = Math.PI * 0.495;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;
const START_ZOOM = 1 / ZOOM_STEP;

export interface IOrbitZoom {
  zoom: Ref<number>;
  minZoom: number;
  maxZoom: number;
  frameBounds: (size: Vector3, centerY: number) => void;
  stepZoom: (direction: number) => void;
  resetView: () => void;
  attach: (canvas: HTMLCanvasElement) => void;
}

export const useOrbitZoom = (
  camera: Ref<PerspectiveCamera | null>,
  onChange: () => void,
): IOrbitZoom => {
  const zoom = ref(START_ZOOM);
  const spherical = new Spherical(4, START_PHI, START_THETA);
  const target = new Vector3(0, 1.1, 0);
  const pointers = new Map<number, { x: number; y: number }>();

  let fitRadius = 4;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pinchDistance = 0;
  let attached: HTMLCanvasElement | null = null;

  const apply = () => {
    if (!camera.value) return;
    camera.value.position.setFromSpherical(spherical).add(target);
    camera.value.lookAt(target);
    onChange();
  };

  /**
   * Nesneyi çevreleyen küreyi görüş konisine sığdırır. Dar bir sütunda dikey
   * değil YATAY görüş açısı sınırlayıcı olduğu için ikisinin küçüğü alınır.
   */
  const frameBounds = (size: Vector3, centerY: number) => {
    if (!camera.value) return;

    const boundingRadius = size.length() / 2;
    const vFov = (camera.value.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.value.aspect);
    const limiting = Math.min(vFov, hFov);

    target.set(0, centerY, 0);
    fitRadius = (boundingRadius / Math.sin(limiting / 2)) * 1.08;
    spherical.radius = fitRadius / zoom.value;
    apply();
  };

  const setZoom = (next: number) => {
    const clamped = Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
    if (clamped === zoom.value) return;

    zoom.value = clamped;
    spherical.radius = fitRadius / clamped;
    apply();
  };

  const stepZoom = (direction: number) => {
    setZoom(zoom.value * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP));
  };

  const resetView = () => {
    spherical.theta = START_THETA;
    spherical.phi = START_PHI;
    zoom.value = START_ZOOM;
    spherical.radius = fitRadius / zoom.value;
    apply();
  };

  const pinchSpread = (): number => {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (event: PointerEvent) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      return;
    }

    dragging = false;
    pinchDistance = pinchSpread();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const spread = pinchSpread();
      if (pinchDistance > 0 && spread > 0) setZoom(zoom.value * (spread / pinchDistance));
      pinchDistance = spread;
      return;
    }

    if (!dragging) return;

    spherical.theta -= (event.clientX - lastX) * 0.008;
    spherical.phi = Math.min(
      Math.max(spherical.phi - (event.clientY - lastY) * 0.006, MIN_PHI),
      MAX_PHI,
    );

    lastX = event.clientX;
    lastY = event.clientY;
    apply();
  };

  const onPointerUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = 0;
    if (pointers.size === 0) dragging = false;
  };

  /*
   * Tekerlek olayı yutuluyor, yoksa yakınlaştırmak isteyen kullanıcı sayfayı
   * kaydırıyor. Erişilebilir kalması için görüntüleyicide ayrıca +/− düğmeleri
   * var.
   */
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    setZoom(zoom.value * Math.exp(-event.deltaY * 0.0015));
  };

  const attach = (canvas: HTMLCanvasElement) => {
    attached = canvas;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  onBeforeUnmount(() => {
    attached?.removeEventListener('pointerdown', onPointerDown);
    attached?.removeEventListener('wheel', onWheel);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  });

  return {
    zoom,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    frameBounds,
    stepZoom,
    resetView,
    attach,
  };
};
