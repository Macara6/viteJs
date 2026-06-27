

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


function exchangeRate(value){
    const rate = Number(userProfile.value?.exchange_rate || 1);
    const currency = userProfile.value?.currency_preference;
    if(currency ==="CDF"){
      return `${(value / rate).toFixed(2)} USD`;
    }
    if(currency ==="USD"){
      return `${(value * rate).toFixed(2)} CDF`;
    }

    return value;
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

    const existing = invoiceItems.value.find(item => item.product.id === product.id && !item.is_gift)

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

            total_amount:finalTotal,

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
 

  invoiceItems.value = [];
  clientName.value = '';
  amountPaid.value = null;
  totalAmount.value = 0;
  change.value = 0;
  tva_pro.value = 0;
  barcodeSearch.value = '';
  clientPhone.value = '';
  clientInfo.value = '';

 showCancelConfirm.value = false;

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
    tva_pro: tva_pro.value || 0,
    clientPhone: clientPhone.value ||'N/A',
    clientInfo: clientInfo.value || 'N/A',
    date: new Date()
  };

  pendingInvoices.value.push(pending);
    clientName.value = '';
    invoiceItems.value = [];
    totalAmount.value = 0;
    amountPaid.value = 0;
    change.value = 0;
    tva_pro.value = 0;
    clientInfo.value = '';
    clientPhone.value ='';

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
    tva_pro.value = pending.tva_pro;
    clientInfo.value = pending.clientInfo;
    clientPhone.value = pending.clientPhone;

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
 <div class="pos-shell">

  <!-- ══════════════════ SECTION PRODUITS ══════════════════ -->
  <div class="pos-panel products-panel">

    <!-- Header produits -->
    <div class="panel-header">
      <div class="panel-title">
        <i class="pi pi-box"></i>
        <span>Produits</span>
      </div>
      <Button
        icon="pi pi-refresh"
        text
        rounded
        class="refresh-btn"
        v-tooltip.bottom="'Actualiser'"
        @click="forceRefreshProducts"
      />
    </div>

    <!-- Recherche -->
    <div class="search-row">
      <div class="search-field">
        <i class="pi pi-search search-icon"></i>
        <InputText
          v-model="filters.global.value"
          placeholder="   Rechercher..."
          class="search-input"
        />
      </div>
      <div class="search-field">
        <i class="pi pi-barcode search-icon"></i>
        <InputText
          ref="barcodeInput"
          v-model="barcodeSearch"
          placeholder="Code-barres..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Table produits -->
    <div class="table-wrapper">
      <DataTable
        :value="filterProducts()"
        :rows="8"
        :paginator="true"
        :filters="filters"
        dataKey="id"
        responsiveLayout="scroll"
        class="pos-table"
      >
        <Column field="name" header="Produit" />
        <Column field="price" header="Prix">
          <template #body="{ data }">
            <span class="price-tag">
              {{ formatPrice(data.price) }} {{ userProfile?.currency_preference || '' }}
            </span>
          </template>
        </Column>
        <Column header="">
          <template #body="{ data }">
            <div class="action-btns">
              <button class="btn-add" @click="addToInvoice(data)">
                <i class="pi pi-cart-plus"></i> Ajouter
              </button>
              <button class="btn-gift" @click="addGiftToInvoice(data)">
                <i class="pi pi-gift"></i>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <!-- ══════════════════ SECTION FACTURE ══════════════════ -->
  <div class="pos-panel invoice-panel">

    <!-- Header facture -->
    <div class="panel-header">
      <div class="panel-title">
        <i class="pi pi-receipt"></i>
        <span>Nouvelle facture</span>
      </div>
      <Button
        label="En attente"
        icon="pi pi-clock"
        text
        class="pending-btn"
        @click="showPendingDialog = true"
      />
    </div>

    <!-- Client -->
    <div class="client-section">
      <div class="field-group">
        <label class="field-label">Téléphone</label>
        <InputText
          v-model="clientPhone"
          placeholder="Numéro de téléphone..."
          class="field-input"
          @blur="searchCustomerByPhone"
        />
      </div>
<!-- Nouveau client -->
<div v-if="isNewCustomer" class="new-customer-box">
  <div class="new-customer-badge">
    <i class="pi pi-user-plus"></i> Nouveau client
  </div>
  <div class="new-customer-fields">
    <InputText v-model="clientName" placeholder="Nom" class="field-input" />
    <InputText v-model="clientLastName" placeholder="Post-nom" class="field-input" />
    <Dropdown
      v-model="clientSexe"
      :options="customerSexe"
      placeholder="Sexe"
      optionLabel="label"
      optionValue="value"
      class="field-input"
    />
  </div>
  <button class="btn-save-customer" @click="saveNewCustomer">
    <i class="pi pi-check-circle"></i> Enregistrer
  </button>
