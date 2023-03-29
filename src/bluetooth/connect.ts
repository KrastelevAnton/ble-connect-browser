function toHex(d) {
  if (d.length == 1) {
    //return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
    return ("0" + d).toUpperCase();
  } else return d;
}

class somebledeviceBLE {
  public device: any;
  public server: any;
  public services: any;
  /**
   * Информация об устройстве
   */
  public deviceDetail: any = {
    name: null,
    firmware: null,
    firmwareVersion: null,
    hardware: null,
    deviceName: null,
    deviceModel: null,
    batteryLevel: 0,
    chargeStatus: false,
    puffCounter: 0,
    unixtime: 0,
    mac: null,
    cartridge: 0,
    cartridgeResistance: null,
    rssi: 0,
    tx: null,
  };

  /**
   * Список сервисов устройства
   */
  public servicesList: any = {
    deviceInfo: "device_information",
    deviceInfoUUID: "0000180a-0000-1000-8000-00805f9b34fb",
    deviceInfoIOS: 0x180a,
    battery: "0000180f-0000-1000-8000-00805f9b34fb",
    batteryIOS: 0x180f,
    service: "00005523-1212-efde-1523-785feabcd133",
    nordic: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  };

  /**
   * Список характеристик устройства
   */
  public charsList: any = {
    firmware: "00002a26-0000-1000-8000-00805f9b34fb",
    firmwareIOS: 0x2a26,
    firmwareVersion: "00001560-1212-efde-1523-785feabcd133",
    hardware: "00002a27-0000-1000-8000-00805f9b34fb",
    hardwareIOS: 0x2a27,
    deviceName: "00002a29-0000-1000-8000-00805f9b34fb",
    deviceNameIOS: 0x2a29,
    deviceModel: "00002a24-0000-1000-8000-00805f9b34fb",
    deviceModelIOS: 0x2a24,
    batteryLevel: "00002a19-0000-1000-8000-00805f9b34fb",
    batteryLevelIOS: 0x2a19,
    charge: "00001540-1212-efde-1523-785feabcd133",
    puffCounter: "00001235-1212-efde-1523-785feabcd133",
    unixtime: "00001526-1212-efde-1523-785feabcd133",
    mac: "00001570-1212-efde-1523-785feabcd133",
    cartridge: "00001580-1212-efde-1523-785feabcd133",
    cartridgeResistance: "00001590-1212-efde-1523-785feabcd133",
    rssi: "000015a0-1212-efde-1523-785feabcd133",
    rx: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
    tx: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
    nordicWrite: "6e400042-b5a3-f393-e0a9-e50e24dcca9e",
    nordicRead: "6e400043-b5a3-f393-e0a9-e50e24dcca9e",
  };

  /**
   * Экземпляры сервисов устройства
   */
  public servicesHandle: any = {
    deviceInfo: null,
    battery: null,
    service: null,
    nordic: null,
  };

  /**
   * Экземпляры характеристик устройства
   */
  public charsHandle: any = {
    deviceInfo: {
      firmware: null,
      hardware: null,
      deviceName: null,
      deviceModel: null,
    },
    battery: {
      batteryLevel: null,
      batteryLevelNotify: null,
    },
    service: {
      charge: null,
      chargeNotify: null,
      puffCounter: null,
      puffCounterNotify: null,
      unixtime: null,
      unixtimeNotify: null,
      firmwareVersion: null,
      mac: null,
      cartridge: null,
      cartridgeNotify: null,
      cartridgeResistance: null,
      cartridgeResistanceNotify: null,
      rssi: null,
      rssiNotify: null,
    },
    nordic: {
      rx: null,
      tx: null,
      txNotify: null,
      nordicWrite: null,
      nordicRead: null,
    },
  };

  public tsNavigator: any;

  constructor() {
    this.tsNavigator = window.navigator;
  }

