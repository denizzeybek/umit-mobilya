<template>
  <Card>
    <template #content>
      <section class="py-24 relative">
        <div class="w-full max-w-7xl px-4 md:px-5 lg-6 mx-auto">
          <h2
            class="title font-manrope font-bold text-4xl leading-10 mb-8 text-center text-black"
          >
            Shopping Cart
          </h2>
          <div
            class="grid grid-cols-1 min-[550px]:gap-6 border-t border-gray-200 py-6"
          >
            <div
              class="flex items-center flex-col min-[550px]:flex-row gap-3 min-[550px]:gap-6 w-full max-xl:justify-center max-xl:max-w-xl max-xl:mx-auto"
            >
              <div class="img-box">
                <img
                  src="https://pagedone.io/asset/uploads/1701162880.png"
                  alt="perfume bottle image"
                  class="xl:w-[140px] rounded-xl object-cover"
                />
              </div>
              <div class="pro-data w-full max-w-sm">
                <h5
                  class="font-semibold text-xl leading-8 text-black max-[550px]:text-center"
                >
                  Dusk Dark Hue
                </h5>
                <p
                  class="font-normal text-lg leading-8 text-gray-500 my-2 min-[550px]:my-3 max-[550px]:text-center"
                >
                  Perfumes
                </p>
                <h6
                  class="font-medium text-lg leading-8 text-indigo-600 max-[550px]:text-center"
                >
                  $120.00
                </h6>
              </div>
            </div>
          </div>
          <div
            class="bg-gray-50 rounded-xl p-6 w-full mb-8 max-lg:max-w-xl max-lg:mx-auto"
          >
            <div class="flex items-center justify-between w-full mb-6">
              <p class="font-normal text-xl leading-8 text-gray-400">
                Sub Total
              </p>
              <h6 class="font-semibold text-xl leading-8 text-gray-900">
                $360.00
              </h6>
            </div>
            <div
              class="flex items-center justify-between w-full pb-6 border-b border-gray-200"
            >
              <p class="font-normal text-xl leading-8 text-gray-400">
                Delivery Charge
              </p>
              <h6 class="font-semibold text-xl leading-8 text-gray-900">
                $45.00
              </h6>
            </div>
            <div class="flex items-center justify-between w-full py-6">
              <p
                class="font-manrope font-medium text-2xl leading-9 text-gray-900"
              >
                Total
              </p>
              <h6
                class="font-manrope font-medium text-2xl leading-9 text-indigo-500"
              >
                $405.00
              </h6>
            </div>
          </div>
          <div
            class="flex items-center flex-col sm:flex-row justify-center gap-3 mt-8"
          ></div>
        </div>
      </section>
    </template>
  </Card>
</template>

<script setup lang="ts"></script>

<style scoped></style>
