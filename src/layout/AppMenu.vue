<script setup>
import { fetchProduits } from '@/service/Api';
import { computed, onMounted, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const isSuperUser = localStorage.getItem('is_superuser') === 'true';
const lowStockCount = ref(0);
const userId = localStorage.getItem('id');

const loadLowStock = async () => {
  try {
    const products = await fetchProduits(userId);
    lowStockCount.value = products.filter(p => p.stock < 10).length;
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  loadLowStock();
  setInterval(loadLowStock, 3000);
});

// Menu calculé avec badge réactif
const model = computed(() => {
  if (isSuperUser) {
    return [
      {
        label: 'GESTION CLIENT',
        items: [
          { label: 'Utilisateurs', icon: 'pi pi-fw pi-users', to: '/pages/Utilisateur' },
          { label: 'Abonnements', icon: 'pi pi-money-bill', to: '/pages/Subscription' }
        ]
      },
      {
        label: 'ADMINISTRATION',
        items: [
          { label: 'Dépasses', icon: 'pi pi-arrow-circle-up', to: '/pages/CashOutListe' },
          { label: 'Nouveau Bon de sortie', icon: 'pi pi-tag', to: '/pages/CreateCashout' },
          { label: "Nouveau Bon D'entrée", icon: 'pi pi-check-square', to: '/pages/CreateEntryNote' },
          { label: "Entrées", icon: 'pi pi-arrow-circle-down', to: '/pages/EntryNoteList' }
        ]
      }
    ];
  } else {
    return [
      {
        label: 'ACCUEIL',
        items: [
          { label: 'Utilisateurs', icon: 'pi pi-fw pi-users', to: '/pages/Utilisateur' },
          { label: 'Gestion Stock', icon: 'pi pi-shopping-bag', to: '/pages/Produit' },
          { label: 'Factures', icon: 'pi pi-ticket', to: '/pages/Invoice' },
          { label: 'Bilan/Jour', icon: 'pi pi-fw pi-chart-line', to: '/pages/Bilan' },
          { label: 'Vente', icon: 'pi pi-shopping-cart', to: '/pages/vente' },
          { label: 'Ma boutique', icon: 'pi pi-briefcase', to: '/pages/Boutique' },
          { label: 'Dépasses', icon: 'pi pi-arrow-circle-up', to: '/pages/CashOutListe' },
          { label: 'Nouveau Bon de sortie', icon: 'pi pi-tag', to: '/pages/CreateCashout' },
          {
            label: 'Notification',
            icon: 'pi pi-fw pi-bell',
            to: '/pages/Notification',
            badge: lowStockCount,
            // 👈 mettre la valeur ici
          }
        ]
      }
    ];
  }
});
</script>

<template>
  <ul class="layout-menu">
    <app-menu-item v-for="(item, i) in model" :key="i" :item="item" :index="i" />
  </ul>
</template>
