
<script setup>
import { fetchStatistic, getUsersCreatedByMe } from '@/service/Api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

const statisticFile = ref(null);  
const selectedYear = ref('all');
const years = ref([]);

const allUsers = ref([])

const chartData = ref({});
const chartOptions = ref({});




const selectedPeriod = ref('last7');

const periods = [
    { label: '7 derniers jours', value: 'last7' },
    { label: 'Par mois', value: 'month' },
    { label: 'Par année', value: 'year' }
];


const selectedUser = ref(null);


const users = computed(() =>
    allUsers.value
        .filter(user => user.status === 'ADMIN')
        .map(user => ({
            label: user.username,
            value: user.id
        }))
);



async function fetchUsers(){
    allUsers.value = await getUsersCreatedByMe();
    
}

// --- Données brutes (à remplacer par vos vraies données/API) ---
const totalAmount = computed(() => {
    return filteredData.value.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
    );
});

const totalCount = computed(() => {
  return filteredData.value.reduce(
    (total, item) => total + Number(item.count || 0),
    0
  );
});

const rawStats = ref({
  totalAmount: totalAmount,

  totalProfit: 0,
  invoiceCount: totalCount,
  averageTicket: 600,

  trends: {
    totalAmount: 8.4,
    totalProfit: -2.1,
    invoiceCount: 5.0,
    averageTicket: 1.2,
  },

});


const currency = ref(null); // 'CDF' ou 'USD'

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.value || 'USD', // fallback si pas encore chargé
    maximumFractionDigits: 0,
  }).format(value);
};



const statCards = computed(() => [
  {
    key: 'totalAmount',
    label: 'Montant total facturé',
    value: formatCurrency(rawStats.value.totalAmount),
    trend: rawStats.value.trends.totalAmount,
    icon: 'pi pi-money-bill',
    tone: 'blue',
  },


  {
    key: 'invoiceCount',
    label: 'Nombre de factures',
    value: rawStats.value.invoiceCount,
    trend: rawStats.value.trends.invoiceCount,
    icon: 'pi pi-check-circle',
    tone: 'green',
  },

]);


async function getStatistic(){

  const response = await fetchStatistic(selectedUser.value);
  statisticFile.value = response;
  currency.value = statisticFile.value.summary.currency

   years.value = [
      {label:"Toutes les année", value:"all"},
      ...response.invoices.year.map(item => ({
         label : item.year.toString(),
         value: item.year
      }))
   ]
  
  updateChart();
}




const filteredData = computed(() => {

    if (!statisticFile.value) return [];

    switch (selectedPeriod.value) {

        case 'last7':
            return statisticFile.value.invoices.last7days;

        case 'month':
            return statisticFile.value.invoices.month;

        case 'year':
            return statisticFile.value.invoices.year;

        default:
            return [];
    }

});



function getThemeColors() {

    const style = getComputedStyle(document.documentElement);
    return {
        primary: style.getPropertyValue('--p-primary-500').trim() || '#6366F1',
        primaryDark: style.getPropertyValue('--p-primary-700').trim() || '#4338CA',
        secondary: style.getPropertyValue('--p-orange-500').trim() || '#F97316',
        textColor: style.getPropertyValue('--p-text-color').trim() || '#495057',
        textColorSecondary: style.getPropertyValue('--p-text-muted-color').trim() || '#6c757d',
        surfaceBorder: style.getPropertyValue('--p-content-border-color').trim() || '#eef1f5'
    };
}

// Dégradé vertical pour les barres — nécessite le canvas du chart
function getBarGradient(ctx, chartArea, colorFrom, colorTo) {
    if (!chartArea) return colorFrom;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, colorFrom);
    gradient.addColorStop(1, colorTo);
    return gradient;
}

