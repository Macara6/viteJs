<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';
 
const isSuperUser = localStorage.getItem('is_superuser') === 'true';
const model = ref([]);
// fisible pour le client et tous le monde
 if(isSuperUser){
    // Menu administrateur 
    model.value =[
    {
        label: 'GESTION CLIENT',
        items: [
            //{ 
        // label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashbord' 
            // },
            {
                label:'Utilisateurs',
                icon:'pi pi-fw pi-users',
                to:'/pages/Utilisateur'
            },

            {
            label:'Abonnements',
            icon :'pi pi-money-bill',
            to:'/pages/Subscription'
           },
         ], 
            
     },
     {
        label :'ADMINISTRATION',
        items:[
            {
                label:'Lieste des depasses',
                icon:'pi pi-database',
                to:'/pages/CashOutListe'
            },
            {
                label:'Nouveau Bon',
                icon: 'pi pi-tag',
                to:'/pages/CreateCashout'
            }
        ]
        
        
     }
    ];


 } else {
    model.value = [
        {
        label: 'ACCUEIL',
        items: [

        {
        label: 'Gestion Stock',
        icon: 'pi pi-shopping-bag',
         to: '/pages/Produit'
        },
        {
            label:'Factures',
            icon:'pi pi-shopping-cart',
            to:'/pages/Invoice'

        },

        {
            label:'Bilan/Jour',
            icon:'pi pi-fw pi-chart-line',
            to:'/pages/Bilan'
        },

        {
            label:'Statistique',
            icon:'pi pi-fw pi-chart-pie',
            to:'/pages/Statistique'
        },
        {
            label:'Notification',
            icon:'pi pi-fw pi-bell',
            to:'/pages/Notification'
        },





          ]
        }
    ];
  
 }


   // fisible pour la gestion administartif (admin) 
 



 /**
 
    {
        label: 'Pages',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
         
            {
                label: 'Landing',
                icon: 'pi pi-fw pi-globe',
                to: '/landing'
            },
              
            {
                label: 'Auth',
                icon: 'pi pi-fw pi-user',
                items: [
                    {
                        label: 'Login',
                        icon: 'pi pi-fw pi-sign-in',
                        to: '/auth/login'
                    },
                    {
                        label: 'Error',
                        icon: 'pi pi-fw pi-times-circle',
                        to: '/auth/error'
                    },
                    {
                        label: 'Access Denied',
                        icon: 'pi pi-fw pi-lock',
                        to: '/auth/access'
                    }
                   
                ]
            },
 
            {
                label: 'Not Found',
                icon: 'pi pi-fw pi-exclamation-circle',
                to: '/pages/notfound'
            },
            {
                label: 'Empty',
                icon: 'pi pi-fw pi-circle-off',
                to: '/pages/empty'
            },
            {
                label: 'Employees',
                icon: 'pi pi-fw pi-circle-off',
                to: '/pages/Employee'
            },

        ]
    },
     */




</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
