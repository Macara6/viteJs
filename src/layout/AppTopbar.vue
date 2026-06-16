

<script setup>
import { useLayout } from '@/layout/composables/layout';
import { fetchNotificationForUserAPI, fetchUserById, logoutAPI } from '@/service/Api';
import Badge from 'primevue/badge';
import { usePrimeVue } from 'primevue/config';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';



const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

const showDropdown = ref(false);
const showProfileModal = ref(false);
const showNotificationModal = ref(false);
const user = ref(null)

const router = useRouter();

const userStatus = localStorage.getItem('status');
const PrimeVue = usePrimeVue();

const username = ref(localStorage.getItem('username') || '');
const isSuperUser = ref(localStorage.getItem('is_superuser') === 'true');

const notifications = ref([]);


const logout = async () => {
    // Supprimer les infos du localStorage
     await logoutAPI();
    // Rediriger vers la page login
    router.push({ name: 'login' });
};

// Récupérer username au montage
onMounted(() => {
    username.value = localStorage.getItem('username');
});


onMounted(()=>  {
    username.value = localStorage.getItem('username');
    fetchUser();
    getNotificationsUser();

});

async function fetchUser(){
    const userId = localStorage.getItem('id');
    try{
        const result = await fetchUserById(userId);
        user.value = Array.isArray(result) ? result[0] : result;
    }catch(error){
      console.error("erreur lors du chargement de l'utilisateur ", error);
    }
}

async function getNotificationsUser() {
    const userId = localStorage.getItem('id')
    const response = await fetchNotificationForUserAPI(userId);
     notifications.value = response;
      console.log('notifications utilisateur :', notifications.value);
    
}

const unreadNotificationsCount = computed(()  => {
    return notifications.value.filter(
        notification => notification.is_read == false
    ).length
})

function openShowNotification(){
    showNotificationModal.value = true;
}


const openProfile = () => {
  showProfileModal.value = true;
};

const closeProfile = () => {
  showProfileModal.value = false;
};



// ── Helpers de style ──────────────────────────────────
// ── Helpers ────────────────────────────────────────────

function toggleExpand(notification) {
    notification._expanded = !notification._expanded;

    if (!notification.is_read) {
        markAsRead(notification); // ta fonction existante de marquage lu
    }
}

function isMessageLong(message) {
    return (message || '').length > 90;
}

function notifCardClass(notification) {
    if (notification.is_read) {
        return 'bg-white border border-slate-100';
    }

    const type = (notification.notification_type || '').toUpperCase();

    if (type === 'ALERT') return 'bg-white border-2 border-red-400 ring-1 ring-red-100';
    if (type === 'NORMAL') return 'bg-white border-2 border-amber-400 ring-1 ring-amber-100';
    return 'bg-white border-2 border-[#004D4A] ring-1 ring-teal-50';
}

function notifIconClass(notification) {
    const type = (notification.notification_type || '').toUpperCase();

    if (notification.is_read) return 'bg-slate-100 text-slate-400';
    if (type === 'ALERT') return 'bg-red-50 text-red-500';
    if (type === 'NORMAL') return 'bg-amber-50 text-amber-500';
    return 'bg-teal-50 text-[#004D4A]';
}

function notifTitleClass(notification) {
    const type = (notification.notification_type || '').toUpperCase();
    if (type === 'ALERT') return 'text-red-600';
    if (type === 'NORMAL') return 'text-amber-600';
    return 'text-[#004D4A]';
}

function notifDotClass(notification) {
    const type = (notification.notification_type || '').toUpperCase();
    if (type === 'ALERT') return 'bg-red-500';
    if (type === 'NORMAL') return 'bg-amber-500';
    return 'bg-[#004D4A]';
}

function notifBadgeClass(notification) {
    const type = (notification.notification_type || '').toUpperCase();
    if (type === 'ALERT') return 'bg-red-50 text-red-500';
    if (type === 'NORMAL') return 'bg-amber-50 text-amber-600';
    return 'bg-teal-50 text-[#004D4A]';
}

