<script setup>
import { fetchCashOut, fetchInvoicesAllUsers, fetchUserById, fetchUserProfilById, getUsersCreatedByMe, verifySecretKey } from '@/service/Api'
import { clearAllCache, loadCache, saveCache } from '@/utils/cache'
import { formatPrice } from '@/utils/formatters'
import { useToast } from 'primevue/usetoast'
import { computed, onMounted, ref, watch } from 'vue'

import jsPDF from 'jspdf'

const toast = useToast()

// === Refs principales ===
const user = ref(null)
const userProfile = ref(null)
const invoices = ref([])
const cashouts = ref([])
const childUsers = ref([])
const allUsers = ref([])
const isLoading = ref(false)
const showSensitiveInfo = ref(false)
const secretKey = ref('')
const submittedSecret = ref(false)
const secretDialog = ref(false)
const selectDate = ref({ global: { value: new Date().toISOString().split('T')[0] } })
const selectedUserId = ref(null) // 'all' = par défaut, utilisateur connecté

// Dashboard cards
const todaysInvoicesUserConnectCount = ref(0)
const total_AmountUserConnect = ref(0)
const total_ProfitAmountUserConnect = ref(0)
const total_AmountCashOut = ref(0)
const todaysCashoutCount = ref(0)


const canceledInvoicesCount = ref(0);
const canceledTotalAmount = ref(0);

// Graphiques
const pieData = ref(null)
const pieOptions = ref(null)
const lineData = ref(null)
const lineOptions = ref(null)

// ================= INIT DATA =================
async function initData() {
  try {
    isLoading.value = true
    const userId = localStorage.getItem('id')
    const activeUserId = selectedUserId.value || userId;
    // Utilisateur connecté
    user.value = loadCache('userConnected') || await fetchUserById(userId)
    if (!loadCache('userConnected')) saveCache('userConnected', user.value)

    const userProfileData = await fetchUserProfilById(user.value.id)
    userProfile.value = Array.isArray(userProfileData) ? userProfileData[0] : userProfileData
    user.value.currency = userProfile.value?.currency_preference || 'N/A'

    // Enfants
    const allCreatedUsers = await getUsersCreatedByMe()
    childUsers.value = allCreatedUsers
    allUsers.value = [user.value, ...childUsers.value]

    for (let i = 0; i < childUsers.value.length; i++) {
      const childProfile = await fetchUserProfilById(childUsers.value[i].id)
      childUsers.value[i].profile = Array.isArray(childProfile) ? childProfile[0] : childProfile
      childUsers.value[i].currency = childUsers.value[i].profile?.currency_preference || 'N/A'
    }

    const allInvoices = await fetchInvoicesAllUsers(activeUserId)
    // on garde le factures avec un status  Valide
    invoices.value = allInvoices.filter(inv => inv.status ==="VALIDE");
    canceledInvoicesCount.value = allInvoices.filter(inv => inv.status ==="ANNULER").length
    canceledTotalAmount.value = allInvoices.filter(inv => inv.status ==="ANNULER").reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)

    cashouts.value = await fetchCashOut(activeUserId)

    console.log('cashout pour utilisateur selecte',cashouts.value)

    // Met à jour le dashboard
    updateDashboardCards();
    updatePieChart();
    updateLineChart();

  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données', life: 3000 })
  } finally {
    isLoading.value = false
  }
}

// ================= Force refresh =================
function forceRefresh() {
  clearAllCache();
  initData();
   toast.add({ severity: 'success', summary: 'Actualisé', detail: 'Les données ont étés rechargées', life: 2000 });
}

// ================= Dashboard Cards =================

const selectedUserProfile = computed(() => {

  if (selectedUserId.value === null|| parseInt(selectedUserId.value) === user.value.id) {
    return userProfile.value  // utilisateur connecté par défaut
  } 
  const selectedUser = allUsers.value.find(u => u.id === parseInt(selectedUserId.value))
  return selectedUser?.profile || { currency_preference: 'N/A' }
})


const currentUserId = ref(null)
watch(selectedUserId, () => {
  currentUserId.value = selectedUserId.value === null ? user.value.id : parseInt(selectedUserId.value)

  updateDashboardCards()
  updatePieChart()
  updateLineChart()
})

watch(() => selectDate.value.global.value, () => {

  updateDashboardCards()
  updatePieChart()
  updateLineChart()
})

