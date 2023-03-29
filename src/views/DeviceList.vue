<template>
  <div class="global">
    <transition-group name="slide-fade" mode="out-in">
      <div class="wrapper-device-list" v-if="deviceWrapperListStatus">
        <div class="profile">
          <div class="info">
            <div class="block-info">
              <div class="message">
                <span
                  >Hi, {{ userProfile != null ? userProfile.name : "" }}!</span
                >
              </div>
              <div class="phone">
                {{ userProfile != null ? userProfile.phoneFormat : "" }}
              </div>
            </div>
            <div class="block-edit">
              <div class="btn-edit" @click="logout">
                <!-- <img src="@/assets/img/logout.svg" /> -->
              </div>
            </div>
          </div>
        </div>
        <div class="title">Connected somebledevice</div>
        <div class="description-notice">
          Click on a device from the list below or click "add device" for a new
          device
        </div>
        <div class="device-list">
          <div class="list">
            <div
              class="device-item"
              v-for="device in userDevices"
              :key="device.id"
            >
              <span @click="startFindDevice(device)">{{ device.name }}</span>
              <div class="close" @click="removeDevice(device)">
                <!-- <img src="@/assets/img/close.svg" /> -->
              </div>
            </div>

            <div class="device-item not-active" v-if="userDevices.length == 0">
              <div class="device-name">You do not have any related devices</div>
            </div>
          </div>
        </div>
        <div class="spacer"></div>
        <div
          class="btn-device-add"
          :class="connectDeviceInProcess ? 'syncing' : ''"
          @click="startFindDevice(null)"
        >
          <div class="icon-sync">
            <div class="sync-bg"></div>
          </div>
          <span>Add device</span>
        </div>
        <div class="btn-cancel" @click="logout">Log out from the account</div>
      </div>

      <div class="wrapper-device-confirm" v-if="deviceConfirmStatus">
        <div class="image">
          <!-- <img src="@/assets/img/device-confirm.svg" /> -->
        </div>
        <div class="spacer"></div>
        <div class="label-notice">
          Please, <strong>remove</strong> and <strong>insert the</strong
          ><br />POD into the device within 30 seconds
        </div>
        <div class="timer">{{ confirmTimerCount }}</div>
        <div class="btn-cancel" @click="deviceConfirmClose">Connect Later</div>
      </div>
    </transition-group>
    <!-- POPUP PIN WINDOW -->
    <!--<div class="popup-pin">
        <div class="popup-bg-filter" @click="closePopupPin"></div>
        <div class="popup-content">
        <div class="title" style="margin-bottom: 18px;">{{ createPin == false ? 'Введите пин-код' : 'Новый пин-код' }}</div>
        <div class="label">{{ createPin == false ? 'Введите пин-код от устройства' : 'Придумайте пин-код для устройства' }}<br><strong>{{ deviceDetail.name }} </strong></div>
        <div class="pin-place">
            <input type="number" v-model="pinCode[0]" @keyup="inputPinEvent" ref="inputPinCodeRef1" placeholder="0">
            <input type="number" v-model="pinCode[1]" @keyup="inputPinEvent" ref="inputPinCodeRef2" placeholder="0">
            <input type="number" v-model="pinCode[2]" @keyup="inputPinEvent" ref="inputPinCodeRef3" placeholder="0">
            <input type="number" v-model="pinCode[3]" @keyup="inputPinEvent" ref="inputPinCodeRef4" placeholder="0">
        </div>
        <transition name="slide-fade" mode="out-in">
            <div class="message-status" v-if="messagePinResult">{{ messagePinResult }}</div>
        </transition>
        <div class="btn-link" @click="closePopupPin" v-if="createPin != true">Не помню пин-код</div>
        <div class="btn-confirm" @click="addDeviceFromUser" :class="pinWrited == false ? 'disabled' : ''" v-if="createPin == true">Установить PIN</div>
        <div class="btn-cancel" @click="closePopupPin">Отмена</div>
        </div>
    </div>-->
  </div>
</template>

<script>
import {
  computed,
  defineComponent,
  reactive,
  ref,
  onBeforeMount,
  watchEffect,
  nextTick,
  toRaw,
} from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

import Cookies from "js-cookie";
import axios from "axios";

