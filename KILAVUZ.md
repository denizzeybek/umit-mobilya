# Kılavuz

Bu belge **siteyi işleten kişi** için. Kod bilmenize gerek yok; Claude'a ne
söyleyeceğinizi ve ne zaman "dur" demeniz gerektiğini anlatıyor.

Diğer belgeler (`CLAUDE.md`, `.claude/rules/`) Claude'un kendisi için yazıldı.
Onları okumanız gerekmiyor.

---

## 1. Nasıl iş isterim

Normal Türkçe yazın. Teknik kelime aramayın — ne olmasını istediğinizi söyleyin,
nasıl yapılacağını Claude bulur.

| İstediğiniz | Yazacağınız |
|---|---|
| Yeni bir mobilya tipi | `/urun-ekle` yazın, sonra "mutfak dolabı ekleyelim" |
| Var olanı değiştirmek | `/urun-duzenle` yazın, sonra "vestiyerin oturağı biraz yüksek olsun" |
| Bir şey bozuk | "Teklif formunda telefon yazınca hata veriyor" — ne yaptığınızı ve ne olduğunu anlatın |
| İşi yayına almak | `/yayinla` |
| Fiyat değiştirmek | **Kod değil** — admin panelinden: `/admin/fiyat-kitabi` |
| Fiyatlar doğru mu diye kontrol | `/fiyat-dogrula` |

`/` ile başlayan şeyler hazır tarifler. **Bunları ezberlemenize gerek yok.**
Normal cümlenizi yazın — "mutfak dolabı da ekleyelim", "vestiyerin oturağı
alçak olsun", "fiyatlar doğru mu" — arka planda çalışan bir kontrol hangi
tarifin gerektiğini anlayıp Claude'a söylüyor. Slash komutu yalnızca bir
kısayol.

### Fabrikada öğrendiklerinizi nereye yazıyoruz

Atölyeden bir cevap getirdiğinizde ("işçilik aslında m² 420 TL") bunu söylemeniz
yeterli; `.claude/DURUM.md` dosyasına tarihiyle kaydediliyor. Orada **hangi
soruların cevap beklediği** de duruyor — fabrikaya gitmeden önce "bana neyi
sormuştun" diye sorabilirsiniz.

Bu önemli, çünkü sitedeki bazı rakamlar henüz **tahmin**: gerçek değilmiş gibi
görünmüyorlar ama öyleler. Hangilerinin teyit beklediği o dosyada yazıyor.

### Fiyatlar için kod yazılmaz

m² fiyatı, işçilik, menteşe, kulp, marj, KDV — hepsi **admin panelinden**
değişir. Kaydettiğinizde **yeni bir sürüm** yazılır, eskisi olduğu yerde kalır.
Bu önemli: **daha önce verdiğiniz bir teklifin tutarı sonradan değişmez.**

Kod ancak *yeni bir mobilya tipi* ya da *mobilyanın nasıl kurulduğu* değişiyorsa
gerekir.

### Fiyatların doğruluğundan emin olmak istediğinizde

`/fiyat-dogrula` yazın. Bu, **iki ayrı soruyu** ayırıyor:

1. **Hesap doğru mu?** — "8,65 m² × 2.000 TL gerçekten 14.880 TL mi?" Bunu
   makine kontrol eder, hemen, fabrikaya gitmenize gerek yok.
2. **Girdiler doğru mu?** — "işçilik gerçekten m² 350 TL mi?" Bunu **yalnızca
   siz** bilirsiniz. Skill size fabrikada bakacağınız bir liste verir.

Yani "fiyat doğru mu" sorusuna hiç kimse tek başına cevap veremez: makine hesabı
doğrular, siz rakamları. İkisi ayrı ayrı yapılır.

---

## 2. Size sorulacak sorular — ve sorulmayacaklar

Claude size **yalnızca sizin bilebileceğiniz şeyleri** sormalı:

✅ "Mutfak alt dolabının standart yüksekliği 85 cm mi?"
✅ "Bu tasarım 46.200 TL çıktı, atölyeye göre doğru mu?"
✅ "Gardırop en fazla kaç cm geniş olabilir?"

Şunları sormamalı — sorarsa "sen karar ver" diyebilirsiniz:

❌ "Bu değişken `ref` mi olmalı?"
❌ "Şu dosyayı böleyim mi?"
❌ "Golden diff'ini onaylıyor musun?" — bu size **tablo** olarak sorulmalı, ham
metin olarak değil.

---

## 3. Kırmızı gördüğümde ne yaparım

Claude bazen "kapı kırmızı", "test kırıldı", "bloklandı" diyecek. **Bu iyi bir
şey.** Kapılar tam olarak bunun için var: hatanın siteye gitmesini engelliyorlar.

