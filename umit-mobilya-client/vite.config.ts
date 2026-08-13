import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'
import { PrimeVueResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    /*
     * `dirs: []` bilincli: varsayilan olarak eklenti src/components/ altini
     * tarayip her dosyayi CIPLAK adiyla kaydediyordu. Select.vue bu yuzden
     * PrimeVue'nun <Select>'ini golgeliyor, sablonlarda kullanilan <Select>
     * sessizce vee-validate sarmalayicisina cozumleniyordu — secili deger
     * gorunmeden, hata da vermeden.
     *
     * O klasordeki bilesenler zaten plugins/globalComponents.ts tarafindan
     * F onekiyle kayitli (<FSelect>). Ciplak ad kaydi gereksiz bir ikinci
     * kayitti; kaldirildi.
     */
    Components({
      dirs: [],
      resolvers: [PrimeVueResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
      /*
       * `vue: 'vue/dist/vue.esm-bundler.js'` KALDIRILDI. O yapi calisma
       * zamaninda sablon derleyicisini de tasiyor; bu uygulamada calisma
       * zamaninda derlenen sablon yok (hepsi SFC), yani sadece agirlikti.
       * Olculdu: ana paket 1 742.88 -> 1 648.21 kB, yani 94.67 kB.
       */
    }
  }
})
