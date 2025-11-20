
<script setup>
import {
  addStockAPI,
  createCategorie,
  createProductAPI,
  deleteCategorie,
  deleteProductAPI,
  fetchProduits,
  fetchStockHistory,
  fetchUserProfilById,
  getCategoryByUser,
  getUsersCreatedByMe,
  updateProductAPI,
  verifySecretKey,
} from '@/service/Api';
import { formatDate } from '@/utils/formatters';


import { clearAllCache, loadCache, saveCache } from '@/utils/cache.js';
import { FilterMatchMode } from '@primevue/core/api';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
const toast = useToast();

// --- state ---
const categorys = ref([]);
const products = ref([]);
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref([]);
const userProfile = ref(null);

const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const filetersHistoy = ref({global: {value: null, matchMode: FilterMatchMode.CONTAINS}});

const submitted = ref(false);
const showSensitiveInfo = ref(false);
const secretKey = ref('');
const secretDialog = ref(false);
const submittedSecret = ref(false);

const allUsers = ref([]);
const childUsers = ref([]);
const user = ref(null);

const selectedUserFilter = ref(null); // null = par défaut -> utilisateur connecté
const selectedUserProfile = ref(null);

const selectedCategoryFilter = ref(null);
const ajoutStockDialog =ref(false);
const stockQuantity = ref(0);


const historyDialog = ref(false);
const historyList = ref([]);

const dt = ref();

const startDate = ref(null);
const endDate = ref(null);
const loadingHistory = ref(true);


// dialog/category state
const categoryDialog = ref(false);
const category = ref({ name: '' });
const submittedCategory = ref(false);
const deleteCategoryDialog = ref(false);
const categoryToDelete = ref(null);

// ------------------
// Utilities / loaders
// ------------------
async function normalizeProfileResponse(res) {
  // Accept either object or [object]
  return Array.isArray(res) ? res[0] : res;
}

async function loadUserProfile(userId) {
  const cached = loadCache('userProfile');
  if (cached) { userProfile.value = cached; return; }
  try {
    const result = await fetchUserProfilById(userId);
    userProfile.value = await normalizeProfileResponse(result);
    saveCache('userProfile', userProfile.value);
  } catch (error) {
    console.error('Erreur récupération profil utilisateur', error);
  }
}

async function getUserChildren() {
  try {
    const allCreatedUsers = await getUsersCreatedByMe();
    childUsers.value = Array.isArray(allCreatedUsers) ? allCreatedUsers : [];
    // make sure user.value included (user should be an object with id/username)
    allUsers.value = [user.value, ...childUsers.value].filter(Boolean);
  } catch (err) {
    console.error('Erreur getUserChildren', err);
    childUsers.value = [];
    allUsers.value = user.value ? [user.value] : [];
  }
}

async function loadCategories(userId) {
  try {
    const fetchedCategorys = await getCategoryByUser(userId);
    categorys.value = Array.isArray(fetchedCategorys) ? fetchedCategorys : [];
    saveCache('categories', categorys.value);
  } catch (error) {
    console.error('Erreur récupération catégories', error);
    categorys.value = [];
  }
}

