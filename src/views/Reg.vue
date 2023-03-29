<template>
  <div class="global">
    <transition>
      <div class="wrapper-auth">
        <div class="logo">
          <!-- <img src="@/assets/img/logo_x.svg" /> -->
          </div>
        <div class="spacer"></div>
        <div class="title">Create profile</div>
        <div class="description">
          All fields must be filled out to complete the registration process
        </div>
        <div class="input-group">
          <input
            type="text"
            class="input"
            v-model="reg.name"
            placeholder="Enter your name"
          />
          <input
            type="text"
            class="input"
            v-model="reg.email"
            placeholder="Enter your e-mail"
          />
          <div class="input-block">
            <input
              type="text"
              class="input reg-phone"
              @keyup="changeRegPhone"
              v-maska="'+7(###)-###-##-##'"
              placeholder="Phone number"
            />
            <transition name="fade" mode="out-in">
              <div
                class="send-code"
                v-if="viewSendBlock && !numberConfirmed"
                @click="sendSmsCode"
              >
                Confirm
              </div>
            </transition>
          </div>
          <input
            type="password"
            v-model="reg.password"
            class="input"
            placeholder="Password"
          />
        </div>
        <div class="message-error">{{ messageResult }}</div>
        <div class="btn-auth" :class="deviceRegClass" @click="deviceReg">
          <div class="icon-sync"><div class="sync-bg"></div></div>
          <span>Create profile</span>
        </div>

        <div class="rule">
          Pressing the button " sign in profile " - you agree with
          <a href="#">privacy policy</a> and
          <a href="#">terms of service use</a> and confirm that you are 18 years
          old or older.
        </div>

        <div class="text-link" @click="switchToLogin">Sign in to profile</div>

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
        <div
          class="btn-confirm mini"
          :class="waitTimer == 0 ? 'active' : ''"
          @click="sendSmsCode"
        >
          {{ waitTimer > 0 ? `Resend in ${waitTimer} seconds.` : "Resend SMS" }}
        </div>
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
  toRaw,
  onBeforeMount,
  watchEffect,
  nextTick,
} from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";
import Cookies from "js-cookie";

