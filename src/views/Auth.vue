<template>
  <div class="global">
    <transition v-if="mobile">
      <div class="wrapper-auth">
        <div class="logo">
          <!-- <img src="@/assets/img/logo_x.svg" /> -->
          </div>
        <div class="spacer"></div>
        <div class="title">Sign in profile</div>
        <div class="description">
          To connect the somebledevice, you need to log in to your personal profile.
          Click on the link "Create profile" to create a profile
        </div>
        <div class="input-group">
          <input
            type="text"
            class="input login-phone"
            @keyup="changeLoginPhone"
            v-maska="'+7(###)-###-##-##'"
            placeholder="Phone number"
          />
          <input
            type="password"
            v-model="login.password"
            class="input"
            placeholder="Password"
          />
        </div>

        <div class="message-error">{{ messageResult }}</div>
        <div class="btn-auth" :class="deviceLoginClass" @click="deviceLogin">
          <div class="icon-sync"><div class="sync-bg"></div></div>
          <span>Sign in profile</span>
        </div>

        <div class="rule">
          Pressing the button "sign in profile" - you agree with
          <a href="#">privacy policy</a> and
          <a href="#">terms of service use</a> and confirm that you are 18 years
          old or older.
        </div>

        <div class="text-link dark" @click="switchToReg">Create account</div>
        <div class="text-link" @click="switchToRecovery">Recover password</div>

        <div class="spacer"></div>
      </div>
    </transition>
    <transition v-if="!mobile">
      <div class="wrapper-auth">
        <div class="logo">
          <!-- <img src="@/assets/img/logo_x.svg" /> -->
          </div>
        <div class="spacer"></div>
        <div class="description desctope">
          To connect somebledevice, use the
          <a href="https://somebledevice.ru/somebledevicex/downloads">instructions</a>
        </div>
        <div class="spacer"></div>
      </div>
    </transition>
  </div>
</template>

<script>
import {
  computed,
  defineComponent,
  onBeforeMount,
  reactive,
  ref,
  watchEffect,
} from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "axios";
import Cookies from "js-cookie";

export default defineComponent({
  name: "Connect",
  setup() {
    const mobile = ref(
      /iPhone|Android|webOS|BlackBerry|IEMobile|Opera Mini|iPod/i.test(
        navigator.userAgent
      )
    );
    const store = useStore();
    const router = useRouter();

    const login = reactive({
      phone: "",
      password: "",
    });
    const changeLoginPhone = () => {
      if (document.querySelectorAll(".login-phone")[0]) {
        let loginPhone = document
          .querySelectorAll(".login-phone")[0]
          .getAttribute("data-mask-raw-value");
        if (login.phone == "" && loginPhone == 8)
          document.querySelectorAll(".login-phone")[0].value = "+7";
        login.phone = loginPhone.length > 0 ? "+7" + loginPhone : "";
      }
    };

    const switchToReg = () => router.push({ name: "Reg" });
    const switchToRecovery = () => router.push({ name: "RecoveryPassword" });

    const progressAxios = ref(false);
    const messageResult = ref(null);
    const deviceLoginClass = computed(() => {
      if (login.phone.length == 0 || login.password.length == 0) {
        return "disabled";
      }

      if (progressAxios.value == true) {
        return "syncing";
      }
    });

    const deviceLogin = async () => {
      if (login.phone.length != 0 && login.password.length != 0) {
        progressAxios.value = true;
        messageResult.value = null;

        let sendData = {
          phone: login.phone,
          password: login.password,
        };

        let { data } = await axios({
          url: store.state.server + "/api/auth",
          method: "post",
          data: sendData,
        });

        if (data["token"]) {
          Cookies.set("token", data["token"], { expires: 7 });
          store.state.token = data["token"];

          axios.defaults.headers.common["authorization"] = data["token"];

          router.push({ name: "DeviceList" });
          progressAxios.value = true;
        } else {
          messageResult.value = "Wrong phone number or password";
          progressAxios.value = false;
        }

        return data;
      } else {
        messageResult.value = "Enter phone number and password";
      }
    };

    onBeforeMount(async () => {
      let token = Cookies.get("token");

      store.state.token = token;
      axios.defaults.headers.common["authorization"] = token;

      if (token != null) {
        let checkToken = await axios.get(store.state.server + "/api/check");
        if (checkToken.data["result"]) {
          if (mobile.value) {
            router.push({ name: "DeviceList" });
          }
        } else {
          store.state.token = null;
          axios.defaults.headers.common["authorization"] = null;
        }
      }
    });

    return {
      login,
      changeLoginPhone,
      mobile,

      switchToReg,
      switchToRecovery,

      deviceLogin,
      messageResult,
      progressAxios,
      deviceLoginClass,
    };
  },
});
</script>

<style lang="scss">
.desctope {
  font-size: 25px !important;
  > a {
    color: black;
  }
}
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
