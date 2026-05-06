

<script setup>
 import { fetchCommentDetail, fetchCommentsAPI } from '@/service/Api';
import { onMounted, ref } from 'vue';
 const comments = ref([]);
 const selectedComment = ref(null)



onMounted(() =>{
    setInterval(getComments, 3000)
})

 async function getComments() {
    const response = await fetchCommentsAPI();
    comments.value = response;
    console.log('comment :', comments.value);
    
 }
 const selectComment = async (comment) =>{
    const response = await fetchCommentDetail(comment.id)
    selectedComment.value = response;
 }

function formatDate(date) {
  return new Date(date).toLocaleString();
}
</script>

<template>
  <div class="comments-page">
    
    <!-- LEFT: LIST -->
    <div class="comments-list">
      <h3>💬 Commentaires</h3>

      <div 
        v-for="comment in comments" 
        :key="comment.id"
        class="comment-item"
        :class="{ active: selectedComment?.id === comment.id }"
        @click="selectComment(comment)"
      >
        <div class="avatar">
          {{ comment.email.charAt(0).toUpperCase() }}
        </div>

        <div class="info">
          <div class="email">{{ comment.email }}</div>
          <div class="message-preview">
            {{ comment.message.slice(0, 40) }}...
          </div>
        </div>
         <div class="notification-dot" v-if="!comment.is_read"></div>
      </div>

    </div>

    <!-- RIGHT: DETAIL -->
    <div class="comment-detail" v-if="selectedComment">
      <h3>Détail du commentaire</h3>

      <div class="detail-card">
        <div class="avatar big">
          {{ selectedComment.email.charAt(0).toUpperCase() }}
        </div>

        <h4>{{ selectedComment.email }}</h4>

        <p class="date">
          {{ formatDate(selectedComment.created_by) }}
        </p>

        <div class="message">
          {{ selectedComment.message }}
        </div>
      </div>
    </div>

    <div v-else class="no-selection">
      Sélectionne un commentaire  <i class="pi pi-comments"></i>
    </div>

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
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}
.notification-dot {
  width: 10px;
  height: 10px;
  background: #ff3b30;
  border-radius: 50%;
  margin-left: 10px;
}

.comment-item:hover {
  background: #f5f5f5;
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
</style>