

<script setup>




</script>


<template>
  <div class="p-4 md:p-6">
    <div class="card shadow-sm rounded-xl border border-gray-100 bg-white">

      <!-- En-tête de la page -->
      <div class="flex items-center justify-between px-6 pt-6 pb-2">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Liste des factures</h1>
          <p class="text-sm text-gray-400 mt-1">Suivi et gestion des facturation clients</p>
        </div>
      </div>

      <DataTable
       
        scrollable
        scrollHeight="400px"
        class="mt-2"
        :filters="filters"
        stripedRows
      >

        <template #header>
          <div class="flex flex-col gap-5 px-2 py-3">

            <!-- Ligne 1 : Actions + Filtres de date -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              <div class="flex flex-wrap gap-3 items-center">


                <div class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
                  <Calendar
                   
                    placeholder="Date début"
                    date-format="yy-mm-dd"
                    show-icon
                    class="w-40"
                  />
                  <i class="pi pi-arrow-right text-gray-400 text-xs"></i>
                  <Calendar
                   
                    placeholder="Date fin"
                    date-format="yy-mm-dd"
                    show-icon
                    class="w-40"
                  />
                  <Button
                    icon="pi pi-refresh"
                    class="p-button-text p-button-secondary"
                    v-tooltip.top="'Réinitialiser les dates'"
                    
                  />
                </div>
              </div>

              <!-- Filtre utilisateur + recherche -->
              <div class="flex flex-wrap gap-3 items-center justify-end w-full lg:w-auto">

               

                <!-- Recherche globale -->
                <span class="relative flex items-center w-full sm:w-64">
                  <i
                   
                    class="pi pi-search absolute left-3 text-gray-400 text-sm"
                  ></i>
                  <InputText
                   
                    placeholder="       Rechercher..."
                    class="w-full pl-9 py-2 text-sm rounded-lg"
                  />
                </span>
              </div>
            </div>

            <!-- Ligne 2 : Totaux sous forme de cartes -->
            <div class="flex flex-wrap gap-4">
            

              <div class="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 min-w-[180px]">
                <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <i class="pi pi-dollar text-blue-600 text-sm"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500">Total USD</div>
                  <div class="text-base font-bold text-blue-700"> </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <Column field="id" header="NUMERO" style="min-width: 90px">
          <template #body="slotProps">
            <span class="text-gray-500 font-mono text-sm"> </span>
          </template>
        </Column>

        <Column field="total_amount" header="MONTANT" style="min-width: 200px">
          

          <template #body="slotProps">
            <span class="font-semibold text-gray-800">
              
              
            </span>
          </template>
        </Column>

        <Column field="supplier_name" header="CLIENT(E)" style="min-width: 200px">
          <template #body="slotProps">
            <span class="text-gray-700"> </span>
          </template>
        </Column>

        <Column field="created_at" header="DATE" style="min-width: 200px">
          <template #body="slotProps">
            <span class="text-gray-500 text-sm">
              <i class="pi pi-calendar mr-1 text-xs"></i>
              
            </span>
          </template>
        </Column>

        <Column field="user_name" header="STATUS" style="min-width: 200px">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold">
               
              </div>
              <span class="text-gray-700 text-sm"> </span>
            </div>
          </template>
        </Column>

        <Column field="" header="ACTION" style="min-width: 130px">
          <template #body="slotProps">
            <div class="flex gap-2">
             
              <Button
                icon="pi pi-trash"
                class="p-button-sm p-button-rounded p-button-outlined"
                severity="danger"
                v-tooltip.top="'Supprimer'"
              
              />
            </div>
          </template>
        </Column>
      </DataTable>
         <div class="flex items-center justify-between gap-3 py-3">
          <Button
            label="Précédent"
            icon="pi pi-chevron-left"
           
          />

          <span class="text-sm text-gray-500">
            Page / 
            -  bons d'entrée
          </span>

          <Button
            label="Suivant"
            icon="pi pi-chevron-right"
            iconPos="right"
           
          />
        </div>


    </div>
  </div>

</template>


<style scoped>



</style>