  /* request connection to a BalenaBLE device */
  async request(device: any = null) {
    var filters = [];
    if (device == null) {
      filters = [{ name: "somebledevice" }, { namePrefix: "somebledevice" }];
    } else {
      // Выбранно устройство с определенным названием
      filters = [{ name: device.name }, { namePrefix: device.name }];
    }

    let options = {
      filters: filters,
      optionalServices: [
        this.servicesList.deviceInfo,
        this.servicesList.battery,
        this.servicesList.service,
        this.servicesList.nordic,
        0x180a,
        0x180f,
      ],
    };

    if (this.tsNavigator.bluetooth == undefined) {
      alert("This application does not support the necessary technologies");
      return false;
    }

    try {
      this.device = await this.tsNavigator.bluetooth.requestDevice(options);
      this.deviceDetail.name = this.device.name;
      return true;
    } catch (e) {
      console.log("error requestDevice");
      console.log(e);
    }

    if (!this.device) {
      //throw "Устройство не выбрано";
      console.log("Device not selected");
      return false;
    }
  }

  async getServices() {
    if (this.device) {
      this.services = await this.server.getPrimaryServices();
      for (let service of this.services) {
        console.log("Found service: " + service.uuid);
        switch (service.uuid) {
          case this.servicesList.deviceInfoUUID:
            this.servicesHandle.deviceInfo = service;
            break;
          case this.servicesList.deviceInfoIOS:
            this.servicesHandle.deviceInfo = service;
            break;
          case this.servicesList.battery:
            this.servicesHandle.battery = service;
            break;
          case this.servicesList.batteryIOS:
            this.servicesHandle.battery = service;
            break;
          case this.servicesList.service:
            this.servicesHandle.service = service;
            break;
          case this.servicesList.nordic:
            this.servicesHandle.nordic = service;
            break;
          default:
            console.log(`Неизвестный сервис ${service.uuid}`);
            break;
        }
      }
      //console.log(this.servicesHandle);
    }
  }