async function loadProducts(userId) {
  try {
    const fetchedProducts = await fetchProduits(userId) || [];
    const cachedProducts = loadCache('products');
    if(cachedProducts && cachedProducts.length){
      products.value = cachedProducts;
      console.log('Produits charger depuis le cache');
      return;
    }
    products.value = (Array.isArray(fetchedProducts) ? fetchedProducts : []).map(p => ({
      ...p,
      category_name: categorys.value.find(c => c.id === p.category)?.name || 'Unknown'
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));  
    saveCache('products', products.value);
    console.log('Produits chargés depuis l’API et mis en cache'); 

  } catch (error) {
    console.error('Erreur récupération produits', error);
    products.value = [];
  }
}

// helper: charger categories + produits pour un utilisateur donné
async function loadCategoriesAndProductsForUser(userId) {
  // load categories first so category_name mapping works
  await loadCategories(userId);
  await loadProducts(userId);
}

// ------------------
// Lifecycle
// ------------------
onMounted(async () => {
  const userId = localStorage.getItem('id');
  if (!userId) {
    toast.add({ severity: 'warn', summary: 'Utilisateur non identifié', detail: 'Veuillez vous reconnecter.', life: 3000 });
    return;
  }

  try {
    // fetch minimal user info (could be id/username)
    const minimalUser = await fetchUserProfilById(userId);
    user.value = await normalizeProfileResponse(minimalUser);

    // load main profile & lists in parallel
    await loadUserProfile(userId);          // sets userProfile.value
    selectedUserProfile.value = userProfile.value; 
    // default shown profile

    // load children/categories/products
    await getUserChildren();
    await loadCategoriesAndProductsForUser(userId);

    // leave selectedUserFilter null => default to connected user
    selectedUserFilter.value = null;

  } catch (err) {
    console.error('Erreur lors du chargement initial :', err);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données initiales.', life: 3000 });
  }
});

// ------------------
// Watchers
// ------------------

const filtedHistory = computed(() => {
  return historyList.value.filter(item => {
    const created = new Date(item.created_at);
    const start = startDate.value? new Date(startDate.value): null;
    const end = endDate.value? new Date(endDate.value):null;

    if(start && end) return created >= start && created <= end;
    if(start) return created >= start;
    if(end) return created >= end;
    return true;
  })
})

function resetDates(){
  startDate.value = null;
  endDate.value = null;
}

async function openHistoryDialog() {
const userId = selectedUserFilter.value || localStorage.getItem('id');

// Charger le cache existant
let cacheHistory = loadCache('historyStock') || [];
try{

  if (cacheHistory && cacheHistory.length) {
  historyList.value = cacheHistory;
  console.log('Historique chargé depuis le cache');
  } else {
// Récupérer depuis l'API
    const result = await fetchStockHistory(userId);
    historyList.value = Array.isArray(result) ? result : [];
    console.log('Historique chargé depuis l’API');
    saveCache('historyStock',result);
    }
 
  historyDialog.value = true;
}catch(error){
  console.error('error lors du chargement', error);
 } finally{
  loadingHistory.value = false;
 }
}

// histoy stock pdf
function downloadPDFHistory(){
  const doc = new jsPDF();
  const columns = [
      { header: 'Produit', dataKey: 'product_name' },
      {header: 'Quantite ajoutée', dataKey:'quantity_added'},
      { header: 'Stock après', dataKey: 'new_stock' },
      { header: 'Ajouté par', dataKey: 'added_by_name' },
      { header: 'Date', dataKey: 'created_at' }
  ]
  const rows = filtedHistory.value.map(item => ({
    ...item,
    created_at:formatDate(item.created_at)
  }));
 
  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => row[c.dataKey])),
    startY: 20,
    theme: 'striped'
  });

   doc.text('Historique des stocks', 14, 15);
   doc.save('historique_stocks.pdf');
}

// pdf produits 
function downloadPDFProduct(){
  const doc = new jsPDF();

    const pdfCurrency =
    selectedUserProfile?.currency_preference ||
    userProfile?.currency_preference ||
    "N/D";

  const columns = [
     {header: 'Produit', dataKey: 'name'},
     {header: 'Prix Vente', dataKey:'price'},
     {header: "Prix d'achat", dataKey:'purchase_price'},
     {header: "Devise", dataKey:'currency'},
     {header:'Stock', dataKey:'stock'},
     {header:'Date Ajout', dataKey:'created_at'},
     {header:'Date Expi', dataKey:'expiration_date'},
     {header:'TVA', dataKey:'tva'},
     {header:'Categorie', dataKey:'category_name'},
     {header:'Code Barre', dataKey:'barcode'},

  ]
  const rows = filteredProducts.value.map(item =>({
    ...item,
    created_at:formatDate(item.created_at),
    expiration_date:formatDate(item.expiration_date),
    tva: item.tva ? "Avec" : "Sans",
    currency: pdfCurrency
  
  }));
  
  
  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => row[c.dataKey])),
    startY: 20,
    theme: 'striped'
  });

  doc.text('liste des produits', 14, 15);
  doc.save('liste_produits.pdf');

}








