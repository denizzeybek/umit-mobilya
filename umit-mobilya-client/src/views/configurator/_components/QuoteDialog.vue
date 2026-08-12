<template>
  <Dialog
    v-model:visible="open"
    modal
    header="Bu tasarım için teklif al"
    class="w-[min(32rem,92vw)]"
  >
    <form v-if="!created" class="flex flex-col gap-4" @submit="submitHandler">
      <FInput
        name="name"
        label="Ad soyad"
        placeholder="Adınız"
        data-testid="quote-name"
      />
      <FInput
        name="phone"
        label="Telefon"
        placeholder="05xx xxx xx xx"
        data-testid="quote-phone"
      />
      <FInput name="email" label="E-posta (isteğe bağlı)" placeholder="ornek@eposta.com" />
      <FInput name="note" label="Not (isteğe bağlı)" placeholder="Eklemek istedikleriniz" />

      <p class="text-sm text-f-ink-muted">
        Tasarımın ölçüleri ve seçimleri teklife otomatik ekleniyor. Fiyat
        keşiften sonra netleşir.
      </p>

      <Button
        type="submit"
        label="Teklif Gönder"
        data-testid="quote-submit"
        :disabled="isSubmitting"
        :loading="isSubmitting"
        class="w-full"
      />
    </form>

    <div v-else class="flex flex-col gap-4">
      <p class="text-f-ink">
        Teklif talebin alındı. Referans numaran:
      </p>
      <p class="display text-display-sm text-f-primary" data-testid="quote-code">
        {{ created.code }}
      </p>
      <p class="text-sm text-f-ink-muted">
        Bu numarayı sakla — teklifini bu numarayla tekrar açabilirsin.
      </p>
      <a
        :href="documentUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="block bg-f-primary py-3 text-center text-[0.7rem] font-medium uppercase tracking-[0.16em] text-f-paper transition-colors duration-300 hover:bg-f-primary-hovered"
      >
        Teklifi PDF indir
      </a>

      <Button label="Kapat" severity="secondary" outlined @click="handleClose" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useForm } from 'vee-validate';
import * as yup from 'yup';

import { useFToast } from '@/composables/useFToast';
import { useQuotesStore } from '@/stores/quotes';

import type { IBaseConfig } from '../_etc/types';
import type { EProductType } from '../_etc/types';
import type { QuoteResponseDto } from '@/client';

/**
 * Konfigüratörün çıktısını teklife çeviren form. Gövde yalnızca tasarımı ve
 * iletişimi taşıyor: FİYAT GÖNDERİLMİYOR, sunucu kendi hesaplıyor.
 */
interface IProps {
  productType: EProductType;
  config: IBaseConfig;
}

const props = defineProps<IProps>();

const open = defineModel<boolean>('open', { required: true });

const quotesStore = useQuotesStore();
const { showErrorMessage, showSuccessMessage } = useFToast();

const created = ref<QuoteResponseDto | null>(null);

/*
 * Belge ucu public: teklifi veren oturum açmıyor ve kendi belgesini
 * indirebilmeli. Erişimi tahmin edilemez kod koruyor, o yüzden düz bir
 * bağlantı yeterli — istek store'dan geçmesi gerekmiyor, bu bir gezinme.
 */
const documentUrl = computed(() =>
  created.value
    ? `${import.meta.env.VITE_API_URL}/quotes/${created.value.code}/document`
    : '',
);

const validationSchema = yup.object({
  name: yup.string().required().min(2).label('Ad soyad'),
  phone: yup
    .string()
    .required()
    .matches(/^(\+90|0)?[\s(-]*5\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}$/, {
      message: 'Geçerli bir cep telefonu numarası girin',
    })
    .label('Telefon'),
  email: yup.string().email().label('E-posta'),
  note: yup.string().max(2000).label('Not'),
});

const { handleSubmit, isSubmitting, resetForm } = useForm({ validationSchema });

const submitHandler = handleSubmit(async (values) => {
  try {
    created.value = await quotesStore.create({
      productType: props.productType,
      config: props.config as unknown as Record<string, unknown>,
      contact: {
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        note: values.note || undefined,
      },
    });
    showSuccessMessage('Teklif talebin alındı.');
  } catch (error) {
    showErrorMessage(error);
  }
});

const handleClose = () => {
  resetForm();
  created.value = null;
  open.value = false;
};
</script>
