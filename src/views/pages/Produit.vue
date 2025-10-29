

<script setup>
import {
    createProductAPI, deleteProductAPI, fetchCategorys, fetchProduits,
    fetchUserProfilById,
    updateProductAPI, verifySecretKey
} from '@/service/Api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const categorys = ref([]);
const products = ref([]);
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref([]);
const userProfile = ref(null);

const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
const submitted = ref(false);
const showSensitiveInfo = ref(false);
const secretKey = ref('');
const secretDialog = ref(false);
const submittedSecret = ref(false);

const toast = useToast();
const dt = ref();

const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
const cacheKey = (name) => `cache_${name}`;

const saveCache = (name, data) => {
    localStorage.setItem(cacheKey(name), JSON.stringify({ data, timestamp: Date.now() }));
};

const loadCache = (name) => {
    const cached = localStorage.getItem(cacheKey(name));
    if (!cached) return null;
    try {
        const payload = JSON.parse(cached);
        if (Date.now() - payload.timestamp < CACHE_EXPIRATION_MS) return payload.data;
        localStorage.removeItem(cacheKey(name));
        return null;
    } catch {
        return null;
    }
};

// --- Chargement initial ---
onMounted(async () => {
    const userId = localStorage.getItem('id');
    if (!userId) {
        toast.add({ severity: 'warn', summary: 'Utilisateur non identifié', detail: 'Veuillez vous reconnecter.', life: 3000 });
        return;
    }

    await Promise.all([
        loadUserProfile(userId),
        loadCategories(),
        loadProducts(userId)
    ]);
});

// --- Chargement avec cache ---
async function loadUserProfile(userId) {
    const cached = loadCache('userProfile');
    if (cached) { userProfile.value = cached; return; }
    try {
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        saveCache('userProfile', userProfile.value);
        console.log('Profil utilisateur récupéré :', result);
    } catch (error) {
        console.error('Erreur récupération profil utilisateur', error);
    }
}

async function loadCategories() {
    const cached = loadCache('categories');
    if (cached) { categorys.value = cached; return; }
    try {
        const fetchedCategorys = await fetchCategorys();
        categorys.value = fetchedCategorys;
        saveCache('categories', fetchedCategorys);
    } catch (error) {
        console.error('Erreur récupération catégories', error);
    }
}

