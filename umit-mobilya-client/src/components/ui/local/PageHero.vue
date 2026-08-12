<template>
  <section
    class="relative flex min-h-[68svh] flex-col justify-end overflow-hidden"
  >
    <div class="grain absolute inset-0">
      <FImage
        :src="image"
        :alt="alt"
        sizes="100vw"
        is-eager
        has-variants
        class="h-full w-full"
      />
    </div>

    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-t from-f-ink/80 via-f-ink/30 to-f-ink/35"
      aria-hidden="true"
    />

    <div
      class="relative mx-auto w-full max-w-editorial px-5 pb-14 md:px-10 md:pb-20"
    >
      <p class="eyebrow !text-f-bone/80">{{ eyebrow }}</p>
      <h1 class="display mt-6 max-w-[18ch] text-display-lg text-f-bone">
        {{ title }}
      </h1>
      <p v-if="lede" class="prose-lede mt-6 max-w-prose !text-f-bone/80">
        {{ lede }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
interface IProps {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  lede?: string;
}

defineProps<IProps>();
</script>
