
<script setup>


</script>




<template>
 <div class="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 dark:bg-gray-900">

    <!-- === TOOLBAR PRINCIPALE === -->
    <div class="card mb-6 shadow-sm rounded-xl bg-white dark:bg-gray-800">
      <Toolbar class="flex flex-wrap justify-between items-center gap-4 p-4">
        <!-- Boutons de gauche -->
        <template #start>
        
          <div class="flex flex-wrap gap-2">
            <Button label="Nouveau Produit" icon="pi pi-plus" severity="success" @click="openNew" />
            <Button
              label="Effacer"
              icon="pi pi-trash"
              severity="danger"
              :disabled="!selectedProducts || !selectedProducts.length"
              @click="confirmDeleteSelected"
            />
            <h4 class="m-0 text-lg sm:text-xl font-semibold">Table Produits depôt</h4>
          </div>
        </template>
        <!-- Boutons de droite -->
        <template #end>
          <div class="flex flex-wrap gap-2 justify-end"> 
            <Button
                icon="pi pi-refresh"
                label="Actualiser"
                class="p-button-outlined p-button-secondary"
                @click="forceRefresh"
              />
          </div>
        </template>

      </Toolbar>
    </div>
    <!-- === DATATABLE === -->
    <div class="card shadow-md rounded-xl overflow-x-auto bg-white dark:bg-gray-800 p-4">
      <DataTable
        ref="dt"
        v-model:selection="selectedProducts"
        :value="filteredProducts"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        responsiveLayout="scroll"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords} produits"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      >
        <!-- === COLONNES === -->
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />

        <Column field="id" header="ID" sortable style="min-width: 5rem" />

        <Column field="name" header="Nom produit" sortable style="min-width: 12rem" />

        <Column field="stock" header="Stock" sortable style="min-width: 6rem" />

        <Column field="created_at" header="Date Ajout" sortable style="min-width: 10rem">
         
        </Column>

        <Column field="expiration_date" header="Date Exp" sortable style="min-width: 10rem">
         
        </Column>

        <Column field="category_name" header="Catégorie" sortable style="min-width: 10rem" />

        <Column field="barcode" header="Code barre" sortable style="min-width: 10rem">
    
        </Column>

      </DataTable>
    </div>
</div>
</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 640px) {
  .p-button {
    width: 100%;
  }
  .p-datatable th, .p-datatable td {
    font-size: 0.85rem;
    padding: 0.4rem 0.5rem;
  }
}
</style>