  async getChars() {
    if (this.device) {
      const decoder = new TextDecoder("utf-8");
      let servicesHandleList = [
        this.servicesHandle.deviceInfo,
        this.servicesHandle.battery,
        this.servicesHandle.service,
        this.servicesHandle.nordic,
      ];

      for (let service of servicesHandleList) {
        switch (service.uuid) {
          // Сервис общей информации
          case this.servicesHandle.deviceInfo.uuid:
            try {
              // Запрашиваем характеристики сервиса
              let charsList = await service.getCharacteristics();
              // Идет по списку характеристик
              for (let item of charsList) {
                switch (item.uuid) {
                  // Версия прошивки
                  case this.charsList.firmware:
                    this.charsHandle.deviceInfo.firmware = item;
                    this.deviceDetail.firmware = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Версия прошивки: ' + this.deviceDetail.firmware);
                    break;
                  // Версия устройства
                  case this.charsList.hardware:
                    this.charsHandle.deviceInfo.hardware = item;
                    this.deviceDetail.hardware = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Версия устройства: ' + this.deviceDetail.hardware);
                    break;
                  // Имя устройства
                  case this.charsList.deviceName:
                    this.charsHandle.deviceInfo.deviceName = item;
                    this.deviceDetail.deviceName = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Имя устройства: ' + this.deviceDetail.deviceName);
                    break;
                  // Модель
                  case this.charsList.deviceModel:
                    this.charsHandle.deviceInfo.deviceModel = item;
                    this.deviceDetail.deviceModel = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Модель устройства: ' + this.deviceDetail.deviceModel);
                    break;
                  // IOS
                  case this.charsList.firmwareIOS:
                    this.charsHandle.deviceInfo.firmware = item;
                    this.deviceDetail.firmware = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Версия прошивки IOS: ' + this.deviceDetail.firmware);
                    break;
                  // Версия устройства
                  case this.charsList.hardwareIOS:
                    this.charsHandle.deviceInfo.hardware = item;
                    this.deviceDetail.hardware = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Версия устройства IOS: ' + this.deviceDetail.hardware);
                    break;
                  // Имя устройства
                  case this.charsList.deviceNameIOS:
                    this.charsHandle.deviceInfo.deviceName = item;
                    this.deviceDetail.deviceName = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Имя устройства IOS: ' + this.deviceDetail.deviceName);
                    break;
                  // Модель
                  case this.charsList.deviceModelIOS:
                    this.charsHandle.deviceInfo.deviceModel = item;
                    this.deviceDetail.deviceModel = await item
                      .readValue()
                      .then((value: any) => decoder.decode(value));
                    //console.log('Модель устройства IOS: ' + this.deviceDetail.deviceModel);
                    break;
                  default:
                    console.log(`Неизвестная характеристика ${item.uuid}`);
                    break;
                }
              }
            } catch (e) {
              console.log("Ошибка при получении списка характеристик");
              console.log(e);
            }
            break;
          // Сервис батареи
          case this.servicesHandle.battery.uuid:
            try {
              // Запрашиваем характеристики сервиса
              let charsList = await service.getCharacteristics();
              // Идет по списку характеристик
              for (let item of charsList) {
                switch (item.uuid) {
                  // Батарея
                  case this.charsList.batteryLevel:
                    this.charsHandle.battery.batteryLevel = item;
                    this.deviceDetail.batteryLevel = await item
                      .readValue()
                      .then((value: any) => value.getUint8());
                    console.log(
                      "Заряд батареи: " + this.deviceDetail.batteryLevel + "%"
                    );
                    break;
                  // Батарея для IOS
                  case this.charsList.batteryLevelIOS:
                    this.charsHandle.battery.batteryLevel = item;
                    this.deviceDetail.batteryLevel = await item
                      .readValue()
                      .then((value: any) => value.getUint8());
                    console.log(
                      "Заряд батареи IOS: " +
                        this.deviceDetail.batteryLevel +
                        "%"
                    );
                    break;
                  default:
                    console.log(`Неизвестная характеристика ${item.uuid}`);
                    break;
                }
              }
            } catch (e) {
              console.log("Ошибка при получении списка характеристик");
              console.log(e);
            }
            break;
          // сервис устройства
          case this.servicesHandle.service.uuid:
            try {
              // Запрашиваем характеристики сервиса
              let charsList = await service.getCharacteristics();
              // Идет по списку характеристик
              for (let item of charsList) {
                switch (item.uuid) {
                  // Статус зарядки
                  case this.charsList.charge:
                    this.charsHandle.service.charge = item;
                    this.deviceDetail.chargeStatus = await item
                      .readValue()
                      .then((value: any) => value.getUint8());
                    //console.log('Статус зарядки: ' + this.deviceDetail.charge);
                    break;
                  // Счетчик затяжек
                  case this.charsList.puffCounter:
                    this.charsHandle.service.puffCounter = item;

                    await item.readValue().then((value: any) => {
                      let byte = [
                        toHex(value.getUint8(1).toString(16)),
                        toHex(value.getUint8(0).toString(16)),
                      ];
                      this.deviceDetail.puffCounter = parseInt(
                        byte.join(""),
                        16
                      );
                    });
                    //console.log('Количество затяжек: ' + this.deviceDetail.puffCounter);
                    break;
                  case this.charsList.unixtime:
                    this.charsHandle.service.unixtime = item;
                    // Читает не корректно - пишем через события уже во Vue
                    /*await item.readValue().then((value: any) => {
                      let byte = [toHex(value.getUint8(3)), value.getUint8(2), value.getUint8(1), toHex(value.getUint8(0))]
                      this.deviceDetail.unixtime = parseInt(byte.join(""), 16)
                    });*/

                    this.deviceDetail.unixtime = 0;
                    console.log(
                      "Время на устройстве: " + this.deviceDetail.unixtime
                    );
                    break;
                  // Версия прошивки ?
                  case this.charsList.firmwareVersion:
                    this.charsHandle.service.firmwareVersion = item;
                    this.deviceDetail.firmwareVersion = await item
                      .readValue()
                      .then((value: any) => value.getUint8());
                    //console.log('Версия прошивки Legacy: ' + this.deviceDetail.firmwareVersion);
                    break;
                  // Mac
                  case this.charsList.mac:
                    this.charsHandle.service.mac = item;
                    this.deviceDetail.mac = await item
                      .readValue()
                      .then((value: any) => {
                        let macHex = new Uint8Array(value.buffer).map(
                          (x: any) => parseInt(x, 10)
                        );
                        let macHexArray: any = [];
                        for (let i in macHex) {
                          let num: any = Number(macHex[i]).toString(16);
                          if (num.length < 2) {
                            num += "0";
                            num = num.split("").reverse().join("");
                          }

                          macHexArray.push(num);
                        }
                        return macHexArray.join(":").toUpperCase();
                      });
                    //console.log('MAC: ' + this.deviceDetail.mac);
                    break;
                  // Cartridge ID
                  case this.charsList.cartridge:
                    this.charsHandle.service.cartridge = item;
                    this.deviceDetail.cartridge = await item
                      .readValue()
                      .then((value: any) => value.getUint8());
                    //console.log('Cartridge: ' + this.deviceDetail.cartridge);
                    break;
                  // Cartridge Resistance
                  case this.charsList.cartridgeResistance:
                    this.charsHandle.service.cartridgeResistance = item;

                    await item.readValue().then((value: any) => {
                      let byte = [
                        toHex(value.getUint8(3).toString(16)),
                        value.getUint8(2).toString(16),
                        value.getUint8(1).toString(16),
                        toHex(value.getUint8(0).toString(16)),
                      ];
                      this.deviceDetail.cartridgeResistance = parseInt(
                        byte.join(""),
                        16
                      );
                    });
                    break;
                  // RSSI
                  case this.charsList.rssi:
                    this.charsHandle.service.rssi = item;
                    this.deviceDetail.rssi = await item
                      .readValue()
                      .then((value: any) => value.getInt8());
                    //console.log('Rssi: ' + this.deviceDetail.rssi);
                    break;
                  default:
                    console.log(`Неизвестная характеристика ${item.uuid}`);
                    break;
                }
              }
            } catch (e) {
              console.log("Ошибка при получении списка характеристик");
              console.log(e);
            }
            break;
          // NORDIC SERVICE
          case this.servicesHandle.nordic.uuid:
            try {
              // Запрашиваем характеристики сервиса
              let charsList = await service.getCharacteristics();
              // Идем по списку характеристик
              for (let item of charsList) {
                switch (item.uuid) {
                  case "6e400043-b5a3-f393-e0a9-e50e24dcca9e": //this.charsList.tx:
                    this.charsHandle.nordic.tx = item;
                    this.deviceDetail.tx = await item
                      .readValue()
                      .then((value: any) => value);
                    break;
                  // Nordic Write Command
                  case this.charsList.nordicWrite:
                    this.charsHandle.nordic.nordicWrite = item;
                    break;
                  case this.charsList.nordicRead:
                    this.charsHandle.nordic.nordicRead = item;
                    break;
                  default:
                    console.log(`Неизвестная характеристика ${item.uuid}`);
                    break;
                }
              }
            } catch (e) {
              console.log("Ошибка при получении списка характеристик");
              console.log(e);
            }
            break;
        }
      }
      // await service.getCharacteristics();
    }
  }

  async startCommand(command: number[]) {
    if (!this.device) {
      console.log("Устройство не подключено");
      return false;
    }

    try {
      let result = await this.charsHandle.nordic.nordicWrite.writeValue(
        new Uint8Array(command)
      );
      console.log(`# ~ Пишет ${command} в NORDIC`);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* connect to device */
  async connect() {
    if (!this.device) {
      return Promise.reject("Device is not connected");
    }

    try {
      this.server = await this.device.gatt.connect();
      console.log("Подключились к серверу GATT");
      await this.getServices();
      await this.getChars();
      console.log("Устройство подключено");
      return { connect: true };
    } catch (e) {
      console.log(e);
      return { connect: false };
    }
  }

  /* disconnect from peripheral */
  disconnect() {
    if (!this.device) {
      //return Promise.reject("Отключаем устройство");
      console.log("Отключаем не подключенное устройство");
      return false;
    } else {
      this.device.gatt.disconnect();
      return { connected: false };
    }
  }
}

export default somebledeviceBLE;
