<template>
  <div class="global">
    <div class="wrapper-pre-update" v-if="!statusProcessUpdate">
      <div class="title">Installing the update...</div>
      <div class="label">Please make sure that:</div>

      <div class="steps">
        <div class="step">
          <div class="icon">
            <span :class="deviceConnect ? 'active' : ''">1</span>
          </div>
          <div class="text">
            Your device and phone<br />are connected via
            <strong>BLUETOOTH</strong>
          </div>
        </div>
        <div class="step">
          <div class="icon">
            <span :class="chargeStatus ? 'active' : ''">2</span>
          </div>
          <div class="text">
            Your device is connected<br />to a <strong>charger and </strong> is
            charging.
          </div>
        </div>
      </div>

      <div class="spacer"></div>

      <div
        class="btn-confirm"
        @click="nextStepSetup"
        :class="chargeStatus ? 'disabled' : ''"
      >
        Continue
      </div>
      <div class="btn-cancel" @click="goToMain">Cancel</div>
    </div>

    <div class="wrapper-update" v-if="statusProcessUpdate">
      <div class="process-update" v-if="statusUpdateNow">
        <div class="logo">
          <!-- <img src="../assets/img/logo_x.svg" /> -->
          </div>
        <div class="description">Upgrade installation</div>
        <div class="description">
          Do not leave the page or browser window, please
        </div>
        <div class="progress-bar">
          <div
            class="progress-line"
            :style="`width: ${processUpdatePercent}%;`"
          ></div>
        </div>
        <div class="percent">{{ processUpdatePercent }}%</div>
      </div>

      <div class="process-done" v-if="statusProcessDone">
        <div class="spacer"></div>
        <div class="icon">
          <!-- <img src="../assets/img/icon-done.svg" /> -->
          </div>
        <div class="description">The latest software version is installed</div>
        <div class="spacer"></div>
        <div
          class="btn-confirm"
          @click="goToMain"
          :class="chargeStatus ? 'disabled' : ''"
        >
          Continue
        </div>
      </div>

      <div class="process-error" v-if="statusProcessError">
        <div class="spacer"></div>
        <div class="icon">
          <!-- <img src="../assets/img/icon-error.svg" /> -->
          </div>
        <div class="description">Ошибка при обновлении</div>
        <div class="spacer"></div>
        <div
          class="btn-confirm"
          @click="closeWindowError"
          :class="chargeStatus ? 'disabled' : ''"
        >
          Закрыть
        </div>
      </div>
    </div>

    <div class="popup-update-dfu">
      <div class="popup-bg-filter" @click="closePopupUpdateDfu"></div>
      <div class="popup-content">
        <div class="title">Final checks</div>
        <div class="label">
          Before starting the installation, be sure that the LED on the device
          is blue
        </div>
        <div class="dot-blue"><div class="dot"></div></div>
        <div class="btn-confirm" @click="clickDFU($event)">Select device</div>
        <div class="btn-cancel" @click="closePopupUpdateDfu">Update Later</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, ref, watchEffect } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

import SecureDfu from "web-bluetooth-dfu/lib";
import CRC32 from "crc-32";

import Package from "../bluetooth/package";

async function connectDFU(dfu) {
  try {
    let device = await dfu.requestDevice(false, [
      { name: "DfuTarg" },
      { namePrefix: "DfuTarg" },
    ]);

    return device;
  } catch (e) {
    console.log("Отмена выбора устройства DFU");
  }
}