export default defineComponent({
  name: "DeviceList",
  setup() {
    const store = useStore();
    const router = useRouter();

    const pinCode = reactive({
      0: "",
      1: "",
      2: "",
      3: "",
    });

    const inputPinCodeRef1 = ref(null);
    const inputPinCodeRef2 = ref(null);
    const inputPinCodeRef3 = ref(null);
    const inputPinCodeRef4 = ref(null);

    const inputPinEvent = (event) => {
      if (event.keyCode != 8) {
        if (pinCode[0].toString().length > 0)
          nextTick(() => {
            inputPinCodeRef2.value.focus();
          });
        if (pinCode[1].toString().length > 0)
          nextTick(() => {
            inputPinCodeRef3.value.focus();
          });
        if (pinCode[2].toString().length > 0)
          nextTick(() => {
            inputPinCodeRef4.value.focus();
          });
      } else {
        if (pinCode[3].toString().length == 0)
          nextTick(() => {
            inputPinCodeRef3.value.focus();
          });
        if (pinCode[2].toString().length == 0)
          nextTick(() => {
            inputPinCodeRef2.value.focus();
          });
        if (pinCode[1].toString().length == 0)
          nextTick(() => {
            inputPinCodeRef1.value.focus();
          });
      }
    };

    const removeDevice = async (device) => {
      await store.dispatch("removeDevice", device.id);
    };

    const addDeviceFromUser = async () => {
      //if (pinWrited.value == true) {
      //let code = [pinCode[0], pinCode[1], pinCode[2], pinCode[3]].join('');
      let code = "0000";
      let result = await store.dispatch("addDeviceFromUser", code);
      if (result["result"] == true) {
        //closePopupPin();
        createPin.value = false;
        router.push({ name: "Main" });
      } else {
        messagePinResult.value = result["error"];
      }
      //}
    };

    // ! Окно пин-кода
    const openPopupPin = () => {
      store.state.openPopupPin = true;
      if (
        statusPopupPin.value &&
        document.querySelectorAll(".popup-pin")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(".popup-pin");
        popupElement[0].style.display = "flex";
        setTimeout(() => popupElement[0].classList.add("active"), 1);
        inputPinCodeRef1.value.focus();
      }
    };
    const closePopupPin = async () => {
      store.state.openPopupPin = false;
      if (
        !statusPopupPin.value &&
        document.querySelectorAll(".popup-pin")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(".popup-pin");
        popupElement[0].classList.remove("active");
        setTimeout(() => (popupElement[0].style.display = "none"), 500);
        pinCode[0] = "";
        pinCode[1] = "";
        pinCode[2] = "";
        pinCode[3] = "";

        // Если это не была установка pin-кода
        if (createPin.value == false) await store.dispatch("clearsomebledeviceHandle");
      }
    };
    const statusPopupPin = computed(() => store.state.openPopupPin);
    const messagePinResult = ref(null);

    const deviceWrapperListStatus = ref(true);
    const deviceConfirmStatus = ref(false);
    const deviceConfirmClose = () => (deviceConfirmStatus.value = false);
    const deviceConfirmOpen = () => (deviceConfirmStatus.value = true);

    const deviceDetail = computed(() => store.state.deviceDetail);

    const userProfile = computed(() => store.state.userProfile);
    const userDevices = computed(() => store.state.userDevices);

    const connectDeviceInProcess = computed(
      () => store.state.connectDeviceInProcess
    );
    const deviceConnectStatus = computed(() => store.state.deviceConnect);

    // Данные активного устойства
    let activeDeviceData = ref(null);
    // PIN заполнен на 4 цифры
    let pinWrited = ref(false);
    // Данные в окне введите / придумайте
    let createPin = ref(false);
    // Устройство подтверждено
    let detectConfirm = ref(false);
    let confirmTimerCount = ref(30);
    let startConnect = ref(false);
    let confirmCartridgeEvent = computed(
      () => store.state.confirmCartridgeEvent
    );

    const startFindDevice = async (device) => {
      device = device != null ? toRaw(device) : null;
      // Отключаем существующее экземпляры подключения
      await store.dispatch("clearsomebledeviceHandle");

      let connect = await store.dispatch("connectsomebledeviceDeviceList", device);
      if (deviceConnectStatus.value) {
        startConnect.value = true;
        //! Добавляем новое устройство
        if (device == null) {
          confirmTimerCount.value = 30;
          // ! SHOW WINDOW CONFIRM CARTRIDGE
          deviceConfirmStatus.value = true;
          console.log(deviceConfirmStatus.value);

          let confirmTime = setInterval(() => {
            confirmTimerCount.value--;
            if (confirmTimerCount.value < 1) {
              clearInterval(confirmTime);
              // ! CLOSE WINDOW CONFIRM CARTRIDGE
              deviceConfirmStatus.value = false;
            }
          }, 1000);
        } else {
          // ! Подключаемся к устройству из профиля
          router.push({ name: "Main" });
          let code = "0000";
          let result = await store.dispatch("updateDeviceFromUser", code);
          //openPopupPin();
        }
      } else {
        console.log("Отмена подключения устройста");
      }
    };

    if (!store.state.token) router.push({ name: "Auth" });

    const logout = () => {
      // Закрываем окно если открыто
      deviceConfirmClose();

      Cookies.set("token", "");
      store.state.token = null;
      axios.defaults.headers.common["authorization"] = null;

      router.push({ name: "Auth" });
    };

    onBeforeMount(async () => {
      if (store.state.token != null) {
        await store.dispatch("getUserProfile");
        await store.dispatch("getUserDevices");
      }
    });

    watchEffect(async () => {
      // INPUT PIN CONTROL
      if (pinCode[0].toString().length > 1)
        pinCode[0] = pinCode[0].toString().slice(0, 1);
      if (pinCode[1].toString().length > 1)
        pinCode[1] = pinCode[1].toString().slice(0, 1);
      if (pinCode[2].toString().length > 1)
        pinCode[2] = pinCode[2].toString().slice(0, 1);
      if (pinCode[3].toString().length > 1)
        pinCode[3] = pinCode[3].toString().slice(0, 1);

      if (
        pinCode[0].toString().length > 0 &&
        pinCode[1].toString().length > 0 &&
        pinCode[2].toString().length > 0 &&
        pinCode[3].toString().length > 0
      ) {
        pinWrited.value = true;
        if (createPin.value == false) {
          let code = [pinCode[0], pinCode[1], pinCode[2], pinCode[3]].join("");
          let checkPin = await store.dispatch("checkDevicePin", code);
          if (checkPin["result"] == true) {
            // INIT DATA LOAD
            router.push({ name: "Main" });
          } else {
            messagePinResult.value = checkPin["error"];
          }
        }
      } else {
        pinWrited.value = false;
      }

      // Если время вышло и картридж не подтвержден
      if (
        startConnect.value == true &&
        confirmTimerCount.value <= 0 &&
        confirmCartridgeEvent.value < 2
      ) {
        console.log("device not confirm");
        await store.dispatch("returnGlobalsomebledevice");
        //await somebledeviceGlobal.disconnect();
        await store.dispatch("clearsomebledeviceHandle");
      } else if (
        startConnect.value == true &&
        confirmTimerCount.value > 0 &&
        confirmCartridgeEvent.value >= 2
      ) {
        // Чтобы повторон не вызывать события - подтверждаем что зафикцисорвали подтверждение картриджа
        if (detectConfirm.value == false) {
          detectConfirm.value = true;
          // ! CLOSE WINDOW CONFIRM CARTRIDGE
          deviceConfirmStatus.value = false;
          await addDeviceFromUser();
          //router.push({'name': 'Main'});
          // Данные в окне на установку пина
          //createPin.value = true;
          //openPopupPin();
        }
      }
    });

    return {
      deviceConfirmStatus,
      deviceConfirmClose,
      deviceWrapperListStatus,

      logout,
      userProfile,
      userDevices,

      startFindDevice,
      deviceConnectStatus,
      connectDeviceInProcess,

      confirmTimerCount,

      openPopupPin,
      closePopupPin,
      statusPopupPin,
      createPin,
      activeDeviceData,

      deviceDetail,

      pinCode,
      inputPinCodeRef1,
      inputPinCodeRef2,
      inputPinCodeRef3,
      inputPinCodeRef4,
      inputPinEvent,
      pinWrited,
      addDeviceFromUser,

      messagePinResult,
      removeDevice,
    };
  },
});
</script>

<style lang="scss">
/* SLIDE FADE ANIMATEION */
.slide-fade-enter-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  //transform: translateY(10px);
  opacity: 0;
}
</style>