async function updateDashboardCards() {
  const selectedDateVal = selectDate.value.global.value

  // Déterminer quel utilisateur pour les cards
  const userIdForCards = selectedUserId.value === null 
    ? user.value.id   // par défaut, montrer uniquement l'utilisateur connecté
    : parseInt(selectedUserId.value)

  // Filtrer invoices pour ce user
  const filteredInvoices = invoices.value.filter(
    inv => inv.cashier === userIdForCards &&
           new Date(inv.created_at).toISOString().split('T')[0] === selectedDateVal
  )
 


  const filteredCashouts = cashouts.value.filter(
    c => c.user === userIdForCards &&
         new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal
  )

 
 
  todaysInvoicesUserConnectCount.value = filteredInvoices.length
  total_AmountUserConnect.value = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
  total_ProfitAmountUserConnect.value = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.profit_amount || 0), 0)
  todaysCashoutCount.value = filteredCashouts.length
  total_AmountCashOut.value = filteredCashouts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0)
 
}

const displayUserProfile = computed(() => {

  if (selectedUserId.value === null) return userProfile.value || { currency_preference: 'N/A' }

  // Sinon, profile de l'utilisateur sélectionné
  const selectedUser = allUsers.value.find(u => u.id === parseInt(selectedUserId.value))
  return selectedUser?.profile || { currency_preference: 'N/A' }
})


async function updatePieChart() {
  const selectedDateVal = selectDate.value.global.value
  const userInvoiceTotals = {}

  // Filtrer les factures selon l'utilisateur sélectionné
  const filteredInvoices = selectedUserId.value === null
    ? invoices.value // tous les utilisateurs
    : invoices.value.filter(inv => inv.cashier === currentUserId.value)

  // Calculer le total par utilisateur
  filteredInvoices.forEach(inv => {
    const invoiceDate = new Date(inv.created_at).toISOString().split('T')[0]
    if (invoiceDate === selectedDateVal) {
      const uid = inv.cashier
      userInvoiceTotals[uid] = (userInvoiceTotals[uid] || 0) + (parseFloat(inv.total_amount) || 0)
    }
  })

  const labels = []
  const data = []
  const legend = []

  const baseColors = [
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)'
  ]

  allUsers.value.forEach((u, i) => {
    if (u && userInvoiceTotals[u.id]) {
      labels.push(u.username)
      data.push(userInvoiceTotals[u.id])
      legend.push({
        name: u.username,
        amount: userInvoiceTotals[u.id],
        color: baseColors[i % baseColors.length],
        currency: u.currency || 'N/A'
      })
    }
  })

  pieData.value = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: legend.map(l => l.color),
        hoverBackgroundColor: legend.map(l => l.color.replace('0.8', '1'))
      }
    ],
    legend
  }

  pieOptions.value = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Factures par caissier(e)s' }
    }
  }
}


// ================= Line Chart =================
function updateLineChart() {
  const selectedDateVal = selectDate.value.global.value
  const datasets = []
  const baseColors = [
    '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC',
    '#26C6DA', '#FF7043', '#8D6E63', '#EC407A',
    '#7E57C2', '#26A69A', '#EF5350', '#9CCC65'
  ]

  const selectedDate = new Date(selectedDateVal)

  // 🗓️ Trouver le lundi de la semaine du jour sélectionné
  const startDate = new Date(selectedDate)
  const day = startDate.getDay() // 0 = dimanche, 1 = lundi, ...
  const diff = day === 0 ? -6 : 1 - day // Si dimanche, reculer de 6 jours
  startDate.setDate(startDate.getDate() + diff)

  // 📅 Générer les 7 jours de la semaine (lundi → dimanche)
  const labels = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  // 👥 Déterminer les utilisateurs à afficher
  const usersToShow = selectedUserId.value === null
    ? allUsers.value
    : allUsers.value.filter(u => u.id === parseInt(selectedUserId.value))

  for (let i = 0; i < usersToShow.length; i++) {
    const u = usersToShow[i]
    const currency = u.currency || 'N/A'

    const userInvoices = invoices.value.filter(inv => inv.cashier === u.id)
    const dailyTotals = {}
    let totalAmount = 0

    userInvoices.forEach(inv => {
      const dateStr = new Date(inv.created_at).toISOString().split('T')[0]
      if (dateStr >= labels[0] && dateStr <= labels[labels.length - 1]) {
        const amount = parseFloat(inv.total_amount) || 0
        dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + amount
        totalAmount += amount
      }
    })

    const data = labels.map(l => dailyTotals[l] || 0)
    datasets.push({
      label: `${u.username} (${currency}) — ${formatPrice(totalAmount)}`,
      data,
      borderColor: baseColors[i % baseColors.length],
      backgroundColor: baseColors[i % baseColors.length],
      tension: 0.3,
      fill: false
    })
  }

  lineData.value = { labels, datasets }
}



