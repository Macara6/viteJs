
import axios from "axios";
const API_BASE = 'https://pos.bilatech.org/';


export async function login(usernam, password) {
    const LOGIN_URL = `${API_BASE}login/`;
    try {
        const response = await axios.post(LOGIN_URL, {
            username: usernam,
            password: password
        });
        const { id, username, email, token, refresh , is_superuser, status} = response.data;
        localStorage.setItem('token',token);
        localStorage.setItem('refresh_token',refresh);
        localStorage.setItem('id',id);
        localStorage.setItem('username',usernam);
        localStorage.setItem('email',email);
        
        localStorage.setItem('is_superuser', is_superuser);
        localStorage.setItem('status', status)

        return { id, username, email, token ,is_superuser, status};

    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

// fonction pour actualiser le token
export async function refreshToken(){
    const REFRESH_TOKEN_URL = `${API_BASE}refresh-token/`;
    const refreshToken = localStorage.getItem('refresh_token');

    if(!refreshToken){
        console.log('No refresh token found. Please log in again.');
        throw new Error('No refresh token found. Please log in again.');

    }
    try {
        const response = await axios.post(REFRESH_TOKEN_URL, {
            refresh:refreshToken,
        });
        const { token } = response.data;
        localStorage.setItem('token',token);
        console.log('Token refreshed:', token);
        return token;

    } catch (error){
        console.error('Error refreshing token', error.response ? error.response.data : error);
        throw error;

    }

}
// fonction pour verifier le code secrete
export async function verifySecretKey(key){
    const VERIFY_KEY_URL =`${API_BASE}secret_key/verify/`;
    try{
        const response = await axios.post(VERIFY_KEY_URL, 
          {key},
          {
            headers:{
                'Authorization' : `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        return response.data;
    } catch (error) {
        console.error('Error verifying secret key:', error.response?.data || error);
        throw error;
    }
}

export async function deleteSecretKey(data){
    const DELETE_KEY_URL = `${API_BASE}secret_key/`;
    try{
        const response = await axios.delete(DELETE_KEY_URL, {
            data, 
            headers:{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error("error lors de la suppression du code", error);
    }
}
// fonction pourverifier le status du code secret 
export async function checkSecretKeyStatus() {
    const STATUS_URL = `${API_BASE}secret_key/status/`;

    try {
        const response = await axios.get(STATUS_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data; // { has_key: true } ou { has_key: false }
    } catch (error) {
        console.error('Error checking secret key status:', error.response?.data || error);
        throw error;
    }
}

// fonction pour vrifier le status de l'abonnement
export async function checkSubsrictionStatus(){
    const  SUB_STATUS_URL = `${API_BASE}subscription/status/`;
    try{
        const response = await axios.get(SUB_STATUS_URL, {
            headers :{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error("error lors de la verification du status de l'abonnement", error)
    }
}

export async function createOrUpdateSecretKey(secretData){
    const SECRET_KEY_URL = `${API_BASE}secret_key/`; 
    try{
        const response = await axios.post(SECRET_KEY_URL, secretData, {
            headers :{
                 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
          console.error('Error checking secret key status:', error.response?.data || error);
        throw error;
    }
}
//fonction pour changer le mot de passe 
export async function changePassword(oldPassword, newPassword){
    const CHANGE_PASSWORD_URL = `${API_BASE}change-password/`;
    try{
        const response = await axios.put(CHANGE_PASSWORD_URL,{old_password: oldPassword,  new_password: newPassword,}, {
            headers:{
                'Authorization' :`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error("Erreur lors du changement de mot de passe :", error);
        throw error.response?.data || { detail: "Erreur inconnue" };
    }
}

// function demander le code pour réinitialisation
export async function requestPasswordReset(email){
    const URL_REQUEST = `${API_BASE}password-reset-request/`;
    try{
        const response = await axios.post(URL_REQUEST, {email});
        return response.data;
    }catch(error){
        console.error('error lors de la demande de la reinitialisation', error.response?.data || error);
        throw error;
    }
}
// ffonction confirme le mot de passe avec le token
export async function confirmPasswordReset(token, newPassword){
    const URL_CONFIRM = `${API_BASE}password-reset-confirm/`;
    try{
        const response = await axios.post(URL_CONFIRM,{
            token:token,
            new_password:newPassword
        });
        return response.data;
    }catch(error){
        console.log('error lors de la confirmation du mot de passe ', error.response?.data || error);
        throw error;
    }
}

// fonction pour afficher les categorys
export async function fetchCategorys(){
    const CATEGORY_URL = `${API_BASE}category/`;

    try{
        const response =  await axios.get(CATEGORY_URL);
        return await response.data.results;
    }catch(error){
        console.error('errer fetching produits:',error);
        throw error; 
    }
}

export async function getCategoryByUser(userID) {
    const LIMIT = 200;  // charge plus vite
    let nextUrl = `${API_BASE}category/by-user/${userID}/?limit=${LIMIT}`;
    let allCategories = [];

    try {
        while (nextUrl) {
            const response = await axios.get(nextUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = response.data;

            // Ajoute les résultats obtenus
            allCategories.push(...data.results);

            // Passage à la page suivante
            nextUrl = data.next;
        }

        return allCategories; // liste complète
    } catch (error) {
        console.error("Erreur fetching categories :", error);
        throw error;
    }
}



export async function createCategorie(categoryData) {
    const CATEGORY_URL_CREATE = `${API_BASE}category/create/`;
    try{
        const response = await axios.post(CATEGORY_URL_CREATE,categoryData,{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error('erreur lors de la creation du categorie',error);
        throw error;
    }
    
}

export async function deleteCategorie(categoryId) {
    const DELETE_CATEGORY_URL = `${API_BASE}category/delete/${categoryId}/`;
    try {
        const response = await axios.delete(DELETE_CATEGORY_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie', error);
        throw error;
    }
}



// fonction pour creer un nouveau produit 
export async function  createProductAPI(productData){
    const CREATE_PRODUCT_URL= `${API_BASE}productCreate/`;
    try{
        const response = await axios.post(CREATE_PRODUCT_URL,productData,{
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
      });
  
      return response.data;

    }catch(error){
       ( console.error('Error creating product', error.response ? error.response.data : error))
    }
}
// function pour creer le produit du depôt 
export async function  createDepotProduit(productData) {
    const CREATE_DEPOT_PRODUCT = `${API_BASE}depotProduit/`;
    try{
        const response = await axios.post(CREATE_DEPOT_PRODUCT, productData,{
            headers:{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error('error de la creeation du produit depot')
    }  
}

// api pour les produits 
export async function fetchProduits(userId) {
    const LIMIT = 200;  // mettre 200 → 5× plus rapide
    let offset = 0;

    let allProducts = [];
    let nextUrl = `${API_BASE}products/?user_created=${userId}&limit=${LIMIT}&offset=${offset}`;

    while (nextUrl) {
        const response = await axios.get(nextUrl, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            }
        });

        const data = response.data;
        allProducts.push(...data.results);

        nextUrl = data.next;  // API renvoie directement l’URL page suivante
    }

    return allProducts;
}


export async function updateProductAPI(productId, productData){
    const UPDATE_PRODUCT_URL = `${API_BASE}products/${productId}/`;
    try {
        const response = await axios.put(UPDATE_PRODUCT_URL, productData,{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        
        return response.data;
    } catch (error){
        console.log('Error updating product', error.response ? error.response.data : error);
        throw error;
    }
}
// function pour ajouter le stock du produit
export async function addStockAPI(produitId, quantity, motif){
    const ADD_STOCK_URL = `${API_BASE}products/addStock/${produitId}/`;
    try{
        const response = await axios.post(ADD_STOCK_URL, {quantity,motif} ,{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error("error lors de l'ajout du stock",error.response ? error.response.data :error);
    }
}

export async function subtrackStock(productId, quantity, motif){
    const SUBTRACK_URL = `${API_BASE}products/subtractStock/${productId}/`;
    try{
        const response = await axios.post(SUBTRACK_URL, {quantity, motif}, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error("error lors de la soutrie de produit dans le stock", error.response? error.response.data :error);
    }
}

// fetche history stock
export async function fetchStockHistory(userId){
    const STOCK_HISTORY_VIEW = `${API_BASE}stockHistoryViews/?added_by=${userId}`;
    try{
        const response = await axios.get(STOCK_HISTORY_VIEW, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data.results;
    }catch(error){
        console.log("erreur lors de la recuperation de l'hisroeique",error)
    }
}

export async function deleteStockHistory(histoId){
    const DELETE_HISTO_STOCK = `${API_BASE}stockHistory/delete/${histoId}/`;
    try{
        const response = await axios.delete(DELETE_HISTO_STOCK, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.log('erreur lors de la suppression', error);
    }
}


// afficher toutes les factures du parent et ses enfant 
export async function fetchInvoicesAllUsers() {
    const LIMIT = 200; 

    let nextUrl = `${API_BASE}invoicesView/?limit=${LIMIT}`;
    let allInvoices = [];

    try {
        while (nextUrl) {
            const response = await axios.get(nextUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = response.data;
            allInvoices.push(...data.results);
            nextUrl = data.next;
        }
        
    } catch (error) {
        console.error('Error fetching invoices', error);
        throw error;
    }
   return allInvoices;
}
// afficher les utilisateur qui sont de la corbeille 




export async function fetchInvoicesAllChildrent(onlyChildren = true) {
    let INVOICE_URL = `${API_BASE}invoicesView/`;
    if (onlyChildren) {
        INVOICE_URL += '?only_children=true';
    }

    try {
        const response = await axios.get(INVOICE_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching invoices', error);
        throw error;
    }
}
export async function deleteInvoiceAPI(invoiceId){
    const DELETE_INVOICE = `${API_BASE}invoices/delete/${invoiceId}/`;
    try{
        const response = await axios.delete(DELETE_INVOICE ,{
            headers:{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.log('error to deleteting invoice')
        throw error;
    }
}

export async function cancelInvoiceAPI(invoiceId){
    const CANCEL_INVOICE = `${API_BASE}invoice/cancel/${invoiceId}/`;
    try{
        const response = await axios.post(CANCEL_INVOICE,{}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data
    }catch(error){
        console.error('Error canceling invoice:', error.response ? error.response.data : error);
        throw error;
    }
}

export async function fetchChartTotals(baseUserId, date){
    const url_chart = `${API_BASE}invoice-chart/`;
    try{
        const {data} = await axios.get(url_chart, {
         params: { base_user_id: baseUserId, date },
         headers:{
           'Authorization': `Bearer ${localStorage.getItem('token')}`
         }
        });
        return data.totals_by_cashier;
    }catch(error){
         console.error("Erreur lors de la recuperation du totals:", error)
    }
}


export async function deleteProductAPI(productId){
    const DELETE_PRODUCT_URL = `${API_BASE}products/${productId}/`;
    try{
        const response =  await axios.delete(DELETE_PRODUCT_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return response.data;
    }catch (error) {
        console.error('Error deleting product', error.response ? error.response.data : error);
        throw error;
    }
}


export async function fetchUsers(){
    const USER_URL = `${API_BASE}usersView/`;
    try{
        const response = await axios.get(USER_URL);
       
        return await response.data.results;
    }catch (error){
        console.error('error fetching invoices',error);
        throw error;
    }
}
//
export async function getUsersCreatedByMe() {
    const URL_BYMY = `${API_BASE}users/created-by-me/`;
    try{
        const response = await axios.get(URL_BYMY, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data.results;
    }catch(error){
        throw error.response?.data || { detail: "Erreur inattendue lors du chargement des utilisateurs." };
    }
}

export async function getUsersCreatedBy(userId) {
  const URL_USER = `${API_BASE}users-created-by/`;
  try {
    const response = await axios.get(URL_USER, {
      params: { user_id: userId },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs créés :", error)
    return []
  }
}

export async function fetchUserIdsForChart(baseUserId){
    const url = `${API_BASE}user-for-chart/`;
    try{
        const {data} = await axios.get(url, {
        params: { base_user_id: baseUserId },
         headers:{
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        return data.user_ids;
    }catch(error){
        console.error("Erreur lors de la récupération des utilisateurs créés :", error)
        return []
    }
}

// afficher les utilisateur qui sont de la corbeille 
export async function fetchTrashedUser(){
    const LIMIT =200;
    let nextUrl = `${API_BASE}users/trashed/?limit=${LIMIT}`;
    let allUsers = [];

    try{
        while (nextUrl){
         const response = await axios.get(nextUrl, {
            headers :{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
         });
         const data = response.data;
         allUsers.push(...data.results);
         nextUrl = data.next;
        }
        return allUsers;
    }catch(error){
        console.log('error lors de la recuperations des utilisateur dans le corbeille', error);
    }
}
// function pour restaure l'utilisateur 

export async function restoreUser(userId) {
    const url_restore = `${API_BASE}users/restore/${userId}/`;

    try {
        const response = await axios.post(url_restore, {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        return {
            error: false,
            status: response.status,
            data: response.data,
            message: response.data.message
        };

    } catch (error) {
        console.error("Erreur lors de la restauration de l'utilisateur", error.response);

        return {
            error: true,
            status: error.response?.status || 500,
            data: error.response?.data || null
        };
    }
}

// suprression dans la corbeille
export async function deleteUserForCorb(userId){
    const url_delete = `${API_BASE}users/delete-permanent/${userId}/`;
    try{
        const response = await axios.delete(url_delete,{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error("error lors de la suppression de l'utilisateur", error);
    }
}

// fonction detail user
export async function fetchUserById(userId){
    const USER_URL = `${API_BASE}usersView/${userId}/`;
    try{
        const response = await axios.get(USER_URL,{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch (error){
        console.error('error fecthing user:', error)
        throw error
    }
}

// fuonction pour ceer un utilisateur 
export async function createUserAPI(userData){
    const CREATE_USER_URL = `${API_BASE}userCreate/`;
    try{
        const response = await axios.post(CREATE_USER_URL,userData,{
            headers:{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    
        return response.data;

    }catch(error){

        if(error.response){
            return {
                error: true,
                status: error.response.status,
                data: error.response.data
              };
        } else{
            return {
                error: true,
                message: 'Une erreur s’est produite lors de la création de l’utilisateur.'
              };
        }
       
    }
}

export async function updateUser(userId,userData){
    const UPDATE_URL = `${API_BASE}userUpdateView/${userId}/`;
    try{
        const response = await axios.put(UPDATE_URL,userData, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`,
            }
        });
      
        return response;

    } catch(error){
        console.log('Error updating user', error.response?.data || error);
    }
}
// ffoncton pour supprimer l'utilisateur 
export async function deleteUserAPI(userId){
    const DELETE_USER_URL = `${API_BASE}user/delete/${userId}/`;
    try{
        const response = await axios.delete(DELETE_USER_URL, {
            headers:{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    }catch(error){
        console.error('Error deleting product', error.response ? error.response.data : error);
        throw error;
    }
}
// fonction pour creer une facture 

export async function createInvoiceAPI(invoiceData) {
    const CREATE_INVOICE_URL = `${API_BASE}invoices/`;
    try{
        const response = await axios.post(CREATE_INVOICE_URL, invoiceData, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`,
                'Content-Type' : 'application/json'
            }
        });
        return response.data;
    } catch(error){
        console.error('Error creating invoice:', error.response ? error.response.data : error);
        throw error;
    }
}
export async function fetchInvoiceDetail(invoiceId){
    const URL_DeTAIL_INVOICE = `${API_BASE}invoice/detail/?invoice=${invoiceId}`;
    try{
        const response = await axios.get(URL_DeTAIL_INVOICE, {
            headers:{
                 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data.results;
    } catch(error){
        console.error['Error to fetching invoice detail', error]
        throw error;
    }
}

// function pour afficher le profil de l'utilisateur
const profileCache = new Map(); // cache en mémoire

export async function fetchUserProfilById(userId) {
  // ⚡ Retourne depuis le cache si existe
  if (profileCache.has(userId)) {
    return profileCache.get(userId);
  }

  try {
    const { data } = await axios.get(
      `${API_BASE}userProfil/?user=${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const results = Array.isArray(data.results) ? data.results : [];

    profileCache.set(userId, results);

    return results;
  } catch (error) {
    console.error('Error fetching user profile:', error?.response?.data || error);
    throw error;
  }
}




export async function updateUserAPI(userData){
    const UPDATE_USER_API = `${API_BASE}user/update/`;
    try{
        const response = await axios.patch(UPDATE_USER_API, userData, {
            headers:{
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    }catch(error){
        console.log('Error to updating user', error.response?.data || error);
        throw error;
    }
}


export async function updateUserProfile(prodileData){
    const UPATE_PROFILE = `${API_BASE}userProfil/update/`;
    try{
        const response = await axios.put(UPATE_PROFILE, prodileData, {
            headers :{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch(error){
        console.log('error to update user profile');
        throw error;
    }
}

export async function createUserProfl(profileCreateData){
    const CREATE_USER_PROFILE = `${API_BASE}userProfil/create/`;
    try{
        const response = await axios.post(CREATE_USER_PROFILE, profileCreateData,{
            headers :{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
      
        return response.data;
    } catch(error){
        console.error('error de creeation du profile:', error);
        throw error;
    }
}
// fonction pour gerer afficher les abonnements 
export async function fetchSubscription(){
    const SUBSRIPTION_URL =`${API_BASE}listSubsription/`;
    try{
        const response = await axios.get(SUBSRIPTION_URL);
        return  response.data.results;
    }catch(error){
        console.error('errer tetching subscriptions');
        throw error;
    }
}

// function pour affiche l'abonnement selon l'utilisateur 
export async function fetchSubscriptionByUser(subscriptionUser){
    const URL_SUBSCRIOTION = `${API_BASE}subscription/user/${subscriptionUser}/`;
    try{
        const response = await axios.get(URL_SUBSCRIOTION, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch(error){
        console.error('erreur to feching subscription');
        throw error; 
    }
}

// fonction pour creer l'abonnment
export async function createdSubscription(subscriptionData){
    const CREATE_SUBSCRIPTION_URL =  `${API_BASE}createSubscription/`;
     try {
        const response = await axios.post(CREATE_SUBSCRIPTION_URL, subscriptionData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Subscription created:', response.data);
        return response.data
     } catch (error) {
        console.error('Error creating Subcription :', error.response ? error.response.data : error);
        throw error;
     }
    
}
// fonction pour modifer l'abonnement
export async function updateSubscription(userId, subscriptionData){
    const UPDATE_SUBSRIPTION_URL = `${API_BASE}subscription/update/${userId}/`;
    try{
        const response = await axios.put(UPDATE_SUBSRIPTION_URL, subscriptionData , {
            headers : {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
    } catch (error) {
        console.log('Error update subscription :', error.response ? error.response.data : error);
        throw error;
    }
}

// fonvtion  pour afficher l'abonnement pour l'utilisateur 
export async function fecthSubscriptionByUserId(userId){
    const URL = `${API_BASE}subscription/${userId}/`;

     try{
        const response = await axios.get(URL, {
            headers :{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data;
     }catch(error){
        console.log('Error fetching subscription by user', error.response?.data ||error);
        throw error;
     }
}
// fonction pour reativé l'abonnement 
export async function reactivateSubscription(userId){
   const REACTIVATE_URL = `${API_BASE}subscription/reactivate/${userId}/`;

   try{
       const response = await axios.post(REACTIVATE_URL, {}, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
       });
       console.log('Subscription reactivated: ', response.data);
       return response.data;

   }catch(error){
      console.log('Error reativating subscription: ',error.response?.data || error );
   }
}

// functon to fetch to all cashout for all user
export async function fetchCashoutAllUsers() {
  const LIMIT = 200;
  let nextUrl = `${API_BASE}cashouts-all-users/?limit=${LIMIT}`;
  let allCashOuts = [];

  try {
    while (nextUrl) {
      const response = await axios.get(nextUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = response.data;
      allCashOuts.push(...data.results);
      nextUrl = data.next;
    }
  } catch (error) {
    console.error('Error fetching cashouts', error);
  }


  return allCashOuts;
}



export async function fetchCashOut(userId){
    const CASHOUT_URL = `${API_BASE}cashouts/?user=${userId}`;

    try{
        const response = await axios.get(CASHOUT_URL, {
            headers :{
                'Authorization':`Bearer ${localStorage.getItem('token')}`,
            }
        });
        console.log('Caoush Lis', response.data);
        return response.data.results;
    } catch(error){
        console.error('error fecthing user:', error)
        throw error;
    }
}
export async function fetchCashOutDetail(cashoutId){
    const URL = `${API_BASE}cashoutDetail/?cashout=${cashoutId}`;

    try{
        const response = await axios.get(URL, {
            headers: {
                'Authorization' : `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Cashout Detail', response.data);
        return response.data.results;

    }catch(error){
        console.error('Error fetching cashout detail', error.response?.data || error);
        throw error;
    }

}
export async function createCashOutAPI(cashoutData){
    const CREATE_URL = `${API_BASE}cashout/create/`;

    try{
        const response = await axios.post(CREATE_URL, cashoutData, {
            headers :{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Cashout created', response.data);
    } catch(error){
        console.error('Error creating CashOut:', error.response?.data || error);
        throw error;
    }
}

export async function deleteCashout(cashoutId){
    const DELETE_URL = `${API_BASE}cashout/delete/${cashoutId}/`;

    try {
        const response = await axios.delete(DELETE_URL, {
            headers:{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Cashout deletect',response.data);
        return response.data;
    } catch(error){
        console.error('Error deleting CashOut:', error.response?.data || error);
        throw error;
    }
}

// debut des fonctions sur le note d'entré
export async function createEntryNote(entryNoteData){
    const CREATE_ENTRY_NOTE = `${API_BASE}entryNote/create/`;

    try {
        const response = await axios.post(CREATE_ENTRY_NOTE, entryNoteData,{
            headers : {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('EntryNote create', response.data);
    }catch(error){
        console.error('Error creating EntryNote', error.response?.data || error);
        throw error;
    }
}
export async function fetchEntryNoteAllUser() {
    const LIMIT =200;
    let nextUrl = `${API_BASE}EntryNotes-all-users/?limit=${LIMIT}`;
    let allEntrys = [];
    try{
        while(nextUrl){
            const response = await axios.get(nextUrl, {
                headers : {
                   'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = response.data;
            allEntrys.push(...data.results);
            nextUrl = data.next
        }
    }catch(error){
        console.error('Error fetching entry note', error);
    }
    return allEntrys;
}


export async function fechEntryNote(userId){
    const FECHING_ENTRYNOTE = `${API_BASE}entryNote/?user=${userId}`;

    try{
        const response = await axios.get(FECHING_ENTRYNOTE, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('EntryNote liste', response.data);
        return response.data.results;
    }catch(error){
        console.error('error feching user', error)
        throw error;
    }
}

export async function fetchEntryNoteDetail(entryNoteId){
    const URL_DETAIL = `${API_BASE}entryNote/detail/?entrynote=${entryNoteId}`;

    try{
        const response = await axios.get(URL_DETAIL, {
            headers :{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Entry note detail', response.data);
        return response.data.results;
    }catch(error){
        console.error('Error feching EntryNoteDetail',error.response?.data || error);
        
    }
}


export  async function deleteEntryNote(entryNoteId){
    const URL_DELETE_ENTRYNOTE = `${API_BASE}entryNote/delete/${entryNoteId}/`;

    try{
        const response = await axios.delete(URL_DELETE_ENTRYNOTE, {
            headers :{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('EntryNote delete');
        return response.data;
    }catch(error){
        console.error('Error deleting EntryNote', error.response?.data || error);
        throw error;
    }
}
// fin du bloc pour les notes d'entrées