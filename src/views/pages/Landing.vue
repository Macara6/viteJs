<script setup>

import { sendCommentAPI } from '@/service/Api';
import { onBeforeUnmount, onMounted, ref } from 'vue';
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






//function payment(){
  //router.push("/Payment")
//}
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


const isMobileMenuOpen = ref(false);

function toggleMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function smoothScroll(target) {
  document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  isMobileMenuOpen.value = false;
}

function payment() {
  // ta logique existante
  isMobileMenuOpen.value = false;
}

const navItems = [
  { label: 'Accueil',      icon: 'pi pi-home',      action: () => smoothScroll('#hero') },
  { label: 'Services',     icon: 'pi pi-th-large',  action: () => smoothScroll('#features') },
  { label: 'POS',          icon: 'pi pi-desktop',   action: () => smoothScroll('#highlights') },
  { label: 'Tarifs',       icon: 'pi pi-tag',       action: () => smoothScroll('#pricing') },
  { label: 'Réabonnement', icon: 'pi pi-refresh',   action: () => payment() },
];

// gestion patie 1  hero
// ── Script ──────────────────────────────────────────
const heroRef = ref(null);
const currentIndex = ref(0);
const isRunning = ref(false);

const slides = [
  "/demo/medium-shot.jpg",
  "/demo/modern.jpg",
  "/demo/Photos-inf.png",
];

const heroImage = '/demo/busness.png' 

let interval = null;
let observer = null;

// Précharge les images suivantes
const preloadImage = (src) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

const goToSlide = (index) => {
  currentIndex.value = index;
  resetInterval();
};

const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % slides.length;
  preloadImage(slides[(currentIndex.value + 1) % slides.length]);
};

const resetInterval = () => {
  stopSlider();
  startSlider();
};

const startSlider = () => {
  if (interval) return;
  isRunning.value = false;
  setTimeout(() => {
    isRunning.value = true;
  }, 50);
  interval = setInterval(nextSlide, 6000);
};

const stopSlider = () => {
  clearInterval(interval);
  interval = null;
  isRunning.value = false;
};

const handleVisibility = () => {
  document.hidden ? stopSlider() : startSlider();
};


const highlightsRef = ref(null);
const highlightsVisible = ref(false);
let highlightsObserver = null;



const isPageLoading = ref(true);
const MIN_LOADER_TIME = 500;


function finishLoading(){
  isPageLoading.value = false;
}


function initPageLoader(){
  const startTime = performance.now();
  const firstImage = new Image();

  firstImage.src = slides[0];

  const stop = () =>{

    const elapsed = performance.now() - startTime;
    const remaining = Math.max(MIN_LOADER_TIME - elapsed, 0);
    setTimeout(finishLoading,remaining );
  }

    firstImage.onload = stop;
    firstImage.onerror = stop;

   setTimeout(finishLoading, 4000);

}

onMounted(() => {
  initPageLoader();
  // Précharge les 2 premières images suivantes
  preloadImage(slides[1]);
  preloadImage(slides[2]);

  observer = new IntersectionObserver(
    ([entry]) => {
      entry.isIntersecting ? startSlider() : stopSlider();
    },
    { threshold: 0.3 }
  );

  if (heroRef.value) observer.observe(heroRef.value);

  document.addEventListener('visibilitychange', handleVisibility);

    // Observer sur la section stats animationsection non applicaiotin 

  statsObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        startStatsAnimation();
        statsObserver?.disconnect();
      }
    },
    { threshold: 0.4 }
  );

  if (statsRef.value) {
    statsObserver.observe(statsRef.value);
  }
// fin 

// images mobile
  highlightsObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        highlightsVisible.value = true;
        highlightsObserver?.disconnect();
      }
    },
    { threshold: 0.2 }
  );

  if (highlightsRef.value) {
    highlightsObserver.observe(highlightsRef.value);
  }



});


onBeforeUnmount(() => {
  stopSlider();
  if (observer) observer.disconnect();
  document.removeEventListener('visibilitychange', handleVisibility);
  statsObserver?.disconnect();

});


// ── Stats animées ─────────────────────────────────────
const statsTargets = [500, 99.9, 24, 3];
const statsDecimals = [0, 1, 0, 0];
const statsSuffix = ['+', '%', '/7', ' pays'];
const animatedStats = ref(['0', '0', '0', '0']);
let statsObserver = null;
let hasAnimated = false;
const statsRef = ref(null);

