import type { IBaseConfig, IBaseSection } from '../../types';

/**
 * Vestiyerin bölümü gardıroptan farklı: kapak yerine açık askı, çekmece
 * yerine oturak ve altında ayakkabılık var. Ortak olan tek şey genişlik —
 * `IBaseSection` zaten yalnızca onu tanımlıyor.
 *
 * `benchFromFloor` ZEMİNDEN ölçülür, raf ve askı çıtası TAVANDAN. Sebebi
 * imalat: oturak yüksekliği oturma yüksekliğidir (45 cm civarı), tavandan
 * ölçmek anlamsız olurdu.
 */
export interface IVestiyerSection extends IBaseSection {
  benchFromFloor: number | null;
  shoeShelves: number;
  shelves: number[];
  hookRail: number | null;
}

export interface IVestiyerConfig extends IBaseConfig {
  sections: IVestiyerSection[];
}
