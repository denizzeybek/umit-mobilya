<template>
  <section class="flex flex-col gap-6" data-testid="admin-quotes">
    <header>
      <h2 class="font-serif text-2xl text-f-ink">Teklif talepleri</h2>
      <p class="mt-1 text-sm text-f-ink-muted">
        Tutarlar teklif verildiği andaki fiyatlarla <strong>donmuş</strong>tur;
        fiyat kitabını değiştirmek bu rakamları değiştirmez.
      </p>
    </header>

    <DataTable
      :value="quotesStore.list?.items ?? []"
      :loading="quotesStore.loading"
      data-key="code"
      paginator
      :rows="20"
      :rows-per-page-options="[5, 10, 20, 50]"
      :total-records="quotesStore.list?.total ?? 0"
      lazy
      class="text-sm"
      @page="onPage"
    >
      <Column field="code" header="Kod" />
      <Column field="productType" header="Ürün" />
      <Column field="contactName" header="Müşteri" />
      <Column field="contactPhone" header="Telefon" />
      <Column header="Tutar">
        <template #body="{ data }">{{ formatTry(data.total) }}</template>
      </Column>
      <Column header="Tarih">
        <template #body="{ data }">
          {{ new Date(data.createdAt).toLocaleDateString('tr-TR') }}
        </template>
      </Column>
      <Column header="">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              label="3D'de aç"
              size="small"
              outlined
              @click="openInConfigurator(data.code)"
            />
            <Button
              label="Sil"
              size="small"
              severity="danger"
              outlined
              @click="handleRemove(data.code)"
            />
          </div>
        </template>
      </Column>

      <template #empty>
        <p class="py-6 text-center text-f-ink-muted">Henüz teklif yok.</p>
      </template>
    </DataTable>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useFToast } from '@/composables/useFToast';
import { ERouteNames } from '@/router/routeNames.enum';
import { useQuotesStore } from '@/stores/quotes';
import { CONFIG_QUERY_KEY, encodeConfig } from '@/views/configurator/_etc/configUrl';

import type { EProductType, IBaseConfig } from '@/views/configurator/_etc/types';
import type { DataTablePageEvent } from 'primevue/datatable';

/**
 * Durum düğmesi YOK: teklif herkese açık bir ekranda yaratılıyor, oturum açmış
 * bir kullanıcı olmadığı için "gönderildi / onaylandı" diyecek de kimse yok.
 */
const quotesStore = useQuotesStore();
const router = useRouter();
const { showErrorMessage, showSuccessMessage } = useFToast();

const formatTry = (value: number): string =>
  `₺${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)}`;

async function load(limit = 20, skip = 0) {
  try {
    await quotesStore.fetchList(limit, skip);
  } catch (error) {
    showErrorMessage(error);
  }
}

function onPage(event: DataTablePageEvent) {
  void load(event.rows, event.first);
}

/*
 * Teklifi konfigüratörde açmak Faz 1'in yan ürünü: config zaten URL'e
 * kodlanabiliyor, ek bir mekanizma gerekmiyor.
 */
async function openInConfigurator(code: string) {
  try {
    const quote = await quotesStore.fetchByCode(code);
    const encoded = encodeConfig(
      quote.productType as EProductType,
      quote.config as unknown as IBaseConfig,
    );

    void router.push({
      name: ERouteNames.Configurator,
      params: { product: quote.productType },
      query: { [CONFIG_QUERY_KEY]: encoded },
    });
  } catch (error) {
    showErrorMessage(error);
  }
}

async function handleRemove(code: string) {
  try {
    await quotesStore.remove(code);
    showSuccessMessage('Teklif silindi.');
    await load();
  } catch (error) {
    showErrorMessage(error);
  }
}

onMounted(() => void load());
</script>
