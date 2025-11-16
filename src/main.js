import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import 'primeicons/primeicons.css';


const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});

const primevue = app.config.globalProperties.$primevue;
primevue.config.locale = {
  firstDayOfWeek: 1,
  dayNames: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  dayNamesShort: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"],
  dayNamesMin: ["D", "L", "M", "M", "J", "V", "S"],
  monthNames: [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ],
  monthNamesShort: [
    "jan", "fév", "mar", "avr", "mai", "jun",
    "jul", "aoû", "sep", "oct", "nov", "déc"
  ],
  today: "Aujourd’hui",
  clear: "Effacer"
};

app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