export default defineComponent({
  name: "FirmwareUpdate",
  setup() {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    const store = useStore();
    const router = useRouter();
    const deviceConnect = computed(() => store.state.deviceConnect);
    const chargeStatus = computed(() => store.state.deviceDetail.chargeStatus);

    const statusProcessUpdate = ref(false);
    const statusProcessDone = ref(false);
    const statusProcessError = ref(false);
    const statusUpdateNow = ref(false);
    const statusProcessErrorClose = () => {
      statusProcessError.value = false;
    };
    const processUpdatePercent = ref(0);
    const statusProcessFinish = () => {
      store.state.notRedirectConnect = true;
      router.push({ name: "Main" });

      //statusProcessDone.value = false;
      //statusProcessError.value = false;
      //statusProcessUpdate.value = false;
      store.state.deviceConnect = false;
    };

    // POPUP UPDATE DFU
    const openPopupUpdateDfuStatus = computed(
      () => store.state.openPopupUpdateDfu
    );
    const closePopupUpdateDfu = () => {
      store.state.openPopupUpdateDfu = false;
    };
    const setOpenPopupUpdateDfu = () => (store.state.openPopupUpdateDfu = true);

    const goToMain = () => {
      router.push({ name: "Main" });
    };

    const closeWindowError = () => {
      statusProcessUpdate.value = false;
      statusProcessError.value = false;
    };

    const dfu = new SecureDfu(CRC32.buf, navigator.bluetooth, 5);
    // UUID сервиса
    dfu.SERVICE_UUID = "FE59";

    const nextStepSetup = async () => {
      if (deviceConnect.value && chargeStatus.value) {
        setOpenPopupUpdateDfu();
        store.state.notRedirectConnect = true;
        //await store.state.somebledevice.startCommand([0x55]);
        await store.dispatch("setCommandNordic", [0x55]);
        await store.dispatch("clearsomebledeviceHandle");

        console.log("Отправили команду");
      } else {
        alert("Выполните все шаги до начала установки");
      }
    };

    // upload firmware to file[0] object
    async function createFile(url) {
      let response = await fetch(url);
      let data = await response.blob();
      let metadata = {
        type: "application/zip",
      };
      let file = new File([data], "firmware.zip", metadata);
      return file;
    }

    const setTransfer = (state) => {
      if (!state) {
        return;
      }
      let transfer = `${state.currentBytes}/${state.totalBytes} ${state.object} bytes written`;
      console.log(`Transfer: ${transfer}`);
      let progress = parseInt((state.currentBytes / state.totalBytes) * 100);
      processUpdatePercent.value = progress;

      return progress;
    };

    // Load a firmware package
    const setPackage = async () => {
      let file = await createFile(store.state.firmwareData.file);
      if (!file) {
        console.log("Нет файла для установки");
        return;
      }

      let pack = new Package(file);
      await pack.load();
      return pack;
    };

    const update = async (dfu, device, pack) => {
      console.log("stage update");
      let somebledevice = await store.dispatch("returnGlobalsomebledevice");
      console.log("получили somebledevice x object");

      if (!pack) {
        console.log("Pack не существует..");
        return;
      }

      Promise.resolve()
        .then(() => {
          console.log("getBaseImage");
          return pack.getBaseImage();
        })
        .then((image) => {
          if (image) {
            console.log(`Updating 1 ${image.type}: ${image.imageFile}...`);
            return dfu.update(device, image.initData, image.imageData);
          }
        })
        .then(() => {
          return pack.getAppImage();
        })
        .then(async (image) => {
          if (image) {
            console.log(`Updating 2 ${image.type}: ${image.imageFile}...`);
            try {
              return await dfu.update(device, image.initData, image.imageData);
            } catch (e) {
              console.log("Ошибка UPDATE");
              console.log(e);
            }
          }
        })
        .then(async () => {
          console.log("Update complete!");
          statusProcessDone.value = true;
          await sleep(1500);
          // Не находимся в статусе обновления
          statusUpdateNow.value = false;
          setTransfer(0);

          /*setTimeout(async () => {
                    try {
                        let statusConnect = await somebledevice.connect();
                        
                        if (statusConnect['connect'] == true) {
                        // Устройство подключено
                            store.commit('setDeviceConnect', true);
                            // Данные устройства
                            store.commit('setDeviceDetail', await somebledevice.deviceDetail);
                            await store.dispatch('startGattNotify', somebledevice);

                            let deviceFullName = `${store.state.deviceDetail.deviceName} ${store.state.deviceDetail.deviceModel}`.toUpperCase();
                            context.dispatch('startNotifyTooltip', {message: `${deviceFullName} подключён`, icon: 'device'});
                        } else {
                            store.commit('setDeviceConnect', false);
                        }
                    } catch (e) {
                        console.log('Ошибка подключения к устройству TRY');
                        console.log(e);
                    }
                }, 1500);*/
          store.state.notRedirectConnect = false;
          store.dispatch("resetState");
        })
        .catch((error) => {
          statusProcessUpdate.value = false;
          statusProcessDone.value = false;
          statusProcessError.value = true;
          console.log("Ошибка обновления прошивки");
          console.log(error);
          // Не находимся в статусе обновления
          statusUpdateNow.value = false;
        });
    };

    dfu.addEventListener("log", (event) => {
      //console.log(event.message);
    });
    dfu.addEventListener("progress", (event) => {
      setTransfer(event);
    });

    const clickDFU = async (e) => {
      let device = await connectDFU(dfu);

      if (device) {
        //slideupClose(e);
        console.log("Device..");
        console.log(device);
        console.log("set Dfu Mode...");
        console.log("Set package...");
        let pack = await setPackage();
        console.log(pack);
        console.log("Start update...");
        update(dfu, device, pack);

        setTimeout(() => {
          closePopupUpdateDfu();
          statusProcessUpdate.value = true;
          statusUpdateNow.value = true;
        }, 600);
      }
    };

    watchEffect(() => {
      if (!store.state.deviceConnect && !store.state.notRedirectConnect)
        router.push({ name: "Connect" });

      // Popup update Dfu
      if (openPopupUpdateDfuStatus.value) {
        let popupElement = document.querySelectorAll(".popup-update-dfu");
        console.log(popupElement);
        popupElement[0].style.display = "flex";
        setTimeout(() => popupElement[0].classList.add("active"), 1);
      } else if (
        !openPopupUpdateDfuStatus.value &&
        document.querySelectorAll(".popup-update-dfu")[0] != undefined
      ) {
        let popupElement = document.querySelectorAll(".popup-update-dfu");
        popupElement[0].classList.remove("active");
        setTimeout(() => (popupElement[0].style.display = "none"), 500);
      }
    });

    return {
      deviceConnect,
      chargeStatus,
      clickDFU,
      statusProcessUpdate,
      processUpdatePercent,
      statusProcessDone,
      statusProcessError,
      statusProcessFinish,
      statusProcessErrorClose,
      nextStepSetup,
      goToMain,

      setOpenPopupUpdateDfu,
      openPopupUpdateDfuStatus,
      closePopupUpdateDfu,

      closeWindowError,
      statusUpdateNow,
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

.start-firmware-update,
.firmware-done,
.firmware-error {
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background-color: #fff;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  z-index: 9001;

  > .logo {
    margin-bottom: 30px;

    > img {
      width: 100px;
    }
  }

  > .progress-bar {
    width: 80%;
    height: 5px;
    border-radius: 100px;
    background-color: rgba(0, 0, 0, 0.1);
    margin-top: 15px;
    position: relative;

    overflow: hidden;

    > .progress {
      position: absolute;
      top: 0px;
      bottom: 0px;
      left: 0px;

      width: 0%;

      background-color: #52c306;
      transition: all 0.2s ease;
    }
  }

  > .icon-device {
    width: 60px;
    height: 60px;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 50px;

    display: flex;

    > img {
      width: 50px;
      height: 50px;
    }

    &.spin {
      > img {
        animation-name: spin;
        animation-duration: 1200ms;
        animation-iteration-count: infinite;
        animation-timing-function: ease-in-out;
      }
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    90% {
      transform: rotate(360deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  > .description {
    font-size: 1.7vh;
    line-height: 2.7vh;
    font-weight: 400;
    font-family: "Gotham Pro";

    padding: 0px 50px;
    text-align: center;
    margin-top: 10px;
    margin-bottom: 1.8vh;

    &.flashlight {
      animation-name: flashlight;
      animation-duration: 3200ms;
      animation-iteration-count: infinite;
      animation-timing-function: linear;
    }
  }

  > .percent {
    font-size: 3.6vh;
    font-weight: 300;
    font-family: "Gotham Pro";

    margin-top: 35px;
  }

  @keyframes flashlight {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      opacity: 1;
    }
  }

  > .btn-cancel {
    width: 320px;

    position: fixed;
    bottom: 40px;

    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 2.2vh;
    font-weight: lighter;
    font-family: "Gotham Pro";
    font-variant: small-caps;
    text-transform: lowercase;

    letter-spacing: 0.3px;

    text-decoration: none;
    color: #000;
    padding: 0px;
    margin: 0px;
  }
}

.firmware-update,
.firmware-update-info-setup {
  position: fixed;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background-color: #fff;

  display: flex;
  flex-direction: column;
  align-items: center;

  z-index: 9001;

  > .title {
    width: calc(100% - 80px);
    margin: 60px 40px 20px;

    font-size: 24px;
    font-weight: lighter;
    line-height: 32px;
    color: #000;
  }

  > .content {
    margin: 0px 40px;

    > .label {
      font-size: 16px;
      font-weight: lighter;
      margin-bottom: 6px;
    }

    > .description {
      font-size: 14px;
      font-weight: 300;
      line-height: 20px;
    }

    > .setup-group {
      display: flex;
      flex-direction: column;
      margin-top: 26px;

      > .item-setup {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 20px;

        > .circle {
          flex: none;
          width: 59px;
          height: 59px;
          border-radius: 50px;
          background-color: #fff;
          margin: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-right: 25px;

          font-size: 3.2vh;
          font-weight: lighter;

          padding-top: 1px;
          padding-left: 1px;

          animation-name: flashlight;
          animation-duration: 2500ms;
          animation-iteration-count: infinite;
          animation-timing-function: linear;

          position: relative;

          &:before {
            content: "";
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            //background-color: #F8F8F8;
            border: 1px solid #e6e6e6;
            z-index: -1;

            border-radius: 50px;
          }

          &.active {
            animation-name: none;
            border: 1px solid transparent;
            background-color: #52c306;
            color: #fff;

            &:before {
              border: 1px solid transparent;
              background-color: #52c30620;
            }
          }

          @keyframes flashlight {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.2;
            }
            100% {
              opacity: 1;
            }
          }
        }

        > .description {
          font-size: 2vh;
          font-weight: 400;
          font-family: "Gotham Pro";
          text-transform: lowercase;
          font-variant: small-caps;
        }
      }
    }
  }

  > .btn-group {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    position: fixed;
    bottom: 30px;

    > .btn-sync {
      width: 320px;
      height: 70px;
      border-radius: 50px;
      background-color: #000;
      opacity: 0.8;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 2.4vh;
      font-weight: 400;
      font-family: "Gotham Pro";
      font-variant: small-caps;
      text-transform: lowercase;
      color: #fff;

      letter-spacing: 0.6px;
      opacity: 0.4;

      text-decoration: none;
      padding: 0px;
      margin: 35px 0px 25px;

      transition: all 0.2s ease;
      position: relative;

      > span {
        transition: all 0.2s ease;
        margin-bottom: 2px;
      }

      &.active {
        opacity: 1;
      }
    }

    > .btn-cancel {
      width: 320px;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 2.2vh;
      font-weight: lighter;
      font-family: "Gotham Pro";
      font-variant: small-caps;
      text-transform: lowercase;

      letter-spacing: 0.3px;

      text-decoration: none;
      color: #000;
      padding: 0px;
      margin: 0px;
    }
  }
}
</style>
