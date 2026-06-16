<script setup>
import {
  checkSecretKeyStatus,
  fetchCashoutAllUsers,
  fetchEntryNoteAllUser,
  fetchInvoicesAllUsers,
  fetchUserById,
  fetchUserProfilById,
  getUsersCreatedBy,
  getUsersCreatedByMe, verifySecretKey
} from '@/service/Api'
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
const invoicesCancel = ref([]);
const cashouts = ref([])
const cashInts =ref([]);
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
const total_tva_valid= ref(0);
const total_AmountCashOut = ref(0);
const total_AmountCashoutUSD = ref(0);
const total_AmountCashIntUSD = ref(0);
const todaysCashoutCount = ref(0);
const total_AmountCashInt = ref(0);
const total_CashIntCount = ref(0);


const canceledInvoicesCount = ref(0);
const canceledTotalAmount = ref(0);

// Graphiques
const pieData = ref(null)
const pieOptions = ref(null)
const lineData = ref(null)
const lineOptions = ref(null)
const usersForCharts = ref([]);
const selectedGroup = ref(null)
const hasSecretKey = ref(false);
const statusUser = localStorage.getItem('status');
// ========= INIT DATA =======

async function initData() {
  try {
    isLoading.value = true
    const userId = localStorage.getItem('id')
    const activeUserId = selectedUserId.value || userId;

    // -- Utilisateur connecté --
    user.value = loadCache('userConnected') || await fetchUserById(userId)
    if (!loadCache('userConnected')) saveCache('userConnected', user.value)
    if (!user.value) return;

    // -- Profil utilisateur --
    const cachedProfile = loadCache(`userProfile_${user.value.id}`)
    const userProfileData = cachedProfile || await fetchUserProfilById(user.value.id)
    userProfile.value = Array.isArray(userProfileData) ? userProfileData[0] : userProfileData
    if (!cachedProfile) saveCache(`userProfile_${user.value.id}`, userProfile.value)
    user.value.currency = userProfile.value?.currency_preference || 'N/A'

    // -- Enfants --
    const cachedChildren = loadCache(`childUsers_${user.value.id}`)
    childUsers.value = cachedChildren || await getUsersCreatedByMe()
    if (!cachedChildren) saveCache(`childUsers_${user.value.id}`, childUsers.value)

    allUsers.value = [user.value, ...childUsers.value]

    // -- Utilisateurs pour les charts --
    usersForCharts.value = [
      user.value,
      ...childUsers.value.filter(c => c.status === "CAISSIER")
    ]

    // -- Profils enfants en cache --
    await Promise.all(childUsers.value.map(async (child) => {
      const childCache = loadCache(`userProfile_${child.id}`)
      const childProfile = childCache || await fetchUserProfilById(child.id)
      child.profile = Array.isArray(childProfile) ? childProfile[0] : childProfile
      if (!childCache) saveCache(`userProfile_${child.id}`, child.profile)
      child.currency = child.profile?.currency_preference || 'N/A'
    }))

    // -- Factures, cashouts et entrées (optionnel: cache aussi si beaucoup de données) --
    const invoicesCache = loadCache(`invoices_${activeUserId}`)
    const allInvoices = invoicesCache || await fetchInvoicesAllUsers(activeUserId)
    if (!invoicesCache) saveCache(`invoices_${activeUserId}`, allInvoices)

    invoices.value = allInvoices.filter(inv => inv.status === "VALIDE")
    invoicesCancel.value = allInvoices.filter(inv => inv.status === "ANNULER")

    const cashoutsCache = loadCache(`cashouts_${activeUserId}`)
    const allCashouts = cashoutsCache || await fetchCashoutAllUsers(activeUserId)
    if (!cashoutsCache) saveCache(`cashouts_${activeUserId}`, allCashouts)
    cashouts.value = allCashouts || []

    const entryCache = loadCache(`entries_${activeUserId}`)
    const allEntrys = entryCache || await fetchEntryNoteAllUser(activeUserId)
    if (!entryCache) saveCache(`entries_${activeUserId}`, allEntrys)
    cashInts.value = allEntrys || []
    // -- Mise à jour dashboard --
    updateDashboardCards()
    updatePieChart()

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

function computeUsersForCharts() {
  
  const connected = user.value;

  if (selectedUserId.value) {
    return allUsers.value.filter(u => u.id === parseInt(selectedUserId.value));
  }

  if (connected.status === "CAISSIER") {
    return [connected];
  }

  if (selectedGroup.value === "ADMIN") {
    return allUsers.value.filter(u => u.status === "ADMIN");
  }

  if (selectedGroup.value === "CAISSIER") {
    return allUsers.value.filter(u => u.status === "CAISSIER");
  }

  return [
    connected,
    ...childUsers.value.filter(u => u.status === "CAISSIER")
  ];
}

async function getAllUserIdsForDashboard(baseUserId){

  const ids =[baseUserId];
  
  let children = await getUsersCreatedBy(baseUserId)

  children = children?.results || []
  const caissiers = children.filter(u => u.status === "CAISSIER");
  ids.push(...caissiers.map(c => c.id));
  return ids;
}

const currentUserId = ref(null)

watch(selectedUserId, () => {
  currentUserId.value = selectedUserId.value === null ? user.value.id : parseInt(selectedUserId.value)
  updateDashboardCards()
  updatePieChart()
  
});

watch(selectedGroup, () => {
  usersForCharts.value =computeUsersForCharts();
  updateDashboardCards();
  updatePieChart();
});

watch(() => selectDate.value.global.value, () => {
  updateDashboardCards()
  updatePieChart()
  
})

function exchangeRate(value){
  const rate =Number(userProfile.value?.exchange_rate || 1);
  const currency = userProfile.value?.currency_preference;
  if(currency ==="CDF"){
    return `${( value / rate ).toFixed(2)} USD`;
  }
  if(currency === "USD"){
    return `${( value * rate ).toFixed(2)} CDF`;
  }
  return value;
}


async function updateDashboardCards() {
  
  const selectedDateVal = selectDate.value.global.value

  let baseUserId = selectedUserId.value
    ? parseInt(selectedUserId.value)     // ADMIN sélectionné
    : user.value?.id                     // ADMIN connecté ou caissier connecté

    let userIdsForCards = []

    if (selectedGroup.value === "CAISSIER") {
      
      let children = await getUsersCreatedBy(baseUserId);
      
      children = children?.results || [];
      const caissiers = children.filter(u => u.status ==="CAISSIER");
      userIdsForCards.push(...caissiers.map(c =>c.id))
      console.log(">>> Mode CAISSIER : utilisateur + son caissier direct :", userIdsForCards)
     
    } else {
     
      userIdsForCards = await getAllUserIdsForDashboard(baseUserId)
      console.log(">>> Mode normal :", userIdsForCards)
    }


  console.log(">>> User de base :", baseUserId)

  console.log(">>> IDs finaux (admin + caissiers) :", userIdsForCards)

 
  // Filtrer invoices
  const filteredInvoices = invoices.value.filter(
    inv =>
      userIdsForCards.includes(inv.cashier) &&
      new Date(inv.created_at).toISOString().split('T')[0] === selectedDateVal
  )
  
  const filteredCancelInvoices = invoicesCancel.value.filter(
    inv => 
    userIdsForCards.includes(inv.cashier) && 
    new Date(inv.created_at).toISOString().split('T')[0] ===selectedDateVal
  )

  canceledInvoicesCount.value = filteredCancelInvoices.length

  // Filtrer cashouts
  const filteredCashouts = cashouts.value.filter(
    c =>
      userIdsForCards.includes(c.user) &&
      new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal && c.currency ==='CDF' 
  )

  // Filtrer cash entries
  const filteredCashInt = cashInts.value.filter(
    c =>
      userIdsForCards.includes(c.user) &&
      new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal &&
      c.currency ==='CDF'
  )
  // Filtre cash entre USD
  const filteredCashIntUSD = cashInts.value.filter(
    c => 
     userIdsForCards.includes(c.user) &&
     new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal &&
      c.currency ==='USD'
  )
 
  // Filter le casheOutUSD
  const filterCashoutUSD = cashouts.value.filter(
    c =>
      userIdsForCards.includes(c.user) && 
      new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal && c.currency ==='USD'
      
  )

  // Calculs des totaux
  total_tva_valid.value = filteredInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.tva || 0),
    0
  )

  canceledTotalAmount.value = filteredCancelInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total_amount || 0),
    0
  )

  todaysInvoicesUserConnectCount.value = filteredInvoices.length
 
  total_AmountUserConnect.value = filteredInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total_amount || 0),
    0
  )
 

  total_ProfitAmountUserConnect.value = filteredInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.profit_amount || 0),
    0
  )
  todaysCashoutCount.value = (filteredCashouts.length) + (filterCashoutUSD.length)

  total_AmountCashOut.value = filteredCashouts.reduce(
    (sum, c) => sum + parseFloat(c.total_amount || 0),
    0
  )
  total_AmountCashInt.value = filteredCashInt.reduce(
    (sum, c) => sum + parseFloat(c.total_amount || 0),
    0
  )

  total_AmountCashIntUSD.value = filteredCashIntUSD.reduce(
    (sum, c) => sum + parseFloat(c.total_amount || 0),
    0
  )

  total_CashIntCount.value = (filteredCashInt.length) + (filteredCashIntUSD.length)

  total_AmountCashoutUSD.value = filterCashoutUSD.reduce(
    (sum, c) => sum + parseFloat(c.total_amount || 0),
    0
  )
}

