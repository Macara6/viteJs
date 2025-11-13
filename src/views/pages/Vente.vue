

<script setup>
      import { createInvoiceAPI, fetchProduits, fetchUserProfilById } from '@/service/Api';

import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

      
        const products = ref([]);
        const selectedProducts = ref([]);
        const filters = ref({
        global: { value: null, matchMode: 'contains' }
        });

const invoiceItems = ref([]);
        const clientName = ref('');
        const totalAmount = ref(0);
        const amountPaid = ref(null);
        const change = ref(0);
        const userProfile = ref(null);
const search = ref('');
const toast = useToast();
const barcodeSearch = ref('');


const availablePrinters = ref([]);
const selectedPrinter = ref(null);
const qzDetected = ref(false);

const pendingInvoices = ref([]);
const showPendingDialog = ref(false);

    onMounted(async () => {
        await loadProduct();
        await fetchUserProfl();
      
    });
 
    function filterProducts() {
    if (!barcodeSearch.value) {
        return products.value;
    }
    return products.value.filter(p => p.barcode?.includes(barcodeSearch.value));
    }



watch(barcodeSearch, (newValue) => {
  if (!newValue) return;

  const product = products.value.find(p => String(p.barcode) === String(newValue));
  
  if (product) {
    addToInvoice(product);  // ajoute automatiquement au panier
    barcodeSearch.value = ''; // réinitialise la barre de recherche
  }
});


    async function loadProduct() {
        const userId = localStorage.getItem('id');
        try {
            const fetchProduct = await fetchProduits(userId);
            products.value = fetchProduct;
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }

    async function fetchUserProfl(){
      const userId = localStorage.getItem('id');
      try{
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
      } catch(error){
        console.error('Erreur lors du chargement du profile utilisateur', error);
      }
    }

    function refreshPage() {
        loadProduct();
    }

    function formatPrice(value) {
        return Number(value).toLocaleString('fr-CD');
     }


    function updateQuantity(item, quantity) {
        if (quantity < 1){
          item.quantity = 1;
        }else{
           item.quantity = quantity;
        }
        updateTotal();
    }


    function removeFromInvoice(productId){
        invoiceItems.value = invoiceItems.value.filter(item => item.product.id !== productId);
        updateTotal();
    }

// fajouter le produit a la facture 
function addToInvoice(product) {
    // Vérifier le stock disponible
    if (product.stock < 1) {
        toast.add({
            severity: 'error',
            summary: 'Stock insuffisant',
            detail: `Le produit "${product.name}" est en rupture de stock.`,
            life: 5000
        });
        return;
    }

    const existing = invoiceItems.value.find(item => item.product.id === product.id);

    if (existing) {
        // Vérifier que la quantité totale n'excède pas le stock
        if (existing.quantity + 1 > product.stock) {
            toast.add({
                severity: 'error',
                summary: 'Stock insuffisant',
                detail: `Impossible d'ajouter plus de "${product.name}" (stock disponible: ${product.stock}).`,
                life: 5000
            });
            return;
        }
        existing.quantity += 1;
    } else {
        invoiceItems.value.push({
            product: product,
            quantity: 1,
            price: product.price,
            purchase_price: product.purchase_price
        });
    }

    updateTotal();
}

    function updateTotal(){
        totalAmount.value = invoiceItems.value.reduce((sum, item) => {
            return sum + item.quantity * item.price;
        },0);
    }
    
    watch(amountPaid, (newVal) => {
    const diff = newVal - totalAmount.value;
    change.value = diff > 0 ? diff : 0;
    });

    const verifierStockProduits = () => {
        const produitsInsuffisants = invoiceItems.value.filter(item => {
            return item.product.stock < item.quantity;
        });

        if (produitsInsuffisants.length > 0) {
            const noms = produitsInsuffisants.map(item => {
                return `'${item.product.name}' (stock: ${item.product.stock}, demandé: ${item.quantity})`;
            }).join(', ');

            toast.add({
                severity: 'error',
                summary: 'Stock insuffisant',
                detail: `Stock insuffisant pour ${noms}`,
                life: 5000
            });
            return false;
        }

        return true;
    };

    async function createInvoice(){
          if (amountPaid.value < totalAmount.value) {
            toast.add({ severity: 'warn', summary: 'Paiement insuffisant', detail: 'Le montant payé est inférieur au total.', life: 3000 });
            return;
        }

        change.value =amountPaid.value - totalAmount.value;
        if (!verifierStockProduits()) {
        return; // Stoppe la création si stock insuffisant
        }
        if(!clientName.value || clientName.value.trim() ==''){
          clientName.value = 'Client Dievers'
        }
        const invoiceData = {
            client_name :clientName.value,
            total_amount:totalAmount.value,
            amount_paid:amountPaid.value,
            cashier:localStorage.getItem('id'),
            change:change.value,
            items:invoiceItems.value.map(item => ({
                product: item.product.id,
                quantity: item.quantity,
                price: item.price,
                purchase_price: item.purchase_price
            }))
        };
        try{ 
            await createInvoiceAPI(invoiceData);
            console.log('userProfile :', userProfile);
            toast.add({ severity: 'success', summary: 'Facture créée', detail: 'Paiement effectué et facture enregistrée.', life: 3000 });
            printInvoice(invoiceData);
             invoiceItems.value = [];
             totalAmount.value = 0;
             amountPaid.value = 0;
            change.value = 0;
            clientName.value = '';
   
        }catch (error) {
                console.error('Erreur lors de la création de la facture :', error);
                if (error.response && error.response.data) {
                    console.error('Détails de l’erreur :', error.response.data);
                }
        }
    }
// mettre la facture en attente
function savePendingInvoice(){
  if(!clientName.value && invoiceItems.value.length ===0){
    toast.add({ severity: 'warn', summary: 'Facture vide', detail: 'Impossible de mettre une facture vide en attente.', life: 3000 });
    return;
  }

  const pending = {
    id: Date.now(),
    clientName:clientName.value ||'ClientDivers',
    items:JSON.parse(JSON.stringify(invoiceItems.value)),
    totalAmount:totalAmount.value,
    amountPaid: amountPaid.value || 0,
    change: change.value || 0,
     date: new Date()
  };
  pendingInvoices.value.push(pending);

    clientName.value = '';
    invoiceItems.value = [];
    totalAmount.value = 0;
    amountPaid.value = 0;
    change.value = 0;

   toast.add({ severity: 'success', summary: 'Facture en attente', detail: 'La facture a été mise en attente.', life: 3000 });
}

// reprendre la facture en attente
function resumeInvoice(pending){
  if(pendingInvoices.value.length ===0){
    toast.add({ severity: 'warn', summary: 'Facture vide', detail: 'Pas de factures en attente.', life: 3000 });
    return;
  }
    clientName.value = pending.clientName;
    invoiceItems.value = JSON.parse(JSON.stringify(pending.items));
    totalAmount.value = pending.totalAmount;
    amountPaid.value = pending.amountPaid;
    change.value = pending.change;

    pendingInvoices.value = pendingInvoices.value.filter(inv => inv.id !==pending.id);

    showPendingDialog.value = false;
}

// supprimer la facture en attente
function removePendingInvoice(id) {
    pendingInvoices.value = pendingInvoices.value.filter(inv => inv.id !== id);
}

    
async function connectQZ() {
    if (!window.qz) {
        alert("QZ Tray n'est pas installé ou lancé !");
        return false;
    }
    if (!qz.websocket.isActive()) {
        try {
            await qz.websocket.connect();
        } catch (err) {
            alert("Impossible de se connecter à QZ Tray. Vérifiez qu'il est lancé et que le certificat est approuvé.");
            console.error(err);
            return false;
        }
    }
    return true;
}
function centerText(text, lineLength = 48) {
    const spaces = Math.floor((lineLength - text.length) / 2);
    return ' '.repeat(spaces > 0 ? spaces : 0) + text;
}

function formatLine(name, qty, price, total, currency, lineLength = 48) {
    // Limite le nom du produit à 12 caractères
    const productName = name.length > 12 ? name.slice(0, 12) : name.padEnd(12);
    const quantity = qty.toString().padStart(4);
    const priceStr = price.toFixed(2).padStart(9);
    const totalStr = total.toFixed(2).padStart(9);

    return `${productName}${quantity} ${priceStr} ${currency} ${totalStr} ${currency}\n`;
}

// Centrer et mettre en gras / double taille
function printHeader(name) {
    return [
        { type: 'raw', format: 'plain', data: '\x1B\x40' },           // Reset
        { type: 'raw', format: 'plain', data: '\x1B\x61\x01' },       // Centre le texte
        { type: 'raw', format: 'plain', data: '\x1B\x21\x30' },       // Double hauteur + double largeur
        name + '\n',
        { type: 'raw', format: 'plain', data: '\x1B\x21\x00' },       // Retour à normal
        { type: 'raw', format: 'plain', data: '\x1B\x61\x00' }        // Alignement à gauche
    ];
}


async function printInvoice(invoice) {
    try {
        const printerName = localStorage.getItem('printerName');
        if (!printerName) {
            alert("Veuillez d'abord configurer une imprimante !");
            return;
        }
        const cashier_username =localStorage.getItem('username')
        const config = qz.configs.create(printerName);
        const profile = userProfile.value || {};
        const currency = profile.currency_preference || 'N/A';
        const lineLength = 48; // Largeur standard 80mm

        const data = [
            { type: 'raw', format: 'plain', data: '\x1B\x40' }, // Reset imprimante

            // Nom de l'entreprise centré
              ...printHeader(profile.entrep_name || 'Magasin'),

            // Autres informations alignées à gauche
            (profile.adress || '') + '\n',
            'Tel     :' + (profile.phone_number || '') + '\n',
            'RCCM    :' + (profile.rccm_number || '') + '\n',
            'N.IMPOT : ' + (profile.impot_number || '') + '\n',

            '-'.repeat(lineLength) + '\n',

            `Caissier(e) : ${cashier_username}\n`,
            `Client : ${invoice.client_name}\n`,
            '-'.repeat(lineLength) + '\n',
            'Produit       Qt     P.U        S.total\n',
            '-'.repeat(lineLength) + '\n'
        ];

        // Produits
        invoice.items.forEach(item => {
            const product = products.value.find(p => p.id === item.product);
            const name = product ? product.name : 'Produit inconnu';
            const qty = Number(item.quantity);
            const price = Number(item.price);
            const total = qty * price;

            data.push(formatLine(name, qty,    price,    total,  currency, lineLength));
        });

        // Totaux
        const totalInvoice = Number(invoice.total_amount ?? invoice.items.reduce((sum, item) => sum + (item.total ?? item.quantity * item.price), 0));
        data.push('-'.repeat(lineLength) + '\n');
        data.push(`Total         : ${totalInvoice.toFixed(2)} ${currency}\n`);
        data.push(`Montant percu : ${invoice.amount_paid.toFixed(2)} ${currency}\n`);
        data.push(`Reste         : ${invoice.change.toFixed(2)} ${currency}\n`);
        data.push('-'.repeat(lineLength) + '\n');

        // Message final centré
        data.push(centerText('Merci de votre confiance !', lineLength) + '\n\n');
        data.push(centerText('Powered By Bilatech.org', lineLength) + '\n\n');
        data.push('\x1D\x56\x41\x10'); // Coupe automatique

        await qz.print(config, data);
        alert("Facture imprimée avec succès !");
    } catch (err) {
        console.error(err);
        alert("Erreur impression : " + err.message);
    }
}

      
</script>

<template>
  <div class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex flex-col md:flex-row gap-5 p-4 md:p-6">
    
    <!-- 🧾 Section Produits -->
    <div class="bg-white shadow-lg rounded-2xl p-5 flex-1 flex flex-col border border-gray-100">
      <h3 class="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <i class="pi pi-box text-indigo-500"></i> Produits disponibles
      </h3>

      <!-- 🔍 Recherche -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <InputText
          v-model="filters.global.value"
          placeholder=" Rechercher un produit..."
          class="flex-1 rounded-lg border-gray-300"
        />
        <InputText
          ref="barcodeInput"
          v-model="barcodeSearch"
          placeholder="Scanner / code-barres..."
          class="flex-1 rounded-lg border-gray-300"
        />
      </div>

      <!-- 📦 Liste produits -->
      <div class="flex-1 overflow-auto">
        <DataTable
          :value="filterProducts()"
          :rows="6"
          :paginator="true"
          :filters="filters"
          dataKey="id"
          responsiveLayout="scroll"
          class="text-sm border-t border-gray-100"
        >
          <Column field="name" header="Produit" />
          <Column field="price" header="Prix">
            <template #body="{ data }">
              {{ formatPrice(data.price) }} {{ userProfile?.currency_preference || '' }}
            </template>
          </Column>
          <Column header="Action">
            <template #body="{ data }">
              <Button
                icon="pi pi-cart-plus"
                label="Ajouter"
                @click="addToInvoice(data)"
                size="small"
                class="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-lg shadow-sm transition"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

 
    <!-- 💳 Section Facture -->
<div class="bg-white shadow-lg rounded-xl p-4 flex flex-col border border-gray-100">
  <h3 class="text-xl font-semibold mb-3 text-gray-800 flex items-center gap-2">
    <i class="pi pi-receipt text-green-500"></i> Nouvelle facture
  </h3>

  <!-- Client -->
   <Button label="Factures en attente" icon="pi pi-clock" @click="showPendingDialog = true" class="mb-2" />
  <div class="mb-2">
    <label class="block text-sm font-medium text-gray-600 mb-1">Client</label>
   
    <InputText
      v-model="clientName"
      placeholder="Nom du client..."
      class="w-full text-sm rounded-md border-gray-300 focus:border-green-500 focus:ring-green-500"
    />
  </div>

  <!-- Produits -->
  <div class="overflow-auto border border-gray-100 rounded-md mb-4 max-h-[260px]">
    <DataTable
      :value="invoiceItems"
      dataKey="product.id"
      :rows="6"
      :paginator="false"
      responsiveLayout="scroll"
      class="text-xs"
    >
      <Column field="product.name" header="Produit" style="width: 40%" />

      <Column header="Qté" style="width: 100px; text-align: center;">
        <template #body="{ data }">
          <div class="flex items-center justify-center gap-1">
            <Button
              icon="pi pi-minus"
              size="small"
              text
              rounded
              class="!p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700"
              @click="data.quantity > 1 ? updateQuantity(data, data.quantity - 1) : null"
            />

            <InputText
              v-model.number="data.quantity"
              class="w-12 text-center text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
              @input="updateQuantity(data, data.quantity)"
            />

            <Button
              icon="pi pi-plus"
              size="small"
              text
              rounded
              class="!p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700"
              @click="updateQuantity(data, data.quantity + 1)"
            />

          </div>
        </template>
      </Column>

      <Column field="price" header="Prix" style="width: 20%;">
        <template #body="{ data }">
          {{ formatPrice(data.price) }} {{ userProfile?.currency_preference || '' }}
        </template>
      </Column>

      <Column header="Total" style="width: 20%;">
        <template #body="{ data }">
          {{ formatPrice(data.quantity * data.price) }} {{ userProfile?.currency_preference || '' }}
        </template>
      </Column>

      <Column style="width: 5%; text-align: center;">
        <template #body="{ data }">
          <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            class="!p-1"
            @click="removeFromInvoice(data.product.id)"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- 💰 Totaux & Paiement -->
  <div class="border-t border-gray-200 pt-3 pb-2 text-right bg-gray-50 rounded-lg shadow-inner self-center w-full max-w-xl">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <!-- Totaux -->
      <div class="space-y-1 text-sm sm:text-base font-semibold text-gray-800">
        <div class="flex justify-between sm:justify-start sm:gap-2">
          <span>Total :</span>
          <span class="text-indigo-600">
            {{ formatPrice(totalAmount) }} {{ userProfile?.currency_preference || '' }}
          </span>
        </div>
        <div class="flex justify-between sm:justify-start sm:gap-2">
          <span>Reste :</span>
          <span class="text-red-600">
            {{ formatPrice(change) }} {{ userProfile?.currency_preference || '' }}
          </span>
        </div>
      </div>

<!-- Paiement -->
<!-- Paiement -->
    <div class="flex items-center justify-end gap-2 sm:gap-3 flex-wrap w-full max-w-xs">
      <label class="text-sm font-medium text-gray-600 whitespace-nowrap">Payé :</label>
      <InputNumber
        v-model="amountPaid"
        mode="decimal"
        :maxFractionDigits="2"
        locale="en-US"
        :useGrouping="false"
        class="flex-1 text-xs sm:text-sm border-gray-300 rounded-md focus:border-green-500 focus:ring-green-500"
        inputClass="text-right"
      />
    </div>
    </div>

    <!-- Bouton -->
    <div class="mt-3 flex justify-end">
      <Button
        label="Mettre en attente"
        icon="pi pi-shopping-bag"
        class="!bg-yellow-500 hover:!bg-yellow-600 !border-yellow-700 !border-0 text-white text-sm font-semibold rounded-md px-3 py-2 shadow-sm border-none transition mr-2"
        @click="savePendingInvoice"
      />

      <Button
        label="Payer & Imprimer"
        icon="pi pi-print"
        @click="createInvoice"
        class="bg-green-900 hover:bg-green-600 text-white text-sm font-semibold rounded-md px-4 py-2 shadow-sm border-none transition-all"
      />
    </div>
  </div>

</div>


<Dialog
  header="Factures en attente"
  v-model:visible="showPendingDialog"
  modal
  :closable="true"
  class="w-full max-w-lg p-0"
>
  <!-- Contenu -->
  <div class="bg-white rounded-b-lg shadow-md p-4">
    
    <!-- Message si pas de facture -->
    <div v-if="pendingInvoices.length === 0" class="text-center py-8 text-gray-500">
      <i class="pi pi-minus-circle text-4xl mb-2 block text-indigo-400"></i>
      <h2 class="text-lg font-semibold">Pas de factures en attente</h2>
    </div>

    <!-- Tableau des factures -->
    <div v-else>
      <DataTable
        :value="pendingInvoices"
        dataKey="id"
        responsiveLayout="scroll"
        class="text-sm"
        stripedRows
        tableStyle="min-width: 100%;"
      >
        <!-- Client -->
        <Column
          field="clientName"
          header="Client"
          class="font-semibold text-gray-700"
        />
        <!-- Total -->
        <Column
          field="totalAmount"
          header="Total"
          class="text-right font-semibold text-indigo-600"
        >
          <template #body="{ data }">
            {{ formatPrice(data.totalAmount) }} {{ userProfile?.currency_preference || '' }}
          </template>
        </Column>
        <!-- Actions -->
        <Column header="Actions" class="text-center">
          <template #body="{ data }">
            <div class="flex justify-center gap-2">
              <Button
                label=""
                icon="pi pi-replay"
                size="small"
                class="bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-xs px-3 py-1 shadow-sm"
                @click="resumeInvoice(data)"
              />
              <Button
                label=""
                icon="pi pi-trash"
                size="small"
                severity="danger"
                class="text-xs px-3 py-1 rounded-md shadow-sm"
                @click="removePendingInvoice(data.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    
  </div>
</Dialog>






  </div>
</template>

