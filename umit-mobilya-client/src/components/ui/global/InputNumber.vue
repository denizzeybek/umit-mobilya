<template>
  <div class="flex items-center w-full mx-auto justify-center">
    <button
      class="group rounded-l-full px-6 py-[18px] border border-gray-200 flex items-center justify-center shadow-sm shadow-transparent transition-all duration-500 hover:shadow-gray-200 hover:border-gray-300 hover:bg-gray-50"
    >
      <span class="pi pi-minus"></span>
    </button>
    <input
      :id="name"
      ref="input"
      v-model="value"
      :name="name"
      :data-error="!!errorMessage"
      :data-valid="isValid"
      :disabled="disabled"
      type="text"
      class="border-y border-gray-200 outline-none text-gray-900 font-semibold text-lg w-full max-w-[118px] min-w-[80px] placeholder:text-gray-900 py-[13px] text-center bg-transparent"
      placeholder="1"
      v-on="listeners"
    />
    <button
      class="group rounded-r-full px-6 py-[18px] border border-gray-200 flex items-center justify-center shadow-sm shadow-transparent transition-all duration-500 hover:shadow-gray-200 hover:border-gray-300 hover:bg-gray-50"
    >
      <span class="pi pi-plus"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useField } from 'vee-validate';

export interface IProps {
  label?: string;
  name: string;
  placeholder?: string;
  disabled?: boolean;
  modelValue?: string;
  errorMessage?: string;
  isValid?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  disabled: false,
});

const {
  errorMessage: vError,
  value,
  handleBlur,
  handleChange,
} = useField(() => props.name, undefined, {
  validateOnValueUpdate: false,
  syncVModel: true,
});
const errorMessage = computed(() =>
  props.errorMessage ? props.errorMessage : vError.value,
);

const listeners = {
  blur: (e: InputEvent) => {
    handleBlur(e, true);
  },
  change: (e: InputEvent) => {
    handleChange(e);
  },
  input: (e: InputEvent) => {
    handleChange(value, !!errorMessage.value);
  },
};
</script>

<style scoped></style>