// 1 watcher unique pour selectedUserFilter
watch(selectedUserFilter, async (newUserId) => {
  try {
    // no selection -> revert to connected user
    if (!newUserId) {
      selectedUserProfile.value = userProfile.value;
      await loadCategoriesAndProductsForUser(user.value?.id || localStorage.getItem('id'));
      return;
    }

    const selId = parseInt(newUserId);
    // load profile for selected user (normalize)
    const fetchedProfile = await fetchUserProfilById(selId);
    selectedUserProfile.value = await normalizeProfileResponse(fetchedProfile);

    // load categories + products for selected user (parallel)
    const [cats, prods] = await Promise.all([
      getCategoryByUser(selId),
      fetchProduits(selId)
    ]);

    categorys.value = Array.isArray(cats) ? cats : [];
    products.value = (Array.isArray(prods) ? prods : []).map(p => ({
      ...p,
      category_name: categorys.value.find(c => c.id === p.category)?.name || 'Unknown'
    })).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    console.error('Erreur récupération produits/catégories utilisateur', error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données de l’utilisateur', life: 3000 });
  }
});
// verifier le code secret
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

// ------------------
// Computed filtered products
// ------------------
const filteredProducts = computed(() => {
  let filtered = products.value;

  if (selectedCategoryFilter.value && selectedCategoryFilter.value !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategoryFilter.value);
  }

  if (selectedUserFilter.value) {
    filtered = filtered.filter(p => p.user_created === selectedUserFilter.value);
  }

  // Apply global search filter if any
  const q = filters.value.global?.value;
  if (q) {
    const lower = q.toString().toLowerCase();
    filtered = filtered.filter(p =>
      (p.name || '').toString().toLowerCase().includes(lower) ||
      (p.category_name || '').toString().toLowerCase().includes(lower) ||
      (p.barcode || '').toString().toLowerCase().includes(lower)
    );
  }

  return filtered;
});

// force forceRefrech

async function forceRefresh(){
  try{
    const userId =  user.value?.id || localStorage.getItem('id');
    if(!userId){
        toast.add({severity: 'warn',summary: 'Utilisateur non identifié',detail: 'Veuillez vous reconnecter.',life: 3000
      });
      return;
    }
   clearAllCache();

    products.value = [];
    categorys.value = [];

    await Promise.all([
      loadUserProfile(userId),
      loadCategories(userId),
      loadProducts(userId),
      getUserChildren()
    ]);
    selectedUserProfile.value = userProfile.value;
   

    toast.add({
      severity: 'success',
      summary: 'Actualisé',
      detail: 'Les données ont été rechargées depuis le serveur.',
      life: 3000
    });

  }catch(error){
    console.error("Erreur lors de l'atualisation :", error);

    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de rafraîchir les données.',
      life: 3000
    });
  }
}

// ------------------
// CRUD + helpers
// ------------------
async function saveCategory() {
  submittedCategory.value = true;
  if (!category.value.name) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Le nom de la catégorie est requis', life: 3000 });
    return;
  }
  try {
    const userCreated = localStorage.getItem('id');
    const newCategory = { ...category.value, user_created: userCreated };
    const created = await createCategorie(newCategory);
    categorys.value.push(created);
    saveCache('categories', categorys.value);
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Catégorie ajoutée', life: 3000 });
    categoryDialog.value = false;
    category.value = { name: '' };
  } catch (error) {
    console.error('Erreur création catégorie', error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec création', life: 3000 });
  }
}

