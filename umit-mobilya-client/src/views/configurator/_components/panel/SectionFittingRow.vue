<template>
  <label class="flex items-center gap-3">
    <span class="flex-1 text-sm text-f-ink-muted">{{ label }}</span>

    <InputNumber
      v-model="value"
      :min="0"
      :max="max"
      suffix=" cm"
      input-class="!w-24 !px-3"
    />

    <Button
      icon="pi pi-times"
      size="small"
      severity="secondary"
      variant="text"
      rounded
      :aria-label="`${label} kaldır`"
      @click="emit('remove')"
    />
  </label>
</template>

<script setup lang="ts">
/**
 * Raf ve askılık satırı aynı şekilde: tavandan ölçülen bir sayı ve bir kaldır
 * düğmesi. İkisini tek bileşende toplamak, ileride üçüncü bir donanım tipi
 * eklendiğinde de tek yerde değişmesini sağlıyor.
 */
interface IProps {
  label: string;
  max: number;
}

interface IEmits {
  (event: 'remove'): void;
}

defineProps<IProps>();

const emit = defineEmits<IEmits>();

const value = defineModel<number>({ required: true });
</script>
