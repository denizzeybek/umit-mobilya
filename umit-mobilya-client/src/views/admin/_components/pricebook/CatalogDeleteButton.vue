<template>
  <Button
    icon="pi pi-trash"
    severity="danger"
    text
    size="small"
    :aria-label="`${label} sil`"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';

/**
 * Katalogdan bir satır silme düğmesi — kaplama ve kapak tipi için ortak.
 *
 * Onay zorunlu ve metni tek yerde, çünkü silmenin bedeli gözle görünmüyor:
 * kimlik paylaşılmış bağlantılarda ve eski tasarımlarda duruyor. Silinen bir
 * kimliği taşıyan bağlantı açıldığında `sanitizeConfig` sessizce varsayılana
 * düşüyor — çökme yok, ama karşı taraf paylaşılandan BAŞKA bir dolap görüyor.
 *
 * Verilmiş teklifler etkilenmiyor: tutar ve döküm kayda dondurulmuş, canlı
 * katalogdan okunmuyor.
 */
interface IProps {
  /** Silinecek satırın kullanıcıya görünen adı. */
  label: string;
  /** "kaplama" | "kapak tipi" gibi; onay metnine giriyor. */
  kind: string;
}

const props = defineProps<IProps>();

const emit = defineEmits<IEmits>();

interface IEmits {
  (event: 'confirm'): void;
}

const confirm = useConfirm();

const handleClick = (event: Event): void => {
  confirm.require({
    target: event.currentTarget instanceof HTMLElement
      ? event.currentTarget
      : undefined,
    header: `${props.label} silinsin mi?`,
    message:
      `Bu ${props.kind} katalogdan tamamen kalkar. Onu taşıyan paylaşılmış ` +
      'bağlantılar açıldığında varsayılana düşer — açan kişi paylaşılandan ' +
      'başka bir dolap görür. Verilmiş teklifler etkilenmez, tutarları ' +
      'dondurulmuş durumda.\n\n' +
      'Yalnızca listeden kaldırmak istiyorsan "Listede" anahtarını kapat: ' +
      'kimlik yerinde kalır, müşteri artık görmez.',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Vazgeç',
    rejectProps: { severity: 'secondary', outlined: true },
    acceptLabel: 'Sil',
    acceptProps: { severity: 'danger' },
    accept: () => emit('confirm'),
  });
};
</script>