</div>

<div class="field-group">
  <label class="field-label">Client</label>
  <div class="client-inputs">
    <InputText v-model="clientName" placeholder="Nom du client..." class="field-input" />
    <InputText
      v-if="customer"
      v-model="clientInfo"
      readonly
      class="field-input field-readonly"
    />
  </div>
</div>

<!-- Items facture -->
<div class="invoice-items">
  <DataTable
    :value="invoiceItems"
    dataKey="product.id"
    :virtualScroll="true"
    scrollHeight="220px"
    class="pos-table items-table"
  >
    <Column field="product.name" header="Produit" style="width:35%; min-width:90px" />

    <Column header="Qté" style="width:90px; min-width:90px">
      <template #body="{ data }">
        <div class="qty-control">
          <button
            class="qty-btn"
            @click="data.quantity > 1 ? updateQuantity(data, data.quantity - 1) : null"
          >−</button>
          <InputNumber
            v-model.number="data.quantity"
            class="qty-input"
            @input="updateQuantity(data, data.quantity)"
            @blur="handleBlurQuantity(data)"
          />
          <button
            class="qty-btn qty-btn-plus"
            @click="updateQuantity(data, data.quantity + 1)"
          >+</button>
        </div>
      </template>
    </Column>

    <Column field="price" header="P.U" style="width:20%; min-width:60px">
      <template #body="{ data }">
        <span class="price-cell">{{ formatPrice(data.price) }}</span>
      </template>
    </Column>

    <Column header="Total" style="width:22%; min-width:65px">
      <template #body="{ data }">
        <span class="price-cell total-cell">
          {{ formatPrice(data.quantity * data.price) }}
        </span>
      </template>
    </Column>

    <Column style="width:28px">
      <template #body="{ data }">
        <button class="btn-remove" @click="removeFromInvoice(data.product.id)">
          <i class="pi pi-times"></i>
        </button>
      </template>
    </Column>
  </DataTable>
</div>

<!-- Totaux -->
<div class="totals-section">
  <div class="totals-grid">
    <div class="total-row">
      <span class="total-label">Sous-total</span>
      <span class="total-value">{{ formatPrice(totalAmount) }} {{ userProfile?.currency_preference }}</span>
      <span class="total-exchange">({{ exchangeRate(totalAmount) }})</span>
    </div>
    <div class="total-row tva-row">
      <span class="total-label">TVA</span>
      <span class="total-value danger">{{ formatPrice(tva_pro) }} {{ userProfile?.currency_preference }}</span>
      <span class="total-exchange">({{ exchangeRate(tva_pro) }})</span>
    </div>
    <div v-if="pointsDiscount > 0" class="total-row discount-row">
      <span class="total-label">Réduction pts</span>
      <span class="total-value success">− {{ formatPrice(pointsDiscount) }} {{ userProfile?.currency_preference }}</span>
      <span class="total-exchange">({{ exchangeRate(pointsDiscount) }})</span>
    </div>
    <div class="total-divider"></div>
    <div v-if="pointsDiscount > 0" class="total-row final-row">
      <span class="total-label">Total final</span>
      <span class="total-value primary bold">{{ formatPrice(finalTotal) }} {{ userProfile?.currency_preference }}</span>
      <span class="total-exchange">({{ exchangeRate(finalTotal) }})</span>
    </div>
    <div class="total-row reste-row">
      <span class="total-label">Reste</span>
      <span class="total-value danger bold">{{ formatPrice(change) }} {{ userProfile?.currency_preference }}</span>
      <span class="total-exchange">({{ exchangeRate(change) }})</span>
    </div>
  </div>

  <div class="payment-row">
    <label class="field-label">Montant payé</label>
    <InputNumber
      v-model="amountPaid"
      mode="decimal"
      :maxFractionDigits="2"
      locale="en-US"
      :useGrouping="false"
      class="payment-input"
      inputClass="text-right"
      @input="onInput"
    />
  </div>
</div>

<!-- Actions -->
<div class="invoice-actions">
  <button class="action-btn cancel" @click="confirmCancelInvoice">
    <i class="pi pi-times"></i> Annuler
  </button>
  <button class="action-btn hold" @click="savePendingInvoice">
    <i class="pi pi-shopping-bag"></i> En attente
  </button>
  <button v-if="customer" class="action-btn points" @click="showPointsDialog = true">
    <i class="pi pi-star"></i> Points
  </button>
  <button class="action-btn pay" @click="createInvoice">
    <i class="pi pi-money-bill"></i> Payer & imprimer
  </button>
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




