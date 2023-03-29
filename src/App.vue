<template>
  <div>
    <router-view v-slot="{ Component }">
      <transition name="slide-fade" mode="out-in">
        <component :is="Component" :key="$router.path"></component>
      </transition>
    </router-view>

    <div class="popup-settings">
      <div class="popup-bg-filter" @click="closeSettings"></div>
      <div class="popup-content">
        <div class="logo">
          <!-- <img src="@/assets/img/logo_x.svg" /> -->
        </div>
        <div class="close" @click="closeSettings">
          <!-- <img src="@/assets/img/close.svg" /> -->
        </div>
        <div class="params-info">
          <span
            >Firmware version: {{ deviceDetail.firmware }} ({{
              deviceDetail.hardware
            }})</span
          >
          <span>MAC address: {{ deviceDetail.mac }}</span>
          <span>Activation date: 17.08.2021</span>
        </div>

        <div class="btn-group">
          <div class="btn-item" @click="checkUpdateVersion">
            <div class="icon">
              <!-- <img src="@/assets/img/check-update.svg" /> -->
              </div>
            <div class="text">Software update</div>
          </div>
          <div class="btn-item" @click="setDisconnect">
            <div class="icon">
              <!-- <img src="@/assets/img/any-device.svg" /> -->
              </div>
            <div class="text">Connect to another somebledevice</div>
          </div>
        </div>

        <div class="spacer"></div>

        <!--<div class="theme-group">
          <div class="theme-item active"><img src="@/assets/img/theme-silver.svg"></div>
          <div class="theme-item"><img src="@/assets/img/theme-dark.svg"></div>
          <div class="theme-item"><img src="@/assets/img/theme-gold.svg"></div>
          <div class="theme-item"><img src="@/assets/img/theme-pink.svg"></div>
        </div>-->

        <div class="puff-control">
          <div class="label">
            <span>Puff control</span>
            <div
              class="question"
              @click="
                setMessage(
                  'Set how many puffs you want to limit in a period of time. For example, 10 puffs in 10 minutes'
                )
              "
            >
              <!-- <img src="@/assets/img/question.svg" /> -->
            </div>
          </div>
          <div class="input-group">
            <input
              type="text"
              v-model="overPuffModel"
              @keyup="setDeviceOverPuff"
              placeholder="Enter puff limit"
            />
          </div>

          <div class="label" style="margin-top: 16px">
            <span>Vapor Intensity</span>
            <div
              class="question"
              @click="
                setMessage(
                  'Choose a preferred puff mode - low battery consumption, medium or high.'
                )
              "
            >
              <!-- <img src="@/assets/img/question.svg" /> -->
            </div>
          </div>
          <div class="select-group">
            <div
              class="select-item"
              :class="activePowerPuff == 'low' ? 'active' : ''"
              @click="setActivePowerPuff('low')"
            >
              Eco
            </div>
            <div
              class="select-item"
              :class="activePowerPuff == 'medium' ? 'active' : ''"
              @click="setActivePowerPuff('medium')"
            >
              Normal
            </div>
            <div
              class="select-item"
              :class="activePowerPuff == 'max' ? 'active' : ''"
              @click="setActivePowerPuff('max')"
            >
              Max
            </div>
          </div>
        </div>

        <div class="contact-group">
          <div class="contact-item">
            <!-- <img src="@/assets/img/contact-link.svg" /> -->
          </div>
          <div class="contact-item">
            <!-- <img src="@/assets/img/contact-map.svg" /> -->
          </div>
          <div class="contact-item" @click="openJivoChat">
            <!-- <img src="@/assets/img/contact-support.svg" /> -->
          </div>
        </div>
      </div>
    </div>

    <div class="popup-update update">
      <div class="popup-bg-filter" @click="closePopupUpdate"></div>
      <div class="popup-content">
        <div class="title">Update available</div>
        <div class="version-line">
          <div class="old">
            <div class="label">Current version</div>
            <div class="number">{{ deviceDetail.firmware }}</div>
          </div>
          <div class="arrow">
            <!-- <img src="@/assets/img/arrow-down.svg" /> -->
            </div>
          <div class="new">
            <div class="label">New version</div>
            <div class="number">{{ firmwareData.version }}</div>
          </div>
        </div>
        <div class="btn-confirm" @click="goFirmwareUpdate">Upgrade now</div>
        <div class="btn-cancel" @click="closePopupUpdate">Update Later</div>
      </div>
    </div>

    <div class="popup-radio">
      <div class="popup-bg-filter" @click="closePopupRadio"></div>
      <div class="popup-content">
        <div class="icon-device">
          <img
            :src="
              !deviceFindStatus
                ? require('@/assets/img/device-radio.svg')
                : require(`@/assets/img/device-radio-active-${
                    deviceFindStatusAnimate ? deviceFindStatusAnimate : 0
                  }.svg`)
            "
          />
        </div>
        <div class="label" style="margin-bottom: 36px">
          Click <strong>find the device</strong>, to start the
          <strong>somebledevice X</strong> pinging
        </div>
        <div
          class="btn-confirm"
          style="margin-bottom: 28px"
          :class="deviceFindStatus ? 'active' : ''"
          @click="deviceFind"
        >
          {{ deviceFindStatus ? "Stop pinging the device" : "Find the device" }}
        </div>
      </div>
    </div>

    <div class="popup-message">
      <div class="popup-bg-filter" @click="closePopupMessage"></div>
      <div class="popup-content">
        <div class="label">{{ popupMessageText }}</div>
      </div>
    </div>

    <div class="tooltip-notify" :class="notifyTooltip.status ? 'activate' : ''">
      <div class="icon">
        <img
          v-if="notifyTooltip.icon == 'device'"
          src="~@/assets/img/bluetooth.svg"
        />
        <img
          v-if="notifyTooltip.icon == 'charge'"
          src="~@/assets/img/battery.svg"
        />
        <img
          v-if="notifyTooltip.icon == 'tasty'"
          src="~@/assets/img/tasty.svg"
        />
      </div>
      <div class="text">{{ notifyTooltip.message }}</div>
    </div>

    <v-offline
      @detected-condition="isOnline"
      online-class="online"
      offline-class="offline"
    >
      <template v-if="!online">
        <div class="wrapper-offline">
          <div class="logo">
            <!-- <img src="@/assets/img/logo_x.svg" /> -->
            </div>
          <div class="title">No internet connection</div>
          <div class="description">
            To use the somebledevice app you need an internet connection
          </div>
          <div class="spacer"></div>
        </div>
      </template>
    </v-offline>
  </div>
