

<script setup>
      import { createCustomer, createInvoiceAPI, fetchCustomer, fetchProduits, fetchUserProfilById } from '@/service/Api';

import { clearCache, loadCache, saveCache } from '@/utils/cache';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
const products = ref([]);
const selectedProducts = ref([]);
const filters = ref({
   global: { value: null, matchMode: 'contains' }
});

const invoiceItems = ref([]);


const totalAmount = computed(() => {
   return invoiceItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

 const amountPaid = ref(null);

const change = ref(0)

const tva_pro = ref(0);

const userProfile = ref(null);
const search = ref('');
const toast = useToast();
const barcodeSearch = ref('');


const availablePrinters = ref([]);
const selectedPrinter = ref(null);
const qzDetected = ref(false);

const pendingInvoices = ref([]);
const showPendingDialog = ref(false);

const showInvoiceDialog =ref(false);
let lastInvoice = null; // pour stocker la facture pendant un  moment

const showCancelConfirm = ref(false);

const customers = ref([]);
const clientName = ref('');
const clientPhone = ref('');
const clientLastName = ref('');
const clientInfo = ref('');
const clientSexe = ref(null);
const selectedCustomer = ref(null);

const isNewCustomer = ref(false)
const customer = ref(false);
const showPointsDialog = ref(false);
const pointsToUse = ref(0)

const enteredCardNumber = ref('')

const pointsDiscount = ref(0);
const discountValueInput = ref(0)
const ptsUsed = ref(0);
const finalTotal = computed(() => {
  return Math.max(0, totalAmount.value - pointsDiscount.value)
})
const customerSexe = [
    {label:'M',value:'M'},
    {label:'F', value:'F'}
]


  onMounted(async () => {
    await loadProduct();
    await fetchUserProfl();
    await getCustomers();
      
  });
 

  async function getCustomers(){
    const response = await fetchCustomer();
    customers.value = response;
  }


  function filterProducts() {
    if (!barcodeSearch.value) {
        return products.value;
    }
    return products.value.filter(p => p.barcode?.includes(barcodeSearch.value));
  }



async function searchCustomerByPhone(){
  if(!clientPhone.value) return
  try{

    const found = customers.value.find(
      c => c.phone_number === clientPhone.value
    )

    if(found){
      if(found.sexe == 'M'){
          clientName.value ='Mr '+found.name;
      } else{
          clientName.value ='Mme '+found.name;
      }
      selectedCustomer.value = found
       
      clientInfo.value = found.balance_point +'Pts'+'-'+found.total_value_points+userProfile?.value.currency_preference
      clientLastName.value = found.las_name;
      clientSexe.value = found.sexe
      isNewCustomer.value = false
      customer.value = true
      
    
      toast.add({
        severity: 'success',
        summary: 'Client trouvé',
        detail: 'Client chargé automatiquement',
        life: 2000
      })

    }else{
      selectedCustomer.value = null;
      isNewCustomer.value = true;
      customer.value = false;
      clientName.value = ''
      clientLastName.value = ''
      clientSexe.value = null
      
      toast.add({
        severity: 'warn',
        summary: 'Nouveau client',
        detail: 'Client non enregistré',
        life: 2000
      })
    }

  }catch(error){
    console.error(error)
  }
}


function applyPointsDiscount(){
  
  if(!selectedCustomer.value || !userProfile.value) return

  if(!enteredCardNumber.value){
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez entrer le numéro de la carte.',
      life: 3000
    })
    return;
  }
  if(enteredCardNumber.value !== selectedCustomer.value.loyalty_card_number){
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Numéro de carte invalide.',
      life: 3000
    })
    enteredCardNumber.value = '';
    return;

  }


  let value = discountValueInput.value

  if(value <= 0) return

  const maxValue = selectedCustomer.value.balance_point * userProfile.value.point_output

  value = Math.min(value, maxValue)
  
   ptsUsed.value =
    Math.ceil(value / userProfile.value.point_output)

  pointsDiscount.value = value

  console.log('Points utilisés :', ptsUsed.value)
  console.log('Réduction :', value)
  console.log('Total final :', finalTotal.value)
  console.log('point discount :', pointsDiscount.value)

  showPointsDialog.value = false;
}






