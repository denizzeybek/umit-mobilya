import type { App, DirectiveBinding } from 'vue';

/*
 * `v-reveal` yalnızca `.reveal` sınıfını ekler ve isteğe bağlı bir sıra adımı
 * yazar; açılışın kendisi styles/index.scss'teki CSS kaydırma animasyonuyla
 * (`animation-timeline: view()`) yapılıyor.
 *
 * Bu iş neden JS'ten alındı: önce IntersectionObserver kullanılıyordu ve üç
 * ayrı şekilde içeriği kalıcı olarak görünmez bırakabiliyordu — hızlı
 * kaydırmada öğe tek karede alttan üste geçince kesişme oranı 0'dan 0'a
 * gidiyor ve geri çağrı hiç çalışmıyordu; arka planda açılan bir sekmede
 * requestAnimationFrame durduğu için hiçbir bölüm açılmıyordu; JS herhangi bir
 * sebeple çalışmazsa gizleme kuralı yerinde kalıyordu.
 *
 * CSS sürümünde gizli durum yalnızca keyframe'in içinde. Tarayıcı desteklemezse
 * ya da bir şey ters giderse öğe olağan haliyle, yani görünür kalıyor.
 */
const MAX_STEP = 6;

export default {
  install(app: App) {
    app.directive('reveal', {
      mounted(el: HTMLElement, binding: DirectiveBinding<number | undefined>) {
        const step = Math.min(Number(binding.value ?? 0) || 0, MAX_STEP);
        if (step > 0) {
          el.style.setProperty('--reveal-step', String(step));
        }

        el.classList.add('reveal');
      },
    });
  },
};
