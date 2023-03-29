import { createStore, storeKey } from "vuex";
import somebledeviceBLE from "../bluetooth/connect";
import router from "../router/index";
import axios from "axios";
import Cookies from "js-cookie";
import { AsYouType } from "libphonenumber-js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
require("dayjs/locale/en");

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.locale("en");

let somebledeviceGlobal = null;

const server = process.env.VUE_APP_SERVER;
console.log(process.env);
// Обработка 401 ошибки
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.status === 401) {
      return { result: false, error: "Unauthorized" };
    }
    return error;
  }
);

function toHex(d) {
  if (d.length == 1) {
    //return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
    return ("0" + d).toUpperCase();
  } else return d;
}

const getMonthByNumber = (number: any, local: any) => {
  switch (number) {
    case 0:
      return local == "en" ? "January" : "Январь";
      break;
    case 1:
      return local == "en" ? "February" : "Февраль";
      break;
    case 2:
      return local == "en" ? "March" : "Март";
      break;
    case 3:
      return local == "en" ? "April" : "Апрель";
      break;
    case 4:
      return local == "en" ? "May" : "Май";
      break;
    case 5:
      return local == "en" ? "June" : "Июнь";
      break;
    case 6:
      return local == "en" ? "July" : "Июль";
      break;
    case 7:
      return local == "en" ? "August" : "Август";
      break;
    case 8:
      return local == "en" ? "September" : "Сентябрь";
      break;
    case 9:
      return local == "en" ? "October" : "Октябрь";
      break;
    case 10:
      return local == "en" ? "November" : "Ноябрь";
      break;
    case 11:
      return local == "en" ? "December" : "Декабрь";
      break;
  }
};

function getDateTime() {
  var now: any = new Date();
  var year: any = now.getFullYear();
  var month: any = now.getMonth() + 1;
  var day: any = now.getDate();
  var hour: any = now.getHours();
  var minute: any = now.getMinutes();
  var second: any = now.getSeconds();
  if (month.toString().length == 1) {
    month = "0" + month;
  }
  if (day.toString().length == 1) {
    day = "0" + day;
  }
  if (hour.toString().length == 1) {
    hour = "0" + hour;
  }
  if (minute.toString().length == 1) {
    minute = "0" + minute;
  }
  if (second.toString().length == 1) {
    second = "0" + second;
  }
  var dateTime =
    year + "/" + month + "/" + day + " " + hour + ":" + minute + ":" + second;
  return dateTime;
}

function eventPuff(event: any) {
  let puffCount = event.target.value.getUint16().toString(16).split("");

  let v = event.target.value;
  let byte = [
    toHex(v.getUint8(1).toString(16)),
    toHex(v.getUint8(0).toString(16)),
  ];
  let byteString = parseInt(byte.join(""), 16);

  let context = event.currentTarget.context;

  console.log(getDateTime(), "> Event puff count is " + byteString);
  context.commit("setPuffCount", byteString);

  context.dispatch("getDeviceLastPuff");
}

function eventRssi(event: any) {
  let v = event.target.value.getUint8();
  let context = event.currentTarget.context;
  //console.log(v)
  context.commit("setRssi", v);
}

function eventUnixtime(event: any) {
  let v = event.target.value;
  let byte = [
    toHex(v.getUint8(3).toString(16)),
    toHex(v.getUint8(2).toString(16)),
    toHex(v.getUint8(1).toString(16)),
    toHex(v.getUint8(0).toString(16)),
  ];
  let byteString = parseInt(byte.join(""), 16);

  let context = event.currentTarget.context;

  //console.log(getDateTime(), '> Unix time ' + byteString)
  context.commit("setUnixtime", byteString);
}

function eventCharge(event: any) {
  let chargeStatus = event.target.value.getUint8();
  let context = event.currentTarget.context;
  context.commit("setChargeStatus", chargeStatus);
  console.log(getDateTime(), "> Charge status " + chargeStatus);

  if (chargeStatus)
    context.dispatch("startNotifyTooltip", {
      message: `Charging connected `,
      icon: "charge",
    });
  else
    context.dispatch("startNotifyTooltip", {
      message: `Charging disconnected`,
      icon: "charge",
    });
}

function eventBattery(event: any) {
  let battery = event.target.value.getUint8();
  let context = event.currentTarget.context;

  context.commit("setBatteryLevel", battery);
  console.log(getDateTime(), "> Заряд батареи " + battery);
  if (battery < 7) {
    context.dispatch("startNotifyTooltip", {
      message: `Заряд ${battery}%`,
      icon: "charge",
    });
  }
}

function eventCartridge(event: any) {
  let cartridge = event.target.value.getUint8();
  let context = event.currentTarget.context;

  context.commit("setCartridge", cartridge);
  console.log(getDateTime(), "> Картридж " + cartridge);

  // Записываем событие картриджа
  context.state.confirmCartridgeEvent++;
  console.log(`EVENTS: ` + context.state.confirmCartridgeEvent);

  if (cartridge > 0)
    context.dispatch("startNotifyTooltip", {
      message: `POD is connected`,
      icon: "tasty",
    });
  else
    context.dispatch("startNotifyTooltip", {
      message: `POD is disconnected`,
      icon: "tasty",
    });
}

function eventCartridgeResistance(event: any) {
  let v = event.target.value;
  let byte = [
    toHex(v.getUint8(3).toString(16)),
    v.getUint8(2).toString(16),
    v.getUint8(1).toString(16),
    toHex(v.getUint8(0).toString(16)),
  ];
  let byteString = parseInt(byte.join(""), 16);

  let context = event.currentTarget.context;

  context.commit("setCartridgeResistance", byteString);
  console.log(getDateTime(), "> Сопротивление " + byteString);
  cartrigeTastyDetect(context);
}

function cartrigeTastyDetect(context: any) {
  let list = context.state.cartridgeList;
  let cartrdigeId = parseInt(context.state.deviceDetail.cartridge); // change id
  let cartridgeResistance = context.state.deviceDetail.cartridgeResistance; // change resistance

  let detect = 0;
  for (let item of list) {
    let start = parseInt(item["range_start"]);
    let end = parseInt(item["range_end"]);

    if (cartridgeResistance >= start && cartridgeResistance <= end) {
      detect = 1;
      context.state.cartridgeTasty = item["tasty"];
    }
  }

  if (detect == 0) {
    if (cartridgeResistance == 0) {
      context.state.cartridgeTasty = null;
    } else {
      context.state.cartridgeTasty = "Undetermined";
    }
  }
}

function eventNordic(event: any) {
  if (event.target.value) {
    const data = new DataView(event.target.value.buffer);
    let context = event.currentTarget.context;

    let lastCommand = context.state.lastSendCommandNordic;
    console.log(`SEND: ` + lastCommand);
    // Чтение Power Control
    if (lastCommand[0] == 0x80 && lastCommand[1] == 0x88) {
      let powerRange = parseInt(toHex(data.getUint8(0).toString(16)), 16);
      console.log("Power range: " + powerRange);
      context.state.powerControl = parseInt(powerRange.toString());

      // Чтение ограничения кол-во затяжек
    } else if (lastCommand[0] == 0x80 && lastCommand[1] == 0x99) {
      let puffLimit = parseInt(toHex(data.getUint8(6).toString(16)), 16);
      let timeLimitFirst = parseInt(toHex(data.getUint8(4).toString(16)), 16);
      let timeLimitSecond = parseInt(toHex(data.getUint8(3).toString(16)), 16);

      timeLimitFirst = timeLimitFirst + 255 * timeLimitSecond;
      context.state.puffLimit = puffLimit;
      context.state.puffLimitTime = timeLimitFirst;

      console.log("Puff limit: " + puffLimit);
      // Читаем данные затяжек
    } else {
      let timestamp =
        toHex(data.getUint8(3).toString(16)) +
        toHex(data.getUint8(2).toString(16)) +
        toHex(data.getUint8(1).toString(16)) +
        toHex(data.getUint8(0).toString(16));

      timestamp = parseInt(timestamp, 16);
      let resistance = parseInt(toHex(data.getUint8(4).toString(16)), 16);
      let duration = parseInt(
        toHex(data.getUint8(6).toString(16)) +
          toHex(data.getUint8(5).toString(16)),
        16
      );

      let pack = {
        timestamp: timestamp,
        resistance: resistance,
        duration: duration,
      };

      // Устанавливаем затяжки + последнюю затяжку
      context.commit("setPuffData", pack);
      //console.log(getDateTime(), '> TX: ' + JSON.stringify(pack));

      if (!context.state.sync && context.state.deviceDetail.unixtime != 0) {
        context.dispatch("sendPuffLast");
      }
    }
  }
}