async function saveNewCustomer(){

  if(!clientName.value || !clientPhone.value ){
    toast.add({
      severity: 'warn',
      summary: 'Champs requis',
      detail: 'Nom et téléphone obligatoires',
      life: 2000
    });
    return null;
  }

  try{

    const payload = {
      name : clientName.value,
      last_name: clientLastName.value,
      email: null,
      sexe: clientSexe.value,
      phone_number: clientPhone.value,
      created_by: localStorage.getItem('id')
    }

    await createCustomer(payload);
    toast.add({
        severity: 'success',
        summary: 'Client trouvé',
        detail: 'Client ajoutée',
        life: 2000
      })

    isNewCustomer.value = false;
    customer.value = false;
    
  }catch(error){
    console.error("error pour le client:",error)
  }

}


watch(barcodeSearch, (newValue) => {
  if (!newValue) return;

  const product = products.value.find(p => String(p.barcode) === String(newValue));
  
  if (product) {
    addToInvoice(product);  // ajoute automatiquement au panier
    barcodeSearch.value = ''; // réinitialise la barre de recherche
  }
});

watch(amountPaid, (newValue) => {
    const paid = parseFloat(newValue) || 0;
    if(paid > totalAmount.value){
        change.value = paid - totalAmount.value ;
    }else if(finalTotal.value != 0){
       change.value = paid - finalTotal.value;
    }
    
    
});

function onInput(event) {
    const paid = parseFloat(event.value) || 0;
    change.value = paid - totalAmount.value + pointsDiscount.value;  
}


async function loadProduct() {
        const userId = localStorage.getItem('id');
        const cachedProducts = loadCache('products');
        if(cachedProducts && cachedProducts.length){
          products.value = cachedProducts;
         
          return;
        }

         try {
            const fetchProduct = await fetchProduits(userId);
            products.value = fetchProduct;
            saveCache('products', fetchProduct); 
               
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


async function forceRefreshProducts() {
  try {
    clearCache('products');

    const userId = localStorage.getItem('id');
    const fetchedProducts = await fetchProduits(userId);
    products.value = fetchedProducts;
    saveCache('products', fetchedProducts);
    toast.add({
      severity: 'success',
      summary: 'Produits mis à jour',
      detail: 'Les produits ont été rechargés depuis l’API.',
      life: 3000,
    });

  } catch (error) {
    console.error('Erreur lors de l’actualisation :', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de recharger les produits.',
      life: 3000,
    });
  }
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
            purchase_price: product.purchase_price,
            tva:product.tva
            
        });
    }

    updateTotal();
}

function addGiftToInvoice(product){
  if(product.stock < 1){
    toast.add({
      severity: 'error',
      summary: 'Stock insuffisant',
      detail: `Le produit "${product.name}" est en rupture de stock.`,
      life: 5000
    });
    return;
  }
  
  const existing = invoiceItems.value.find(
    item => item.product.id === product.id && item.is_gift
  )
  if(existing){

    if(existing.quantity + 1 > product.stock){
      toast.add({
        severity: 'error',
        summary: 'Stock insuffisant',
        detail: `Impossible d'ajouter plus de "${product.name}" (stock disponible: ${product.stock}).`,
        life: 5000
      });
      return
    }
    existing.quantity += 1;
  }else{
    invoiceItems.value.push({
      product:product,
      quantity:1,
      price:0,
      purchase_price:product.purchase_price,
      tva:false,
      is_gift:true
    })
  }
  updateTotal();
}

function updateTotal(){
    totalAmount.value = invoiceItems.value.reduce((sum, item) => {
        return sum + item.quantity * item.price;
    }, 0);

    const totalWithTva = invoiceItems.value
      .filter(item => item.tva === true)
      .reduce((sum, item) => sum + item.quantity * item.price, 0);

    console.log('produits avec tva', totalWithTva);
    tva_pro.value = totalWithTva * 0.16;       
}


function calculateInvoiceTva(invoiceItems) {
    if (!invoiceItems || !invoiceItems.length) return 0;

    return invoiceItems
        .map(item => {
            const product = products.value.find(p => p.id === item.product); // récupère le produit réel
            if (!product) return 0;
            return (product.tva ? item.quantity * item.price * 0.16 : 0);
        })
        .reduce((sum, val) => sum + val, 0);
}


  
watch(amountPaid, () => {
  calculateChange();
});

