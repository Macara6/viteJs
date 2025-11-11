

<script setup>
import { fetchProduits } from "@/service/Api";
import { onMounted, ref } from "vue";



const lowStockProducts = ref([]);
const expiringSoonProducts = ref([]);
const userId = localStorage.getItem("id");



onMounted(async () => {

    await loadLowStockAndExpiringProducts();
});

async function loadLowStockAndExpiringProducts(){

    try {
        const products = await fetchProduits(userId);
        lowStockProducts.value = products.filter( p => p.stock < 10)
        
        const now = new Date();
        const twoDayslater = new Date();
        twoDayslater.setDate(now.getDate()+30);

        expiringSoonProducts.value = products.filter((p) => {
          if(!p.expiration_date) return false;
            const expDate = new Date(p.expiration_date);
            return expDate >= now && expDate <= twoDayslater;
        });
       

    }catch(error){
        console.error('Erreur chargement des produits faible stocks', error);

    }
}

</script>

<template>
  <div class="p-6 space-y-8 bg-gray-50 min-h-screen">
    <!-- 🔔 Titre principal -->
    <div class="flex items-center gap-3 border-b pb-3">
      <h1 class="text-2xl font-bold text-gray-800">🔔 Notifications Produits</h1>
      <span
        v-if="lowStockProducts.length + expiringSoonProducts.length > 0"
        class="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm"
      >
        {{ lowStockProducts.length + expiringSoonProducts.length }}
      </span>
    </div>

    <!-- 🔴 Produits à faible stock -->
    <section class="bg-white shadow-sm rounded-2xl p-5 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-red-700">
            📦 Produits à faible stock
          </h2>
          <span
            class="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full"
          >
            {{ lowStockProducts.length }}
          </span>
        </div>
      </div>

      <div v-if="lowStockProducts.length === 0" class="text-gray-500 italic">
        ✅ Aucun produit à faible stock
      </div>

      <ul v-else class="divide-y divide-red-100">
        <li
          v-for="p in lowStockProducts"
          :key="p.id"
          class="flex justify-between items-center py-3 hover:bg-red-50 rounded-lg transition"
        >
          <span class="text-gray-800 font-medium">{{ p.name }}</span>
          <span class="font-semibold text-red-600">
            Stock : {{ p.stock }}
          </span>
        </li>
      </ul>
    </section>

    <!-- 🕒 Produits expirant bientôt -->
    <section class="bg-white shadow-sm rounded-2xl p-5 border border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-yellow-700">
            ⏰ Produits expirant bientôt
          </h2>
          <span
            class="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full"
          >
            {{ expiringSoonProducts.length }}
          </span>
        </div>
      </div>

      <div v-if="expiringSoonProducts.length === 0" class="text-gray-500 italic">
         Aucun produit proche de la date d’expiration
      </div>

      <ul v-else class="divide-y divide-yellow-100">
        <li
          v-for="p in expiringSoonProducts"
          :key="p.id"
          class="flex justify-between items-center py-3 hover:bg-yellow-50 rounded-lg transition"
        >
          <div>
            <span class="font-medium text-gray-800">{{ p.name }}</span>
            <span class="text-xs text-gray-500 ml-2">
              (Expire le {{ new Date(p.expiration_date).toLocaleDateString() }})
            </span>
          </div>
          <span class="font-semibold text-yellow-700">
            Stock : {{ p.stock }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
h1,
h2 {
  font-family: "Inter", sans-serif;
}
</style>