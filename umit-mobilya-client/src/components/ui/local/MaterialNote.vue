<template>
  <section class="bg-f-linen">
    <div class="mx-auto max-w-editorial px-5 py-section md:px-10">
      <div class="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div class="grid grid-cols-2 gap-4">
          <div v-reveal class="grain relative overflow-hidden">
            <FImage
              src="/img/doku/doku-ceviz.webp"
              alt="Yağlanmış ceviz damarının yakın çekimi"
              ratio="1 / 1"
              sizes="(min-width: 1024px) 25vw, 45vw"
              img-class="drift"
            />
          </div>
          <div v-reveal="1" class="grain relative mt-10 overflow-hidden">
            <FImage
              src="/img/doku/doku-birlesim.webp"
              alt="Meşe dolap kapağında gönye birleşim detayı"
              ratio="1 / 1"
              sizes="(min-width: 1024px) 25vw, 45vw"
              img-class="drift-reverse"
            />
          </div>
        </div>

        <div>
          <p class="eyebrow">Malzeme</p>
          <h2 class="line-rise display mt-5 max-w-[16ch] text-display-md text-f-ink">
            Damar köşeyi döner, ek yeri görünmez.
          </h2>
          <p v-reveal="2" class="prose-lede mt-7 max-w-prose">
            Meşe, ceviz ve dişbudakla çalışıyoruz; lake istendiğinde mat, elle
            zımparalanmış yüzey. Kapak boşluklarının eşit olması, damarın
            gönyede sürmesi, kenar bandının parmakla hissedilmemesi — işin
            gerçekten iyi olup olmadığı bu üç yerden anlaşılır.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