async function computeAdminPieData(selectedDateVal) {
  const labels = [];
  const data = [];
  const legend = [];
  const baseColors = [
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)'
  ];

  const admins = allUsers.value.filter(u => u.status === "ADMIN");

  for (let i = 0; i < admins.length; i++) {
    const admin = admins[i];

    // Récupérer tous les descendants directs
    const allChildren = await getUsersCreatedBy(admin.id); // retourne un objet {results: [...]}
    const children = allChildren?.results || [];

    // Filtrer les caissiers directs
    const directCashiers = children.filter(c => c.status === "CAISSIER");

    // Total pour l'admin
    let adminTotal = 0;
    invoices.value.forEach(inv => {
      const invoiceDate = new Date(inv.created_at).toISOString().split('T')[0];
      if (invoiceDate === selectedDateVal && inv.cashier === admin.id) {
        adminTotal += parseFloat(inv.total_amount || 0);
      }
    });

    // Total pour ses caissiers directs uniquement
    let cashiersTotal = 0;
    invoices.value.forEach(inv => {
      const invoiceDate = new Date(inv.created_at).toISOString().split('T')[0];
      if (
        invoiceDate === selectedDateVal &&
        directCashiers.some(c => c.id === inv.cashier)
      ) {
        cashiersTotal += parseFloat(inv.total_amount || 0);
      }
    });

    const totalWithCashiers = adminTotal + cashiersTotal;

    console.log('admin :', i, 'adminTotal:', adminTotal, 'cashiersTotal:', cashiersTotal, 'total:', totalWithCashiers);

    labels.push(admin.username);
    data.push(totalWithCashiers);
    legend.push({
      name: admin.username,
      amount: totalWithCashiers,
      currency: admin.currency,
      color: baseColors[i % baseColors.length]
    });
  }

  return { labels, data, legend };
}

