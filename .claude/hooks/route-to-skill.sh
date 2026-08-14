#!/usr/bin/env bash
set -uo pipefail

# UserPromptSubmit hook — kullanicinin yazdigi Turkce cumleyi okur ve isin
# hangi skill'e ait oldugunu baglama enjekte eder.
#
# Neden var:
#   Bu repoyu isleten kisi kod bilmiyor ve `/urun-ekle` gibi komutlari
#   hatirlamak zorunda DEGIL. Skill tanimlari zaten modele goruunuyor ama
#   gorunmek cagrilmak degil: en olasi hata, modelin skill'i hic acmadan
#   dogrudan koda baslamasi ve on sekiz adimlik kontrol listesini atlamasi.
#
#   Hook o bosluu kapatiyor: desen tutunca "bu is su skill'in konusu" diye
#   baglama bir satir birakiyor. Zorlamiyor, hatirlatiyor — ve deterministik
#   oldugu icin modelin o gun nasil hissettigine bagli degil.
#
# Cikti sozlesmesi: cikis 0 + stdout = baglama eklenen metin. Hicbir sey
# yazmazsa hicbir sey eklenmiyor, yani eslesmeyen prompt'a maliyeti sifir.
#
# Kural: KILAVUZ.md (insan tarafi), CLAUDE.md (skill tablosu)

payload="$(cat)"
prompt="$(printf '%s' "$payload" | jq -r '.prompt // ""' 2>/dev/null | tr '[:upper:]' '[:lower:]')"

[[ -z "$prompt" ]] && exit 0