async function verifySecret() {
  submittedSecret.value = true
  if (!secretKey.value) return
  try {
    const isValid = await verifySecretKey(secretKey.value)
    if (isValid.valid) {
      showSensitiveInfo.value = true
      secretDialog.value = false
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Code secret validé', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Code secret invalide', life: 3000 })
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de vérification', life: 3000 })
  }
}


async function generatePDF() {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const selectedDateVal = selectDate.value.global.value
  const connectedUserProfile = userProfile.value

  // === Entête principal avec fond vert profond ===
  pdf.setFillColor(0, 77, 74) // 0xFF004D4A
  pdf.rect(0, 0, 210, 30, 'F')

  pdf.setFontSize(20)
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(255)
  pdf.text('Rapport des ventes', 105, 15, { align: 'center' })

  pdf.setFontSize(12)
  pdf.setFont(undefined, 'normal')
  pdf.text(`Date : ${selectedDateVal}`, 105, 23, { align: 'center' })

  // Ligne de séparation sous le header
  pdf.setDrawColor(255)
  pdf.setLineWidth(1)
  pdf.line(12, 30, 198, 30)

  // === Profil utilisateur connecté ===
  let currentY = 38
  const infoLines = [
    `Entreprise : ${connectedUserProfile.entrep_name || 'N/A'}`,
    `Téléphone : ${connectedUserProfile.phone_number || 'N/A'}`,
    `Adresse : ${connectedUserProfile.adress || 'N/A'}`,
    `RCCM : ${connectedUserProfile.rccm_number || 'N/A'}`,
    `Numéro d’impôt : ${connectedUserProfile.impot_number || 'N/A'}`,
  ]
  pdf.setFont(undefined, 'normal')
  pdf.setTextColor(33, 33, 33)
  infoLines.forEach(line => {
    currentY += 7
    pdf.text(line, 105, currentY, { align: 'center' })
  })

  // Ligne de séparation sous le profil
  currentY += 6
  pdf.setDrawColor(0, 77, 74)
  pdf.setLineWidth(0.8)
  pdf.line(12, currentY, 198, currentY)
  currentY += 6

  // === Préparer les données utilisateurs ===
  const tableData = allUsers.value.map(u => {
    const userInvoices = invoices.value.filter(inv =>
      inv.cashier === u.id &&
      new Date(inv.created_at).toISOString().split('T')[0] === selectedDateVal
    )
    const userCashOuts = cashouts.value.filter(c =>
      c.user === u.id &&
      new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal
    )
    return {
      name: u.username,
      totalFacture: userInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      nbFactures: userInvoices.length,
      totalCashOut: userCashOuts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0),
      currency: u.currency || 'N/A'
    }
  })

  const startX = 12
  const rowHeight = 8
  const rowColors = [[245, 245, 245], [255, 255, 255]]
  const totalColumnColor = [255, 165, 0] // orange

  // === Entête du tableau ===
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(255)
  pdf.setFillColor(0, 77, 74)
  pdf.rect(startX, currentY - 6, 186, rowHeight, 'F')
  pdf.text('Nom', startX + 2, currentY)
  pdf.text('Total Factures', 60, currentY)
  pdf.text('Nb Factures', 110, currentY)
  pdf.text('Total Sorties', 150, currentY)
  pdf.setFont(undefined, 'normal')
  pdf.setTextColor(0)
  currentY += rowHeight

  // === Lignes du tableau ===
  tableData.forEach((d, index) => {
    const bgColor = rowColors[index % 2]
    pdf.setFillColor(...bgColor)
    pdf.rect(startX, currentY - 6, 186, rowHeight, 'F')

    pdf.setTextColor(0)
    pdf.text(d.name, startX + 2, currentY)

    // Total Factures en orange
    pdf.setTextColor(...totalColumnColor)
    pdf.text(`${formatPrice(d.totalFacture)} ${d.currency}`, 60, currentY)

    pdf.setTextColor(0)
    pdf.text(d.nbFactures.toString(), 110, currentY)
    pdf.text(`${formatPrice(d.totalCashOut)} ${d.currency}`, 150, currentY)

    currentY += rowHeight
  })

  // === Totaux par devise (orange) ===
  const totalsByCurrency = tableData.reduce((acc, u) => {
    if (!acc[u.currency]) acc[u.currency] = { totalFactures: 0, nbFactures: 0, totalCashOut: 0 }
    acc[u.currency].totalFactures += u.totalFacture
    acc[u.currency].nbFactures += u.nbFactures
    acc[u.currency].totalCashOut += u.totalCashOut
    return acc
  }, {})


  // === Logo centré en bas ===
  const img = new Image()
  img.src = '/demo/bilatechslogan.png'
  img.onload = () => {
    const pageHeight = pdf.internal.pageSize.height
    const logoWidth = 90
    const logoHeight = 40
    pdf.addImage(img, 'PNG', (210 - logoWidth) / 2, pageHeight - logoHeight - 10, logoWidth, logoHeight)
    pdf.save(`rapport_ventes_${selectedDateVal}.pdf`)
  }
}