async function updatePieChart() {
  const selectedDateVal = selectDate.value.global.value;
  const isUserSelected = !!selectedUserId.value;
  const baseUserId = isUserSelected ? parseInt(selectedUserId.value) : user.value.id;

  // 1️⃣ Récupérer enfants/cashiers
  const children = (await getUsersCreatedBy(baseUserId))?.results || [];
  const cashiers = children.filter(u => u.status === "CAISSIER");

  const baseUserInfo = allUsers.value.find(u => u.id === baseUserId) || {
    username: isUserSelected ? "Admin" : user.value.username,
    currency: user.value.currency
  };

  // 2️ Calculer les totaux par utilisateur pour la date sélectionnée
  const totalsByCashier = {};
  invoices.value.forEach(inv => {
    const invoiceDate = new Date(inv.created_at).toISOString().split('T')[0];
    if (invoiceDate === selectedDateVal) {
      totalsByCashier[inv.cashier] = (totalsByCashier[inv.cashier] || 0) + parseFloat(inv.total_amount || 0);
    }
  });

  const labels = [];
  const data = [];
  const legend = [];
  const baseColors = [
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)'
  ];

  if (selectedGroup.value === "ADMIN") {
    //  ADMIN : afficher uniquement les admins, total de leurs caissiers inclus
    const admins = allUsers.value.filter(u => u.status === "ADMIN");
    const lineUsers = [];

    for (let i = 0; i < admins.length; i++) {
      const admin = admins[i];
      const allChildren = await getUsersCreatedBy(admin.id);
      const children = allChildren?.results || [];
      const directCashiers = children.filter(c => c.status === "CAISSIER");

      // Total admin
      const adminTotal = invoices.value
        .filter(inv => inv.cashier === admin.id && new Date(inv.created_at).toISOString().split('T')[0] === selectedDateVal)
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

      // Total caissiers directs
      const cashiersTotal = directCashiers
        .map(c => invoices.value
          .filter(inv => inv.cashier === c.id && new Date(inv.created_at).toISOString().split('T')[0] === selectedDateVal)
          .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
        )
        .reduce((a, b) => a + b, 0);

      const totalWithCashiers = adminTotal + cashiersTotal;

      // Pie chart
      labels.push(admin.username);
      data.push(totalWithCashiers);
      legend.push({
        name: admin.username,
        amount: totalWithCashiers,
        currency: admin.currency,
        color: baseColors[i % baseColors.length]
      });

      // Line chart : admin seulement, caissiers cachés mais leurs totaux inclus
      lineUsers.push({
        id: admin.id,
        username: admin.username,
        currency: admin.currency,
        directCashiers
      });
    }

    pieData.value = { labels, datasets: [{ data, backgroundColor: legend.map(l => l.color) }], legend };
    updateLineChart(lineUsers, "ADMIN");

  } else if (selectedGroup.value === "CAISSIER") {

  cashiers.forEach((c, i) => {
    const total = totalsByCashier[c.id] || 0;
    if (total > 0) {
      labels.push(c.username);
      data.push(total);
      legend.push({
        name: c.username,
        amount: total,
        color: baseColors[i % baseColors.length],
        currency: baseUserInfo.currency   //  Devise du parent
      });
    }
  });

  //  IMPORTANT : assigner aussi la devise pour le chart ligne
  cashiers.forEach(c => {
    c.currency = baseUserInfo.currency;
  });



    pieData.value = { labels, datasets: [{ data, backgroundColor: legend.map(l => l.color) }], legend };
    updateLineChart(cashiers);


  } else {
// 🔹 Cas normal : utilisateur + ses caissiers visibles
const allUsersOfBase = [
  { id: baseUserId, username: baseUserInfo.username, currency: baseUserInfo.currency },
  ...cashiers.map(c => ({
    id: c.id,
    username: c.username,
    // ⚡ Devise = celle de l'admin direct (baseUserInfo.currency) par défaut USD si vide
    currency: baseUserInfo.currency || 'USD'
  }))
];

allUsersOfBase.forEach((u, i) => {
  const total = totalsByCashier[u.id] || 0;
  if (total > 0) {
    labels.push(u.username);
    data.push(total);
    legend.push({
      name: u.username,
      amount: total,
      color: baseColors[i % baseColors.length],
      currency: u.currency // affichera la devise de l'admin direct
    });
  }
});


    pieData.value = { labels, datasets: [{ data, backgroundColor: legend.map(l => l.color) }], legend };
    updateLineChart(allUsersOfBase);
  }

  // Options Pie chart
  pieOptions.value = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Factures par caissier(e)s" }
    }
  };
}

