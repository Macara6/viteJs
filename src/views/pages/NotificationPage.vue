

<script setup>
import { fetchNoticationsAPI, fetchUsersForNotification, sendNotification } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

 const toast = useToast();
const notifications = ref([]);
const loading = ref(false);
const loadingSend = ref(false)
const selectedNotification = ref(null);
const isMobileDetailOpen = ref(false);
const visibleCreateDialog = ref(false);
const users = ref([]);
const search = ref('');


const screenWidth = ref(window.innerWidth);

function handleResize() {
    screenWidth.value = window.innerWidth;
}

onMounted(() => {

    window.addEventListener('resize', handleResize);
    getUsers();
    getNotifications();
    
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
});


const filteredUsers = computed(() => {
    return users.value.filter((user) =>
        user.username.toLowerCase().includes(search.value.toLowerCase()) ||
        user.email.toLowerCase().includes(search.value.toLowerCase()) ||
        user.role?.toLowerCase().includes(search.value.toLowerCase())
    )
})


 async function getNotifications(){

    try{
        loading.value = true;
        const userId = localStorage.getItem('id');
        const response = await fetchNoticationsAPI(userId);
        notifications.value = response;
       
        
    }catch(error){
        console.error(error);
    }finally{
        loading.value = false;
    }
 }

 async function getUsers() {
    const response = await fetchUsersForNotification();
    users.value = response;
    
 }

 const getRoleSeverity = (role) => {

    switch(role) {

        case 'ADMIN':
            return 'danger';

        case 'GESTIONNAIRE_STOCK':
            return 'warning';

        case 'CAISSIER':
            return 'info';

        default:
            return 'secondary';
    }

}
 

 function selectNotification(notification) {
    selectedNotification.value = notification;
    if (screenWidth.value < 1024) {
        isMobileDetailOpen.value = true;
    }
}

const unreadCount = computed(() => {
    return notifications.value.filter(item => !item.is_read).length;
});

