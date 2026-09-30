
<script setup>
import Dialog from 'primevue/dialog'
import InputOtp from 'primevue/inputotp'
import { ref, watch } from 'vue'

// Adapte ce chemin selon ton projet
import { verifySecretKey } from '@/service/Api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },

  title: {
    type: String,
    default: 'Code secret'
  },

  message: {
    type: String,
    default: 'Entrez votre code secret pour continuer.'
  }
})

const emit = defineEmits([
  'update:visible',
  'verified',
  'secret-code',
  'cancel'
])

const code = ref('')
const errorMessage = ref('')
const loading = ref(false)



watch(code, (value) => {
  // Si l'utilisateur recommence à saisir,
  // on enlève l'ancien message
  if (value && errorMessage.value) {
    errorMessage.value = ''
  }
})


watch(code, (value) => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
})


async function verifyCode() {
  if (!code.value || code.value.length < 4) {
    errorMessage.value = 'Veuillez saisir les 4 caractères du code.'
    return
  }

  if (loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await verifySecretKey(code.value)

    console.log('Réponse API secret:', response)

    if (response?.valid === true) {

      emit('verified', true)
      emit('update:visible', false)
      emit('secret-code', code.value)

      code.value = ''

    } else {

      //  Code incorrect
      errorMessage.value = 'Code secret incorrect.'

      console.log(
        'errorMessage value:',
        errorMessage.value
      )

      emit('verified', false)

      // NE PAS faire code.value = ''
      // sinon ton watcher peut effacer le message

    }

  } catch (error) {

    console.error(
      'Erreur lors de la vérification du code secret:',
      error.response?.data || error
    )

    errorMessage.value =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      'Code secret incorrect.'

    emit('verified', false)

  } finally {
    loading.value = false
  }
}


function closeDialog() {
  if (loading.value) {
    return
  }

  code.value = ''
  errorMessage.value = ''

  emit('update:visible', false)
  emit('cancel')

  // Si l'utilisateur annule,
  // on peut également informer le parent
  emit('verified', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :closable="false"
    :closeOnEscape="!loading"
    :draggable="false"
    :showHeader="false"
    :style="{ width: '360px' }"
    :pt="{
      root: { class: '!rounded-[28px] !border-0 !shadow-[0_24px_80px_rgba(0,0,0,0.18)] overflow-hidden' },
      content: { class: '!p-0 !rounded-[28px]' },
      mask: { class: 'backdrop-blur-sm !bg-slate-900/30' },
    }"
  >
    <div class="relative px-8 pt-10 pb-8 bg-white">

      <!-- Fermer (discret) -->
      <button
        type="button"
        class="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full
               text-slate-400 bg-slate-100/80 transition-colors
               hover:bg-slate-200 hover:text-slate-600
               disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="loading"
        aria-label="Fermer"
        @click="closeDialog"
      >
        <i class="pi pi-times text-xs"></i>
      </button>

      <!-- Icône -->
      <div class="flex justify-center mb-6">
        <div
          class="flex items-center justify-center w-16 h-16 rounded-[20px]
                 bg-gradient-to-b from-[#004D4A]/10 to-[#004D4A]/5"
        >
          <i class="pi pi-lock text-2xl text-[#004D4A]"></i>
        </div>
      </div>

      <!-- Titre + message -->
      <div class="text-center mb-8">
        <h2 class="text-xl font-semibold text-slate-900 tracking-tight">
          {{ title }}
        </h2>
        <p class="mt-2 text-sm text-slate-500 leading-relaxed">
          {{ message }}
        </p>
      </div>

      <!-- Code OTP -->
      <div class="flex flex-col items-center">
        <InputOtp
          v-model="code"
          :length="4"
          mask
          integerOnly
          :disabled="loading"
          :pt="{
            root: { class: 'flex gap-3' },
            pcInputText: {
              root: {
                class:
                  '!w-14 !h-16 !text-2xl !font-semibold !text-center !rounded-2xl ' +
                  '!bg-slate-50 !border !border-slate-200 !text-slate-900 ' +
                  'transition-all focus:!bg-white focus:!border-[#004D4A] ' +
                  'focus:!ring-4 focus:!ring-[#004D4A]/10 !shadow-none',
              },
            },
          }"
        />

        <!-- Erreur (hauteur réservée pour éviter le saut de mise en page) -->
        <div class="h-6 mt-4 flex items-center justify-center">
          <transition name="fade">
            <small
              v-if="errorMessage"
              class="flex items-center gap-1.5 text-[13px] font-medium text-rose-500"
            >
              <i class="pi pi-exclamation-circle text-xs"></i>
              {{ errorMessage }}
            </small>
          </transition>
        </div>
      </div>

      <!-- Boutons -->
      <div class="flex flex-col gap-2 mt-4">
        <button
          type="button"
          class="flex items-center justify-center gap-2 w-full py-3.5 rounded-full
                 text-[15px] font-semibold text-white bg-[#004D4A]
                 transition-all duration-200
                 hover:bg-[#00615c] active:scale-[0.98]
                 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#004D4A] disabled:active:scale-100"
          :disabled="code.length < 4 || loading"
          @click="verifyCode"
        >
          <i v-if="loading" class="pi pi-spin pi-spinner text-sm"></i>
          <span>{{ loading ? 'Vérification…' : 'Vérifier' }}</span>
        </button>

        <button
          type="button"
          class="w-full py-3 rounded-full text-[15px] font-medium text-slate-500
                 transition-colors hover:text-slate-800 hover:bg-slate-50
                 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="closeDialog"
        >
          Annuler
        </button>
      </div>

    </div>
  </Dialog>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}
</style>