// ===== Line Chart =====
function updateLineChart(usersList, selectedGroupValue = "") {
  const selectedDateVal = selectDate.value.global.value;
  const datasets = [];
  const baseColors = [
    '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC',
    '#26C6DA', '#FF7043', '#8D6E63', '#EC407A'
  ];

  const selectedDate = new Date(selectedDateVal);
  const startDate = new Date(selectedDate);
  const day = startDate.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startDate.setDate(startDate.getDate() + diff);

  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  usersList.forEach((item, i) => {
    const admin = item; // admin ou caissier selon le cas
    const dailyTotals = {};
    let totalAmount = 0;

    invoices.value.forEach(inv => {
      const dateStr = new Date(inv.created_at).toISOString().split('T')[0];

      if (labels.includes(dateStr)) {
        if (selectedGroupValue === "ADMIN") {
          // Somme des totaux : admin + ses caissiers directs, caissiers cachés
          const directCashiers = item.directCashiers || [];
          if (inv.cashier === admin.id || directCashiers.some(c => c.id === inv.cashier)) {
            const amt = parseFloat(inv.total_amount) || 0;
            dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + amt;
            totalAmount += amt;
          }
        } else {
          if (inv.cashier === admin.id) {
            const amt = parseFloat(inv.total_amount) || 0;
            dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + amt;
            totalAmount += amt;
          }
        }
      }
    });

    datasets.push({
      label: `${admin.username} (${admin.currency}) — ${formatPrice(totalAmount)}`,
      data: labels.map(l => dailyTotals[l] || 0),
      borderColor: baseColors[i % baseColors.length],
      backgroundColor: baseColors[i % baseColors.length],
      tension: 0.3
    });
  });

  lineData.value = { labels, datasets };
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
async function chekeSecretKey(){
  try{
    const res = await checkSecretKeyStatus();
    hasSecretKey.value = res.has_key || false;
  }catch(error){
    console.error("Erreur lors de la verification du code secret", error);
  }
}
 function openView(){

   if(hasSecretKey.value == true){
     secretDialog.value = true
   }else{
    showSensitiveInfo.value = true;
   }
 }


async function generatePDF() {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const selectedDateVal = selectDate.value.global.value
  const connectedUserProfile = userProfile.value

  // === HEADER PRINCIPAL ===
  pdf.setFillColor(0, 77, 74)
  pdf.rect(0, 0, 210, 30, 'F')

  pdf.setFontSize(20)
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(255)
  pdf.text('Rapport des ventes', 105, 15, { align: 'center' })

  pdf.setFontSize(12)
  pdf.setFont(undefined, 'normal')
  pdf.text(`Date : ${selectedDateVal}`, 105, 23, { align: 'center' })

  pdf.setDrawColor(255)
  pdf.setLineWidth(1)
  pdf.line(12, 30, 198, 30)

  // === PROFIL ENTREPRISE ===
  let currentY = 38
  const infoLines = [
    `Entreprise : ${connectedUserProfile.entrep_name || 'N/A'}`,
    `Téléphone : ${connectedUserProfile.phone_number || 'N/A'}`,
    `Adresse : ${connectedUserProfile.adress || 'N/A'}`,
    `RCCM : ${connectedUserProfile.rccm_number || 'N/A'}`,
    `Numéro d’impôt : ${connectedUserProfile.impot_number || 'N/A'}`
  ]

  pdf.setFont(undefined, 'normal')
  pdf.setTextColor(33, 33, 33)

  infoLines.forEach(line => {
    currentY += 7
    pdf.text(line, 105, currentY, { align: 'center' })
  })

  currentY += 8
  pdf.setDrawColor(0, 77, 74)
  pdf.setLineWidth(0.8)
  pdf.line(12, currentY, 198, currentY)
  currentY += 10

  // === PRÉPARATION DES DONNÉES PAR UTILISATEUR ===
  const tableData = allUsers.value.map(u => {
    const userInvoices = invoices.value.filter(inv =>
      inv.cashier === u.id &&
      new Date(inv.created_at).toISOString().split('T')[0] === selectedDateVal
    )

    const userCashOuts = cashouts.value.filter(c =>
      c.user === u.id &&
      new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal
    )

    const userCashInt = cashInts.value.filter(c =>
      c.user === u.id &&
      new Date(c.created_at).toISOString().split('T')[0] === selectedDateVal
    )

    // Factures annulées
    const cancelledInvoices = userInvoices.filter(inv => inv.is_canceled === true)

    return {
      name: u.username,
      currency: u.currency || 'N/A',

      totalFacture: userInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0),
      nbFactures: userInvoices.length,

      totalTVA: userInvoices.reduce((sum, inv) => sum + parseFloat(inv.tva || 0), 0),

      totalCashInt: userCashInt.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0),
      totalCashOut: userCashOuts.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0),

      //  Ajout des factures annulées
      nbFacturesAnnulees: cancelledInvoices.length,
      totalFacturesAnnulees: cancelledInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0)
    }
  })

  // === TABLEAU ===
  const startX = 8
  const rowHeight = 8
  const rowColors = [[245, 245, 245], [255, 255, 255]]
  const highlightColor = [255, 165, 0]

  // HEADER TABLEAU
  pdf.setFont(undefined, 'bold')
  pdf.setTextColor(255)
  pdf.setFillColor(0, 77, 74)
  pdf.rect(startX, currentY - 6, 186, rowHeight, 'F')

  pdf.text('Nom', startX + 1, currentY)
  pdf.text('Total FV', startX + 32, currentY)
  pdf.text('Nb.FV', startX + 63, currentY)
  pdf.text('TVA', startX + 80, currentY)
  pdf.text('Entrées', startX + 105, currentY)
  pdf.text('Sorties', startX + 130, currentY)

  //  colonnes pour factures annulées
  pdf.text('Nb.FA', startX + 148, currentY)
  pdf.text('Total FA', startX + 168, currentY)

  currentY += rowHeight
  pdf.setFont(undefined, 'normal')

  // ROWS
  tableData.forEach((d, index) => {
    const bgColor = rowColors[index % 2]
    pdf.setFillColor(...bgColor)
    pdf.rect(startX, currentY - 6, 186, rowHeight, 'F')

    pdf.setTextColor(0)
    pdf.text(d.name, startX + 1, currentY)

    pdf.setTextColor(...highlightColor)
    pdf.text(`${formatPrice(d.totalFacture)} ${d.currency}`, startX + 32, currentY)

    pdf.setTextColor(0)
    pdf.text(d.nbFactures.toString(), startX + 63, currentY)

    pdf.setTextColor(...highlightColor)
    pdf.text(formatPrice(d.totalTVA), startX + 80, currentY)

    pdf.setTextColor(0)
    pdf.text(`${formatPrice(d.totalCashInt)} ${d.currency}`, startX + 105, currentY)
    pdf.text(`${formatPrice(d.totalCashOut)} ${d.currency}`, startX + 130, currentY)

    //  Factures annulées
    pdf.setTextColor(255, 0, 0)
    pdf.text(d.nbFacturesAnnulees.toString(), startX + 155, currentY)

    pdf.text(`${formatPrice(d.totalFacturesAnnulees)} ${d.currency}`, startX + 178, currentY)
    currentY += rowHeight
  })

  // === LOGO EN BAS ===
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
  chekeSecretKey();
  console.log('total cashout USD :', total_AmountCashoutUSD.value)
})

