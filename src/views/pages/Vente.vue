

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
        const amountPaid = ref(0);
        const change = ref(0);
        const userProfile = ref(null);
        const search = ref('');
        const toast = useToast();
        const barcodeSearch = ref('');


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
        if (quantity < 1) item.quantity = 1;
        updateTotal();
    }
    function removeFromInvoice(productId){
        invoiceItems.value = invoiceItems.value.filter(item => item.product.id !== productId);
        updateTotal();
    }

    function addToInvoice(product){
        const existing =invoiceItems.value.find(item => item.product.id === product.id);
        if(existing){
            existing.quantity +=1;

        }else{
            invoiceItems.value.push({
                product:product,
                quantity:1,
                price:product.price,
                purchase_price:product.purchase_price
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
            toast.add({ severity: 'success', summary: 'Facture créée', detail: 'Paiement effectué et facture enregistrée.', life: 3000 });
            printInvoice(invoiceData)
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
    

function printInvoice(invoiceData) {
  const printWindow = window.open('', '', 'width=800,height=1000');

  const style = `
    <style>
      @media print {
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          zoom: 2; /* Agrandir le contenu imprimé */
        }
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-family: monospace;
        font-size: 13px;
        margin: 0;
        padding: 0;
      }
      .container {
        padding: 16px;
        max-width: 100%;
      }
      .center {
        text-align: center;
      }
      .bold {
        font-weight: bold;
      }
      .line {
        border-top: 1px dashed #000;
        margin: 12px 0;
      }
      .row {
        display: flex;
        justify-content: space-between;
        white-space: nowrap;
      }
      .product {
        margin-bottom: 10px;
      }
    </style>
  `;

  let content = `
    <html>
      <head>
        <title>Facture</title>
        ${style}
      </head>
      <body>
        <div class="container">
          <div class="center bold">${userProfile.value ? userProfile.value.entrep_name : 'Non défini' }</div>
          <div class="center">${userProfile.value ? userProfile.value.adress : 'Non défini' }</div>
          <div class="center"> RCCM: ${userProfile.value ? userProfile.value.rccm_number : 'Non défini' }</div>
          <div class="center">IMPÔT: ${userProfile.value ? userProfile.value.impot_number : 'Non défini' }</div>
           <div class="center">PHONE: ${userProfile.value ? userProfile.value.phone_number : 'Non défini' }</div>
          <div class="center">${new Date().toLocaleString()}</div>
          <div class="line"></div>
          <div><strong>Client:</strong> ${invoiceData.client_name}</div>
          <div class="line"></div>
  `;

  invoiceItems.value.forEach(item => {
    content += `
      <div class="product">
        <div>${item.product.name}</div>
        <div class="row">
          <span>${item.quantity} x ${formatPrice(item.price)}</span>
          <span>${formatPrice(item.quantity * item.price)} ${userProfile.value ? userProfile.value.currency_preference : 'Non défini' }</span>
        </div>
      </div>
    `;
  });

  content += `
          <div class="line"></div>
          <div class="row bold">
            <span>Total</span>
            <span>${formatPrice(invoiceData.total_amount)} ${userProfile.value ? userProfile.value.currency_preference : 'Non défini' }</span>
          </div>
          <div class="row">
            <span>Payé</span>
            <span>${formatPrice(amountPaid.value)} ${userProfile.value ? userProfile.value.currency_preference : 'Non défini' }</span>
          </div>
          <div class="row">
            <span>Monnaie</span>
            <span>${formatPrice(invoiceData.change)} ${userProfile.value ? userProfile.value.currency_preference : 'Non défini' }</span>
          </div>
          <div class="line"></div>
          <div class="center">Merci pour votre achat !</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
      
</script>

<template>
  <div class="bg-gray-50 min-h-screen flex flex-col md:flex-row gap-4 p-3 md:p-6">
    
    <!-- 🟩 Liste des produits -->
    <div class="bg-white shadow-md rounded-xl p-4 flex-1 flex flex-col">
      <h3 class="text-xl font-semibold mb-4 text-gray-800">Produits disponibles</h3>

      <!-- 🔍 Barre de recherche -->
      <div class="flex flex-col sm:flex-row gap-2 mb-4">
        <InputText
          v-model="filters.global.value"
          placeholder="🔍 Rechercher un produit..."
          class="flex-1"
        />
        <InputText
          v-model="barcodeSearch"
          placeholder=" Scanner / code-barres..."
          class="flex-1"
        />
      </div>

      <!-- 📦 Liste des produits -->
      <div class="flex-1 overflow-auto">
        <DataTable
          :value="filterProducts()"
          :rows="6"
          :paginator="true"
          :filters="filters"
          dataKey="id"
          responsiveLayout="scroll"
          class="text-sm"
        >
          <Column field="name" header="Nom" />
          <Column field="price" header="Prix">
            <template #body="{ data }">
              {{ formatPrice(data.price) }}
              {{ userProfile ? userProfile.currency_preference : '' }}
            </template>
          </Column>
          <Column header="Action">
            <template #body="{ data }">
              <Button
                icon="pi pi-plus"
                label="Ajouter"
                @click="addToInvoice(data)"
                size="small"
                class="w-full md:w-auto"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- 🧾 Facture -->
    <div class="bg-white shadow-md rounded-xl p-4 flex-1 flex flex-col">
      <h3 class="text-xl font-semibold mb-4 text-gray-800">Nouvelle facture</h3>

      <div class="mb-3">
        <label for="client" class="block mb-1 font-medium text-gray-700"> Client :</label>
        <InputText id="client" v-model="clientName" placeholder="Nom du client..." class="w-full" />
      </div>

      <!-- 🧩 Liste des produits de la facture -->
      <div class="flex-1 overflow-auto">
        <DataTable
          :value="invoiceItems"
          dataKey="product.id"
          :paginator="true"
          :rows="5"
          responsiveLayout="scroll"
          class="text-sm"
        >
          <Column field="product.name" header="Produit" />
          <Column header="Qté" style="width: 80px; text-align: center;">
            <template #body="{ data }">
              <InputNumber
                v-model="data.quantity"
                @input="updateQuantity(data, data.quantity)"
                :min="1"
                showButtons
                buttonLayout="vertical"
                incrementButtonIcon="pi pi-angle-up"
                decrementButtonIcon="pi pi-angle-down"
                class="quantity-input"
                inputClass="text-center"
              />
            </template>
          </Column>
          <Column field="price" header="Prix">
            <template #body="{ data }">
              {{ formatPrice(data.price) }} {{ userProfile ? userProfile.currency_preference : '' }}
            </template>
          </Column>
          <Column header="Sous-total">
            <template #body="{ data }">
              {{ formatPrice(data.quantity * data.price) }}
              {{ userProfile ? userProfile.currency_preference : '' }}
            </template>
          </Column>
          <Column header="Action">
            <template #body="{ data }">
              <Button
                icon="pi pi-trash"
                severity="danger"
                rounded
                text
                @click="removeFromInvoice(data.product.id)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- 💰 Totaux -->
      <div class="mt-4 text-right text-lg font-bold text-gray-800">
        Total : {{ formatPrice(totalAmount) }}
        {{ userProfile ? userProfile.currency_preference : '' }}
      </div>

      <div class="mt-3">
        <label for="amountPaid" class="block mb-1 font-medium text-gray-700">
           Montant payé :
        </label>
        <InputNumber
          id="amountPaid"
          v-model="amountPaid"
          mode="decimal"
          :min="0"
          :maxFractionDigits="2"
          locale="en-US"
          :useGrouping="false"
          class="w-full sm:w-40"
        />
      </div>

      <div class="mt-2 text-right font-semibold text-gray-700">
        Reste : {{ formatPrice(change) }}
        {{ userProfile ? userProfile.currency_preference : '' }}
      </div>

      <!-- ✅ Bouton -->
      <div class="mt-5 text-right">
        <Button
          label="💳 Payer et créer facture"
          icon="pi pi-check"
          @click="createInvoice"
          severity="success"
          class="w-full sm:w-auto text-base font-semibold"
        />
      </div>
    </div>
  </div>

</template>
