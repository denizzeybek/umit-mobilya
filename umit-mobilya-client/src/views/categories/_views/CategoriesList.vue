<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-end">
      <Button label="Kategori Ekle" @click="showCategoryModal = true" />
    </div>

    <Card>
      <template #content>
        <DataTable
          tableStyle="min-width: 50rem"
          :loading="isLoading"
          :value="categories"
          paginator
          v-model:filters="filters"
          :globalFilterFields="['name']"
          :rows="20"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <template #header>
            <div class="flex justify-end">
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Keyword Search"
                />
              </IconField>
            </div>
          </template>
          <Column field="name" header="Kategori Adı"> </Column>
          <!-- <Column field="createdAt" header="Created At"> </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <div class="flex gap-3">
                <Button
                  icon="pi pi-calendar"
                  severity="warn"
                />
              </div>
            </template>
          </Column> -->

          <template #footer>
            In total there are
            {{ categories ? categories.length : 0 }} categories.
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
  <CategoryModal
    v-if="showCategoryModal"
    v-model:open="showCategoryModal"
    @fetchCategories="fetchCategories"
  />
  <!-- :data="productsStore.currentProduct" -->
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCategoriesStore } from '@/stores/categories';
import CategoryModal from '../_components/_modals/CategoryModal.vue';
import { FilterMatchMode } from '@primevue/core/api';

interface IProps {
  isLoading: boolean;
}

defineProps<IProps>();

const showCategoryModal = ref(false);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

const categoriesStore = useCategoriesStore();

const categories = computed(() => categoriesStore.list);

const fetchCategories = async () => {
  await categoriesStore.fetch();
};

onMounted(async () => {
  await fetchCategories();
});
</script>

<style scoped></style>
