<script setup>
import { fetchProduits, fetchTrashedUser } from '@/service/Api';
import { computed, onMounted, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const isSuperUser = localStorage.getItem('is_superuser') === 'true';
const isUserStatus = localStorage.getItem('status');
const lowStockCount = ref(0);
const userDeletedCount = ref(0);
const userId = localStorage.getItem('id');

const loadUserIsDeleted = async () => {

    try{
       const users = await fetchTrashedUser();

       userDeletedCount.value = users.length;
    }catch(error){
      console.error('error lors du comptes des utilisateur suprimmer', error);
    }

}

const loadLowStock = async () => {
  try {
    const products = await fetchProduits(userId);
     const lowStockProducts = products.filter(p => p.stock < 10);
    
    const now = new Date();
    const twoDayslater = new Date();
    twoDayslater.setDate(now.getDate()+30);

    const expiringSoonProducts = products.filter((p) =>{
      if(!p.expiration_date) return false;
      const expDate = new Date(p.expiration_date);
      return expDate >= now && expDate <= twoDayslater;
    });
    lowStockCount.value = expiringSoonProducts.length + lowStockProducts.length;

  } catch (error) {
    console.error(error);
  }

};

onMounted(() => {
  loadLowStock();
  loadUserIsDeleted();
  setInterval(loadLowStock, 3000);
  setInterval(loadUserIsDeleted, 3000);

});

// Menu calculé avec badge réactif
const model = computed(() => {
  if (isSuperUser) {
    return [
      {
        label: 'GESTION CLIENT',
        items: [
          { label: 'Utilisateurs', icon: 'pi pi-fw pi-users', to: '/pages/Utilisateur' },
          { label: 'Abonnements', icon: 'pi pi-server', to: '/pages/Subscription' }
        ]
      },
      {
        label: 'ADMINISTRATION',
        items: [
          { label: 'Dépasses', icon: 'pi pi-arrow-circle-up', to: '/pages/CashOutListe' },
          { label: 'Nouveau Bon de sortie', icon: 'pi pi-tag', to: '/pages/CreateCashout' },
          { label: "Nouveau Bon D'entrée", icon: 'pi pi-check-square', to: '/pages/CreateEntryNote' },
          { label: "Entrées", icon: 'pi pi-arrow-circle-down', to: '/pages/EntryNoteList' },
          { label: "Paiement Collectés", icon:'pi pi-database', to:'/pages/PaymentList'},
          { label: "Corbeille", icon: 'pi pi-trash', to:'/pages/Corbeille', badge:userDeletedCount},
        ]
      }
    ];
  } else {
    if(isUserStatus ==='ADMIN'){
        return [

          {
            label: 'ACCUEIL',
            items: [
              { label: 'Dashboard', icon: 'pi pi-fw pi-chart-line', to: '/pages/Bilan' },
              { label: 'Utilisateurs', icon: 'pi pi-fw pi-users', to: '/pages/Utilisateur' },
              { label: 'Clients', icon: 'pi pi-id-card', to:'/pages/Customer'},

              { label: 'Gestion Stock', icon: 'pi pi-shopping-bag', to: '/pages/Produit' },
              { label: 'Factures', icon: 'pi pi-ticket', to: '/pages/Invoice' },
              { label: 'Vente', icon: 'pi pi-shopping-cart', to: '/pages/vente' },
              { label: 'Dépasses', icon: 'pi pi-arrow-circle-up', to: '/pages/CashOutListe' },

        
              { label: "Entrées", icon: 'pi pi-arrow-circle-down', to: '/pages/EntryNoteList' },
              {label : "Imprimante",icon: 'pi pi-print', to:'/pages/printerConfig'},
              { label: 'Ma boutique', icon: 'pi pi-briefcase', to: '/pages/Boutique' },
             
              { label: "Corbeille", icon: 'pi pi-trash', to:'/pages/Corbeille', badge:userDeletedCount},
            // { label: "dépôts", icon: 'pi pi-truck', to: '/pages/DepotProduct' },
              {
                label: 'Notification',
                icon: 'pi pi-fw pi-bell',
                to: '/pages/Notification',
                badge: lowStockCount,
                // 👈 mettre la valeur ici
              }
            ]
           },
      ];
    } else if(isUserStatus ==='CAISSIER'){
      return [

            {
              label: 'ACCUEIL',
              items: [
                { label: 'Dashboard', icon: 'pi pi-fw pi-chart-line', to: '/pages/Bilan' },
                { label: 'Factures', icon: 'pi pi-ticket', to: '/pages/Invoice' },
                { label: 'Vente', icon: 'pi pi-shopping-cart', to: '/pages/vente' },
                { label: 'Dépasses', icon: 'pi pi-arrow-circle-up', to: '/pages/CashOutListe' },
                { label: "Entrées", icon: 'pi pi-arrow-circle-down', to: '/pages/EntryNoteList' },
                {label : "Imprimante",icon: 'pi pi-print', to:'/pages/printerConfig'},
                { label: 'Ma boutique', icon: 'pi pi-briefcase', to: '/pages/Boutique' },
              // { label: "dépôts", icon: 'pi pi-truck', to: '/pages/DepotProduct' },
                {
                  label: 'Notification',
                  icon: 'pi pi-fw pi-bell',
                  to: '/pages/Notification',
                  badge: lowStockCount,
                  // 👈 mettre la valeur ici
                }
              ]
            },
        ];
    } else if (isUserStatus ==='GESTIONNAIRE_STOCK'){
            return [

            {
              label: 'ACCUEIL',
              items: [
            
              { label: 'Gestion Stock', icon: 'pi pi-shopping-bag', to: '/pages/Produit' },
              { label: 'Ma boutique', icon: 'pi pi-briefcase', to: '/pages/Boutique' },
            
              // { label: "dépôts", icon: 'pi pi-truck', to: '/pages/DepotProduct' },
                {
                  label: 'Notification',
                  icon: 'pi pi-fw pi-bell',
                  to: '/pages/Notification',
                  badge: lowStockCount,
                  // 👈 mettre la valeur ici
                }
              ]
            },
        ];
    }
    

  }
});
</script>

<template>
  <ul class="layout-menu">
    <app-menu-item v-for="(item, i) in model" :key="i" :item="item" :index="i" />
  </ul>
</template>
