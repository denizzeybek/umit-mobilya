<template>
  <section class="bg-f-paper py-section">
    <div class="mx-auto max-w-editorial px-5 md:px-10">
      <div class="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p class="eyebrow">Atölye</p>
          <h2 v-reveal class="display mt-5 max-w-[16ch] text-display-md text-f-ink">
            Kesimden montaja, tek çatı altında
          </h2>
        </div>
        <p v-reveal="1" class="prose-lede max-w-prose">
          Levha kesimi, kenar bantlama, birleşim ve montaj öncesi kuru kurulum
          burada yapılıyor. İş taşerona gitmediği için hatayı da düzeltmeyi de
          aynı ekip üstleniyor.
        </p>
      </div>
    </div>

    <figure v-reveal="2" class="mt-14">
      <div class="grain relative overflow-hidden">
        <FImage
          src="/img/atolye/atolye-genel.webp"
          alt="Ümit Mobilya atölyesinin genel görünümü"
          ratio="21 / 9"
          sizes="100vw"
          has-variants
        />
      </div>
      <figcaption
        class="mx-auto mt-4 max-w-editorial px-5 text-sm text-f-ink-faint md:px-10"
      >
        Kuşadası Sanayi Sitesi’ndeki atölye
      </figcaption>
    </figure>

    <div class="mx-auto mt-14 grid max-w-editorial gap-6 px-5 sm:grid-cols-2 md:px-10">
      <figure v-reveal="3" class="grain relative overflow-hidden">
        <FImage
          src="/img/atolye/atolye-el.webp"
          alt="Ceviz bir tahtayı rendeleyen eller"
          ratio="3 / 2"
          sizes="(min-width: 640px) 50vw, 100vw"
          has-variants
        />
      </figure>
      <figure v-reveal="4" class="grain relative overflow-hidden">
        <FImage
          src="/img/atolye/atolye-malzeme.webp"
          alt="Rafta istiflenmiş meşe, ceviz ve dişbudak levhalar"
          ratio="3 / 2"
          sizes="(min-width: 640px) 50vw, 100vw"
          has-variants
        />
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