# Kullanici zaten bir slash komutu yazdiysa yonlendirmeye gerek yok.
case "$prompt" in
  /*) exit 0 ;;
esac

has() { printf '%s' "$prompt" | grep -Eq "$1"; }

say() {
  printf '[yönlendirme] %s\n' "$1"
  exit 0
}

# Turkce unsuz yumusamasi yuzunden TAM kelime aranmiyor, KOK araniyor:
# gardırop -> gardırob-un, dolap -> dolab-ı, mutfak -> mutfağ-ı, kitaplık ->
# kitaplığ-ı. "gardirop" desenli bir eslesme "gardırobun raf sayısı" cumlesini
# KACIRIYORDU — kok hook testi yakaladi.
#
# Ayrim VAR OLAN / OLMAYAN uzerinden kuruluyor, fiil uzerinden degil:
# var olan bir urunu "eklemek" mumkun degil ("gardıroba cekmece ekleyelim" bir
# DUZENLEME), olmayan bir urunu "duzenlemek" de mumkun degil ("mutfagi
# yapalim" bir EKLEME). Fiile bakmak bu ikisini surekli karistiriyordu.
MEVCUT='gardıro|gardiro|vestiyer'
ADAY='mutfa|kitaplı|kitapli|tv ünite|tv unite|komodin|şifonyer|sifonyer|raf ünite|raf unite|vitrin'
DOLAP='dolap|dolab'

# --- Fiyat: once "degistir" mi "dogrula" mi ayrilir ------------------------
#
# En degerli yonlendirme bu: fiyat GUNCELLEMEK kod isi degil, admin panelinin
# isi. Yanlis yonlendirilirse gereksiz bir kod degisikligi ve gereksiz bir
# golden hareketi uretiliyor.
if has 'fiyat|tutar|ücret|ucret|zam|pahalı|pahali|ucuz'; then
  if has 'doğru mu|dogru mu|kontrol|denetle|tutuyor mu|emin|yanlış mı|yanlis mi|hesap'; then
    say "Bu bir fiyat DENETİMİ isteği → \`fiyat-dogrula\` skill'ini çağır. Aritmetiği kanıtlar, girdileri atölye teyidine bırakır; ikisini karıştırma."
  fi
  if has 'değiş|degis|güncelle|guncelle|artır|artir|düşür|dusur|zam|indir'; then
    say "Bu bir fiyat GÜNCELLEMESİ. Büyük ihtimalle KOD İŞİ DEĞİL: m² fiyatı, işçilik, menteşe, marj, KDV admin panelinden değişir (/admin/fiyat-kitabi) ve yeni bir sürüm yazar; verilmiş teklifler etkilenmez. Koda dokunmadan önce bunu söyle. Motorun kendisi değişecekse \`urun-duzenle\`."
  fi
fi

DUZENLE="Var olan bir ürün düzenlenecek → \`urun-duzenle\` skill'ini çağır. Önce KATMANI belirler (görünüm / varsayılan / parça listesi / paylaşılan motor), çünkü dördünün riski aynı değil — matematiğe dokunan düzenleme sessizce bozulur."
EKLE="Yeni bir konfigüratör ürünü isteniyor → \`urun-ekle\` skill'ini çağır. On sekiz adımı var ve yarısı derleyici tarafından korunmuyor; doğrudan kod yazmaya başlama."

IS_FIILI='ekle|eklesek|yeni|değiştir|degistir|düzenle|duzenle|güncelle|guncelle|olsun|yapalım|yapalim|yapsak|ayarla|genişlet|genislet|büyüt|buyut|küçült|kucult|uzat|kısalt|kisalt|çıkar|cikar|kaldır|kaldir|istiyorum|lazım|lazim'

# --- Var olan urun: her istek bir DUZENLEME --------------------------------
if has "$MEVCUT"; then
  say "$DUZENLE"
fi

# --- Olmayan urun: her istek bir EKLEME ------------------------------------
if has "$ADAY" && has "$IS_FIILI"; then
  say "$EKLE"
fi

# --- Genel "dolap": fiile gore ayrilir -------------------------------------
if has "$DOLAP"; then
  if has 'ekle|eklesek|yeni'; then
    say "$EKLE"
  fi
  if has "$IS_FIILI"; then
    say "$DUZENLE"
  fi
fi

# --- Hata ------------------------------------------------------------------
if has 'bozuk|çalışmıyor|calismiyor|hata|açılmıyor|acilmiyor|patlıyor|patliyor|görünmüyor|gorunmuyor|yanlış çıkıyor|yanlis cikiyor'; then
  say "Bir hata bildiriliyor. Önce TEKRAR ÜRET, sonra düzelt: hatayı gösteren bir test yaz (sunucuda spec, tarayıcıda yolculuk), kırmızı olduğunu gör, sonra düzelt. Test olmadan yapılan düzeltmenin çalıştığının kanıtı yok. Fiyatla ilgiliyse \`fiyat-dogrula\`."
fi

# --- Yayina alma -----------------------------------------------------------
if has 'yayınla|yayinla|canlıya|canliya|merge|birleştir|birlestir|main.e al|push'; then
  say "İş yayına alınacak → \`yayinla\` skill'ini çağır. Kapıları BİRLEŞMİŞ hâl üzerinde tekrar koşturuyor: \`git merge\` merge commit'ini kendisi yarattığı için o commit hiçbir commit kapısından geçmiyor."
fi

# --- Geri alma -------------------------------------------------------------
if has 'geri al|geri alalım|geri alalim|iptal|beğenmedim|begenmedim|eski hâli|eski hali|bozdum'; then
  say "Geri alma isteniyor. Dal birleşmediyse dalı silmek yeterli ve hiçbir şey olmamış olur; birleştiyse \`git revert\`. \`git reset --hard\` izinlerde KAPALI — kullanma. Ne kaybedileceğini söylemeden geri alma."
fi

# --- Kapiyi atlama istegi --------------------------------------------------
if has 'atla|zorla|no-verify|görmezden|gormezden|kapıyı kapat|kapiyi kapat|testi sil'; then
  say "Bir kapıyı atlama isteği geçiyor. Kapılar hatanın yayına gitmesini engelliyor; atlamak hatayı görünmez yapar, ortadan kaldırmaz. Önce NEDEN kırmızı olduğunu açıkla, sonra düzeltmeyi öner. Atlamak gerçekten doğruysa gerekçesini yaz."
fi

exit 0