Yapacağınız tek şey: **"düzelt"**.

Yapmayacağınız şey: "kapıyı atla", "testi sil", "zorla gönder" demek. Kapıyı
atlamak, hatayı görünmez yapar — ortadan kaldırmaz.

Claude bir kapıyı atlamayı **kendisi** teklif ederse sebebini sorun. İyi bir
sebep varsa açıklayabilir; açıklayamıyorsa atlanmamalı.

---

## 4. Asla düşünmeden "evet" demeyeceğiniz üç soru

**1. "Şu tasarımın fiyatı 42.500'den 61.240 TL'ye çıkıyor, onaylıyor musun?"**

Bu soru size bir **tablo** olarak gelecek: hangi mobilya, eski fiyat, yeni fiyat,
yüzde kaç. Tek soru şu: **bu zammı ben mi istedim?**

Hayır ise — "ben fiyat değiştirmedim" deyin. O zaman ortada bir hata var ve
Claude durup sebebini bulmak zorunda. Bu, sitedeki en pahalı hatayı yakalayan
tek noktadır.

**2. "main dalına gönderiyorum, onaylıyor musun?"**

`main` yayına giden yer. İş bitmediyse, denenmediyse, ya da emin değilseniz
"hayır" deyin. Acele etmenin bir faydası yok.

**3. Veritabanında kayıt silme/güncelleme**

"Şu kayıtları sileyim mi" sorusuna, ne silineceğini tam anlamadan evet demeyin.
Teklif kayıtları müşteri kaydıdır.

---

## 5. Geri alma

Bir şey beğenmediyseniz, panik yok. **"Son değişikliği geri al"** demeniz yeterli.

İşler ayrı ayrı "dal"larda yapılıyor — yani ana siteye dokunmadan, kenarda.
Beğenilmeyen bir iş yayına alınmadan önce silinebilir ve hiçbir şey olmamış olur.
Yayına alındıktan sonra da geri alınabilir, sadece bir adım fazla sürer.

Emin olmadığınız bir şeyi "şimdilik yayına almayalım" diye bırakmak tamamen
normaldir.

---

## 6. Ne zaman bir yazılımcıya sormalı

Claude çoğu işi tek başına yapabilir. Şu üç durumda durup birine sormak daha
hızlı olur:

1. **Aynı hata üçüncü kez dönüyorsa.** İki denemede çözülmeyen bir şey genelde
   tarif edilenden farklı bir sorundur.
2. **3B görünüm bir türlü doğru olmuyorsa** — paneller havada duruyor, iç içe
   geçiyor, ölçüye oturmuyor. Bu geometri işi ve bazen gerçekten kod bilgisi
   ister.
3. **Claude "burada durup geliştirici çağırmak gerekir" diyorsa.** Bunu söylemesi
   için tarifi var; söylediğinde ciddiye alın.

Bunlar başarısızlık değil. Doğru hedef "hiç yazılımcıya ihtiyaç duymamak" değil,
**"ihtiyaç duyduğunuz anı kendiniz anlayabilmek."**

---

## 7. Bugünün gerçeği: site yayında değil

Şu an bağlı bir sunucu **yok** (AWS hesabı kapalı, yeni bir host bağlanmadı).
Yani yaptığınız işler kaydediliyor ama **canlı bir siteyi güncellemiyor**.

Bu, bugün rahat çalışabileceğiniz anlamına geliyor. Bir host bağlandığı gün
`main`'e giden her şey doğrudan yayına çıkacak — o gün bu bölüm değişecek ve
`/yayinla` daha dikkatli davranacak.

---

## 8. Küçük sözlük

| Kelime | Ne demek |
|---|---|
| **dal** (branch) | Kenarda, ana siteye dokunmayan bir çalışma alanı. Her yeni iş burada başlar. |
| **commit** | Bir işi kaydetmek. Kaydetmeden önce kapılar kontrol eder. |
| **kapı** (hook/gate) | Otomatik kontrol. Bir şey bozuksa kaydetmeyi durdurur. |
| **test** | "Bu hâlâ doğru çalışıyor mu" diye soran otomatik kontrol. |
| **golden** | Bir tasarımın dondurulmuş fiyatı. Değişirse size tablo olarak sorulur. |
| **main** | Ana dal — yayına giden yer. |
| **fiyat kitabı** | Bütün fiyatların durduğu yer. Admin panelinden değişir. |

---

## 9. Tek cümlede

**İstediğinizi normal Türkçe anlatın; kırmızı bir şey görürseniz "düzelt" deyin;
bir fiyat tablosu gelirse dikkatle okuyun; emin değilseniz yayına almayın.**
