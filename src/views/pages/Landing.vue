<script setup>

import { sendCommentAPI } from '@/service/Api';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const comment = ref('');
const errorMessage = ref(null);
const successMessage = ref(null);

const downloading = ref(false);
const downloadCount = ref(0);


function downloadApp() {
    const fileUrl = 'https://pos.bilatech.org/media/app/app-release.apk'; // renommer Url en fileUrl
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

const isMobileMenuOpen = ref(false);

// gestion du mesu 
const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const smoothScroll = (id) => {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  isMobileMenuOpen.value = false; // ferme le menu après choix
};

function payment(){
  router.push("/Payment")
}
/// fin de la gestion menu

async function sendComment() {
  if(!email.value || !comment.value){
    errorMessage.value = "Tous les champs sont obligatoires"
    console.log(` error : ${errorMessage.value}`);
    return;
  }

  const data = {
    email:email.value,
    message:comment.value
  }
  const result = await sendCommentAPI(data);
  email.value ='';
  comment.value ='';

  if(result){
    successMessage.value =`${result.message}`;
    
  }

}

// gestion patie 1  hero


const heroRef = ref(null);

const slides = [
  "/demo/medium-shot.jpg",
  "/demo/modern.jpg",
  "/demo/Photos-inf.png",
];

const currentIndex = ref(0);

const currentSlide = computed(
  () => slides[currentIndex.value]
);

const nextIndex = computed(
  () => (currentIndex.value + 1) % slides.length
);

let interval = null;
let observer = null;

const preloadImage = (src) => {
  const img = new Image();
  img.src = src;
};

const nextSlide = () => {
  currentIndex.value = nextIndex.value;

  preloadImage(
    slides[(nextIndex.value + 1) % slides.length]
  );
};

const startSlider = () => {
  if (interval) return;

  interval = setInterval(nextSlide, 6000);
};

const stopSlider = () => {
  clearInterval(interval);
  interval = null;
};

const handleVisibility = () => {
  if (document.hidden) {
    stopSlider();
  } else {
    startSlider();
  }
};

onMounted(() => {
  preloadImage(slides[1]);

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        startSlider();
      } else {
        stopSlider();
      }
    },
    {
      threshold: 0.3,
    }
  );

  if (heroRef.value) {
    observer.observe(heroRef.value);
  }

  document.addEventListener(
    "visibilitychange",
    handleVisibility
  );
});

onBeforeUnmount(() => {
  stopSlider();

  if (observer) {
    observer.disconnect();
  }

  document.removeEventListener(
    "visibilitychange",
    handleVisibility
  );
});



</script>