</script>





<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">

        <!-- Filtres -->
      <div class="filters-bar">

        <div v-if="statusUser !='CAISSIER'" class="filter-group">
          <label class="filter-label">
            <i class="pi pi-user text-xs"></i>
            Filtrer par Caissier
          </label>

          <Select
            v-model="selectedUserId"
            :options="allUsers.filter(u => u.status !== 'GESTIONNAIRE_STOCK' && u.status !== 'ADMIN')"
            optionValue="id"
            optionLabel="username"
            placeholder="Filtrer par utilisateur"
            class="w-full sm:w-56"
            showClear
          >
            <template #option="{ option }">
              <div class="flex justify-between items-center gap-2">
                <span>{{ option.username }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-semibold"
                  :class="{
                    'bg-emerald-50 text-emerald-600': option.status === 'ADMIN',
                    'bg-teal-50 text-teal-600': option.status === 'CAISSIER',
                  }"
                >
                  {{ option.status }}
                </span>
              </div>
            </template>

            <template #selectedItem="{ option }">
              <div class="flex justify-between items-center gap-2">
                <span>{{ option.username }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-semibold"
                  :class="{
                    'bg-emerald-50 text-emerald-600': option.status === 'ADMIN',
                    'bg-teal-50 text-teal-600': slotProps.option.status === 'CAISSIER',
                  }"
                >
                  {{ option.status }}
                </span>
              </div>
            </template>
          </Select>
        </div>

        <div v-if="statusUser !='CAISSIER'" class="filter-group">
          <label class="filter-label">
            <i class="pi pi-shield text-xs"></i>
            Filtrer par Admin
          </label>

          <Select
            v-model="selectedUserId"
            :options="allUsers.filter(u => u.status !== 'GESTIONNAIRE_STOCK' && u.status !== 'CAISSIER')"
            optionValue="id"
            optionLabel="username"
            placeholder="Filtrer par utilisateur"
            class="w-full sm:w-56"
            showClear
          >
            <template #option="{ option }">
              <div class="flex justify-between items-center gap-2">
                <span>{{ option.username }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-semibold"
                  :class="{
                    'bg-emerald-50 text-emerald-600': option.status === 'ADMIN',
                    'bg-teal-50 text-teal-600': option.status === 'CAISSIER',
                  }"
                >
                  {{ option.status }}
                </span>
              </div>
            </template>

            <template #selectedItem="{ option }">
              <div class="flex justify-between items-center gap-2">
                <span>{{ option.username }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-semibold"
                  :class="{
                    'bg-emerald-50 text-emerald-600': option.status === 'ADMIN',
                    'bg-teal-50 text-teal-600': slotProps.option.status === 'CAISSIER',
                  }"
                >
                  {{ option.status }}
                </span>
              </div>
            </template>
          </Select>
        </div>

        <div v-if="statusUser !='CAISSIER'" class="filter-group">
          <label class="filter-label">
            <i class="pi pi-users text-xs"></i>
            Filtrer groupe
          </label>

          <Select
            v-model="selectedGroup"
            :options="[
              { label: 'Aucun', value: null },
              { label: 'Tous les Admins', value: 'ADMIN' },
              { label: 'Tous les Caissiers', value: 'CAISSIER' }
            ]"
            optionLabel="label"
            optionValue="value"
            class="w-full sm:w-56"
            placeholder="Filtrer groupe"
            showClear
          />
        </div>

        <!-- Sélecteur de date -->
        <div class="filter-group">
          <label for="date-select" class="filter-label">
            <i class="pi pi-calendar text-xs"></i>
            Sélectionner une date
          </label>
          <InputText
            id="date-select"
            type="date"
            v-model="selectDate.global.value"
            class="w-full sm:w-auto"
          />
        </div>

        <!-- Actions -->
        <div class="filter-actions">
          <Button
            label="Générer le Rapport"
            icon="pi pi-file-pdf"
            severity="success"
            @click="generatePDF"
          />
          <Button
            label="Actualiser"
            icon="pi pi-refresh"
            severity="warning"
            outlined
            @click="forceRefresh"
          />
        </div>

      </div>

