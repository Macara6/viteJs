<script setup>
import { ref } from 'vue';
function smoothScroll(id) {
    document.body.click();
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
}
const downloading = ref(false);
function downloadApp() {
    const fileUrl = '/demo/apk/bila-sol.apk'; // renommer Url en fileUrl
    const link = document.createElement('a');
    link.href = fileUrl;        // ok maintenant
    link.download = 'bila-sol.apk';
    downloading.value = true;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
        downloading.value = false;
    }, 1000);
}



</script>

<template>
    <div class="bg-surface-0 dark:bg-surface-900">
        <div id="home" class="landing-wrapper overflow-hidden">
            <div class="py-4 px-6 lg:px-20 flex items-center justify-between relative lg:static bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md rounded-b-xl z-50">
                <!-- Logo -->
                <a class="flex items-center" href="#">
                <img src="/demo/bilatechslogan.png" alt="BilaTech Logo" class="h-44 md:h-56 lg:h-64 mx-auto" />
                </a>

                <!-- Mobile Menu Button -->
                <Button
                    class="lg:!hidden text-[#004D4A]"
                    text
                    severity="secondary"
                    rounded
                    v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                >
                    <i class="pi pi-bars !text-3xl"></i>
                </Button>

                <!-- Desktop Menu -->
                <div class="items-center grow justify-between hidden lg:flex absolute lg:static w-full left-0 top-full px-12 lg:px-0 z-20 rounded-b-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg">
                    <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-10">
                        <li>
                            <a @click="smoothScroll('#hero')" class="px-0 py-4 text-[#004D4A] dark:text-[#7BB661] font-semibold text-lg hover:text-[#F9A825] transition-colors duration-300 relative">
                                Home
                                <span class="absolute left-0 -bottom-1 w-0 h-1 bg-[#F9A825] transition-all duration-300"></span>
                            </a>
                        </li>
                        <li>
                            <a @click="smoothScroll('#features')" class="px-0 py-4 text-[#004D4A] dark:text-[#7BB661] font-semibold text-lg hover:text-[#F9A825] transition-colors duration-300 relative">
                                Services
                                <span class="absolute left-0 -bottom-1 w-0 h-1 bg-[#F9A825] transition-all duration-300"></span>
                            </a>
                        </li>
                        <li>
                            <a @click="smoothScroll('#highlights')" class="px-0 py-4 text-[#004D4A] dark:text-[#7BB661] font-semibold text-lg hover:text-[#F9A825] transition-colors duration-300 relative">
                                POS
                                <span class="absolute left-0 -bottom-1 w-0 h-1 bg-[#F9A825] transition-all duration-300"></span>
                            </a>
                        </li>
                        <li>
                            <a @click="smoothScroll('#pricing')" class="px-0 py-4 text-[#004D4A] dark:text-[#7BB661] font-semibold text-lg hover:text-[#F9A825] transition-colors duration-300 relative">
                                Fonctionnalités
                                <span class="absolute left-0 -bottom-1 w-0 h-1 bg-[#F9A825] transition-all duration-300"></span>
                            </a>
                        </li>
                    </ul>

                    <!-- Bouton se connecter -->
                    <div class="flex border-t lg:border-t-0 border-surface py-4 lg:py-0 mt-4 lg:mt-0 gap-2">
                        <Button 
                            label="Se connecter" 
                            text 
                            as="router-link" 
                            to="/login" 
                            rounded 
                            class="!px-8 !py-3 text-lg bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] text-white shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </div>
            </div>

            <div
                id="hero"
                class="flex flex-col lg:flex-row items-center pt-10 px-6 lg:px-20 overflow-hidden relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-b-3xl"
            >
                <!-- Texte -->
                <div class="flex-1 mx-6 md:mx-20 mt-0 md:mt-6">
                    <h1 class="text-5xl md:text-6xl font-extrabold leading-tight animate-fade-in">
                        <span class="font-light block text-gray-900 dark:text-white">Bienvenue sur</span>
                        <span class="block bg-clip-text text-transparent bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825]">
                            Bilatech Solution
                        </span>
                    </h1>
                    <p class="font-normal text-xl md:text-2xl leading-relaxed text-gray-700 dark:text-gray-300 mt-4 animate-fade-in delay-200">
                        Une plateforme <span class="text-[#F9A825] font-semibold">technologique innovante</span> pour la <span class="text-[#7BB661] font-semibold">gestion d’entreprise</span>, la <span class="text-[#004D4A] font-semibold">facturation</span> et le <span class="text-[#F9A825] font-semibold">suivi des performances</span>.  
                        Simple, rapide et accessible.
                    </p>
                    <Button 
                        label="Se connecter" 
                        as="router-link" 
                        to="/login" 
                        rounded 
                        class="!text-xl mt-8 !px-6 !py-3 bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] text-white shadow-xl transition duration-500 transform hover:scale-105 hover:shadow-2xl"
                    />
                </div>

                <!-- Image + Halo -->
                <div class="flex justify-center md:justify-end mt-8 lg:mt-0 flex-1 relative">
                    <!-- Halo professionnel -->
                    <div class="absolute -top-16 -right-16 w-72 h-72 bg-gradient-to-tr from-[#7BB661] via-[#004D4A] to-[#F9A825] rounded-full opacity-25 blur-3xl animate-pulse-slow"></div>
                    <div class="absolute -bottom-10 -left-10 w-48 h-48 bg-[#F9A825] opacity-20 rounded-full blur-2xl"></div>

                    <img 
                        src="/demo/images/landing/hero-stock.webp" 
                        alt="Hero Image" 
                        class="h-72 md:h-96 lg:h-[28rem] w-auto rounded-2xl shadow-2xl animate-fade-in delay-400"
                    />
                </div>
            </div>