function notifToggleClass(notification) {
    const type = (notification.notification_type || '').toUpperCase();
    if (type === 'ALERT') return 'text-red-500';
    if (type === 'NORMAL') return 'text-amber-600';
    return 'text-[#004D4A]';
}

function notifIcon(notification) {
    const type = (notification.notification_type || '').toUpperCase();
    if (type === 'ALERT') return 'pi pi-exclamation-triangle';
    if (type === 'NORMAL') return 'pi pi-info-circle';
    return 'pi pi-bell';
}

</script>



<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/pages/Produit" class="layout-topbar-logo">
                <img src="/demo/bilatechslogan.png" alt="BilaTech Logo" class="h-12 mx-auto" />
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="topbar-icon-btn" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
            </div>

            <button
                class="layout-topbar-menu-button topbar-icon-btn"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:flex">
                <div class="layout-topbar-menu-content">

                    <button type="button" class="topbar-pill-btn">
                        <i class="pi pi-calendar"></i>
                      
                    </button>

                    <button
                        v-if="!isSuperUser"
                        type="button"
                        class="topbar-pill-btn topbar-badge-wrapper"
                        @click="openShowNotification"
                    >
                        <i class="pi pi-inbox"></i>
                        
                        <Badge
                            v-if="unreadNotificationsCount > 0"
                            :value="unreadNotificationsCount"
                            severity="danger"
                            class="topbar-badge"
                        />
                    </button>

                    <div class="relative">
                        <button
                            @click="showDropdown = !showDropdown"
                            class="topbar-user-btn"
                        >
                            <div class="topbar-avatar">
                                {{ username?.charAt(0)?.toUpperCase() || '?' }}
                            </div>
                            <span class="font-semibold text-sm text-slate-700 dark:text-slate-200">
                                {{ isSuperUser ? 'Admin' : userStatus }} : {{ username }}
                            </span>
                            <i class="pi pi-angle-down text-xs text-slate-400"></i>
                        </button>

                        <div
                            v-if="showDropdown"
                            class="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden"
                        >
                            <button
                                class="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-gray-700 text-sm text-red-500 font-medium flex items-center gap-2 transition-colors"
                                @click="logout"
                            >
                                <i class="pi pi-sign-out"></i>
                                Déconnexion
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>

        <Dialog v-model:visible="showProfileModal" header="Profil utilisateur" :modal="true" class="w-96">
            <div class="p-4 space-y-2">
                <p><strong>Nom d'utilisateur:</strong> {{ user?.username || 'N/A' }}</p>
                <p><strong>STATUS:</strong> {{ user?.status }}. {{ unreadNotificationsCount }}</p>
            </div>
        </Dialog>

        <Drawer
        v-model:visible="showNotificationModal"
        position="right"
        class="w-full md:w-30rem notif-drawer"
        :pt="{
            header: { class: 'bg-white border-b border-slate-100 px-6 py-8' },
            content: { class: 'p-0' }
        }"
