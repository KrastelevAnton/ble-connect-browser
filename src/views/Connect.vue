<template>
  <div class="global">
    <div class="wrapper-connect">
      <div class="bg-device">
        <!-- <img src="@/assets/img/bg-device.jpg" /> -->
        </div>
      <div class="spacer"></div>
      <div class="label">
        Bring somebledevice to the phone and press<br /><strong>connect</strong>
      </div>
      <div
        class="btn-connect"
        :class="connectDeviceInProcess ? 'syncing' : ''"
        @click="startFindDevice"
      >
        <div class="icon-sync">
          <div class="sync-bg"></div>
        </div>
        <span>{{ deviceConnect == true ? "Connected" : "Connect" }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, onBeforeMount, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "Connect",
  setup() {
    const store = useStore();
    const router = useRouter();

    const activeStep = ref(1);
    const connectDeviceInProcess = computed(
      () => store.state.connectDeviceInProcess
    );
    const deviceConnect = computed(() => store.state.deviceConnect);
    const startFindDevice = async () => {
      let connect = await store.dispatch("connectsomebledevice");
      if (deviceConnect.value) {
        router.push({ name: "Main" });
      } else {
        console.log("Отмена подключения устройста");
      }
    };

    onBeforeMount(() => {
      router.push({ name: "DeviceList" });
    });

    return {
      activeStep,
      startFindDevice,
      connectDeviceInProcess,
      deviceConnect,
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
