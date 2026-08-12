<template>
  <div class="mx-auto max-w-editorial px-5 py-16 md:px-10 md:py-24">
    <header class="border-b border-f-rule pb-10">
      <p class="eyebrow">İşler</p>
      <div
        class="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <h1 class="display max-w-[16ch] text-display-md text-f-ink">
          {{ pageTitle }}
        </h1>

        <div class="flex items-end gap-4">
          <div class="flex-1 lg:w-72">
            <label
              for="product-search"
              class="eyebrow mb-3 block"
            >
              İsimle ara
            </label>
            <InputText
              id="product-search"
              v-model="typedName"
              type="search"
              placeholder="mutfak, gardırop…"
              fluid
            />
          </div>

          <Button
            v-if="usersStore.isAuthenticated"
            label="Ürün Ekle"
            @click="showProductModal = true"
          />
        </div>
      </div>
    </header>

    <nav
      class="flex flex-wrap gap-x-7 gap-y-3 border-b border-f-rule py-6"
      aria-label="Kategoriler"
    >
      <RouterLink
        :to="{ name: ERouteNames.ProductsList }"
        class="category-link"
        :class="!activeCategoryId ? 'is-active' : ''"
      >
        Tümü
      </RouterLink>
      <RouterLink
        v-for="category in categoriesStore.list"
        :key="category._id"
        :to="{
          name: ERouteNames.ProductsList,
          query: { categoryId: category._id },
        }"
        class="category-link"
        :class="activeCategoryId === category._id ? 'is-active' : ''"
      >
        {{ category.name }}
      </RouterLink>
    </nav>

    <p class="py-6 text-sm text-f-ink-faint">
      {{ resultLabel }}
    </p>

    <div
      v-if="productsStore.loading"
      class="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div v-for="n in 6" :key="n" class="flex flex-col">
        <Skeleton class="!h-0 !w-full !pb-[75%]" />
        <Skeleton class="!mt-5 !h-6 !w-2/3" />
        <Skeleton class="!mt-2 !h-4 !w-1/3" />
      </div>
    </div>

    <div
      v-else-if="productsStore.list.length"
      class="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
    >
      <ProductCard
        v-for="(product, index) in productsStore.list"
        :key="product._id"
        v-reveal
        :product="product"
        :index="index"
      />
    </div>

    <div v-else class="flex flex-col items-start gap-6 py-24">
      <p class="display text-display-sm text-f-ink">Burada henüz bir şey yok.</p>
      <p class="prose-lede max-w-prose">
        Aradığınız işi bulamadıysanız bu, yapmadığımız anlamına gelmiyor —
        kataloğa girmemiş olabilir. Arayın, konuşalım.
      </p>
      <div class="flex flex-wrap gap-3">
        <RouterLink
          v-if="activeCategoryId || typedName"
          :to="{ name: ERouteNames.ProductsList }"
          class="border border-f-rule-strong px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-ink transition-colors duration-300 hover:border-f-primary"
          @click="typedName = ''"
        >
          Filtreyi Temizle
        </RouterLink>
        <RouterLink
          :to="{ name: ERouteNames.Contact }"
          class="bg-f-primary px-6 py-3 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-paper transition-colors duration-300 hover:bg-f-primary-hovered"
        >
          Teklif Al
        </RouterLink>
      </div>
    </div>
  </div>

  <ProductModal
    v-if="showProductModal"
    v-model:open="showProductModal"
    @fetchProducts="filterProducts"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useFToast } from '@/composables/useFToast';
import { ERouteNames } from '@/router/routeNames.enum';
import { useCategoriesStore } from '@/stores/categories';
import { useProductsStore } from '@/stores/products';
import { useUsersStore } from '@/stores/users';
import ProductModal from '@/views/products/_modals/ProductModal.vue';

import ProductCard from '../_components/ProductCard.vue';

const usersStore = useUsersStore();
const categoriesStore = useCategoriesStore();
const productsStore = useProductsStore();
const route = useRoute();
const { showErrorMessage } = useFToast();

const showProductModal = ref(false);
const typedName = ref('');

const activeCategoryId = computed(() => route.query.categoryId?.toString());

const currentCategory = computed(() =>
  categoriesStore.list.find(
    (category) => category._id === activeCategoryId.value,
  ),
);

const pageTitle = computed(() =>
  currentCategory.value?.name
    ? `${currentCategory.value.name} işleri`
    : 'Ne ürettiğimize bakın',
);

const resultLabel = computed(() => {
  if (productsStore.loading) return 'Yükleniyor…';
  const count = productsStore.list.length;
  return count ? `${count} iş` : 'Sonuç yok';
});

const filterProducts = async () => {
  try {
    await productsStore.filter({
      ...(typedName.value ? { name: typedName.value } : {}),
      ...(activeCategoryId.value ? { category: activeCategoryId.value } : {}),
    });
  } catch (error) {
    showErrorMessage(error);
  }
};

watch(typedName, filterProducts);

watch(() => route.fullPath, filterProducts, { immediate: true });

onMounted(async () => {
  await categoriesStore.fetch();
});
</script>

<style scoped lang="scss">
.category-link {
  @apply border-b border-transparent pb-1 text-sm text-f-ink-muted transition-colors duration-300 hover:text-f-ink;
}

.category-link.is-active {
  @apply border-f-brass text-f-ink;
}
</style>
