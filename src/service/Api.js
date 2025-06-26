
import axios from "axios";
const API_BASE = 'https://api.bilatech.org/';


export async function login(usernam, password) {
    const LOGIN_URL = `${API_BASE}login/`;
    try {
        const response = await axios.post(LOGIN_URL, {
            username: usernam,
            password: password
        });
        const { id, username, email, token, refresh , is_superuser} = response.data;
        localStorage.setItem('token',token);
        localStorage.setItem('refresh_token',refresh);
        localStorage.setItem('id',id);
        localStorage.setItem('username',usernam);
        localStorage.setItem('email',email);
        localStorage.setItem('is_superuser', is_superuser);

        console.log('token:',token, 'id', id,'username',usernam,'email',email);
        return { id, username, email, token ,is_superuser};
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

// fonction pour afficher les categorys
export async function fetchCategorys(){
    const CATEGORY_URL = `${API_BASE}category/`;

    try{
        const response =  await axios.get(CATEGORY_URL);
        return await response.data;
    }catch(error){
        console.error('errer fetching produits:',error);
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
      console.log('Token:', localStorage.getItem('token'));
      console.log('Product created:', response.data);
      return response.data;

    }catch(error){
        console.error('Error creating product', error.response ? error.response.data : error);
    }
}


export async function fetchProduits(userId) {
    const PRODUITS_URL = `${API_BASE}products/?user_created=${userId}`;
    try{
        const response =  await axios.get(PRODUITS_URL);
        
        return await response.data;
    }catch(error){
        console.error('errer fetching produits:',error);
        throw error;
    }

}

export async function updateProductAPI(productId, productData){
    const UPDATE_PRODUCT_URL = `${API_BASE}products/${productId}/`;
    try {
        const response = await axios.put(UPDATE_PRODUCT_URL, productData,{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Product updated', response.data);
        return response.data;
    } catch (error){
        console.log('Error updating product', error.response ? error.response.data : error);
        throw error;
    }
}

export async function fetchInvoices(cashieId){
    const INVOICE_URL = `${API_BASE}invoicesView/?cashier=${cashieId}`;

    try{
        const response = await axios.get(INVOICE_URL);
        return await response.data;
    }catch (error){
        console.error('error fetching invoices',error);
        throw error;
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
        console.log('Proudct deleted:', response.data);
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
        console.log('Fetched users:', response.data)
        return await response.data;
    }catch (error){
        console.error('error fetching invoices',error);
        throw error;
    }
}
// fonction detail user
export async function fetchUserById(userId){
    const USER_URL = `${API_BASE}usersView/${userId}/`;
    console.log('Feching user from:', USER_URL);
    try{
        const response = await axios.get(USER_URL,{
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('API Response:', response.data);
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
        console.log('Token', localStorage.getItem('token'));
        console.log('User created:', response.data);
        return response.data;
    }catch(error){
        console.error('Error creating user',error.response ? error.response.data : error);
        throw error;
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
        console.log('User Update')
        return response;

    } catch(error){
        console.log('Error updating user', error.response?.data || error);
    }
}

// function pour afficher le profil de l'utilisateur
export async function fetchUserProfilById(userId){
    const PROFIL_URL =`${API_BASE}userProfil/?user=${userId}`;
    
    try{
        const response = await axios.get(PROFIL_URL, {
            headers :{
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('User profil fetched :', response.data);
        return response.data;
    }catch(error){
        console.error('Error fetching user profile:', error.response?.data || error);
        throw error;
    }

}

// fonction pour gerer afficher les abonnements 
export async function fetchSubscription(){
    const SUBSRIPTION_URL =`${API_BASE}listSubsription/`;
    try{
        const response = await axios.get(SUBSRIPTION_URL);
        return await response.data;
    }catch(error){
        console.error('errer tetching subscriptions');
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
        console.log('Subscription update: ', response.data);
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
        return response.data
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

export async function fetchCashOut(userId){
    const CASHOUT_URL = `${API_BASE}cashouts/?user=${userId}`;

    try{
        const response = await axios.get(CASHOUT_URL, {
            headers :{
                'Authorization':`Bearer ${localStorage.getItem('token')}`,
            }
        });
        console.log('Caoush Lis', response.data);
        return response.data;
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
        return response.data;

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

export async function fechEntryNote(userId){
    const FECHING_ENTRYNOTE = `${API_BASE}entryNote/?user=${userId}`;

    try{
        const response = await axios.get(FECHING_ENTRYNOTE, {
            headers:{
                'Authorization':`Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('EntryNote liste', response.data);
        return response.data;
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
        return response.data;
    }catch(error){
        console.error('Error feching EntryNoteDetail',error.response?.data || error);
    }
}

export  async function deleteEntryNote(entryNoteId){
    const URL_DELETE_ENTRYNOTE = `${API_BASE}entryNote/delete/${entryNoteId}`;

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