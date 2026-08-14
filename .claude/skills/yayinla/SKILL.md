---
name: yayinla
description: Bitmiş bir dalı main'e alır. Kalanı commit'ler, main'i dala birleştirir, birleşmiş hâl üzerinde BÜTÜN kapıları tekrar koşturur (merge commit'i commit kapılarından geçmez — bu skill o boşluğu kapatıyor), push eder, PR açıp merge eder ve dalı siler. Kırmızı bir şey varsa main'e dokunmaz. İş bitti, yayına alalım dendiğinde kullan.
---

# yayinla

Bir dalı `main`'e almanın tek yolu. `main` deploy edilen dal ve arada CI yok:
buraya giden her şey gözden geçirilmeden yayına gidecek şey demek.

## Neden bu skill var — merge commit kapıları atlıyor

Commit kapıları (`enforce-pre-commit-quality`, `enforce-e2e-decision`,
`enforce-price-decision`) `Bash(git commit*)` üstünde duruyor. Ama `git merge`
çakışma olmadığında merge commit'ini **kendisi** yaratıyor ve `git commit`
çağrılmıyor — yani o commit hiçbir kapıdan geçmiyor.

Sonuç: iki dal ayrı ayrı yeşilken birleşmiş hâl kırmızı olabilir ve bunu
söyleyen hiçbir şey olmaz. İki tarafın ayrı ayrı geçmesi, birleşiminin geçtiğini
kanıtlamıyor — aynı fonksiyonu iki dalda farklı yönde değiştirmek buna yeter.

Bu yüzden 4. adım pazarlıksız: **kapılar birleşmiş hâl üzerinde elle koşuyor.**

## 1. Nerede olduğunu gör

```bash
git branch --show-current
git status --short
git log --oneline main..HEAD
```

`main` üstündeysen yayınlanacak bir şey yok — iş dalda yapılır (dal muhafızı
zaten yazmayı bloklar). Commit listesi boşsa da yayınlanacak bir şey yok.

## 2. Kalanı commit'le

Sahnelenmemiş iş varsa commit et. Kapılar burada çalışıyor ve blokladıklarında
kendi skill'lerini çağırıyor:

- kalite kırmızısı → düzelt, kapıyı susturmaya çalışma
- `e2e-decision` bloklarsa → o skill'i koştur
- `enforce-price-decision` bloklarsa → `fiyat-degisikligi` skill'ini koştur

Commit mesajı **Türkçe**, konu satırı ne yaptığını, gövde **neden** yaptığını
anlatır (`git-workflow.md`). Bir tutar oynadıysa hangi katsayının neden
değiştiği gövdeye yazılır.

## 3. main'i DALA birleştir — tersi değil

```bash
git fetch origin
git merge origin/main
```

Sıra bilerek böyle: çakışmalar ve kırmızılar **dalda** ortaya çıkar. main'e
birleştirip sonra kırmızı görmek, kırmızıyı deploy edilen dala yazmak demek.

Çakışma çıkarsa çöz, sonra `git commit` — o yolda kapılar zaten çalışıyor.
`git merge origin/main` "Already up to date" derse bu adım boştur, devam.

## 4. Kapıları birleşmiş hâl üzerinde TEKRAR koştur

Elle, hepsi, sırayla:

```bash
cd umit-mobilya-server
yarn type-check && yarn test

cd ../umit-mobilya-client
yarn lint && yarn type-check && yarn test:unit:run
yarn build && yarn size-check
yarn e2e:smoke && yarn e2e:journeys
```

Biri kırmızıysa **dur**. Düzelt, commit et, 3'ten devam. Kırmızı bir dalı main'e
almak, bir sonraki kişinin (ya da altı ay sonra senin) bisect'ini boşa harcamak.

Sonra `ai-review` skill'ini koştur: merge commit'i HEAD'i değiştirdiği için
önceki onay bayatladı — bu tesadüf değil, kapının tasarımı. Onay incelenen SHA'ya
bağlı, yani birleşmiş kod ayrıca inceleniyor.

## 5. Dalı push et

```bash
git push -u origin HEAD
```

Push kapıları burada çalışıyor: `pre-push-e2e-gate` bütün suite'i, 
`pre-push-ai-review` taze onayı arıyor. 4. adımı yaptıysan ikisi de geçer —
ve geçmiyorsa 4. adım eksik koşulmuş demektir.

## 6. PR aç ve merge et

```bash
gh pr create --base main --title "<Türkçe başlık>" --body "<ne ve neden>"
gh pr merge --merge --delete-branch
```

PR gövdesi ne değiştiğini ve **neden** değiştiğini anlatır; bir tutar oynadıysa
`fiyat-degisikligi` kararı da oraya yazılır — altı ay sonra "bu rakam neden
değişti" sorusunun aranacağı yer PR'dır.

Geçmiş doğrusalsa `--merge` yerine fast-forward tercih edilir
(`git-workflow.md`): tek dallı bir projede merge commit'i bilgi değil gürültü
ekliyor.

## 7. Temizle

```bash
git checkout main && git pull
git branch -d <dal>
```

Birleşmiş dalı sil. `-d` bilerek, `-D` değil: `-d` birleşmemiş bir dalı silmeyi
reddeder, yani yanlışlıkla iş kaybetmeyi engeller.

## 8. Ne yayınlandığını söyle

Sahibine düz Türkçe, tek paragraf: ne değişti, müşteri tarafında ne fark
edecek, bir tutar oynadıysa ne kadar. **Ve bugünün gerçeğini söyle:** bağlı bir
host yok (AWS hesabı kapalı, Netlify/Railway bağlı değil), yani push kodu
yayınlar ama siteyi güncellemez. Bir host bağlandığı gün bu paragraf değişir.

## Korkuluklar

- **Kırmızıyla main'e girme.** Hiçbir gerekçe bunu geçmez; dal beklesin.
- `--no-verify`, `SKIP_E2E_GATE=1`, `SKIP_AI_REVIEW=1`, `SKIP_PRICE_DECISION=1`
  ile geçme. Kapıyı atlamak bir karardır ve bu skill'in içinde o kararın yeri yok.
- `git push --force` yok (izinlerde de kapalı). Geçmişi yeniden yazmak yerine
  yeni bir commit at.
- Dalı silmeden önce main'e gerçekten girdiğini doğrula (`git log --oneline -3`).
- 4. adımı "3. adım boştu, gerek yok" diye atlama: `git merge` "Already up to
  date" dediyse bile son commit'ler o kapılardan tek tek geçti, hepsi bir arada
  geçmedi. Suite'i bir kez daha koşmak iki dakika.
