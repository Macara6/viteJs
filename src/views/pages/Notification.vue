

<script setup>
import { fetchProduits } from "@/service/Api";
import { onMounted, ref } from "vue";



const productFaibleStock = ref([]);
const userId = localStorage.getItem('id');


onMounted(async () => {

    await fetchProductFaibleStock();
});

async function fetchProductFaibleStock(){
    try {
        const products = await fetchProduits(userId);
        productFaibleStock.value = products.filter( p => p.stock < 10)
    }catch(error){
        console.error('Erreur chargement des produits faible stocks', error);

    }
}

</script>

<template>
  <div class="p-4">
    <!-- Titre avec badge -->
    <div class="flex items-center gap-2 mb-4">
      <h1 class="text-xl font-bold">🔔 Produits à faible stock</h1>
      <span
        class="bg-red-600 text-white text-sm font-semibold px-2 py-1 rounded-full"
      >
        {{ productFaibleStock.length }}
      </span>
    </div>

    <!-- Si aucun produit -->
    <div v-if="productFaibleStock.length === 0" class="text-gray-500">
      ✅ Aucun produit en faible stock
    </div>

    <!-- Liste des produits -->
    <ul v-else class="space-y-2">
      <li
        v-for="p in productFaibleStock"
        :key="p.id"
        class="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center"
      >
        <span>{{ p.name }}</span>
        <span class="font-semibold text-red-600">Stock: {{ p.stock }}</span>
      </li>
    </ul>
  </div>
</template>