

<script setup>
import { fetchProduits } from "@/service/Api";
import { onMounted, ref } from "vue";



const lowStockProducts = ref([]);
const expiringSoonProducts = ref([]);
const userId = localStorage.getItem("id");



onMounted(async () => {

    await loadLowStockAndExpiringProducts();
});

async function loadLowStockAndExpiringProducts(){

    try {
        const products = await fetchProduits(userId);
        lowStockProducts.value = products.filter( p => p.stock < 10)
        
        const now = new Date();
        const twoDayslater = new Date();
        twoDayslater.setDate(now.getDate()+30);

        expiringSoonProducts.value = products.filter((p) => {
          if(!p.expiration_date) return false;
            const expDate = new Date(p.expiration_date);
            return expDate >= now && expDate <= twoDayslater;
        });
       

    }catch(error){
        console.error('Erreur chargement des produits faible stocks', error);

    }
}

</script>
<template>
  <div class="alerts-page">
    <!-- En-tête -->
    <div class="page-header">
      <div class="header-title-group">
        <div class="header-icon">
          <i class="pi pi-bell"></i>
        </div>
        <div>
          <h1 class="page-title">Alertes Produits</h1>
          <p class="page-subtitle">Surveillance des stocks et des dates d'expiration</p>
        </div>
      </div>

      <div
        v-if="lowStockProducts.length + expiringSoonProducts.length > 0"
        class="total-badge"
      >
        <i class="pi pi-exclamation-triangle"></i>
        {{ lowStockProducts.length + expiringSoonProducts.length }} alerte{{ (lowStockProducts.length + expiringSoonProducts.length) > 1 ? 's' : '' }}
      </div>
      <div v-else class="total-badge total-badge-ok">
        <i class="pi pi-check"></i>
        Tout est sous contrôle
      </div>
    </div>

    <!-- Grille : faible stock (gauche) / expiration (droite) -->
    <div class="alerts-grid">
      <!-- Produits à faible stock -->
      <section class="alert-card">
        <div class="alert-card-header">
          <div class="alert-card-title">
            <div class="alert-icon alert-icon-red">
              <i class="pi pi-box"></i>
            </div>
            <div>
              <h2 class="alert-heading">Faible stock</h2>
              <span class="alert-subheading">Produits sous le seuil critique</span>
            </div>
          </div>
          <span class="count-badge count-badge-red">{{ lowStockProducts.length }}</span>
        </div>

        <div v-if="lowStockProducts.length === 0" class="empty-state empty-state-ok">
          <i class="pi pi-check-circle"></i>
          Aucun produit à faible stock
        </div>

        <ul v-else class="alert-list">
          <li v-for="p in lowStockProducts" :key="p.id" class="alert-item alert-item-red">
            <div class="alert-item-main">
              <span class="alert-item-name">{{ p.name }}</span>
              <span class="alert-item-tag alert-item-tag-red">
                <i class="pi pi-arrow-down"></i>
                Stock : {{ p.stock }}
              </span>
            </div>
          </li>
        </ul>
      </section>

      <!-- Produits expirant bientôt -->
      <section class="alert-card">
        <div class="alert-card-header">
          <div class="alert-card-title">
            <div class="alert-icon alert-icon-yellow">
              <i class="pi pi-clock"></i>
            </div>
            <div>
              <h2 class="alert-heading">Expiration proche</h2>
              <span class="alert-subheading">Produits proches de leur date limite</span>
            </div>
          </div>
          <span class="count-badge count-badge-yellow">{{ expiringSoonProducts.length }}</span>
        </div>

        <div v-if="expiringSoonProducts.length === 0" class="empty-state empty-state-ok">
          <i class="pi pi-check-circle"></i>
          Aucun produit proche de la date d'expiration
        </div>

        <ul v-else class="alert-list">
          <li v-for="p in expiringSoonProducts" :key="p.id" class="alert-item alert-item-yellow">
            <div class="alert-item-main">
              <div class="alert-item-info">
                <span class="alert-item-name">{{ p.name }}</span>
                <span class="alert-item-date">
                  <i class="pi pi-calendar"></i>
                  Expire le {{ new Date(p.expiration_date).toLocaleDateString() }}
                </span>
              </div>
              <span class="alert-item-tag alert-item-tag-yellow">
                Stock : {{ p.stock }}
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.alerts-page {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
}

/* --- En-tête --- */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.header-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0.15rem 0 0;
}

.total-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
}

.total-badge-ok {
  background: #dcfce7;
  color: #15803d;
}

/* --- Grille des cartes --- */
.alerts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media screen and (min-width: 1024px) {
  .alerts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.alert-card {
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.alert-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
}

.alert-card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.alert-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.alert-icon-red {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.alert-icon-yellow {
  background: rgba(217, 119, 6, 0.1);
  color: #d97706;
}

.alert-heading {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.alert-subheading {
  font-size: 0.78rem;
  color: #9ca3af;
}

.count-badge {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  color: #fff;
}

.count-badge-red {
  background: #dc2626;
}

.count-badge-yellow {
  background: #d97706;
}

/* --- Etat vide --- */
.empty-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
  padding: 1.25rem 0.25rem;
}

.empty-state-ok i {
  color: #22c55e;
  font-size: 1rem;
}

/* --- Liste des items --- */
.alert-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  border-left: 3px solid transparent;
  transition: background 0.15s ease;
}

.alert-item-red {
  border-left-color: #dc2626;
}

.alert-item-red:hover {
  background: #fef2f2;
}

.alert-item-yellow {
  border-left-color: #d97706;
}

.alert-item-yellow:hover {
  background: #fffbeb;
}

.alert-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.alert-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.alert-item-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-item-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.alert-item-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
}

.alert-item-tag-red {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.alert-item-tag-yellow {
  color: #b45309;
  background: rgba(217, 119, 6, 0.08);
}

/* --- Responsive --- */
@media screen and (max-width: 480px) {
  .alerts-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .alert-item-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }
}
</style>