function updateChart() {
    if (!filteredData.value.length) return;

    const colors = getThemeColors();

    const labels = filteredData.value.map(item => {
        if (selectedPeriod.value === 'last7') return item.date;
        if (selectedPeriod.value === 'month') return item.month;
        return item.year.toString();
    });

    chartData.value = {
        labels,
        datasets: [

            {
                type: 'bar',
                label: `Montant (${currency.value})`,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return colors.primary;
                    return getBarGradient(ctx, chartArea, colors.primary, 'rgba(99, 102, 241, 0.35)');
                },
                hoverBackgroundColor: colors.primaryDark,
                borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false,
                maxBarThickness: 42,

                data: filteredData.value.map(item => item.amount),

                yAxisID: 'y',
                order: 2
            },

            {
                type: 'line',
                label: `Nombre de factures `,
                borderColor: colors.secondary,
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 2.5,
                fill: false,
                pointBackgroundColor: '#fff',
                pointBorderColor: colors.secondary,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                data: filteredData.value.map(item => item.count),
                yAxisID: 'y1',
                order: 1
            }
        ]
    };

    chartOptions.value = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: colors.textColorSecondary,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 24,
                    font: { size: 13, weight: '500' }
                }
            },
            tooltip: {
                backgroundColor: '#ffffff',
                titleColor: colors.textColor,
                bodyColor: colors.textColorSecondary,
                borderColor: colors.surfaceBorder,
                borderWidth: 1,
                padding: 14,
                cornerRadius: 10,
                boxPadding: 6,
                usePointStyle: true,
                titleFont: { size: 13, weight: '600' },
                bodyFont: { size: 12.5 },
                displayColors: true
            }
        },
        scales: {
            x: {
                border: { display: false },
                ticks: { color: colors.textColorSecondary, font: { size: 12 } },
                grid: { display: false }
            },
            y: {
                type: 'linear',
                position: 'left',
                border: { display: false },
                ticks: {
                    color: colors.textColorSecondary,
                    font: { size: 12 },
                    padding: 8,
                    callback: (value) => value.toLocaleString('fr-FR')
                },
                grid: { color: colors.surfaceBorder, drawTicks: false }
            },
            y1: {
                type: 'linear',
                position: 'right',
                border: { display: false },
                ticks: { color: colors.textColorSecondary, font: { size: 12 } },
                grid: { drawOnChartArea: false }
            }
        }
    };
}

// top produit 


const chartDataTopPoducts = ref({});
const chartOptionsTopProducts = ref({});

// Palette cohérente utilisée à la fois par le donut et les barres de la liste
const palette = [
  '--p-blue-500',
  '--p-green-500',
  '--p-orange-500',
  '--p-red-500',
  '--p-purple-500',
  '--p-cyan-500',
  '--p-pink-500',
];
const paletteHover = [
  '--p-blue-400',
  '--p-green-400',
  '--p-orange-400',
  '--p-red-400',
  '--p-purple-400',
  '--p-cyan-400',
  '--p-pink-400',
];


const trendIcon = (index, total) => {
  const isLast = index === (total ?? 0) - 1;
  return isLast
    ? 'pi pi-arrow-down trend-icon trend-down'
    : 'pi pi-arrow-up trend-icon trend-up';
};


const rankColor = (index) => {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue(palette[index % palette.length]);
};

const totalQuantity = computed(() =>
  (statisticFile.value?.top_products || []).reduce((sum, item) => sum + item.quantity, 0)
);

const percentOf = (quantity) => {
  if (!totalQuantity.value) return 0;
  return Math.round((quantity / totalQuantity.value) * 1000) / 10; // 1 décimale
};

watch(
  () => statisticFile.value,
  (data) => {
    if (!data || !data.top_products) return;

    const documentStyle = getComputedStyle(document.documentElement);
    const total = data.top_products.reduce((sum, item) => sum + item.quantity, 0);

    chartDataTopPoducts.value = {
      labels: data.top_products.map((item) => item.product_name),
      datasets: [
        {
          data: data.top_products.map((item) => item.quantity),
          backgroundColor: palette.map((v) => documentStyle.getPropertyValue(v)),
          hoverBackgroundColor: paletteHover.map((v) => documentStyle.getPropertyValue(v)),
          borderWidth: 0,
        },
      ],
    };

    chartOptionsTopProducts.value = {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const percent = total ? Math.round((value / total) * 1000) / 10 : 0;
              return ` ${context.label} : ${value} ventes (${percent}%)`;
            },
          },
        },
      },
      cutout: '68%',
      maintainAspectRatio: false,
    };
  },
  { immediate: true }
);