export default defineComponent({
  name: "Reg",
  setup() {
    const store = useStore();
    const router = useRouter();

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // ! Окно смс кода
    const openPopupPinSms = () => {
      store.state.openPopupPinSms = true;
      if (
        statusPopupPinSms.value &&
        document.querySelectorAll(".popup-pin-sms")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(".popup-pin-sms");
        popupElement[0].style.display = "flex";
        setTimeout(() => popupElement[0].classList.add("active"), 1);
        inputSmsCodeRef1.value.focus();
      }
    };
    const closePopupPinSms = () => {
      store.state.openPopupPinSms = false;
      if (
        !statusPopupPinSms.value &&
        document.querySelectorAll(".popup-pin-sms")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(".popup-pin-sms");
        popupElement[0].classList.remove("active");
        setTimeout(() => (popupElement[0].style.display = "none"), 500);
      }
    };
    const statusPopupPinSms = computed(() => store.state.openPopupPinSms);

    // SMS CODE
    // Номер подтверджен?
    const numberConfirmed = ref(false);
    const smsCode = reactive({
      0: "",
      1: "",
      2: "",
      3: "",
    });

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

    const checkSmsCode = async () => {
      let code = [smsCode[0], smsCode[1], smsCode[2], smsCode[3]].join("");
      let { data } = await axios.post(
        store.state.server + "/api/confirm/check",
        { code: code, phone: reg.phone }
      );
      if (data["result"]) {
        messageSmsResult.value = "Number verified";
        numberConfirmed.value = true;
        reg.code = code;
        await sleep(500);
        closePopupPinSms();
      } else {
        messageSmsResult.value = "The number is registered to another user";
      }
    };
    // -- END SMS CODE --

    const changeRegPhone = () => {
      if (document.querySelectorAll(".reg-phone")[0]) {
        let loginPhone = document
          .querySelectorAll(".reg-phone")[0]
          .getAttribute("data-mask-raw-value");
        formatPhone.value = document.querySelectorAll(".reg-phone")[0].value;
        reg.phone = loginPhone.length > 0 ? "+7" + loginPhone : "";

        console.log(reg.phone.length);
      }
    };

    const switchToLogin = () => router.push({ name: "Auth" });
    const formatPhone = ref(null);
    const reg = reactive({
      name: "",
      phone: "",
      email: "",
      password: "",
      code: "",
    });

    const progressAxios = ref(false);
    const messageResult = ref(null);
    const messageSmsResult = ref(null);
    const deviceRegClass = computed(() => {
      if (
        reg.name.length == 0 ||
        reg.email.length == 0 ||
        reg.phone.length == 0 ||
        reg.password.length == 0
      ) {
        return "disabled";
      }

      if (progressAxios.value == true) {
        return "syncing";
      }
    });

    const deviceReg = async () => {
      console.log(JSON.stringify(reg));

      if (
        reg.name.length != 0 &&
        reg.email.length != 0 &&
        reg.phone.length != 0 &&
        reg.password.length != 0
      ) {
        progressAxios.value = true;
        messageResult.value = null;

        let { data } = await axios({
          url: store.state.server + "/api/reg",
          method: "post",
          data: toRaw(reg),
        });

        if (data["token"]) {
          Cookies.set("token", data["token"], { expires: 7 });
          store.state.token = data["token"];

          axios.defaults.headers.common["authorization"] = data["token"];

          router.push({ name: "DeviceList" });
          progressAxios.value = true;
        } else {
          messageResult.value = data["error"];
          progressAxios.value = false;
        }

        return data;
      } else {
        messageResult.value = "Enter phone number and password";
      }
    };

    const viewSendBlock = computed(() => {
      if (reg.phone.length >= 12) return true;
    });

    onBeforeMount(async () => {
      let token = Cookies.get("token");

      store.state.token = token;
      axios.defaults.headers.common["authorization"] = token;

      if (token != null) {
        let checkToken = await axios.get(store.state.server + "/api/check");
        if (checkToken.data["result"]) {
          router.push({ name: "DeviceList" });
        } else {
          store.state.token = null;
          axios.defaults.headers.common["authorization"] = null;
        }
      }
    });

    const waitTime = 60;
    const waitTimer = computed(() => store.state.waitTimerSms);

    const sendSmsCode = async () => {
      if (waitTimer.value == 0) {
        store.state.waitTimerSms = waitTime;
      }

      if (store.state.waitTimerSms == waitTime) {
        // SEND SMS
        let { data } = await axios.post(
          store.state.server + "/api/confirm/send",
          { phone: reg.phone }
        );

        if (data["result"]) {
          if (!statusPopupPinSms.value) openPopupPinSms();
          console.log("Код подтверждения отправлен");
        } else {
          messageResult.value = data["error"];
        }

        let timeout = setInterval(() => {
          store.state.waitTimerSms--;

          if (store.state.waitTimerSms < 1) {
            clearInterval(timeout);
            store.state.waitTimerSms = 0;
          }
        }, 1000);
      }
    };

    watchEffect(async () => {
      // INPUT SMS CONTROL
      if (smsCode[0].toString().length > 1)
        smsCode[0] = smsCode[0].toString().slice(0, 1);
      if (smsCode[1].toString().length > 1)
        smsCode[1] = smsCode[1].toString().slice(0, 1);
      if (smsCode[2].toString().length > 1)
        smsCode[2] = smsCode[2].toString().slice(0, 1);
      if (smsCode[3].toString().length > 1)
        smsCode[3] = smsCode[3].toString().slice(0, 1);

      if (
        smsCode[0].toString().length > 0 &&
        smsCode[1].toString().length > 0 &&
        smsCode[2].toString().length > 0 &&
        smsCode[3].toString().length > 0
      ) {
        await checkSmsCode();
      }
    });

    return {
      reg,
      changeRegPhone,
      switchToLogin,

      deviceReg,
      deviceRegClass,
      messageResult,
      messageSmsResult,

      sendSmsCode,
      viewSendBlock,
      waitTimer,
      inputSmsEvent,
      inputSmsCodeRef1,
      inputSmsCodeRef2,
      inputSmsCodeRef3,
      inputSmsCodeRef4,
      smsCode,

      statusPopupPinSms,
      closePopupPinSms,
      formatPhone,

      numberConfirmed,
    };
  },
});
</script>

<style lang="scss">
/* SLIDE FADE ANIMATEION */
.fade-enter-active {
  transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}
.fade-leave-active {
  transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}
.fade-enter-from,
.slide-fade-leave-to {
  //transform: translateY(10px);
  opacity: 0;
}
</style>
