

<script setup>
 import { deleteCommentAPI, fetchCommentDetail, fetchCommentsAPI, replyGmailAPI, replyNoficationAPI } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

 const toast = useToast();

 const comments = ref([]);
 const selectedComment = ref(null);
 const deleteDialog = ref(false);
 const seletedDelete = ref(null);

  const showReplyBox = ref(false)
  const replyMessage = ref('');
  const sendReply = ref('');
  const loading = ref(false);



onMounted(() =>{
    setInterval(getComments, 3000)
})

 async function getComments() {
    const response = await fetchCommentsAPI();
    comments.value = response;
 }


 const selectComment = async (comment) =>{
    const response = await fetchCommentDetail(comment.id)
    selectedComment.value = response;
 }


const selecteDelelete = async () =>{
 
  try{
    const response  = await deleteCommentAPI(seletedDelete.value)
    comments.value = comments.value.filter(
      item => item.id !== seletedDelete.value
    )
    
    toast.add({ severity:'success', summary:'Succès', detail:`${response.message}`, life:3000 });
    deleteDialog.value = false

  }catch(error){
    console.error(error);
  }

}

 function openDialog(comment){
    seletedDelete.value = comment.id
    deleteDialog.value = true;
 }


function formatDate(date) {
  return new Date(date).toLocaleString();
}

const sendReplyByMail = async () =>{

  if(!replyMessage.value){
    toast.add({ severity:'error', summary:'Erreur', detail:`Veuillez écrire une réponse`, life:3000 });
    return;
  }

  try{
    loading.value= true;

    const data = {
      email: selectedComment.value.email,
      message: replyMessage.value,
      comment_id:selectedComment.value.id
     }
     
    console.log('data :', data);

    const response = await replyGmailAPI(data);
 
    if(response.message){
       toast.add({ severity:'success', summary:'Succès', detail:`${response.message}`, life:3000 });
    }
    replyMessage.value ="";

  }catch(error){
    console.error('erro repy to gmail');
  }finally{
    loading.value = false;
  }

}

const sendReplyNotification = async () => {

  if(!replyMessage.value){

     toast.add({
       severity:'error',
       summary:'Erreur',
       detail:'Veuillez écrire une réponse',
       life:3000
     });

     return;
  }

  try{

    loading.value = true;

    const data = {
      email: selectedComment.value.email,
      message: replyMessage.value,
      comment_id: selectedComment.value.id
    }

    const response = await replyNoficationAPI(data);

    console.log('response :');

    toast.add({
      severity:'success',
      summary:'Succès',
      detail: response.message,
      life:3000
    });
    
    replyMessage.value = '';

    selectedComment.value.is_answer = true;

  }catch(error){
      toast.add({
       severity:'error',
       summary:'Erreur',
       detail:`${error.response.data.error}`,
       life:3000
     });
    console.error('error reply notification :', error);

  }finally{
    loading.value = false;
  }
}




</script>

<template>
  <div>
  <div class="comments-page">
    
    <!-- LEFT: LIST -->
    <div class="comments-list">
      <h3> Commentaires</h3>

        <div 
          v-for="comment in comments" 
          :key="comment.id"
          class="comment-item"
          :class="{ active: selectedComment?.id === comment.id }"
          @click="selectComment(comment)"
        >
          
          <div class="left-section">
            
            <div class="avatar">
              {{ comment.email.charAt(0).toUpperCase() }}
            </div>

            <div class="info">
              <div class="email">{{ comment.email }}</div>

              <div class="message-preview">
                {{ comment.message.slice(0, 40) }}...
              </div>
            </div>

          </div>

          <div class="right-section">

            <div 
              class="notification-dot" 
              v-if="!comment.is_read">
            </div>

            <!-- bouton supprimer -->
            <button
              class="delete-btn"
              @click.stop="openDialog(comment)"
            >
              <i class="pi pi-trash"></i>
            </button>

          </div>

        </div>
    </div>

  <!-- RIGHT: DETAIL -->
  <div
    v-if="selectedComment"
    class="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
  >

    <!-- HEADER -->
    <div class="flex items-center gap-4 mb-6">

      <div
        class="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold"
      >
        {{ selectedComment.email.charAt(0).toUpperCase() }}
      </div>

      <div>
        <h3 class="text-xl font-semibold text-gray-800">
          {{ selectedComment.email }}
        </h3>

        <p class="text-sm text-gray-500">
          {{ formatDate(selectedComment.created_by) }}
        </p>
      </div>

    </div>

    <!-- MESSAGE CLIENT -->
    <div
      class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 leading-relaxed mb-6"
    >
      {{ selectedComment.message }}
    </div>

    <!-- REPONSE -->
    <div class="space-y-4">

      <label class="font-medium text-gray-700">
        Votre réponse
      </label>