export default createStore({
  state: {
    hasFocus: true,
    // Auth token
    token: null,
    server: server,
    userProfile: null,
    userDevices: [],

    openSettings: false,
    openPopupUpdate: false,
    openPopupUpdateDfu: false,
    openPopupRadio: false,
    openPopupMessage: false,
    popupMessageText: null,
    openPopupPin: null,
    openPopupPinSms: null,

    openPopupUpdateNotAllowed: false,

    onboard: false,
    statusUpdateNow: false,
    // Если сами выбираем подключение другого устройства
    forceAnyConnect: false,
    // Если прошиваем
    notRedirectConnect: false,
    // Происходит ли синхронизация
    sync: false,
    syncEvent: false,
    // Синхронизация затяжек для интерфейса - до старта реальной синхронизации
    puffSyncing: false,
    // syncProgressBar
    puffSyncingProgressBar: null,
    puffSyncingProgressCount: 0,
    puffSyncingAllCount: 0,

    // Идет ли поиск устройства
    deviceFindStatus: false,

    // Количество событий картриджем для подтверждения действия (считаем от 2)ж
    confirmCartridgeEvent: 0,

    deviceConnect: false,
    deviceDetail: {
      name: "",
      firmware: "",
      firmwareVersion: "",
      hardware: "",
      deviceName: "",
      deviceModel: "",
      batteryLevel: 0,
      chargeStatus: false,
      puffCounter: 0,
      unixtime: 0,
      mac: "",
      cartridge: 0,
      cartridgeResistance: "",
      rssi: 0,
      tx: null,
    },
    // Ожидание для повторной отправки смс
    waitTimerSms: 0,
    globalPuffCount: 0,
    puffEventUpdateDay: false,
    // timestamp: timestamp, cartidge (resistante), pufftime
    puffDevice: [],
    lastPuffDevice: {},
    prevPuffDevice: {},
    // Обновить график?
    chartUpdate: false,
    // Список картриджей
    cartridgeList: [],
    cartridgeTasty: null,

    notifyTooltip: {
      status: false,
      message: null,
      icon: null,
    },

    // BLE Object
    somebledevice: null,
    firmwareToken: null,
    firmwareData: {
      version: null,
      description: null,
      file: null,
    },
    connectDeviceInProcess: false,
    // Есть ли обновление - окно
    alertUpdateStatus: false,
    // Если нет обновления
    alertNotAllowedUpdate: false,
    // Затяжки для графика
    puffs: {
      month: [],
      week: [],
      day: [],
    },

    lastSendCommandNordic: [],
    powerControl: 0,
    puffLimit: 0,
    puffLimitTime: 0,
  },
  mutations: {
    setSlideupConnectDevice(state, payload) {
      //state.slideupConnectDevice = payload;
    },

    setAlertUpdateStatus(state, payload) {
      state.alertUpdateStatus = payload;
    },

    setAlertNotAllowedUpdate(state, payload) {
      console.log("alertNotAllowedUpdate");
      state.alertNotAllowedUpdate = payload;
    },

    setFirmwareToken(state, payload) {
      state.firmwareToken = payload;
    },

    setUserProfile(state, payload) {
      state.userProfile = payload;
    },

    setUserDevices(state, payload) {
      state.userDevices = payload;
    },

    setCartridgeList(state, payload) {
      state.cartridgeList = payload;
    },

    setFirmwareData(state, payload) {
      state.firmwareData = payload;
    },

    setRssi(state, payload) {
      state.deviceDetail.rssi = payload;
    },

    setUnixtime(state, payload) {
      state.deviceDetail.unixtime = payload;
    },

    setsomebledeviceHandle(state, payload) {
      state.somebledevice = payload;
      somebledeviceGlobal = payload;
    },

    setOpenPopupUpdate(state, payload) {
      state.openPopupUpdate = payload;
    },

    setOpenPopupUpdateNotAllowed(state, payload) {
      state.openPopupUpdateNotAllowed = payload;
    },

    setStartNotifyTooltip(state, payload) {
      state.notifyTooltip.status = true;
      state.notifyTooltip.message = payload.message;
      state.notifyTooltip.icon = payload.icon;
    },

    setStopNotifyTooltip(state) {
      state.notifyTooltip.status = false;
    },

    setConnectDeviceInProcess(state, payload) {
      state.connectDeviceInProcess = payload;
    },

    setGlobalPuffCount(state, payload) {
      state.globalPuffCount = payload;
    },

    setDeviceConnect(state, payload) {
      state.deviceConnect = payload;
    },

    setDeviceDetail(state, payload) {
      state.deviceDetail = payload;
    },

    setPuffCount(state, payload) {
      state.deviceDetail.puffCounter = payload;
    },

    setChargeStatus(state, payload) {
      state.deviceDetail.chargeStatus = payload;
    },

    setBatteryLevel(state, payload) {
      state.deviceDetail.batteryLevel = payload;
    },

    setCartridge(state, payload) {
      state.deviceDetail.cartridge = payload;
    },

    setCartridgeResistance(state, payload) {
      state.deviceDetail.cartridgeResistance = payload;
    },

    setPuffs(state, payload) {
      console.log(payload);
      state.puffs = payload;
    },

    // ! PUFF
    setPuffData(state, payload) {
      let unix = state.deviceDetail.unixtime;
      let now_utc0 = Math.floor(dayjs().valueOf() / 1000); // + (timezone * 60);
      let diff = now_utc0 - unix;

      payload.timestamp_fix = payload.timestamp;
      payload.timestamp = parseInt(payload.timestamp) + diff;
      payload.power = state.powerControl;

      const calcLow = 0.0003454231434;
      const calcNorm = 0.0004492867573;
      const calcHigh = 0.0006051437216;
      let totalCalc = null;

      switch (payload.power) {
        case 70:
          totalCalc = calcLow;
          break;
        case 73:
          totalCalc = calcNorm;
          break;
        case 120:
          totalCalc = calcHigh;
          break;
        default:
          totalCalc = calcNorm;
      }

      payload.n = (payload.duration / 1000) * totalCalc;

      // Сохраняем список затяжек только для синхронизации
      if (!state.puffDevice.includes(payload.timestamp) && state.sync) {
        // Создаем пак
        state.puffDevice.push(payload);
      }

      // Последняя затяжка из сервиса
      state.lastPuffDevice = payload;
    },
  },
  actions: {
    async deviceRegistration(context) {
      let sendData = {
        mac: context.state.deviceDetail.mac,
        firmware: context.state.deviceDetail.firmware,
        device:
          context.state.deviceDetail.deviceName +
          " " +
          context.state.deviceDetail.deviceModel,
      };

      let { data } = await axios({
        url: server + "/api/reg",
        method: "post",
        data: sendData,
      });

      if (data["result"]) {
        Cookies.set("token", data["token"], { expires: 7 });
        context.state.token = data["token"];

        if (data["token"])
          axios.defaults.headers.common["authorization"] = data["token"];
        return data;
      } else return false;
    },

    async deviceLogin(context, mac) {
      let sendData = {
        mac: context.state.deviceDetail.mac,
        firmware: context.state.deviceDetail.firmware,
        device: context.state.deviceDetail.deviceName,
      };

      let { data } = await axios({
        url: server + "/api/auth",
        method: "post",
        data: sendData,
      });

      if (data["token"]) {
        Cookies.set("token", data["token"], { expires: 7 });
        context.state.token = data["token"];

        axios.defaults.headers.common["authorization"] = data["token"];
      }

      return data;
    },

    async checkUser(context, mac) {
      let sendData = {
        mac: context.state.deviceDetail.mac,
      };

      let { data } = await axios({
        url: server + "/api/users/check",
        method: "post",
        data: sendData,
      });

      return data;
    },

    // ! GET USER PROFILE
    async getUserProfile(context, mac) {
      let { data } = await axios.get(context.state.server + "/api/profile");
      if (data["result"]) {
        data["data"]["phoneFormat"] = new AsYouType().input(
          data["data"]["phone"]
        );

        context.commit("setUserProfile", data["data"]);
        return data;
      }
    },

    // ! GET USER DEVICES
    async getUserDevices(context, mac) {
      let { data } = await axios.get(
        context.state.server + "/api/profile/devices"
      );
      if (data["result"]) {
        context.commit("setUserDevices", data["data"]);
        return data;
      }
    },

    // ! GET USER DEVICES
    async checkDevicePin(context, code) {
      let mac = context.state.deviceDetail.mac;
      let { data } = await axios.post(
        context.state.server + "/api/profile/devices/check",
        { pin: code, mac: mac }
      );
      return data;
    },

    // ! ADD DEVICES FROM USER
    async addDeviceFromUser(context, pin) {
      let deviceDetail = context.state.deviceDetail;
      try {
        let { data } = await axios({
          method: "post",
          url: context.state.server + "/api/profile/devices",
          data: {
            name: deviceDetail.name,
            mac: deviceDetail.mac,
            firmware: deviceDetail.firmware,
            hw: deviceDetail.hardware == null ? 0 : deviceDetail.hardware,
            deviceName:
              deviceDetail.deviceName + " " + deviceDetail.deviceModel,
            pin: pin,
          },
        });

        if (data["result"]) {
          await context.dispatch("getUserDevices");
        }

        return data;
      } catch (e) {
        console.log(e);
      }
    },

    async updateDeviceFromUser(context, pin) {
      let deviceDetail = context.state.deviceDetail;
      let { data } = await axios.put(
        context.state.server + "/api/profile/devices",
        {
          name: deviceDetail.name,
          mac: deviceDetail.mac,
          firmware: deviceDetail.firmware,
          hw: deviceDetail.hardware == null ? 0 : deviceDetail.hardware,
          deviceName: deviceDetail.deviceName + " " + deviceDetail.deviceModel,
          pin: pin,
        }
      );

      return data;
    },

    async removeDevice(context, id) {
      let { data } = await axios.delete(
        context.state.server + "/api/profile/devices/" + id
      );
      if (data["result"] == true) {
        await context.dispatch("getUserDevices");
        return true;
      }
    },

    async getCartridge(context) {
      let { data } = await axios({
        url: server + "/api/cartridge",
        method: "get",
      });

      if (data) {
        context.commit("setCartridgeList", data["data"]);
        return data;
      }
    },

    async ping(context) {
      setInterval(async () => {
        let { data } = await axios.get(server + "/api/ping");
      }, 5000);
    },

    async autoLogin(context) {
      /*let token = Cookies.get('token');
      
      if (token) {
        axios.defaults.headers.common['authorization'] = token;
        let checkToken = await axios.get('http://localhost:3000/api/check');
        if (checkToken['result']) {
          // ok
          console.log('token exists ok')
        }
      } else {*/
      let checkUser = await context.dispatch("checkUser");
      // Если пользователь существует - авторизуемся
      if (checkUser["count"] > 0) {
        let login = await context.dispatch("deviceLogin");
        if (login["result"]) {
          // ok
          console.log("# ~ Авторизовались");
        } else {
          console.log("# ~ Ошибка авторизации");
        }
      } else {
        let reg = await context.dispatch("deviceRegistration");
        if (reg["result"]) {
          // ok
          console.log("# ~ Зарегистрировались");
        }
      }
      //}
    },

    async getLastFirmwareVersion(context, key) {
      // Добавить передачу мака для фильтра по группам
      let { data } = await axios.post(server + "/api/update/last", {
        hw: context.state.deviceDetail.hardware,
      });

      if (data["count"] > 0) {
        data["data"]["file"] = server + "/uploads/" + data["data"].filename;
        context.commit("setFirmwareData", data["data"]);
        return data["data"];
      } else {
        console.log("Не удалось получить версию прошивки");
        return false;
      }
    },

    // Получаем затяжки с сервера и конвертируем в формат для графиков
    async getPuffs(context, type) {
      let tz =
        (new Date().getTimezoneOffset() < 0
          ? Math.abs(new Date().getTimezoneOffset())
          : new Date().getTimezoneOffset() -
            new Date().getTimezoneOffset() * 2) * 60;

      let { data } = await axios.post(server + "/api/puff/stats", {
        tz: tz,
        mac: context.state.deviceDetail.mac,
        type: type,
      });
      if (data["data"]["hour"].length) {
        await context.dispatch("convertPuffs", data);

        // AVARAGE
        let dayWeekAvarage = {};
        let count = 0;
        let currentHour = parseInt(dayjs().format("HH"));
        for (let existDay of context.state.puffs["day"]) {
          if (count < 7) {
            dayWeekAvarage[existDay.date] = 0;
            let avarage = 0;
            for (let index in existDay.data) {
              if (parseInt(index) <= currentHour)
                avarage = avarage + parseInt(existDay.data[index]);
            }

            avarage = Math.floor(avarage / currentHour);
            dayWeekAvarage[existDay.date] = avarage;
          }

          count++;
        }

        let avarageScore = 0;
        for (let index in dayWeekAvarage) {
          avarageScore = avarageScore + dayWeekAvarage[index];
        }

        avarageScore = Math.floor(
          avarageScore / Object.keys(dayWeekAvarage).length
        );
        console.log(`avarageScore: ` + avarageScore);
        context.state.puffs["day"][0].avarage = avarageScore;
      }
    },

    async resetState(context) {
      context.state.openSettings = false;
      context.state.openPopupUpdate = false;
      context.state.openPopupUpdateDfu = false;
      context.state.openPopupRadio = false;
      context.state.openPopupMessage = false;
      context.state.popupMessageText = null;
      context.state.openPopupPin = null;
      (context.state.openPopupPinSms = null),
        (context.state.openPopupUpdateNotAllowed = false);

      context.state.onboard = false;
      context.state.statusUpdateNow = false;
      // Если сами выбираем подключение другого устройства
      context.state.forceAnyConnect = false;
      // Если прошиваем
      context.state.notRedirectConnect = false;
      // Происходит ли синхронизация
      context.state.sync = false;
      context.state.syncEvent = false;
      // Синхронизация затяжек для интерфейса - до старта реальной синхронизации
      context.state.puffSyncing = false;
      // syncProgressBar
      context.state.puffSyncingProgressBar = null;
      context.state.puffSyncingProgressCount = 0;
      context.state.puffSyncingAllCount = 0;

      // Идет ли поиск устройства
      context.state.deviceFindStatus = false;

      // Количество событий картриджем для подтверждения действия (считаем от 2)ж
      context.state.confirmCartridgeEvent = 0;

      context.state.deviceConnect = false;
      context.state.deviceDetail = {
        name: "",
        firmware: "",
        firmwareVersion: "",
        hardware: "",
        deviceName: "",
        deviceModel: "",
        batteryLevel: 0,
        chargeStatus: false,
        puffCounter: 0,
        unixtime: 0,
        mac: "",
        cartridge: 0,
        cartridgeResistance: "",
        rssi: 0,
        tx: null,
      };
      // Ожидание для повторной отправки смс
      context.state.waitTimerSms = 0;
      context.state.globalPuffCount = 0;
      context.state.puffEventUpdateDay = false;
      // timestamp: timestamp, cartidge (resistante), pufftime
      context.state.puffDevice = [];
      context.state.lastPuffDevice = {};
      context.state.prevPuffDevice = {};
      // Обновить график?
      context.state.chartUpdate = false;
      // Список картриджей
      context.state.cartridgeList = [];
      context.state.cartridgeTasty = null;

      // BLE Object
      (context.state.somebledevice = null),
        (context.state.firmwareToken = null),
        (context.state.firmwareData = {
          version: null,
          description: null,
          file: null,
        });

      context.state.connectDeviceInProcess = false;
      // Есть ли обновление - окно
      context.state.alertUpdateStatus = false;
      // Если нет обновления
      context.state.alertNotAllowedUpdate = false;
      // Затяжки для графика
      context.state.puffs = {
        month: [],
        week: [],
        day: [],
      };

      context.state.lastSendCommandNordic = [];
      context.state.powerControl = 0;
      context.state.puffLimit = 0;
      context.state.puffLimitTime = 0;
      window.location.reload();
    },

    async convertPuffs(context, data) {
      context.commit("setPuffs", {
        month: [],
        day: [],
        week: [],
      });

      let json = data["data"];
      let hour = json["hour"];
      let day = json["day"];
      //let week = json['week'];
      //let month = json['month'];
      let dayFormat = {};
      let hourFormat = {};

      if (hour.length) {
        // ? Удаляем пустые промежутки в датах - например не курили 3 дня и значит - добавляем эти три дня как пустые данные
        // ! remove EMPTY RANGE DAY
        let fixedStartDay = dayjs(day[day.length - 1].date);
        let fixedEndDay = dayjs();

        while (!fixedStartDay.isSame(fixedEndDay.add(1, "day"), "day")) {
          let monthDayFix: any = fixedStartDay.month() + 1;
          monthDayFix =
            monthDayFix < 10 ? "0" + monthDayFix.toString() : monthDayFix;
          let date = dayjs(fixedStartDay).format("YYYY-MM-DD");

          dayFormat[date] = {};
          fixedStartDay = fixedStartDay.add(1, "day");
        }

        for (let item in day) {
          day[item]["puff_time_all"] = (
            day[item]["puff_time_all"] / 1000
          ).toFixed(1);
          day[item]["puff_time_min"] = (
            day[item]["puff_time_min"] / 1000
          ).toFixed(1);
          day[item]["puff_time_max"] = (
            day[item]["puff_time_max"] / 1000
          ).toFixed(1);

          day[item]["n"] = (day[item]["n"] * 1000).toFixed(2);
          dayFormat[day[item].date] = day[item];
        }

        for (let item in dayFormat) {
          if (!Object.keys(dayFormat[item]).length)
            dayFormat[item] = {
              date: item,
              count: 0,
              puff_time_all: 0,
              puff_time_max: 0,
              puff_time_min: 0,
              n: 0,
            };
        }

        day = [];
        for (let item of Object.keys(dayFormat).reverse()) {
          day.push(dayFormat[item]);
        }
        // ---

        // ? Удаляем пустые промежутки в часах - например не курили 3 дня и значит - добавляем эти три дня как пустые данные в часах
        // ! remove EPMTY RANGE HOUR
        let fixedStartHour = dayjs(
          dayjs(dayjs(hour[hour.length - 1].date).startOf("day")).format(
            "YYYY-MM-DD HH:mm:00"
          )
        );
        let fixedEndHour = dayjs(
          dayjs(dayjs().endOf("day")).format("YYYY-MM-DD HH:00:00")
        );

        while (!fixedStartHour.isSame(fixedEndHour.add(1, "hour"), "hour")) {
          let date = fixedStartHour.format("YYYY-MM-DD HH:00:00");

          hourFormat[date] = {};
          fixedStartHour = fixedStartHour.add(1, "hour");
        }

        for (let item in hour) {
          hour[item]["puff_time_all"] = (
            hour[item]["puff_time_all"] / 1000
          ).toFixed(1);
          hour[item]["puff_time_min"] = (
            hour[item]["puff_time_min"] / 1000
          ).toFixed(1);
          hour[item]["puff_time_max"] = (
            hour[item]["puff_time_max"] / 1000
          ).toFixed(1);

          hour[item]["n"] = (hour[item]["n"] * 1000).toFixed(2);
          hourFormat[hour[item].date] = hour[item];
        }

        for (let item in hourFormat) {
          if (!Object.keys(hourFormat[item]).length)
            hourFormat[item] = {
              date: item,
              count: 0,
              n: 0,
              puff_time_all: 0,
              puff_time_max: 0,
              puff_time_min: 0,
            };
        }

        hour = [];
        for (let item of Object.keys(hourFormat).reverse()) {
          hour.push(hourFormat[item]);
        }
        // --

        //! ДАННЫЕ ВНУТРИ СУТОК
        let dayDataBuff = {};
        // Собираем часы в дни
        for (let i = 0; i < hour.length; i++) {
          //let monthDayFix = dayjs(hour[i].date).month() + 1;
          let date = dayjs(hour[i].date).format("YYYY-MM-DD"); //`${dayjs(hour[i].date).year()}-${monthDayFix}-${dayjs(hour[i].date).date()}`;

          if (!Object.keys(dayDataBuff).includes(date)) dayDataBuff[date] = [];

          dayDataBuff[date].push(hour[i]);
        }

        let dayData = [];
        for (let item in dayDataBuff) {
          let dayOfWeekIndex = 0;
          switch (dayjs(item).day()) {
            case 0:
              dayOfWeekIndex = 6;
              break;
            case 1:
              dayOfWeekIndex = 0;
              break;
            case 2:
              dayOfWeekIndex = 1;
              break;
            case 3:
              dayOfWeekIndex = 2;
              break;
            case 4:
              dayOfWeekIndex = 3;
              break;
            case 5:
              dayOfWeekIndex = 4;
              break;
            case 6:
              dayOfWeekIndex = 5;
              break;
          }

          var date = new Date(item);
          let dayName = date.toLocaleDateString("en-EN", { weekday: "long" });

          let dataObject = {
            date: dayjs(item).format("YYYY-MM-DD"),
            year: dayjs(item).year(),
            month: dayjs(item).format("MM"),
            day: dayjs(item).date(),
            monthName: getMonthByNumber(dayjs(item).month(), "en"),
            dateName: dayjs(item).format("DD MMMM") + ` (${dayName})`,
            data: [],
            nicotine: [],
            duration: [],
            labels: [],
            avarage: 0,
            avarageNicotine: 0,
            avarageDuration: 0,
            count: 0,
            countNicotine: 0,
            countDuration: 0,
          };

          for (let hour in dayDataBuff[item]) {
            let d = dayDataBuff[item][hour];

            dataObject.labels.push(dayjs(d["date"]).hour());
            dataObject.data.push(parseInt(d["count"]));
            dataObject.nicotine.push(parseFloat(d["n"]));
            dataObject.duration.push(parseFloat(d["puff_time_all"]));

            dataObject.count += parseInt(d["count"]);
            dataObject.countNicotine += parseFloat(d["n"]);
            dataObject.countDuration += parseFloat(d["puff_time_all"]);
          }

          dataObject.avarage = Math.floor(
            dataObject.count / dataObject.data.length
          );
          dataObject.avarageDuration = Number(
            dataObject.countDuration / dataObject.duration.length
          );
          dataObject.avarageNicotine = Number(
            dataObject.countNicotine / dataObject.nicotine.length
          );

          dataObject.labels.reverse();
          dataObject.data.reverse();
          dataObject.duration.reverse();
          dataObject.nicotine.reverse();

          if (dataObject.labels.length < 24) {
            let buffHour = [];
            let buffData = [];
            let buffDataDuration = [];
            let buffDataNicotine = [];
            let buffMergeLabels = [];
            let buffMergeData = [];
            let buffMergeDataDuration = [];
            let buffMergeDataNicotine = [];

            if (dataObject.labels[0] != 0) {
              for (let i = 0; i < dataObject.labels[0]; i++) {
                buffHour.push(i);
                buffData.push(0);
                buffMergeLabels = buffHour.concat(dataObject.labels);
                buffMergeData = buffHour.concat(dataObject.data);
                buffMergeDataDuration = buffHour.concat(dataObject.duration);
                buffMergeDataNicotine = buffHour.concat(dataObject.nicotine);
              }

              dataObject.data = buffMergeData;
              dataObject.duration = buffMergeDataDuration;
              dataObject.nicotine = buffMergeDataNicotine;
              dataObject.labels = buffMergeLabels;
            } else {
              let len = dataObject.labels[dataObject.labels.length - 1];
              for (let i = len + 1; i <= 23; i++) {
                dataObject.labels.push(i);
                dataObject.data.push(0);
                dataObject.duration.push(0);
                dataObject.nicotine.push(0);
              }
            }
          }

          //! LABELS FIX - ADD 0 to number 0..9
          let labelsFixed = [];
          for (let item of dataObject.labels) {
            let hourValue = null;
            if (item < 10) labelsFixed.push("0" + item.toString());
            else labelsFixed.push(item.toString());
          }

          dataObject.labels = labelsFixed;
          dayData.push(dataObject);
        }

        //! ДАННЫЕ ПО НЕДЕЛЯМ
        let weekDataBuff = {};
        // Собираем дни в недели
        for (let i = 0; i < day.length; i++) {
          const start = dayjs(day[i].date).startOf("week");
          const startOf = dayjs(start["$d"]).format("YYYY-MM-DD");

          if (!Object.keys(weekDataBuff).includes(startOf))
            weekDataBuff[startOf] = [];

          weekDataBuff[startOf].push(day[i]);
        }

        let weekData = [];
        for (let item in weekDataBuff) {
          let monthDayFix = dayjs(item).month() + 1;
          let dataObject = {
            date: dayjs(item).format("YYYY-MM-DD"),
            year: dayjs(item).year(),
            month: dayjs(item).format("MM"),
            monthName: getMonthByNumber(dayjs(item).month(), "en"),
            dateNameStartWeek: dayjs(item).format("DD MMMM"),
            dateNameEndWeek: dayjs(dayjs(item).endOf("week")["$d"]).format(
              "DD MMMM"
            ),
            data: [],
            duration: [],
            nicotine: [],
            labels: [],
            avarage: 0,
            avarageNicotine: 0,
            avarageDuration: 0,
            count: 0,
            countNicotine: 0,
            countDuration: 0,
          };

          for (let day in weekDataBuff[item]) {
            let d = weekDataBuff[item][day];
            dataObject.labels.push(dayjs(d["date"]).date());
            dataObject.data.push(d["count"]);
            dataObject.duration.push(parseFloat(d["puff_time_all"]));
            dataObject.nicotine.push(parseFloat(d["n"]));

            dataObject.count += parseInt(d["count"]);
            dataObject.countDuration += parseFloat(d["puff_time_all"]);
            dataObject.countNicotine += parseFloat(d["n"]);
          }

          dataObject.avarage = Math.floor(
            dataObject.count / dataObject.data.length
          );
          dataObject.avarageDuration = Number(
            dataObject.countDuration / dataObject.data.length
          );
          dataObject.avarageNicotine = Number(
            dataObject.countNicotine / dataObject.data.length
          );

          dataObject.labels = dataObject.labels.reverse();
          dataObject.data = dataObject.data.reverse();
          dataObject.duration = dataObject.duration.reverse();
          dataObject.nicotine = dataObject.nicotine.reverse();

          if (dataObject.labels.length != 7) {
            if (dataObject.labels[0] != dayjs(dataObject.date).date()) {
              let first =
                dataObject.year +
                "-" +
                dataObject.month +
                "-" +
                dataObject.labels[0];
              let start = dayjs(dayjs(dataObject.date).startOf("week")["$d"]);

              let buffDate = dayjs(start);
              let buffArrLabels = [];
              let buffArrData = [];
              while (dayjs(first).date() != buffDate.date()) {
                buffArrLabels.push(buffDate.date());
                buffArrData.push(0);
                buffDate = buffDate.add(1, "day");
              }

              let mergeLabels = buffArrLabels.concat(dataObject.labels);

              dataObject.labels = mergeLabels;
              dataObject.data = buffArrData.concat(dataObject.data);
              dataObject.duration = buffArrData.concat(dataObject.duration);
              dataObject.nicotine = buffArrData.concat(dataObject.nicotine);
            } else {
              let last =
                dataObject.year +
                "-" +
                dataObject.month +
                "-" +
                dataObject.labels[dataObject.labels.length - 1];
              let endOf = dayjs(dayjs(dataObject.date).endOf("week")["$d"]);

              let count = 0;
              let buffDate = dayjs(last);

              while (endOf.date() != buffDate.date()) {
                buffDate = buffDate.add(1, "day");
                dataObject.labels.push(buffDate.date());
                dataObject.data.push(0);
                dataObject.duration.push(0);
                dataObject.nicotine.push(0);
              }
            }
          }

          weekData.push(dataObject);
        }

        //! ДАННЫЕ ПО МЕСЯЦАМ
        let monthDataBuff = {};
        // Собираем дни в месяцы
        for (let i = 0; i < day.length; i++) {
          if (
            !Object.keys(monthDataBuff).includes(
              dayjs(day[i].date).format("YYYY-MM")
            )
          )
            monthDataBuff[dayjs(day[i].date).format("YYYY-MM")] = [];

          monthDataBuff[dayjs(day[i].date).format("YYYY-MM")].push(day[i]);
        }

        let monthData = [];
        for (let item in monthDataBuff) {
          let dataObject = {
            date: dayjs(item).format("YYYY-MM"),
            year: dayjs(item).year(),
            month: dayjs(item).format("MM"),
            monthName: getMonthByNumber(dayjs(item).month(), "en"),
            data: [],
            duration: [],
            nicotine: [],
            labels: [],
            avarage: 0,
            avarageNicotine: 0,
            avarageDuration: 0,
            count: 0,
            countNicotine: 0,
            countDuration: 0,
          };

          for (let day in monthDataBuff[item]) {
            let d = monthDataBuff[item][day];
            dataObject.labels.push(dayjs(d["date"]).date());
            dataObject.data.push(d["count"]);
            dataObject.duration.push(parseFloat(d["puff_time_all"]));
            dataObject.nicotine.push(parseFloat(d["n"]));

            dataObject.count += parseInt(d["count"]);
            dataObject.countDuration += parseFloat(d["puff_time_all"]);
            dataObject.countNicotine += parseFloat(d["n"]);
          }

          dataObject.avarage = Math.floor(
            dataObject.count / dataObject.data.length
          );
          dataObject.avarageDuration = Number(
            dataObject.countDuration / dataObject.data.length
          );
          dataObject.avarageNicotine = Number(
            dataObject.countNicotine / dataObject.data.length
          );

          dataObject.labels = dataObject.labels.reverse();
          dataObject.data = dataObject.data.reverse();
          dataObject.duration = dataObject.duration.reverse();
          dataObject.nicotine = dataObject.nicotine.reverse();

          //Проверяем сколько записей в данных о месяце - если это последний месяц, чтобы не было на графике обыва по датам
          let dayOfMonth = dayjs(dataObject.date).daysInMonth();
          if (dataObject.data.length != dayOfMonth) {
            let maxDay = dataObject.labels[dataObject.labels.length - 1];
            // Заполняем пустотой промежутки дней без данных (определяем в какой части месяца не хватает данных - с первых чисел или с последних)
            if (maxDay != dayOfMonth) {
              for (
                let i = dataObject.labels[dataObject.labels.length - 1];
                i <= dayOfMonth;
                i++
              ) {
                dataObject.data.push(0);
                dataObject.duration.push(0);
                dataObject.nicotine.push(0);
                dataObject.labels.push(i);
              }
            } else {
              let buffData = [];
              let buffLabels = [];
              for (let i = 1; i < dataObject.labels[0]; i++) {
                buffData.push(0);
                buffLabels.push(i);
              }

              let concatLabels = buffLabels.concat(dataObject.labels);

              dataObject.labels = concatLabels;
              dataObject.data = buffData.concat(dataObject.data);
              dataObject.duration = buffData.concat(dataObject.duration);
              dataObject.nicotine = buffData.concat(dataObject.nicotine);
            }
          }
          monthData.push(dataObject);
        }
        //! END MONTH DATA

        context.commit("setPuffs", {
          month: monthData,
          day: dayData,
          week: weekData,
        });
      }
    },

    async startNotifyTooltip(context, { message, icon }) {
      context.commit("setStartNotifyTooltip", {
        message: message,
        icon: icon,
      });

      setTimeout(() => context.commit("setStopNotifyTooltip"), 2700);
    },

    async checkFirmwareUpdate(context, fast = false) {
      let updateLast = await context.dispatch("getLastFirmwareVersion");

      if (updateLast) {
        let fwDeviceVersion = context.state.deviceDetail.firmware;
        let serverVersion = context.state.firmwareData["version"];

        if (fwDeviceVersion !== serverVersion) {
          if (!fast) {
            setTimeout(() => {
              context.commit("setOpenPopupUpdate", true);
              console.log("# ~ Доступно обновление");
            }, 3600);
          } else {
            context.commit("setOpenPopupUpdate", true);
          }
          return true;
        } else {
          console.log("# ~ Нет доступных обновлений");
          return false;
        }
      }
    },

    // Сохранение пака затяжек
    async sendPuffGroupToServer(context) {
      let puffDevice = context.state.puffDevice;
      // Статус синхронизации - завершено (чтобы новые затяжки писало в eventPuff сразу в базу)
      context.state.sync = false;
      let tz =
        (new Date().getTimezoneOffset() < 0
          ? Math.abs(new Date().getTimezoneOffset())
          : new Date().getTimezoneOffset() -
            new Date().getTimezoneOffset() * 2) * 60;

      let { data } = await axios.post(server + "/api/puff-group", {
        data: puffDevice,
        tz: tz,
        mac: context.state.deviceDetail.mac,
      });
      if (data["result"]) {
        // Очищаем журнал затяжек на устройстве
        await context.dispatch("setCommandNordic", [0xda]);
        // Обновляем кол-во затяжек
        await context.dispatch("getCountPuff", true);
        // Получаем затяжки
        await context.dispatch("getPuffs", "device");
        // Обновляем графиу
        context.state.chartUpdate = true;
      }
    },

    // Сохрание еденичной затяжки
    async sendPuffLast(context) {
      let lastPuffDevice = context.state.lastPuffDevice;
      let prevPuffDevice = context.state.prevPuffDevice;
      // Предыдущий объект затяжки - так как пересчет срабатывает на любое событие eventPuff - после удаления в 0 с устройства - так же происходит пересчет
      // и отправляет запрос со старым объектом - через сравнения нового и предыдущего решаем эту проблему
      if (
        Object.keys(lastPuffDevice).length > 0 &&
        lastPuffDevice["timestamp_fix"] != prevPuffDevice["timestamp_fix"]
      ) {
        // Увеличиваем общее количетсво затяжек
        ++context.state.globalPuffCount;
        context.state.prevPuffDevice = context.state.lastPuffDevice;

        lastPuffDevice["tz"] =
          (new Date().getTimezoneOffset() < 0
            ? Math.abs(new Date().getTimezoneOffset())
            : new Date().getTimezoneOffset() -
              new Date().getTimezoneOffset() * 2) * 60;
        lastPuffDevice["mac"] = context.state.deviceDetail.mac;

        // Статус синхронизации - завершено (чтобы новые затяжки писало в eventPuff сразу в базу)
        context.state.sync = false;
        let { data } = await axios.post(server + "/api/puff", lastPuffDevice);
        if (data["result"]) {
          // Если сегодня это первая затяжка - то обновляем данные с графика получая с сервера
          if (context.state.globalPuffCount == 1) {
            console.log("Получаем список затяжек после первой затяжки");
            await context.dispatch("getPuffs", "device");
            await context.dispatch("getCountPuff");
            //context.state.chartUpdate = true;
          }

          let ts =
            (context.state.lastPuffDevice["timestamp"] + lastPuffDevice["tz"]) *
            1000;
          // Готовим данные для добавления в графики
          let hourData = {
            date: dayjs(ts).format("YYYY-MM-DD"),
            hour: dayjs(ts).utc().format("HH"),
          };

          let dayData = {
            date: dayjs(ts).format("YYYY-MM-DD"),
            year: dayjs(ts).format("YYYY"),
            month: dayjs(ts).format("MM"),
            day: dayjs(ts).format("DD"),
            weekStart: dayjs(ts).startOf("week").format("YYYY-MM-DD"),
            weekEnd: dayjs(ts).endOf("week").format("YYYY-MM-DD"),
          };

          // День недели как индекс
          let dayOfWeekIndex = 0;
          switch (dayjs(ts).day()) {
            case 0:
              dayOfWeekIndex = 6;
              break;
            case 1:
              dayOfWeekIndex = 0;
              break;
            case 2:
              dayOfWeekIndex = 1;
              break;
            case 3:
              dayOfWeekIndex = 2;
              break;
            case 4:
              dayOfWeekIndex = 3;
              break;
            case 5:
              dayOfWeekIndex = 4;
              break;
            case 6:
              dayOfWeekIndex = 5;
              break;
          }

          // День месяца как индекс
          let dayOfMonthIndex = dayjs(ts).date() - 1;

          // hour
          if (context.state.puffs.day.length > 0) {
            console.log(context.state.puffs.day);
            for (let index in context.state.puffs.day) {
              if (context.state.puffs.day[index]["date"] == hourData["date"]) {
                // Записываем данные по часам
                // Если текущий затяжки больше чем на графике - подтягиваем график
                if (
                  context.state.globalPuffCount -
                    context.state.puffs.day[0]["count"] ==
                  1
                ) {
                  context.state.puffs.day[index]["data"][
                    parseInt(hourData["hour"])
                  ] += 1;
                  context.state.puffs.day[index]["count"] += 1;

                  context.state.puffs.day[index]["nicotine"][
                    parseInt(hourData["hour"])
                  ] += Number((lastPuffDevice["n"] * 1000).toFixed(2));
                  context.state.puffs.day[index]["countNicotine"] += Number(
                    (lastPuffDevice["n"] * 1000).toFixed(2)
                  );
                  context.state.puffs.day[index]["duration"][
                    parseInt(hourData["hour"])
                  ] += Number((lastPuffDevice["duration"] / 1000).toFixed(1));
                  context.state.puffs.day[index]["countDuration"] += Number(
                    (lastPuffDevice["duration"] / 1000).toFixed(1)
                  );

                  // week
                  if (context.state.puffs.week.length > 0) {
                    for (let index in context.state.puffs.week) {
                      if (
                        context.state.puffs.week[index]["date"] ==
                        dayData["weekStart"]
                      ) {
                        // Если текущий счеткик равен дневному то добавляем (чтобы избежать лишних увеличений)
                        context.state.puffs.week[index]["data"][
                          dayOfWeekIndex
                        ] += 1;
                        context.state.puffs.week[index]["count"] += 1;

                        context.state.puffs.week[index]["nicotine"][
                          dayOfWeekIndex
                        ] += Number((lastPuffDevice["n"] * 1000).toFixed(2));
                        context.state.puffs.week[index]["countNicotine"] +=
                          Number((lastPuffDevice["n"] * 1000).toFixed(2));
                        context.state.puffs.week[index]["duration"][
                          dayOfWeekIndex
                        ] += Number(
                          (lastPuffDevice["duration"] / 1000).toFixed(1)
                        );
                        context.state.puffs.week[index]["countDuration"] +=
                          Number(
                            (lastPuffDevice["duration"] / 1000).toFixed(1)
                          );
                      }
                    }
                  }

                  // month
                  if (context.state.puffs.month.length > 0) {
                    console.log(hourData["hour"]);
                    for (let index in context.state.puffs.month) {
                      if (
                        context.state.puffs.month[index]["date"] ==
                        `${dayData["year"]}-${dayData["month"]}`
                      ) {
                        // Если текущий счеткик равен дневному то добавляем (чтобы избежать лишних увеличений)
                        context.state.puffs.month[index]["data"][
                          dayOfMonthIndex
                        ] += 1;
                        context.state.puffs.month[index]["count"] += 1;

                        context.state.puffs.month[index]["nicotine"][
                          dayOfMonthIndex
                        ] += Number((lastPuffDevice["n"] * 1000).toFixed(2));
                        context.state.puffs.month[index]["countNicotine"] +=
                          Number((lastPuffDevice["n"] * 1000).toFixed(2));
                        context.state.puffs.month[index]["duration"][
                          dayOfMonthIndex
                        ] += Number(
                          (lastPuffDevice["duration"] / 1000).toFixed(1)
                        );
                        context.state.puffs.month[index]["countDuration"] +=
                          Number(
                            (lastPuffDevice["duration"] / 1000).toFixed(1)
                          );
                      }
                    }
                  }
                }

                console.log(context.state.puffs.day[index]["count"]);
              }
            }
          }

          // Открываем обновления графика в Main.vue в watchEffect (без этого будет обновлять каждую секунду)
          context.state.puffEventUpdateDay = true;
          // Очищаем журнал затяжек на устройстве
          await context.dispatch("setCommandNordic", [0xda]);
        }
        return data;
      }
    },

    async setCommandNordic(context, command) {
      context.state.lastSendCommandNordic = command;
      await somebledeviceGlobal.startCommand(command);
    },

    async clearsomebledeviceHandle(context) {
      if (somebledeviceGlobal != null) {
        // Убираем кол-во событий картриджа чтобы в случае добавлении нового устройства считались подтверждения
        context.state.confirmCartridgeEvent = 0;
        await somebledeviceGlobal.disconnect();
        await context.dispatch("stopGattNotify", somebledeviceGlobal);
        context.state.somebledevice = null;
        somebledeviceGlobal = null;
      }
    },

    async returnGlobalsomebledevice(context) {
      return somebledeviceGlobal;
    },

    async findDeviceVibration(context) {
      let status = context.state.deviceFindStatus;
      if (status == true) {
        // Включаем
        await context.dispatch("setCommandNordic", [0xaa]);
      } else {
        // Отключаем
        await context.dispatch("setCommandNordic", [0xaa]);
      }
    },

    async setDeviceOverPuff(context, payload) {
      function toHex(d) {
        return "0x" + ("0" + Number(d).toString(16)).slice(-2).toUpperCase();
      }

      let puff = payload.puff;
      let time = payload.time;

      if (puff > 100) puff = 100;

      if (puff < 1) puff = 0;

      let puffHex = toHex(puff);

      let timePage = 0;
      let timeSize = 0;
      if (time / 255 > 1) {
        timePage = Math.floor(time / 255);
        let offset = timePage * 255;
        timeSize = time - offset;
      } else {
        timePage = 0;
        timeSize = time;
      }
      let timePageHex = toHex(timePage); //new Number(timePage).toString(16);
      let timeSizeHex = toHex(timeSize); //new Number(timeSize).toString(16);

      console.log(puffHex);

      console.log(
        `${timePageHex} / ${timePage}, ${timeSizeHex} / ${timeSize}, ${puffHex}`
      );
      await context.dispatch("setCommandNordic", [
        0x99,
        0x01,
        0x00,
        0x00,
        timePageHex,
        timeSizeHex,
        0x00,
        puffHex,
      ]);
      // Получаем данные о настройке
      setTimeout(() => {
        context.dispatch("getDeviceOverPuff");
      }, 1000);
    },

    async getDeviceOverPuff(context) {
      console.log("getDeviceOverPuff");
      await context.dispatch("setCommandNordic", [0x80, 0x99]);
    },

    async setPowerControl(context, type) {
      function toHex(d) {
        return "0x" + ("0" + Number(d).toString(16)).slice(-2).toUpperCase();
      }

      //6.5 7.3 8.1

      let low = toHex(7 * 10);
      let medium = toHex(7.4 * 10);
      let max = toHex(12 * 10);

      switch (type) {
        case "low":
          context.dispatch("setCommandNordic", [0x88, 0x01, low]);
          break;
        case "medium":
          context.dispatch("setCommandNordic", [0x88, 0x01, medium]);
          break;
        case "max":
          context.dispatch("setCommandNordic", [0x88, 0x01, max]);
          break;
      }

      // Получаем настройки Power Control
      setTimeout(() => {
        context.dispatch("getPowerControl");
      }, 500);
    },

    async getPowerControl(context) {
      console.log("getPowerControl");
      await context.dispatch("setCommandNordic", [0x80, 0x88]);
    },

    // uploaded - sendPuffGroup ?
    async getCountPuff(context, uploaded = false) {
      let tz =
        (new Date().getTimezoneOffset() < 0
          ? Math.abs(new Date().getTimezoneOffset())
          : new Date().getTimezoneOffset() -
            new Date().getTimezoneOffset() * 2) * 60;
      // Затяжки за последний день
      let { data } = await axios.post(server + "/api/puff-count", {
        tz: tz,
        mac: context.state.deviceDetail.mac,
      });
      if (data != undefined) {
        if (data["result"] == true) {
          if (uploaded != true) {
            let count = data["data"].length > 0 ? data["data"][0]["count"] : 0;
            count = count + context.state.deviceDetail.puffCounter;
            context.commit("setGlobalPuffCount", count);
          } else {
            // Если что-то загружали на сервер - обнуляем счетчик
            context.state.deviceDetail.puffCounter = 0;
            context.commit("setGlobalPuffCount", data["data"][0]["count"]);
          }
        } else {
          await context.dispatch("clearsomebledeviceHandle");
        }
      }
    },

    async getDevicePuffs(context) {
      context.state.sync = true;

      function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      function toHex(d) {
        return "0x" + ("0" + Number(d).toString(16)).slice(-2).toUpperCase();
      }

      // Текущее не синхронизированное количество затяжек в устройстве
      let puffCount = context.state.deviceDetail.puffCounter;

      if (puffCount) {
        let nextStep = 0;
        let lStep = 0;
        let i = 0;
        let status = true;
        while (i <= puffCount) {
          if (lStep == 256) {
            nextStep++;
            lStep = 0;
          }

          context
            .dispatch("setCommandPuff", [
              0xfd,
              toHex(nextStep),
              toHex(lStep),
              0xfd,
            ])
            .then((res) => {
              if (res == true) {
                ++lStep;
                ++i;
                status = true;
                context.state.puffSyncingProgressBar = (
                  (i / puffCount) *
                  100
                ).toFixed(2);
                context.state.puffSyncingProgressCount = i;
                context.state.puffSyncingAllCount =
                  context.state.deviceDetail.puffCounter;
                console.log([0xfd, toHex(nextStep), toHex(lStep), 0xfd]);
                console.log(
                  `Puff number: ${i} / ${puffCount} - ${(
                    (i / puffCount) *
                    100
                  ).toFixed(2)} %`
                );
              } else {
                status = false;
              }
            });

          // comment
          if (status) await sleep(50);
          else await sleep(300);
        }
      }
      await sleep(2000);
      return true;
    },

    async setCommandPuff(context, command) {
      context.state.lastSendCommandNordic = command;
      let data = await somebledeviceGlobal.startCommand(command);
      return data;
    },

    // Последняя затяжка из устройства
    async getDeviceLastPuff(context) {
      function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      function toHex(d) {
        return "0x" + ("0" + Number(d).toString(16)).slice(-2).toUpperCase();
      }

      // Текущее не синхронизированное количество затяжек в устройстве
      let puffCount = context.state.deviceDetail.puffCounter;

      if (puffCount) {
        let num = Math.floor(puffCount / 255);
        let count = puffCount - num * 255;
        let data = context.dispatch("setCommandNordic", [
          0xfd,
          toHex(num),
          toHex(count),
          0xfd,
        ]);
      }

      return true;
    },

    async initData(context) {
      //let authorize = await context.dispatch('autoLogin');
      //Список картриджей
      await context.dispatch("getCartridge");
      //Устанавливаем вкус
      cartrigeTastyDetect(context);
      //Количество затяжек за текущий день
      await context.dispatch("getCountPuff");
      //Получаем статистику с сервера
      let puffs = await context.dispatch("getPuffs", "device");
      //Проверяем обновления
      let checkUpdate = await context.dispatch("checkFirmwareUpdate");
    },

    async connectsomebledeviceDeviceList(context, device) {
      console.log(`${getDateTime()} Запускаем подключение..`);
      const somebledevice = new somebledeviceBLE();
      context.commit("setsomebledeviceHandle", somebledevice);

      try {
        context.commit("setConnectDeviceInProcess", true);
        try {
          let request = await somebledevice.request(device);
          console.log(request);
        } catch (e) {
          console.log(e);
        }

        let connectStatus = await somebledevice.connect();
        // Убираем ручной коннект другого устройства
        context.state.forceAnyConnect = false;
        console.log(getDateTime(), somebledevice.device);

        if (connectStatus) {
          // Данные устройства
          context.commit("setDeviceDetail", await somebledevice.deviceDetail);
          console.table(await somebledevice.deviceDetail);
          // Статус процесса подключения - подключились

          console.log(getDateTime(), context.state.deviceDetail);
          console.log(getDateTime(), context.state.deviceDetail.deviceName);

          try {
            console.log(context.state.puffs);
            // Устройство подключено (статус анимации)
            context.commit("setConnectDeviceInProcess", false);
            // Устройство подключено
            context.commit("setDeviceConnect", true);

            setTimeout(() => {
              context.dispatch("getDeviceOverPuff");
            }, 1100);
            setTimeout(() => {
              context.dispatch("getPowerControl");
            }, 1200);

            setTimeout(() => {
              let deviceFullName =
                `${context.state.deviceDetail.deviceName} ${context.state.deviceDetail.deviceModel}`.toUpperCase();
              setTimeout(() => {
                context.dispatch("startNotifyTooltip", {
                  message: `${deviceFullName} connected`,
                  icon: "device",
                });
              }, 600);
            }, 600);
          } catch (e) {
            console.log(e);
          }
        }

        somebledevice.device.addEventListener(
          "gattserverdisconnected",
          async function (event: any) {
            console.log(getDateTime(), "Дисконнент");

            // Устройство отключено
            context.commit("setDeviceConnect", false);
            let deviceFullName =
              `${context.state.deviceDetail.deviceName} ${context.state.deviceDetail.deviceModel}`.toUpperCase();
            context.dispatch("startNotifyTooltip", {
              message: `${deviceFullName} disconnected`,
              icon: "device",
            });

            if (
              context.state.forceAnyConnect == false &&
              context.state.notRedirectConnect == false
            ) {
              // Очищаем соединение
              await context.dispatch("clearsomebledeviceHandle");
              // Запрещаем реконнект
              /*
            let connectInterval = setInterval(async () => {
                let statusConnect = await somebledevice.connect();
                
                if (statusConnect && !context.state.notRedirectConnect) {
                  // Устройство подключено
                    context.commit('setDeviceConnect', true);
                    // Данные устройства
                    context.commit('setDeviceDetail', await somebledevice.deviceDetail);
                    // перезапускаем
                    await context.dispatch('stopGattNotify', somebledevice);
                    await context.dispatch('startGattNotify', somebledevice);

                    context.dispatch('startNotifyTooltip', {message: `Соединениие восстановлено`, icon: 'device'});
                    // Останавливаем попытки подключения
                    clearInterval(connectInterval);
                } else {
                  context.commit('setDeviceConnect', true);
                  context.commit('setSlideupConnectDevice', true);
                }
            }, 3000);*/
            }
          }
        );

        await context.dispatch("startGattNotify", somebledevice);
      } catch (e) {
        context.commit("setConnectDeviceInProcess", false);
        console.log(getDateTime(), e);
        console.log(getDateTime(), "Ошибка подключения к устройству");
      }
    },

    async connectsomebledevice(context) {
      console.log(`${getDateTime()} Запускаем подключение..`);
      const somebledevice = new somebledeviceBLE();
      context.commit("setsomebledeviceHandle", somebledevice);

      try {
        context.commit("setConnectDeviceInProcess", true);
        try {
          await somebledevice.request();
        } catch (e) {
          console.log(e);
        }

        let connectStatus = await somebledevice.connect();
        // Убираем ручной коннект другого устройства
        context.state.forceAnyConnect = false;
        console.log(getDateTime(), somebledevice.device);

        if (connectStatus) {
          // Данные устройства
          context.commit("setDeviceDetail", await somebledevice.deviceDetail);
          console.table(await somebledevice.deviceDetail);
          // Статус процесса подключения - подключились

          console.log(getDateTime(), context.state.deviceDetail);
          console.log(getDateTime(), context.state.deviceDetail.deviceName);

          try {
            let authorize = await context.dispatch("autoLogin");
            // Список картриджей
            await context.dispatch("getCartridge");
            // Устанавливаем вкус
            cartrigeTastyDetect(context);
            // Количество затяжек за текущий день
            await context.dispatch("getCountPuff");
            // Получаем статистику с сервера
            let puffs = await context.dispatch("getPuffs", "device");

            console.log(context.state.puffs);
            // Устройство подключено
            context.commit("setConnectDeviceInProcess", false);
            // Устройство подключено
            context.commit("setDeviceConnect", true);
            //Проверяем обновления
            let checkUpdate = await context.dispatch("checkFirmwareUpdate");

            setTimeout(() => {
              let deviceFullName =
                `${context.state.deviceDetail.deviceName} ${context.state.deviceDetail.deviceModel}`.toUpperCase();
              setTimeout(() => {
                context.dispatch("startNotifyTooltip", {
                  message: `${deviceFullName} connected`,
                  icon: "device",
                });
              }, 600);
            }, 600);
          } catch (e) {
            console.log(e);
          }
        }

        somebledevice.device.addEventListener(
          "gattserverdisconnected",
          async function (event: any) {
            console.log(getDateTime(), "Дисконнент");

            // Устройство отключено
            context.commit("setDeviceConnect", false);
            let deviceFullName =
              `${context.state.deviceDetail.deviceName} ${context.state.deviceDetail.deviceModel}`.toUpperCase();
            context.dispatch("startNotifyTooltip", {
              message: `${deviceFullName} disconnected`,
              icon: "device",
            });

            if (
              context.state.forceAnyConnect == false &&
              context.state.notRedirectConnect == false
            ) {
              let connectInterval = setInterval(async () => {
                let statusConnect = await somebledevice.connect();

                if (statusConnect && !context.state.notRedirectConnect) {
                  // Устройство подключено
                  context.commit("setDeviceConnect", true);
                  // Данные устройства
                  context.commit(
                    "setDeviceDetail",
                    await somebledevice.deviceDetail
                  );
                  // перезапускаем
                  await context.dispatch("stopGattNotify", somebledevice);
                  await context.dispatch("startGattNotify", somebledevice);

                  context.dispatch("startNotifyTooltip", {
                    message: `Connection restored`,
                    icon: "device",
                  });
                  // Останавливаем попытки подключения
                  clearInterval(connectInterval);
                } else {
                  context.commit("setDeviceConnect", true);
                  context.commit("setSlideupConnectDevice", true);
                }
              }, 3000);
            }
          }
        );

        await context.dispatch("startGattNotify", somebledevice);
      } catch (e) {
        context.commit("setConnectDeviceInProcess", false);
        console.log(getDateTime(), e);
        console.log(getDateTime(), "Ошибка подключения к устройству");
      }
    },

    async stopGattNotify(context, somebledevice) {
      // rssi
      try {
        somebledevice.charsHandle.service.rssi.removeEventListener(
          "characteristicvaluechanged",
          eventRssi
        );
        somebledevice.charsHandle.service.rssi = null;
        //await somebledevice.charsHandle.service.unixtime.stopNotifications();
      } catch (e) {
        console.log("error rssi event");
        console.log(e);
      }

      try {
        somebledevice.charsHandle.service.unixtime.removeEventListener(
          "characteristicvaluechanged",
          eventUnixtime
        );
        somebledevice.charsHandle.service.unixtime = null;
        //await somebledevice.charsHandle.service.unixtime.stopNotifications();
      } catch (e) {
        console.log("error unixtime event");
        console.log(e);
      }

      try {
        somebledevice.charsHandle.service.puffCounter.removeEventListener(
          "characteristicvaluechanged",
          eventPuff
        );
        somebledevice.charsHandle.service.puffCounter = null;
        //await somebledevice.charsHandle.service.puffCounter.stopNotifications();
      } catch (e) {
        console.log("error puff event");
        console.log(e);
      }

      // Статус зарядки
      try {
        somebledevice.charsHandle.service.charge.removeEventListener(
          "characteristicvaluechanged",
          eventCharge
        );
        somebledevice.charsHandle.service.charge = null;
        //somebledevice.charsHandle.service.charge.stopNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }

      try {
        // Процент заряда
        somebledevice.charsHandle.battery.batteryLevel.removeEventListener(
          "characteristicvaluechanged",
          eventBattery
        );
        somebledevice.charsHandle.battery.batteryLevel = null;
        //await somebledevice.charsHandle.battery.batteryLevel.stopNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }

      try {
        // Картридж
        somebledevice.charsHandle.service.cartridge.removeEventListener(
          "characteristicvaluechanged",
          eventCartridge
        );
        somebledevice.charsHandle.service.cartridge = null;
        //await somebledevice.charsHandle.service.cartridge.stopNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }

      try {
        // Картридж сопротивление
        somebledevice.charsHandle.service.cartridgeResistance.removeEventListener(
          "characteristicvaluechanged",
          eventCartridgeResistance
        );
        somebledevice.charsHandle.service.cartridgeResistance = null;
        //await somebledevice.charsHandle.service.cartridgeResistance.stopNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }
    },

    async startGattNotify(context, somebledevice) {
      console.log(getDateTime(), "Start dispatch events..");

      // rssi
      try {
        somebledevice.charsHandle.service.rssi.addEventListener(
          "characteristicvaluechanged",
          eventRssi
        );
        somebledevice.charsHandle.service.rssi.context = context;

        await somebledevice.charsHandle.service.rssi.startNotifications();
      } catch (e) {
        console.log("error rssi event");
        console.log(e);
      }

      // Unixtime
      try {
        somebledevice.charsHandle.service.unixtime.addEventListener(
          "characteristicvaluechanged",
          eventUnixtime
        );
        somebledevice.charsHandle.service.unixtime.context = context;

        await somebledevice.charsHandle.service.unixtime.startNotifications();
      } catch (e) {
        console.log("error unixtime event");
        console.log(e);
      }

      // Подписываемся на события затяжек
      try {
        somebledevice.charsHandle.service.puffCounter.addEventListener(
          "characteristicvaluechanged",
          eventPuff
        );
        somebledevice.charsHandle.service.puffCounter.context = context;

        await somebledevice.charsHandle.service.puffCounter.startNotifications();
      } catch (e) {
        console.log("error puff event");
        console.log(e);
      }

      // Статус зарядки
      try {
        somebledevice.charsHandle.service.charge.addEventListener(
          "characteristicvaluechanged",
          eventCharge
        );
        somebledevice.charsHandle.service.charge.context = context;

        await somebledevice.charsHandle.service.charge.startNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }

      try {
        // Процент заряда
        somebledevice.charsHandle.battery.batteryLevel.addEventListener(
          "characteristicvaluechanged",
          eventBattery
        );
        somebledevice.charsHandle.battery.batteryLevel.context = context;

        await somebledevice.charsHandle.battery.batteryLevel.startNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }

      try {
        // Картридж
        somebledevice.charsHandle.service.cartridge.addEventListener(
          "characteristicvaluechanged",
          eventCartridge
        );
        somebledevice.charsHandle.service.cartridge.context = context;

        await somebledevice.charsHandle.service.cartridge.startNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }

      try {
        // Картридж
        somebledevice.charsHandle.service.cartridgeResistance.addEventListener(
          "characteristicvaluechanged",
          eventCartridgeResistance
        );
        somebledevice.charsHandle.service.cartridgeResistance.context = context;

        await somebledevice.charsHandle.service.cartridgeResistance.startNotifications();
      } catch (e) {
        console.log(getDateTime(), e);
      }

      try {
        // Nordic
        somebledevice.charsHandle.nordic.tx.addEventListener(
          "characteristicvaluechanged",
          eventNordic
        );
        somebledevice.charsHandle.nordic.tx.context = context;

        await somebledevice.charsHandle.nordic.tx.startNotifications();
        console.log("Start tx event..");
      } catch (e) {
        console.log("Error tx event..");
        // Ошибка характеристики - отключаем
        context.commit("setDeviceConnect", false);
        console.log(getDateTime(), e);
      }
    },
  },
  modules: {},
});
