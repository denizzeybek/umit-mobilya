---
name: fiyat-dogrula
description: Fiyatın matematiğini denetler. "Fiyat doğru mu" sorusunu ikiye ayırır — ARİTMETİK doğru mu (makine sorusu, bugün cevaplanır) ve GİRDİLER doğru mu (yalnızca atölye bilir). Referans tasarımın girdilerini, parça listesini ve çıktısını yan yana döker, her fiyat kalemini girdilerden BAĞIMSIZ olarak elde yeniden hesaplar ve tutmayan kalemi işaretler. Sonunda atölyede teyit edilecek girdi ve varsayım listesini üretir. Fiyatların doğruluğu sorgulandığında kullan.
---

# fiyat-dogrula

"Bu fiyat doğru mu?" tek soru gibi görünüyor ama **iki** sorudur ve karıştırılınca
ikisi de cevaplanamaz:

| Soru | Kim cevaplar | Ne zaman |
|---|---|---|
| **Aritmetik** doğru mu — girdilerden bu çıktı çıkar mı? | makine | **bugün**, atölye verisi olmadan |
| **Girdiler** doğru mu — işçilik gerçekten m² 350 TL mi? | yalnızca atölye | fabrikada, sonra |
| **Varsayımlar** doğru mu — her modül ayrı kutu mu imal ediliyor? | yalnızca atölye | fabrikada, sonra |

Bu skill birinciyi **kanıtlar**, ikinci ve üçüncüyü **listeler**. Sahibine
cevaplayamayacağı bir soru sormaz.

## Ne zaman

- Fiyatların doğruluğundan şüphe edildiğinde.
- Yeni bir golden dondurulmadan önce (`fiyat-degisikligi` bunu ister).
- Fiyat motoruna dokunulduktan sonra, `urun-duzenle`'nin seviye 2–3 işlerinde.
- Atölyeden yeni rakamlar geldiğinde, girdiler güncellenmeden önce.

## Döngü

### 1. Dökümü al

```bash
cd umit-mobilya-server
yarn fiyat-acikla                      # 2 kapaklı gardırop — referans tasarım
yarn fiyat-acikla vestiyer-varsayilan
yarn fiyat-acikla --liste              # tanımlı tasarımlar
```

Araç üç blok basıyor: **GİRDİLER** (fiyat kitabında yazan), **PARÇALAR** (ne imal
ediliyor, alanları ve bant metrajıyla), **ÇIKTI** (motorun ürettiği kalemler).

Referans olarak **2 kapaklı gardırop** kullanılır (`gardirop-varsayilan`): en
yaygın ürün, hem gövde hem kapak hem raf hem askılık hem menteşe hem kenar bandı
hem işçilik kalemlerini birden içeriyor — yani motorun ana hattının tamamı tek
tasarımda görülüyor.

### 2. Her kalemi ELDE yeniden hesapla

Araç bilerek çarpma yapmıyor. Çarpmayı sen yap, **yalnızca 1. ve 2. bloktaki
sayılarla**. Motorun çıktısına bakarak geriye doğru çalışma — o, motoru kendi
kendine onaylatmak olur ve yanlış bir katsayı iki tarafta da aynı yanlış sayıyı
verir.

Formüller (`pricing/priceOf.ts`):

```
panel kalemi   = alan × (malzeme TL/m² + kaplama ek TL/m²)
                 + (kapaksa) alan × kapak tipi TL/m²
                 + (arkalıksa) alan × arkalık TL/m²   ← arkalık tek başına, malzeme YOK
                 sonra × (1 + fire%) × maliyet çarpanı

menteşe/kulp   = adet × birim fiyat
çekmece        = adet × birim fiyat        (ray ve malzeme birim fiyatta)
askılık        = metre × TL/m
kenar bandı    = toplam bant metrajı × TL/m
işçilik        = toplam panel m² × TL/m²  + sabit montaj

KDV öncesi     = (GÖRÜNEN + GİZLİ kalemlerin toplamı) × marj çarpanı
KDV            = KDV öncesi × KDV oranı
toplam         = KDV öncesi + KDV
ekranda        = toplam, 10 TL'ye yuvarlı
```

Üç tuzak:

1. **Arkalık gizli** — dökümde satır açmıyor ama toplamda var. Görünen
   kalemlerin toplamı, toplamla tutmaz; tutuyorsa bir şey yanlış.
