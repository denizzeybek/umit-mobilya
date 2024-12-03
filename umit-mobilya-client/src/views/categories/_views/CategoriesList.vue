<template>
    <Card>
      <template #content>
        <DataTable
          tableStyle="min-width: 50rem"
          :loading="isLoading"
          :value="categories"
          paginator
          :rows="5"
          :rowsPerPageOptions="[5, 10, 20, 50]"
        >
          <Column field="Name" header="Name"> </Column>
          <Column field="Teams" header="Teams"> </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <div class="flex gap-3">
                <Button
                  icon="pi pi-calendar"
                  severity="warn"
                  :outlined="getDomainEnum(slotProps.data.Domain) !== EDomain.MEETING"
                />
              </div>
            </template>
          </Column>
  
          <template #footer>
            In total there are {{ categories ? categories.length : 0 }} categories.
          </template>
        </DataTable>
      </template>
    </Card>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  
  interface IProps {
    isLoading: boolean;
  }
  
  defineProps<IProps>();
  
//   const categoriesStore = useCategoriesStore();
  
  const categories = computed(() => []);

  </script>
  
  <style scoped></style>
  