<style scoped>
/* ── Shell ─────────────────────────────────────────────── */
.pos-shell {
  display: flex;
  gap: 12px;
  padding: 12px;
  min-height: 100vh;
  background: #f1f5f9;  /* ← était #0f1117 */
  font-family: 'Inter', system-ui, sans-serif;
}


/* ── Panels ─────────────────────────────────────────────── */
.pos-panel {
  background: #ffffff;  /* ← était #1a1d27 */
  border: 1px solid #e2e8f0;  /* ← était #2a2d3e */
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.products-panel { flex: 1.2; }
.invoice-panel  { flex: 1; min-width: 360px; }

/* ── Panel header ───────────────────────────────────────── */
.panel-header {
  border-bottom: 1px solid #e2e8f0;  /* ← était #2a2d3e */
}

.panel-title {
  color: #1e293b;  /* ← était #e2e8f0 */
}

.panel-title .pi {
  color: #6366f1;
  font-size: 15px;
}
.refresh-btn { color: #6b7280 !important; }
.pending-btn {
  font-size: 12px !important;
  color: #f59e0b !important;
  font-weight: 600 !important;
  padding: 4px 8px !important;
}

/* ── Search ─────────────────────────────────────────────── */
.search-row {
  display: flex;
  gap: 8px;
}
.search-field {
  flex: 1;
  position: relative;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #4b5563;
  font-size: 13px;
  z-index: 1;
}

.search-input {
  background: #f8fafc !important;  /* ← était #0f1117 */
  border: 1px solid #e2e8f0 !important;
  color: #1e293b !important;
}
.search-input:focus {
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.15) !important;
}

/* ── Tables ─────────────────────────────────────────────── */
.table-wrapper { flex: 1; overflow: auto; }
.pos-table :deep(.p-datatable-thead > tr > th) {
  background: #f8fafc !important;
  color: #94a3b8 !important;
  border-color: #e2e8f0 !important;
}

.pos-table :deep(.p-datatable-tbody > tr > td) {
  color: #374151 !important;
  border-color: #f1f5f9 !important;
}

.pos-table :deep(.p-datatable-tbody > tr:hover > td) {
  background: #f1f5f9 !important;
}

.pos-table :deep(.p-paginator) {
  color: #94a3b8 !important;
}

.pos-table :deep(.p-paginator .p-paginator-page.p-highlight) {
  background: #6366f1 !important;
  color: #fff !important;
  border-radius: 6px !important;
}

/* ── Action buttons (products) ──────────────────────────── */
.action-btns { display: flex; gap: 6px; align-items: center; }
.btn-add {
  display: flex; align-items: center; gap: 5px;
  background: #0a7b1d;
  color: #fff;
  border: none; border-radius: 7px;
  padding: 5px 11px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background .15s;
}
.btn-add:hover { background: #0fbc65; }
.btn-gift {
  background: #1e2130; border: 1px solid #2a2d3e;
  color: #6b7280; border-radius: 7px;
  padding: 5px 9px; cursor: pointer; font-size: 13px;
  transition: all .15s;
}
.btn-gift {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
}

/* ── Price tag ──────────────────────────────────────────── */
.price-tag { color: #a5b4fc; font-weight: 600; font-size: 13px; }
.price-cell { color: #9ca3af; font-size: 12px; }
.total-cell { color: #e2e8f0; font-weight: 600; }

/* ── Client section ─────────────────────────────────────── */
.client-section { display: flex; flex-direction: column; gap: 8px; }
.field-group { display: flex; flex-direction: column; gap: 4px; }

.field-label { color: #94a3b8; }

.field-input {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  color: #1e293b !important;
}


.field-label { color: #94a3b8; }
.client-inputs { display: flex; gap: 8px; }

.new-customer-box {
  background: #1c1a0d;
  border: 1px solid #3d3400;
  border-radius: 10px;
  padding: 12px;
  display: flex; flex-direction: column; gap: 7px;
}
.new-customer-badge {
  font-size: 10px; font-weight: 700; color: #f59e0b;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 2px;
}
.btn-save-customer {
  background: #16a34a; color: #fff;
  border: none; border-radius: 7px;
  padding: 7px 12px; font-size: 12px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: background .15s; align-self: flex-start;
}
.btn-save-customer:hover { background: #15803d; }

/* ── Invoice items ──────────────────────────────────────── */
.invoice-items { border: 1px solid #e2e8f0; }

.items-table :deep(.p-datatable-thead > tr > th) { padding: 6px 10px !important; }
.items-table :deep(.p-datatable-tbody > tr > td) { padding: 5px 10px !important; }

.qty-control {
  display: flex; align-items: center; gap: 4px;
}
.qty-btn {
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #e2e8f0;
}

.qty-btn:hover { background: #6366f1; border-color: #6366f1; }
.qty-input {
  width: 44px !important;
}

.qty-input :deep(input) {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  color: #1e293b !important;
}
.qty-control {
  display: flex;
  align-items: center;
  gap: 3px;
}

.qty-btn {
  width: 22px;
  height: 22px;
  min-width: 22px;
  background: #f1f5f9;
  color: #374151;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .1s, border-color .1s, color .1s;
  flex-shrink: 0;
}
.qty-btn:hover       { background: #e0e7ff; border-color: #6366f1; color: #4f46e5; }
.qty-btn-plus        { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
.qty-btn-plus:hover  { background: #0de114; border-color: #6366f1; color: #fff; }

.qty-input { width: 36px !important; }
.qty-input :deep(input) {
  width: 36px !important;
  min-width: 36px !important;
  text-align: center !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 5px !important;
  color: #1e293b !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  padding: 2px 4px !important;
  height: 24px !important;
}

.btn-remove {
  background: transparent; border: none;
  color: #4b5563; cursor: pointer; font-size: 11px;
  border-radius: 5px; padding: 3px 5px;
  transition: color .1s;
}
.btn-remove:hover { color: #ef4444; }

/* ── Price cells ────────────────────────────────────────── */
.price-cell {
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.total-cell {
  color: #1e293b;
  font-weight: 700;
  font-size: 12px;
}


/* ── Remove btn ─────────────────────────────────────────── */
.btn-remove {
  background: transparent;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 10px;
  border-radius: 4px;
  padding: 3px 4px;
  transition: color .1s, background .1s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-remove:hover { color: #ef4444; background: #fef2f2; }

/* ── New customer box ───────────────────────────────────── */
.new-customer-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.new-customer-badge {
  font-size: 10px;
  font-weight: 700;
  color: #d97706;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 5px;
}
.new-customer-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Totaux ─────────────────────────────────────────────── */

.totals-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.totals-grid { display: flex; flex-direction: column; gap: 5px; }
.total-row {
  display: grid; grid-template-columns: 1fr auto auto;
  gap: 8px; align-items: center;
}
.total-label { color: #94a3b8; }
.total-value { color: #1e293b; }
.total-exchange { color: #cbd5e1; }
.total-value.danger { color: #f87171; }
.total-value.success { color: #34d399; }
.total-value.primary { color: #a5b4fc; }
.total-value.bold { font-size: 15px; }
.total-divider { border-top: 1px dashed #e2e8f0; }
.final-row .total-label { color: #1e293b; }
.reste-row .total-label { color: #1e293b; }

.payment-row {
  display: flex; align-items: center; gap: 10px;
  padding-top: 8px; border-top: 1px solid #2a2d3e;
}

.payment-row { border-top: 1px solid #e2e8f0; }
.payment-input :deep(input) {
  background: #ffffff !important;
  color: #4f46e5 !important;
}

/* ── Invoice actions ────────────────────────────────────── */
.invoice-actions {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.action-btn {
  flex: 1; min-width: 80px;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 9px 10px; border-radius: 9px;
  font-size: 12px; font-weight: 700;
  border: none; cursor: pointer; transition: all .15s;
}
.action-btn.cancel  { background: #2d1515; color: #f87171; border: 1px solid #3d1f1f; }
.action-btn.cancel:hover  { background: #ef4444; color: #fff; }
.action-btn.hold    { background: #2a2000; color: #f59e0b; border: 1px solid #3d3000; }
.action-btn.hold:hover    { background: #d97706; color: #fff; }
.action-btn.points  { background: #1e1a2e; color: #a78bfa; border: 1px solid #2d2550; }
.action-btn.points:hover  { background: #7c3aed; color: #fff; }
.action-btn.pay     { background: #166534; color: #4ade80; border: 1px solid #1a4d30; flex: 2; }
.action-btn.pay:hover     { background: #16a34a; color: #fff; }

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 768px) {
  .pos-shell { flex-direction: column; padding: 8px; }
  .invoice-panel { min-width: unset; }
}
</style>

