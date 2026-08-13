import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { DEFAULT_PRICE_BOOK } from '../pricing/defaults';
import { createDefaultConfig } from '../products/gardirop/options';
import { gardiropParts } from '../products/gardirop/parts';

import { applyDoorOpen, buildFromParts } from './buildFromParts';

import type { IGardiropConfig } from '../products/gardirop/types';

/**
 * Köşeden sonra dönen modülün kapağı, modülün KENDİ cephesine göre açılmalı.
 * Bu sahne tarafının tek gerçek riski: açı taban dönüşün üstüne binmezse
 * kapaklar kaydırıcı ilk milimetrede gövdenin içine giriyor ve bunu hiçbir
 * saf fonksiyon testi görmüyor.
 */
const QUARTER = -Math.PI / 2;

const buildWith = (config: IGardiropConfig) =>
  buildFromParts({
    config,
    parts: gardiropParts(config, DEFAULT_PRICE_BOOK),
    book: DEFAULT_PRICE_BOOK,
  });

const cornerFirst = (): IGardiropConfig => {
  const config = createDefaultConfig();
  const section = config.sections[0];
  if (!section) throw new Error('Varsayılan config bölümsüz.');

  section.corner = true;

  return config;
};

describe('buildFromParts — dönmüş modülün kapakları', () => {
  it('köşesiz gövdede bütün pivotlar dönüşsüzdür', () => {
    const build = buildWith(createDefaultConfig());

    expect(build.doorPivots.length).toBeGreaterThan(0);
    expect(build.doorPivots.every((door) => door.baseRotationY === 0)).toBe(
      true,
    );
    build.dispose();
  });

  it('köşeden sonraki modülün pivotu modülün dönüşünü taşır', () => {
    const build = buildWith(cornerFirst());

    const turned = build.doorPivots.filter(
      (door) => Math.abs(door.baseRotationY - QUARTER) < 1e-9,
    );

    expect(turned.length).toBeGreaterThan(0);
    build.dispose();
  });

  it('açılma açısı taban dönüşün ÜSTÜNE biner', () => {
    const build = buildWith(cornerFirst());

    applyDoorOpen(build.doorPivots, 1);

    for (const { pivot, baseRotationY } of build.doorPivots) {
      /* Kapak ya sola ya sağa açılıyor; ikisi de tabandan ÖLÇÜLÜ olmalı. */
      const swing = Math.abs(pivot.rotation.y - baseRotationY);

      expect(swing).toBeGreaterThan(0);
      expect(swing).toBeLessThanOrEqual((100 * Math.PI) / 180 + 1e-9);
    }

    build.dispose();
  });

  /*
   * Katlanır kapağın hareketi: KAPALIYKEN iki kanat dik duruyor (her biri
   * kendi cephesinde), açılırken aradaki açı kapanıyor ve ikinci kanat
   * birincinin üstüne katlanıyor. İmalat çizimindeki hâl bu.
   */
  it('kapalıyken iki kanat dik, açıkken üst üste katlanmış olur', () => {
    const build = buildWith(cornerFirst());
    const fold = build.doorPivots.find((door) => door.fold);
    if (!fold) throw new Error('Köşe modülünde katlanan kanat yok.');

    applyDoorOpen(build.doorPivots, 0);
    const closed = Math.abs(fold.pivot.rotation.y);

    applyDoorOpen(build.doorPivots, 1);
    const open = Math.abs(fold.pivot.rotation.y);

    expect(closed).toBeCloseTo(Math.PI / 2, 9);
    /* Tam katlanma 180°; ötesi kanadı kanadın içinden geçirirdi. */
    expect(open).toBeCloseTo(Math.PI, 9);

    build.dispose();
  });

  /*
   * Katlanan çiftin süpürdüğü yer tek kanat kadar olmalı. Kanatlar aynı
   * düzleme açıldığında iki kanat boyunda bir panel oluyor ve komşu modülün
   * kapağının içinden geçiyordu — kullanıcının gördüğü hata buydu.
   */
  it('katlanan çift, tek kanattan uzağa taşmaz', () => {
    const build = buildWith(cornerFirst());
    const fold = build.doorPivots.find((door) => door.fold);
    if (!fold) throw new Error('Köşe modülünde katlanan kanat yok.');

    applyDoorOpen(build.doorPivots, 1);

    const tip = new Vector3();
    fold.pivot.updateWorldMatrix(true, true);
    fold.pivot.localToWorld(tip.set(0, 0, 0));

    const hinge = new Vector3();
    const carrier = build.doorPivots.find((door) => !door.fold);
    carrier?.pivot.updateWorldMatrix(true, true);
    carrier?.pivot.localToWorld(hinge.set(0, 0, 0));

    /* Katlanma noktası, taşıyıcı menteşeden bir kanat boyu uzakta kalıyor. */
    expect(tip.distanceTo(hinge)).toBeLessThan(1.1);

    build.dispose();
  });

  it('katlanan kanat, bir önceki kanadın çocuğudur', () => {
    const build = buildWith(cornerFirst());

    const folds = build.doorPivots.filter((door) => door.fold);
    const carriers = build.doorPivots.filter((door) => !door.fold);

    expect(folds).toHaveLength(1);
    expect(
      carriers.some((carrier) => carrier.pivot.children.includes(folds[0].pivot)),
    ).toBe(true);

    build.dispose();
  });

  it('kapalıyken kapak, modülün dönüşü ne olursa olsun kapalıdır', () => {
    const build = buildWith(cornerFirst());

    applyDoorOpen(build.doorPivots, 0);

    for (const { pivot, baseRotationY } of build.doorPivots) {
      expect(pivot.rotation.y).toBeCloseTo(baseRotationY, 9);
    }

    build.dispose();
  });
});