<!-- Dashboard Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

      <!-- Factures valides (count) -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Nombre Factures Valides</span>
          <div class="dash-icon-badge bg-emerald-50 text-emerald-600">
            <i class="pi pi-check-circle"></i>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center flex-1 py-3">
          <span class="text-4xl font-extrabold text-emerald-600 leading-none">
            {{ todaysInvoicesUserConnectCount }}
          </span>
          <span class="text-xs font-semibold text-emerald-500 mt-1 uppercase tracking-wide">
            Valides
          </span>
        </div>

        <div class="dash-footer">
          <i class="pi pi-calendar text-xs"></i>
          {{ selectDate.global.value || 'Toutes les dates' }}
        </div>
      </div>

      <!-- Total Factures Valide -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Total Factures Valides</span>
          <div class="dash-icon-badge bg-emerald-50 text-emerald-600">
            <i class="pi pi-money-bill"></i>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center">
          <div class="dash-amount text-slate-800 dark:text-slate-100">
            {{ formatPrice(total_AmountUserConnect) }}
            <span class="dash-currency">{{ selectedUserProfile?.currency_preference || 'N/A' }}</span>
          </div>
          <div class="dash-amount-secondary">
            ({{ exchangeRate(total_AmountUserConnect) }})
          </div>
        </div>

        <div class="dash-footer">
          <i class="pi pi-calendar text-xs"></i>
          Total pour aujourd'hui : {{ selectDate.global.value }}
        </div>
      </div>

      <!-- Bénéfice estimé -->
      <div v-if="statusUser != 'CAISSIER'" class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Bénéfice estimé</span>
          <div class="dash-icon-badge bg-amber-50 text-amber-500">
            <i class="pi pi-wallet"></i>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center">
          <div class="dash-amount text-slate-800 dark:text-slate-100">
            <span v-if="showSensitiveInfo">
              {{ formatPrice(total_ProfitAmountUserConnect) }}
              <span class="dash-currency">{{ selectedUserProfile?.currency_preference || 'N/A' }}</span>
            </span>
            <span v-else class="text-slate-300 dark:text-slate-600 tracking-widest">••••••</span>
          </div>

          <div v-if="showSensitiveInfo" class="dash-amount-secondary">
            ({{ exchangeRate(total_ProfitAmountUserConnect) }})
          </div>
        </div>

        <Button
          v-if="!showSensitiveInfo"
          label="Afficher le bénéfice"
          icon="pi pi-lock"
          severity="warning"
          size="small"
          class="mt-2 w-full"
          @click="openView"
        />
      </div>

      <!-- Total Entrée -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Total Entrée</span>
          <div class="dash-icon-badge bg-emerald-50 text-emerald-600">
            <i class="pi pi-arrow-down-left"></i>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center gap-1">
          <div class="dash-amount text-emerald-600">
            {{ formatPrice(total_AmountCashInt) }}
            <span class="dash-currency text-emerald-500">{{ selectedUserProfile?.currency_preference || 'N/A' }}</span>
          </div>
          <div class="dash-amount text-emerald-600">
            {{ formatPrice(total_AmountCashIntUSD) }}
            <span class="dash-currency text-emerald-500">USD</span>
          </div>
        </div>

        <div class="dash-footer justify-between">
          <span>Nombre de dépenses</span>
          <span class="dash-count-pill bg-emerald-50 text-emerald-600">{{ total_CashIntCount }}</span>
        </div>
      </div>

      <!-- Factures Annulées (count) -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Factures Annulées</span>
          <div class="dash-icon-badge bg-red-50 text-red-500">
            <i class="pi pi-times-circle"></i>
          </div>
        </div>

        <div class="flex flex-col items-center justify-center flex-1 py-3">
          <span class="text-4xl font-extrabold text-red-500 leading-none">
            {{ canceledInvoicesCount }}
          </span>
          <span class="text-xs font-semibold text-red-400 mt-1 uppercase tracking-wide">
            Annulées
          </span>
        </div>

        <div class="dash-footer">
          <i class="pi pi-calendar text-xs"></i>
          {{ selectDate.global.value || 'Toutes les dates' }}
        </div>
      </div>

      <!-- Total Factures Annulées -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Total Factures Annulées</span>
          <div class="dash-icon-badge bg-red-50 text-red-500">
            <i class="pi pi-ban"></i>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center">
          <div class="dash-amount text-red-500">
            {{ formatPrice(canceledTotalAmount) }}
            <span class="dash-currency text-red-400">{{ selectedUserProfile?.currency_preference || 'N/A' }}</span>
          </div>
          <div class="dash-amount-secondary">
            ({{ exchangeRate(canceledTotalAmount) }})
          </div>
        </div>

        <div class="dash-footer">
          <i class="pi pi-calendar text-xs"></i>
          Total pour aujourd'hui : {{ selectDate.global.value }}
        </div>
      </div>

      <!-- Total TVA valide -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Total TVA valide</span>
          <div class="dash-icon-badge bg-emerald-50 text-emerald-600">
            <i class="pi pi-arrow-down-left"></i>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center">
          <div class="dash-amount text-emerald-600">
            {{ formatPrice(total_tva_valid) }}
            <span class="dash-currency text-emerald-500">{{ selectedUserProfile?.currency_preference || 'N/A' }}</span>
          </div>
          <div class="dash-amount-secondary">
            ({{ exchangeRate(total_tva_valid) }})
          </div>
        </div>
      </div>

      <!-- Total dépassé -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span class="dash-label">Total dépassé</span>
          <div class="dash-icon-badge bg-red-50 text-red-500">
            <i class="pi pi-arrow-up-right"></i>
          </div>
        </div>

        <div class="flex-1 flex flex-col justify-center gap-1">
          <div class="dash-amount text-red-500">
            {{ formatPrice(total_AmountCashOut) }}
            <span class="dash-currency text-red-400">{{ selectedUserProfile?.currency_preference || 'N/A' }}</span>
          </div>
          <div class="dash-amount text-red-500">
            {{ formatPrice(total_AmountCashoutUSD) }}
            <span class="dash-currency text-red-400">USD</span>
          </div>
        </div>

        <div class="dash-footer justify-between">
          <span>Nombre de dépenses</span>
          <span class="dash-count-pill bg-red-50 text-red-500">{{ todaysCashoutCount }}</span>
        </div>
      </div>

    </div>




      <!-- Charts Section -->