<!-- SI LE MESSAGE N'EST PAS ENCORE REPONDU -->
    <div v-if="!selectedComment.is_answer">

      <Textarea
        v-model="replyMessage"
        rows="6"
        class="w-full"
        placeholder="Écrivez votre réponse ici..."
      />

  <!-- ACTION BUTTONS -->
        <div class="flex flex-wrap gap-3 justify-end mt-4">

          <!-- ENVOYER PAR MAIL -->
          <Button
            :disabled="loading"
            severity="secondary"
            class="px-4 py-2"
            @click="sendReplyByMail"
          >
            <span class="flex items-center gap-2">
              <i
                :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-envelope'"
              ></i>

              {{ loading ? 'En cours ...' : 'Envoyer par Email' }}
            </span>
          </Button>

          <Button
           :disabled="loading"
           severity="info" 
           class="px-4 py-2"
           @click="sendReplyNotification"
          >
          <span class="flex items-center gap-2">
              <i
                :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-send'"
              ></i>

              {{ loading ? 'En cours ...' : 'Notification locale' }}
            </span>

          </Button>

        </div>
      </div>

      <!-- SI LE MESSAGE EST DEJA REPONDU -->
      <div
        v-else
        class="mt-4 flex justify-end"
      >
        <Tag
          value="Déjà répondu"
          severity="success"
          icon="pi pi-check-circle"
          class="text-sm px-4 py-2"
        />
      </div>

    </div>
  </div>
  

    <div v-else class="no-selection">
      Sélectionne un commentaire  <i class="pi pi-comments"></i>
    </div>

  </div>
      <Dialog v-model:visible="deleteDialog" :style="{ width: '350px' }" header="Confirmation" :modal="true">
        <span>Voulez-vous vraiment supprimer ce commentaire ?</span>
        <template #footer>
            <Button label="Non" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Oui" icon="pi pi-check" severity="danger" @click="selecteDelelete" />
        </template>
    </Dialog>

  </div>

</template>

<style scoped>

.comments-page {
  display: flex;
  height: 90vh;
  gap: 20px;
}

/* LEFT PANEL */
.comments-list {
  width: 35%;
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  overflow-y: auto;
}

.comment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 12px;
  transition: 0.2s;
  cursor: pointer;
}

/* notification */
.notification-dot {
  width: 10px;
  height: 10px;
  background: red;
  border-radius: 50%;
}

.comment-item:hover {
  background: #f7f7f7;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}
.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* bouton supprimer */
.delete-btn {
  border: none;
  background: #ffe5e5;
  color: #ff3b30;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.2s;
}
.delete-btn:hover {
  background: #ff3b30;
  color: white;
  transform: scale(1.05);
}

.comment-item.active {
  background: #e8f5e9;
}

/* RIGHT PANEL */
.comment-detail {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: gray;
}

/* AVATAR */
.avatar {
  width: 40px;
  height: 40px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.avatar.big {
  width: 70px;
  height: 70px;
  font-size: 24px;
  margin-bottom: 10px;
}

/* TEXT */
.email {
  font-weight: bold;
}

.message-preview {
  font-size: 13px;
  color: gray;
}

.date {
  font-size: 12px;
  color: gray;
}

.message {
  margin-top: 15px;
  line-height: 1.6;
}


/*  section pour repondre au commentaire*/

.actions{
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.gmail-btn,
.app-btn{
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: white;
}

.gmail-btn{
  background: #ea4335;
}

.app-btn{
  background: #2563eb;
}

.reply-box{
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-box textarea{
  min-height: 120px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #ccc;
}

.reply-box button{
  align-self: flex-end;
  background: #16a34a;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

</style>