async function removeCategory() {
  try {
    await deleteCategorie(categoryToDelete.value.id);
    categorys.value = categorys.value.filter(c => c.id !== categoryToDelete.value.id);
    saveCache('categories', categorys.value);
    toast.add({ severity: 'success', summary: 'Supprimée', detail: 'Catégorie supprimée', life: 3000 });
    deleteCategoryDialog.value = false;
    categoryToDelete.value = null;
  } catch (error) {
    console.error('Erreur suppression catégorie', error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer', life: 3000 });
  }
}

function confirmDeleteCategory(cat) { categoryToDelete.value = cat; deleteCategoryDialog.value = true; }

function openNew() { 
  product.value = { tva:true};
  submitted.value = false; 
  productDialog.value = true;

   }
function hideDialog() { productDialog.value = false; submitted.value = false; }

async function saveProduct() {
  submitted.value = true;
  const { name, price, purchase_price, stock, category: catId, id, barcode } = product.value;
  if (!name || !price || !purchase_price || !stock || !catId) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all required fields', life: 3000 });
    return;
  }
  if (barcode) {
    const barcodeExists = products.value.some(p => p.barcode === barcode && p.id !== id);
    if (barcodeExists) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Ce code-barres est déjà utilisé.', life: 3000 });
      return;
    }
  }

  try {
    const userCreated = localStorage.getItem('id');
    const productData = { ...product.value, user_created: userCreated };
    if (productData.expiration_date) {
      const d = new Date(productData.expiration_date);
      productData.expiration_date = d.toISOString().split('T')[0];
    }

    if (id) {
      const updateProduct = await updateProductAPI(id, productData);
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        const category_name = categorys.value.find(c => c.id === updateProduct.category)?.name || 'Unknown';
        products.value[index] = { ...updateProduct, category_name };
      }
      toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
    } else {
      const createdProduct = await createProductAPI(productData);
      products.value.unshift(createdProduct);
      toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
    }

    saveCache('products', products.value);
    hideDialog();
  } catch (error) {
    console.error('Error saving product', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save product', life: 3000 });
  }
}

function onExpirationChange(e) { product.value.expiration_date = e.value ? e.value.toISOString().split('T')[0] : null; }

async function editProduct(prod) {
  if (!categorys.value.length) await loadCategories(user.value?.id || localStorage.getItem('id'));
  product.value = { ...prod, tva: prod.tva ?? true };
  productDialog.value = true;
}

async function deleteProduct() {
  try {
    await deleteProductAPI(product.value.id);
    products.value = products.value.filter(val => val.id !== product.value.id);
    deleteProductDialog.value = false;
    product.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Product deleted', life: 3000 });
  } catch (error) {
    console.error('Error deleting product', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete product', life: 3000 });
  }
}

function confirmDeleteProduct(prod) { product.value = prod; deleteProductDialog.value = true; }
function confirmDeleteSelected() { deleteProductsDialog.value = true; }

async function deleteSelectedProducts() {
  try {
    for (const selectedProduct of selectedProducts.value) {
      await deleteProductAPI(selectedProduct.id);
    }
    products.value = products.value.filter(val => !selectedProducts.value.includes(val));
    deleteProductsDialog.value = false;
    selectedProducts.value = [];
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
  } catch (error) {
    console.error('Error deleting products', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete products', life: 3000 });
  }
}


function openAjoutStock(prod){
  product.value = prod;
  stockQuantity.value = 0;
  ajoutStockDialog.value = true;
}

// function to add stock
async function addStockToProduct(){
  if(stockQuantity.value <= 0){
      toast.add({ severity: 'warn', summary: 'Attention', detail: 'Quantité invalide', life: 3000 });
      return;
  }
  try{
    const result = await addStockAPI(product.value.id, stockQuantity.value);
    let cachedProducts = loadCache('products');
    if (!Array.isArray(cachedProducts)) {
      cachedProducts = [];
    }
    const index = cachedProducts.findIndex(p => p.id === product.value.id);
    if (index !== -1) {
      cachedProducts[index].stock = result.stock_after;
    }
    saveCache('products', cachedProducts);
    loadProducts(localStorage.getItem('id'));
    
    toast.add({
      severity: 'success',
      summary: 'Stock ajouté',
      detail: `Avant : ${result.stock_before} | Après : ${result.stock_after}`,
      life: 3000
    });

    ajoutStockDialog.value = false;

  }catch(error){
     console.error("Erreur ajout stock :", error);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d’ajouter du stock', life: 3000 });
  }
}


// utilities
function formatPrice(price) { return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", "); }

function calculateDenfice(prixVente, prixAchat) {
  if (!prixAchat) return 0;
  return parseFloat((((prixVente - prixAchat) * 100) / prixAchat).toFixed(2));
}
function exportCSV() { dt.value?.exportCSV(); }
function sortProductsByDate() { products.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); }

