<script setup>
import { fetchSubscriptionByEmail, paySubscription } from "@/service/Api"
import { useToast } from 'primevue/usetoast'
import { computed, ref } from "vue"
const toast = useToast()
const step = ref(1)
const email = ref("")
const subscription = ref(null)
const paymentMethod = ref(null)
const loading = ref(false)
const phone = ref("")

const cardNumber = ref("")
const cardName = ref("")
const cardExpiry = ref("")
const cardCvv = ref("")

const errorMessage = ref("");
const successMessage = ref("");

const paymentLoading = ref(false)

const isCardPayment = computed(()=>{
  return paymentMethod.value === "visa"
})

const getSubscription = async () => {

  if(!email.value){
    errorMessage.value = "Veuillez entrer votre email"
    return
  }

  try{
    loading.value = true
    const response = await fetchSubscriptionByEmail(email.value)
    subscription.value = response
    errorMessage.value ="";
    step.value = 2

  }catch(error){
    errorMessage.value = "Utilisateur non trouvé"
  }finally{
    loading.value = false
  }
}

const choosePayment = (method)=>{
  paymentMethod.value = method
}

const confirmPayment = async ()=>{

  if(!paymentMethod.value){
    errorMessage.value = "Choisissez un moyen de paiement"
    return
  }

  try{
     paymentLoading.value = true;

     const data = {
      phone: phone.value,
      amount: subscription.value.amount,
      provider: paymentMethod.value,
      email:email.value
    }
    const response = await paySubscription(data);
    
    console.log("Réponse paiement :", response)
    successMessage.value = "Demande envoyée. Confirmez sur votre téléphone."
   
  }catch(error){
    console.log(error)
    errorMessage.value = "Paiement échoué"
    alert("Erreur paiement")
  }finally{
     
     paymentLoading.value = false
  }

  
}
</script>
<template>

<div class="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden text-gray-200">

<!-- HALOS -->

<div class="absolute -top-32 -left-32 w-96 h-96 bg-[#7BB661]/30 rounded-full blur-3xl"></div>
<div class="absolute bottom-0 right-0 w-80 h-80 bg-[#F9A825]/20 rounded-full blur-3xl"></div>

<div class="relative w-full max-w-xl bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700 p-8">

<!-- TITLE -->

<div class="text-center mb-6">

<h1 class="text-3xl font-extrabold bg-gradient-to-r from-[#7BB661] via-[#004D4A] to-[#F9A825] bg-clip-text text-transparent">
Bilatech26
</h1>

<p class="text-gray-400">
Renouvellement abonnement
</p>
<!-- SUCCESS MESSAGE -->
<div v-if="successMessage" 
class="mt-4 p-3 rounded-lg bg-green-500/20 border border-green-500 text-green-400 text-sm">
{{ successMessage }}
</div>

<!-- ERROR MESSAGE -->
<div v-if="errorMessage" 
class="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-400 text-sm">
{{ errorMessage }}
</div>


</div>

<!-- PROGRESS -->

<div class="mb-8">
<div class="h-2 bg-gray-700 rounded-full overflow-hidden">
<div
class="h-full bg-gradient-to-r from-[#7BB661] to-[#004D4A] transition-all duration-500"
:style="{ width: step*33 + '%' }">
</div>
</div>
</div>

<div class="flex justify-between mb-8 text-xs">
<span :class="step>=1?'text-green-400':'text-gray-500'">Email</span>
<span :class="step>=2?'text-green-400':'text-gray-500'">Abonnement</span>
<span :class="step>=3?'text-green-400':'text-gray-500'">Paiement</span>
</div>

<!-- STEP 1 -->

<div v-if="step===1" class="space-y-4">

<input
    v-model="email"
    type="email"
    placeholder="Adresse email"
    class="input"
    />

<button class="btn-primary w-full" @click="getSubscription">

<span v-if="loading">Chargement...</span>
<span v-else>Vérifier abonnement</span>

</button>

</div>

<!-- STEP 2 -->

<div v-if="step===2 && subscription" class="space-y-4">

