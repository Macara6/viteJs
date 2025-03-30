
import axios from "axios";
const API_BASE = 'http://127.0.0.1:8000/';



export async function login(usernam, password) {
    const LOGIN_URL = `${API_BASE}login/`;
    try {
        const response = await axios.post(LOGIN_URL, {
            username: usernam,
            password: password
        });
        const { id, username, email, token, refresh } = response.data;
        localStorage.setItem('token',token);
        localStorage.setItem('refresh_token',refresh);
        localStorage.setItem('id',id);
        localStorage.setItem('username',usernam);
        localStorage.setItem('email',email);

        console.log('token:',token, 'id', id,'username',usernam,'email',email);
        return { id, username, email, token };
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


export async function fetchProduits() {
    const PRODUITS_URL = `${API_BASE}products/`;

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

export async function fetchInvoices(){
    const INVOICE_URL = `${API_BASE}invoicesView/`;

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

