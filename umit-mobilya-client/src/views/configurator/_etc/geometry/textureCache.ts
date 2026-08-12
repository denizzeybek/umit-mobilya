import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three';

import type { Texture } from 'three';

/**
 * Kaplama desenlerinin yükleyicisi ve önbelleği.
 *
 * Önbellek modül düzeyinde ve bilerek serbest bırakılmıyor: aynı desen
 * kaplama değiştikçe defalarca isteniyor ve her seferinde yeniden indirmek,
 * kullanıcının kaydırıcıyı her oynatışında ağa çıkmak demekti. Katalog sonlu
 * (kaplama sayısı kadar), yani sınırsız büyüyen bir yapı değil.
 *
 * Sahne yeniden kurulurken malzemeler `dispose` ediliyor; dokular ETMİYOR ve
 * bu doğru — malzemeye ait değiller, önbelleğe aitler. Dispose edilselerdi
 * ikinci yeniden çizimde siyah panel kalırdı.
 */
const cache = new Map<string, Texture>();
const pending = new Set<string>();
const loader = new TextureLoader();

/** Bir metre kenar başına düşen tekrar; `repeat` bundan kuruluyor. */
const prepare = (texture: Texture, scaleCm: number): Texture => {
  const metres = Math.max(scaleCm, 1) / 100;

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.repeat.set(1 / metres, 1 / metres);
  texture.needsUpdate = true;

  return texture;
};

/**
 * Önbellekte varsa dokuyu HEMEN döner; yoksa `null` döner ve yükleme bitince
 * `onReady` çağrılır.
 *
 * Senkron dönüş önemli: sahne kurulumu senkron ve kaplama değiştirilip geri
 * dönüldüğünde desen anında görünmeli. `null` dönen ilk yüklemede panel düz
 * renk kalıyor; doku gelince `onReady` onu MALZEMEYE TAKMAK için çağrılıyor.
 *
 * Geri çağrının dokuyu taşıması şart: yalnızca "yeniden çiz" demek yetmiyordu.
 * Malzemeler senkron kuruluyor, yani `map` hâlâ boş oluyor ve yeniden çizim
 * aynı düz rengi bir kez daha basıyordu — dolap kahverengi kalıyordu.
 */
export const loadTexture = (
  url: string,
  scaleCm: number,
  onReady: (texture: Texture) => void,
): Texture | null => {
  const cached = cache.get(url);
  if (cached) return prepare(cached, scaleCm);

  if (pending.has(url)) return null;
  pending.add(url);

  loader.load(
    url,
    (texture) => {
      pending.delete(url);
      cache.set(url, texture);
      onReady(prepare(texture, scaleCm));
    },
    undefined,
    () => {
      /*
       * Yüklenemeyen desen sessizce düz renge düşüyor: kovadan silinmiş ya da
       * erişilemeyen bir görsel yüzünden konfigüratörün açılmaması, biraz
       * eksik görünen bir dolaptan kötü. Konsola yazmak da nöbetçiyi
       * gereksiz yere kırmızıya çevirirdi.
       */
      pending.delete(url);
    },
  );

  return null;
};