<div class="bg-gray-900 border border-gray-700 p-4 rounded-xl space-y-2 text-sm">

<p>
<b class="text-gray-400">Plan :</b>
<span class="text-[#7BB661] font-semibold">
{{ subscription.subscription_type }}
</span>
</p>

<p>
<b class="text-gray-400">Montant :</b>
$ {{ subscription.amount }}
</p>

<p>
<b class="text-gray-400">Expiration :</b>
{{ subscription.end_date }}
</p>

</div>

<div class="flex gap-3">

<button class="btn-secondary w-1/2" @click="step=1">
← Retour
</button>

<button class="btn-primary w-1/2" @click="step=3">
Continuer
</button>

</div>

</div>

<!-- STEP 3 PAYMENT -->

<div v-if="step===3" class="space-y-6">

<h3 class="text-center text-sm text-gray-400">
Choisissez un moyen de paiement
</h3>

<!-- PAYMENT METHODS -->

<div class="grid grid-cols-2 gap-4">

<button
@click="choosePayment('visa')"
:class="paymentMethod==='visa'?'payment active':'payment'"
>

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Visa_Inc._logo_%281999%E2%80%932005%29.svg/1920px-Visa_Inc._logo_%281999%E2%80%932005%29.svg.png?_=20161007021834" class="h-8 mx-auto">

<p class="text-xs mt-2">Carte bancaire</p>

</button>

<button
@click="choosePayment('mpesa')"
:class="paymentMethod==='mpesa'?'payment active':'payment'"
>

<img src="https://upload.wikimedia.org/wikipedia/commons/0/03/M-pesa-logo.png?_=20190406230949" class="h-8 mx-auto">

<p class="text-xs mt-2">M-Pesa</p>

</button>

<button
@click="choosePayment('airtel')"
:class="paymentMethod==='airtel'?'payment active':'payment'"
>

<img src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Airtel_logo-01.png?_=20220907143534" class="h-8 mx-auto">

<p class="text-xs mt-2">Airtel Money</p>

</button>

<button
@click="choosePayment('orange')"
:class="paymentMethod==='orange'?'payment active':'payment'"
>

<img src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg" class="h-8 mx-auto">

<p class="text-xs mt-2">Orange Money</p>

</button>

</div>

<!-- MOBILE MONEY FORM -->

<div v-if="['mpesa','airtel','orange'].includes(paymentMethod)" class="space-y-3">

<input
v-model="phone"
placeholder="Numéro téléphone (243...)"
class="input"
/>

</div>

<!-- CARD FORM -->

<div v-if="paymentMethod==='visa'" class="space-y-3">

<input
placeholder="Nom sur la carte"
class="input"
/>

<input
placeholder="Numéro de carte"
class="input"
/>

<div class="grid grid-cols-2 gap-3">

<input
placeholder="MM/YY"
class="input"
/>

<input
placeholder="CVV"
class="input"
/>

</div>

</div>

<!-- PAY BUTTON -->

<button
class="btn-primary w-full"
@click="confirmPayment"
:disabled="paymentLoading"
>

<span v-if="paymentLoading">
Traitement du paiement...
</span>

<span v-else>
Payer {{ subscription?.amount }} $
</span>

</button>

</div>

</div>
</div>

</template>

<style scoped>

.input{
width:100%;
padding:12px;
border-radius:10px;
background:#020617;
border:1px solid #374151;
color:white
}

.btn-primary{
padding:12px;
border-radius:10px;
font-weight:bold;
background:linear-gradient(to right,#7BB661,#004D4A);
color:white
}

.btn-secondary{
padding:12px;
border-radius:10px;
font-weight:bold;
background:#1f2937;
color:#e5e7eb
}

.payment{
padding:12px;
border-radius:10px;
background:#020617;
border:1px solid #374151;
cursor:pointer;
transition:0.3s
}

.payment:hover{
border-color:#7BB661
}

.payment.active{
border-color:#7BB661;
background:rgba(123,182,97,0.1)
}

</style>