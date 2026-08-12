<template>
  <section class="mx-auto max-w-editorial px-5 py-section md:px-10">
    <div class="border-b border-f-rule pb-8">
      <p class="eyebrow">Nasıl ilerliyor</p>
      <h2 class="display mt-5 max-w-[18ch] text-display-md text-f-ink">
        Dört adım, sürpriz yok
      </h2>
    </div>

    <ol class="grid md:grid-cols-2 lg:grid-cols-4">
      <li
        v-for="(step, index) in PROCESS_STEPS"
        :key="step.title"
        v-reveal="index"
        class="flex flex-col gap-4 border-b border-f-rule py-10 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
      >
        <span class="index-numeral text-display-sm text-f-brass">
          {{ String(index + 1).padStart(2, '0') }}
        </span>
        <h3 class="display text-2xl text-f-ink">{{ step.title }}</h3>
        <p class="text-f-ink-muted">{{ step.text }}</p>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { PROCESS_STEPS } from '@/constants/company';
</script>