<!-- Animation simple via Tailwind CSS -->



            <div id="features" class="py-12 px-6 lg:px-20 mt-8">
            <div class="text-center mb-12">
                <h2 class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                Nos Services
                </h2>
                <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
                Des solutions adaptées pour chaque besoin
                </p>
            </div>

            <div class="grid grid-cols-12 gap-8 justify-center">

                <!-- Service Card Template -->
                <div class="col-span-12 md:col-span-6 lg:col-span-4">
                <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 p-6 flex flex-col h-full">
                    <div class="w-16 h-16 flex items-center justify-center rounded-xl mb-4 bg-[#7BB661] text-white text-2xl mx-auto">
                    <i class="pi pi-fw pi-book"></i>
                    </div>
                    <h5 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Formation</h5>
                    <p class="text-gray-600 dark:text-gray-200 text-center flex-1">
                    Des sessions de formation adaptées à vos besoins techniques et métiers.
                    </p>
                </div>
                </div>

                <div class="col-span-12 md:col-span-6 lg:col-span-4">
                <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 p-6 flex flex-col h-full">
                    <div class="w-16 h-16 flex items-center justify-center rounded-xl mb-4 bg-[#004D4A] text-white text-2xl mx-auto">
                    <i class="pi pi-fw pi-code"></i>
                    </div>
                    <h5 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Développement</h5>
                    <p class="text-gray-600 dark:text-gray-200 text-center flex-1">
                    Applications web, mobiles et desktop robustes, performantes et évolutives.
                    </p>
                </div>
                </div>

                <div class="col-span-12 md:col-span-6 lg:col-span-4">
                <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 p-6 flex flex-col h-full">
                    <div class="w-16 h-16 flex items-center justify-center rounded-xl mb-4 bg-[#F9A825] text-white text-2xl mx-auto">
                    <i class="pi pi-fw pi-wrench"></i>
                    </div>
                    <h5 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Suivi & Maintenance</h5>
                    <p class="text-gray-600 dark:text-gray-200 text-center flex-1">
                    Support technique, maintenance corrective et évolutive de vos projets.
                    </p>
                </div>
                </div>

                <div class="col-span-12 md:col-span-6 lg:col-span-4">
                <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 p-6 flex flex-col h-full">
                    <div class="w-16 h-16 flex items-center justify-center rounded-xl mb-4 bg-[#7BB661] text-white text-2xl mx-auto">
                    <i class="pi pi-fw pi-shopping-cart"></i>
                    </div>
                    <h5 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">E-commerce</h5>
                    <p class="text-gray-600 dark:text-gray-200 text-center flex-1">
                    Réalisation de boutiques en ligne performantes et sécurisées.
                    </p>
                </div>
                </div>

                <div class="col-span-12 md:col-span-6 lg:col-span-4">
                <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 p-6 flex flex-col h-full">
                    <div class="w-16 h-16 flex items-center justify-center rounded-xl mb-4 bg-[#004D4A] text-white text-2xl mx-auto">
                    <i class="pi pi-fw pi-briefcase"></i>
                    </div>
                    <h5 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Suivi des projets</h5>
                    <p class="text-gray-600 dark:text-gray-200 text-center flex-1">
                    Accompagnement complet pour assurer la réussite de vos projets.
                    </p>
                </div>
                </div>

                <div class="col-span-12 md:col-span-12 lg:col-span-4">
                <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition duration-300 p-6 flex flex-col h-full">
                    <div class="w-16 h-16 flex items-center justify-center rounded-xl mb-4 bg-[#F9A825] text-white text-2xl mx-auto">
                    <i class="pi pi-fw pi-desktop"></i>
                    </div>
                    <h5 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">Application POS</h5>
                    <p class="text-gray-600 dark:text-gray-200 text-center flex-1">
                    Gérez vos ventes, stocks, paiements et factures en toute simplicité avec notre solution POS moderne et efficace.
                    </p>
                </div>
                </div>

            </div>

                <div class="mt-16 p-8 md:p-16 rounded-3xl bg-gradient-to-br from-[#F9A825]/20 via-[#7BB661]/20 to-[#004D4A]/20 text-center shadow-2xl relative overflow-hidden">
                    <!-- Particules scintillantes -->
                    <div class="absolute top-0 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <span class="block w-2 h-2 bg-white rounded-full absolute animate-pulse" style="top:10%; left:20%"></span>
                        <span class="block w-2 h-2 bg-white rounded-full absolute animate-pulse" style="top:50%; left:80%"></span>
                        <span class="block w-2 h-2 bg-white rounded-full absolute animate-pulse" style="top:30%; left:60%"></span>
                        <span class="block w-2 h-2 bg-white rounded-full absolute animate-pulse" style="top:70%; left:40%"></span>
                    </div>

                    <!-- Contenu avec gradient animé -->
                    <h3 class="text-3xl md:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#F9A825] via-[#7BB661] to-[#004D4A] animate-gradient-x">
                        Prenez le contrôle de votre business avec notre application POS
                    </h3>
                    <span class="text-xl font-medium text-gray-700 dark:text-gray-300 mb-6 block animate-fade-in delay-200">Peak Interactive</span>
                    <p class="text-gray-900 dark:text-white text-lg md:text-2xl max-w-3xl mx-auto mb-8 animate-fade-in delay-400">
                        Gérez vos ventes, vos stocks, vos paiements et vos factures en toute simplicité. Notre solution POS vous offre un tableau de bord clair, une impression rapide de tickets, une gestion multi-devises, et un suivi en temps réel.
                    </p>

                    <!-- Illustration POS -->
                    <div class="mx-auto mt-8 w-64 md:w-96 relative animate-fade-in delay-600">
                        <div class="absolute top-4 left-4 w-20 h-12 bg-[#7BB661]/50 rounded-lg animate-pulse"></div>
                        <div class="absolute bottom-4 right-4 w-16 h-10 bg-[#F9A825]/50 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>
