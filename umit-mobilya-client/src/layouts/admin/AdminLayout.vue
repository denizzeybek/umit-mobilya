<template>
  <div class="mx-auto max-w-editorial px-5 py-10 md:px-10 lg:px-16">
    <header class="flex flex-wrap items-baseline justify-between gap-4 border-b border-f-rule pb-6">
      <h1 class="display text-display-sm text-f-ink">Yönetim</h1>

      <nav class="flex gap-2">
        <RouterLink
          v-for="item in NAV"
          :key="item.name"
          :to="{ name: item.name }"
          class="border border-f-rule-strong px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300"
          :class="
            route.name === item.name
              ? 'bg-f-primary text-f-paper'
              : 'text-f-ink hover:bg-f-linen'
          "
        >
          {{ item.name }}
        </RouterLink>
      </nav>
    </header>

    <main class="pt-8" data-testid="app-main">
      <RouterView />
    </main>

    <!-- Katalog silme onayları buradan çıkıyor; bkz. CatalogDeleteButton. -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

import { ERouteNames } from '@/router/routeNames.enum';

const route = useRoute();

const NAV = [
  { name: ERouteNames.AdminPricebook },
  { name: ERouteNames.AdminQuotes },
  { name: ERouteNames.CategoriesList },
  { name: ERouteNames.ProductsList },
];
</script>
