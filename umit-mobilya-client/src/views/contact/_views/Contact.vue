<template>
  <PageHero
    image="/img/hero-contact.webp"
    alt="Kuşadası sanayi sitesinde atölyenin dışarıdan görünüşü"
    eyebrow="İletişim"
    title="Gelin, konuşalım."
    lede="Keşif ücretsiz. Telefonla ya da WhatsApp’tan yazın, uygun bir gün belirleyelim."
  />
  <ContactDetails />
  <ContactExpectations />
</template>

<script setup lang="ts">
import PageHero from '@/components/ui/local/PageHero.vue';

import ContactDetails from '../_components/ContactDetails.vue';
import ContactExpectations from '../_components/ContactExpectations.vue';
</script>
