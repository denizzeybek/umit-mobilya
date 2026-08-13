<template>
  <div ref="container" class="absolute inset-0">
    <canvas
      ref="canvas"
      class="block h-full w-full transition-opacity duration-700 ease-editorial"
      :class="isPainted ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
      data-testid="hero-canvas"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { Vector3 } from 'three';

import { DEFAULT_PRICE_BOOK } from '@/views/configurator/_etc/pricing/defaults';
import { createDefaultConfig } from '@/views/configurator/_etc/products/gardirop/options';
import { gardiropParts } from '@/views/configurator/_etc/products/gardirop/parts';

import { applyAssembly, ASSEMBLY_SPAN } from './heroAssembly';
import { createHeroStudio, disposeHeroStudio } from './heroStudio';
import { buildHeroWardrobe } from './heroWardrobe';

import type { IHeroStudio } from './heroStudio';
import type { IHeroBuild } from './heroWardrobe';
import type { IGardiropConfig } from '@/views/configurator/_etc/products/gardirop/types';

/*
 * Ana sayfanın 3B katmanı. YALNIZCA `defineAsyncComponent` ile isteniyor:
 * `three` ~500 kB ve ana paketin tavanı 1800 kB — statik bir import ana paketi
 * tavanın üstüne çıkarır. Klasör de bu yüzden `components/three/lazy/`
 * (Rule 10).
 */

/**
 * `track`, montajın ilerlemesini ölçtüğümüz dış bölüm. Canvas'ın kendi kabı
 * KULLANILAMAZ: o yapışkan bir kutunun içinde ve kaydırma boyunca ekranın
 * tepesinde duruyor, yani kendi `getBoundingClientRect().top`'u hep 0 —
 * ilerleme sonsuza kadar 0'da kalırdı.
 */
interface IProps {
  track?: HTMLElement | null;
}

const props = withDefaults(defineProps<IProps>(), { track: null });

const emit = defineEmits<{
  progress: [percent: number];
  unsupported: [];
}>();

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const isPainted = ref(false);

/*
 * Kamera dolabın ortasına DEĞİL, solundaki bir noktaya bakıyor: hero metni sol
 * altta duruyor, dolap da kadrajın sağına düşsün diye. Bakılan nokta montajla
 * birlikte sağa kayıyor — dağınık hâl geniş yer kaplıyor, monte dolap dar.
 */
const TARGET = new Vector3(-1.68, 1.04, 0);
const TARGET_X_ASSEMBLED = -1.26;

/**
 * Ana sayfada gösterilen kurulum. Ölçüler konfigüratörün varsayılanından
 * geliyor — bölüm genişlikleri gövde ölçüsünden hesaplandığı için elle
 * yazılmıyor — iç düzen ise montajın görülecek kadar zengin olması için
 * değiştirilmiş: bir bölüm raflı ve askılı, diğeri çekmeceli.
 */
const heroConfig = (): IGardiropConfig => {
  const base = createDefaultConfig();

  return {
    ...base,
    height: 226,
    sections: base.sections.map((section, index) =>
      index === 0
        ? { ...section, shelves: [28, 60, 96], rails: [110], drawers: 0 }
        : { ...section, shelves: [30], rails: [42], drawers: 4 },
    ),
  };
};

let studio: IHeroStudio | null = null;
let build: IHeroBuild | null = null;
let observer: ResizeObserver | null = null;

let frame = 0;
let yaw = 0;
let pitch = 0;
let yawTarget = 0;
let pitchTarget = 0;
let reported = -1;

const orbit = (assembled: number): void => {
  if (!studio) return;

  const distance = 8.3 - 1.4 * assembled;
  const theta = 0.62 - 0.2 * assembled + yaw;

  studio.camera.position.set(
    Math.sin(theta) * distance,
    2.5 - 0.45 * assembled + pitch,
    Math.cos(theta) * distance,
  );
  TARGET.x = -1.68 + (TARGET_X_ASSEMBLED + 1.68) * assembled;
  studio.camera.lookAt(TARGET);
};

const tick = (): void => {
  frame = 0;
  if (!studio || !build || !container.value) return;

  const rect = (props.track ?? container.value).getBoundingClientRect();
  if (rect.bottom < -80) return;

  const travel =
    Math.max(rect.height - window.innerHeight, rect.height * 0.5) *
    ASSEMBLY_SPAN;
  const progress = Math.min(Math.max(-rect.top / travel, 0), 1);

  const yawGap = yawTarget - yaw;
  const pitchGap = pitchTarget - pitch;
  yaw += yawGap * 0.09;
  pitch += pitchGap * 0.09;

  applyAssembly(build.nodes, progress);
  orbit(progress);
  studio.renderer.render(studio.scene, studio.camera);
  isPainted.value = true;

  const percent = Math.round(progress * 100);
  if (percent !== reported) {
    reported = percent;
    emit('progress', percent);
  }

  if (Math.abs(yawGap) > 0.0006 || Math.abs(pitchGap) > 0.0006) schedule();
};

function schedule(): void {
  if (!frame) frame = requestAnimationFrame(tick);
}

const resize = (): void => {
  if (!studio || !container.value) return;

  const { clientWidth, clientHeight } = container.value;
  if (!clientWidth || !clientHeight) return;

  studio.renderer.setSize(clientWidth, clientHeight, false);
  studio.camera.aspect = clientWidth / clientHeight;
  studio.camera.updateProjectionMatrix();
  schedule();
};

/** İmleç sahneyi çok az çeviriyor: durgun bir kare ölü görünüyordu. */
const onPointerMove = (event: PointerEvent): void => {
  const rect = container.value?.getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) return;

  yawTarget = ((event.clientX - rect.left) / rect.width - 0.5) * -0.16;
  pitchTarget = ((event.clientY - rect.top) / rect.height - 0.5) * 0.42;
  schedule();
};

onMounted(() => {
  if (!canvas.value || !container.value) return;

  studio = createHeroStudio(canvas.value);
  if (!studio) {
    emit('unsupported');
    return;
  }

  build = buildHeroWardrobe(gardiropParts(heroConfig(), DEFAULT_PRICE_BOOK));
  studio.scene.add(build.group);

  observer = new ResizeObserver(resize);
  observer.observe(container.value);

  window.addEventListener('scroll', schedule, { passive: true });
  container.value.addEventListener('pointermove', onPointerMove);

  resize();
});

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
  window.removeEventListener('scroll', schedule);
  container.value?.removeEventListener('pointermove', onPointerMove);
  observer?.disconnect();

  build?.dispose();
  if (studio) disposeHeroStudio(studio);

  studio = null;
  build = null;
});
</script>
