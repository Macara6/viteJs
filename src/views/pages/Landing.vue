<script setup>
import { ref } from 'vue';
function smoothScroll(id) {
    document.body.click();
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
}
const downloading = ref(false);
const downloadCount = ref(0);
function downloadApp() {
    const fileUrl = '/demo/apk/app-bilasol.apk'; // renommer Url en fileUrl
    const link = document.createElement('a');
    link.href = fileUrl;        // ok maintenant
    link.download = 'bila-sol.apk';
    downloading.value = true;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

     downloadCount.value += 1;

    setTimeout(() => {
        downloading.value = false;
    }, 1000);
}



</script>

<template>
     <div class="bg-gray-900 text-gray-200 font-sans">

        <div id="home" class="landing-wrapper overflow-hidden">

        <div class="py-4 px-6 lg:px-20 flex items-center justify-between relative lg:static bg-gray-900/90 backdrop-blur-md shadow-lg rounded-b-xl z-50">
        <!-- Logo -->
        <a class="flex items-center" href="#">
          <img src="/demo/bilatechblanc.png" alt="BilaTech Logo" class="h-44 md:h-56 lg:h-64 mx-auto" />
        </a>

        <!-- Mobile Menu Button -->
        <Button class="lg:!hidden text-[#7BB661]" text severity="secondary" rounded>
          <i class="pi pi-bars !text-3xl"></i>
        </Button>

        <!-- Desktop Menu -->
        <div class="items-center grow justify-between hidden lg:flex absolute lg:static w-full left-0 top-full px-12 lg:px-0 z-20 rounded-b-xl bg-gray-900/90 backdrop-blur-md shadow-lg">
          <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-10">
            <li><a @click="smoothScroll('#hero')" class="px-0 py-4 font-semibold text-lg text-gray-100 hover:text-[#F9A825] transition-colors duration-300">Home</a></li>
            <li><a @click="smoothScroll('#features')" class="px-0 py-4 font-semibold text-lg text-gray-100 hover:text-[#F9A825] transition-colors duration-300">Services</a></li>
            <li><a @click="smoothScroll('#highlights')" class="px-0 py-4 font-semibold text-lg text-gray-100 hover:text-[#F9A825] transition-colors duration-300">POS</a></li>
            <li><a @click="smoothScroll('#pricing')" class="px-0 py-4 font-semibold text-lg text-gray-100 hover:text-[#F9A825] transition-colors duration-300">Fonctionnalités</a></li>
          </ul>

          <!-- Bouton Se connecter -->
          <div class="flex border-t lg:border-t-0 border-gray-700 py-4 lg:py-0 mt-4 lg:mt-0 gap-2">
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


      <div class="w-full text-center py-2 bg-gradient-to-r from-[#004D4A] to-[#7BB661] text-white font-semibold tracking-wide">
        ✨ Toute l’équipe BilaTech vous souhaite une excellente année 2026 🎊
      </div>


            <!-- HERO -->
      <div id="hero" class="flex flex-col lg:flex-row items-center pt-12 px-6 lg:px-20 overflow-hidden relative bg-gray-900 rounded-b-3xl">
        <!-- Texte -->
        <div class="flex-1 mx-6 md:mx-20 mt-0 md:mt-6">
          <h1 class="text-5xl md:text-6xl font-extrabold leading-tight text-white">
            <span class="font-light block text-gray-300">Bienvenue sur</span>
            <span class="block bg-clip-text text-transparent bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825]">Bilatech Solution</span>
          </h1>
          <p class="font-normal text-xl md:text-2xl leading-relaxed text-gray-300 mt-4">
            Une plateforme <span class="text-[#F9A825] font-semibold">technologique innovante</span> pour la <span class="text-[#7BB661] font-semibold">gestion d’entreprise</span>, la <span class="text-[#004D4A] font-semibold">facturation</span> et le <span class="text-[#F9A825] font-semibold">suivi des performances</span>. Simple, rapide et accessible.
          </p>
          <Button 
            label="Se connecter" 
            as="router-link" 
            to="/login" 
            rounded 
            class="!text-xl mt-8 !px-6 !py-3 bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] text-white shadow-xl transition duration-500 transform hover:scale-105 hover:shadow-2xl"
          />
        </div>

        <!-- Halo Image -->
        <div class="flex justify-center md:justify-end mt-8 lg:mt-0 flex-1 relative">
          <div class="absolute -top-16 -right-16 w-72 h-72 bg-gradient-to-tr from-[#7BB661]/40 via-[#004D4A]/30 to-[#F9A825]/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div class="absolute -bottom-10 -left-10 w-48 h-48 bg-[#F9A825]/20 rounded-full blur-2xl"></div>
        </div>
      </div>

<!-- Animation simple via Tailwind CSS -->


      <div id="features" class="py-20 px-6 lg:px-24 bg-gray-800">
        <div class="text-center max-w-4xl mx-auto mb-16">
          <span class="inline-block mb-4 px-4 py-1 rounded-full border border-[#7BB661] text-[#7BB661] text-sm font-semibold">Nos services</span>
          <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Des solutions numériques pensées pour votre croissance</h2>
          <p class="text-lg text-gray-300 max-w-3xl mx-auto">Nous accompagnons les entreprises dans la transformation digitale avec des solutions fiables, performantes et évolutives.</p>
        </div>

        <div class="grid grid-cols-12 gap-8">
          <!-- Formation -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="group bg-gray-900 border border-[#7BB661]/40 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all h-full">
              <div class="w-14 h-14 mb-6 flex items-center justify-center rounded-xl bg-[#7BB661]/30 text-[#004D4A]">
                <i class="pi pi-book text-2xl"></i>
              </div>
              <h3 class="text-xl font-semibold text-[#7BB661] mb-2">Formation</h3>
              <p class="text-gray-300 leading-relaxed">Accompagnement et formation sur mesure pour renforcer les compétences de vos équipes.</p>
            </div>
          </div>

          <!-- Développement -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="group bg-gray-900 border border-[#7BB661]/40 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all h-full">
              <div class="w-14 h-14 mb-6 flex items-center justify-center rounded-xl bg-[#004D4A]/30 text-[#004D4A]">
                <i class="pi pi-code text-2xl"></i>
              </div>
              <h3 class="text-xl font-semibold text-[#004D4A] mb-2">Développement</h3>
              <p class="text-gray-300 leading-relaxed">Applications web, mobiles et desktop conçues pour la performance et la sécurité.</p>
            </div>
          </div>

          <!-- Maintenance & Support -->
          <div class="col-span-12 md:col-span-6 lg:col-span-4">
            <div class="group bg-gray-900 border border-[#7BB661]/40 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all h-full">
              <div class="w-14 h-14 mb-6 flex items-center justify-center rounded-xl bg-[#F9A825]/30 text-[#004D4A]">
                <i class="pi pi-wrench text-2xl"></i>
              </div>
              <h3 class="text-xl font-semibold text-[#F9A825] mb-2">Maintenance & Support</h3>
              <p class="text-gray-300 leading-relaxed">Support technique, mises à jour et suivi continu de vos solutions.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- POS Highlights -->
      <div id="highlights" class="relative py-20 px-6 lg:px-24 bg-gray-900">
        <div class="relative text-center max-w-4xl mx-auto mb-20">
          <span class="inline-block mb-4 px-4 py-1 rounded-full border border-[#7BB661] text-[#7BB661] text-sm font-semibold">Nouvelle génération • 2026</span>
          <h2 class="text-4xl md:text-5xl font-extrabold text-white leading-tight">Une gestion intelligente avec <span class="text-[#7BB661]">Bila-Sol POS</span></h2>
          <p class="mt-6 text-lg text-gray-300 max-w-3xl mx-auto">Centralisez vos ventes, vos stocks et vos performances dans une plateforme fiable, rapide et conçue pour accompagner la croissance de votre entreprise.</p>
        </div>

        <div class="relative flex flex-col lg:flex-row justify-center items-center gap-10 mb-20">
          <div class="bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition">
            <img src="/demo/page_connexion.png" class="w-[230px]" alt="Connexion BilaTech" />
          </div>
          <div class="bg-gray-800 rounded-2xl shadow-2xl p-6 scale-105 border border-[#7BB661]/40">
            <img src="/demo/pos_phone.png" class="w-[230px]" alt="POS mobile" />
          </div>
          <div class="bg-gray-800 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition">
            <img src="/demo/pos_pohe2.png" class="w-[230px]" alt="Interface POS" />
          </div>
        </div>

        <div class="text-center max-w-3xl mx-auto">
          <p class="text-lg text-gray-300 mb-6">Une solution pensée pour les commerces modernes : rapide à déployer, simple à utiliser et évolutive selon vos besoins.</p>
          <p class="text-lg font-medium text-[#7BB661] mb-10">Gestion • Performance • Sécurité</p>
        </div>
      </div>

   

<div id="pricing" class="py-16 px-6 lg:px-20 relative overflow-hidden bg-gray-900">

  <!-- 🎉 Message Bonne Année -->
  <div class="flex justify-center mb-12">
    <div class="relative">
      <div class="absolute inset-0 blur-2xl bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] opacity-30 rounded-full animate-pulse-slow"></div>
      <div class="relative px-8 py-3 rounded-full bg-gray-800 border border-[#7BB661] text-white font-semibold shadow-lg backdrop-blur-sm">
        🎉 Bonne année 2026 — BilaTech vous remercie pour votre confiance
      </div>
    </div>
  </div>

  <!-- Titre -->
  <div class="text-center mb-16">
    <h2 class="font-extrabold text-4xl md:text-5xl tracking-tight 
               bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] 
               bg-clip-text text-transparent">
      Nos formules 2026
    </h2>
    <p class="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
      Des solutions fiables et évolutives adaptées à la croissance de votre entreprise.
    </p>
  </div>

  <!-- CARTES -->
  <div class="grid grid-cols-12 gap-8">

    <!-- BASIC -->
    <div class="col-span-12 lg:col-span-4">
      <div class="relative h-full p-8 rounded-2xl bg-gray-800 border border-[#7BB661]/50 shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1">
        <span class="absolute -top-4 left-6 bg-[#7BB661] text-white text-xs px-3 py-1 rounded-full shadow-md">
          ESSENTIEL
        </span>

        <h3 class="text-center text-2xl font-semibold mb-4 text-[#7BB661]">BASIC</h3>

        <div class="text-center mb-6">
          <span class="text-gray-400 line-through text-lg">$19.99</span>
          <div class="text-4xl font-bold text-white">$9.99</div>
          <span class="text-gray-400">/ mois</span>
        </div>

        <ul class="space-y-3 text-gray-300">
          <li>✔ Gestion des ventes</li>
          <li>✔ Gestion des stocks</li>
          <li>✔ Rapports journaliers</li>
        </ul>
      </div>
    </div>

    <!-- MEDIUM -->
    <div class="col-span-12 lg:col-span-4">
      <div class="relative h-full p-8 rounded-2xl bg-gradient-to-br from-[#004D4A] to-[#7BB661] border-2 border-[#F9A825] shadow-2xl scale-105 transform hover:scale-110 transition-transform duration-500">
        <span class="absolute -top-4 right-6 bg-[#F9A825] text-black text-xs px-4 py-1 rounded-full shadow-md">
          ⭐ Recommandé
        </span>

        <h3 class="text-center text-2xl font-bold mb-4 text-white">MEDIUM</h3>

        <div class="text-center mb-6">
          <span class="text-gray-300 line-through text-lg">$29.99</span>
          <div class="text-4xl font-bold text-white">$19.99</div>
          <span class="text-gray-300">/ mois</span>
        </div>

        <ul class="space-y-3 text-gray-200">
          <li>✔ Gestion avancée des ventes</li>
          <li>✔ Stock en temps réel</li>
          <li>✔ Statistiques & rapports</li>
          <li>✔ Support prioritaire</li>
        </ul>
      </div>
    </div>

    <!-- PREMIUM -->
    <div class="col-span-12 lg:col-span-4">
      <div class="relative h-full p-8 rounded-2xl bg-gray-800 border border-[#F9A825]/50 shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1">
        <span class="absolute -top-4 right-6 bg-[#F9A825] text-black text-xs px-3 py-1 rounded-full shadow-md">
          PREMIUM
        </span>

        <h3 class="text-center text-2xl font-semibold mb-4 text-[#F9A825]">PREMIUM</h3>

        <div class="text-center mb-6">
          <span class="text-gray-400 line-through text-lg">$49.99</span>
          <div class="text-4xl font-bold text-white">$39.99</div>
          <span class="text-gray-400">/ mois</span>
        </div>

        <ul class="space-y-3 text-gray-300">
          <li>✔ Toutes les fonctionnalités Medium</li>
          <li>✔ Historique complet</li>
          <li>✔ Multi-points de vente</li>
          <li>✔ Assistance prioritaire</li>
        </ul>
      </div>
    </div>

  </div>