<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

  <!-- 📈 Line Chart -->
  <div class="chart-card">
    <div class="chart-card-header">
      <div class="chart-icon-badge bg-teal-50 text-[#004D4A]">
        <i class="pi pi-chart-line"></i>
      </div>
      <div>
        <div class="chart-title">Factures pour la semaine</div>
        <div class="chart-subtitle">Évolution quotidienne</div>
      </div>
    </div>

    <div class="chart-divider"></div>

    <Chart
      id="lineChart"
      type="line"
      :data="lineData"
      :options="lineOptions"
      class="flex-1 w-full min-h-[250px] sm:min-h-[300px]"
    />
  </div>

  <!-- Doughnut Chart + Légende -->
  <div class="chart-card">
    <div class="chart-card-header">
      <div class="chart-icon-badge bg-amber-50 text-amber-500">
        <i class="pi pi-chart-pie"></i>
      </div>
      <div>
        <div class="chart-title">Factures par Caissier</div>
        <div class="chart-subtitle">Répartition des ventes</div>
      </div>
    </div>

    <div class="chart-divider"></div>

    <Chart
      id="doughnut"
      type="doughnut"
      :data="pieData"
      :options="pieOptions"
      class="flex-1 w-full min-h-[250px] sm:min-h-[300px]"
    />

    <!-- Légende dynamique -->
    <div v-if="pieData?.legend?.length" class="chart-legend">
      <div
        v-for="(item, index) in pieData.legend"
        :key="index"
        class="chart-legend-item"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span :style="{ backgroundColor: item.color }" class="chart-legend-dot"></span>
          <span class="chart-legend-name">{{ item.name }}</span>
        </div>
        <span class="chart-legend-amount">
          {{ formatPrice(item.amount) }} {{ item.currency || 'N/A' }}
        </span>
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