</template>

<script lang="ts">
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  defineComponent,
  computed,
  ref,
  watchEffect,
  onMounted,
  reactive,
  nextTick,
  onBeforeMount,
} from "vue";
import Cookies from "js-cookie";
import { VOffline } from "v-offline";

export default defineComponent({
  name: "App",
  setup() {
    const store = useStore();
    const router = useRouter();

    const online = ref(true);
    const isOnline = function (e) {
      online.value = e;
    };

    const msg = () => {
      console.log("blur");
    };

    const openSettings = computed(() => store.state.openSettings);
    const closeSettings = () => {
      store.state.openSettings = false;
    };

    const openJivoChat = () => {
      console.log(window);
      //window['jivo_api'].open()
    };

    const setMessage = (message: any) => {
      store.state.popupMessageText = message;
      store.state.openPopupMessage = true;
    };

    const puffLimitSet = ref(false);
    const puffLimit = computed(() => {
      return store.state.puffLimit;
    });

    const puffControlSet = ref(false);
    const powerControl = computed(() => {
      return store.state.powerControl;
    });

    const overPuffModel = ref(0);
    const setDeviceOverPuff = () => {
      let text = overPuffModel.value.toString();

      if (!overPuffModel.value) return;
      if (text.match(/^([а-яё][А-ЯЁ]+|[a-z][A-Z]+)$/i)) return;

      if (overPuffModel.value >= 0) {
        if (overPuffModel.value >= 100) overPuffModel.value = 100;

        console.log(`OverPuff: ` + overPuffModel.value);
        store.dispatch("setDeviceOverPuff", {
          time: 10 * 60,
          puff: overPuffModel.value,
        });
      }
    };

    const activePowerPuffStatus = ref("medium");
    const activePowerPuff = computed(() => activePowerPuffStatus.value);
    const setActivePowerPuff = (type) => {
      activePowerPuffStatus.value = type;
      store.dispatch("setPowerControl", type);
    };

    const notifyTooltip = computed(() => store.state.notifyTooltip);

    // POPUP UPDATE NOTIFY
    const openPopupUpdate = computed(() => store.state.openPopupUpdate);
    const closePopupUpdate = () => {
      store.state.openPopupUpdate = false;
    };
    const setOpenPopupUpdate = () => (store.state.openPopupUpdate = true);

    const checkUpdateVersion = async () => {
      let version = store.state.deviceDetail.firmware;
      let updateStatus = await store.dispatch("checkFirmwareUpdate", true);

      if (updateStatus == false)
        setMessage("The latest software version is installed");
    };

    const setDisconnect = async () => {
      closeSettings();
      store.dispatch("clearsomebledeviceHandle");
      store.state.deviceConnect = false;

      let somebledevice = await store.dispatch("returnGlobalsomebledevice");
      await somebledevice.disconnect();
      window.location.href = "/";
    };

    const openPopupRadio = computed(() => store.state.openPopupRadio);
    const closePopupRadio = () => (store.state.openPopupRadio = false);

    const openPopupMessage = computed(() => store.state.openPopupMessage);
    const closePopupMessage = () => (store.state.openPopupMessage = false);
    const popupMessageText = computed(() => store.state.popupMessageText);

    const deviceDetail = computed(() => store.state.deviceDetail);
    // Данные последней прошивки на сервере
    const firmwareData = computed(() => store.state.firmwareData);

    const goFirmwareUpdate = () => {
      router.push({ name: "FirmwareUpdate" });
      closePopupUpdate();
      closeSettings();
    };

    // Идет ли поиск устройства ?
    const deviceFindStatus = computed(() => store.state.deviceFindStatus);
    const deviceFind = () => {
      // Поиск устройства
      if (store.state.deviceFindStatus) {
        // Отключаем
        store.state.deviceFindStatus = false;
        //store.dispatch('findDeviceVibration');
      } else {
        // Включаем
        store.state.deviceFindStatus = true;
        store.dispatch("findDeviceVibration");

        let i = setInterval(() => {
          store.dispatch("findDeviceVibration");

          if (store.state.deviceFindStatus == false) {
            clearInterval(i);
          }
        }, 2000);
      }
    };

    let countFindAnimate = ref(0);
    let countFindAnimateRun = ref(false);
    const deviceFindStatusAnimate = computed(() => {
      let ret = 0;
      if (countFindAnimateRun.value == false) {
        let i = setInterval(() => {
          countFindAnimateRun.value = true;
          countFindAnimate.value = countFindAnimate.value + 1;

          if (countFindAnimate.value == 4) countFindAnimate.value = 0;

          if (store.state.deviceFindStatus == false) {
            countFindAnimateRun.value = false;
            clearInterval(i);
          }
        }, 320);
      }

      return countFindAnimate.value;
    });

    watchEffect(async () => {
      if (puffLimit.value && !puffLimitSet.value) {
        overPuffModel.value = puffLimit.value;
        puffLimitSet.value = true;
      }

      if (powerControl.value && !puffControlSet.value) {
        console.log(powerControl.value);
        switch (powerControl.value) {
          case 70:
            activePowerPuffStatus.value = "low";
            break;
          case 73:
            activePowerPuffStatus.value = "medium";
            break;
          case 120:
            activePowerPuffStatus.value = "max";
            break;
          default:
            activePowerPuffStatus.value = "medium";
            break;
        }

        puffControlSet.value = true;
      }

      // Settings menu
      if (openSettings.value) {
        let popupElement = document.querySelectorAll(
          ".popup-settings"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].style.display = "flex";
        setTimeout(() => popupElement[0].classList.add("active"), 1);
      } else if (
        !openSettings.value &&
        document.querySelectorAll(".popup-settings")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(
          ".popup-settings"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].classList.remove("active");
        setTimeout(() => (popupElement[0].style.display = "none"), 500);
      }

      // Popup update
      if (openPopupUpdate.value) {
        let popupElement = document.querySelectorAll(
          ".popup-update"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].style.display = "flex";
        setTimeout(() => popupElement[0].classList.add("active"), 1);
      } else if (
        !openPopupUpdate.value &&
        document.querySelectorAll(".popup-update")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(
          ".popup-update"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].classList.remove("active");
        setTimeout(() => (popupElement[0].style.display = "none"), 500);
      }

      // Popup Radio
      if (openPopupRadio.value) {
        let popupElement = document.querySelectorAll(
          ".popup-radio"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].style.display = "flex";
        setTimeout(() => popupElement[0].classList.add("active"), 1);
      } else if (
        !openPopupRadio.value &&
        document.querySelectorAll(".popup-radio")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(
          ".popup-radio"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].classList.remove("active");
        setTimeout(() => (popupElement[0].style.display = "none"), 500);
      }

      // Popup Message
      if (openPopupMessage.value) {
        let popupElement = document.querySelectorAll(
          ".popup-message"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].style.display = "flex";
        setTimeout(() => popupElement[0].classList.add("active"), 1);
      } else if (
        !openPopupMessage.value &&
        document.querySelectorAll(".popup-message")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(
          ".popup-message"
        ) as NodeListOf<HTMLElement>;
        popupElement[0].classList.remove("active");
        setTimeout(() => (popupElement[0].style.display = "none"), 500);
      }
    });

    return {
      openSettings,
      closeSettings,

      openPopupUpdate,
      closePopupUpdate,
      setOpenPopupUpdate,

      openPopupRadio,
      closePopupRadio,
      deviceFindStatusAnimate,

      openPopupMessage,
      closePopupMessage,
      popupMessageText,

      deviceDetail,
      firmwareData,

      goFirmwareUpdate,
      setDisconnect,

      notifyTooltip,
      checkUpdateVersion,

      deviceFind,
      deviceFindStatus,

      setMessage,
      setActivePowerPuff,
      activePowerPuff,

      setDeviceOverPuff,
      overPuffModel,

      msg,
      openJivoChat,

      isOnline,
      online,
    };
  },
  components: {
    VOffline,
  },
});
</script>

