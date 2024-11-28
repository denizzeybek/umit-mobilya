<template>
  <div class="card">
    <Carousel
      :value="products"
      :numVisible="1"
      :numScroll="1"
      :responsiveOptions="responsiveOptions"
      circular
      :autoplayInterval="3000"
    >
      <template #item="slotProps">
        <div
          class="border border-surface-200 dark:border-surface-700 rounded m-2 p-4"
        >
          <div class="mb-4">
            <div class="relative mx-auto">
              <img
                :src="
                  'https://primefaces.org/cdn/primevue/images/product/' +
                  slotProps.data.image
                "
                :alt="slotProps.data.name"
                class="w-full rounded lg:h-[530px]"
              />
              <Tag
                :value="slotProps.data.inventoryStatus"
                :severity="getSeverity(slotProps.data.inventoryStatus)"
                class="absolute"
                style="left: 5px; top: 5px"
              />
            </div>
          </div>
          <div class="mb-4 font-medium">{{ slotProps.data.name }}</div>
          <div class="flex justify-between items-center">
            <div class="mt-0 font-semibold text-xl">
              ${{ slotProps.data.price }}
            </div>
            <span>
              <Button icon="pi pi-heart" severity="secondary" outlined />
              <Button icon="pi pi-shopping-cart" class="ml-2" />
            </span>
          </div>
        </div>
      </template>
    </Carousel>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const products = ref([
  {
    id: '1006',
    code: 'bib36pfvm',
    name: 'Chakra Bracelet',
    description: 'Product Description',
    image: 'chakra-bracelet.jpg',
    price: 32,
    category: 'Accessories',
    quantity: 5,
    inventoryStatus: 'LOWSTOCK',
    rating: 3,
  },
  {
    id: '1007',
    code: 'mbvjkgip5',
    name: 'Galaxy Earrings',
    description: 'Product Description',
    image: 'galaxy-earrings.jpg',
    price: 34,
    category: 'Accessories',
    quantity: 23,
    inventoryStatus: 'INSTOCK',
    rating: 5,
  },
  {
    id: '1008',
    code: 'vbb124btr',
    name: 'Game Controller',
    description: 'Product Description',
    image: 'game-controller.jpg',
    price: 99,
    category: 'Electronics',
    quantity: 2,
    inventoryStatus: 'LOWSTOCK',
    rating: 4,
  },
  {
    id: '1009',
    code: 'cm230f032',
    name: 'Gaming Set',
    description: 'Product Description',
    image: 'gaming-set.jpg',
    price: 299,
    category: 'Electronics',
    quantity: 63,
    inventoryStatus: 'INSTOCK',
    rating: 3,
  },
  {
    id: '1010',
    code: 'plb34234v',
    name: 'Gold Phone Case',
    description: 'Product Description',
    image: 'gold-phone-case.jpg',
    price: 24,
    category: 'Accessories',
    quantity: 0,
    inventoryStatus: 'OUTOFSTOCK',
    rating: 4,
  },
  {
    id: '1011',
    code: '4920nnc2d',
    name: 'Green Earbuds',
    description: 'Product Description',
    image: 'green-earbuds.jpg',
    price: 89,
    category: 'Electronics',
    quantity: 23,
    inventoryStatus: 'INSTOCK',
    rating: 4,
  },

  {
    id: '1016',
    code: 'k8l6j58jl',
    name: 'Lime Band',
    description: 'Product Description',
    image: 'lime-band.jpg',
    price: 79,
    category: 'Fitness',
    quantity: 12,
    inventoryStatus: 'INSTOCK',
    rating: 3,
  },
  {
    id: '1017',
    code: 'v435nn85n',
    name: 'Mini Speakers',
    description: 'Product Description',
    image: 'mini-speakers.jpg',
    price: 85,
    category: 'Clothing',
    quantity: 42,
    inventoryStatus: 'INSTOCK',
    rating: 4,
  },
  {
    id: '1018',
    code: '09zx9c0zc',
    name: 'Painted Phone Case',
    description: 'Product Description',
    image: 'painted-phone-case.jpg',
    price: 56,
    category: 'Accessories',
    quantity: 41,
    inventoryStatus: 'INSTOCK',
    rating: 5,
  },
  {
    id: '1019',
    code: 'mnb5mb2m5',
    name: 'Pink Band',
    description: 'Product Description',
    image: 'pink-band.jpg',
    price: 79,
    category: 'Fitness',
    quantity: 63,
    inventoryStatus: 'INSTOCK',
    rating: 4,
  },
  {
    id: '1020',
    code: 'r23fwf2w3',
    name: 'Pink Purse',
    description: 'Product Description',
    image: 'pink-purse.jpg',
    price: 110,
    category: 'Accessories',
    quantity: 0,
    inventoryStatus: 'OUTOFSTOCK',
    rating: 4,
  },
  {
    id: '1021',
    code: 'pxpzczo23',
    name: 'Purple Band',
    description: 'Product Description',
    image: 'purple-band.jpg',
    price: 79,
    category: 'Fitness',
    quantity: 6,
    inventoryStatus: 'LOWSTOCK',
    rating: 3,
  },
  {
    id: '1022',
    code: '2c42cb5cb',
    name: 'Purple Gemstone Necklace',
    description: 'Product Description',
    image: 'purple-gemstone-necklace.jpg',
    price: 45,
    category: 'Accessories',
    quantity: 62,
    inventoryStatus: 'INSTOCK',
    rating: 4,
  },
  {
    id: '1023',
    code: '5k43kkk23',
    name: 'Purple T-Shirt',
    description: 'Product Description',
    image: 'purple-t-shirt.jpg',
    price: 49,
    category: 'Clothing',
    quantity: 2,
    inventoryStatus: 'LOWSTOCK',
    rating: 5,
  },
  {
    id: '1024',
    code: 'lm2tny2k4',
    name: 'Shoes',
    description: 'Product Description',
    image: 'shoes.jpg',
    price: 64,
    category: 'Clothing',
    quantity: 0,
    inventoryStatus: 'INSTOCK',
    rating: 4,
  },
  {
    id: '1025',
    code: 'nbm5mv45n',
    name: 'Sneakers',
    description: 'Product Description',
    image: 'sneakers.jpg',
    price: 78,
    category: 'Clothing',
    quantity: 52,
    inventoryStatus: 'INSTOCK',
    rating: 4,
  },
  {
    id: '1026',
    code: 'zx23zc42c',
    name: 'Teal T-Shirt',
    description: 'Product Description',
    image: 'teal-t-shirt.jpg',
    price: 49,
    category: 'Clothing',
    quantity: 3,
    inventoryStatus: 'LOWSTOCK',
    rating: 3,
  },
  {
    id: '1027',
    code: 'acvx872gc',
    name: 'Yellow Earbuds',
    description: 'Product Description',
    image: 'yellow-earbuds.jpg',
    price: 89,
    category: 'Electronics',
    quantity: 35,
    inventoryStatus: 'INSTOCK',
    rating: 3,
  },
  {
    id: '1028',
    code: 'tx125ck42',
    name: 'Yoga Mat',
    description: 'Product Description',
    image: 'yoga-mat.jpg',
    price: 20,
    category: 'Fitness',
    quantity: 15,
    inventoryStatus: 'INSTOCK',
    rating: 5,
  },
  {
    id: '1029',
    code: 'gwuby345v',
    name: 'Yoga Set',
    description: 'Product Description',
    image: 'yoga-set.jpg',
    price: 20,
    category: 'Fitness',
    quantity: 25,
    inventoryStatus: 'INSTOCK',
    rating: 8,
  },
]);
const responsiveOptions = ref([
  {
    breakpoint: '1400px',
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: '1199px',
    numVisible: 3,
    numScroll: 1,
  },
  {
    breakpoint: '767px',
    numVisible: 2,
    numScroll: 1,
  },
  {
    breakpoint: '575px',
    numVisible: 1,
    numScroll: 1,
  },
]);

const getSeverity = (status) => {
  switch (status) {
    case 'INSTOCK':
      return 'success';

    case 'LOWSTOCK':
      return 'warn';

    case 'OUTOFSTOCK':
      return 'danger';

    default:
      return null;
  }
};
</script>