function calculateChange() {
    const paid = Number(amountPaid.value) || 0;
    const total = Number(totalAmount.value) || 0;
    if(paid > total ){
      change.value = paid - total;
    }else if( finalTotal.value != 0 ){
      change.value = paid - finalTotal.value;
    }else{
        change.value = 0;
    }
   
}

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
      const finalTotal = totalAmount.value - pointsDiscount.value;

      if (finalTotal > 0 && amountPaid.value < finalTotal) {
        toast.add({
            severity: 'warn',
            summary: 'Paiement insuffisant',
            detail: 'Le montant payé est inférieur au montant dû.',
            life: 3000
        })
        return
    }
    if (invoiceItems.value.length == 0) {
        toast.add({
            severity: 'warn',
            summary: 'Facture vide',
            detail: 'La facture est vide',
            life: 3000
        });
        return;
    }



        change.value =amountPaid.value - finalTotal

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
                purchase_price: item.purchase_price,
                is_gift:item.is_gift
            })),
          customer: selectedCustomer.value?.id || null,
          points_used : ptsUsed.value,
          points_discount : pointsDiscount.value
        };


        try{ 
            await createInvoiceAPI(invoiceData);


            saveCache('Invoices',invoiceData);
            toast.add({ severity: 'success', summary: 'Facture créée', detail: 'Paiement effectué et facture enregistrée.', life: 3000 });
            lastInvoice =invoiceData;
            showInvoiceDialog.value = true;
             invoiceItems.value = [];
             totalAmount.value = 0;
             amountPaid.value = 0;
            change.value = 0;
            tva_pro.value=0

            clientName.value = '';
            clientPhone.value ='';
            customer.value = false;

            ptsUsed.value = 0;
            pointsDiscount.value = 0;

            await getCustomers();
   
        }catch (error) {
                console.error('Erreur lors de la création de la facture :', error);
                if (error.response && error.response.data) {
                    console.error('Détails de l’erreur :', error.response.data);
            }
      }
}


// annuler la facture 

function confirmCancelInvoice(){
  showCancelConfirm.value = true;
}
function cancelInvoiceConfirmed(){
  showCancelConfirm.value = false;

  invoiceItems.value = [];
  clientName.value = '';
  amountPaid.value = null;
  totalAmount.value = 0;
  change.value = 0;
  tva.value =0
  barcodeSearch.value = '';

  toast.add({
    severity: 'success',
    summary: 'Facture annulée',
    life: 2000
  });

}


// imprimer avec l'imprimante
function  onPrintSelected(){
   showInvoiceDialog.value = false;
   printInvoice(lastInvoice);
}
// imprimer le PDF
function onPdfSelected(){
  showInvoiceDialog.value = false;
  generatePdfInvoice(lastInvoice);
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
    tva.value = 0;

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
    // Affiche tout le nom du produit, aligne uniquement le reste
    const quantity = qty.toString().padStart(4);
    const priceStr = price.toFixed(2).padStart(9);
    const totalStr = total.toFixed(2).padStart(9);

    // Retourne la ligne complète
    return `${name} ${quantity} ${priceStr} ${currency} ${totalStr} ${currency}\n`;
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
        const copies = Number(localStorage.getItem('printerCopies')) || 1;
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

        const tvaInvoice = calculateInvoiceTva(invoice.items);
        console.log('TVA invoice:', tvaInvoice);

        // Totaux
        const totalInvoice = Number(invoice.total_amount ?? invoice.items.reduce((sum, item) => sum + (item.total ?? item.quantity * item.price), 0));
        data.push('-'.repeat(lineLength) + '\n');
        data.push(`Total         : ${totalInvoice.toFixed(2)} ${currency}\n`);
        data.push(`Montant percu : ${invoice.amount_paid.toFixed(2)} ${currency}\n`);
        data.push(`TVA           : ${tvaInvoice.toFixed(2)} ${currency}\n`);
        data.push(`Reste         : ${invoice.change.toFixed(2)} ${currency}\n`);
        data.push('-'.repeat(lineLength) + '\n');
        
        // Message final centré
        data.push(centerText('Merci de votre confiance !', lineLength) + '\n\n');
        data.push(centerText('Powered By Bilatech.org', lineLength) + '\n\n');
        data.push('\x1D\x56\x41\x10'); // Coupe automatique

        for (let i = 0; i < copies; i ++){
            const printData = [
                ...data,
                '\x1D\x56\x41\x10' // Coupe papier pour CHAQUE copie
            ];
          await qz.print(config, data);
        }
       


        alert("Facture imprimée avec succès !");
    } catch (err) {
        console.error(err);
        alert("Erreur impression : " + err.message);
    }
} 


import jsPDF from "jspdf";

