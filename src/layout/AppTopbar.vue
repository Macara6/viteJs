

<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { usePrimeVue } from 'primevue/config';



const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

const showDropdown = ref(false);
const showProfileModal = ref(false);

const router = useRoute();


const PrimeVue = usePrimeVue();

const username = ref(localStorage.getItem('username') || '');
const isSuperUser = ref(localStorage.getItem('is_superuser') === 'true');




onMounted(()=>  {
        username.value = localStorage.getItem('username');


});


const openProfile = () => {
  showProfileModal.value = true;
};

const closeProfile = () => {
  showProfileModal.value = false;
};

</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/pages/Produit" class="layout-topbar-logo">

                <span> BilaTech Solution</span>
            </router-link>
            
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
               
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>
            
            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>
                    <button type="button" class="layout-topbar-action" @click="openProfile">
                        <i class="pi pi-user"></i>
                        <span>Bonjour, {{ username }}</span>
                    </button>

        
                    <button @click="showDropdown = !showDropdown" class="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition">
                       
                        <span class="font-semibold text-primary "> {{ isSuperUser ? 'Admin:' : 'Utilisateur:' }} {{ username }}</span>
                        <i class="pi pi-angle-down"></i>
                    </button>

                    <div v-if="showDropdown" class="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border rounded shadow z-50">
                        <button
                        class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600"
                        @click=""
                        >
                        <router-link to="/">
                        <i class="pi pi-sign-out mr-2"></i> Déconnexion
                        </router-link>
                       
                        </button>
                    </div>
                  
                </div>
            </div>
        </div>
    </div>

    <Dialog v-model:visible="showProfileModal" header="Profil utilisateur" :modal="true" class="w-96">
    <div class="p-4 space-y-2">
        <p><strong>Nom d'utilisateur:</strong> {{ username }}</p>
        <p><strong>Email:</strong> {{ email }}</p>
    </div>

 
    </Dialog>

</template>
