<script setup>

import {
    createProductAPI, deleteProductAPI, fetchCategorys, fetchProduits,
    fetchUserProfilById,
    updateProductAPI, verifySecretKey
} from '@/service/Api';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';




const categorys =  ref([]);

const toast = useToast();
const dt = ref();
const products = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const userProfile = ref(null)
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);

const showSensitiveInfo = ref(false);
const secretKey = ref('');
const secretDialog = ref(false);
const submittedSecret = ref(false);


onMounted(async () => {
     await loadProductsAndCategories();
     await fetchUserProfil();
});


async function fetchUserProfil(){
    const userId = localStorage.getItem('id');
    try{
        const result = await fetchUserProfilById(userId);
        userProfile.value = Array.isArray(result) ? result[0] : result;
        console.log('Profil utilisateur récupéré :', result);
    } catch(error){
        console.error('Erreur lors de la récuperation du profi utilisateur', error);
    }
}

async function verifySecret(){
    submittedSecret.value = true;
    if(!secretKey.value) return
    try{
        const isValid =  await verifySecretKey(secretKey.value);
        if(isValid.valid){
            showSensitiveInfo.value = true;
            secretDialog.value = false;
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Code secret validé', life: 3000 });
        }else{
            toast.add({ severity: 'error', summary: 'Erreur', detail: 'Code secret invalide', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur de vérification', life: 3000 });
    }
}
async function loadProductsAndCategories(){
    const userId = localStorage.getItem('id');
    
    console.log(userId);
    if (!userId) {
        toast.add({ severity: 'warn', summary: 'Utilisateur non identifié', detail: 'Veuillez vous reconnecter.', life: 3000 });
        return;
    }

  try{      
       
        const [fetchedProducts, fetchedCategorys] = await Promise.all([
                fetchProduits(userId), fetchCategorys()
            ]);

            categorys.value = fetchedCategorys;
            products.value = fetchedProducts.map(product =>{
                const category_name =  fetchedCategorys.find(cat => cat.id === product.category)?.name ||'Unknown';
                return {
                    ...product,
                    category_name
                }
            });
            sortProductsByDate();  
    }catch (error){
        
        console.error('There was a problem with the fetch operation:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load products', life: 3000 });
    }
    
}

function refreshPage(){
    products.value = [];
    categorys.value = []
    loadProductsAndCategories();
}

// fonction pour afficher les produits selon la date de creatuion 
function sortProductsByDate(){
    products.value.sort((a,b) => {
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

// fonction pour calculer le taux de dénéfice
function calculateDenfice(prixVente, prixAchat){
    const benefice = (prixVente - prixAchat)*100/prixAchat;
    return parseFloat(benefice.toFixed(2));
}
function formatCurrency(value) {
    if (value) return value.toLocaleString('en-CDF', { style: 'currency', currency: 'CDF' });
    return;
}

function formatDate(value){
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    const date = new Date(value);
    return date.toLocaleString('sv-SE', options).replace(' ',' ');
}


function openNew() {
    product.value = {};
    submitted.value = false;
    productDialog.value = true;
}

function hideDialog() {
    productDialog.value = false;
    submitted.value = false;
}
// fonction pour creer un produits 
async function saveProduct () {
   submitted.value = true;

   if(product.value.name && product.value.price && product.value.purchase_price && product.value.stock && product.value.category){
      try{
        const userCreated = localStorage.getItem('id');
        const productData ={
            ...product.value,
            user_created:userCreated
        };
        if (product.value.id){
            const updateProduct = await updateProductAPI(product.value.id, productData);
            const index = products.value.findIndex(p => p.id == product.value.id);
            if (index !== -1){
                products.value[index] = updateProduct;
            }
            toast.add({severity:'success',summary:'Successful',detail:'Product Udpated',life:3000});

        }else{
            const createdProduct = await createProductAPI(productData);
    
            products.value.push(createdProduct);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
        }
        

        hideDialog();

      }catch(error){
        console.error('Error creating product',error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create product', life: 3000 });   
        }  
   } else {
    console.log('Please fill all required fields');
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill all required fields', life: 3000 });
   }
}

function editProduct(prod) {
    product.value = { ...prod };
    productDialog.value = true;
}



 async function deleteProduct() {
    try {
        await deleteProductAPI(product.value.id);
        products.value = products.value.filter((val) => val.id !== product.value.id);
        deleteProductDialog.value = false;
        product.value = {};
        toast.add({ severity: 'success', summary:'Successful',detail:'Product delect', life:3000});
        
    }catch (error){
        console.error('Error deletin product', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete product', life: 3000 });

    }

}

function confirmDeleteProduct(prod) {
    product.value = prod;
    deleteProductDialog.value = true;
}



function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteProductsDialog.value = true;
}

async function deleteSelectedProducts() {
    try {
        for (const selectedProduct of selectedProducts.value){
            await deleteProductAPI(selectedProduct.id);
        }
        products.value = products.value.filter((val) => !selectedProducts.value.includes(val));
        deleteProductsDialog.value = false;
        selectedProducts.value = null;
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
    } catch (error){
        console.error('Error deleting products', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete products', life: 3000 });
    }
   
}

function formatPrice(price){
    if(price !== null && price !== undefined) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    }
    return price;
}


</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="Nouveau Poduit" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Effacer" icon="pi pi-trash" severity="danger" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                    
                </template>

                <template #end>
                    <Button label="Actualiser" icon ="pi pi-refresh" severity="primary" class="m-2" @click="refreshPage"/>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                    <Button label="Afficher prix d'achat & bénéfice" icon="pi pi-lock" severity="warning" @click="secretDialog = true" />
                </template>
            </Toolbar>

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
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Table Produits</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="id" header="ID" sortable style="min-width: 7rem"></Column>
                <Column field="name" header="Nom poduit" sortable style="min-width: 16rem"></Column>
                
                <Column field="price" header="Prix vente" sortable style="min-width: 9rem">
                    <template #body="slotProps">
                        {{ formatPrice(slotProps.data.price )}}
                    </template>
                </Column>

                <Column v-if="showSensitiveInfo" field="puchase_price" header="Prix achat" sortable style="min-width:9rem">
                    <template #body="slotProps">
                        {{ formatPrice(slotProps.data.purchase_price) }} 
                    </template>
                </Column>
                <Column field="" header="Devise" sortable style="min-width: 2rem">
                    <template #body="slotProps">
                        {{ userProfile? userProfile.currency_preference :'No definie' }} 
                    </template>
                </Column>
                <Column v-if="showSensitiveInfo" field="" header="Bénéfice" sortable style="min-width:6rem">
                    <template #body="slotProps">
                        {{ calculateDenfice(slotProps.data.price,slotProps.data.purchase_price) }} %
                    </template>
                </Column>

                <Column field="stock" header="stock" sortable style="min-width:6rem">
                
                </Column>
                <Column field="created_at" header="Date " sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.created_at) }}
                    </template>
                </Column>
                <Column field="category_name" header="Category" sortable style="min-width: 12rem">
                
                </Column>
                <Column field="inventoryStatus" header="Action" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" />
                        <Button icon="pi pi-trash"  outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template> 
                </Column>
                
            </DataTable>
        </div>

        <Dialog v-model:visible="productDialog" :style="{ width: '450px' }" header="Product Details" :modal="true">
            <div class="flex flex-col gap-6">
            
                <div>
                    <label for="name" class="block font-bold mb-3">Name</label>
                    <InputText id="name" v-model.trim="product.name" required="true" autofocus :invalid="submitted && !product.name" fluid />
                    <small v-if="submitted && !product.name" class="text-red-500">Name is required.</small>
                </div>
               

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="price" class="block font-bold mb-3">Price Vente {{ userProfile? userProfile.currency_preference :'No definie' }} </label>
                        <InputNumber id="price" v-model="product.price" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="puchase_price" class="block font-bold mb-3">Prix Achat {{ userProfile? userProfile.currency_preference :'No definie' }} </label>
                        <InputNumber id="price" v-model="product.purchase_price" fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="stock" class="block font-bold mb-3">Stock</label>
                        <InputNumber id="stock" v-model="product.stock" integeronly fluid />
                    </div>
                    <div class="col-span-6">
                        <label for="category" class="block font-bold mb-3">Category</label>
                        <Select
                        id="category"
                        v-model="product.category"
                        :options="categorys"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select a Category"
                        fluid
                        />
                        
                    </div>

                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveProduct" />
            </template>
        </Dialog>



        <Dialog v-model:visible="deleteProductDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="product"
                    >Are you sure you want to delete <b>{{ product.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteProduct" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteProductsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="product">Are you sure you want to delete the selected products?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteProductsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedProducts" />
            </template>
        </Dialog>
        

        <Dialog v-model:visible="secretDialog" header="Entrer code secret" :modal="true" :closable="false" :style="{ width: '350px' }">
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