async function generatePdfInvoice(invoice) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.setFontSize(18);
    doc.text("FACTURE", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Client : ${invoice.client_name}`, 20, 40);
    doc.text(`Caissier : ${localStorage.getItem('username')}`, 20, 48);



    doc.line(20, 85, 190, 85);

    doc.text("Produits :", 20, 95);

    let y = 105;

    invoice.items.forEach(item => {
        const product = products.value.find(p => p.id === item.product) || {};

        doc.text(`${product.name || 'Produit'}`, 20, y);
        doc.text(`Qté : ${item.quantity}`, 100, y);
        doc.text(`PU : ${item.price}`, 140, y);
        doc.text(`Total : ${(item.quantity * item.price).toFixed(2)}`, 170, y);

        y += 8;
    });

    doc.text(`Total         : ${invoice.total_amount.toFixed(2)}`, 20, 60);
    doc.text(`Montant perçu : ${invoice.amount_paid.toFixed(2)}`, 20, 68);
    doc.text(`TVA          : ${tva_pro.value.toFixed(2)}`, 20, 76);
    doc.text(`Reste         : ${invoice.change.toFixed(2)}`, 20, 84);

    doc.save(`facture_${Date.now()}.pdf`);
}


      
</script>

<template>
  <div class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex flex-col md:flex-row gap-5 p-4 md:p-6">
    
    <!-- 🧾 Section Produits -->
    <div class="bg-white shadow-lg rounded-2xl p-5 flex-1 flex flex-col border border-gray-100">
      <h3 class="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <i class="pi pi-box text-indigo-500"></i> Produits disponibles
      </h3>
      <div class="flex justify-end mb-3">
      <Button
        label="Actualiser les produits"
        icon="pi pi-refresh"
        class="p-button-sm p-button-info"
        @click="forceRefreshProducts"
      />
    </div>

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
          :rows="8"
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
              <div class="flex gap-2">
                <!-- Ajouter à la facture -->
                <Button
                  icon="pi pi-cart-plus"
                  label="Ajouter"
                  @click="addToInvoice(data)"
                  size="small"
                  class="bg-indigo-500 hover:bg-indigo-600 text-white border-none rounded-lg"
                />

                <!-- 🎁 Cadeau -->
                <Button
                  icon="pi pi-gift"
                  severity="info"
                  size="small"
                  @click="addGiftToInvoice(data)"
                />

              </div>

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
   <Button label="Factures en attente"  icon="pi pi-clock" @click="showPendingDialog = true" class="!big-orange-600 mb-2" />

    <!-- Téléphone -->
    <div class="mb-2">
      <label class="block text-sm font-medium text-gray-600 mb-1">
        Téléphone
      </label>

      <InputText
        v-model="clientPhone"
        placeholder="Numéro de téléphone..."
        class="w-full text-sm rounded-md border-gray-300"
        @blur="searchCustomerByPhone"
      />
    </div>

    <div v-if="isNewCustomer" class="space-y-2 border p-3 rounded-lg bg-yellow-50">

      <InputText
        v-model="clientName "
        placeholder="Nom"
        class="w-full text-sm"
      />

      <InputText
        v-model="clientLastName"
        placeholder="Post-nom"
        class="w-full text-sm"
      />

      <Dropdown
        v-model="clientSexe"
        :options="customerSexe"
        placeholder="Sexe"
        optionLabel="label"
        optionValue="value"
        class="w-full text-sm"
      />
      <Button
        label="Enregistré"
        icon="pi pi-check-circle"
        @click="saveNewCustomer"
        class="bg-green-900 hover:bg-green-600 text-white text-sm font-semibold rounded-md px-4 py-2 shadow-sm border-none transition-all"
      />
    </div>



  <div class="mb-2">
    <label class="block text-sm font-medium text-gray-600 mb-1">
      Client
    </label>

   <div class="flex flex-col sm:flex-row gap-2">
      <!-- Nom client (modifiable) -->
      <InputText
        v-model="clientName"
        placeholder="Nom du client..."
        class="w-1/2 text-sm rounded-md border-gray-300 
              focus:border-green-500 focus:ring-green-500"
      />

      <!-- Infos client (non modifiable) -->
      <InputText
        v-if="customer"
        v-model="clientInfo"
        readonly
        class="w-1/2 text-sm rounded-md border-gray-300 
              bg-gray-100 text-gray-600 cursor-not-allowed"
      />

    </div>
  </div>


  <!-- Produits -->
  <div class="overflow-auto border border-gray-100 rounded-md mb-4 max-h-[260px]">
    <DataTable
      :value="invoiceItems"
      dataKey="product.id"
      :virtualScroll="true"
      scrollHeight="400px"
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

          <InputNumber
            v-model.number="data.quantity"
            class="w-17 text-center text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
            @input="updateQuantity(data, data.quantity)"
            @blur="handleBlurQuantity(data)"
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
          <span>TVA:</span>
          <span class="text-red-600">
            {{ formatPrice(tva_pro) }} {{ userProfile?.currency_preference || '' }}
          </span>
        </div>

        <div v-if="pointsDiscount > 0" class="text-green-600">
            Réduction : - {{ formatPrice(pointsDiscount) }}
            {{ userProfile?.currency_preference }}
         </div>

         <div v-if="pointsDiscount > 0" class="text-green-600">
            Total final :  {{ formatPrice(finalTotal) }}
            {{ userProfile?.currency_preference }}
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
        class="text-xs sm:text-sm border-gray-300 rounded-md"
        inputClass="text-right"
       @input="onInput"
      />
    </div>

    </div>

   <div class="mt-3 flex flex-wrap justify-end gap-2">

      <Button
        label="Annuler"
        icon="pi pi-times"
        severity="danger"
        class="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold 
              rounded-md px-4 py-2 shadow-sm border-none transition"
        @click="confirmCancelInvoice"
      />

      <Button
        label="Mettre en attente"
        icon="pi pi-shopping-bag"
        class="!bg-yellow-500 hover:!bg-yellow-600 
              text-white text-sm font-semibold 
              rounded-md px-4 py-2 shadow-sm border-none transition"
        @click="savePendingInvoice"
      />

      <!-- Bouton réduction points -->
      <Button
        v-if="customer"
        label="Utiliser les points"
        icon="pi pi-star"
        class="!bg-indigo-600 hover:!bg-indigo-700 
              text-white text-sm font-semibold 
              rounded-md px-4 py-2 shadow-sm border-none transition"
        @click="showPointsDialog = true"
      />

      <Button
        label="Payer & imprimer"
        icon="pi pi-money-bill"
        @click="createInvoice"
        class="bg-green-900 hover:bg-green-600 
              text-white text-sm font-semibold 
              rounded-md px-4 py-2 shadow-sm border-none transition"
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



<Dialog 
    v-model:visible="showInvoiceDialog" 
    header="Choisir une action" 
    :modal="true" 
    :closable="false"
    style="width: 350px"
>
    <div class="flex flex-column gap-3">

        <Button 
            label="🖨️ Imprimer la facture" 
            class="p-button-primary w-full"
            @click="onPrintSelected"
        />

        <Button 
            label="Télécharger en PDF" 
            class="p-button-secondary w-full"
            @click="onPdfSelected"
        />

        <Button 
            label="Fermer" 
            class="p-button-danger w-full"
            @click="showInvoiceDialog = false"
        />
    </div>
</Dialog>

<Dialog v-model:visible="showCancelConfirm" header="Annuler la facture" modal class="w-80">
  <p class="text-center text-gray-700 mb-4">Voulez-vous vraiment annuler cette facture ?</p>

  <div class="flex justify-center gap-3">
    <Button label="Non" class="p-button-text" @click="showCancelConfirm=false" />
    <Button label="Oui" severity="danger" @click="cancelInvoiceConfirmed" />
  </div>
</Dialog>


<!--  Modal réduction par points -->
<Dialog
  v-model:visible="showPointsDialog"
  header="Utiliser les points fidélité"
  :modal="true"
  :style="{ width: '400px' }"
>

  <div v-if="selectedCustomer" class="space-y-3">

    <!-- Infos client -->
    <div class="bg-indigo-50 p-3 rounded-lg text-sm">
      <div class="font-semibold text-indigo-700">
        Points disponibles : {{ selectedCustomer.balance_point }}
      </div>

      <div class="text-gray-600 text-xs">
        Valeur :
        {{ formatPrice(selectedCustomer.total_value_points) }}
        {{ userProfile?.currency_preference || '' }}
      </div>
    </div>

    <!-- Saisie points -->
    <div>
      <label class="text-sm text-gray-600">Montant de la réduction</label>

      <InputNumber
        v-model="discountValueInput"
        :max="selectedCustomer.total_value_points"
        :min="0"
        mode="decimal"
        :useGrouping="false"
        class="w-full mt-1"
      />
    </div>
  <!-- Numéro carte fidélité -->
    <div>
      <label class="text-sm text-gray-600">Numéro de la carte</label>

      <InputText
        v-model="enteredCardNumber"
        placeholder="Entrez le numéro de la carte"
        class="w-full mt-1"
      />
    </div>
    <!-- Boutons -->
    <div class="flex justify-end gap-2 mt-4">

      <Button
        label="Annuler"
        icon="pi pi-times"
        severity="secondary"
        @click="showPointsDialog = false"
      />

      <Button
        label="Appliquer"
        icon="pi pi-check"
        class="bg-indigo-600 text-white"
        @click="applyPointsDiscount"
      />

    </div>

  </div>

</Dialog>

  </div>
</template>