</div>


            <div class="flex flex-col items-center gap-5">

            <img 
                src="/demo/bila_icon_512.png" 
                alt="BilaTech POS"
                class="w-24 h-24 rounded-xl shadow-md"
            />

            <Button
                :disabled="downloading"
                class="!px-10 !py-3 text-lg font-semibold
                    bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#7BB661]
                    text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                @click="downloadApp"
            >
                <i class="pi pi-download text-xl mr-2"></i>
                {{ downloading ? 'Téléchargement...' : 'Télécharger l’application (v1.1.2)' }}
            </Button>
            </div>


<div class="py-10 px-6 lg:px-20 mt-20 bg-gray-900 text-white rounded-t-3xl relative overflow-hidden">
  
  <!-- Halo léger derrière le logo -->
  <div class="absolute -top-16 -left-16 w-64 h-64 bg-gradient-to-tr from-[#7BB661]/40 via-[#004D4A]/30 to-[#F9A825]/20 rounded-full blur-3xl animate-pulse-slow"></div>

  <div class="grid grid-cols-12 gap-6 relative z-10">
    
    <!-- Logo -->
    <div class="col-span-12 md:col-span-2 flex items-center justify-center md:justify-start mb-6">
      <a @click="smoothScroll('#home')" class="flex items-center cursor-pointer">
        <img src="/demo/bilatechblanc.png" alt="BilaTech Logo" class="h-28 md:h-32" />
      </a>
    </div>

    <!-- Links -->
    <div class="col-span-12 md:col-span-10">
      <div class="grid grid-cols-12 gap-8 text-center md:text-left">

        <!-- Contact -->
        <div class="col-span-12 md:col-span-3">
          <h4 class="font-bold text-xl mb-4 text-[#7BB661]">Contact</h4>
          <p class="text-gray-300 mb-2">Email : bilatech@bilatech.org</p>
          <p class="text-gray-300 mb-2">bilatechstore@gmail.com</p>
          <p class="text-gray-300 mb-2">Téléphone : +243 992 937 586</p>
          <p class="text-gray-300 mb-2">+243 811 465 276</p>
        </div>

        <!-- Adresse -->
        <div class="col-span-12 md:col-span-3">
          <h4 class="font-bold text-xl mb-4 text-[#7BB661]">Adresse</h4>
          <p class="text-gray-300 mb-2">RDC, Kinshasa / Ngaliema</p>
          <p class="text-gray-300 mb-2">Av. Niwa, N°25 – Quartier Pigeon</p>
        </div>

        <!-- Communauté -->
        <div class="col-span-12 md:col-span-3">
          <h4 class="font-bold text-xl mb-4 text-[#7BB661]">Communauté</h4>
          <a href="#" class="block text-gray-300 mb-2 hover:text-[#F9A825] transition-colors">X</a>
          <a href="#" class="block text-gray-300 mb-2 hover:text-[#F9A825] transition-colors">FAQ</a>
          <a href="#" class="block text-gray-300 hover:text-[#F9A825] transition-colors">Blog</a>
        </div>

        <!-- Legal -->
        <div class="col-span-12 md:col-span-3">
          <h4 class="font-bold text-xl mb-4 text-[#7BB661]">Légal</h4>
          <a href="#" class="block text-gray-300 mb-2 hover:text-[#F9A825] transition-colors">Politique de marque</a>
          <a href="#" class="block text-gray-300 mb-2 hover:text-[#F9A825] transition-colors">Politique de confidentialité</a>
          <a href="#" class="block text-gray-300 mb-2 hover:text-[#F9A825] transition-colors">Conditions d'utilisation</a>
          <a href="#" class="block text-gray-300 hover:text-[#F9A825] transition-colors">Bilatech 26</a>
        </div>

      </div>
    </div>
  </div>

  <!-- Ligne de séparation subtile -->
  <div class="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-sm">
    © 2026 BilaTech. Tous droits réservés.
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