<div id="highlights" class="py-12 px-6 lg:px-20 bg-[#F9F9F9] relative">

  <!-- Section images avec 3 mockups -->
  <div class="flex flex-col lg:flex-row justify-center items-center gap-6 lg:gap-8 mb-12 relative z-10">
    <!-- Image 1 -->
    <div class="flex-1 flex justify-center rounded-2xl shadow-2xl bg-[#7BB661]/10 p-4 transform transition hover:scale-105">
      <img src="/demo/page_connexion.png" class="w-[220px] md:w-[260px]" alt="mockup mobile" />
    </div>

    <!-- Image 2 (nouvelle image) -->
    <div class="flex-1 flex justify-center rounded-2xl shadow-2xl bg-[#F9A825]/10 p-4 transform transition hover:scale-105">
      <img src="/demo/pos_phone.png" class="w-[220px] md:w-[260px]" alt="mockup tablette" />
    </div>

    <!-- Image 3 -->
    <div class="flex-1 flex justify-center rounded-2xl shadow-2xl bg-[#004D4A]/10 p-4 transform transition hover:scale-105">
      <img src="/demo/pos_pohe2.png" class="w-[220px] md:w-[260px]" alt="mockup desktop" />
    </div>
  </div>

  <!-- Section texte -->
  <div class="text-center max-w-4xl mx-auto">
    <h2 class="text-3xl md:text-4xl font-extrabold text-[#004D4A] mb-4 animate-gradient-text">
      Gérez facilement vos ventes, stocks et tickets avec BilaTech POS
    </h2>
    <p class="text-xl md:text-2xl text-[#7BB661] mb-6">
      Suivez vos performances commerciales où que vous soyez : ventes, produits, paiements et statistiques sont accessibles en un clic depuis votre appareil.
    </p>
    <p class="text-lg md:text-xl text-[#F9A825]">
      Une interface simple, intuitive et rapide à prendre en main pour tous vos besoins de gestion POS.
    </p>
    <div class="flex flex-col items-center justify-center mt-6 gap-4">
  <!-- Icône de l'app -->
    <img 
        src="/demo/bila_icon_512.png" 
        alt="Icône BilaTech POS" 
        class="w-24 h-24 rounded-lg shadow-md" 
    />

    <!-- Bouton téléchargement -->
    <Button 
    :disabled="downloading"
    class="flex items-center justify-center gap-3 !px-6 !py-3 text-lg bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] text-white shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300"
    @click="downloadApp"
    >
    <i class="pi pi-download text-2xl"></i>
    <i class="pi pi-android text-4xl"></i>
    <span>{{ downloading ? 'Téléchargement...' : 'Télécharger l\'application (V 1.0.1)' }}</span>
    </Button>
    </div>
  </div>
    


  <!-- Décorations subtiles -->
  <div class="absolute top-0 left-0 w-32 h-32 bg-[#F9A825]/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
  <div class="absolute bottom-0 right-0 w-40 h-40 bg-[#004D4A]/20 rounded-full translate-x-1/4 translate-y-1/4"></div>
