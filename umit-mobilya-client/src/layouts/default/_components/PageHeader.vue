<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-editorial"
    :class="
      isTransparent
        ? 'bg-transparent'
        : 'bg-f-bone/95 backdrop-blur-sm border-b border-f-rule'
    "
  >
    <div
      class="mx-auto flex h-[72px] max-w-editorial items-center justify-between gap-6 px-5 md:h-[88px] md:px-10"
    >
      <RouterLink
        :to="{ name: ERouteNames.Dashboard }"
        class="shrink-0"
        :aria-label="`${COMPANY_NAME} — ana sayfa`"
      >
        <img
          :src="isTransparent ? logoLight : logoDark"
          :alt="COMPANY_NAME"
          class="h-8 w-auto md:h-11"
        />
      </RouterLink>

      <nav class="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
        <NavDropdown
          :label="productsLabel"
          :items="categoryItems"
          :tone="tone"
        />

        <NavDropdown :label="designLabel" :items="designItems" :tone="tone" />

        <NavDropdown
          v-if="adminItems.length"
          :label="adminLabel"
          :items="adminItems"
          :tone="tone"
        />

        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="{ name: link.name, params: link.params }"
          class="nav-link"
          :class="tone"
        >
          {{ link.label }}
        </RouterLink>

        <button
          v-if="usersStore.isAuthenticated"
          type="button"
          class="nav-link"
          :class="tone"
          @click="authStore.logout()"
        >
          {{ ERouteNames.Logout }}
        </button>

        <RouterLink
          :to="{ name: ERouteNames.Contact }"
          class="ml-4 border px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300"
          :class="
            isTransparent
              ? 'border-f-paper/70 text-f-paper hover:bg-f-paper hover:text-f-ink'
              : 'border-f-primary bg-f-primary text-f-paper hover:bg-f-primary-hovered'
          "
        >
          Teklif Al
        </RouterLink>
      </nav>

      <button
        type="button"
        class="relative z-50 flex h-10 w-10 items-center justify-center lg:hidden"
        :aria-expanded="isMenuOpen"
        aria-label="Menü"
        @click="isMenuOpen = !isMenuOpen"
      >
        <span class="sr-only">Menü</span>
        <span
          class="block h-px w-7 transition-all duration-300"
          :class="[
            isMenuOpen || !isTransparent ? 'bg-f-ink' : 'bg-f-paper',
            isMenuOpen ? 'translate-y-px rotate-45' : '-translate-y-1',
          ]"
        />
        <span
          class="absolute block h-px w-7 transition-all duration-300"
          :class="[
            isMenuOpen || !isTransparent ? 'bg-f-ink' : 'bg-f-paper',
            isMenuOpen ? '-rotate-45' : 'translate-y-1',
          ]"
        />
      </button>
    </div>

    <MobileMenu v-model:open="isMenuOpen" :links="mobileLinks" />
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import logoDark from '@/assets/images/umit-mobilya-logo.png';
import { useSiteNav } from '@/composables/useSiteNav';
import { COMPANY_NAME } from '@/constants/company';
import { ERouteNames } from '@/router/routeNames.enum';
import { useAuthStore } from '@/stores/auth';
import { useCategoriesStore } from '@/stores/categories';
import { useUsersStore } from '@/stores/users';

import MobileMenu from './MobileMenu.vue';
import NavDropdown from './NavDropdown.vue';

import type { INavDropdownItem } from './NavDropdown.vue';

const logoLight = '/umit-mobilya-logo-beyaz.png';
const SOLID_AFTER_PX = 24;


const route = useRoute();
const authStore = useAuthStore();
const usersStore = useUsersStore();
const categoriesStore = useCategoriesStore();
const {
  productsLabel,
  designLabel,
  designItems,
  adminLabel,
  adminItems,
  navLinks,
  mobileLinks,
} =
  useSiteNav();

const isScrolled = ref(false);
const isMenuOpen = ref(false);

const categoryItems = computed<INavDropdownItem[]>(() => [
  { label: 'Tüm projeler', to: { name: ERouteNames.ProductsList } },
  ...(categoriesStore.list ?? []).map((category, index) => ({
    label: category.name,
    to: {
      name: ERouteNames.ProductsList,
      query: { categoryId: category._id },
    },
    separatorBefore: index === 0,
  })),
]);

/*
 * Hero'lu sayfalarda başlık görselin üstünde yüzer; ilk kaydırmada zemine
 * oturur. Hero'suz sayfalarda en baştan katı, yoksa başlık kağıt zemine
 * kağıt renginde binerdi.
 */
const isTransparent = computed(
  () => Boolean(route.meta.hasHero) && !isScrolled.value && !isMenuOpen.value,
);

const tone = computed(() =>
  isTransparent.value
    ? 'text-f-paper hover:text-f-paper/70'
    : 'text-f-ink-muted hover:text-f-ink',
);



const handleScroll = () => {
  isScrolled.value = window.scrollY > SOLID_AFTER_PX;
};

watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false;
  },
);

watch(isMenuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : '';
});

onMounted(async () => {
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
  await categoriesStore.fetch();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  document.body.style.overflow = '';
});
</script>

<style scoped lang="scss">
.nav-link {
  @apply px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300;
}
</style>