onMounted(async () => {

    await fetchUsers();
     await getStatistic();
      await nextTick();
     updateChart();

})





</script>




<template>
  <div class="stats-page">

    <div class="page-header">
      <div class="page-header-title">

        <h2 class="m-0">Bila-Sol Statistiques</h2>
        <span class="page-header-subtitle">Vue d'ensemble de l'activité commerciale</span>
      </div>

      <div class="header-filters">
        <div class="filter-group">
          <label class="filter-label">Filter Par</label>
          <Select
            v-model="selectedUser"
            :options="users"
            optionLabel="label"
            optionValue="value"
            placeholder="ADMIN"
            class="filter-select"
            showClear
            @change="getStatistic"
          >
            <template #dropdownicon>
              <i class="pi pi-user"></i>
            </template>
          </Select>
        </div>

        <div class="filter-divider"></div>

        <div class="filter-group">
          <label class="filter-label">Période</label>
          <Select
            v-model="selectedPeriod"
            :options="periods"
            optionLabel="label"
            optionValue="value"
            class="filter-select"
            @change="updateChart"
          >
            <template #dropdownicon>
              <i class="pi pi-calendar"></i>
            </template>
          </Select>
        </div>
      </div>
    </div>


    <!-- Cartes de synthèse -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statCards" :key="stat.key">
        <div class="stat-icon" :class="`stat-icon-${stat.tone}`">
          <i :class="stat.icon"></i>
        </div>
        <div class="stat-body">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ stat.value }}</span>
          <span
            v-if="stat.trend !== null"
            class="stat-trend"
            :class="stat.trend >= 0 ? 'trend-up' : 'trend-down'"
          >
            <i :class="stat.trend >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"></i>

            {{ Math.abs(stat.trend) }}%
          </span>
        </div>
      </div>
    </div>

    <div class="card chart-card mt-3">
      <div class="chart-card-header">
        <div>
          <div class="font-semibold text-xl">Ventes</div>
          <span class="text-500 text-sm">Montant facturé et volume de factures</span>
        </div>
      </div>

      <div class="chart-wrapper">
        <Chart
          ref="chartRef"
          type="bar"
          :data="chartData"
          :options="chartOptions"
          class="chart-canvas"
        />
      </div>
      
    </div>



        <div class="card top-products-card">
        <div class="card-header">

        <div class="font-semibold text-xl">
            Top 7 des meilleures ventes
        </div>
        <span class="text-500 text-sm">
            Les 7 produits les plus vendus.
        </span>

        </div>

        <div class="top-products-body">
          <!-- Graphique -->
          <div class="donut-col">
            <div class="donut-wrapper">
              <Chart
                type="doughnut"
                :data="chartDataTopPoducts"
                :options="chartOptionsTopProducts"
                class="donut-chart"
              />
              <div class="donut-center">
                <span class="donut-center-value">{{ totalQuantity }}</span>
                <span class="donut-center-label">ventes</span>
              </div>
            </div>
          </div>

      <!-- Liste -->
      <div class="list-col">

        <ul class="product-list">
          <li
            v-for="(item, index) in statisticFile?.top_products || []"
            :key="item.product_id"
            class="product-item"
          >
            <div class="product-rank" :style="{ background: rankColor(index) }">
              {{ index + 1 }}
            </div>

            <div class="product-main">
              <div class="product-row">
                <span class="product-name">{{ item.product_name }}</span>
                <span class="product-percent">{{ percentOf(item.quantity) }}%</span>

              </div>

              <div class="product-bar-track">
                <div
                  class="product-bar-fill"
                  :style="{ width: percentOf(item.quantity) + '%', background: rankColor(index) }"
                ></div>
              </div>

              <div class="product-row product-subrow">
                <small class="text-color-secondary">
                  <i :class="trendIcon(index, statisticFile?.top_products?.length)"></i>
                  
                  {{ item.quantity }} ventes
                </small>
                <small class="font-medium">{{ formatCurrency(item.amount) }}</small>
              </div>

            </div>

          </li>
        </ul>

      </div>
    </div>
  </div>
    
    

  </div>