</div>

           

            <div id="pricing" class="py-10 px-6 lg:px-20 my-4 md:my-10">
                <div class="text-center mb-12">
                    <h2 class="inline-block relative font-extrabold text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-indigo-600 to-blue-400 bg-clip-text text-transparent">
                    <!-- petit symbole tech à gauche du titre -->
                    <svg class="inline-block w-8 h-8 mr-2 align-middle" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                        <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Types d'abonnement
                    <span class="absolute left-1/2 -bottom-3 w-20 h-1 bg-gradient-to-r from-indigo-600 to-blue-400 rounded-full transform -translate-x-1/2"></span>
                    </h2>
                    <p class="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Choisissez la formule qui correspond le mieux à vos besoins et à la taille de votre entreprise.
                    </p>
                </div>

                <div class="grid grid-cols-12 gap-6">
                    <!-- BASIC -->
                    <div class="col-span-12 lg:col-span-4 flex">
                    <div class="relative p-6 flex flex-col bg-white dark:bg-surface-800 border border-[#00629B] shadow-lg rounded-2xl transform hover:scale-105 transition duration-300 hover:shadow-2xl w-full h-full">

                        <!-- Badge diagonal reculé -->
                        <div class="absolute top-0 right-0 w-32 h-8 overflow-visible pointer-events-none">
                        <div class="absolute -top-2 -right-4 transform rotate-45 bg-red-500 text-white text-xs font-bold px-3 py-1 shadow-md">
                            🔥 SUPER PROMO
                        </div>
                        </div>

                        <h3 class="text-[#00629B] text-center mb-6 text-2xl font-semibold">BASIC</h3>

                        <!-- Stars -->
                        <div class="text-center mb-6 flex justify-center gap-2">
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        </div>

                        <!-- Prix -->
                        <div class="flex flex-col items-center mt-4 mb-6">
                        <span class="text-lg text-gray-500 line-through">$19.99</span>
                        <span class="text-4xl font-extrabold text-[#00629B]">$9.99</span>
                        <span class="text-gray-600 dark:text-surface-200">/ Mois</span>
                        </div>

                        <Divider class="w-full bg-[#F5F5F5]"></Divider>

                        <!-- Features -->
                        <ul class="mt-6 space-y-3 text-gray-700 dark:text-surface-0 text-base flex-1">
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Gestion des ventes</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Gestion des stocks</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Rapports journaliers</li>
                        </ul>
                    </div>
                    </div>

                    <!-- MEDIUM -->
                    <div class="col-span-12 lg:col-span-4 flex">
                    <div class="relative p-6 flex flex-col bg-white dark:bg-surface-800 border border-[#00629B] shadow-lg rounded-2xl transform hover:scale-105 transition duration-300 hover:shadow-2xl w-full h-full">
                        <!-- Badge diagonal reculé -->
                        <div class="absolute top-0 right-0 w-32 h-8 overflow-visible pointer-events-none">
                        <div class="absolute -top-2 -right-4 transform rotate-45 bg-red-500 text-white text-xs font-bold px-3 py-1 shadow-md">
                            🔥 SUPER PROMO
                        </div>
                        </div>

                        <h3 class="text-center mb-6 text-2xl font-semibold">MEDIUM</h3>

                        <div class="text-center mb-6 flex justify-center gap-2">
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        </div>

                        <div class="flex flex-col items-center mt-4 mb-6">
                        <span class="text-lg text-gray-500 line-through">$29.99</span>
                        <span class="text-4xl font-extrabold text-[#00629B]">$19.99</span>
                        <span class="text-gray-600">/ Mois</span>
                        </div>

                        <Divider class="w-full bg-[#F5F5F5]"></Divider>

                        <ul class="mt-6 space-y-3 text-gray-700 dark:text-surface-0 text-base flex-1">
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Gestion avancée des ventes</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Suivi de stock en temps réel</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Rapports et bilans quotidiens</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Accès aux statistiques en direct</li>
                        
                        </ul>
                    </div>
                    </div>

                    <!-- PREMIUM -->
                    <div class="col-span-12 lg:col-span-4 flex">
                    <div class="relative p-6 flex flex-col bg-white dark:bg-surface-800 border border-[#00629B] shadow-lg rounded-2xl transform hover:scale-105 transition duration-300 hover:shadow-2xl w-full h-full">
                        <!-- Badge diagonal reculé -->
                        <div class="absolute top-0 right-0 w-32 h-8 overflow-visible pointer-events-none">
                        <div class="absolute -top-2 -right-4 transform rotate-45 bg-red-500 text-white text-xs font-bold px-3 py-1 shadow-md">
                            🔥 SUPER PROMO
                        </div>
                        </div>

                        <h3 class="text-center mb-6 text-2xl font-semibold">PREMIUM</h3>

                        <div class="text-center mb-6 flex justify-center gap-2">
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        <i class="pi pi-star-fill text-yellow-400 text-3xl"></i>
                        </div>

                        <div class="flex flex-col items-center mt-4 mb-6">
                        <span class="text-lg text-gray-500 line-through">$49.99</span>
                        <span class="text-4xl font-extrabold text-[#00629B]">$39.99</span>
                        <span class="text-gray-600">/ Mois</span>
                        </div>

                        <Divider class="w-full bg-[#F5F5F5]"></Divider>

                        <ul class="mt-6 space-y-3 text-gray-700 dark:text-surface-0 text-base flex-1">
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Gestion avancée des ventes</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Suivi de stock en temps réel</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Rapports et bilans quotidiens</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Accès aux statistiques en direct</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Accès aux historiques des ventes</li>
                        <li><i class="pi pi-check text-cyan-500 mr-2"></i> Ajouter 2 points de vente supplémentaires</li>

                        </ul>
                    </div>
                    </div>
                </div>
                </div>
 



            <div class="py-6 px-6 mx-0 mt-20 lg:mx-20 bg-[#0D1B2A] text-white rounded-t-lg">
                <div class="grid grid-cols-12 gap-4">
                    <!-- Logo -->
                    <div class="col-span-12 md:col-span-2">
                        <a @click="smoothScroll('#home')" class="flex items-center justify-center md:justify-start mb-4 cursor-pointer">
                            <img src="/demo/bilatechblanc.png" alt="BilaTech Logo" class="h-30 mx-auto md:mx-0" />
                        </a>
                    </div>

                    <!-- Links -->
                    <div class="col-span-12 md:col-span-10">
                        <div class="grid grid-cols-12 gap-8 text-center md:text-left">
                            
                            <!-- Contact -->
                            <div class="col-span-12 md:col-span-3">
                                <h4 class="font-semibold text-xl mb-4">Contact</h4>
                                <p class="text-lg mb-2">Email : bilatech@bilatech.org,</p>
                                 <p class="text-lg mb-2">bilatechstore@gmail.com</p>
                                <p class="text-lg mb-2">Téléphone : +243 992 937 586,</p>
                                <p class="text-lg mb-2"> +243 811 465 276,</p>
                            </div>

                            <!-- Adresse -->
                            <div class="col-span-12 md:col-span-3">
                                <h4 class="font-semibold text-xl mb-4">Adresse</h4>
                                <p class="text-lg mb-2">RDC, Kinshasa / Ngaliema</p>
                                <p class="text-lg mb-2">Av. Niwa, N°25 – Quartier Pigeon</p>
                            </div>

                            <!-- Community -->
                            <div class="col-span-12 md:col-span-3">
                                <h4 class="font-semibold text-xl mb-4">Communauté</h4>
                                <a href="#" class="block text-lg mb-2 hover:underline">X</a>
                                <a href="#" class="block text-lg mb-2 hover:underline">FAQ</a>
                                <a href="#" class="block text-lg hover:underline">Blog</a>
                            </div>

                            <!-- Legal -->
                            <div class="col-span-12 md:col-span-3">
                                <h4 class="font-semibold text-xl mb-4">Légal</h4>
                                <a href="#" class="block text-lg mb-2 hover:underline">Politique de marque</a>
                                <a href="#" class="block text-lg mb-2 hover:underline">Politique de confidentialité</a>
                                <a href="#" class="block text-lg hover:underline">Conditions d'utilisation</a>
                                <a href="#" class="block text-lg hover:underline">Bilatech V.3.2</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>