<style lang="scss">
.button_e135,
.button_ba21,
.popup_d356,
.popup_a91f,
.popup_d03a,
.button_eca5 {
  display: none !important;
}

@font-face {
  font-family: "SF UI Display";
  src: url("~@/assets/fonts/SFUIDisplay-Regular.eot");
  src: local("SF UI Display Regular"),
    local("~@/assets/fonts/SFUIDisplay-Regular"),
    url("~@/assets/fonts/SFUIDisplay-Regular.eot?#iefix")
      format("embedded-opentype"),
    url("~@/assets/fonts/SFUIDisplay-Regular.woff2") format("woff2"),
    url("~@/assets/fonts/SFUIDisplay-Regular.woff") format("woff"),
    url("~@/assets/fonts/SFUIDisplay-Regular.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: "SF UI Display";
  src: url("~@/assets/fonts/SFUIDisplay-Ultralight.eot");
  src: local("SF UI Display Ultralight"),
    local("~@/assets/fonts/SFUIDisplay-Ultralight"),
    url("~@/assets/fonts/SFUIDisplay-Ultralight.eot?#iefix")
      format("embedded-opentype"),
    url("~@/assets/fonts/SFUIDisplay-Ultralight.woff2") format("woff2"),
    url("~@/assets/fonts/SFUIDisplay-Ultralight.woff") format("woff"),
    url("~@/assets/fonts/SFUIDisplay-Ultralight.ttf") format("truetype");
  font-weight: 100;
  font-style: normal;
}

@font-face {
  font-family: "SF UI Display";
  src: url("~@/assets/fonts/SFUIDisplay-Semibold.eot");
  src: local("SF UI Display Semibold"),
    local("~@/assets/fonts/SFUIDisplay-Semibold"),
    url("~@/assets/fonts/SFUIDisplay-Semibold.eot?#iefix")
      format("embedded-opentype"),
    url("~@/assets/fonts/SFUIDisplay-Semibold.woff2") format("woff2"),
    url("~@/assets/fonts/SFUIDisplay-Semibold.woff") format("woff"),
    url("~@/assets/fonts/SFUIDisplay-Semibold.ttf") format("truetype");
  font-weight: 600;
  font-style: normal;
}

@font-face {
  font-family: "SF UI Display";
  src: url("~@/assets/fonts/SFUIDisplay-Bold.eot");
  src: local("SF UI Display Bold"), local("~@/assets/fonts/SFUIDisplay-Bold"),
    url("~@/assets/fonts/SFUIDisplay-Bold.eot?#iefix")
      format("embedded-opentype"),
    url("~@/assets/fonts/SFUIDisplay-Bold.woff2") format("woff2"),
    url("~@/assets/fonts/SFUIDisplay-Bold.woff") format("woff"),
    url("~@/assets/fonts/SFUIDisplay-Bold.ttf") format("truetype");
  font-weight: bold;
  font-style: normal;
}

@font-face {
  font-family: "SF UI Display";
  src: url("~@/assets/fonts/SFUIDisplay-Medium.eot");
  src: local("SF UI Display Medium"),
    local("~@/assets/fonts/SFUIDisplay-Medium"),
    url("~@/assets/fonts/SFUIDisplay-Medium.eot?#iefix")
      format("embedded-opentype"),
    url("~@/assets/fonts/SFUIDisplay-Medium.woff2") format("woff2"),
    url("~@/assets/fonts/SFUIDisplay-Medium.woff") format("woff"),
    url("~@/assets/fonts/SFUIDisplay-Medium.ttf") format("truetype");
  font-weight: 500;
  font-style: normal;
}

@font-face {
  font-family: "SF UI Display";
  src: url("~@/assets/fonts/SFUIDisplay-Thin.eot");
  src: local("SF UI Display Light"), local("~@/assets/fonts/SFUIDisplay-Thin"),
    url("~@/assets/fonts/SFUIDisplay-Thin.eot?#iefix")
      format("embedded-opentype"),
    url("~@/assets/fonts/SFUIDisplay-Thin.woff") format("woff"),
    url("~@/assets/fonts/SFUIDisplay-Thin.ttf") format("truetype");
  font-weight: 200;
  font-style: normal;
}

@font-face {
  font-family: "SF UI Display";
  src: url("~@/assets/fonts/SFUIDisplay-Light.eot");
  src: local("SF UI Display Light"), local("~@/assets/fonts/SFUIDisplay-Light"),
    url("~@/assets/fonts/SFUIDisplay-Light.eot?#iefix")
      format("embedded-opentype"),
    url("~@/assets/fonts/SFUIDisplay-Light.woff2") format("woff2"),
    url("~@/assets/fonts/SFUIDisplay-Light.woff") format("woff"),
    url("~@/assets/fonts/SFUIDisplay-Light.ttf") format("truetype");
  font-weight: 300;
  font-style: normal;
}
@import "~@/assets/css/main.scss";

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

/* SLIDE FADE ANIMATEION */
.slide-fadeup-enter-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fadeup-leave-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fadeup-enter-from,
.slide-fadeup-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
