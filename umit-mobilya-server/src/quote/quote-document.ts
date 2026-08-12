import type { QuoteResponseDto } from './dto/quote-response.dto';

/**
 * Teklif belgesi. Müşterinin eline geçen tek şey bu, o yüzden iki kural
 * dökümdekiyle aynı: gizli kalemler (arkalık, kâr marjı) burada da YOK, ve
 * "bağlayıcı teklif değildir" ibaresi her belgede var.
 *
 * Model ile çıktı ayrı: aynı model hem HTML hem PDF besliyor, böylece ikisi
 * farklı rakam gösteremiyor.
 */
export interface IQuoteDocumentLine {
  label: string;
  amount: string;
}

export interface IQuoteDocumentModel {
  code: string;
  productLabel: string;
  dimensions: string;
  createdAt: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  note: string | null;
  lines: IQuoteDocumentLine[];
  vat: string | null;
  total: string;
  disclaimer: string;
}

const PRODUCT_LABELS: Record<string, string> = {
  gardirop: 'Gardırop',
  vestiyer: 'Vestiyer',
};

const DISCLAIMER =
  'Bu bir ön tahmindir, bağlayıcı teklif değildir. Kesin fiyat ücretsiz ' +
  'keşiften sonra netleşir.';

const formatTry = (value: number): string =>
  `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )} TL`;

const dimensionOf = (config: Record<string, unknown>): string => {
  const read = (key: string): number =>
    typeof config[key] === 'number' ? (config[key] as number) : 0;

  return `${read('width')} × ${read('height')} × ${read('depth')} cm`;
};

export const quoteDocumentModel = (
  quote: QuoteResponseDto,
): IQuoteDocumentModel => {
  const price = quote.price;

  return {
    code: quote.code,
    productLabel: PRODUCT_LABELS[quote.productType] ?? quote.productType,
    dimensions: dimensionOf(quote.config),
    createdAt: new Date(quote.createdAt).toLocaleDateString('tr-TR'),
    contactName: quote.contact.name,
    contactPhone: quote.contact.phone,
    contactEmail: quote.contact.email ?? null,
    note: quote.contact.note ?? null,
    lines: price.lines.map((line) => ({
      label: line.label,
      amount: formatTry(line.amount),
    })),
    vat: price.vat > 0 ? formatTry(price.vat) : null,
    total: formatTry(Math.round(price.total / 10) * 10),
    disclaimer: DISCLAIMER,
  };
};

/**
 * Müşteri adı ve notu doğrudan gövdeden geliyor; kaçırılmazsa şablonu
 * kırabilir ya da belgeye script sokabilir.
 */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const buildQuoteHtml = (model: IQuoteDocumentModel): string => {
  const rows = model.lines
    .map(
      (line) =>
        `<tr><td>${escapeHtml(line.label)}</td><td class="num">${escapeHtml(line.amount)}</td></tr>`,
    )
    .join('');

  const vatRow = model.vat
    ? `<tr><td>KDV</td><td class="num">${escapeHtml(model.vat)}</td></tr>`
    : '';

  return `<!doctype html>
<html lang="tr"><head><meta charset="UTF-8" />
<title>Teklif ${escapeHtml(model.code)}</title>
<style>
 body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#22251f;margin:40px;max-width:720px}
 h1{font-size:22px;margin:0 0 4px}
 .muted{color:#6b6f66;font-size:13px}
 table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}
 td{padding:8px 0;border-bottom:1px solid #e3e1da}
 .num{text-align:right;white-space:nowrap}
 .total td{border-bottom:none;border-top:2px solid #22251f;font-weight:600;font-size:16px;padding-top:12px}
 .note{margin-top:28px;font-size:12px;color:#6b6f66}
</style></head><body>
<h1>Ümit Mobilya Dekorasyon</h1>
<p class="muted">Kuşadası'nda ısmarlama mobilya ve mimari ahşap</p>

<table>
 <tr><td>Teklif no</td><td class="num">${escapeHtml(model.code)}</td></tr>
 <tr><td>Tarih</td><td class="num">${escapeHtml(model.createdAt)}</td></tr>
 <tr><td>Ürün</td><td class="num">${escapeHtml(model.productLabel)}</td></tr>
 <tr><td>Ölçüler</td><td class="num">${escapeHtml(model.dimensions)}</td></tr>
 <tr><td>Müşteri</td><td class="num">${escapeHtml(model.contactName)}</td></tr>
 <tr><td>Telefon</td><td class="num">${escapeHtml(model.contactPhone)}</td></tr>
</table>

<table>
 ${rows}
 ${vatRow}
 <tr class="total"><td>Toplam</td><td class="num">${escapeHtml(model.total)}</td></tr>
</table>

<p class="note">${escapeHtml(model.disclaimer)}</p>
</body></html>`;
};