</template>


<style scoped>
/* --- header pages --- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
}

.page-header-title {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.page-header-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
}

.page-header-subtitle {
  font-size: 0.875rem;
  color: var(--text-color-secondary, #6b7280);
}

.header-filters {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  background: var(--surface-card, #fff);
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 10px;
  padding: 0.6rem 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.filter-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-color-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-select {
  width: 100%;
  min-width: 12rem;
}

.filter-divider {
  width: 1px;
  height: 2.25rem;
  background: var(--surface-border, #e5e7eb);
  align-self: flex-end;
  margin-bottom: 0.35rem;
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-filters {
    flex-direction: column;
    align-items: stretch;
    background: transparent;
    border: none;
    padding: 0;
    gap: 0.9rem;
  }

  .filter-divider {
    display: none;
  }

  .filter-select {
    min-width: 100%;
  }
}

/* ---  fin de la section--- */
/* --- Cartes de statistiques --- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  background: var(--surface-card, #fff);
  border: 1px solid var(--surface-border, #e5e7eb);
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.stat-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

.stat-icon-blue {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}
.stat-icon-green {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}
.stat-icon-orange {
  background: rgba(249, 115, 22, 0.12);
  color: #f97316;
}
.stat-icon-purple {
  background: rgba(139, 92, 246, 0.12);
  color: #8b5cf6;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--text-color-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
  line-height: 1.2;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  width: fit-content;
}

.stat-trend i {
  font-size: 0.7rem;
}

.trend-up {
  color: #10b981;
}

.trend-down {
  color: #ef4444;
}

/* --- Carte graphique --- */
.chart-card {
  padding: 1.5rem 1.5rem 1rem;
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 380px;
}

.chart-canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Responsive */
@media screen and (max-width: 992px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .chart-wrapper {
    height: 280px;
  }

  .chart-card {
    padding: 1.25rem 1rem 0.75rem;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-filters {
    flex-direction: column;
  }

  .filter-select {
    max-width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

/* top produit */



.top-products-card {
  padding: 1.5rem;
}

.card-header {
  margin-bottom: 1.25rem;
}

/* --- Layout côte à côte forcé --- */
.top-products-body {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.donut-col {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
}

.list-col {
  flex: 1 1 0%;
  min-width: 0; /* évite que le texte long ne fasse déborder le flex */
}

/* --- Donut avec valeur centrale --- */
.donut-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

.donut-chart {
  width: 100% !important;
  height: 100% !important;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.donut-center-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
  line-height: 1.1;
}

.donut-center-label {
  font-size: 0.72rem;
  color: var(--text-color-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* --- Liste des produits --- */
.product-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.product-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding-bottom: 0.9rem;
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
}

.product-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.product-rank {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.1rem;
}

.product-main {
  flex: 1;
  min-width: 0;
}

.product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.product-name {
  font-weight: 600;
  font-size: 0.925rem;
  color: var(--text-color, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-percent {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-color-secondary, #6b7280);
  flex-shrink: 0;
}

.product-bar-track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--surface-200, #f1f5f9);
  margin: 0.4rem 0 0.35rem;
  overflow: hidden;
}

.product-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.product-subrow {
  margin-top: 0.15rem;
}

/* On ne stacke qu'en toute dernière extrémité (mobile étroit) */
@media screen and (max-width: 576px) {
  .top-products-body {
    flex-direction: column;
    align-items: stretch;
    gap: 1.25rem;
  }

  .donut-col {
    justify-content: center;
  }

  .donut-wrapper {
    width: 170px;
    height: 170px;
  }
}

.trend-icon {
  font-size: 0.7rem;
  margin-right: 0.3rem;
  vertical-align: middle;
}

.trend-up {
  color: #10b981;
}

.trend-down {
  color: #ef4444;
}






</style>