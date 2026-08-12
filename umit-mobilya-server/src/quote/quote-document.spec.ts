import { buildQuoteHtml, quoteDocumentModel } from './quote-document';

import type { QuoteResponseDto } from './dto/quote-response.dto';

const quote = (overrides: Partial<QuoteResponseDto> = {}): QuoteResponseDto =>
  ({
    code: 'UM-2608-K7M4XQ',
    productType: 'gardirop',
    configSchemaVersion: 1,
    config: { width: 180, height: 220, depth: 60, sectionCount: 2 },
    price: {
      lines: [
        { label: 'Gövde', amount: 14880 },
        { label: 'Kapak — Kulpsuz kapak', amount: 9702 },
      ],
      netTotal: 40000,
      vat: 8000,
      total: 48000,
    },
    priceBookVersion: 3,
    contact: { name: 'Deniz Zeybek', phone: '0549 676 21 08' },
    createdAt: new Date('2026-08-12T09:00:00Z'),
    ...overrides,
  }) as QuoteResponseDto;

/**
 * Belge müşterinin eline geçen tek şey. İki şeyi kanıtlaması gerekiyor:
 * gizli kalemlerin burada da gizli kaldığı, ve Türkçe karakterlerin
 * bozulmadığı.
 */
describe('quoteDocumentModel', () => {
  it('teklif kodunu, ölçüleri ve toplamı taşır', () => {
    const model = quoteDocumentModel(quote());

    expect(model.code).toBe('UM-2608-K7M4XQ');
    expect(model.dimensions).toBe('180 × 220 × 60 cm');
    expect(model.total).toContain('48.000');
  });

  /* Arkalık ve kâr marjı dökümde yok; belgede de olmamalı. */
  it('yalnızca görünür kalemleri listeler', () => {
    const model = quoteDocumentModel(quote());

    expect(model.lines).toHaveLength(2);
    expect(model.lines.map((line) => line.label)).not.toContain('Arkalık');
  });

  it('KDV ayrı satır olarak görünür', () => {
    const model = quoteDocumentModel(quote());

    expect(model.vat).toContain('8.000');
  });

  it('KDV sıfırsa satır açılmaz', () => {
    const model = quoteDocumentModel(
      quote({
        price: {
          lines: [],
          netTotal: 100,
          vat: 0,
          total: 100,
        } as QuoteResponseDto['price'],
      }),
    );

    expect(model.vat).toBeNull();
  });

  it('bağlayıcı olmadığı ibaresi her belgede vardır', () => {
    expect(quoteDocumentModel(quote()).disclaimer).toMatch(/bağlayıcı/i);
  });
});

describe('buildQuoteHtml', () => {
  it('Türkçe karakterleri kaçırmadan taşır', () => {
    const html = buildQuoteHtml(quoteDocumentModel(quote()));

    expect(html).toContain('Gövde');
    expect(html).toContain('ĞÜŞİÖÇ'.toLowerCase() === '' ? '' : 'Ölçüler');
    expect(html).toContain('UTF-8');
  });

  /* Müşteri adı HTML'e gömülüyor; kaçırılmazsa şablonu kırabilir. */
  it('müşteri adındaki HTML kaçırılır', () => {
    const html = buildQuoteHtml(
      quoteDocumentModel(
        quote({
          contact: {
            name: '<script>alert(1)</script>',
            phone: '0549 676 21 08',
          },
        }),
      ),
    );

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