2. **Marj gizli** ve en sonda, kalemlerin toplamına uygulanıyor — kalem başına
   değil.
3. **Alan konvansiyonu** brüt ise parça listesindeki ölçüler dış ölçü; kesim
   ölçüsüyle hesap yaparsan tutmaz.

### 3. Sonucu tablo olarak ver

Her kalem için: elde hesap, motorun çıktısı, tutuyor mu.

```
Gövde          7,44 m² × 2.000 TL          = 14.880,00   motor: 14.880,00   ✓
Kapak          3,96 × (2.000 + 450)        =  9.702,00   motor:  9.702,00   ✓
Menteşeler     10 adet × 35 TL             =    350,00   motor:    350,00   ✓
```

Kuruş farkları yuvarlamadandır ve normaldir; **kalem farkı** değildir. Bir kalem
tutmuyorsa orada bir hata var: dur, sahibine onaylatma, sebebi bul.

### 4. Atölye teyit listesi üret

Aritmetik yeşilse iş bitmedi — cevabın yarısı henüz verilmedi. Sahibine
**fabrikada kontrol edeceği** listeyi ver. İki kategori:

**A. Rakamlar** (fiyat kitabından, admin panelinden değişir):
her m² fiyatı, menteşe/kulp/çekmece birim fiyatı, askılık TL/m, kenar bandı TL/m,
işçilik TL/m² ve sabit montaj, marj çarpanı, KDV oranı, fire payı.

**B. Varsayımlar** (bunlar rakam değil, imalat biçimi — ve yanlışlarsa fiyat
kalem kalem değil topluca kayar):

- **Her modül ayrı kutu mu?** Motor öyle sayıyor: iki bölümlü dolapta **4** yan
  panel var, 3 değil. Komşu modüller yan paneli paylaşıyorsa fiyat yüksek çıkıyor.
- **Hangi kenarlara bant vuruluyor?** Bugün yalnızca kapak ve raf kenarları
  sayılıyor; gövdenin ön kenarları **sayılmıyor**. Atölye oraya da vuruyorsa
  fiyat düşük çıkıyor.
- **Brüt mü net mi fiyatlanıyor?** Brüt = dış ölçü (fire içinde), net = kesim
  ölçüsü + ayrı fire payı. İkisi aynı dolabı farklı fiyatlar.
- **Menteşe kademeleri** kanat yüksekliğine göre doğru mu?
- **Çekmece birim fiyatı** rayı ve malzemeyi gerçekten içeriyor mu? İçermiyorsa
  çekmece iki kez eksik sayılıyor.
- **Kapaksız modülde** menteşe ve kulp oluşmuyor — doğru mu?

Her maddeyi soru cümlesi olarak yaz, cevabı boş bırak. Sahibi fabrikada bakıp
dönecek.

### 5. Kararı söyle — ve iki yarıyı karıştırma

Doğru sonuç cümlesi şudur:

> **Aritmetik doğru: yedi kalemin yedisi de girdilerden birebir çıkıyor.
> Girdilerin kendisi henüz teyit edilmedi — atölye listesi aşağıda.**

Şu **yanlıştır**: "Fiyatlar doğru." Aritmetiği doğrulamak, girdilerin doğru
olduğunu kanıtlamaz. Tohum fiyat kitabı `catalog.ts`'in kendi yorumunda yazdığı
gibi: *"Bu rakamlar TAHMİN; asıl veriyi admin paneli girecek."*

## Korkuluklar

- **Motorun çıktısından geriye çalışma.** Elde hesap girdilerden ileri doğru
  yapılır; tersi bir doğrulama değil, bir tekrardır.
- **"Yaklaşık tutuyor" diye geçme.** Kuruş farkı yuvarlamadır, lira farkı
  hatadır. Farkı adlandıramıyorsan tutmuyor demektir.
- Aritmetik kırmızıysa `fiyat-degisikligi` kapısında **onay isteme** — bulgu bir
  hata, karar değil.
- Girdileri bu skill **değiştirmez**. Rakam güncellemesi admin panelinden
  (`/admin/fiyat-kitabi`) yapılır ve yeni bir sürüm yazar; verilmiş teklifler
  değişmez.
- Golden'lar tohum kitabın üstünde koşuyor, yani admin panelinden yapılan bir
  zam hiçbir golden'ı oynatmaz — bu doğru ve bilinçli. Golden motoru korur,
  fiyat kitabını değil.
