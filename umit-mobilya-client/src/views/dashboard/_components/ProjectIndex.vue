<template>
  <section class="bg-f-paper">
    <div class="mx-auto max-w-editorial px-5 py-section md:px-10">
      <div
        class="flex flex-col gap-6 border-b border-f-rule pb-8 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p class="eyebrow">Neler üretiyoruz</p>
          <h2 class="display mt-5 text-display-md text-f-ink">
            Yedi tür iş, tek bir yöntem
          </h2>
        </div>
        <RouterLink
          :to="{ name: ERouteNames.ProductsList }"
          class="group w-fit text-sm text-f-ink-muted transition-colors duration-300 hover:text-f-ink"
        >
          Tüm işler
          <span
            class="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1"
            >→</span
          >
        </RouterLink>
      </div>

      <ol class="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-x-8">
        <li
          v-for="(project, index) in PROJECTS"
          :key="project.slug"
          v-reveal
          :class="LAYOUT[index % LAYOUT.length]"
        >
          <RouterLink
            :to="{ name: ERouteNames.ProductsList }"
            class="group block"
          >
            <div class="overflow-hidden bg-f-linen">
              <FImage
                :src="project.image"
                :alt="`${project.title} — ${project.detail}`"
                :ratio="RATIOS[index % RATIOS.length]"
                sizes="(min-width: 1024px) 50vw, 100vw"
                img-class="transition-transform duration-[1200ms] ease-editorial group-hover:scale-105"
                has-variants
              />
            </div>

            <div class="mt-5 flex items-baseline gap-4">
              <span class="index-numeral text-sm text-f-brass">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <div class="flex-1">
                <h3
                  class="display text-display-sm text-f-ink transition-colors duration-300 group-hover:text-f-primary"
                >
                  {{ project.title }}
                </h3>
                <p class="mt-1.5 text-sm text-f-ink-muted">
                  {{ project.detail }}
                </p>
              </div>
              <span class="eyebrow hidden shrink-0 sm:block">
                {{ project.category }}
              </span>
            </div>

            <span
              class="mt-5 block h-px w-full origin-left scale-x-100 bg-f-rule transition-colors duration-500 group-hover:bg-f-brass"
            />
          </RouterLink>
        </li>
      </ol>

      <p class="mt-16 max-w-prose text-sm text-f-ink-faint">
        Görseller ne ürettiğimizi anlatan örnek karelerdir; tamamlanmış iş
        fotoğrafları çekildikçe bunların yerini alacak.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PROJECTS } from '@/constants/projects';
import { ERouteNames } from '@/router/routeNames.enum';

/*
 * Sütun yerleşimi ve en-boy oranları kasıtlı olarak düzensiz: eşit kartlardan
 * oluşan bir ızgara katalog gibi okunuyor, kaydırıldıkça değişen ritim ise
 * dergi sayfası gibi. Diziler Tailwind'in tarayıcısı görebilsin diye düz
 * metin olarak duruyor.
 */
const LAYOUT = [
  'lg:col-span-7 lg:col-start-1',
  'lg:col-span-4 lg:col-start-9 lg:mt-28',
  'lg:col-span-5 lg:col-start-2',
  'lg:col-span-6 lg:col-start-7 lg:-mt-20',
  'lg:col-span-4 lg:col-start-1',
  'lg:col-span-6 lg:col-start-6 lg:-mt-12',
  'lg:col-span-8 lg:col-start-3',
];

const RATIOS = ['4 / 3', '3 / 4', '4 / 3', '16 / 10', '3 / 4', '4 / 3', '16 / 9'];
</script>