<style scoped>
@keyframes fadeIn {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fadeIn 1s ease-out forwards;
}
.animate-fade-in.delay-200 {
    animation-delay: 0.2s;
}
.animate-fade-in.delay-400 {
    animation-delay: 0.4s;
}

@keyframes pulseSlow {
    0%, 100% { transform: scale(1); opacity: 0.25; }
    50% { transform: scale(1.05); opacity: 0.35; }
}
.animate-pulse-slow {
    animation: pulseSlow 6s infinite ease-in-out;
}



ul li a:hover span {
    width: 100%;
}

/* Glassmorphism subtil */
.backdrop-blur-md {
    backdrop-filter: blur(10px);
}



/* Gradient animé */
@keyframes gradient-x {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-gradient-x {
  background-size: 200% 200%;
  animation: gradient-x 5s ease infinite;
}

/* Fade in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 1s ease forwards;
}
.animate-fade-in.delay-200 { animation-delay: 0.2s; }
.animate-fade-in.delay-400 { animation-delay: 0.4s; }
.animate-fade-in.delay-600 { animation-delay: 0.6s; }




@keyframes gradient-x {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animate-gradient-text {
  background: linear-gradient(90deg, #F9A825, #7BB661, #004D4A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradient-x 5s ease infinite;
}
</style>