<template>

     <div class="bg-gray-900 text-gray-200 font-sans">

      <div id="home" class="landing-wrapper overflow-visible">

      <div class="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] lg:w-[85%] z-50">

      <div class="flex items-center justify-between px-6 py-3 
                  rounded-2xl 
                  bg-white/10 backdrop-blur-2xl 
                  border border-white/20 
                  shadow-[0_8px_40px_rgba(0,0,0,0.4)]">

        <!-- LOGO -->
      <a href="#" class="flex items-center gap-2">
        <img 
          src="/demo/bilatechblanc.png" 
          class="h-14 md:h-16 lg:h-18 object-contain 
                drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]" 
        />
      </a>

        <!-- DESKTOP MENU -->
        <ul class="hidden lg:flex items-center gap-10 text-sm font-medium text-white/80">

          <li>
            <a @click="smoothScroll('#hero')" 
              class="nav-link">Accueil</a>
          </li>

          <li>
            <a @click="smoothScroll('#features')" 
              class="nav-link">Services</a>
          </li>

          <li>
            <a @click="smoothScroll('#highlights')" 
              class="nav-link">POS</a>
          </li>

          <li>
            <a @click="smoothScroll('#pricing')" 
              class="nav-link">Tarifs</a>
          </li>

          <li>
            <a @click="payment" 
              class="nav-link">Réabonnement</a>
          </li>

        </ul>

        <!-- ACTIONS -->
        <div class="hidden lg:flex items-center gap-3">

          <!-- login -->
          <router-link to="/login"
            class="px-5 py-2 rounded-xl text-white/80 
                  hover:text-white hover:bg-white/10 
                  transition">
            Se connecter
          </router-link>

          <!-- signup -->
          <router-link to="/signup"
            class="px-6 py-2.5 rounded-xl 
                  bg-white/10 backdrop-blur-xl 
                  border border-white/20
                  text-white font-medium
                  hover:bg-white/20 hover:scale-[1.03]
                  transition-all duration-300">
            Commencer
          </router-link>

        </div>

        <!-- MOBILE BUTTON -->
        <button 
          @click="toggleMenu"
          class="lg:hidden text-white text-2xl">
          <i class="pi pi-bars"></i>
        </button>

      </div>

      <!-- MOBILE MENU -->
      <div v-if="isMobileMenuOpen"
          class="mt-3 p-6 rounded-2xl 
                  bg-white/10 backdrop-blur-2xl 
                  border border-white/20 
                  shadow-xl lg:hidden">

        <ul class="flex flex-col gap-6 text-white/90 text-lg">

          <li><a @click="smoothScroll('#hero')" class="nav-link">Accueil</a></li>
          <li><a @click="smoothScroll('#features')" class="nav-link">Services</a></li>
          <li><a @click="smoothScroll('#highlights')" class="nav-link">POS</a></li>
          <li><a @click="smoothScroll('#pricing')" class="nav-link">Tarifs</a></li>
          <li><a @click="payment" class="nav-link">Réabonnement</a></li>

        </ul>

        <div class="mt-6 flex flex-col gap-3">

          <router-link to="/signup"
            class="py-3 text-center rounded-xl bg-white/10 border border-white/20">
            Créer un compte
          </router-link>

          <router-link to="/login"
            class="py-3 text-center rounded-xl bg-white/5">
            Se connecter
          </router-link>

        </div>

      </div>

    </div>

    <section
    ref="heroRef"
    id="hero"
    class="relative h-[90vh] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(123,182,97,0.18),transparent_60%)] rounded-b-3xl"
  >
    <!-- IMAGE -->
    <Transition name="fade" mode="out-in">
      <img
        :key="currentSlide"
        :src="currentSlide"
        fetchpriority="high"
        decoding="async"
        alt=""
        class="absolute inset-0 w-full h-full object-cover will-change-transform"
      />
    </Transition>

    <!-- OVERLAY -->
    <div class="absolute inset-0 bg-black/60 z-10"></div>

    <!-- CONTENT -->
    <div
      class="relative z-20 flex flex-col justify-center h-full px-6 md:px-20 max-w-6xl"
    >
      <h1
        class="text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl"
      >
        <span
          class="block text-gray-300 font-light mb-3 tracking-wide"
        >
          Tout votre business sur une seule plateforme
        </span>

        <span
          class="bg-gradient-to-r from-[#7BB661] via-white to-[#F9A825] bg-clip-text text-transparent"
        >
          BilaSol.
        </span>
      </h1>

      <p
        class="text-lg md:text-xl text-gray-300 mt-6 max-w-2xl leading-relaxed"
      >
        Une solution simple,
        <span class="text-yellow-400 font-semibold">
          rapide
        </span>,
        et
        <span class="text-green-400 font-semibold">
          abordable
        </span>
        pour gérer votre activité sans effort.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 mt-10">
        <button
          @click="$router.push('/signup')"
          class="ios-btn-primary"
        >
          Commencer gratuitement
        </button>

        <button
          @click="$router.push('/login')"
          class="ios-btn-secondary"
        >
          Se connecter
        </button>
      </div>
    </div>
  </section>