</script>



<template>
 <div class="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 dark:bg-gray-900">

    <!-- === TOOLBAR PRINCIPALE === -->
    <div class="card mb-6 shadow-sm rounded-xl bg-white dark:bg-gray-800">
      <Toolbar class="flex flex-wrap justify-between items-center gap-4 p-4">

        <!-- Boutons de gauche -->
        <template #start>
          <div class="flex flex-wrap gap-2">
            <Button label="Nouveau Produit" icon="pi pi-plus" severity="success" @click="openNew" />
            <Button label="Nouvelle Catégorie" icon="pi pi-folder-plus" severity="info" @click="categoryDialog = true" />
            <Button
              label="Effacer"
              icon="pi pi-trash"
              severity="danger"
              :disabled="!selectedProducts || !selectedProducts.length"
              @click="confirmDeleteSelected"
            />
          </div>
        </template>

        <!-- Boutons de droite -->
        <template #end>
          <div class="flex flex-wrap gap-2 justify-end"> 
            <Button
                icon="pi pi-refresh"
                label="Actualiser"
                class="p-button-outlined p-button-secondary"
                @click="forceRefresh"
              />
           <Button label="Télécharger PDF" icon="pi pi-file-pdf " class="p-button-success" @click="downloadPDFProduct" />
            <Button label="Prix d'achat & Bénéfice" icon="pi pi-lock" severity="warning" @click="secretDialog = true" />
          </div>
        </template>

      </Toolbar>
    </div>

    <!-- === DATATABLE === -->
    <div class="card shadow-md rounded-xl overflow-x-auto bg-white dark:bg-gray-800 p-4">
      <DataTable
        ref="dt"
        v-model:selection="selectedProducts"
        :value="filteredProducts"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        responsiveLayout="scroll"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords} produits"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      >

        <!-- === HEADER (Filtres + Recherche) === -->
        <template #header>
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">

            <h4 class="text-lg sm:text-xl font-semibold text-[#004D4A] m-0">Table des Produits</h4>

            <div class="flex flex-wrap gap-3 items-center justify-end w-full sm:w-auto">
              <Button 
                label="historique de stock"
                icon="pi pi-history"
                severity="info"
                @click="openHistoryDialog"
              />

              <!-- Filtre utilisateur -->
              <Select
                v-model="selectedUserFilter"
                :options="allUsers.map(u => ({ id: u.id, username: u.username }))"
                optionLabel="username"
                optionValue="id"
                placeholder="Filtrer par utilisateur"
                class="w-full sm:w-56"
                showClear
              />

              <!-- Filtre catégorie -->
              <Select
                v-model="selectedCategoryFilter"
                :options="[{ id: 'all', name: 'Tous' }, ...categorys]"
                optionLabel="name"
                optionValue="id"
                placeholder="Filtrer par catégorie"
                class="w-full sm:w-56"
                showClear
              />

              <!-- Recherche globale -->
            <span class="relative flex items-center w-full sm:w-64">
              <i
                v-if="!filters['global'].value"
                class="pi pi-search absolute left-3 text-gray-400 transition-opacity duration-200"
              ></i>

              <InputText
                v-model="filters['global'].value"
                placeholder="     Rechercher..."
                class="w-full pl-9 py-2 text-sm sm:text-base focus:pl-3 transition-all duration-200"
              />
            </span>


            </div>
          </div>
        </template>

        <!-- === COLONNES === -->
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false" />

        <Column field="id" header="ID" sortable style="min-width: 5rem" />

        <Column field="name" header="Nom produit" sortable style="min-width: 12rem" />

        <Column field="price" header="Prix vente" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatPrice(slotProps.data.price) }}</template>
        </Column>

        <Column
          v-if="showSensitiveInfo"
          field="purchase_price"
          header="Prix achat"
          sortable
          style="min-width: 8rem"
        >
          <template #body="slotProps">{{ formatPrice(slotProps.data.purchase_price) }}</template>
        </Column>

        <Column field="currency" header="Devise" style="min-width: 6rem; text-align: center;">
          <template #body>
            {{ selectedUserProfile?.currency_preference || userProfile?.currency_preference || 'N/D' }}
          </template>
        </Column>


        <Column
          v-if="showSensitiveInfo"
          field=""
          header="Bénéfice"
          style="min-width: 6rem"
        >
          <template #body="slotProps">
            {{ calculateDenfice(slotProps.data.price, slotProps.data.purchase_price) }}%
          </template>
        </Column>

        <Column field="stock" header="Stock" sortable style="min-width: 6rem" />


        <Column field="created_at" header="Date Ajout" sortable style="min-width: 10rem">
          <template #body="slotProps">{{ formatDate(slotProps.data.created_at) }}</template>
        </Column>

        <Column field="expiration_date" header="Date Exp" sortable style="min-width: 10rem">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.expiration_date ) }}
          </template>
        </Column>
        <Column field="tva" header="TVA 16 %" sortable style="min-width: 10rem">
          <template #body="slotProps">
            <span
              :class="[
                'px-3 py-1 rounded-full text-white text-sm font-semibold',
                slotProps.data.tva ? 'bg-green-500' : 'bg-yellow-500'
              ]"
            >
              {{ slotProps.data.tva ? 'Avec' : 'Sans' }}
            </span>
          </template>
        </Column>
        <Column field="category_name" header="Catégorie" sortable style="min-width: 10rem" />

        <Column field="barcode" header="Code barre" sortable style="min-width: 10rem">
          <template #body="slotProps">{{ slotProps?.data.barcode || 'N/A' }}</template>
        </Column>

        <!-- === Actions === -->
        <Column header="Actions" style="min-width: 8rem">
          <template #body="slotProps">
            <div class="flex justify-center gap-2">
              <Button icon="pi pi-pencil" rounded outlined @click="editProduct(slotProps.data)" />
              <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                @click="confirmDeleteProduct(slotProps.data)"
              />
              <Button icon="pi pi-plus" severity="success" @click="openAjoutStock(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogs -->
    <Dialog v-model:visible="productDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Product Details" :modal="true">
      <div class="flex flex-col gap-4">

        <div>
          <label class="block font-bold mb-2">Code barre</label>
          <InputText v-model.trim="product.barcode" fluid />
          
        </div>

        <div>
          <label class="block font-bold mb-2">Name</label>
          <InputText v-model.trim="product.name" :invalid="submitted && !product.name" fluid autofocus />
          <small v-if="submitted && !product.name" class="text-red-500 text-sm">Name is required.</small>
        </div>



        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold mb-2">Prix Vente {{ userProfile ? userProfile.currency_preference : 'N/D' }}</label>
            <InputNumber v-model="product.price"  mode="decimal" :maxFractionDigits="2" locale="en-US"  :useGrouping="false"  fluid />
          </div>
          <div>
            <label class="block font-bold mb-2">Prix Achat {{ userProfile ? userProfile.currency_preference : 'N/D' }}</label>
            <InputNumber v-model="product.purchase_price" mode="decimal" :maxFractionDigits="2" locale="en-US"  :useGrouping="false"  fluid />
          </div>

          <div>
            <label class="block font-bold mb-2">TVA (16%)</label>
            <Checkbox v-model="product.tva" binary /> Avec TVA
          </div>

          <div>
            <label class="block font-bold mb-2">Stock</label>
            <InputNumber v-model="product.stock" integeronly fluid />
          </div>

          <div>
          <label class="block font-bold mb-2">Date d'expiration (optionnel)</label>
          <Calendar v-model="product.expiration_date" date-format="yy-mm-dd" :on-change="onExpirationChange" show-icon placeholder="Select a date" fluid />
        </div>

          <div>
            <label class="block font-bold mb-2">Category</label>
            <Select v-model="product.category" :options="categorys" optionLabel="name" optionValue="id" placeholder="Select a Category" fluid />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" @click="saveProduct" />
      </template>
    </Dialog>

    <!-- Delete Dialogs -->
    <Dialog v-model:visible="deleteProductDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Confirm" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Are you sure you want to delete <b>{{ product.name }}</b>?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="deleteProductDialog = false" />
        <Button label="Yes" icon="pi pi-check" @click="deleteProduct" />
      </template>
    </Dialog>

    <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Confirm" :modal="true">
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle !text-3xl" />
        <span>Are you sure you want to delete the selected products?</span>
      </div>
      <template #footer>
        <Button label="No" icon="pi pi-times" text @click="deleteProductsDialog = false" />
        <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedProducts" />
      </template>
    </Dialog>

    <!-- Secret Dialog -->
    <Dialog v-model:visible="secretDialog" header="Entrer code secret" :modal="true" :closable="false" :style="{ width: '90%', maxWidth: '350px' }">
      <div>
        <label for="secret">Code secret</label>
        <InputText id="secret" v-model.trim="secretKey" :class="{ 'p-invalid': submittedSecret && !secretKey }" autofocus />
        <small v-if="submittedSecret && !secretKey" class="p-error">Le code secret est requis.</small>
      </div>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" text @click="secretDialog = false" />
        <Button label="Valider" icon="pi pi-check" @click="verifySecret" />
      </template>
    </Dialog>




    <!-- Dialog Nouvelle Catégorie -->
 <Dialog
  v-model:visible="categoryDialog"
  header="Gestion des Catégories"
  :modal="true"
  :style="{ width: '90%', maxWidth: '450px' }"
