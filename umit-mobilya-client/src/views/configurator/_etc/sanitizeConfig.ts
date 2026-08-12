import { DEFAULT_PRICE_BOOK } from './pricing/defaults';
import {
  setDepth,
  setHeight,
  setSectionCount,
  setSectionWidth,
} from './dimensionOps';

import type {
  IBaseConfig,
  IBaseSection,
  IProductDefinition,
} from './types';

/**
 * URL'den gelen bir config GÜVENİLMEZ: elle kurcalanmış, eski bir sürümden
 * kalmış ya da başka bir ürüne ait olabilir. Bu dosya onu ürünün kendi
 * sınırlarına oturtur.
 *
 * Yöntem doğrulamak değil ÖRTMEK: ürünün varsayılan config'i taban alınır ve
 * gelen değerler yalnızca tanınıyorsa üzerine yazılır. Böylece eksik alan,
 * yanlış tipli alan ve bilinmeyen alan tek bir kuralla — sessizce varsayılanda
 * kalarak — çözülür.
 *
 * Ölçüler `dimensionOps` üzerinden geçiyor, elle `clamp` yazılmıyor: oradaki
 * değişmez `config.width`'in bölümlerden TÜRETİLMESİ, ve ikinci bir kopya o
 * kuralı unutmanın en kısa yolu olurdu.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Ürüne özel bölüm alanları (raf, askılık, çekmece) burada TANINMIYOR — bu
 * dosya ürün bilmez (Rule 10). Bunun yerine ürünün `createSection` çıktısı
 * şablon kabul edilir ve gelen değer yalnızca aynı biçimdeyse geçirilir.
 *
 * Bu, beyaz ekranı önleyen asıl güvence: `shelves` bir dizi değilse
 * `for (const fromTop of section.shelves)` çalışma zamanında patlardı.
 */
const matchesShape = (template: unknown, candidate: unknown): boolean => {
  if (isFiniteNumber(template)) return isFiniteNumber(candidate);
  if (typeof template === 'string') return typeof candidate === 'string';
  if (typeof template === 'boolean') return typeof candidate === 'boolean';
  if (Array.isArray(template)) {
    return Array.isArray(candidate) && candidate.every(isFiniteNumber);
  }
  return false;
};

const mergeSection = (
  template: IBaseSection,
  incoming: unknown,
): IBaseSection => {
  if (!isRecord(incoming)) return template;

  const merged = { ...template };

  /*
   * `Object.assign`, tip daraltması olmadan dinamik anahtar yazmanın yolu:
   * anahtarlar şablondan geliyor ve değer yalnızca aynı biçimdeyse yazılıyor,
   * yani sonuç şablonun tipini koruyor. Kast (`as`) gerekmiyor — Rule 01.
   */
  for (const [key, value] of Object.entries(template)) {
    if (matchesShape(value, incoming[key])) {
      Object.assign(merged, { [key]: incoming[key] });
    }
  }

  return merged;
};

const pickId = <T extends string | number>(
  candidate: unknown,
  allowed: readonly { id: T }[],
  fallback: T,
): T => {
  const match = allowed.find((item) => item.id === candidate);
  return match ? match.id : fallback;
};

const clamp01 = (value: unknown, fallback: number): number =>
  isFiniteNumber(value) ? Math.min(Math.max(value, 0), 1) : fallback;

export const sanitizeConfig = (
  incoming: unknown,
  definition: IProductDefinition,
): IBaseConfig => {
  const config = definition.createDefault();
  if (!isRecord(incoming)) return config;

  const book = DEFAULT_PRICE_BOOK;

  config.material = pickId(incoming.material, book.materials, config.material);
  config.finish = pickId(incoming.finish, book.finishes, config.finish);
  config.doorType = pickId(incoming.doorType, book.doorTypes, config.doorType);
  config.backPanel = pickId(incoming.backPanel, book.backPanels, config.backPanel);
  config.doorOpen = clamp01(incoming.doorOpen, config.doorOpen);

  if (isFiniteNumber(incoming.height)) {
    setHeight(config, incoming.height, definition.limits.height);
  }
  if (isFiniteNumber(incoming.depth)) {
    setDepth(config, incoming.depth, definition.limits.depth);
  }
  if (isFiniteNumber(incoming.sectionCount)) {
    setSectionCount(
      config,
      incoming.sectionCount,
      definition.limits,
      definition.createSection,
    );
  }

  const sections = Array.isArray(incoming.sections) ? incoming.sections : [];

  for (let index = 0; index < config.sectionCount; index += 1) {
    const template = config.sections[index];
    if (!template) continue;

    const merged = mergeSection(template, sections[index]);
    config.sections[index] = merged;
    setSectionWidth(config, index, merged.width, definition.limits.width);
  }

  return config;
};