.dash-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
  border-radius: 16px;
  height: 100%;
  background-color: #fff;
  border: 1.5px solid var(--surface-100, #f1f5f9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.dash-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

:global(.dark) .dash-card {
  background-color: #1e293b;
  border-color: #334155;
}

.dash-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.dash-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  line-height: 1.3;
  max-width: 75%;
}

:global(.dark) .dash-label {
  color: #94a3b8;
}

.dash-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.dash-amount {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.dash-currency {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.7;
}

.dash-amount-secondary {
  font-size: 0.8rem;
  font-weight: 600;
  color: #f97316;
  margin-top: 0.2rem;
}

.dash-footer {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  margin-top: 0.75rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--surface-100, #f1f5f9);
}

:global(.dark) .dash-footer {
  border-top-color: #334155;
}

.dash-count-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
}

/* ── section filtre ── */


.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  background-color: #fff;
  border: 1.5px solid var(--surface-100, #f1f5f9);
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);

  /* ── Sticky ── */
  position: sticky;
  top: 0;
  z-index: 20;
}

:global(.dark) .filters-bar {
  background-color: #1e293b;
  border-color: #334155;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  background-color: #fff;
  border: 1.5px solid var(--surface-100, #f1f5f9);
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

:global(.dark) .filters-bar {
  background-color: #1e293b;
  border-color: #334155;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

:global(.dark) .filter-label {
  color: #94a3b8;
}

.filter-label i {
  color: #004D4A;
}

.filter-actions {
  display: flex;
  gap: 0.6rem;
  margin-left: auto;
  align-self: flex-end;
}

@media (max-width: 768px) {
  .filter-actions {
    margin-left: 0;
    width: 100%;
    align-self: stretch;
  }

  .filter-actions :deep(.p-button) {
    flex: 1;
  }
}

/* ── section charte── */

.chart-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.25rem;
  border-radius: 16px;
  background-color: #fff;
  border: 1.5px solid var(--surface-100, #f1f5f9);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

:global(.dark) .chart-card {
  background-color: #1e293b;
  border-color: #334155;
}

.chart-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chart-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.chart-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
}

:global(.dark) .chart-title {
  color: #f1f5f9;
}

.chart-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.chart-divider {
  height: 1px;
  background-color: var(--surface-100, #f1f5f9);
  margin: 1rem 0;
}

:global(.dark) .chart-divider {
  background-color: #334155;
}

/* ── Légende ── */
.chart-legend {
  width: 100%;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-100, #f1f5f9);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:global(.dark) .chart-legend {
  border-top-color: #334155;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  transition: background-color 0.15s ease;
}

.chart-legend-item:hover {
  background-color: var(--surface-50, #f8fafc);
}

:global(.dark) .chart-legend-item:hover {
  background-color: #273548;
}

.chart-legend-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.chart-legend-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark) .chart-legend-name {
  color: #cbd5e1;
}

.chart-legend-amount {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  flex-shrink: 0;
}

:global(.dark) .chart-legend-amount {
  color: #f1f5f9;
}


</style>