<template>
  <div class="mx-auto max-w-editorial px-5 py-10 md:px-10 md:py-16">
    <slot name="breadcrumb" />

    <div class="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
      <div class="min-w-0">
        <slot name="details" />
      </div>

      <!--
        Özet sütunu masaüstünde yapışkan: galeri ve modül listesi uzadıkça
        fiyat ve "Teklif Al" ekrandan çıkmasın.
      -->
      <aside class="lg:sticky lg:top-28 lg:self-start">
        <slot name="basket" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