<!-- Animation simple via Tailwind CSS -->


 <div id="features" class="relative py-24 px-6 lg:px-24 bg-[#070A12] overflow-hidden">

  <!-- background glow -->
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(123,182,97,0.18),transparent_60%)]"></div>

  <!-- HEADER -->
  <div class="relative text-center max-w-4xl mx-auto mb-20 z-10">

    <!-- badge -->
    <span class="inline-block mb-5 px-4 py-1.5 rounded-full 
                 bg-white/10 backdrop-blur-xl border border-white/20 
                 text-white/80 text-sm">
       Nos Applications
    </span>

    <!-- title -->
    <h2 class="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-tight">
      Des solutions numériques pensées  
      <span class="text-transparent bg-clip-text 
                   bg-gradient-to-r from-[#7BB661] via-white to-[#F9A825]">
        pour votre croissance
      </span>
    </h2>

    <!-- description -->
    <p class="mt-6 text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
      Nous accompagnons les entreprises dans leur transformation digitale avec des solutions fiables, performantes et évolutives.
    </p>

    <!-- divider -->
    <div class="mt-10 flex justify-center">
      <div class="w-40 h-[3px] bg-gradient-to-r 
                  from-[#7BB661] via-white/70 to-[#F9A825] 
                  rounded-full opacity-80"></div>
    </div>

  </div>

  <!-- CARDS -->
  <div class="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 z-10">

    <!-- POS -->
    <div class="feature-card">
      <div class="icon-box bg-[#7BB661]/20">
        <i class="pi pi-calculator text-2xl text-[#7BB661]"></i>
      </div>

      <h3 class="title-green">POS</h3>

      <p class="desc">
        Une application complète pour la gestion des ventes, des stocks, de la facturation et de la comptabilité.
      </p>
    </div>

    <!-- COLIS -->
    <div class="feature-card">
      <div class="icon-box bg-[#F9A825]/20">
        <i class="pi pi-truck text-2xl text-[#F9A825]"></i>
      </div>

      <h3 class="title-gold">Gestion des colis</h3>

      <p class="desc text-gray-500 italic">
        Bientôt disponible...
      </p>
    </div>

    <!-- ECOLE -->
    <div class="feature-card featured">
      <div class="icon-box bg-white/20">
        <i class="pi pi-briefcase text-2xl text-white"></i>
      </div>

      <h3 class="title-white">Gestion écoles</h3>

      <p class="desc text-gray-500 italic">
        Bientôt disponible...
      </p>
    </div>

  </div>

</div>

<div id="highlights" class="relative py-24 px-6 lg:px-24 bg-[#070A12] overflow-hidden">

  <!-- background glow (comme pricing) -->
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(123,182,97,0.18),transparent_60%)]"></div>

  <!-- HEADER -->
  <div class="relative text-center max-w-4xl mx-auto mb-20 z-10">

    <!-- badge -->
    <span class="inline-block mb-5 px-4 py-1.5 rounded-full 
                 bg-white/10 backdrop-blur-xl border border-white/20 
                 text-white/80 text-sm">
      ✨ Nouvelle génération • 2026
    </span>

    <!-- title -->
    <h2 class="text-4xl md:text-6xl font-semibold text-white leading-tight tracking-tight">
      Une gestion intelligente avec  
      <span class="text-transparent bg-clip-text 
                   bg-gradient-to-r from-[#7BB661] via-white to-[#F9A825]">
        Bila-Sol POS
      </span>
    </h2>

    <!-- description -->
    <p class="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
      Centralisez vos ventes, vos stocks et vos performances dans une plateforme fluide, rapide et conçue pour évoluer avec votre entreprise.
    </p>

    <!-- divider -->
    <div class="mt-10 flex justify-center">
      <div class="w-40 h-[3px] bg-gradient-to-r 
                  from-[#7BB661] via-white/70 to-[#F9A825] 
                  rounded-full blur-[1px] opacity-80"></div>
    </div>

  </div>

  <!-- IMAGES (floating glass cards) -->
  <div class="relative flex flex-col lg:flex-row justify-center items-center gap-10 mb-24 z-10">

    <!-- left -->
    <div class="glass-img">
      <img src="/demo/page_connexion.png" class="w-[230px]" />
    </div>

    <!-- center (highlight) -->
    <div class="glass-img featured">
      <img src="/demo/pos_phone.png" class="w-[230px]" />
    </div>

    <!-- right -->
    <div class="glass-img">
      <img src="/demo/pos_pohe2.png" class="w-[230px]" />
    </div>

  </div>

  <!-- FOOT TEXT -->
  <div class="relative text-center max-w-2xl mx-auto z-10">

    <p class="text-lg text-gray-400 mb-6 leading-relaxed">
      Une solution pensée pour les commerces modernes : rapide à déployer, simple à utiliser et évolutive selon vos besoins.
    </p>

    <p class="text-lg font-medium text-transparent bg-clip-text 
              bg-gradient-to-r from-[#7BB661] to-[#F9A825]">
      Gestion • Performance • Sécurité
    </p>

  </div>

</div>

   
<div id="pricing" class="relative py-24 px-6 lg:px-24 bg-[#070A12] overflow-hidden">

  <!-- glow -->
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(123,182,97,0.18),transparent_60%)]"></div>

    <!-- HEADER -->
  <div class="text-center mb-20 relative z-10">

    <!-- glow soft background -->
    <div class="absolute inset-0 flex justify-center -top-10">
      <div class="w-96 h-32 bg-gradient-to-r from-[#7BB661]/20 via-[#004D4A]/10 to-[#F9A825]/20 
                  blur-3xl rounded-full"></div>
    </div>

    <!-- title -->
    <h2 class="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-tight">

      <span class="block">
        Tarifs simples,
      </span>

      <span class="block text-transparent bg-clip-text 
                  bg-gradient-to-r from-white via-gray-300 to-white">
        puissants et transparents
      </span>

    </h2>

    <!-- subtitle -->
    <p class="mt-6 text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
      Choisissez un plan adapté à votre business.  
      <span class="text-white/80 font-medium">
        Sans engagement, évolutif et flexible.
      </span>

      <br class="hidden md:block" />

      <span class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full
                  bg-white/5 backdrop-blur-xl border border-white/10
                  text-sm text-green-300 font-medium shadow-lg">

         Créez votre compte et profitez de 
        <span class="text-white font-semibold">
          30 jours gratuits
        </span>

      </span>
    </p>

     <div class="mt-10 flex justify-center">

  <div class="relative w-44 h-[3px]">

    <!-- glow outer (depth) -->
    <div class="absolute inset-0 bg-gradient-to-r 
                from-transparent via-white/20 to-transparent
                blur-md opacity-60 scale-y-150"></div>

    <!-- main core line -->
    <div class="absolute inset-0 rounded-full 
                bg-gradient-to-r 
                from-[#7BB661] via-white to-[#F9A825]
                opacity-90 shadow-[0_0_25px_rgba(255,255,255,0.15)]"></div>

    <!-- animated highlight -->
    <div class="absolute inset-0 rounded-full 
                bg-gradient-to-r from-transparent via-white/80 to-transparent
                animate-pulse opacity-30"></div>

  </div>

</div>

  </div>

  <!-- GRID -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">

    <!-- BASIC -->
    <div class="p-6 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white">
      <span class="text-xs px-3 py-1 rounded-full bg-green-500/30">ESSENTIEL</span>

      <h3 class="text-center text-xl mt-4 font-semibold 
           text-transparent bg-clip-text
           bg-gradient-to-r 
           from-gray-400 via-white to-gray-500
           drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      
      >BASIC</h3>

      <div class="text-center mt-6">
        <div class="line-through text-gray-400">$19.99</div>
        <div class="text-4xl font-bold">$9.99
           <span class="text-sm font-normal text-gray-400">/mois</span>
        </div>
      </div>

      <ul class="mt-6 text-sm text-gray-300 space-y-2">
        <li>✔ Gestion des Ventes</li>
        <li>✔Gestion des Stocks</li>
        <li>✔ Rapports journaliers </li>
      </ul>

      <router-link to="/signup"
        class="block text-center mt-6 py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20">
        Commencer
      </router-link>
    </div>

    <!-- MEDIUM (featured) -->
    <div class="p-6 rounded-3xl bg-white/15 backdrop-blur-2xl border border-yellow-400 text-white scale-105">

      <span class="text-xs px-3 py-1 rounded-full bg-yellow-400 text-black">
        RECOMMANDÉ
      </span>

      <h3 class="text-center text-xl mt-4 font-semibold 
           text-transparent bg-clip-text
           bg-gradient-to-r 
           from-gray-400 via-white to-gray-500
           drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      >MEDIUM</h3>

      <div class="text-center mt-6">
        <div class="line-through text-gray-300">$29.99</div>
        <div class="text-4xl font-bold">$19.99
           <span class="text-sm font-normal text-gray-400">/mois</span>
        </div>
        
      </div>

      <ul class="mt-6 text-sm text-gray-200 space-y-2">
        <li>✔ (Tout Basic) + </li>
        <li>✔ Rapport et bilans quotidiens</li>
        <li>✔ Accès aux historiques de ventes</li>
        <li>✔ Accès aux statistiques en temps réel</li>
      </ul>

      <router-link to="/signup"
        class="block text-center mt-6 py-3 rounded-2xl bg-yellow-400 text-black font-medium">
        Commencer
      </router-link>
    </div>

        <!-- PREMIUM -->
    <div class="relative p-7 rounded-3xl text-white 
                bg-gradient-to-b from-white/10 to-white/5 
                backdrop-blur-2xl 
                border border-white/20 
                shadow-[0_0_40px_rgba(255,255,255,0.08)]
                transition-all duration-300 
                hover:scale-[1.04] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)]">

      <!-- glow edge -->
      <div class="absolute inset-0 rounded-3xl 
                  bg-gradient-to-br from-[#7BB661]/20 via-transparent to-[#F9A825]/10 
                  opacity-60 pointer-events-none">
      </div>

      <!-- badge -->
      <span class="absolute -top-3 left-6 px-3 py-1 text-xs rounded-full 
                  bg-gradient-to-r from-[#7BB661] to-[#004D4A] text-white shadow-md">
        ⭐ POPULAIRE
      </span>

      <!-- title -->
      <h3 class="text-center text-xl mt-4 font-semibold 
           text-transparent bg-clip-text
           bg-gradient-to-r 
           from-gray-400 via-white to-gray-500
           drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      >
        PREMIUM
      </h3>

      <!-- price -->
      <div class="text-center mt-6">
        <div class="text-gray-400 line-through text-sm">$49.99</div>
        <div class="text-5xl font-extrabold text-white">
          $39.99
          <span class="text-sm font-normal text-gray-400">/mois</span>
        </div>
      </div>

      <!-- features -->
      <ul class="mt-6 space-y-2 text-gray-300 text-sm">
         <li class="flex items-center gap-2">✔ (Tout Medium) +</li>
        <li class="flex items-center gap-2">✔ 1 Point de vente</li>
        <li class="flex items-center gap-2">✔ 1 Admin</li>
        <li class="flex items-center gap-2">✔ 1 Caissier</li>
      </ul>

      <!-- CTA -->
      <router-link
        to="/signup"
        class="block text-center mt-7 py-3 rounded-2xl 
              bg-gradient-to-r from-[#7BB661] to-[#004D4A] 
              text-white font-semibold shadow-lg
              hover:scale-105 transition-all duration-300
              active:scale-95"
      >
         Commencer maintenant
      </router-link>

    </div>

    <!-- PLATINUM -->
    <div class="p-6 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white">
      <span class="text-xs px-3 py-1 rounded-full bg-gray-300 text-black">PLATINUM</span>

      <h3 class="text-center text-xl mt-4 font-semibold 
           text-transparent bg-clip-text
           bg-gradient-to-r 
           from-gray-400 via-white to-gray-500
           drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      
      >PLATINUM</h3>

      <div class="text-center mt-6">
        <div class="line-through text-gray-400">$69.99</div>
        <div class="text-4xl font-bold">$59.99
           <span class="text-sm font-normal text-gray-400">/mois</span>
        </div>
      </div>

      <ul class="mt-6 text-sm text-gray-300 space-y-2">
        <li>✔ (Tout Premium) +</li>
        <li>✔ Ajout 2 points de vente</li>
        <li>✔ Multi-users</li>
      </ul>

      <router-link to="/signup"
        class="block text-center mt-6 py-3 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20">
        Commencer
      </router-link>
    </div>

 <!-- DIAMOND -->
    <div class="p-7 rounded-3xl relative overflow-hidden
                bg-white/10 backdrop-blur-3xl
                border border-cyan-300/40 text-white
                shadow-[0_20px_80px_rgba(0,0,0,0.6)]
                hover:shadow-[0_20px_120px_rgba(0,0,0,0.8)]
                transition-all duration-500">

      <!-- glow -->
      <div class="absolute inset-0 bg-cyan-300/10 blur-3xl opacity-30"></div>

      <!-- BADGE -->
      <span class="relative z-10 text-xs px-4 py-1 rounded-full 
                  bg-cyan-300 text-black font-semibold tracking-wide shadow-md">
        💎 DIAMOND
      </span>

      <!-- TITLE -->
      <div class="relative z-10 text-center mt-5">

        <!-- TITLE + BADGE -->
        <div class="flex items-center justify-center gap-2">

          <h3 class="relative text-xl font-semibold 
                    text-transparent bg-clip-text
                    bg-gradient-to-r from-gray-300 via-white to-gray-400
                    drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">

            DIAMOND

            <!-- underline -->
            <span class="absolute left-1/2 -translate-x-1/2 -bottom-2 w-16 h-[2px] 
                        bg-cyan-300 rounded-full blur-[1px]"></span>

          </h3>

          <!-- BADGE -->
          <span class="px-3 py-1 text-[10px] font-semibold rounded-full
                      bg-cyan-300 text-black
                      shadow-md shadow-cyan-300/30
                      tracking-wide">
            MAX
          </span>

        </div>

      </div>

      <!-- CUSTOM BADGE (REMPLACE PRIX) -->
      <div class="relative z-10 text-center mt-6">

        <div class="inline-block px-5 py-2 rounded-full
                    bg-gradient-to-r from-cyan-300/20 via-white/10 to-cyan-300/20
                    border border-cyan-300/30
                    text-cyan-200 font-medium text-sm
                    backdrop-blur-xl shadow-md">
               Personnaliser votre application
        </div>

      </div>

      <!-- DESCRIPTION -->
      <ul class="relative z-10 mt-6 text-sm text-gray-300 space-y-3 text-center">
        <li>DIAMOND Personnalisez <br> 
        chaque détail pour une application  <br> 
        qui vous ressemble vraiment. </li>
      
      </ul>

      <!-- CTA -->
    <a href="mailto:support@bilatech.org?subject=Demande%20offre%20DIAMOND&body=Bonjour,%20je%20souhaite%20personnaliser%20mon%20application."
      class="relative z-10 block text-center mt-8 py-3 rounded-2xl
              bg-white/10 backdrop-blur-xl
              border border-cyan-300/40
              text-white font-semibold
              transition-all duration-300
              hover:bg-cyan-300 hover:text-black hover:scale-[1.02]
              active:scale-[0.98]">

      Demander une offre

    </a>

    </div>

  </div>
</div>

<div class="relative py-24 flex justify-center bg-[#070A12] overflow-hidden">

  <!-- SAME BACKGROUND GLOW (comme pricing) -->
  <div class="absolute inset-0 
              bg-[radial-gradient(circle_at_top,rgba(123,182,97,0.18),transparent_60%)]">
  </div>

  <!-- CONTENT -->
  <div class="relative flex flex-col items-center gap-6 z-10">

    <!-- ICON -->
    <div class="p-3 rounded-2xl 
                bg-white/10 backdrop-blur-xl 
                border border-white/20 
                shadow-[0_10px_30px_rgba(0,0,0,0.4)]
                hover:scale-[1.05] transition">

      <img 
        src="/demo/bila_icon_512.png" 
        alt="BilaTech POS"
        class="w-20 h-20 rounded-xl object-cover"
      />
    </div>

    <!-- TEXT -->
    <p class="text-white/70 text-sm">
      Disponible sur votre appareil
    </p>

    <!-- BUTTON -->
    <button
      :disabled="downloading"
      @click="downloadApp"
      class="
        flex items-center gap-3 px-8 py-3 
        rounded-2xl 
        bg-white/10 backdrop-blur-xl 
        border border-white/20 
        text-white font-medium
        shadow-lg
        transition-all duration-300
        hover:bg-white/20 hover:scale-[1.03]
        active:scale-[0.97]
      "
    >
      <i class="pi pi-download text-lg"></i>

      <span>
        {{ downloading ? 'Téléchargement...' : 'Télécharger (v1.7.3)' }}
      </span>
    </button>

  </div>
</div>


<!-- FEEDBACK SECTION (iOS 26 PRO MAX) -->
<div class="relative mt-12 mb-16">

  <!-- glow background harmonisé (comme footer) -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#7BB661]/15 blur-[120px] rounded-full"></div>
    <div class="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#F9A825]/10 blur-[120px] rounded-full"></div>
  </div>

  <!-- TITLE -->
  <div class="text-center mb-6 relative z-10">
    <h3 class="text-2xl font-semibold text-white tracking-wide">
      💬 Laissez-nous un message
    </h3>
    <p class="text-gray-400 text-sm mt-1">
      Vos retours nous aident à améliorer BilaTech
    </p>
  </div>

  <!-- GLASS CARD -->
  <div class="relative z-10 max-w-2xl mx-auto
              bg-white/10 backdrop-blur-3xl
              border border-white/20
              rounded-3xl p-7
              shadow-[0_20px_80px_rgba(0,0,0,0.6)]
              hover:shadow-[0_20px_120px_rgba(0,0,0,0.8)]
              transition-all duration-500">

    <div class="space-y-4">

      <!-- EMAIL -->
      <input
        type="email"
        v-model="email"
        placeholder="Votre email"
        class="w-full px-4 py-3 rounded-2xl
               bg-white/5 text-white placeholder-gray-400
               border border-white/10
               focus:outline-none focus:border-[#7BB661]/60
               backdrop-blur-xl transition"
      />

      <!-- MESSAGE -->
      <textarea
        rows="4"
        v-model="comment"
        placeholder="Votre message..."
        class="w-full px-4 py-3 rounded-2xl
               bg-white/5 text-white placeholder-gray-400
               border border-white/10
               focus:outline-none focus:border-[#F9A825]/60
               backdrop-blur-xl transition resize-none"
      ></textarea>

      <!-- BUTTON IOS 26 -->
      <button
      @click="sendComment"
        class="w-full py-3 rounded-2xl font-semibold relative overflow-hidden
               bg-white/10 backdrop-blur-xl
               border border-white/20
               text-white shadow-lg
               transition-all duration-300
               hover:bg-white/20 hover:scale-[1.02]
               active:scale-[0.98]">
        
        <!-- glow line animation -->
        <!-- FEEDBACK MESSAGE -->
      <div v-if="errorMessage || successMessage"
          class="p-3 rounded-xl text-sm font-medium backdrop-blur-xl border transition-all duration-300"
          :class="errorMessage 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-green-500/10 border-green-500/30 text-green-400'">

        <span v-if="errorMessage">
          ⚠️ {{ errorMessage }}
        </span>

        <span v-if="successMessage">
          ✅ {{ successMessage }}
        </span>

      </div>

        <span class="absolute inset-0 bg-gradient-to-r from-[#7BB661]/0 via-white/20 to-[#F9A825]/0 opacity-40 animate-pulse"></span>


        <span class="relative z-10">
          Envoyer le message
        </span>

      </button>

    </div>

  </div>
</div>


<div class="relative mt-24 py-24 px-6 lg:px-24 bg-[#070A12] overflow-hidden">

  <!-- DYNAMIC GLOW BACKGROUND -->
  <div class="absolute inset-0 opacity-40 pointer-events-none">
    <div class="absolute w-[500px] h-[500px] bg-[#7BB661]/20 blur-[120px] rounded-full animate-float1"></div>
    <div class="absolute right-0 bottom-0 w-[400px] h-[400px] bg-[#F9A825]/20 blur-[120px] rounded-full animate-float2"></div>
  </div>

  <!-- GLASS CONTAINER -->
  <div class="relative z-10 
              bg-white/10 backdrop-blur-3xl 
              border border-white/20 
              rounded-3xl p-10 
              shadow-[0_20px_80px_rgba(0,0,0,0.6)]
              hover:shadow-[0_20px_120px_rgba(0,0,0,0.8)]
              transition-all duration-500">

    <!-- GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

      <!-- LOGO -->
      <div class="flex flex-col items-center md:items-start gap-4 group">

        <img src="/demo/bilatechblanc.png"
             class="h-16 transition duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" />

        <p class="text-gray-400 text-sm text-center md:text-left">
          Plateforme digitale intelligente pour la gestion moderne de votre business.
        </p>

      </div>

      <!-- CONTACT -->
      <div>
        <h4 class="footer-title">Contact</h4>
        <p class="footer-text">support@bilatech.org</p>
        <p class="footer-text">+243 992 937 586</p>
        <p class="footer-text">+243 811 465 276</p>
      </div>

      <!-- ADRESSE -->
      <div>
        <h4 class="footer-title">Adresse</h4>
        <p class="footer-text">Kinshasa, RDC</p>
        <p class="footer-text">Ngaliema</p>
        <p class="footer-text">Av. Niwa, N°25</p>
      </div>

      <!-- SOCIAL -->
      <div>
        <h4 class="footer-title">Communauté</h4>

        <div class="flex gap-4 mt-4">

          <a href="https://www.linkedin.com/company/bilatech-rdc/" class="social-icon group">
            <i class="pi pi-linkedin group-hover:scale-125 transition"></i>
          </a>

          <a href="https://www.instagram.com/bilatech_africa?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" class="social-icon group">
            <i class="pi pi-instagram group-hover:scale-125 transition"></i>
          </a>

          <a href="https://www.linkedin.com/company/bilatech-rdc/" class="social-icon group">
            <i class="pi pi-facebook group-hover:scale-125 transition"></i>
          </a>

        </div>
      </div>

      <!-- LEGAL -->
      <div>
        <h4 class="footer-title">Légal</h4>

        <a href="#" class="footer-link">Politique de marque</a>
        <a href="#" class="footer-link">Confidentialité</a>
        <a href="#" class="footer-link">Conditions</a>
        <a href="#" class="footer-link">Bilatech 2026</a>
      </div>

    </div>
    

    <!-- DIVIDER WITH LIGHT SWEEP -->
    <div class="relative mt-14 h-[1px] w-full overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <!-- animated light -->
      <div class="absolute inset-0 bg-gradient-to-r 
                  from-transparent via-white/60 to-transparent
                  animate-light-sweep opacity-40"></div>
    </div>

    <!-- COPYRIGHT -->
    <div class="mt-6 text-center text-gray-500 text-sm">
      © 2026 BilaTech — Tous droits réservés
    </div>

  </div>

</div>

  </div>
  </div>
</template>


<style scoped>
/*   section hero*/
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 1.2s ease,
    transform 6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(1.04);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

.ios-btn-primary {
  @apply relative px-8 py-3 rounded-2xl
  bg-white/10 backdrop-blur-xl
  border border-white/20
  text-white font-medium
  overflow-hidden
  transition-all duration-300
  hover:scale-[1.03];
}

.ios-btn-secondary {
  @apply px-8 py-3 rounded-2xl
  bg-white/5 backdrop-blur-xl
  border border-white/10
  text-white font-medium
  hover:bg-white/10
  transition-all;
}

/** fin de la section hero  */




/* sections nos application  */
.feature-card {
  @apply p-8 rounded-3xl 
         bg-white/10 backdrop-blur-2xl 
         border border-white/20 
         text-white 
         shadow-xl
         transition-all duration-300
         hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(255,255,255,0.12)];
}

.feature-card.featured {
  @apply scale-105 border-white/40 shadow-[0_0_60px_rgba(255,255,255,0.15)];
}

.icon-box {
  @apply w-14 h-14 mb-6 flex items-center justify-center 
         rounded-2xl backdrop-blur-xl border border-white/20;
}

.title-green {
  @apply text-xl font-semibold mb-2 text-[#7BB661];
}

.title-gold {
  @apply text-xl font-semibold mb-2 text-[#F9A825];
}

.title-white {
  @apply text-xl font-semibold mb-2 text-white;
}

.desc {
  @apply text-gray-300 leading-relaxed text-sm;
}

.glass-img {
  @apply p-5 rounded-3xl 
         bg-white/10 backdrop-blur-2xl 
         border border-white/20 
         shadow-xl 
         transition-all duration-300
         hover:scale-[1.05] hover:shadow-2xl;
}

.glass-img.featured {
  @apply scale-110 border-white/40 shadow-[0_0_60px_rgba(255,255,255,0.15)];
}


/* ANIMATIONS TEXTE */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title {
  opacity: 0;
  animation: fadeUp 1s ease forwards;
}

.hero-desc {
  opacity: 0;
  animation: fadeUp 1s ease forwards;
  animation-delay: 0.4s;
}

.hero-btns {
  opacity: 0;
  animation: fadeUp 1s ease forwards;
  animation-delay: 0.8s;
}
.bg-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.bg-slide.active {
  opacity: 1;
}

/* footer */

@keyframes float1 {
  0%,100% { transform: translate(0,0); }
  50% { transform: translate(30px, -30px); }
}

@keyframes float2 {
  0%,100% { transform: translate(0,0); }
  50% { transform: translate(-30px, 30px); }
}

.animate-float1 {
  animation: float1 12s ease-in-out infinite;
}

.animate-float2 {
  animation: float2 14s ease-in-out infinite;
}

/* LIGHT SWEEP (Apple effect) */
@keyframes lightSweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-light-sweep {
  animation: lightSweep 3s linear infinite;
}


.footer-title {
  @apply text-white font-semibold mb-4 text-lg;
}

.footer-text {
  @apply text-gray-400 text-sm mb-2;
}

.footer-link {
  @apply block text-gray-400 text-sm mb-2 
         transition-all duration-300
         hover:text-white hover:translate-x-1;
}

.social-icon {
  @apply w-10 h-10 flex items-center justify-center 
         rounded-xl bg-white/10 backdrop-blur-xl 
         border border-white/20 text-white/80
         transition-all duration-300
         hover:bg-white/20 hover:scale-110 
         hover:shadow-[0_0_15px_rgba(255,255,255,0.2)];
}

</style>