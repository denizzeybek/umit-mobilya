# Done Checklist

> "It builds on my machine" is not done. Run the gates before you claim a task is finished.

## Why this rule exists

This repo has no CI. The GitHub Actions workflows were deleted when the project moved
off AWS, and there is **no live deployment at all right now** — the AWS account is
closed and no host is connected. So nothing anywhere checks this code except the
gates below: every quality gate that exists is one you run locally or one a hook
runs for you.

That makes them more load-bearing, not less. When a host is finally connected it
will build and publish whatever is on `main` without type-checking, linting or
testing it.

The cost of skipping them is not theoretical: an infinite-redirect bug in the router
guard shipped to `main` in this project, and `type-check` alone would not have caught
it — only opening the app did.

## Client — `umit-mobilya-client/`

Before calling a change done:

```bash
yarn lint            # must be clean; lint:fix only for mechanical fixes
yarn type-check      # vue-tsc for src/ + tsc for e2e/, must pass
yarn test:unit run   # vitest; the configurator's pure functions (149 test)
yarn build           # catches what type-check misses
yarn size-check      # ana paket tavanı — build'den SONRA
yarn e2e:smoke       # her route açılıyor mu — ~30 sn
```

`size-check` bir alarm: bu repoda CI yok ve paket boyutu sessizce şişiyor.
Ölçüldü — menüye ürün listesi eklerken bir composable `registry`'yi import
etti ve ana paket 1 741 kB'den 2 237 kB'ye çıktı; hiçbir test kırılmadı,
hiçbir uyarı çıkmadı. Tavan **1800 kB**; bugünkü ana paket ~1687 kB, yani
kalan pay dar — yeni bir bağımlılığı ana pakete sokan bir import'u ölçmeden
bırakma.

Touched a `.claude/hooks/` script? Run its own suite — the hooks have no other
coverage and a broken matcher fails open, which is worse than failing loud:

```bash
bash .claude/hooks/hooks.test.sh
```

For anything touching routing, auth, or rendering: **open the app and look at it.**
`yarn dev`, then visit the affected route. A blank page with a console error passes
`lint`, `type-check` and `build` — `e2e:smoke` is what now catches it, but a
human eye still sees things no assertion was written for.

### e2e — tarayıcı katmanı

```bash
yarn e2e:smoke      # bütün route'lar (14 test); günlük hızlı kontrol (~30 sn)
yarn e2e:journeys   # manifest'teki yedi yolculuk (8 test) (~35 sn)
```

İkisi de **hermetik**: Playwright kendi Nest sunucusunu bellek içi bir mongod
üstünde (`yarn --cwd ../umit-mobilya-server e2e:api`, port 5055) ve kendi vite'ını
(port 3101) kaldırıyor. Yerel Mongo, `.env` ya da ayakta duran bir dev ortamı
gerekmiyor — ve senin 3001'deki `yarn dev`'ine dokunmuyor.

İlk kurulumda tarayıcı bir kez inmeli:

```bash
npx playwright install chromium
```

Konfigüratöre, fiyata, route'lara ya da 3B görüntüleyiciye dokunduysan
`e2e:journeys`'i de koş. Yeni bir yolculuk yazmadan önce
[`11-e2e-conventions.md`](../../umit-mobilya-client/.claude/rules/11-e2e-conventions.md)
— bütçe manifest'le, yazım kuralları hook'la uygulanıyor.

## Server — `umit-mobilya-server/`

The NestJS half (`src/`, `test/`):

```bash
yarn test         # Jest, 271 spec; the spec you wrote must be green
yarn test:cov     # same, plus the coverage floor — this is what the commit hook runs
yarn type-check   # tsc --noEmit, strict
yarn build        # nest build
```

Changed an endpoint's shape? Run its script in `curls/` and read the response.
The characterization suite proves the contract; the script shows it to you.

There is no Express half any more; every `.js` source file is gone.

### Fiyat motoruna dokunduysan

`yarn test` fiyat ağını da koşuyor (`test/price-net/`). Bir golden kırmızıysa
**önce diff'i oku** — o bir tutar değişikliği ve bir karar:

```bash
git diff test/price-net/__goldens__     # DEĞİŞEN SAYIYI OKU
yarn price-net:bless                    # yalnızca değişiklik KASITLIYSA
```

`bless` bir onaydır, kırmızıyı susturma adımı değil; goldenları elle düzenlemek
hook tarafından engelleniyor
([`13-price-net.md`](../../umit-mobilya-server/.claude/rules/13-price-net.md)).

Motor iki yerde yaşıyor: istemcideki değişikliği sunucuya taşımadan
`test/pricing-sync.spec.ts` kırmızı olur.

```bash
yarn sync:pricing   # istemciden kopyala
```

## Both

- Don't commit build artefacts that changed as a side effect. `*.tsbuildinfo` and
  `dist/` are gitignored now, so they should never reach `git status` — if one
  does, the ignore rule is what needs fixing, not the commit.
- A dependency bump means the lockfile travels with the `package.json`, in the
  same commit. A `package.json` change without its `yarn.lock` installs
  differently on the next machine, which is the whole failure mode a lockfile
  exists to prevent.
- Don't commit `.env`. Use `.env.example` when a variable is added.
- If a check fails and you're fixing something unrelated, say so rather than silently
  leaving it broken.

## Kapılar — hangisi ne soruyor

Dört kapı var, ikisi commit'te ikisi push'ta, ve **hiçbiri diğerinin sorusunu
sormuyor**:

| Ne zaman | Kapı | Sorduğu soru |
|---|---|---|
| commit | `enforce-pre-commit-quality.sh` | lint / type-check / sunucu testleri yeşil mi |
| commit | `enforce-e2e-decision.sh` | bu davranış için e2e gerekiyor mu — karar verildi mi |
| push | `pre-push-e2e-gate.sh` | bütün testler ve tarayıcı suite'i geçiyor mu |
| push | `pre-push-ai-review.sh` | bu kod okundu mu, bloklayıcı bulgu var mı |

İki tanesinin **düşünen yarısı bir skill**, çünkü hook'lar deterministik kabuk
komutları — LLM çağıramazlar. Hook yalnızca "karar/onay kaydı var mı" diye bakar;
kararı skill verir ve kaydı o yazar:

- `e2e-decision` → `.git/e2e-decision-pass` (sahnelenmiş içeriğin özeti)
- `ai-review` → `.git/ai-review-pass` (incelenen HEAD SHA'sı)

Kayıt içeriğe bağlı olduğu için bir dosya daha eklemek ya da yeni bir commit
atmak kapıyı yeniden kuruyor. Bu bilinçli: karar, incelenen şey için verildi.

### Commit ederken

Davranışa dokunan bir commit (`*/src/**`, üretilmiş kod ve spec'ler hariç)
`e2e-decision` olmadan geçmiyor. Skill ya yolculuğu yazıp **yalnızca onu**
koşturuyor — bütün suite push'ta koşuyor — ya da hangi katmanın kapsadığını
gerekçe olarak kaydediyor.

### Push ederken

`pre-push-e2e-gate.sh` sunucu testleri + `e2e:smoke` + `e2e:journeys` koşuyor
(~2 dk). `pre-push-ai-review.sh` ise `ai-review` skill'inin o HEAD için onay
bırakmasını bekliyor; bloklayıcı bulgu varsa skill push'u tutuyor ve düzeltme
konuşuluyor.

Kapılar `SKIP_E2E_GATE=1`, `SKIP_E2E_DECISION=1`, `SKIP_AI_REVIEW=1` ile bilerek
atlanabilir. Atlamak bir karardır: neden atladığını söyle.

## Don't

- ❌ Report a task complete while a gate is red. Say which one and why.
- ❌ Use `--no-verify` or otherwise bypass a hook to land a commit.
- ❌ `SKIP_E2E_GATE=1` ile kırmızı bir dalı push etmek.
- ❌ Bir golden'ı okumadan `bless`lemek.
- ❌ Treat a passing `type-check` as proof the feature works. It proves types line up,
  nothing more.
