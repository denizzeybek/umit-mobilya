<template>
  <div class="flex flex-col gap-2">
    <label :for="id">{{ label }}</label>
    <Password
      v-model="passwordVal"
      :placeholder="placeholder"
      class="w-full"
      :toggleMask="toggleMask"
      :feedback="feedback"
      :invalid="!!errorMessage"
      :class="[customClass]"
      :disabled="disabled"
      v-bind="primeProps"
    />
    <small
      v-if="errorMessage"
      :id="`${id}-help`"
      class="p-error text-red-500"
      >{{ errorMessage }}</small
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import Password from 'primevue/password';
import { useField } from 'vee-validate';

import type { PasswordProps } from 'primevue/password';

interface IProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  customClass?: string;
  primeProps?: PasswordProps;
  validatingAsync?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  toggleMask?: boolean;
  feedback?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  disabled: false,
  validatingAsync: false,
  toggleMask: true,
  feedback: false,
});

const passwordVal = ref();

const { errorMessage: vError, value } = useField(() => props.name, undefined, {
  validateOnValueUpdate: false,
  syncVModel: true,
});
const errorMessage = computed(() =>
  props.errorMessage ? props.errorMessage : vError.value,
);

watch(
  () => passwordVal.value,
  (newValue) => {
    value.value = newValue;
  },
  { immediate: true },
);
</script>

<style scoped></style>
