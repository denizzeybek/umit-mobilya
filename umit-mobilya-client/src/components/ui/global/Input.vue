<template>
  <div
    v-click-outside="handleOutsideClick"
    class="flex flex-col gap-2 relative"
  >
    <label :for="id">{{ label }}</label>
    <div class="flex items-center">
      <Button
        v-if="showAdjustmentButtons"
        icon="pi pi-minus"
        outlined
        severity="secondary"
        class="!min-w-[40px]"
        @click="adjustInput(-1)"
      />
      <InputText
        :id="id"
        :value="value"
        :data-error="!!errorMessage"
        :data-valid="isValid"
        :placeholder="placeholder"
        :disabled="disabled"
        :unstyled="unstyled"
        class="w-full"
        :invalid="!!errorMessage"
        :list="list"
        :class="[customClass]"
        v-bind="primeProps"
        @update:value="(newValue: string) => (value = newValue)"
        @focus="list ? (showOptions = true) : (showOptions = false)"
        @input="filterOptions"
        v-on="listeners"
      />
      <Button
        v-if="showAdjustmentButtons"
        icon="pi pi-plus"
        outlined
        severity="secondary"
        class="!min-w-[40px]"
        @click="adjustInput(1)"
      />
    </div>
    <slot name="dataList" />
    <ul
      v-if="showOptions"
      class="absolute z-10 py-2 px-1 gap-2 translate-y-10 w-full mt-1 border rounded-md bg-white"
    >
      <li
        v-for="option in filteredOptions"
        :key="option"
        class="hover:bg-slate-100 cursor-pointer rounded-s px-3 py-2"
        @click="selectOption(option)"
      >
        {{ option }}
      </li>
      <div
        v-if="!filteredOptions.length"
        class="px-3 py-2 gap-4 w-full flex flex-col"
      >
        <FText innerText="No option found" />
        <Button
          label="Ekle"
          icon="pi pi-plus"
          class="flex-1"
          outlined
          @click="addNewOption"
        />
      </div>
    </ul>
    <small :id="`${id}-help`" class="p-error text-red-500">{{
      errorMessage
    }}</small>
  </div>
</template>

<script setup lang="ts">
import { computed, type InputHTMLAttributes, ref } from 'vue';

import { useField } from 'vee-validate';

import type { InputTextProps } from 'primevue/inputtext';

interface IProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  customClass?: string;
  primeProps?: InputTextProps;
  errorMessage?: string;
  customEvents?: Record<string, (e: Event) => any>;
  transformValue?: (value: InputEvent) => unknown;
  list?: InputHTMLAttributes['list'];
  modelValue?: string;
  isValid?: boolean;
  disabled?: boolean;
  unstyled?: boolean;
  datalistOptions?: string[];
  showAdjustmentButtons?: boolean;
  isReturnNumber?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  type: 'text',
  disabled: false,
  placeholder: '',
  unstyled: false,
  showAdjustmentButtons: false,
  isReturnNumber: false,
});

const emit = defineEmits<IEmits>();
interface IEmits {
  (event: 'updateList', value: string): void;
}
const isFocused = ref(false);
const showOptions = ref(false);
const filteredOptions = ref(props.datalistOptions || []);

const {
  errorMessage: vError,
  value,
  handleBlur,
  handleChange,
} = useField<string | number>(() => props.name, undefined, {
  validateOnValueUpdate: false,
  syncVModel: true,
});
const errorMessage = computed(() =>
  props.errorMessage ? props.errorMessage : vError.value,
);

const filterOptions = () => {
  const filter = (value.value as string)?.toLowerCase();
  filteredOptions.value = (props.datalistOptions || []).filter((option) =>
    option.toLowerCase().includes(filter),
  );
};

const selectOption = (option: string) => {
  value.value = props.isReturnNumber ? Number(option) : option;
  showOptions.value = false;
};

const addNewOption = () => {
  const option = String(value.value);
  filteredOptions.value.push(option);
  emit('updateList', option);
  selectOption(option);
};

const handleOutsideClick = () => {
  if (!isFocused.value) {
    showOptions.value = false;
  }
};

const adjustInput = (data: number) => {
  const currentValue = Number(value.value);
  const newValue = currentValue + data;
  if (newValue < 0) return;
  value.value = props.isReturnNumber ? newValue : newValue.toString();
};

const listeners = {
  ...props.customEvents,
  blur: (e: InputEvent) => {
    handleBlur(e, true);
    props.customEvents?.blur?.(e);
    isFocused.value = false;
  },
  change: (e: InputEvent) => {
    handleChange(e);
    props.customEvents?.change?.(e);
  },
  input: (e: InputEvent) => {
    const value = props.transformValue ? props.transformValue(e) : e;
    handleChange(value, !!errorMessage.value);
    props.customEvents?.input?.(e);
  },
  focus: (e: InputEvent) => {
    props.customEvents?.focus?.(e);
    isFocused.value = true;
  },
};
</script>

<style scoped>
.unstyled:focus {
  outline: none;
}
.time-input {
  @apply !w-[38px] text-center;
}
</style>