>
  <div class="flex flex-col gap-4">
    <!-- Ajout d'une nouvelle catégorie -->
    <div>
      <label class="block font-bold mb-2">Nom de la catégorie</label>
      <div class="flex items-center gap-2">
        <InputText
          v-model.trim="category.name"
          placeholder="Entrer une catégorie"
          :invalid="submittedCategory && !category.name"
          class="flex-1"
        />
        <Button label="Ajouter" icon="pi pi-check" @click="saveCategory" />
      </div>
      <small v-if="submittedCategory && !category.name" class="text-red-500 text-sm">
        Nom requis.
      </small>
    </div>

    <Divider />

    <!-- Liste des catégories existantes -->
    <div>
      <h4 class="text-lg font-semibold mb-2">Catégories existantes</h4>

      <div v-if="categorys.length === 0" class="text-gray-500 text-sm">
        Aucune catégorie enregistrée.
      </div>

      <ul class="divide-y divide-gray-200 max-h-60 overflow-y-auto">
        <li
          v-for="cat in categorys"
          :key="cat.id"
          class="flex justify-between items-center py-2"
        >
          <span>{{ cat.name }}</span>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            @click="confirmDeleteCategory(cat)"
          />
        </li>
      </ul>
    </div>
  </div>

  <!-- Footer -->
  <template #footer>
    <Button label="Fermer" icon="pi pi-times" text @click="categoryDialog = false" />
  </template>
