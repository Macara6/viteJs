import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [

        {   
            path: '/home',
            component: AppLayout,
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },     

                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
              
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },


                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },


                {
                    path: '/pages/produit',
                    name: 'Produit',
                    component: () => import('@/views/pages/Produit.vue'),
                     meta: { requiresAuth: true }
                },

                {
                    path:'/pages/invoice',
                    name:'Invoice',
                    component:() => import('@/views/pages/Invoice.vue'),
                     meta: { requiresAuth: true }
                },

                {
                    path:'/pages/utilisateur',
                    name:'Utilisateur',
                    component:() => import('@/views/pages/Utilisateur.vue'),
                     meta: { requiresAuth: true }
                },
                {
                    path:'/pages/statistique',
                    name:'Statistique',
                    component:() => import('@/views/pages/Statistique.vue'),
                     meta: { requiresAuth: true }
                },
                {
                    path:'/pages/bilan',
                    name:'Bilan',
                    component:() => import('@/views/pages/Bilan.vue'),
                    meta: { requiresAuth: true }

                },

                {
                    path:'/pages/vente',
                    name:'Vente',
                    component:() => import('@/views/pages/Vente.vue'),
                    meta: { requiresAuth: true }
                },

                {
                    path:'/pages/depotProduct',
                    name:'DepotProduct',
                    component:()=> import('@/views/pages/DepotProduct.vue')
                },
                
                {
                    path: '/pages/Employee',
                    name :'employee',
                    component: () => import('@/views/pages/Employee.vue')
                },
                {
                    path:'/pages/Boutique',
                    name:'Boutique',
                    component:() => import('@/views/pages/Boutique.vue'),
                    meta: { requiresAuth: true }
                    
                },
                {
                    path: '/user/:id',
                    name:'userDetail',
                    component: () => import('@/views/pages/UserDetail.vue')
                },
                {
                    path:'/pages/subscription/',
                    name:'Subscription',
                    component: () => import('@/views/pages/Subscription.vue')
                },

                {
                    path:'/pages/Notification/',
                    name:'Notification',
                    component:() => import('@/views/pages/Notification.vue'),
                     meta: { requiresAuth: true }
                },
                {
                    path:'/pages/CashOutListe',
                    name:'CashOutListe',
                    component:() => import('@/views/pages/CashOutListe.vue'),
                     meta: { requiresAuth: true }
                },
                {
                    path:'/pages/CreateCashout',
                    name:'CreateCashout',
                    component:() => import('@/views/pages/CreateCashout.vue')
                },
                {
                    path:'/pages/CreateEntryNote',
                    name:'CreateEntryNote',
                    component:() => import('@/views/pages/CreateEntryNote.vue')
                },
                  
                {
                    path:'/cashout/pdf/:id',
                    name:'PrintCashout',
                    component: () => import('@/views/pages/PrintCashout.vue'),
                     meta: { requiresAuth: true }
                },
                {
                    path:'/pages/EntryNoteList',
                    name:'EntryNote',
                    component: () => import('@/views/pages/EntryNoteList.vue')
                },
              
                
            ]
        },

        {
            path: '/',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
          path:'/reset',
          name:'reset',
          component: () => import('@/views/pages/ResetPassword.vue'),
        },

        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token') // récupère le JWT du localStorage

  // Si la route nécessite une authentification
  if (to.meta.requiresAuth) {
    if (token) {
      next() // autorisé
    } else {
      next({ name: 'login', query: { redirect: to.fullPath } }) // redirige vers login
    }
  } else {
    next() // route publique
  }
})

export default router;
