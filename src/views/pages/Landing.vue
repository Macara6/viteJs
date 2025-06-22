<script setup>
function smoothScroll(id) {
    document.body.click();
    document.querySelector(id).scrollIntoView({
        behavior: 'smooth'
    });
}
</script>

<template>
    <div class="bg-surface-0 dark:bg-surface-900">
        <div id="home" class="landing-wrapper overflow-hidden">
            <div class="py-6 px-6 mx-0 md:mx-12 lg:mx-20 lg:px-20 flex items-center justify-between relative lg:static">
                <a class="flex items-center" href="#">
                   
                    <img src="/demo/bila.png" alt="BilaTech Logo" class="h-40 mx-auto mb-4" />
                </a>
                <Button
                    class="lg:!hidden"
                    text
                    severity="secondary"
                    rounded
                    v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                >
                    <i class="pi pi-bars !text-2xl"></i>
                </Button>
                <div class="items-center bg-surface-0 dark:bg-surface-900 grow justify-between hidden lg:flex absolute lg:static w-full left-0 top-full px-12 lg:px-0 z-20 rounded-border">
                    <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-8">
                        <li>
                            <a @click="smoothScroll('#hero')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                                <span>Home</span>
                            </a>
                        </li>
                        <li>
                            <a @click="smoothScroll('#features')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                                <span>Services</span>
                            </a>
                        </li>
                        <li>
                            <a @click="smoothScroll('#highlights')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                                <span>POS</span>
                            </a>
                        </li>
                        <li>
                            <a @click="smoothScroll('#pricing')" class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                                <span>Fonctionnalités</span>
                            </a>
                        </li>
                    </ul>
                    <div class="flex border-t lg:border-t-0 border-surface py-4 lg:py-0 mt-4 lg:mt-0 gap-2">
                        <Button label="se connecter" text as="router-link" to="/login" rounded></Button>
                      
                    </div>
                </div>
            </div>

            <div
                id="hero"
                class="flex flex-col pt-6 px-6 lg:px-20 overflow-hidden"
                style="background: linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, rgb(238, 239, 175) 0%, rgb(195, 227, 250) 100%); clip-path: ellipse(150% 87% at 93% 13%)"
            >
            <div class="mx-6 md:mx-20 mt-0 md:mt-6">
                <h1 class="text-6xl font-bold text-gray-900 leading-tight">
                    <span class="font-light block">Bienvenue sur</span>
                    Bilatech Solution
                </h1>
                <p class="font-normal text-2xl leading-normal md:mt-4 text-gray-700">
                    Bilatech Solution est une plateforme technologique innovante dédiée à la gestion et solution numerique d'entreprise , 
                    proposant des outils efficaces pour la facturation, le suivi des stocks, la comptabilité, 
                    et l’analyse des performances.Elle facilite la transition numérique 
                    en offrant des solutions simples, rapides et accessibles.
                </p>
                <Button label="Se connecter" as="router-link" to="/login" rounded class="!text-xl mt-8 !px-4"></Button>
            </div>

            <div class="flex justify-center md:justify-end">
                 <img src="/demo/images/landing/hero-stock.webp" alt="Hero Image" class="h-70 md:w-90" />
             </div>
            </div>

            <div id="features" class="py-6 px-6 lg:px-20 mt-8 mx-0 lg:mx-20">
                <div class="grid grid-cols-12 gap-4 justify-center">
                    <div class="col-span-12 text-center mt-20 mb-6">
                        <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl">Nos Services</div>
                        <span class="text-muted-color text-2xl">Des solutions adaptées pour chaque besoin</span>
                    </div>

                    <div class="col-span-12 md:col-span-12 lg:col-span-4 p-0 lg:pr-8 lg:pb-8 mt-6 lg:mt-0">
                        <div
                            style="height: 160px; padding: 2px; border-radius: 10px; background: linear-gradient(90deg, rgba(253, 228, 165, 0.2), rgba(187, 199, 205, 0.2)), linear-gradient(180deg, rgba(253, 228, 165, 0.2), rgba(187, 199, 205, 0.2))"
                        >
                            <div class="p-4 bg-surface-0 dark:bg-surface-900 h-full" style="border-radius: 8px">
                                <div class="flex items-center justify-center bg-yellow-200 mb-4" style="width: 3.5rem; height: 3.5rem; border-radius: 10px">
                                    <i class="pi pi-fw pi-book !text-2xl text-yellow-700"></i>
                                </div>

                                <h5 class="mb-2 text-surface-900 dark:text-surface-0">Formation</h5>
                                <span class="text-surface-700 dark:text-surface-200">Des sessions de formation adaptées à vos besoins techniques et métiers.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-12 lg:col-span-4 p-0 lg:pr-8 lg:pb-8 mt-6 lg:mt-0">
                        <div
                            style="height: 160px; padding: 2px; border-radius: 10px; background: linear-gradient(90deg, rgba(145, 226, 237, 0.2), rgba(251, 199, 145, 0.2)), linear-gradient(180deg, rgba(253, 228, 165, 0.2), rgba(172, 180, 223, 0.2))"
                        >
                            <div class="p-4 bg-surface-0 dark:bg-surface-900 h-full" style="border-radius: 8px">
                                <div class="flex items-center justify-center bg-cyan-200 mb-4" style="width: 3.5rem; height: 3.5rem; border-radius: 10px">
                                    <i class="pi pi-fw pi-code !text-2xl text-cyan-700"></i>
                                </div>
                                <h5 class="mb-2 text-surface-900 dark:text-surface-0">Développement</h5>
                                <span class="text-surface-600 dark:text-surface-200">Applications web, mobiles sur mesure et Descktop robustes et évolutives.</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-12 lg:col-span-4 p-0 lg:pb-8 mt-6 lg:mt-0">
                        <div
                            style="height: 160px; padding: 2px; border-radius: 10px; background: linear-gradient(90deg, rgba(145, 226, 237, 0.2), rgba(172, 180, 223, 0.2)), linear-gradient(180deg, rgba(172, 180, 223, 0.2), rgba(246, 158, 188, 0.2))"
                        >
                            <div class="p-4 bg-surface-0 dark:bg-surface-900 h-full" style="border-radius: 8px">
                                <div class="flex items-center justify-center bg-indigo-200" style="width: 3.5rem; height: 3.5rem; border-radius: 10px">
                                    <i class="pi pi-fw pi-wrench !text-2xl text-indigo-700"></i>
                                </div>
                                <div class="mt-6 mb-1 text-surface-900 dark:text-surface-0 text-xl font-semibold">Suivi & Maintenance</div>
                                <span class="text-surface-600 dark:text-surface-200">Support technique, maintenance corrective et évolutive de vos projets.</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-12 lg:col-span-4 p-0 lg:pr-8 lg:pb-8 mt-6 lg:mt-0">
                        <div
                            style="height: 160px; padding: 2px; border-radius: 10px; background: linear-gradient(90deg, rgba(187, 199, 205, 0.2), rgba(251, 199, 145, 0.2)), linear-gradient(180deg, rgba(253, 228, 165, 0.2), rgba(145, 210, 204, 0.2))"
                        >
                            <div class="p-4 bg-surface-0 dark:bg-surface-900 h-full" style="border-radius: 8px">
                                <div class="flex items-center justify-center bg-slate-200 mb-4" style="width: 3.5rem; height: 3.5rem; border-radius: 10px">
                                    <i class="pi pi-fw pi-shopping-cart  !text-2xl text-slate-700"></i>
                                </div>
                                <div class="mt-6 mb-1 text-surface-900 dark:text-surface-0 text-xl font-semibold">E-commerce</div>
                                <span class="text-surface-600 dark:text-surface-200">réation de boutiques en ligne performantes et sécurisées.</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-span-12 md:col-span-12 lg:col-span-4 p-0 lg:pr-8 lg:pb-8 mt-6 lg:mt-0">
                        <div
                            style="height: 160px; padding: 2px; border-radius: 10px; background: linear-gradient(90deg, rgba(187, 199, 205, 0.2), rgba(246, 158, 188, 0.2)), linear-gradient(180deg, rgba(145, 226, 237, 0.2), rgba(160, 210, 250, 0.2))"
                        >
                            <div class="p-4 bg-surface-0 dark:bg-surface-900 h-full" style="border-radius: 8px">
                                <div class="flex items-center justify-center bg-orange-200 mb-4" style="width: 3.5rem; height: 3.5rem; border-radius: 10px">
                                    <i class="pi pi-fw pi-briefcase !text-2xl text-orange-700"></i>
                                </div>
                                <div class="mt-6 mb-1 text-surface-900 dark:text-surface-0 text-xl font-semibold">Suivi des projets</div>
                                <span class="text-surface-600 dark:text-surface-200">Un accompagnement de bout en bout pour assurer la réussite de vos projets.</span>
                            </div>
                        </div>
                    </div>

                 

                 

                



                    <div
                        class="col-span-12 mt-20 mb-20 p-2 md:p-20"
                        style="border-radius: 20px; background: linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)), radial-gradient(77.36% 256.97% at 77.36% 57.52%, #efe1af 0%, #c3dcfa 100%)"
                    >
                        <div class="flex flex-col justify-center items-center text-center px-4 py-4 md:py-0">
                            <div class="text-gray-900 mb-2 text-3xl font-semibold">Prenez le contrôle de votre business avec notre application POS</div>
                            <span class="text-gray-600 text-2xl">Peak Interactive</span>
                            <p class="text-gray-900 sm:line-height-2 md:line-height-4 text-2xl mt-6" style="max-width: 800px">
                                Gérez vos ventes, vos stocks, vos paiements et vos factures en toute simplicité. Notre solution POS vous offre un tableau de bord clair, une impression rapide de tickets, une gestion multi-devises, et un suivi en temps réel.
                            </p>
                            <img src="/demo/images/landing/peak-logo.svg" class="mt-6" alt="Company logo" />
                        </div>
                    </div>

                </div>
            </div>

            <div id="highlights" class="py-6 px-6 lg:px-20 mx-0 my-12 lg:mx-20">
                <div class="text-center">
                    <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl">BilaTech POS</div>
                    <span class="text-muted-color text-2xl"> Gérez facilement vos ventes, stocks et tickets depuis votre mobile</span>
                </div>

                <div class="grid grid-cols-12 gap-4 mt-20 pb-2 md:pb-20">
                    <div class="flex justify-center col-span-12 lg:col-span-6 bg-purple-100 p-0 order-1 lg:order-none" style="border-radius: 8px">
                        <img src="/demo/images/landing/mockup.svg" class="w-11/12" alt="mockup mobile" />
                    </div>

                    <div class="col-span-12 lg:col-span-6 my-auto flex flex-col lg:items-end text-center lg:text-right gap-4">
                        <div class="flex items-center justify-center bg-purple-200 self-center lg:self-end" style="width: 4.2rem; height: 4.2rem; border-radius: 10px">
                            <i class="pi pi-fw pi-mobile !text-4xl text-purple-700"></i>
                        </div>

                        <div class="leading-none text-surface-900 dark:text-surface-0 text-3xl font-normal"> Consultez les résultats de vos ventes à distance, en temps réel</div>
                        <span class="text-surface-700 dark:text-surface-100 text-2xl leading-normal ml-0 md:ml-2" style="max-width: 650px"
                            >  Suivez vos performances commerciales où que vous soyez : ventes, produits, paiements et statistiques sont accessibles en un clic depuis votre appareil.</span
                        >
                    </div>
                </div>


 

                <div class="grid grid-cols-12 gap-4 my-20 pt-2 md:pt-20">
                    <div class="col-span-12 lg:col-span-6 my-auto flex flex-col text-center lg:text-left lg:items-start gap-4">
                        <div class="flex items-center justify-center bg-yellow-200 self-center lg:self-start" style="width: 4.2rem; height: 4.2rem; border-radius: 10px">
                            <i class="pi pi-fw pi-desktop !text-3xl text-yellow-700"></i>
                        </div>
                        <div class="leading-none text-surface-900 dark:text-surface-0 text-3xl font-normal">Une interface simple, intuitive et rapide à prendre en main</div>
                        <span class="text-surface-700 dark:text-surface-100 text-2xl leading-normal mr-0 md:mr-2" style="max-width: 650px"
                            >Profitez d’une expérience utilisateur fluide, pensée pour tous les profils : gérez vos ventes, vos produits et vos rapports sans complexité, même sans formation technique.</span
                        >
                    </div>

                    <div class="flex justify-end order-1 sm:order-2 col-span-12 lg:col-span-6 bg-yellow-100 p-0" style="border-radius: 8px">
                        <img src="/demo/images/landing/mockup-desktop.svg" class="w-11/12" alt="mockup" />
                    </div>
                </div>
            </div>

           




                  

            <div id="pricing" class="py-6 px-6 lg:px-20 my-2 md:my-6">
                <div class="text-center mb-6">
                    <div class="text-surface-900 dark:text-surface-0 font-normal mb-2 text-4xl">Types d'abonnement</div>
                    <span class="text-muted-color text-2xl">Choisissez la formule qui correspond le mieux à vos besoins et à la taille de votre entreprise.</span>
                </div>

                <div class="grid grid-cols-12 gap-4 justify-between mt-20 md:mt-0">
                    <div class="col-span-12 lg:col-span-4 p-0 md:p-4">
                        <div class="p-4 flex flex-col border-surface-200 dark:border-surface-600 pricing-card cursor-pointer border-2 hover:border-primary duration-300 transition-all" style="border-radius: 10px">
                            <div class="text-surface-900 dark:text-surface-0 text-center my-8 text-3xl">BASIC</div>

                            <div class="text-surface-900 dark:text-surface-0 text-center my-8 text-10xl flex justify-center items-center gap-2">
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i> <br>
                                
                            </div>
                                
                            <Divider class="w-full bg-surface-200"></Divider>
                            <div class="my-8 flex flex-col items-center gap-4">
                                <div class="flex items-center">
                                    <span class="text-5xl font-bold mr-2 text-surface-900 dark:text-surface-0">$19.99</span>
                                    <span class="text-surface-600 dark:text-surface-200">/ Mois</span>
                                </div>
                                <Button label="Commencer" class="p-button-rounded border-0 ml-4 font-light leading-tight bg-blue-500 text-white"></Button>
                            </div>
                            <Divider class="w-full bg-surface-200"></Divider>
                            <ul class="my-8 list-none p-0 flex text-surface-900 dark:text-surface-0 flex-col px-8">
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Gestion des ventes</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Gestion des stocks</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Rapports journaliers</span>
                                </li>
                             
                            </ul>
                          
                        </div>
                    </div>

                    <div class="col-span-12 lg:col-span-4 p-0 md:p-4 mt-6 md:mt-0">
                        <div class="p-4 flex flex-col border-surface-200 dark:border-surface-600 pricing-card cursor-pointer border-2 hover:border-primary duration-300 transition-all" style="border-radius: 10px">
                            <div class="text-surface-900 dark:text-surface-0 text-center my-8 text-3xl">MEDIUM</div>
                            
                            <div class="text-surface-900 dark:text-surface-0 text-center my-8 text-10xl flex justify-center items-center gap-2">
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i> 
                                
                            </div>

                            <Divider class="w-full bg-surface-200"></Divider>
                            <div class="my-8 flex flex-col items-center gap-4">
                                <div class="flex items-center">
                                    <span class="text-5xl font-bold mr-2 text-surface-900 dark:text-surface-0">$29,99</span>
                                    <span class="text-surface-600 dark:text-surface-200">/Mois</span>
                                </div>
                                <Button label="Commencer" class="p-button-rounded border-0 ml-4 font-light leading-tight bg-blue-500 text-white"></Button>
                            </div>
                            <Divider class="w-full bg-surface-200"></Divider>
                            <ul class="my-8 list-none p-0 flex text-surface-900 dark:text-surface-0 flex-col px-8">
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Gestion avancée des ventes</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Suivi de stock en temps réel</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Rapports et bilans quotidiens</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Accès aux statistiques en direct</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="col-span-12 lg:col-span-4 p-0 md:p-4 mt-6 md:mt-0">
                        <div class="p-4 flex flex-col border-surface-200 dark:border-surface-600 pricing-card cursor-pointer border-2 hover:border-primary duration-300 transition-all" style="border-radius: 10px">
                            <div class="text-surface-900 dark:text-surface-0 text-center my-8 text-3xl">PREMIUM</div>
                            

                            <div class="text-surface-900 dark:text-surface-0 text-center my-4 flex justify-center items-center gap-2">
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                                <i class="pi pi-star-fill text-yellow-400 text-5xl"></i>
                            </div>

                            <Divider class="w-full bg-surface-200"></Divider>
                            <div class="my-8 flex flex-col items-center gap-4">
                                <div class="flex items-center">
                                    <span class="text-5xl font-bold mr-2 text-surface-900 dark:text-surface-0">$49,99</span>
                                    <span class="text-surface-600 dark:text-surface-200">/Mois</span>
                                </div>
                                <Button label="Commencer" class="p-button-rounded border-0 ml-4 font-light leading-tight bg-blue-500 text-white"></Button>
                            </div>
                            <Divider class="w-full bg-surface-200"></Divider>
                            <ul class="my-8 list-none p-0 flex text-surface-900 dark:text-surface-0 flex-col px-8">
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Gestion avancée des ventes</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Suivi de stock en temps réel</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Rapports et bilans quotidiens</span>
                                </li>

                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Accès aux statistiques en direct</span>
                                </li>
                                <li class="py-2">
                                    <i class="pi pi-fw pi-check text-xl text-cyan-500 mr-2"></i>
                                    <span class="text-xl leading-normal">Accès aux historiques des ventes en direct</span>
                                </li>
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
                            <img src="/demo/bila.png" alt="BilaTech Logo" class="h-30 mx-auto md:mx-0" />
                        </a>
                    </div>

                    <!-- Links -->
                    <div class="col-span-12 md:col-span-10">
                        <div class="grid grid-cols-12 gap-8 text-center md:text-left">
                            
                            <!-- Contact -->
                            <div class="col-span-12 md:col-span-3">
                                <h4 class="font-semibold text-xl mb-4">Contact</h4>
                                <p class="text-lg mb-2">Email : bilatech@bilatech.org</p>
                                <p class="text-lg mb-2">Téléphone : +243 992 937 586</p>
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
