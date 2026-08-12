<template>
  <Configurator v-if="definition" :key="definition.id" :definition="definition" />
  <NotFound v-else />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import NotFound from '@/views/errors/_views/NotFound.vue';

import { productOr404 } from '../_etc/registry';

import Configurator from './Configurator.vue';

/**
 * Route ile registry arasındaki tek bağ. Bilinmeyen bir ürün adı 404 gösterir —
 * yönlendirme yapmaz, çünkü adres kullanıcının yazdığı gibi kalmalı ki yanlışı
 * görebilsin.
 *
 * `:key` bilerek: ürün değişince Configurator sıfırdan kurulur, önceki ürünün
 * config'i yeni ürüne sızmaz.
 */
const route = useRoute();

const definition = computed(() =>
  productOr404(String(route.params.product ?? '')),
);

/*
 * Sekme başlığını burası kuruyor. Router'da yapmak registry'yi import etmek
 * demek olurdu ve Three.js ana pakete geri dönerdi.
 */
watch(
  definition,
  (product) => {
    document.title = product
      ? `${product.label} Tasarla - Umit Mobilya`
      : 'Sayfa Bulunamadı - Umit Mobilya';
  },
  { immediate: true },
);
</script>