const animateValue = (index, start, end, duration, decimals) => {
  const startTime = performance.now();

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing easeOutExpo
    const eased = progress === 1
      ? 1
      : 1 - Math.pow(2, -10 * progress);

    const current = start + (end - start) * eased;
    animatedStats.value[index] = decimals > 0
      ? current.toFixed(decimals)
      : Math.floor(current).toString();

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

const startStatsAnimation = () => {
  if (hasAnimated) return;
  hasAnimated = true;

  statsTargets.forEach((target, index) => {
    // Délai décalé pour chaque stat
    setTimeout(() => {
      animateValue(index, 0, target, 1800, statsDecimals[index]);
    }, index * 150);
  });
};



</script>

<template>

    <div class="bg-white text-gray-800 font-sans">


      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-500"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isPageLoading"
          class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
        >
          <!-- Décoration fond subtile -->
          <div class="absolute top-0 right-0 w-[400px] h-[400px] rounded-full
                      bg-[#004D4A]/5 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div class="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full
                      bg-[#004D4A]/5 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

          <!-- Logo -->
          <div class="relative z-10 flex flex-col items-center">
            <div class="relative mb-6">
              <div class="absolute inset-0 rounded-2xl bg-[#004D4A]/10 blur-xl scale-125"></div>
              <img
                src="/demo/bilasol_v5.webp"
                class="relative  h-12 mx-auto mb-4  rounded-2xl object-cover shadow-[0_8px_24px_rgba(0,77,74,0.15)]"
                alt="BilaTech"
              />
            </div>

            <!-- Spinner -->
            <div class="loader-spinner mb-4"></div>

            <!-- Texte -->
            <p class="text-sm font-medium text-slate-400 tracking-wide">
              Chargement en cours...
            </p>
          </div>

          <!-- Barre de progression bas d'écran -->
          <div class="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100 overflow-hidden">
            <div class="loader-bar"></div>
          </div>
        </div>
      </Transition>

     <div id="home" class="landing-wrapper overflow-visible">

          <div class="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] lg:w-[88%] z-50">

            <!-- NAVBAR PRINCIPALE -->
   <div class="flex items-center justify-between px-5 py-2.5
            rounded-2xl
            bg-white/70 backdrop-blur-2xl
            border border-slate-200/60
            shadow-[0_8px_32px_rgba(0,0,0,0.06)]">

  <!-- LOGO -->
  <a href="#" class="flex items-center flex-shrink-0">
    <img
      src="/demo/bilasol_v5.webp"
      class="h-9 md:h-10 w-auto object-contain"
    />
  </a>

  <!-- DESKTOP MENU -->
  <ul class="hidden lg:flex items-center gap-1">
    <li v-for="(item, index) in navItems" :key="index">
      <button
        type="button"
        @click="item.action()"
        class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600
              hover:text-slate-900 hover:bg-slate-100/80
              transition-all duration-200 cursor-pointer block
              bg-transparent border-none outline-none"
      >
        {{ item.label }}
      </button>
    </li>
  </ul>

  <!-- ACTIONS DESKTOP -->
  <div class="hidden lg:flex items-center gap-2 flex-shrink-0">
    <router-link
      to="/login"
      class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600
            hover:text-slate-900 hover:bg-slate-100/80
            transition-all duration-200"
    >
      Se connecter
    </router-link>

    <router-link
      to="/signup"
      class="px-5 py-2 rounded-full text-sm font-semibold text-white
            bg-[#004D4A] hover:bg-[#00615c] hover:scale-[1.02]
            transition-all duration-200"
    >
      Commencer →
    </router-link>
  </div>

  <!-- MOBILE BUTTON -->
  <button
    @click="toggleMenu"
    class="lg:hidden w-9 h-9 flex items-center justify-center
           rounded-xl bg-slate-100 border border-slate-200
           text-slate-700 transition hover:bg-slate-200"
  >
    <i :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-sm"></i>
  </button>

</div>

    <!-- MOBILE MENU -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="mt-2 p-5 rounded-2xl
               bg-black/40 backdrop-blur-2xl
               border border-white/20
               shadow-[0_8px_32px_rgba(0,0,0,0.4)]
               lg:hidden"
      >
        <!-- Liens -->

      <ul class="flex flex-col gap-1 mb-4">
        <li v-for="(item, index) in navItems" :key="index">
          <button
            type="button"
            @click="item.action()"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                  text-sm font-medium text-white/80
                  hover:text-white hover:bg-white/10
                  transition-all duration-200 cursor-pointer
                  bg-transparent border-none outline-none text-left"
          >
            <i :class="item.icon" class="text-xs text-white/50 w-4"></i>
            {{ item.label }}
          </button>
        </li>
      </ul>

        <div class="h-px bg-white/10 mb-4"></div>

        <!-- Boutons -->
        <div class="flex flex-col gap-2">
          <router-link
            to="/signup"
            class="py-3 text-center rounded-xl text-sm font-semibold text-white
                   bg-white/15 border border-white/25
                   hover:bg-white/25 transition-all duration-200"
          >
            Créer un compte
          </router-link>

          <router-link
            to="/login"
            class="py-3 text-center rounded-xl text-sm font-medium text-white/75
                   hover:text-white hover:bg-white/10
                   transition-all duration-200"
          >
            Se connecter
          </router-link>
        </div>

      </div>
    </Transition>

  </div>

  <section
  ref="heroRef"
  id="hero"
  class="relative overflow-hidden bg-white"
>
  <div class="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-24 lg:py-32">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">

      <!-- COLONNE TEXTE (GAUCHE) -->
      <div class="flex flex-col animate-hero-in">

        <!-- Eyebrow -->
        <p class="text-sm font-semibold text-[#004D4A] tracking-wide mb-5">
          BilaSol
        </p>

        <!-- Titre -->
        <h1 class="text-[2.75rem] sm:text-5xl md:text-6xl font-semibold text-slate-900 leading-[1.05] tracking-tight max-w-xl">
          Pilotez votre entreprise.
          <span class="block text-slate-400 mt-1">
            Plus simplement.
          </span>
        </h1>

        <!-- Description -->
        <p class="text-lg md:text-xl text-slate-500 mt-7 max-w-md leading-relaxed font-normal">
          Point de vente, logistique et suivi des stocks réunis
          dans une seule plateforme, pensée pour aller à l'essentiel.
        </p>

        <!-- CTA -->
        <div class="flex items-center gap-8 mt-10">
          <button
            @click="$router.push('/signup')"
            class="px-8 py-3.5 rounded-full text-[15px] font-semibold text-white
                  bg-[#004D4A] hover:bg-[#00615c]
                  transition-all duration-300 ease-out
                  hover:scale-[1.03] active:scale-[0.97]"
          >
            Démarrer gratuitement
          </button>

          <button
            @click="$router.push('/login')"
            class="group text-[15px] font-semibold text-[#004D4A]
                  transition-colors duration-200 hover:text-[#00332f]"
          >
            Se connecter
            <span class="inline-block transition-transform duration-200 group-hover:translate-x-1 ml-0.5">›</span>
          </button>
        </div>

        <!-- Points clés -->
    

      </div>

      <!-- COLONNE IMAGE (DROITE) -->
      <div class="relative flex items-center justify-center animate-hero-in-delayed">
        <img
          :src="heroImage"
          alt="Aperçu de la plateforme BilaSol"
          fetchpriority="high"
          loading="eager"
          decoding="async"
          class="w-full max-w-lg object-contain"
        />
      </div>

    </div>
  </div>
</section>

<!-- Animation simple via Tailwind CSS -->
<div id="features" class="relative py-18 lg:py-24 px-6 lg:px-20 bg-white">

  <!-- HEADER -->
  <div class="text-center max-w-2xl mx-auto mb-20">

    <p class="text-sm font-semibold text-[#004D4A] tracking-wide mb-4">
      Nos applications
    </p>

    <h2 class="text-4xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.1]">
      Des solutions pensées
      <span class="block text-slate-400 mt-1">pour votre croissance.</span>
    </h2>

    <p class="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
      Nous accompagnons les entreprises dans leur transformation digitale
      avec des outils fiables, performants et évolutifs.
    </p>

  </div>

  <!-- CARDS -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

    <!-- POS -->
    <div class="group rounded-3xl border border-slate-100 p-8 transition-all duration-300 hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

      <div class="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#004D4A]/8 mb-6">
        <i class="pi pi-calculator text-lg text-[#004D4A]"></i>
      </div>

      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-slate-900">POS</h3>
        <span class="text-xs font-medium text-emerald-600">
          Disponible
        </span>
      </div>

      <p class="text-[15px] text-slate-500 leading-relaxed">
        Une application complète pour la gestion des ventes, des stocks,
        de la facturation et de la comptabilité.
      </p>

    </div>

    <!-- COLIS -->
    <div class="group rounded-3xl border border-slate-100 p-8 transition-all duration-300 hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

      <div class="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 mb-6">
        <i class="pi pi-truck text-lg text-slate-400"></i>
      </div>

      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-slate-900">Logistique &amp; stocks</h3>
        <span class="text-xs font-medium text-slate-400">
          Bientôt
        </span>
      </div>

      <p class="text-[15px] text-slate-400 leading-relaxed">
        Suivi, livraison et gestion complète de vos colis en temps réel.
      </p>

    </div>

    <!-- ECOLE -->
    <div class="group rounded-3xl border border-slate-100 p-8 transition-all duration-300 hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

      <div class="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 mb-6">
        <i class="pi pi-briefcase text-lg text-slate-400"></i>
      </div>

      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-slate-900">Gestion écoles</h3>
        <span class="text-xs font-medium text-slate-400">
          Bientôt
        </span>
      </div>

      <p class="text-[15px] text-slate-400 leading-relaxed">
        Gestion des élèves, des notes, des présences et des paiements scolaires.
      </p>

    </div>

  </div>

  <!-- STATS BAND -->
  <div ref="statsRef" class="max-w-5xl mx-auto mt-24 pt-16 border-t border-slate-100">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-10">

      <div class="text-center">
        <div class="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight">
          {{ animatedStats[0] }}<span class="text-[#004D4A]">+</span>
        </div>
        <div class="text-sm text-slate-400 mt-2">Entreprises</div>
      </div>

      <div class="text-center">
        <div class="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight">
          {{ animatedStats[1] }}<span class="text-[#004D4A]">%</span>
        </div>
        <div class="text-sm text-slate-400 mt-2">Disponibilité</div>
      </div>

      <div class="text-center">
        <div class="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight">
          {{ animatedStats[2] }}<span class="text-[#004D4A]">/7</span>
        </div>
        <div class="text-sm text-slate-400 mt-2">Support</div>
      </div>

      <div class="text-center">
        <div class="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight">
          {{ animatedStats[3] }}
        </div>
        <div class="text-sm text-slate-400 mt-2">Pays de présence</div>
      </div>

    </div>
  </div>

</div>


<div id="highlights" class="relative py-18 lg:py-32 px-6 lg:px-20 bg-white">

  <!-- HEADER -->
  <div class="text-center max-w-2xl mx-auto mb-20">

    <p class="text-sm font-semibold text-[#004D4A] tracking-wide mb-4">
      Nouvelle génération · 2026
    </p>

    <h2 class="text-4xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.1]">
      Une gestion intelligente
      <span class="block text-slate-400 mt-1">avec Bila-Sol POS.</span>
    </h2>

    <p class="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
      Centralisez vos ventes, vos stocks et vos performances dans une
      plateforme fluide, rapide et conçue pour évoluer avec votre entreprise.
    </p>

  </div>

  <!-- IMAGES (disposition inchangée) -->
  <div ref="highlightsRef" class="relative z-10 max-w-5xl mx-auto mb-20">

    <div class="flex flex-col sm:flex-row justify-center items-end gap-6">

      <!-- Gauche -->
      <div class="highlight-card group"
           :class="highlightsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
           style="transition: all 0.6s ease 0s">
        <div class="highlight-img-wrap">
          <img
            src="/demo/pos_statistic.png"
            alt="Page connexion BilaSol"
            loading="lazy"
            decoding="async"
            class="w-full h-full object-cover object-top"
          />
        </div>
        <div class="highlight-label">
          <i class="pi pi-sliders-v text-xs"></i>
          Statistiques
        </div>
      </div>

      <!-- Centre (mis en avant) -->
      <div class="highlight-card highlight-card--featured group"
           :class="highlightsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
           style="transition: all 0.6s ease 0.15s">
        <div class="highlight-img-wrap highlight-img-wrap--featured">
          <img
            src="/demo/pos_interface.png"
            alt="Interface POS BilaSol"
            loading="lazy"
            decoding="async"
            class="w-full h-full object-cover object-top"
          />
        </div>
        <div class="highlight-label highlight-label--featured">
          <i class="pi pi-desktop text-xs"></i>
          Interface POS
        </div>
      </div>

      <!-- Droite -->
      <div class="highlight-card group"
           :class="highlightsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'"
           style="transition: all 0.6s ease 0.3s">
        <div class="highlight-img-wrap">
          <img
            src="/demo/pos_bilan.png"
            alt="Dashboard BilaSol"
            loading="lazy"
            decoding="async"
            class="w-full h-full object-cover object-top"
          />
        </div>
        <div class="highlight-label">
          <i class="pi pi-chart-bar text-xs"></i>
          Tableau de bord
        </div>
      </div>

    </div>

  </div>

  <!-- FEATURES GRID -->
  <div class="relative z-10 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 mb-24 pt-16 border-t border-slate-100">

    <div>
      <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-[#004D4A]/8">
        <i class="pi pi-bolt text-[#004D4A]"></i>
      </div>
      <h4 class="text-base font-semibold text-slate-900 mt-4">Rapide à déployer</h4>
      <p class="text-[15px] text-slate-500 mt-1.5 leading-relaxed">
        Opérationnel en moins de 24 heures, sans configuration complexe.
      </p>
    </div>

    <div>
      <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50">
        <i class="pi pi-sliders-h text-slate-500"></i>
      </div>
      <h4 class="text-base font-semibold text-slate-900 mt-4">Simple à utiliser</h4>
      <p class="text-[15px] text-slate-500 mt-1.5 leading-relaxed">
        Une interface intuitive, pensée pour tous les profils d'utilisateurs.
      </p>
    </div>

    <div>
      <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-50">
        <i class="pi pi-shield text-slate-500"></i>
      </div>
      <h4 class="text-base font-semibold text-slate-900 mt-4">Sécurisé et fiable</h4>
      <p class="text-[15px] text-slate-500 mt-1.5 leading-relaxed">
        Vos données restent protégées grâce à des sauvegardes automatiques
        et une disponibilité continue.
      </p>
    </div>

  </div>

  <!-- FOOTER TEXT -->
  <div class="relative z-10 text-center">
    <p class="inline-flex items-center gap-3 text-sm font-medium text-slate-400">
      <span>Gestion</span>
      <span class="w-1 h-1 rounded-full bg-slate-300"></span>
      <span>Performance</span>
      <span class="w-1 h-1 rounded-full bg-slate-300"></span>
      <span>Sécurité</span>
    </p>
  </div>

</div>
<div id="pricing" class="relative pt-8 pb-24 lg:pb-32 px-6 lg:px-20 bg-white">

  <!-- HEADER -->
  <div class="text-center max-w-2xl mx-auto mb-16">

    <p class="text-sm font-semibold text-[#004D4A] tracking-wide mb-4">
      Tarifs
    </p>

    <h2 class="text-4xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.1]">
      Tarifs simples,
      <span class="block text-slate-400 mt-1">puissants et transparents.</span>
    </h2>

    <p class="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
      Choisissez un plan adapté à votre business.
      <span class="font-semibold text-slate-700">Sans engagement, évolutif et flexible.</span>
    </p>

    <!-- Badge 30 jours -->
    <div class="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-emerald-50">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span class="text-sm text-emerald-700">
        Créez votre compte et profitez de
        <span class="font-bold">30 jours gratuits</span>
      </span>
    </div>

  </div>

  <!-- GRID TARIFS -->
 <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">

  <!-- ── BASIC ── -->
  <div class="flex flex-col h-full rounded-[28px] border border-slate-100 bg-white p-8 transition-all duration-300 hover:border-slate-200">
    <span class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
      Essentiel
    </span>

    <h3 class="text-lg font-semibold text-slate-900 mt-3">BASIC</h3>

    <div class="mt-6">
      <span class="text-sm text-slate-300 line-through">$19.99</span>
      <div class="text-3xl font-semibold text-slate-900 mt-1 tracking-tight">
        $9.99
        <span class="text-sm font-normal text-slate-400">/mois</span>
      </div>
    </div>

    <div class="h-px bg-slate-100 my-6"></div>

    <ul class="space-y-3.5 text-[14px] text-slate-500">
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Gestion des Ventes
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Gestion des Stocks
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Rapports journaliers
      </li>
    </ul>

    <router-link
      to="/signup"
      class="mt-auto pt-8 flex items-center justify-center w-full py-3 rounded-full text-sm font-medium
             text-slate-700 border border-slate-200
             transition-all duration-200 hover:border-slate-300"
    >
      Commencer
    </router-link>
  </div>

  <!-- ── MEDIUM ── -->
  <div class="flex flex-col h-full rounded-[28px] border border-slate-100 bg-white p-8 transition-all duration-300 hover:border-slate-200">
    <span class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
      Recommandé
    </span>

    <h3 class="text-lg font-semibold text-slate-900 mt-3">MEDIUM</h3>

    <div class="mt-6">
      <span class="text-sm text-slate-300 line-through">$29.99</span>
      <div class="text-3xl font-semibold text-slate-900 mt-1 tracking-tight">
        $19.99
        <span class="text-sm font-normal text-slate-400">/mois</span>
      </div>
    </div>

    <div class="h-px bg-slate-100 my-6"></div>

    <ul class="space-y-3.5 text-[14px] text-slate-500">
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> (Tout Basic) +
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Rapport et bilans quotidiens
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Accès aux historiques de ventes
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Accès aux statistiques en temps réel
      </li>
    </ul>

    <router-link
      to="/signup"
      class="mt-auto pt-8 flex items-center justify-center w-full py-3 rounded-full text-sm font-medium
             text-slate-700 border border-slate-200
             transition-all duration-200 hover:border-slate-300"
    >
      Commencer
    </router-link>
  </div>

  <!-- ── PREMIUM (featured) ── -->
<div class="relative flex flex-col h-full rounded-[28px] border-2 border-orange-400 bg-white p-8 shadow-[0_20px_50px_rgba(251,146,60,0.15)]">

  <span class="text-[11px] font-semibold tracking-widest text-orange-500 uppercase">
    Best value
  </span>

  <h3 class="text-lg font-semibold text-slate-900 mt-3">PREMIUM</h3>

  <div class="mt-6">
    <span class="text-sm text-slate-300 line-through">$49.99</span>
    <div class="text-4xl font-semibold text-slate-900 mt-1 tracking-tight">
      $39.99
      <span class="text-sm font-normal text-slate-400">/mois</span>
    </div>
  </div>

  <div class="h-px bg-slate-100 my-6"></div>

  <ul class="space-y-3.5 text-[14px] text-slate-500">
    <li class="flex items-start gap-2.5">
      <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> (Tout Medium) +
    </li>
    <li class="flex items-start gap-2.5">
      <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> 1 Point de vente
    </li>
    <li class="flex items-start gap-2.5">
      <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> 1 Admin
    </li>
    <li class="flex items-start gap-2.5">
      <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> 1 Caissier
    </li>
  </ul>

  <router-link
    to="/signup"
    class="mt-auto pt-8 flex items-center justify-center w-full py-3.5 rounded-full text-sm font-semibold text-white
           bg-orange-500 transition-all duration-200 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98]"
  >
    Commencer maintenant
  </router-link>
</div>

  <!-- ── PLATINUM ── -->
  <div class="flex flex-col h-full rounded-[28px] border border-slate-100 bg-white p-8 transition-all duration-300 hover:border-slate-200">
    <span class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
      Platinum
    </span>

    <h3 class="text-lg font-semibold text-slate-900 mt-3">PLATINUM</h3>

    <div class="mt-6">
      <span class="text-sm text-slate-300 line-through">$69.99</span>
      <div class="text-3xl font-semibold text-slate-900 mt-1 tracking-tight">
        $59.99
        <span class="text-sm font-normal text-slate-400">/mois</span>
      </div>
    </div>

    <div class="h-px bg-slate-100 my-6"></div>

    <ul class="space-y-3.5 text-[14px] text-slate-500">
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> (Tout Premium) +
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Ajout 2 points de vente
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Multi-users
      </li>
    </ul>

    <router-link
      to="/signup"
      class="mt-auto pt-8 flex items-center justify-center w-full py-3 rounded-full text-sm font-medium
             text-slate-700 border border-slate-200
             transition-all duration-200 hover:border-slate-300"
    >
      Commencer
    </router-link>
  </div>

  <!-- ── DIAMOND ── -->
  <div class="flex flex-col h-full rounded-[28px] border border-slate-100 bg-white p-8 transition-all duration-300 hover:border-slate-200">

    <span class="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
      Diamond max
    </span>

    <h3 class="text-lg font-semibold text-slate-900 mt-3">DIAMOND</h3>

    <p class="text-[14px] text-slate-500 leading-relaxed mt-6">
      Personnalisez chaque détail pour une application qui vous ressemble vraiment.
    </p>

    <div class="h-px bg-slate-100 my-6"></div>

    <ul class="space-y-3.5 text-[14px] text-slate-500">
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> (Tout Platinum) +
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Points de vente illimités
      </li>
      <li class="flex items-start gap-2.5">
        <i class="pi pi-check text-[11px] text-slate-300 mt-1"></i> Support dédié prioritaire
      </li>
    </ul>

    
     <a href="mailto:support@bilatech.org?subject=Demande%20offre%20DIAMOND&body=Bonjour,%20je%20souhaite%20personnaliser%20mon%20application."
      class="mt-auto pt-8 flex items-center justify-center w-full py-3 rounded-full text-sm font-medium
             text-slate-700 border border-slate-200
             transition-all duration-200 hover:border-slate-300"
    >
      Demander une offre
    </a>
  </div>

</div>

</div>

<div class="relative py-18 px-6 bg-white overflow-hidden">

  <!-- Décorations fond -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-[600px] h-[300px] rounded-full
              bg-[#004D4A]/5 blur-3xl pointer-events-none"></div>

  <!-- CONTENT -->
  <div class="relative z-10 max-w-md mx-auto flex flex-col items-center text-center gap-6">

    <!-- Card principale -->
    <div class="w-full p-8 rounded-3xl bg-white border-[1.5px] border-slate-100
                shadow-[0_8px_40px_rgba(0,77,74,0.08)]">

      <!-- Icône app -->
      <div class="flex justify-center mb-6">
        <div class="relative">
          <div class="absolute inset-0 rounded-2xl bg-[#004D4A]/10 blur-xl scale-110"></div>
          <img
            src="/demo/bila_icon_512.png"
            alt="BilaTech POS"
            class="relative w-20 h-20 rounded-2xl object-cover
                   shadow-[0_8px_24px_rgba(0,77,74,0.2)]
                   border-2 border-white"
          />
        </div>
      </div>

      <!-- Texte -->
      <h3 class="text-xl font-bold text-slate-800 tracking-tight">
        Bila-Sol POS
      </h3>

      <p class="text-sm text-slate-500 mt-1.5 leading-relaxed">
        Disponible sur votre appareil · Version 1.9.1
      </p>

      <!-- Badges store -->
      <div class="flex items-center justify-center gap-2 mt-4">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                     bg-[#004D4A]/8 border border-[#004D4A]/15
                     text-[#004D4A] text-xs font-semibold">
          <i class="pi pi-android text-xs"></i>
          Android
        </span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                     bg-slate-50 border border-slate-200
                     text-slate-500 text-xs font-semibold">
          <i class="pi pi-apple text-xs"></i>
          iOS bientôt
        </span>
      </div>

      <!-- Divider -->
      <div class="h-px bg-slate-100 my-6"></div>

      <!-- Bouton télécharger -->
      <button
        :disabled="downloading"
        @click="downloadApp"
        class="w-full flex items-center justify-center gap-3 px-8 py-3.5
               rounded-2xl font-semibold text-sm text-white
               bg-[#004D4A] hover:bg-[#006660]
               shadow-lg shadow-[#004D4A]/20
               hover:shadow-[#004D4A]/30 hover:scale-[1.02]
               active:scale-[0.98]
               transition-all duration-200
               disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
      >
        <i v-if="!downloading" class="pi pi-download text-base"></i>
        <i v-else class="pi pi-spin pi-spinner text-base"></i>
        <span>
          {{ downloading ? 'Téléchargement en cours...' : 'Télécharger l\'application' }}
        </span>
      </button>

      <!-- Info taille -->
      <p class="text-xs text-slate-400 mt-3">
        Fichier APK · Gratuit · Mis à jour régulièrement
      </p>

    </div>

    <!-- Features rapides -->
    <div class="grid grid-cols-3 gap-3 w-full">

      <div class="flex flex-col items-center gap-1.5 p-3 rounded-2xl
                  bg-white border border-slate-100 shadow-sm">
        <i class="pi pi-bolt text-[#004D4A] text-base"></i>
        <span class="text-xs font-semibold text-slate-700">Rapide</span>
      </div>

      <div class="flex flex-col items-center gap-1.5 p-3 rounded-2xl
                  bg-white border border-slate-100 shadow-sm">
        <i class="pi pi-shield text-[#004D4A] text-base"></i>
        <span class="text-xs font-semibold text-slate-700">Sécurisé</span>
      </div>

      <div class="flex flex-col items-center gap-1.5 p-3 rounded-2xl
                  bg-white border border-slate-100 shadow-sm">
        <i class="pi pi-wifi text-[#004D4A] text-base"></i>
        <span class="text-xs font-semibold text-slate-700">Hors ligne</span>
      </div>

    </div>

  </div>

</div>


<!-- FEEDBACK SECTION -->
<div class="relative py-20 px-6 bg-white overflow-hidden">

  <!-- Décoration fond -->
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-[500px] h-[300px] rounded-full
              bg-[#004D4A]/5 blur-3xl pointer-events-none"></div>

  <!-- HEADER -->
  <div class="relative z-10 text-center max-w-xl mx-auto mb-10">

    <span class="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full
                 bg-[#004D4A]/8 border border-[#004D4A]/20
                 text-[#004D4A] text-xs font-semibold tracking-widest uppercase">
      <span class="w-1.5 h-1.5 rounded-full bg-[#004D4A]"></span>
      Contact
    </span>

    <h3 class="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
      Laissez-nous un message
    </h3>
    <p class="text-slate-500 text-sm mt-2 leading-relaxed">
      Vos retours nous aident à améliorer BilaTech
    </p>

  </div>

  <!-- CARD FORMULAIRE -->
  <div class="relative z-10 max-w-xl mx-auto">
    <div class="bg-white rounded-3xl border border-slate-100
                shadow-[0_8px_40px_rgba(0,77,74,0.08)]
                p-8">

      <div class="space-y-4">

        <!-- EMAIL -->
        <div class="feedback-field-wrap">
          <label class="feedback-label">
            <i class="pi pi-envelope text-xs text-[#004D4A]"></i>
            Votre email
          </label>
          <input
            type="email"
            v-model="email"
            placeholder="exemple@email.com"
            class="feedback-input"
          />
        </div>

        <!-- MESSAGE -->
        <div class="feedback-field-wrap">
          <label class="feedback-label">
            <i class="pi pi-comment text-xs text-[#004D4A]"></i>
            Votre message
          </label>
          <textarea
            rows="4"
            v-model="comment"
            placeholder="Décrivez votre retour, suggestion ou problème..."
            class="feedback-input resize-none"
          ></textarea>
        </div>

        <!-- MESSAGE RETOUR -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="errorMessage || successMessage"
            class="flex items-start gap-2.5 p-3.5 rounded-2xl text-sm font-medium border"
            :class="errorMessage
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'"
          >
            <i
              :class="errorMessage
                ? 'pi pi-exclamation-triangle text-red-500'
                : 'pi pi-check-circle text-emerald-500'"
              class="text-base mt-0.5 flex-shrink-0"
            ></i>
            <span>{{ errorMessage || successMessage }}</span>
          </div>
        </Transition>

        <!-- BOUTON ENVOYER -->
        <button
          @click="sendComment"
          class="w-full flex items-center justify-center gap-2.5
                 py-3.5 rounded-2xl
                 bg-[#004D4A] hover:bg-[#006660]
                 text-white text-sm font-bold
                 shadow-lg shadow-[#004D4A]/20
                 hover:shadow-[#004D4A]/30
                 hover:scale-[1.02] active:scale-[0.98]
                 transition-all duration-200"
        >
          <i class="pi pi-send text-sm"></i>
          Envoyer le message
        </button>

      </div>

    </div>

    <!-- Note de bas de formulaire -->
    <p class="text-center text-xs text-slate-400 mt-4">
      <i class="pi pi-lock text-[10px] mr-1"></i>
      Vos données sont traitées de manière confidentielle
    </p>

  </div>

</div>

<div class="relative py-20 px-6 lg:px-24 bg-[#003836] overflow-hidden">

  <div class="relative z-10 max-w-7xl mx-auto">

    <!-- GRID PRINCIPAL -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 pb-14 border-b border-white/10">

      <!-- LOGO + DESC -->
      <div class="lg:col-span-2 flex flex-col gap-6">

        <!-- Plan dédié pour le logo -->
        <div class="relative inline-flex w-fit">
          <div class="absolute inset-0 -m-4 rounded-2xl bg-white"></div>
          <img
            src="/demo/bilatechblanc.png"
            class="relative h-20 md:h-39 w-auto object-contain"
            alt="BilaTech"
          />
        </div>

        <p class="text-white/50 text-sm leading-relaxed max-w-xs">
          Plateforme digitale intelligente pour la gestion moderne de votre business.<br/>
          Développé par Bilatech 
        </p>

        <!-- Réseaux sociaux -->
        <div class="flex items-center gap-2 mt-1">

          <a href="https://www.linkedin.com/company/bilatech-rdc/"
            target="_blank"
            class="flex items-center justify-center w-9 h-9 rounded-full
                   bg-white/5 text-white/60
                   transition-all duration-200 hover:bg-white/10 hover:text-white"
            title="LinkedIn"
          >
            <i class="pi pi-linkedin text-sm"></i>
          </a>

          <a href="https://www.instagram.com/bilatech_africa"
            target="_blank"
            class="flex items-center justify-center w-9 h-9 rounded-full
                   bg-white/5 text-white/60
                   transition-all duration-200 hover:bg-white/10 hover:text-white"
            title="Instagram"
          >
            <i class="pi pi-instagram text-sm"></i>
          </a>

          <a href="https://www.facebook.com"
            target="_blank"
            class="flex items-center justify-center w-9 h-9 rounded-full
                   bg-white/5 text-white/60
                   transition-all duration-200 hover:bg-white/10 hover:text-white"
            title="Facebook"
          >
            <i class="pi pi-facebook text-sm"></i>
          </a>

        </div>
      </div>

      <!-- CONTACT -->
      <div class="flex flex-col gap-4">
        <h4 class="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
          Contact
        </h4>
        <a href="mailto:support@bilatech.org" class="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white">
          <i class="pi pi-envelope text-xs text-white/30"></i>
          support@bilatech.org
        </a>
        <a href="tel:+243992937586" class="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white">
          <i class="pi pi-phone text-xs text-white/30"></i>
          +243 992 937 586
        </a>
        <a href="tel:+243811465276" class="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white">
          <i class="pi pi-phone text-xs text-white/30"></i>
          +243 811 465 276
        </a>
      </div>

      <!-- ADRESSE -->
      <div class="flex flex-col gap-4">
        <h4 class="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
          Adresse
        </h4>
        <div class="flex items-center gap-2.5 text-sm text-white/60">
          <i class="pi pi-map-marker text-xs text-white/30"></i>
          Kinshasa, RDC
        </div>
        <div class="flex items-center gap-2.5 text-sm text-white/60">
          <i class="pi pi-building text-xs text-white/30"></i>
          Ngaliema
        </div>
        <div class="flex items-center gap-2.5 text-sm text-white/60">
          <i class="pi pi-map text-xs text-white/30"></i>
          Av. Niwa, N°25
        </div>
      </div>

      <!-- LÉGAL -->
      <div class="flex flex-col gap-4">
        <h4 class="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
          Légal
        </h4>
        <a href="#" class="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white">
          <i class="pi pi-shield text-xs text-white/30"></i>
          Politique de marque
        </a>
        <a href="#" class="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white">
          <i class="pi pi-lock text-xs text-white/30"></i>
          Confidentialité
        </a>
        <a href="#" class="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white">
          <i class="pi pi-file text-xs text-white/30"></i>
          Conditions
        </a>
        <a href="#" class="flex items-center gap-2.5 text-sm text-white/60 transition-colors hover:text-white">
          <i class="pi pi-info-circle text-xs text-white/30"></i>
          Bilatech 2026
        </a>
      </div>

    </div>

    <!-- COPYRIGHT -->
    <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">

      <p class="text-white/35 text-xs">
        © 2026 BilaTech — Tous droits réservés
      </p>

      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-white/35 text-xs">
          Tous systèmes opérationnels
        </span>
      </div>

    </div>

  </div>

</div>


  </div>

  </div>
</template>


<style scoped>
/*   section loader */
/* À placer dans le <style> du composant, ou globalement */
@keyframes hero-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-hero-in {
  animation: hero-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.animate-hero-in-delayed {
  animation: hero-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
}
/*   fin de la section*/

.router-link-active:not([to="/login"]):not([to="/signup"]) {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}
/*   section image */

.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity 1.2s ease;
  position: absolute;
  inset: 0;
}

.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
}

.hero-fade-enter-to,
.hero-fade-leave-from {
  opacity: 1;
}

/*   fin */

/*   debut feature */

.feature-card {
    border-radius: 20px;
    border: 1.5px solid #f1f5f9;
    background-color: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    padding: 1.5rem;
    transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
    cursor: pointer;
}

.feature-card:hover {
    box-shadow: 0 12px 32px rgba(0, 77, 74, 0.1);
    transform: translateY(-4px);
    border-color: #004D4A33;
}

.feature-card-inner {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
}

.feature-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* Stats band */
.stat-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.25rem;
    border-radius: 16px;
    background-color: #fff;
    border: 1.5px solid #f1f5f9;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    text-align: center;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 800;
    color: #004D4A;
    letter-spacing: -0.03em;
    line-height: 1;
}

.stat-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #94a3b8;
    margin-top: 0.3rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/*   fin  */

/*   image mobile  */


/* ── Base card ── */
.pricing-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-radius: 24px;
    background-color: #fff;
    border: 1.5px solid #f1f5f9;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
    height: 100%;
}

.pricing-card:hover {
    box-shadow: 0 12px 32px rgba(0, 77, 74, 0.1);
    transform: translateY(-4px);
    border-color: rgba(0, 77, 74, 0.15);
}

/* Medium */
.pricing-card--medium {
    border-color: #f59e0b40;
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.08);
}
.pricing-card--medium:hover {
    border-color: #f59e0b80;
    box-shadow: 0 12px 32px rgba(245, 158, 11, 0.15);
}

/* Premium */
.pricing-card--premium {
    border-color: rgba(0, 77, 74, 0.3);
    box-shadow: 0 8px 30px rgba(0, 77, 74, 0.12);
    background: linear-gradient(145deg, #f0faf9, #ffffff);
    padding-top: 2rem;
}
.pricing-card--premium:hover {
    box-shadow: 0 20px 50px rgba(0, 77, 74, 0.18);
    transform: translateY(-6px);
}

/* Diamond */
.pricing-card--diamond {
    border-color: #a5f3fc40;
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.08);
}
.pricing-card--diamond:hover {
    border-color: #a5f3fc;
    box-shadow: 0 12px 32px rgba(6, 182, 212, 0.15);
}

/* ── Badge ── */
.pricing-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    width: fit-content;
}

/* ── Title ── */
.pricing-title {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    text-align: center;
}

/* ── Price ── */
.pricing-price-wrap {
    text-align: center;
    margin-top: 1.25rem;
}

.pricing-old-price {
    display: block;
    font-size: 0.8rem;
    color: #94a3b8;
    text-decoration: line-through;
    margin-bottom: 0.2rem;
}

.pricing-price {
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
}

.pricing-period {
    font-size: 0.8rem;
    font-weight: 400;
    color: #94a3b8;
}

/* ── Features ── */
.pricing-features {
    margin-top: 1.25rem;
    margin-bottom: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1;
}

.pricing-features li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: #475569;
    font-weight: 500;
}

/* ── CTA buttons ── */
.pricing-cta {
    display: block;
    text-align: center;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 700;
    transition: all 0.2s ease;
    margin-top: auto;
}

.pricing-cta--outline {
    background-color: transparent;
    border: 1.5px solid #e2e8f0;
    color: #475569;
}
.pricing-cta--outline:hover {
    background-color: #f8fafc;
    border-color: #004D4A;
    color: #004D4A;
}

.pricing-cta--amber {
    background-color: #f59e0b;
    color: #000;
}
.pricing-cta--amber:hover {
    background-color: #d97706;
    transform: scale(1.02);
}

.pricing-cta--teal {
    background-color: #004D4A;
    color: #fff;
    box-shadow: 0 4px 14px rgba(0, 77, 74, 0.3);
}
.pricing-cta--teal:hover {
    background-color: #006660;
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(0, 77, 74, 0.4);
}

.pricing-cta--cyan {
    background-color: #ecfeff;
    border: 1.5px solid #a5f3fc;
    color: #0e7490;
}
.pricing-cta--cyan:hover {
    background-color: #06b6d4;
    color: #fff;
    border-color: #06b6d4;
    transform: scale(1.02);
}
/* ── fin carte tarif── */




/* ── Image cards ── */
.highlight-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 220px;
}

.highlight-card--featured {
  max-width: 260px;
  margin-bottom: 0;
  position: relative;
  top: 0;
}

.highlight-img-wrap {
  width: 100%;
  aspect-ratio: 9/16;
  border-radius: 20px;
  overflow: hidden;
  border: 1.5px solid #f1f5f9;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  background-color: #f8fafc;
}

.highlight-card:hover .highlight-img-wrap {
  box-shadow: 0 16px 40px rgba(0, 77, 74, 0.12);
  transform: translateY(-4px);
}

.highlight-img-wrap--featured {
  border-color: #004D4A33;
  box-shadow: 0 16px 40px rgba(0, 77, 74, 0.12),
              0 0 0 4px rgba(0, 77, 74, 0.06);
}

.highlight-card:hover .highlight-img-wrap--featured {
  box-shadow: 0 24px 50px rgba(0, 77, 74, 0.18),
              0 0 0 4px rgba(0, 77, 74, 0.1);
}

.highlight-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
}

.highlight-label--featured {
  background-color: #004D4A;
  color: #fff;
  border-color: #004D4A;
}

/* ── Feature cards ── */
.highlight-feature {
  padding: 1.25rem;
  border-radius: 16px;
  background-color: #fff;
  border: 1.5px solid #f1f5f9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.highlight-feature:hover {
  box-shadow: 0 8px 20px rgba(0, 77, 74, 0.08);
  transform: translateY(-2px);
}

.highlight-feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

/*   fin image mobile  */

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

/** section commentaire */
.feedback-field-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.feedback-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.feedback-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
    background-color: #f8fafc;
    border: 1.5px solid #e2e8f0;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.feedback-input::placeholder {
    color: #94a3b8;
    font-weight: 400;
}

.feedback-input:focus {
    border-color: #004D4A;
    box-shadow: 0 0 0 3px rgba(0, 77, 74, 0.08);
    background-color: #fff;
}

/** fin commentaire  */

/**  footer */


.footer-heading {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 0.25rem;
}

.footer-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.65);
    transition: color 0.2s ease;
    text-decoration: none;
}

.footer-link:hover {
    color: rgba(255, 255, 255, 1);
}

.footer-link i {
    color: rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
}

.footer-social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;
}

.footer-social-btn:hover {
    background-color: rgba(255, 255, 255, 0.18);
    color: #fff;
    transform: translateY(-2px);
}

/**  Fin footer */


</style>