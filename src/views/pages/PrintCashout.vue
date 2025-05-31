<script setup>
import { fetchCashOutDetail } from '@/service/Api'
import html2pdf from 'html2pdf.js'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const cashoutId = route.params.id
const cashoutDetails = ref([])
const motif = ref('')
const selectedCashout = ref(cashoutId)

onMounted(async () => {
  try {
    const details = await fetchCashOutDetail(cashoutId)
    cashoutDetails.value = details
    if (details.length > 0) {
      motif.value = details[0].motif || 'Aucun motif'
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error)
  }
})

const totalAmount = computed(() =>
  cashoutDetails.value.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)
)

function downloadPDF() {
  const element = document.getElementById('pdf-content')
  html2pdf().from(element).set({
    margin: 0.5,
    filename: `bon_sortie_${selectedCashout.value}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }).save()
}
</script>

<template>
  <div class="p-6 bg-gray-100 min-h-screen">
    <button @click="downloadPDF" class="bg-blue-600 text-white px-4 py-2 rounded mb-6">Télécharger PDF</button>

    <div id="pdf-content" class="bg-white p-6 border border-gray-300 max-w-3xl mx-auto">
      <div class="mb-4 text-center">
        <h1 class="text-xl font-bold">Bon de Sortie N° 000{{ selectedCashout }}/25</h1>
        <p class="text-sm">Date : {{ new Date().toLocaleString() }}</p>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold">Motif :</h3>
        <p class="ml-2">{{ motif }}</p>
      </div>

      <table class="w-full border-collapse border border-gray-400 mb-4 text-sm">
        <thead>
          <tr class="bg-gray-200">
            <th class="border border-gray-400 px-2 py-1">ID</th>
            <th class="border border-gray-400 px-2 py-1">Observation</th>
            <th class="border border-gray-400 px-2 py-1">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cashoutDetails" :key="item.id">
            <td class="border border-gray-400 px-2 py-1">{{ item.id }}</td>
            <td class="border border-gray-400 px-2 py-1">{{ item.reason }}</td>
            <td class="border border-gray-400 px-2 py-1">USD {{ item.amount }}</td>
          </tr>
        </tbody>
      </table>

      <div class="text-right font-bold text-lg">Total : {{ totalAmount }} USD</div>

      <div class="text-right mt-8">
        <p class="text-sm">Mr DELOR Musangania</p>
        <p class="text-sm">PDG BILATECH</p>
        <img src="/demo/signature.png" class="h-24 mt-2 inline" alt="Signature" />
      </div>
    </div>
  </div>
</template>
