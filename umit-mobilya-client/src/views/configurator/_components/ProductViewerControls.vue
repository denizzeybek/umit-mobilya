<template>
  <div class="pointer-events-none absolute inset-0">
    <span class="eyebrow pointer-events-auto absolute left-4 top-4 bg-f-bone/80 px-2 py-1">
      {{ label }}
    </span>

    <div class="pointer-events-auto absolute bottom-4 left-4 flex">
      <Button
        severity="secondary"
        variant="outlined"
        aria-label="Uzaklaştır"
        :disabled="zoom <= minZoom"
        class="!rounded-none !bg-f-bone/90"
        @click="emit('step', -1)"
      >
        −
      </Button>
      <Button
        severity="secondary"
        variant="outlined"
        aria-label="Yakınlaştır"
        :disabled="zoom >= maxZoom"
        class="!-ml-px !rounded-none !bg-f-bone/90"
        @click="emit('step', 1)"
      >
        +
      </Button>
    </div>

    <Button
      severity="secondary"
      variant="outlined"
      class="pointer-events-auto !absolute !bottom-4 !right-4 !rounded-none !bg-f-bone/90 !text-[0.65rem] !uppercase !tracking-[0.14em]"
      @click="emit('reset')"
    >
      Görünümü sıfırla
    </Button>
  </div>
</template>

<script setup lang="ts">
interface IProps {
  label: string;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

interface IEmits {
  (event: 'step', direction: number): void;
  (event: 'reset'): void;
}

defineProps<IProps>();

const emit = defineEmits<IEmits>();
</script>
