/**
 * pdfmake'in sunucu tarafı (`PdfPrinter`) için asgari bildirim.
 *
 * `@types/pdfmake` kaldırıldı: TARAYICI API'sini (`createPdf`) tarif ediyor,
 * sunucudaki sınıfı hiç tanımıyor ve `pdfmake` modülünü kendi şekliyle
 * gölgeliyordu.
 *
 * pdfmake **0.2**'de kalındı, bilerek: 0.3'ün sunucu girişi ESM ve bu repodaki
 * jest CommonJS — spec dosyayı ayrıştıramıyor. Belge üretimi test edilemezse
 * Türkçe karakter kaybı gibi sessiz hatalar müşteriye kalır, ve bu belge
 * müşterinin eline geçen tek şey.
 *
 * Burada YALNIZCA kullandığımız alanlar var. Eksiksiz bir kopya yazmak, upstream
 * değiştiğinde sessizce yanlışa dönecek bir yalan olurdu.
 */
declare module 'pdfmake' {
  export type { TDocumentDefinitions };

  interface IFontFaces {
    normal: string;
    bold: string;
    italics: string;
    bolditalics: string;
  }

  type TFontDictionary = Record<string, IFontFaces>;

  interface ITextCell {
    text: string;
    bold?: boolean;
    fontSize?: number;
    alignment?: 'left' | 'right' | 'center';
    color?: string;
    margin?: [number, number, number, number];
  }

  type TCell = string | ITextCell;

  interface ITableBlock {
    table: { widths: (string | number)[]; body: TCell[][] };
    layout?: string;
  }

  type TContent = ITextCell | ITableBlock;

  interface TDocumentDefinitions {
    pageSize?: string;
    pageMargins?: [number, number, number, number];
    defaultStyle?: { font?: string; fontSize?: number; color?: string };
    content: TContent[];
  }

  interface IPdfKitDocument {
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    end(): void;
  }

  class PdfPrinter {
    constructor(fonts: TFontDictionary);
    createPdfKitDocument(definition: TDocumentDefinitions): IPdfKitDocument;
  }

  export = PdfPrinter;
}