>
    <template #header>
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004D4A] to-[#007A75] flex items-center justify-center shadow-sm">
                <i class="pi pi-bell text-white text-sm"></i>
            </div>
            <div>
                <p class="font-bold text-base text-slate-800 leading-tight tracking-tight">
                    Notifications
                </p>
                <p class="text-xs text-slate-400 leading-tight mt-0.5">
                    <span v-if="notifications.filter(n => !n.is_read).length > 0" class="font-semibold text-[#004D4A]">
                        {{ notifications.filter(n => !n.is_read).length }} non lue{{ notifications.filter(n => !n.is_read).length > 1 ? 's' : '' }}
                    </span>
                    <span v-else>Tout est à jour</span>
                </p>
            </div>
        </div>
    </template>

    <div class="flex flex-col h-full bg-slate-50">

        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">

            <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notif-card"
                :class="notifCardClass(notification)"
                @click="toggleExpand(notification)"
            >
                <div class="flex items-start gap-3">

                    <!-- Icône -->
                    <div class="notif-icon" :class="notifIconClass(notification)">
                        <i :class="notifIcon(notification)"></i>
                    </div>

                    <div class="flex-1 min-w-0">

                        <!-- Titre + indicateur non lu -->
                        <div class="flex items-start justify-between gap-2">
                            <h4
                                class="font-semibold text-sm leading-tight"
                                :class="notification.is_read ? 'text-slate-700' : notifTitleClass(notification)"
                            >
                                {{ notification.title }}
                            </h4>

                            <span
                                v-if="!notification.is_read"
                                class="notif-dot"
                                :class="notifDotClass(notification)"
                            />
                        </div>

                        <!-- Badge type -->
                        <span
                            class="notif-type-badge mt-1.5"
                            :class="notifBadgeClass(notification)"
                        >
                            {{ notification.notification_type }}
                        </span>

                        <!-- Message tronqué / complet -->
                        <p
                            class="text-sm text-slate-500 mt-2 leading-relaxed transition-all"
                            :class="notification._expanded ? '' : 'line-clamp-2'"
                        >
                            {{ notification.message }}
                        </p>

                        <!-- Voir plus / Réduire -->
                        <button
                            v-if="isMessageLong(notification.message)"
                            class="notif-toggle"
                            :class="notifToggleClass(notification)"
                            @click.stop="toggleExpand(notification)"
                        >
                            {{ notification._expanded ? 'Réduire' : 'Voir plus' }}
                            <i :class="notification._expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-[10px]"></i>
                        </button>

                        <div class="flex items-center gap-1.5 mt-2">
                            <i class="pi pi-clock text-[10px] text-slate-400"></i>
                            <small class="text-xs text-slate-400">
                                {{ new Date(notification.created_at).toLocaleString('fr-FR') }}
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- État vide -->
            <div
                v-if="!notifications.length"
                class="flex flex-col items-center justify-center text-center py-20"
            >
                <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 shadow-sm">
                    <i class="pi pi-bell-slash text-slate-300 text-3xl"></i>
                </div>
                <p class="text-sm font-semibold text-slate-600">
                    Aucune notification
                </p>
                <p class="text-xs text-slate-400 mt-1">
                    Vous serez notifié ici des nouveaux événements
                </p>
            </div>

        </div>

    </div>
</Drawer>
    </div>


</template>

<style scoped>

/* ── Boutons icônes simples (dark mode, menu kebab) ── */
.topbar-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--text-color-secondary);
    transition: background-color 0.15s ease, color 0.15s ease;
}

.topbar-icon-btn:hover {
    background-color: var(--surface-100);
    color: var(--primary-color);
}

/* ── Boutons "pilule" (Calendar, Messages, Profil) ── */
.topbar-pill-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 1.1rem;
    border-radius: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    transition: background-color 0.15s ease, color 0.15s ease;
}

.topbar-pill-btn:hover {
    background-color: var(--surface-100);
    color: var(--primary-color);
}

.topbar-pill-btn i {
    font-size: 0.95rem;
}

/* ── Badge sur le bouton Messages ── */
.topbar-badge-wrapper {
    overflow: visible;
}


.topbar-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 1.4rem;
    height: 1.4rem;
    line-height: 1.4rem;
    font-size: 0.75rem;
    border: 2px solid var(--surface-card);
    z-index: 2;
}

/* ── Bouton utilisateur + avatar ── */
.topbar-user-btn {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0.8rem 0.35rem 0.35rem;
    border-radius: 14px;
    transition: background-color 0.15s ease;
}

.topbar-user-btn:hover {
    background-color: var(--surface-100);
}

.topbar-avatar {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: linear-gradient(135deg, #004D4A, #007A75);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
}

/* ── notification ── */


.notif-card {
    padding: 1rem;
    border-radius: 18px;
    border-width: 1.5px;
    border-style: solid;
    cursor: pointer;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.notif-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
}

.notif-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}

.notif-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 5px;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}

.notif-type-badge {
    display: inline-flex;
    align-items: center;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.15rem 0.55rem;
    border-radius: 20px;
}

.notif-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 0.4rem;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s ease;
}

.notif-toggle:hover {
    opacity: 0.7;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}


</style>