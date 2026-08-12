import { join } from 'node:path';

import PdfPrinter from 'pdfmake';

import type { IQuoteDocumentModel } from './quote-document';
import type { TDocumentDefinitions } from 'pdfmake';

/**
 * PDF üretimi. Puppeteer YOK: Railway'de Chromium indirmek imajı ~300 MB
 * büyütür ve Nixpacks'te ek yapılandırma ister — tek sayfalık bir teklif
 * belgesi için orantısız. `pdfmake` saf JS ve gömülü font kullanıyor.
 *
 * Gömülü TTF şart: pdfmake'in standart 14 PDF fontu (Helvetica ailesi) ek
 * dosya gerektirmiyor ama WinAnsi kodlamasında `ğ ş ı İ` YOK. Onlarla
 * üretilen bir belgede Türkçe karakterler sessizce kaybolur ve bunu ancak
 * müşteri fark eder.
 */
/*
 * Font REPODA, pdfmake'in içinde değil: 0.2 sürümü disk üstünde TTF taşımıyor
 * (tarayıcı için sanal dosya sistemi kullanıyor). `dist/` altından da
 * çözülebilsin diye yol kaynak köküne göre hesaplanıyor.
 */
export const FONT_DIR = join(__dirname, '..', '..', 'assets', 'fonts');

const FONTS = {
  Roboto: {
    normal: join(FONT_DIR, 'Roboto-Regular.ttf'),
    bold: join(FONT_DIR, 'Roboto-Medium.ttf'),
    italics: join(FONT_DIR, 'Roboto-Regular.ttf'),
    bolditalics: join(FONT_DIR, 'Roboto-Medium.ttf'),
  },
};

const INK = '#22251f';
const MUTED = '#6b6f66';

export const quoteDefinition = (
  model: IQuoteDocumentModel,
): TDocumentDefinitions => {
  const rows: [string, string][] = [
    ['Teklif no', model.code],
    ['Tarih', model.createdAt],
    ['Ürün', model.productLabel],
    ['Ölçüler', model.dimensions],
    ['Müşteri', model.contactName],
    ['Telefon', model.contactPhone],
  ];

  const priceRows: [string, string][] = model.lines.map((line) => [
    line.label,
    line.amount,
  ]);

  if (model.vat) priceRows.push(['KDV', model.vat]);

  return {
    pageSize: 'A4',
    pageMargins: [48, 56, 48, 56],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: INK },
    content: [
      { text: 'Ümit Mobilya Dekorasyon', fontSize: 18, bold: true },
      {
        text: "Kuşadası'nda ısmarlama mobilya ve mimari ahşap",
        color: MUTED,
        margin: [0, 2, 0, 20],
      },
      {
        table: { widths: ['*', 'auto'], body: rows },
        layout: 'lightHorizontalLines',
      },
      { text: '', margin: [0, 14, 0, 0] },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ...priceRows,
            [
              { text: 'Toplam', bold: true, fontSize: 12 },
              { text: model.total, bold: true, fontSize: 12, alignment: 'right' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },
      {
        text: model.disclaimer,
        color: MUTED,
        fontSize: 8,
        margin: [0, 24, 0, 0],
      },
    ],
  };
};

export const renderQuotePdf = async (
  model: IQuoteDocumentModel,
): Promise<Buffer> => {
  const printer = new PdfPrinter(FONTS);
  const doc = printer.createPdfKitDocument(quoteDefinition(model));

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
};