function formatDate(date) {

    return new Date(date).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

const openCreateNotification = () =>{
    visibleCreateDialog.value = true;
}

const notificationForm = ref({
    title: '',
    message: '',
    notification_type: 'normal',
    target_type: 'all',
    users: [],
    send_mode:'notification'
})

function initForm (){
    notificationForm.value.title ='';
    notificationForm.value.message='';
    notificationForm.value.notification_type='normal';
    notificationForm.value.target_type ='all';
    notificationForm.value.users = [];
    notificationForm.value.send_mode ='notification'

}

const targetOptions = [
    {
        label: 'Une personne',
        value: 'single'
    },
    {
        label: 'Groupe',
        value: 'group'
    },
    {
        label: 'Tout le monde',
        value: 'all'
    }
];


const notificationTypes = [
    {
        label: 'Notification normale',
        value: 'normal'
    },
    {
        label: 'Alerte',
        value: 'alert'
    }
];

watch(
    () => notificationForm.value.target_type,
    (newValue) => {
        if(newValue ==='single'){
            notificationForm.value.users =
            notificationForm.value.users.length
            ?[notificationForm.value.users[0]]
            :[];
        }

        else if (newValue ==='all'){
            notificationForm.value.users = users.value.map(
                (user) => user.id
            )
        }
        else if (newValue ==='group'){
             notificationForm.value.users = []
        }
    }
)

async function createNotification(){
    try{
        loadingSend.value = true;
        const data = {
            title:notificationForm.value.title,
            message:notificationForm.value.message,
            notification_type:notificationForm.value.notification_type,
            target_type:notificationForm.value.target_type,
            users:
            notificationForm.value.target_type ==='single'
            ?[notificationForm.value.users]
            :notificationForm.value.users,
            send_mode:notificationForm.value.send_mode
        }
        if(data.users.length ==0){
            toast.add({
            severity:'error',
            summary:'Erreur',
            detail:'Veuillez sélectionner un utilisateur',
            life:3000
            });
            return;
        }
        
        console.log('data notification :',data);
        
        const response= await sendNotification(data);
        if (response.success == true){
            toast.add({ severity:'success', summary:'Succès', detail:`${response.message}`, life:3000 });
        }else{

        toast.add({
            severity:'error',
            summary:'Erreur',
            detail:`${response.message}`,
            life:3000
        });

        }
    
    initForm();
    getNotifications();

    visibleCreateDialog.value = false;
    }catch(erro){

    }finally{
        loadingSend.value = false;
    }

}

function getSeverity(notification) {

    if (notification.is_send) {
        return 'success';
    }
    return 'danger';
}
// responsive mobile

</script>

<template>

 <div
    class="min-h-screen bg-slate-100 p-2 sm:p-4 overflow-hidden"
>

        <div
           class="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full"
        >

            <!-- LEFT -->
            <div
                class="
                    col-span-12
                    lg:col-span-4
                    xl:col-span-3
                    h-[350px]
                    sm:h-[450px]
                    lg:h-[calc(100vh-32px)]
                "
            >

                <Card
                    class="
                        h-full
                        shadow-xl
                        border-0
                        rounded-3xl
                        overflow-hidden
                    "
                    :pt="{
                        body: {
                            class: 'h-full'
                        },
                        content: {
                            class: 'h-full p-0'
                        }
                    }"
                >

                    <template #content>

                        <div class="flex flex-col h-full p-5">

                            <!-- HEADER -->
                            <div
                                class="flex items-center justify-between mb-5"
                            >

                                <div>

                                    <h2
                                        class="text-2xl font-bold text-slate-800"
                                    >
                                        Notifications
                                    </h2>

                                    <p
                                        class="text-slate-500 mt-1"
                                    >
                                        Gestion des notifications
                                    </p>

                                </div>

                                <div
                                    class="flex items-center gap-3"
                                >

                                    <Avatar
                                        icon="pi pi-pencil"
                                        shape="circle"
                                        size="large"
                                        class="bg-blue-100 text-green-600 cursor-pointer"
                                        @click="openCreateNotification"
                                    />

                                    <Avatar
                                        icon="pi pi-bell"
                                        shape="circle"
                                        size="large"
                                        class="bg-blue-100 text-blue-600"
                                    />

                                </div>

                            </div>

                            <Divider />

                            <!-- LOADING -->
                            <div
                                v-if="loading"
                                class="space-y-4 mt-5"
                            >

                                <div
                                    v-for="i in 6"
                                    :key="i"
                                    class="flex gap-3"
                                >

                                    <Skeleton
                                        shape="circle"
                                        size="3rem"
                                    />

                                    <div class="flex-1">

                                        <Skeleton
                                            width="70%"
                                            class="mb-2"
                                        />

                                        <Skeleton
                                            width="100%"
                                            class="mb-2"
                                        />

                                        <Skeleton
                                            width="40%"
                                        />

                                    </div>

                                </div>

                            </div>

                            <!-- LIST -->
                            <div
                                v-else
                                class="
                                    flex-1
                                    overflow-y-auto
                                    pr-2
                                    min-h-0
                                    mt-4
                                "
                            >

                                <div
                                    class="space-y-3"
                                >

                                    <div
                                        v-for="notification in notifications"
                                        :key="notification.id"
                                        @click="selectNotification(notification)"
                                        class="group cursor-pointer transition-all duration-300"
                                    >

                                        <div
                                            class="rounded-2xl border p-4 transition-all duration-300"
                                            :class="[
                                                selectedNotification &&
                                                selectedNotification.id === notification.id
                                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                            ]"
                                        >

                                            <div
                                                class="flex gap-4"
                                            >

                                                <div
                                                    class="relative"
                                                >

                                                    <Avatar
                                                        icon="pi pi-envelope"
                                                        size="large"
                                                        shape="circle"
                                                        class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                                    />

                                                    <span
                                                        v-if="!notification.is_send"
                                                        class="
                                                            absolute
                                                            -top-1
                                                            -right-1
                                                            w-3
                                                            h-3
                                                            rounded-full
                                                            bg-red-500
                                                            border-2
                                                            border-white
                                                        "
                                                    ></span>

                                                </div>

                                                <div
                                                    class="flex-1 min-w-0"
                                                >

                                                    <div
                                                        class="flex items-start justify-between gap-2"
                                                    >

                                                        <h3
                                                            class="font-semibold text-slate-800 truncate"
                                                        >
                                                            {{ notification.title }}
                                                        </h3>

                                                        <Tag
                                                            :severity="getSeverity(notification)"
                                                            :value="notification.is_send ? 'Envoyée' : 'En attente'"
                                                            rounded
                                                        />

                                                    </div>

                                                    <p
                                                        class="text-sm text-slate-500 mt-2 line-clamp-2"
                                                    >
                                                        {{ notification.message }}
                                                    </p>

                                                    <div
                                                        class="flex items-center justify-between mt-4"
                                                    >

                                                        <span
                                                            class="text-xs text-slate-400"
                                                        >
                                                            {{ formatDate(notification.created_at) }}
                                                        </span>

                                                        <i
                                                            class="
                                                                pi
                                                                pi-angle-right
                                                                text-slate-400
                                                                group-hover:text-blue-500
                                                            "
                                                        ></i>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </template>

                </Card>

            </div>

            <!-- RIGHT -->
            <div
                v-if="selectedNotification || screenWidth >= 1024"
                class="
                    col-span-12
                    lg:col-span-8
                    xl:col-span-9
                    h-auto
                    lg:h-[calc(100vh-32px)]
                "
            >

                <Card
                    class="h-full shadow-xl border-0 rounded-3xl"
                >

                    <template #content>

                        <div
                            v-if="selectedNotification"
                            class="h-full flex flex-col"
                        >

                            <!-- HEADER -->
                            <div
                                class="
                                    flex
                                    flex-col
                                    sm:flex-row
                                    sm:items-start
                                    justify-between
                                    gap-4
                                "
                            >

                                <div
                                    class="
                                            flex
                                            flex-col
                                            sm:flex-row
                                            items-start
                                            sm:items-center
                                            gap-4
                                        "
                                >

                                    <Avatar
                                        icon="pi pi-bell"
                                        size="xlarge"
                                        shape="circle"
                                        class="bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                                    />

                                    <div>

                                        <h1
                                            class="
                                                text-2xl
                                                sm:text-3xl
                                                font-bold
                                                text-slate-800
                                                break-words
                                            "
                                        >
                                            {{ selectedNotification.title }}
                                        </h1>

                                        <p
                                            class="text-slate-500 mt-2"
                                        >
                                            {{ formatDate(selectedNotification.created_at) }}
                                        </p>

                                    </div>

                                </div>

                                <Tag
                                    :severity="getSeverity(selectedNotification)"
                                    :value="selectedNotification.is_read ? 'Notification lue' : 'Nouvelle notification'"
                                    class="text-sm"
                                    rounded
                                />

                            </div>

                            <Divider />

                            <!-- INFO -->
                            <div
                                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6"
                            >

                                <!-- TYPE -->
                                <div
                                    class="bg-slate-50 rounded-2xl p-5 border border-slate-200"
                                >

                                    <p class="text-sm text-slate-500 mb-2">
                                        Type de notification
                                    </p>

                                    <h3
                                        class="text-lg font-semibold text-slate-800 capitalize"
                                    >
                                        {{ selectedNotification.notification_type }}
                                    </h3>

                                </div>

                                <!-- TARGET -->
                                <div
                                    class="bg-slate-50 rounded-2xl p-5 border border-slate-200"
                                >

                                    <p class="text-sm text-slate-500 mb-2">
                                        Type de cible
                                    </p>

                                    <h3
                                        class="text-lg font-semibold text-slate-800 capitalize"
                                    >
                                        {{ selectedNotification.target_type }}
                                    </h3>

                                </div>

                                <!-- VIEWS -->
                                <div
                                    class="bg-slate-50 rounded-2xl p-5 border border-slate-200"
                                >

                                    <p class="text-sm text-slate-500 mb-2">
                                        Nombre de vues
                                    </p>

                                    <div class="flex items-center gap-3">

                                        <i
                                            class="pi pi-eye text-2xl text-indigo-500"
                                        />

                                        <h3
                                            class="text-2xl font-bold text-slate-800"
                                        >
                                            {{ selectedNotification.views_count || 0 }}
                                        </h3>

                                    </div>

                                </div>

                            </div>

                            <!-- MESSAGE -->
                            <div
                                class="mt-8 flex-1"
                            >

                                <h2
                                    class="text-xl font-semibold text-slate-800 mb-4"
                                >
                                    Message
                                </h2>

                                <div
                                   class="
                                        bg-slate-50
                                        border
                                        border-slate-200
                                        rounded-3xl
                                        p-4
                                        sm:p-6
                                        lg:p-8
                                        leading-7
                                        sm:leading-8
                                        text-sm
                                        sm:text-base
                                        lg:text-lg
                                        text-slate-700
                                        whitespace-pre-line
                                        break-words
                                    "
                                >
                                    {{ selectedNotification.message }}
                                </div>

                            </div>

                        </div>

                        <!-- EMPTY -->
                        <div
                            v-else
                            class="h-full flex flex-col items-center justify-center"
                        >

                            <Avatar
                                icon="pi pi-bell"
                                size="xlarge"
                                shape="circle"
                                class="bg-slate-100 text-slate-400 mb-5"
                            />

                            <h2
                                class="text-2xl font-bold text-slate-600"
                            >
                                Aucune notification
                            </h2>

                            <p
                                class="text-slate-400 mt-2"
                            >
                                Sélectionnez une notification à gauche
                            </p>

                        </div>

                    </template>

                </Card>

            </div>

        </div>

            <Dialog
                v-model:visible="visibleCreateDialog"
                modal
                header="Nouvelle notification"
                :style="{ width: '75rem', maxWidth: '95vw' }"
                :breakpoints="{
                    '1400px': '85vw',
                    '1024px': '92vw',
                    '768px': '96vw',
                    '640px': '100vw'
                }"
                contentClass="max-h-[90vh] overflow-y-auto"
            >

            <div
                class="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >

                <!-- LEFT USERS -->
                <div
                    class="border border-slate-200 rounded-2xl p-5 bg-slate-50"
                >

                        <div
                            class="flex items-center justify-between mb-4"
                        >

                            <div>

                                <h2
                                    class="text-xl font-bold text-slate-800"
                                >
                                    Destinataires
                                </h2>

                                <p
                                    class="text-slate-500 text-sm mt-1"
                                >
                                    Sélectionnez les utilisateurs
                                </p>

                            </div>

                            <div class="flex items-center gap-3">

                                <!-- Champ recherche -->
                                <span class="p-input-icon-left">
                                    
                                    <InputText
                                        v-model="search"
                                        placeholder="Rechercher..."
                                        class="w-56"
                                    />
                                </span>

                                <!-- Icône utilisateurs -->
                                <i
                                    class="pi pi-users text-2xl text-indigo-500"
                                />

                            </div>

                        </div>

                    <!-- TARGET TYPE -->
                    <div class="mb-5">

                        <label
                            class="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Type de cible
                        </label>

                        <SelectButton
                            v-model="notificationForm.target_type"
                            :options="targetOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-full"
                        />

                    </div>

                    <!-- USER LIST -->
                    <div
                        class="
                            max-h-[450px]
                            md:max-h-[500px]
                            overflow-y-auto
                            flex
                            flex-col
                            gap-3
                        "
                    >

                        <div
                            v-for="user in filteredUsers"
                            :key="user.id"
                            class="
                                flex
                                items-center
                                justify-between
                                p-3
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                            "
                        >

                            <div
                                class="flex items-center gap-3"
                            >

                                <Avatar
                                    icon="pi pi-user"
                                    shape="circle"
                                />

                                <div>

                                    <div class="flex items-center gap-2">

                                        <h3
                                            class="font-semibold text-slate-800"
                                        >
                                            {{ user.username }}
                                        </h3>

                                        <Tag
                                            :value="user.status"
                                            :severity="getRoleSeverity(user.status)"
                                            rounded
                                        />

                                    </div>

                                    <p
                                        class="text-sm text-slate-500"
                                    >
                                        {{ user.email }}
                                    </p>

                                </div>

                            </div>

                            <Checkbox
                                v-if="notificationForm.target_type !== 'single'"
                                v-model="notificationForm.users"
                                :inputId="'user-' + user.id"
                                :value="user.id"
                                :disabled="notificationForm.target_type === 'all'"
                            />

                            <RadioButton
                                v-else
                                v-model="notificationForm.users"
                                :inputId="'user-' + user.id"
                                name="singleUser"
                                :value="user.id"
                            />

                        </div>

                    </div>

                </div>

                <!-- RIGHT FORM -->
                <div
                    class="border border-slate-200 rounded-2xl p-5"
                >

                    <div
                        class="flex items-center justify-between mb-6"
                    >

                        <div>

                            <h2
                                class="text-xl font-bold text-slate-800"
                            >
                                Contenu du message
                            </h2>

                            <p
                                class="text-slate-500 text-sm mt-1"
                            >
                                Configurez la notification
                            </p>

                        </div>

                        <i
                            class="pi pi-send text-2xl text-blue-500"
                        />

                    </div>

                    <div class="flex flex-col gap-5">

                        <!-- TITLE -->
                        <div>

                            <label
                                class="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Titre
                            </label>

                            <InputText
                                v-model="notificationForm.title"
                                placeholder="Titre de la notification"
                                class="w-full"
                            />

                        </div>

                        <!-- TYPE -->
                        <div>

                            <label
                                class="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Type de notification
                            </label>

                            <Dropdown
                                v-model="notificationForm.notification_type"
                                :options="notificationTypes"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Sélectionner un type"
                                class="w-full"
                            />

                        </div>

                        <!-- MESSAGE -->
                        <div>

                            <label
                                class="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Message
                            </label>

                            <Textarea
                                v-model="notificationForm.message"
                                rows="10"
                                class="w-full"
                                placeholder="Votre message..."
                            />

                        </div>
                        <!-- MODE D'ENVOI -->
                        <div>

                            <label
                                class="block text-sm font-medium text-slate-700 mb-2"
                            >
                                Mode d’envoi
                            </label>

                            <div class="flex flex-col gap-3">

 

                                <div class="flex items-center gap-2">
                                    <RadioButton
                                        v-model="notificationForm.send_mode"
                                        inputId="notification"
                                        name="send_mode"
                                        value="notification"
                                    />
                                    <label for="notification">
                                        Notification uniquement
                                    </label>
                                </div>

                                <div class="flex items-center gap-2">
                                    <RadioButton
                                        v-model="notificationForm.send_mode"
                                        inputId="both"
                                        name="send_mode"
                                        value="both"
                                    />
                                    <label for="both">
                                        Email + Notification
                                    </label>
                                </div>

                            </div>

                        </div>

                        <!-- ACTIONS -->
                        <div
                            class="flex justify-end gap-3 pt-4"
                        >

                            <Button
                                label="Annuler"
                                severity="secondary"
                                outlined
                                @click="visibleCreateDialog = false"
                            />

                            <Button
                                :disabled="loadingSend"
                                 class="px-4 py-3"
                                severity="primary"
                                @click="createNotification"
                            >
                            <span class="flex items-center gap-2">

                                <i
                                :class="loadingSend
                                    ? 'pi pi-spin pi-spinner'
                                    : 'pi pi-send'"
                                ></i>

                                {{ loadingSend
                                ? 'En cours ...'
                                : 'Envoyer'
                                }}

                            </span>

                            </Button>

                        </div>

                    </div>

                </div>

            </div>

        </Dialog>

    </div>

</template>