onMounted(() => {
  currentUserId.value = user.value?.id
  initData()
  updateDashboardCards();
})

</script>





<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">

    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- Carte template -->
      <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full bg-white dark:bg-gray-800">

        <!-- Titre -->
        <div class="text-gray-500 dark:text-gray-400 text-sm font-medium mb-2 text-center">
          Factures
        </div>

        <!-- Comptage des factures -->
        <div class="flex justify-around items-center mb-4">
          <!-- Factures valides -->
          <div class="flex flex-col items-center">
            <span class="text-green-500 text-3xl font-bold">{{ todaysInvoicesUserConnectCount }}</span>
            <span class="text-green-700 text-sm font-medium">Valides</span>
          </div>

          <!-- Factures annulées -->
          <div class="flex flex-col items-center">
            <span class="text-red-500 text-3xl font-bold">{{ canceledInvoicesCount}}</span>
            <span class="text-red-700 text-sm font-medium">Annulées</span>
          </div>
        </div>

        <!-- Footer : date -->
        <div class="text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ selectDate.global.value || 'Toutes les dates' }}
        </div>

      </div>

      <!-- Total -->
    <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full">
      <div class="flex justify-between items-center mb-2">
        <div>
          <span class="block text-gray-500 dark:text-gray-400 text-sm font-medium">Factures</span>
          <div class="text-gray-900 dark:text-gray-100 font-semibold text-xl">
            {{ formatPrice(total_AmountUserConnect) }} {{ selectedUserProfile?.currency_preference || 'N/A' }}
          </div>
        </div>
        <div class="flex flex-col items-center justify-center gap-2">
          <!-- Valides -->
          <div class="flex items-center gap-2 bg-green-100 dark:bg-green-400/10 rounded-full px-2 py-1">
            <i class="pi pi-check text-green-500 text-sm"></i>
            <span class="text-green-600 dark:text-green-400 text-sm font-medium">
              {{ formatPrice(total_AmountUserConnect) }}
            </span>
          </div>
          <!-- Annulées -->
          <div class="flex items-center gap-2 bg-red-100 dark:bg-red-400/10 rounded-full px-2 py-1">
            <i class="pi pi-ban text-red-500 text-sm"></i>
            <span class="text-red-600 dark:text-red-400 text-sm font-medium">
              {{ formatPrice(canceledTotalAmount) }}
            </span>
          </div>
        </div>
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400 mt-auto">
        Total pour aujourd'hui : {{ selectDate.global.value }}
      </div>
    </div>



     
    <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full">
      <div class="flex justify-between items-center mb-2">
        <div>
          <span class="block text-gray-500 dark:text-gray-400 text-sm font-medium">Bénéfice estimé</span>

         
          <div class="text-gray-900 dark:text-gray-100 font-semibold text-xl">
            <span v-if="showSensitiveInfo">
                {{ formatPrice(total_ProfitAmountUserConnect) }} {{ selectedUserProfile?.currency_preference || 'N/A' }}
            </span>
            <span v-else>XXXXX</span>
          </div>
        </div>

        <div class="flex items-center justify-center bg-yellow-100 dark:bg-yellow-400/10 rounded-full w-10 h-10">
          <i class="pi pi-wallet text-yellow-500 text-lg"></i>
        </div>
      </div>
      <Button
      v-if="!showSensitiveInfo"
      label="Afficher le bénéfice"
      icon="pi pi-lock"
      severity="warning"
      size="small"
      class="mt-2"
      @click="secretDialog = true"
    />

    </div>


      <!-- Total dépassé -->
      <div class="card flex flex-col justify-between p-4 shadow-sm rounded-lg h-full">
        <div class="flex justify-between items-center mb-2">
          <div>
            <span class="block text-red-500 dark:text-red-400 text-sm font-medium">Total dépassé</span>
            <div class="text-red-600 dark:text-red-400 font-semibold text-xl">
               {{ formatPrice(total_AmountCashOut) }} {{ selectedUserProfile?.currency_preference || 'N/A' }}
            </div>
          </div>
          <div class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-full w-10 h-10">
            <i class="pi pi-arrow-up-right text-red-500 text-lg"></i>
          </div>
        </div>
        <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-auto">
          <span>{{ todaysCashoutCount }}</span>
          <span>Nombres des dépasses</span>
        </div>
      </div>
    </div>

    <!-- Date Selector -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
 
        <div class="flex flex-col">
          <label for="user-filter" class="font-medium">Filtrer par utilisateur :</label>

          <Select
                v-model="selectedUserId"
                :options="allUsers.map(u => ({ id: u.id, username: u.username }))"
                optionLabel="username"
                optionValue="id"
                placeholder="Filtrer par utilisateur"
                class="w-full sm:w-56"
                showClear
            />

        </div>

        <!-- 🔹 Sélecteur de date -->
        <div class="flex flex-col">
          <label for="date-select" class="font-medium">Sélectionner une date :</label>
          <InputText
            id="date-select"
            type="date"
            v-model="selectDate.global.value"
            class="w-full sm:w-auto"
          />
        </div>

        <div class="flex justify-end gap-2 mt-4 sm:mt-0">
          <Button label="Générer le Rapport" severity="success" @click="generatePDF"/>
          <Button label="Actualiser" severity="warning" @click="forceRefresh"/>
        </div>
      </div>


    <!-- Charts Section -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- 📈 Line Chart -->
      <div class="card p-4 shadow-sm rounded-lg flex flex-col h-full">
        <div class="text-lg font-semibold mb-4">Factures pour la semaine</div>
        <Chart
        id="lineChart"
          type="line"
          :data="lineData"
          :options="lineOptions"
          class="flex-1 w-full min-h-[250px] sm:min-h-[300px]"
        />
      </div>

  <!--  Doughnut Chart + Légende -->
  <div class="flex flex-col gap-4 h-full">
    <div class="card p-4 shadow-sm rounded-lg flex flex-col items-center h-full">
      <div class="text-lg font-semibold mb-4">Factures par Caissier</div>

      <!-- Graphique camembert -->
      <Chart
      id="doughnut"
        type="doughnut"
        :data="pieData"
        :options="pieOptions"
        class="flex-1 w-full min-h-[250px] sm:min-h-[300px]"
      />

    <!-- Légende dynamique -->
    <div v-if="pieData?.legend?.length" class="w-full mt-4 border-t pt-4 space-y-2">
      <div v-for="(item, index) in pieData.legend" :key="index" class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span :style="{ backgroundColor: item.color }" class="w-3 h-3 rounded-full"></span>
          <span class="text-gray-700 dark:text-gray-300 font-medium">
            {{ item.name }}
          </span>
        </div>
        <span class="font-semibold text-gray-900 dark:text-gray-100">
          {{ formatPrice(item.amount) }} {{ item.currency || 'N/A' }}
        </span>
      </div>
    </div>
  </div>
</div>



</div>




    <Dialog
      v-model:visible="secretDialog"
      modal
      header="Vérification du code secret"
      :style="{ width: '400px' }"
      class="p-fluid"
      >
  <div class="field mb-4">
    <label for="secret" class="block text-sm font-medium text-gray-700 mb-2">
      Entrez le code secret
    </label>
    <Password
      id="secret"
      v-model="secretKey"
      toggleMask
      feedback="false"
      placeholder="Code secret"
      class="w-full"
    />
    <small v-if="submittedSecret && !secretKey" class="p-error block mt-1">
      Le code secret est requis.
    </small>
  </div>

  <div class="flex justify-end gap-2">
    <Button
      label="Annuler"
      icon="pi pi-times"
      severity="secondary"
      @click="secretDialog =false"
    />
    <Button
      label="Vérifier"
      icon="pi pi-check"
      severity="success"
      @click="verifySecret"
    />
  </div>
</Dialog>

  </div>
</template>

<style scoped>
/* Mobile-first adjustments */
@media (max-width: 640px) {
  .p-button {
    width: 100%;
  }
}
</style>
