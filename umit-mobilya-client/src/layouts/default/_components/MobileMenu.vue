<template>
  <Transition name="curtain">
    <div
      v-if="open"
      class="fixed inset-0 z-40 flex flex-col justify-between bg-f-bone px-5 pb-10 pt-[72px] lg:hidden"
    >
      <nav class="flex flex-col pt-10" aria-label="Mobil menü">
        <RouterLink
          v-for="(link, index) in links"
          :key="link.name"
          :to="{ name: link.name, params: link.params }"
          class="border-b border-f-rule py-5 text-display-sm text-f-ink"
          @click="open = false"
        >
          <span class="index-numeral mr-4 text-sm text-f-ink-faint">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="display">{{ link.label }}</span>
        </RouterLink>
      </nav>

      <div class="flex flex-col gap-4">
        <a
          v-for="location in LOCATIONS"
          :key="location.label"
          :href="location.phoneHref"
          class="flex items-baseline justify-between border-b border-f-rule pb-3"
        >
          <span class="eyebrow">{{ location.label }}</span>
          <span class="text-f-ink">{{ location.phone }}</span>
        </a>
        <RouterLink
          :to="{ name: ERouteNames.Contact }"
          class="bg-f-primary py-4 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-paper"
          @click="open = false"
        >
          Teklif Al
        </RouterLink>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { LOCATIONS } from '@/constants/company';
import { ERouteNames } from '@/router/routeNames.enum';

import type { INavLink } from '@/composables/useSiteNav';

interface IProps {
  links: INavLink[];
}

defineProps<IProps>();

const open = defineModel<boolean>('open', { required: true });
</script>

<style scoped lang="scss">
.curtain-enter-active,
.curtain-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.curtain-enter-from,
.curtain-leave-to {
  opacity: 0;
  transform: translateY(-1rem);
}
</style>
