

import { ref } from "vue";

const alertMessage = ref(null)
const alertType = ref("warning")

export function useGlobalAlert(){

    function showAlert(message, type ="warning"){
        alertMessage.value =message;
        alertType.value =type;
    }
    function clearAlert(){
       alertMessage.value = null
    }
    return {
        alertMessage,
        alertType,
        showAlert,
        clearAlert,
    }
}
