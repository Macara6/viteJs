

<script setup>
 import { deleteCommentAPI, fetchCommentDetail, fetchCommentsAPI, replyGmailAPI, replyNoficationAPI } from '@/service/Api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

 const toast = useToast();

 const comments = ref([]);
 const selectedComment = ref(null);
 const deleteDialog = ref(false);
 const seletedDelete = ref(null);
 const loadingChar = ref(null);

  const showReplyBox = ref(false)
  const replyMessage = ref('');
  const sendReply = ref('');
  const loading = ref(false);
  const loadingNot = ref(false);



onMounted(() =>{
    setInterval(getComments, 3000)
})

 async function getComments() {
  try{
    loadingChar.value = true
    const response = await fetchCommentsAPI();
    comments.value = response;

  }catch(error){

  }finally{
    loadingChar.value = false
  }

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

    loadingNot.value = true;

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
    loadingNot.value = false;
  }
}




</script>
<template>

  <div class="min-h-screen bg-slate-100 p-2 sm:p-4">

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">

      <!-- LEFT SIDE -->
      <div
        class="
          col-span-12
          lg:col-span-4
          xl:col-span-3
          h-[400px]
          lg:h-[calc(100vh-32px)]
        "
      >

        <Card
          class="h-full shadow-xl border-0 rounded-3xl overflow-hidden"
        >

          <template #content>

            <!-- HEADER -->
            <div class="flex items-center justify-between mb-5">

              <div>

                <h2 class="text-2xl font-bold text-slate-800">
                  Commentaires
                </h2>

                <p class="text-slate-500 mt-1">
                  Gestion des commentaires
                </p>

              </div>

              <Avatar
                icon="pi pi-comments"
                shape="circle"
                size="large"
                class="bg-blue-100 text-blue-600"
              />

            </div>

            <Divider />
  
            <!-- COMMENTS -->
            <ScrollPanel
              style="height: calc(100vh - 180px)"
            >

              <div class="space-y-3 pr-2">

                <div
                  v-for="comment in comments"
                  :key="comment.id"
                  @click="selectComment(comment)"
                  class="group cursor-pointer transition-all duration-300"
                >

                  <div
                    class="rounded-2xl border p-4 transition-all duration-300"
                    :class="[
                      selectedComment?.id === comment.id
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                    ]"
                  >

                    <div class="flex items-center justify-between gap-3">

                      <!-- LEFT -->
                      <div class="flex items-center gap-3 flex-1 min-w-0">

                        <div class="relative">

                          <div
                            class="
                              w-12
                              h-12
                              rounded-full
                              bg-gradient-to-r
                              from-blue-500
                              to-indigo-500
                              text-white
                              flex
                              items-center
                              justify-center
                              font-bold
                              text-lg
                            "
                          >
                            {{ comment.email.charAt(0).toUpperCase() }}
                          </div>

                          <span
                            v-if="!comment.is_read"
                            class="
                              absolute
                              -top-1
                              -right-1
                              w-3
                              h-3
                              rounded-full
                              bg-red-500
                              border-2
                              border-white
                            "
                          ></span>

                        </div>

                        <div class="flex-1 min-w-0">

                          <div
                            class="font-semibold text-slate-800 truncate"
                          >
                            {{ comment.email }}
                          </div>

                          <div
                            class="
                              text-sm
                              text-slate-500
                              mt-1
                              truncate
                            "
                          >
                            {{ comment.message.slice(0, 45) }}...
                          </div>

                        </div>

                      </div>

                      <!-- RIGHT -->
                      <div class="flex items-center gap-2">

                        <button
                          class="
                            w-9
                            h-9
                            rounded-full
                            bg-red-50
                            hover:bg-red-500
                            text-red-500
                            hover:text-white
                            transition-all
                            duration-300
                            flex
                            items-center
                            justify-center
                          "
                          @click.stop="openDialog(comment)"
                        >
                          <i class="pi pi-trash"></i>
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </ScrollPanel>

          </template>

        </Card>

      </div>

      <!-- RIGHT SIDE -->
      <div
        class="
          col-span-12
          lg:col-span-8
          xl:col-span-9
          h-auto
          lg:h-[calc(100vh-32px)]
        "
      >

        <Card
          class="h-full shadow-xl border-0 rounded-3xl"
        >

          <template #content>

            <div
              v-if="selectedComment"
              class="h-full flex flex-col"
            >

              <!-- HEADER -->
              <div
                class="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-start
                  justify-between
                  gap-4
                "
              >

                <div
                  class="
                    flex
                    flex-col
                    sm:flex-row
                    items-start
                    sm:items-center
                    gap-4
                  "
                >

                  <div
                    class="
                      w-16
                      h-16
                      rounded-full
                      bg-gradient-to-r
                      from-blue-500
                      to-indigo-500
                      text-white
                      flex
                      items-center
                      justify-center
                      text-2xl
                      font-bold
                    "
                  >
                    {{ selectedComment.email.charAt(0).toUpperCase() }}
                  </div>

                  <div>

                    <h1
                      class="
                        text-2xl
                        sm:text-3xl
                        font-bold
                        text-slate-800
                        break-words
                      "
                    >
                      {{ selectedComment.email }}
                    </h1>

                    <p class="text-slate-500 mt-2">
                      {{ formatDate(selectedComment.created_by) }}
                    </p>

                  </div>

                </div>

                <Tag
                  :value="selectedComment.is_answer ? 'Répondu' : 'En attente'"
                  :severity="selectedComment.is_answer ? 'success' : 'warning'"
                  rounded
                />

              </div>

              <Divider />

              <!-- MESSAGE -->
              <div class="mt-4">

                <h2
                  class="text-xl font-semibold text-slate-800 mb-4"
                >
                  Message du client
                </h2>

                <div
                  class="
                    bg-slate-50
                    border
                    border-slate-200
                    rounded-3xl
                    p-4
                    sm:p-6
                    lg:p-8
                    leading-7
                    text-slate-700
                    whitespace-pre-line
                    break-words
                  "
                >
                  {{ selectedComment.message }}
                </div>

              </div>

              <!-- RESPONSE -->
              <div class="mt-8">

                <label
                  class="font-semibold text-slate-700 mb-3 block"
                >
                  Votre réponse
                </label>

                <!-- NOT ANSWERED -->
                <div v-if="!selectedComment.is_answer">

                  <Textarea
                    v-model="replyMessage"
                    rows="6"
                    class="w-full"
                    placeholder="Écrivez votre réponse ici..."
                  />

                  <div
                    class="
                      flex
                      flex-col
                      sm:flex-row
                      gap-3
                      justify-end
                      mt-5
                    "
                  >

                    <!-- EMAIL -->
                    <Button
                      :disabled="loading"
                      severity="secondary"
                      class="px-4 py-3"
                      @click="sendReplyByMail"
                    >

                      <span class="flex items-center gap-2">

                        <i
                          :class="loading
                            ? 'pi pi-spin pi-spinner'
                            : 'pi pi-envelope'"
                        ></i>

                        {{ loading
                          ? 'En cours ...'
                          : 'Envoyer par Email'
                        }}

                      </span>

                    </Button>

                    <!-- LOCAL NOTIFICATION -->
                    <Button
                      :disabled="loadingNot"
                      severity="info"
                      class="px-4 py-3"
                      @click="sendReplyNotification"
                    >

                      <span class="flex items-center gap-2">

                        <i
                          :class="loadingNot
                            ? 'pi pi-spin pi-spinner'
                            : 'pi pi-send'"
                        ></i>

                        {{ loadingNot
                          ? 'En cours ...'
                          : 'Notification locale'
                        }}

                      </span>

                    </Button>

                  </div>

                </div>

                <!-- ANSWERED -->
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

            <!-- EMPTY -->
            <div
              v-else
              class="
                h-full
                flex
                flex-col
                items-center
                justify-center
                text-center
                py-20
              "
            >

              <Avatar
                icon="pi pi-comments"
                size="xlarge"
                shape="circle"
                class="bg-slate-100 text-slate-400 mb-5"
              />

              <h2
                class="text-2xl font-bold text-slate-600"
              >
                Aucun commentaire sélectionné
              </h2>

              <p
                class="text-slate-400 mt-2"
              >
                Sélectionnez un commentaire à gauche
              </p>

            </div>

          </template>

        </Card>

      </div>

    </div>

    <!-- DELETE DIALOG -->
    <Dialog
      v-model:visible="deleteDialog"
      :style="{ width: '350px' }"
      header="Confirmation"
      :modal="true"
    >

      <span>
        Voulez-vous vraiment supprimer ce commentaire ?
      </span>

      <template #footer>

        <Button
          label="Non"
          icon="pi pi-times"
          text
          @click="deleteDialog = false"
        />

        <Button
          label="Oui"
          icon="pi pi-check"
          severity="danger"
          @click="selecteDelelete"
        />

      </template>

    </Dialog>

  </div>

</template>