</Dialog>


  <!-- Dialog confirmation suppression -->
  <Dialog
    v-model:visible="deleteCategoryDialog"
    header="Confirmer la suppression"
    :modal="true"a
    :style="{ width: '90%', maxWidth: '350px' }"
   >
    <div class="flex items-center gap-3">
      <i class="pi pi-exclamation-triangle text-yellow-500 text-3xl"></i>
      <span>Supprimer la catégorie <b>{{ categoryToDelete?.name }}</b> ?</span>
    </div>
    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="deleteCategoryDialog = false" />
      <Button label="Supprimer" icon="pi pi-check" severity="danger" @click="removeCategory" />
    </template>
  </Dialog>


 <!-- Dialog add stock -->
 <Dialog v-model:visible="ajoutStockDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Ajouter du stock" modal>
    <div class="flex flex-col gap-4">
        <div>
          <label class="block font-bold mb-2"> Code Barre:   {{ product.barcode || 'N/A'}} </label>
        </div>
        <div>
          <label class="block font-bold mb-2"> Produit:   {{ product.name}} </label>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
           <label class="block font-bold mb-2"> Stock</label>
            <div>
              {{ product.stock }}
            </div>
          </div>
          <div>
              <label class="block font-bold mb-2">Quantité à ajouter</label>
             <InputNumber v-model="stockQuantity" placeholder="Quantité" />
          </div>

        </div>
        
    </div>

    <template #footer>
        <Button label="Annuler" class="p-button-text" @click="ajoutStockDialog = false" />
        <Button label="Ajouter" @click="addStockToProduct" />
    </template>