async function loadProducts(userId) {
    const cached = loadCache('products');
    if (cached) { products.value = cached; return; }
    try {
        const fetchedProducts = await fetchProduits(userId);
        products.value = fetchedProducts.map(p => ({
            ...p,
            category_name: categorys.value.find(c => c.id === p.category)?.name || 'Unknown'
        })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        saveCache('products', products.value);
    } catch (error) {
        console.error('Erreur récupération produits', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load products', life: 3000 });
    }
}

// --- Forcer actualisation ---
async function forceRefresh() {
    localStorage.removeItem(cacheKey('userProfile'));
    localStorage.removeItem(cacheKey('products'));
    localStorage.removeItem(cacheKey('categories'));
    const userId = localStorage.getItem('id');
    if (!userId) return;
    products.value = [];
    categorys.value = [];
    await loadUserProfile(userId);
    await loadCategories();
    await loadProducts(userId);
    toast.add({ severity: 'success', summary: 'Actualisé', detail: 'Données rechargées depuis le serveur', life: 3000 });
}

// --- Rafraîchir depuis cache ---


// --- Gestion secret ---
async function verifySecret() {
    submittedSecret.value = true;
    if (!secretKey.value) return;
    try {
        const isValid = await verifySecretKey(secretKey.value);
        if (isValid.valid) {
            showSensitiveInfo.value = true;
            secretDialog.value = false;
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Code secret validé', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Code secret invalide', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de vérification', life: 3000 });
    }
}

// --- CRUD produits ---
function openNew() { product.value = {}; submitted.value = false; productDialog.value = true; }
function hideDialog() { productDialog.value = false; submitted.value = false; }

async function saveProduct() {
    submitted.value = true;
    const { name, price, purchase_price, stock, category, id } = product.value;
    if (!name || !price || !purchase_price || !stock || !category) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all required fields', life: 3000 });
        return;
    }
    try {
        const userCreated = localStorage.getItem('id');
        const productData = { ...product.value, user_created: userCreated };
        if (id) {
            const updateProduct = await updateProductAPI(product.value.id, productData);
            const index = products.value.findIndex(p => p.id == product.value.id);
            if (index !== -1) {
                const category_name = categorys.value.find(c => c.id === updateProduct.category)?.name || 'Unknown';
                products.value[index] = { ...updateProduct, category_name };
            }
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
        } else {
            const createdProduct = await createProductAPI(productData);
            products.value.push(createdProduct);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
        }
        saveCache('products', products.value);
        hideDialog();
    } catch (error) {
        console.error('Error saving product', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save product', life: 3000 });
    }
}

async function editProduct(prod) {
    if (!categorys.value.length) await loadCategories();
    product.value = { ...prod };
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

// --- Utils ---
function formatPrice(price) { return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", "); }
function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(' ', ' ');
}
function calculateDenfice(prixVente, prixAchat) {
    return parseFloat((((prixVente - prixAchat) * 100) / prixAchat).toFixed(2));
}
function exportCSV() { dt.value.exportCSV(); }
function sortProductsByDate() { products.value.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); }

</script>


<template>
  <div class="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Toolbar -->
    <div class="card mb-6">
      <Toolbar class="flex flex-wrap justify-between items-center gap-2">
        <template #start>
          <div class="flex flex-wrap gap-2">
            <Button label="Nouveau Produit" icon="pi pi-plus" severity="secondary" @click="openNew" />
            <Button label="Effacer" icon="pi pi-trash" severity="danger"
              :disabled="!selectedProducts || !selectedProducts.length"
              @click="confirmDeleteSelected" />
          </div>
        </template>

        <template #end>
        <div class="flex flex-wrap gap-2">
            <Button label="Actualiser" icon="pi pi-sync" severity="warning" @click="forceRefresh" />
            <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
            <Button label="Afficher prix d'achat & bénéfice" icon="pi pi-lock" severity="warning" @click="secretDialog = true" />
        </div>
        </template>


      </Toolbar>
    </div>

    <!-- DataTable -->
    <div class="card overflow-x-auto">
      <DataTable
        ref="dt"
        v-model:selection="selectedProducts"
        :value="products"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
        class="min-w-full"
      >
        <template #header>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h4 class="m-0 text-lg sm:text-xl font-semibold">Table Produits</h4>
            <div class="flex flex-1 sm:flex-none items-center gap-2 mt-2 sm:mt-0">
              <InputText v-model="filters['global'].value" placeholder="Search..." class="flex-1 sm:w-auto" />
              <i class="pi pi-search text-gray-400"></i>
            </div>
          </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>
        <Column field="name" header="Nom produit" sortable style="min-width: 12rem"></Column>
        <Column field="price" header="Prix vente" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatPrice(slotProps.data.price) }}</template>
        </Column>

        <Column v-if="showSensitiveInfo" field="purchase_price" header="Prix achat" sortable style="min-width: 8rem">
          <template #body="slotProps">{{ formatPrice(slotProps.data.purchase_price) }}</template>
        </Column>
        <Column field="" header="Devise" sortable style="min-width: 4rem">
          <template #body="slotProps">{{ userProfile ? userProfile.currency_preference : 'N/D' }}</template>
        </Column>
        <Column v-if="showSensitiveInfo" field="" header="Bénéfice" sortable style="min-width:6rem">
          <template #body="slotProps">{{ calculateDenfice(slotProps.data.price, slotProps.data.purchase_price) }}%</template>
        </Column>
        <Column field="stock" header="Stock" sortable style="min-width:6rem"></Column>
        <Column field="created_at" header="Date" sortable style="min-width: 10rem">
          <template #body="slotProps">{{ formatDate(slotProps.data.created_at) }}</template>
        </Column>
        <Column field="category_name" header="Category" sortable style="min-width: 10rem"></Column>
        <Column field="inventoryStatus" header="Action" style="min-width: 10rem">
          <template #body="slotProps">
            <Button icon="pi pi-pencil" outlined rounded class="mr-2 mb-1 sm:mb-0" @click="editProduct(slotProps.data)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogs -->
    <Dialog v-model:visible="productDialog" :style="{ width: '90%', maxWidth: '450px' }" header="Product Details" :modal="true">
      <div class="flex flex-col gap-4">
        <div>
          <label class="block font-bold mb-2">Name</label>
          <InputText v-model.trim="product.name" :invalid="submitted && !product.name" fluid autofocus />
          <small v-if="submitted && !product.name" class="text-red-500 text-sm">Name is required.</small>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold mb-2">Prix Vente {{ userProfile ? userProfile.currency_preference : 'N/D' }}</label>
            <InputNumber v-model="product.price" fluid />
          </div>
          <div>
            <label class="block font-bold mb-2">Prix Achat {{ userProfile ? userProfile.currency_preference : 'N/D' }}</label>
            <InputNumber v-model="product.purchase_price" fluid />
          </div>
          <div>
            <label class="block font-bold mb-2">Stock</label>
            <InputNumber v-model="product.stock" integeronly fluid />
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
</style>
