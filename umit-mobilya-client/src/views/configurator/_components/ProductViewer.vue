<template>
  <div
    ref="container"
    class="relative touch-none overflow-hidden bg-f-linen"
    :class="$attrs.class"
  >
    <canvas
      v-show="scene.supported.value"
      ref="canvas"
      class="block h-full w-full cursor-grab active:cursor-grabbing"
      data-testid="viewer-canvas"
    />

    <!--
      WebGL yoksa boş bir canvas bırakmak, kullanıcıya sayfanın bozuk olduğunu
      düşündürüyordu. Ölçüler ve fiyat zaten sağdaki panelde; kayıp olan
      yalnızca görsel.
    -->
    <div
      v-if="!scene.supported.value"
      class="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center"
      data-testid="viewer-fallback"
    >
      <p class="eyebrow">Önizleme görüntülenemiyor</p>
      <p class="max-w-prose text-sm text-f-ink-muted">
        Tarayıcın 3B görüntülemeyi desteklemiyor. Ölçüleri ve fiyatı yandaki
        panelden değiştirmeye devam edebilirsin; teklifin bundan etkilenmez.
      </p>
    </div>

    <ProductViewerControls
      v-if="scene.supported.value"
      :label="`${size.width} × ${size.height} × ${size.depth} cm`"
      :zoom="orbit.zoom.value"
      :min-zoom="orbit.minZoom"
      :max-zoom="orbit.maxZoom"
      @step="orbit.stepZoom"
      @reset="orbit.resetView"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { Vector3 } from 'three';

import { useOrbitZoom } from '@/composables/useOrbitZoom';
import { useThreeScene } from '@/composables/useThreeScene';

import ProductViewerControls from './ProductViewerControls.vue';

import type { Object3D } from 'three';

/**
 * Ürün bilmeyen görüntüleyici: verilen `Object3D`'yi çizer, ölçüsüne göre
 * kamerayı çerçeveler. Neyin çizildiğini bilmediği için gardırop, vestiyer ve
 * mutfak aynı bileşeni paylaşır.
 */
interface IProps {
  content: Object3D | null;
  size: { width: number; height: number; depth: number };
  /**
   * Kameranın sığdıracağı gerçek kutu. Etiketteki ölçüden ayrı, çünkü köşe
   * modülü olan bir gövdede ikisi aynı şey değil: etiket toplam koşu
   * uzunluğunu söyler, kamera ayak izini çerçevelemek zorundadır.
   */
  bounds?: { width: number; height: number; depth: number };
  /**
   * İçerik yerinde değiştirildiğinde (kapak açısı gibi) referans aynı kaldığı
   * için `content` izleyicisi tetiklenmez. Bu sayacı artırmak yeniden çizim
   * istemenin tek yolu.
   */
  version: number;
}

const props = defineProps<IProps>();

defineOptions({ inheritAttrs: false });

const CM = 0.01;

const container = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

const framed = computed(() => {
  const box = props.bounds ?? props.size;
  return box.width > 0 && box.height > 0 ? box : props.size;
});

const frame = () => {
  const size = new Vector3(
    framed.value.width * CM,
    framed.value.height * CM,
    framed.value.depth * CM,
  );
  scene.setBackdropDepth(size.z);
  orbit.frameBounds(size, size.y / 2);
};

const scene = useThreeScene(container, canvas, () => frame());
const orbit = useOrbitZoom(scene.camera, scene.requestRender);

watch(() => props.content, scene.setContent);

watch(() => props.version, scene.requestRender);

watch(
  () => [framed.value.width, framed.value.height, framed.value.depth],
  frame,
);

onMounted(() => {
  scene.mount();
  if (canvas.value) orbit.attach(canvas.value);
  scene.setContent(props.content);
  scene.resize();
  frame();
});
</script>