</Dialog>


<Dialog
  v-model:visible="historyDialog"
  header="Historique des stocks"
  :modal="true"
  :style="{ width: '90%', maxWidth: '700px' }"
  :closable="true"
>




  <DataTable 
    :value="filtedHistory" 
    stripedRows 
    scrollable 
    :scrollHeight="'400px'"
    tableStyle="min-width: 50rem; text-align: center;"
    class="history-table"
    :loading="loadingHistory"
    :filters="filetersHistoy"
  >
  <template #header>
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 w-full">
      
      <!-- Barre de recherche -->
      <div class="relative flex items-center w-full sm:w-64">

        <InputText
          v-model="filetersHistoy['global'].value"
          placeholder="Rechercher..."
          class="w-full pl-9 py-2 text-sm sm:text-base focus:pl-3 transition-all duration-200"
        />
      </div>

      <!-- Filtres de date -->
      <div class="flex gap-3 items-center">
        <Calendar v-model="startDate" placeholder="Date début" date-format="yy-mm-dd" show-icon />
        <Calendar v-model="endDate" placeholder="Date fin" date-format="yy-mm-dd" show-icon />
        <Button label="Réinitialiser" icon="pi pi-refresh" class="p-button-outlined" @click="resetDates" />
      </div>
    </div>
  </template>

  <template #loading>
    <div class="flex justify-center items-center p-4">
      <ProgressSpinner />
      <span class="ml-2">Chargement...</span>
    </div>
  </template>

    <Column field="product_name" header="Produit" sortable style="text-align: center;"></Column>
    <Column field="previous_stock" header="Stock avant" sortable style="text-align: center;"></Column>
    <Column field="quantity_added" header="Quantité ajoutée" sortable style="text-align: center;"></Column>
    <Column field="new_stock" header="Stock après" sortable style="text-align: center;"></Column>
    <Column field="added_by_name" header="Ajouté par" style="text-align: center;"></Column>
    <Column field="created_at" header="Date" sortable style="text-align: center;">
      <template #body="slotProps">
        {{ formatDate(slotProps.data.created_at) }}
      </template>
    </Column>
  </DataTable>

<template #footer>
<Button label="Télécharger PDF" icon="pi pi-file-pdf " class="p-button-success" @click="downloadPDFHistory" />
<Button label="Fermer" icon="pi pi-times" text @click="historyDialog = false" /> </template>

</Dialog>


  </div>

</template>

<style scoped>
/* Responsive adjustments */
@media (max-width: 640px) {
  .p-button {
    width: 100%;
  }
  .p-datatable th, .p-datatable td {
    font-size: 0.85rem;
    padding: 0.4rem 0.5rem;
  }
}

/* Réduction de la hauteur des lignes */
.history-table .p-datatable-tbody > tr > td {
  padding: 0.25rem 0.5rem; /* réduit la hauteur des lignes */
  vertical-align: middle;  /* centre verticalement le contenu */
}

.history-table .p-datatable-thead > tr > th {
  text-align: center;       /* centre les en-têtes */
}
</style>
