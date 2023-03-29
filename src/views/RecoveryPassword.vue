<template>
  <div class="global">
    <transition>
      <div class="wrapper-auth">
        <div class="logo">
          <!-- <img src="@/assets/img/logo_x.svg" /> -->
        </div>
        <div class="spacer"></div>
        <div class="title">Restore access to your account</div>
        <div class="description">
          {{
            accept == false
              ? "Enter phone number and confirm the code from the incoming SMS"
              : "Enter new password"
          }}
        </div>
        <div class="input-group">
          <input
            v-if="!accept"
            type="text"
            class="input login-phone"
            @change="changeLoginPhone"
            v-maska="'+7(###)-###-##-##'"
            placeholder="Enter phone number"
          />
          <input
            v-if="accept"
            type="password"
            v-model="login.password"
            class="input"
            placeholder="Password"
          />
        </div>
        <div
          v-if="!accept"
          class="btn-auth disabled"
          @click="sendForm"
          style="margin-bottom: 56px"
        >
          <div class="icon-sync"><div class="sync-bg"></div></div>
          <span>Send SMS</span>
        </div>

        <div
          v-if="accept"
          class="btn-auth disabled"
          @click="sendNewPassword"
          style="margin-bottom: 56px"
        >
          <div class="icon-sync"><div class="sync-bg"></div></div>
          <span>Restore password</span>
        </div>

        <div class="text-link" @click="switchToLogin">Sign in to profile</div>
        <div class="text-link" @click="switchToReg">Create profile</div>

        <div class="spacer"></div>
      </div>
    </transition>
    <div class="popup-pin-sms">
      <div class="popup-bg-filter" @click="closePopupPinSms"></div>
      <div class="popup-content">
        <div class="title" style="margin-bottom: 18px">
          Confirm
          <!-- Новый пин-код -->
        </div>
        <div class="label">
          Confirm. Enter the SMS-code sent to
          <!-- Придумайте пин-код для устройства --><strong>{{
            formatPhone
          }}</strong>
        </div>
        <div class="pin-place">
          <input
            type="number"
            v-model="smsCode[0]"
            @keyup="inputSmsEvent"
            ref="inputSmsCodeRef1"
            placeholder="0"
          />
          <input
            type="number"
            v-model="smsCode[1]"
            @keyup="inputSmsEvent"
            ref="inputSmsCodeRef2"
            placeholder="0"
          />
          <input
            type="number"
            v-model="smsCode[2]"
            @keyup="inputSmsEvent"
            ref="inputSmsCodeRef3"
            placeholder="0"
          />
          <input
            type="number"
            v-model="smsCode[3]"
            @keyup="inputSmsEvent"
            ref="inputSmsCodeRef4"
            placeholder="0"
          />
        </div>
        <div class="message-status" v-if="messageSmsResult">
          {{ messageSmsResult }}
        </div>
        <div class="btn-confirm mini" @click="confirm()">Send</div>
        <div class="btn-cancel" @click="closePopupPinSms">Cancel</div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  computed,
  defineComponent,
  reactive,
  ref,
  watchEffect,
  nextTick,
} from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";

export default defineComponent({
  name: "RecoveryPassword",
  setup() {
    const store = useStore();
    const router = useRouter();

    const login = reactive({
      phone: null,
      password: null,
    });

    const changeLoginPhone = () => {
      if (document.querySelectorAll(".login-phone")[0]) {
        let loginPhone = document
          .querySelectorAll(".login-phone")[0]
          .getAttribute("data-mask-raw-value");
        login.phone = "+7" + loginPhone;
      }
    };
    const code = ref();
    const sendForm = async () => {
      let { data } = await axios.post(
        store.state.server + "/api/verified/send",
        { phone: login.phone }
      );
      if (data) {
        code.value = data;
        openPopupPinSms();
      }
    };
    const openPopupPinSms = () => {
      let popupElement = document.querySelectorAll(".popup-pin-sms");
      popupElement[0].style.display = "flex";
      setTimeout(() => popupElement[0].classList.add("active"), 1);
    };
    const switchToReg = () => router.push({ name: "Reg" });
    const switchToLogin = () => router.push({ name: "Auth" });
    const inputSmsCodeRef1 = ref(null);
    const inputSmsCodeRef2 = ref(null);
    const inputSmsCodeRef3 = ref(null);
    const inputSmsCodeRef4 = ref(null);

    const inputSmsEvent = (event) => {
      if (event.keyCode != 8) {
        if (smsCode[0].toString().length > 0)
          nextTick(() => {
            console.log("nexttick");
            inputSmsCodeRef2.value.focus();
          });
        if (smsCode[1].toString().length > 0)
          nextTick(() => {
            inputSmsCodeRef3.value.focus();
          });
        if (smsCode[2].toString().length > 0)
          nextTick(() => {
            inputSmsCodeRef4.value.focus();
          });
      } else {
        if (smsCode[3].toString().length == 0)
          nextTick(() => {
            inputSmsCodeRef3.value.focus();
          });
        if (smsCode[2].toString().length == 0)
          nextTick(() => {
            inputSmsCodeRef2.value.focus();
          });
        if (smsCode[1].toString().length == 0)
          nextTick(() => {
            inputSmsCodeRef1.value.focus();
          });
      }
    };
    const smsCode = reactive({
      0: "",
      1: "",
      2: "",
      3: "",
    });
    const confirm = async () => {
      let codeconfirm = code.value.result;
      let codeuser = [smsCode[0], smsCode[1], smsCode[2], smsCode[3]].join("");
      if (codeuser == codeconfirm) {
        console.log("confirm");
        accept.value = true;
        closePopupPinSms();
      } else {
        console.log("dislike code bro");
      }
    };
    const closePopupPinSms = () => {
      let popupElement = document.querySelectorAll(".popup-pin-sms");
      popupElement[0].classList.remove("active");
      setTimeout(() => (popupElement[0].style.display = "none"), 500);
    };
    const sendNewPassword = async () => {
      await axios
        .post(store.state.server + "/api/verified/newpassword", {
          phone: login.phone,
          password: login.password,
        })
        .then((res) => {
          console.log(res.data.result);
          if (res.data.result == true) router.push({ name: "Auth" });
          else alert("Something went wrong contact support");
        });
    };
    const accept = ref(false);
    return {
      login,
      accept,
      sendNewPassword,
      code,
      smsCode,
      confirm,
      changeLoginPhone,
      inputSmsEvent,

      inputSmsCodeRef1,
      inputSmsCodeRef2,
      inputSmsCodeRef3,
      inputSmsCodeRef4,

      sendForm,

      switchToReg,
      switchToLogin,
    };
  },
});
</script>

<style lang="scss">
/* SLIDE FADE ANIMATEION */
.slide-fade-enter-active {
  transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-leave-active {
  transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  //transform: translateY(10px);
  opacity: 0;
}
</style>
