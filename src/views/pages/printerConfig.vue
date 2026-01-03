<script setup>
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

const availablePrinters = ref([]);
const selectedPrinter = ref(localStorage.getItem('printerName') || null);
const qzDetected = ref(false);
const qzConnected = ref(false);
const copyCount = ref(Number(localStorage.getItem('printerCopyCount')) || 1);


// Connexion à QZ Tray
async function connectQZ() {
    if (!window.qz) {
        toast.add({ severity: 'error', summary: 'QZ Tray non détecté', detail: 'Veuillez installer et lancer QZ Tray.', life: 5000 });
        qzDetected.value = false;
        return false;
    }
    qzDetected.value = true;

    if (!qz.websocket.isActive()) {
        try {
            await qz.websocket.connect();
            qzConnected.value = true;
            console.log("✅ Connecté à QZ Tray !");
        } catch (err) {
            toast.add({ severity: 'error', summary: 'Connexion échouée', detail: 'Impossible de se connecter à QZ Tray.', life: 5000 });
            console.error(err);
            return false;
        }
    } else {
        qzConnected.value = true;
    }
    return true;
}

// Récupération des imprimantes
async function listPrinters() {
    if (!await connectQZ()) return;
    try {
        const printers = await qz.printers.find();
        // Transformer en objets pour Dropdown PrimeVue
        availablePrinters.value = printers.map(p => ({ name: p, value: p }));

        if (!selectedPrinter.value && printers.length > 0) {
            selectedPrinter.value = printers[0].value;
        }
    } catch (err) {
        console.error("Erreur récupération imprimantes :", err);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de récupérer la liste des imprimantes.', life: 5000 });
    }
}

// Test d'impression
async function testPrint() {
    if (!selectedPrinter.value) {
        toast.add({ severity: 'warn', summary: 'Aucune imprimante', detail: 'Veuillez sélectionner une imprimante.', life: 3000 });
        return;
    }
    const copies = Number(copyCount.value) || 1;
    try {
        const config = qz.configs.create(selectedPrinter.value);

        const data = [
            { type: 'raw', format: 'plain', data: '\x1B\x40' },
            '      Bilatech Solution\n',
            '--------------------------------\n',
            '   Test d\'impression réussi ✅\n',
            '--------------------------------\n',
            'Merci de votre confiance !\n\n',
            '\x1D\x56\x41\x10'
        ];
        
        for (let i = 0 ;i < copies; i ++){
           await qz.print(config, data);
        }
       

        toast.add({ severity: 'success', summary: 'Test réussi', detail: 'Ticket de test imprimé.', life: 3000 });
    } catch (err) {
        console.error("Erreur impression test :", err);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'imprimer le ticket de test.', life: 5000 });
    }
}

// Enregistrer l'imprimante sélectionnée
function savePrinter() {
    if (!selectedPrinter.value) {
        toast.add({ severity: 'warn', summary: 'Aucune imprimante', detail: 'Veuillez sélectionner une imprimante.', life: 3000 });
        return;
    }
    localStorage.setItem('printerName', selectedPrinter.value);
    localStorage.setItem('printerCopyCount', copyCount.value); 
    toast.add({ severity: 'success', summary: 'Enregistré', detail: `Imprimante "${selectedPrinter.value}" et ${copyCount.value} copie(s) enregistrée(s).`, life: 3000 });
}

// Initialisation au montage
onMounted(async () => {
    await connectQZ();
    await listPrinters();
});
</script>

<template>
  <div class="p-6 max-w-md mx-auto border rounded shadow-md">
    <h2 class="text-2xl font-bold mb-4">Paramètres Imprimante</h2>


    <div class="mb-4">
    <label class="block mb-2 font-semibold">Nombre de copies :</label>
    <input
        type="number"
        min="1"
        v-model.number="copyCount"
        class="w-full border rounded px-2 py-1"
    />
    </div>

    <div class="mb-4">
      <label class="block mb-2 font-semibold">Imprimante disponible :</label>
      <Dropdown
        v-model="selectedPrinter"
        :options="availablePrinters"
        optionLabel="name"
        optionValue="value"
        placeholder="Sélectionnez une imprimante"
        class="w-full"
      />
    </div>

    <div class="flex gap-3 mb-4">
      <Button label="Tester l'impression" icon="pi pi-print" class="p-button-success" @click="testPrint" />
      <Button label="Enregistrer" icon="pi pi-save" class="p-button-primary" @click="savePrinter" />
    </div>

    <div>
      <p>QZ Tray détecté : <span :class="qzDetected ? 'text-green-600' : 'text-red-600'">{{ qzDetected ? '✅ Oui' : '❌ Non' }}</span></p>
      <p>QZ Tray connecté : <span :class="qzConnected ? 'text-green-600' : 'text-red-600'">{{ qzConnected ? '✅ Oui' : '❌ Non' }}</span></p>
    </div>
  </div>
</template>

<style scoped>
</style>
