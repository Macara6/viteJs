
<script setup>


</script>


<template>
    <div>
      <div class="card">
        <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
        </Toolbar>

        <DataTable :value="products" sortMode="multiple" tableStyle="min-width: 50rem">
            <Column field="id" header="ID" sortable style="width: 25%"></Column>
            <Column field="name" header="NOM" sortable style="width: 25%"></Column>
            <Column field="fonction" header="FOCTION" sortable style="width: 25%"></Column>
            <Column field="email" header="EMAIL" sortable style="width: 25%"></Column>
            <Column field="phone" header="PHONE" sortable style="width: 25%"></Column>
        </DataTable>

      </div>
    </div>

</template>

<style>



</style>