<template>
  <div class="swiper mySwiper">
    <div class="swiper-wrapper">
      <div class="swiper-slide">
        <div class="wrapper">
          <div class="bg-filter"></div>
          <div class="header">
            <div class="nav">
              <div class="logo">
                <!-- <img src="@/assets/img/logo_x.svg" /> -->
                </div>
              <div class="menu" @click="setOpenSettings">
                <!-- <img src="@/assets/img/menu.svg" /> -->
              </div>
            </div>
            <div class="general-info">
              <div class="info-content">
                <ul>
                  <li>
                    <div class="icon">
                      <img
                        :src="
                          require(`@/assets/img/icon-rssi-${rssiSignalType}.svg`)
                        "
                      />
                    </div>
                    {{ rssiSignal }}
                  </li>
                  <li>
                    <div class="icon">
                      <img
                        :src="
                          !statusCharge
                            ? require(`@/assets/img/battery-${
                                statusChargeAnimate ? statusChargeAnimate : 40
                              }.svg`)
                            : require('@/assets/img/battery-charge.svg')
                        "
                      />
                    </div>
                    {{ valueBattery }}%
                  </li>
                  <li>
                    <div class="icon">
                      <!-- <img src="@/assets/img/tasty.svg" /> -->
                      </div>
                    {{
                      cartridgeType ? cartridgeType : "No cartridge installed"
                    }}
                  </li>
                </ul>
                <div class="btn-radio" @click="setOpenPopupRadio">
                  <!-- <img src="@/assets/img/radio.svg" /> -->
                  Find the somebledevice X
                </div>
              </div>
              <div class="preview">
                <!-- <img src="@/assets/img/device.png" /> -->
              </div>
            </div>
          </div>

          <div class="spacer"></div>

          <div class="block-counter">
            <div class="date">
              Today, <strong>{{ today["today"] }}</strong>
            </div>

            <div class="counter-info">
              <transition name="fade" mode="out-in">
                <div class="syncing" v-if="puffSyncing">
                  <!--  -->
                  <div class="icon-sync">
                    <div class="sync-bg"></div>
                  </div>

                  <div class="label">Synchronization</div>

                  <div class="progress" v-if="puffSyncingAllCount">
                    <!-- v-if="puffSyncingAllCount" -->
                    <div class="progress-bar">
                      <div
                        class="progress-line"
                        :style="`width: ${puffSyncingProgressBar}%;`"
                      ></div>
                    </div>
                    <div class="progress-count">
                      {{ puffSyncingProgressCount }} / {{ puffSyncingAllCount }}
                    </div>
                  </div>
                </div>
              </transition>

              <div class="total">
                <div class="arrow">
                  <img
                    :src="
                      globalPuffCount > statsAvarageDay
                        ? require('@/assets/img/trend-up.svg')
                        : require('@/assets/img/trend-down.svg')
                    "
                  />
                </div>
                <div class="count">{{ globalPuffCount }}</div>
                <div class="label">Puffs per day</div>
              </div>
              <div class="prev">
                <div
                  class="question"
                  @click="
                    setMessage(
                      'The average value is calculated from the number of puffs of the previous day'
                    )
                  "
                >
                  <!-- <img src="@/assets/img/question.svg" /> -->
                </div>
                <div class="count">{{ statsAvarageDay }}</div>
                <div class="label">
                  Average {{ getStatusWordAvarage(activeStatsTab) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="swiper-slide">
        <div class="wrapper-stats">
          <div class="type-tabs">
            <div class="tabs">
              <div
                class="tab"
                :class="chartType == 'data' ? 'active' : ''"
                @click="switchChartType('data')"
              >
                Puffs
              </div>
              <div
                class="tab"
                :class="chartType == 'nicotine' ? 'active' : ''"
                @click="switchChartType('nicotine')"
              >
                Nicotine
              </div>
              <div
                class="tab"
                :class="chartType == 'duration' ? 'active' : ''"
                @click="switchChartType('duration')"
              >
                Time
              </div>
            </div>
          </div>

          <div class="stats">
            <div class="tabs">
              <div
                class="tab"
                :class="activeStatsTab == 'day' ? 'active' : ''"
                @click="setStatsTab('day')"
              >
                Day
              </div>
              <div
                class="tab"
                :class="activeStatsTab == 'week' ? 'active' : ''"
                @click="setStatsTab('week')"
              >
                Week
              </div>
              <div
                class="tab"
                :class="activeStatsTab == 'month' ? 'active' : ''"
                @click="setStatsTab('month')"
              >
                Month
              </div>
            </div>
            <!-- STATS MONTH -->
            <div class="chart" v-if="activeStatsTab == 'month'">
              <div class="title">
                <div class="toggle prev" @click="toggleData('prev', 'month')">
                  <!-- <img src="@/assets/img/arrow-left.svg" /> -->
                </div>
                <div class="toggle-data">{{ toggleDataText }}</div>
                <div class="toggle next" @click="toggleData('next', 'month')">
                  <!-- <img src="@/assets/img/arrow-right.svg" /> -->
                </div>
              </div>
            </div>
            <!-- STATS WEEK -->
            <div class="chart" v-if="activeStatsTab == 'week'">
              <div class="title">
                <div class="toggle prev" @click="toggleData('prev', 'week')">
                  <!-- <img src="@/assets/img/arrow-left.svg" /> -->
                </div>
                <div class="toggle-data">{{ toggleDataText }}</div>
                <div class="toggle next" @click="toggleData('next', 'week')">
                  <!-- <img src="@/assets/img/arrow-right.svg" /> -->
                </div>
              </div>
            </div>
            <!-- STATS DAY -->
            <div class="chart" v-if="activeStatsTab == 'day'">
              <div class="title">
                <div class="toggle prev" @click="toggleData('prev', 'day')">
                  <!-- <img src="@/assets/img/arrow-left.svg" /> -->
                </div>
                <div class="toggle-data">{{ toggleDataText }}</div>
                <div class="toggle next" @click="toggleData('next', 'day')">
                  <!-- <img src="@/assets/img/arrow-right.svg" /> -->
                </div>
              </div>
            </div>

            <div class="chart-content"><canvas id="chart-day"></canvas></div>
          </div>

          <div class="switch-stats">
            <div
              class="device"
              :class="activeStatsType == 'device' ? 'active' : ''"
              @click="setActiveStatsType('device')"
            >
              This device
            </div>
            <div
              class="device"
              :class="activeStatsType == 'all' ? 'active' : ''"
              @click="setActiveStatsType('all')"
            >
              All devices
            </div>
          </div>

          <!--<div class="puff-timer">
                <div class="progress-info">
                    <div class="label-block">
                    <span>0.3 сек</span>
                    <span class="big">2.7 сек</span>
                    <span>3.9 сек</span>
                    </div>
                    <div class="progress-bar">
                    <div class="active" style="width: 37%;"></div>
                    </div>
                </div>
                <div class="label">Среднее время затяжки за день</div>
            </div>-->

          <div class="block-counter">
            <div class="counter-info">
              <div class="total">
                <div class="arrow">
                  <img
                    :src="
                      statsCount > statsAvarage
                        ? require('@/assets/img/trend-up.svg')
                        : require('@/assets/img/trend-down.svg')
                    "
                  />
                </div>
                <div class="count">{{ convertFixed(statsCount) }}</div>
                <div class="label">
                  {{ activeChartType }} per {{ getStatusWord(activeStatsTab) }}
                </div>
              </div>
              <div class="prev">
                <div class="count">{{ statsAvarage }}</div>
                <div class="label">
                  Average {{ getStatusWordAvarage(activeStatsTab) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  defineComponent,
  computed,
  watchEffect,
  ref,
  onBeforeMount,
  onMounted,
  toRaw,
} from "vue";

import Swiper from "swiper";
import "swiper/swiper-bundle.min.css";

import Chart from "chart.js/auto";

import dayjs from "dayjs";
require("dayjs/locale/en");

dayjs.locale("en");

export default defineComponent({
  name: "Main",
  setup() {
    setTimeout(() => {
      // Устанавливаем размер графика по размеру блока
      document.querySelectorAll("canvas").forEach((v, k) => {
        v["style"].height =
          document.querySelectorAll(".chart-content")[0].clientHeight +
          "px !important";
      });

      document.querySelectorAll(".swiper")[0]["style"].height =
        window.innerHeight + "px";
      var swiper = new Swiper(".mySwiper", {
        direction: "vertical",
      });
    }, 50);

    const store = useStore();
    const router = useRouter();

    const setOpenSettings = () => (store.state.openSettings = true);
    const setOpenPopupRadio = () => (store.state.openPopupRadio = true);

    const setMessage = (message: any) => {
      store.state.popupMessageText = message;
      store.state.openPopupMessage = true;
    };

    const chartUpdateLocal = ref(false);
    const activeStatsType = ref("device");
    const setActiveStatsType = async (type: any) => {
      if (type != activeStatsType.value) {
        activeStatsType.value = type;
        await store.dispatch("getPuffs", type);
        store.state.chartUpdate = true;
        chartUpdateLocal.value = true;
      }
    };

    const today = computed(() => {
      let date = dayjs();
      let startWeek = date.startOf("week").format("DD MMMM");
      let endWeek = date.endOf("week").format("DD MMMM");

      let dayOfWeekIndex = 0;
      switch (date.day()) {
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

      var dateObj = new Date();
      let dayName = dateObj.toLocaleDateString("en-EN", { weekday: "long" });

      return {
        year: date.format("YYYY"),
        month: date.format("MMMM"),
        today: date.format("DD MMMM") + ` (${dayName})`,
        week: startWeek + " - " + endWeek,
      };
    });

    const rssiSignalType = computed(() => {
      let rssi = store.state.deviceDetail.rssi;

      if (rssi >= 185) return 3;

      if (rssi >= 170 && rssi < 185) return 2;

      if (rssi < 170) return 1;
    });
    const rssiSignal = computed(() => {
      let rssi = store.state.deviceDetail.rssi;

      if (rssi >= 185) return "Excellent";

      if (rssi >= 170 && rssi < 185) return "Good";

      if (rssi < 170) return "Normal";
    });

    const valueBattery = computed(() => store.state.deviceDetail.batteryLevel);
    const statusCharge = computed(() => store.state.deviceDetail.chargeStatus);

    let countChargeAnimate = ref(0);
    let countChargeAnimateRun = ref(false);
    const statusChargeAnimate = computed(() => {
      if (valueBattery.value >= 80 && valueBattery.value <= 100) return 100;

      if (valueBattery.value >= 60 && valueBattery.value < 80) return 80;

      if (valueBattery.value >= 40 && valueBattery.value < 60) return 60;

      if (valueBattery.value > 20 && valueBattery.value < 40) return 40;

      if (valueBattery.value > 10 && valueBattery.value < 20) return 20;

      if (valueBattery.value <= 10) return 10;
    });

    const globalPuffCount = computed(() => store.state.globalPuffCount);
    const deviceConnect = computed(() => store.state.deviceConnect);

    const cartridgeType = computed(() => {
      if (
        store.state.deviceDetail.cartridge != 0 &&
        store.state.cartridgeTasty == null
      )
        return "Undetermined";
      else return store.state.cartridgeTasty;
    });

    // Синхронизация затяжек для интерфейса - до старта реальной синхронизации
    const puffSyncing = computed(() => store.state.puffSyncing);
    const puffSyncingProgressBar = computed(
      () => store.state.puffSyncingProgressBar
    );
    const puffSyncingProgressCount = computed(
      () => store.state.puffSyncingProgressCount
    );
    const puffSyncingAllCount = computed(() => store.state.puffSyncingAllCount);

    const getStatusWord = (tab) => {
      let word = null;
      switch (tab) {
        case "day":
          word = "day";
          break;
        case "week":
          word = "week";
          break;
        case "month":
          word = "month";
          break;
      }

      return word;
    };

    const getStatusWordAvarage = (tab) => {
      let word = null;
      switch (tab) {
        case "day":
          word = "per day";
          break;
        case "week":
          word = "per week";
          break;
        case "month":
          word = "per month";
          break;
      }

      return word;
    };

    const activeChartType = computed(() => {
      let text = null;
      switch (chartType.value) {
        case "data":
          text = "Puffs  ";
          break;
        case "nicotine":
          text = "µg ";
          break;
        case "duration":
          text = "seconds  ";
          break;
      }

      return text;
    });

    const convertFixed = (num: any) => {
      num = toRaw(num);
      switch (chartType.value) {
        case "data":
          num = num.toFixed(0);
          break;
        case "nicotine":
          num = num.toFixed(2);
          break;
        case "duration":
          num = num.toFixed(1);
          break;
      }

      return num;
    };

    const activeStatsTab = ref("day");
    const setStatsTab = (tab: any) => {
      switch (tab) {
        case "day":
          if (puffs.value["day"].length) {
            toggleDataText.value =
              puffs.value["day"][selectedDay.value].dateName;
            statsCount.value =
              puffs.value["day"][selectedDay.value][countType.value];
            statsAvarage.value = puffs.value["day"][selectedDay.value].avarage;
            setStats(
              "chart-day",
              puffs.value["day"][selectedDay.value].labels,
              puffs.value["day"][selectedDay.value][chartType.value]
            );
          } else {
            toggleDataText.value = today.value["today"];
          }
          break;
        case "week":
          if (puffs.value["day"].length) {
            toggleDataText.value =
              puffs.value["week"][selectedWeek.value].dateNameStartWeek +
              " - " +
              puffs.value["week"][selectedWeek.value].dateNameEndWeek;
            statsCount.value =
              puffs.value["week"][selectedWeek.value][countType.value];
            statsAvarage.value =
              puffs.value["week"][selectedWeek.value].avarage;
            setStats(
              "chart-day",
              puffs.value["week"][selectedWeek.value].labels,
              puffs.value["week"][selectedWeek.value][chartType.value]
            );
          } else {
            toggleDataText.value = today.value["week"];
          }
          break;
        case "month":
          if (puffs.value["day"].length) {
            toggleDataText.value =
              puffs.value["month"][selectedMonth.value].monthName;
            statsCount.value =
              puffs.value["month"][selectedMonth.value][countType.value];
            statsAvarage.value =
              puffs.value["month"][selectedMonth.value].avarage;
            setStats(
              "chart-day",
              puffs.value["month"][selectedMonth.value].labels,
              puffs.value["month"][selectedMonth.value][chartType.value]
            );
            console.log(puffs.value["month"][selectedMonth.value]["duration"]);
          } else {
            toggleDataText.value = today.value["month"];
          }
          break;
      }

      activeStatsTab.value = tab;
    };

    //! ----------------- STATS SECTION ----------------- //
    var myChart: any = {};
    const chartInit = ref(false);
    const setStats = (chartId: any, labels: any, data: any) => {
      if (chartInit.value == false) {
        var ctx: any = document.querySelector("#" + chartId);
        myChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                barPercentage: 1,
                barThickness: 2,
                maxBarThickness: 2,
                minBarLength: 2,
                data: data,
                backgroundColor: ["#BFBFBF"],
                borderRadius: 3,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            interaction: {
              mode: "index",
              intersect: false,
            },
            locale: "en-EN",
            scales: {
              y: {
                min: 0,
                //max: 300,
                type: "linear",
                display: true,
                position: "right",
                grid: {
                  drawBorder: false,
                  color: "#F2F2F2",
                },
                ticks: {
                  color: "#a9a9a9",
                  font: {
                    family: "SF UI Display", // Your font family
                    size: 11,
                  },
                },
              },
              x: {
                grid: {
                  display: false,
                  offset: true,
                  drawBorder: false,
                },
                ticks: {
                  color: "#a9a9a9",
                  font: {
                    family: "SF UI Display", // Your font family
                    size: 11,
                  },
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: false,
              },
            },
          },
        });

        chartInit.value = true;
      } else {
        // console.log('X!@#!@#!@#!@')
        // myChart.data.datasets[0].data.pop()
        // myChart.data.labels.pop()
        // myChart.update()

        myChart.data.datasets[0].data = data;
        myChart.data.labels = labels;
        myChart.update();
      }
    };

    const setAvarageCount = ref(0);
    const setAllCount = ref(0);

    const selectedMonth = ref(0);
    const selectedWeek = ref(0);
    const selectedDay = ref(0);
    const puffs = computed(() => store.state.puffs);
    const chartType = ref("data");
    const countType = ref("count");

    const switchChartType = (type) => {
      // data / nicotine / duration
      chartType.value = type;

      switch (type) {
        case "data":
          countType.value = "count";
          break;
        case "nicotine":
          countType.value = "countNicotine";
          break;
        case "duration":
          countType.value = "countDuration";
          break;
      }

      store.state.puffEventUpdateDay = true;
      //myChart.update();
    };

    const toggleData = (trigger: any, type: any) => {
      // tab realisation
      // toggle month
      if (type == "month") {
        let len = 0;
        switch (trigger) {
          case "prev":
            if (puffs.value["day"].length) {
              console.log("OUT: ");
              console.log(puffs.value);
              //selectedMonth.value
              len = Object.keys(puffs.value["month"]).length - 1;
              if (selectedMonth.value >= 0 && selectedMonth.value < len) {
                selectedMonth.value++;
                toggleDataText.value =
                  puffs.value["month"][selectedMonth.value].monthName;
                statsCount.value =
                  puffs.value["month"][selectedMonth.value][countType.value];
                statsAvarage.value =
                  puffs.value["month"][selectedMonth.value].avarage;

                myChart.data.labels =
                  puffs.value["month"][selectedMonth.value].labels;
                myChart.data.datasets[0].data =
                  puffs.value["month"][selectedMonth.value][chartType.value];
                myChart.update();
              }
            } else {
              toggleDataText.value = today.value["month"];
            }
            break;
          case "next":
            if (puffs.value["day"].length) {
              //selectedMonth.value
              len = Object.keys(puffs.value["month"]).length;
              if (selectedMonth.value > 0 && selectedMonth.value < len) {
                selectedMonth.value--;
                toggleDataText.value =
                  puffs.value["month"][selectedMonth.value].monthName;
                statsCount.value =
                  puffs.value["month"][selectedMonth.value][countType.value];
                statsAvarage.value =
                  puffs.value["month"][selectedMonth.value].avarage;

                myChart.data.labels =
                  puffs.value["month"][selectedMonth.value].labels;
                myChart.data.datasets[0].data =
                  puffs.value["month"][selectedMonth.value][chartType.value];
                myChart.update();
              }
            } else {
              toggleDataText.value = today.value["month"];
            }
            break;
        }
      }

      if (type == "week") {
        let len = 0;
        switch (trigger) {
          case "prev":
            if (puffs.value["day"].length) {
              //selectedMonth.value
              len = Object.keys(puffs.value["week"]).length - 1;
              if (selectedWeek.value >= 0 && selectedWeek.value < len) {
                selectedWeek.value++;
                toggleDataText.value =
                  puffs.value["week"][selectedWeek.value].dateNameStartWeek +
                  " - " +
                  puffs.value["week"][selectedWeek.value].dateNameEndWeek;
                statsCount.value =
                  puffs.value["week"][selectedWeek.value][countType.value];
                statsAvarage.value =
                  puffs.value["week"][selectedWeek.value].avarage;

                myChart.data.labels =
                  puffs.value["week"][selectedWeek.value].labels;
                myChart.data.datasets[0].data =
                  puffs.value["week"][selectedWeek.value][chartType.value];
                console.log(puffs.value["week"][selectedWeek.value].labels);
                myChart.update();
              }
            } else {
              toggleDataText.value = today.value["week"];
            }
            break;
          case "next":
            if (puffs.value["day"].length) {
              //selectedMonth.value
              len = Object.keys(puffs.value["week"]).length;
              if (selectedWeek.value > 0 && selectedWeek.value < len) {
                selectedWeek.value--;
                toggleDataText.value =
                  puffs.value["week"][selectedWeek.value].dateNameStartWeek +
                  " - " +
                  puffs.value["week"][selectedWeek.value].dateNameEndWeek;
                statsCount.value =
                  puffs.value["week"][selectedWeek.value][countType.value];
                statsAvarage.value =
                  puffs.value["week"][selectedWeek.value].avarage;

                myChart.data.labels =
                  puffs.value["week"][selectedWeek.value].labels;
                myChart.data.datasets[0].data =
                  puffs.value["week"][selectedWeek.value][chartType.value];
                myChart.update();
              }
            } else {
              toggleDataText.value = today.value["week"];
            }
            break;
        }
      }

      if (type == "day") {
        let len = 0;
        switch (trigger) {
          case "prev":
            if (puffs.value["day"].length) {
              //selectedMonth.value
              len = Object.keys(puffs.value["day"]).length - 1;
              if (selectedDay.value >= 0 && selectedDay.value < len) {
                selectedDay.value++;
                toggleDataText.value =
                  puffs.value["day"][selectedDay.value].dateName;
                statsCount.value =
                  puffs.value["day"][selectedDay.value][countType.value];
                statsAvarage.value =
                  puffs.value["day"][selectedDay.value].avarage;

                myChart.data.labels =
                  puffs.value["day"][selectedDay.value].labels;
                myChart.data.datasets[0].data =
                  puffs.value["day"][selectedDay.value][chartType.value];
                myChart.update();
              }
            } else {
              toggleDataText.value = today.value["today"];
            }
            break;
          case "next":
            //selectedMonth.value
            if (puffs.value["day"].length) {
              len = Object.keys(puffs.value["day"]).length;
              if (selectedDay.value > 0 && selectedDay.value < len) {
                selectedDay.value--;
                toggleDataText.value =
                  puffs.value["day"][selectedDay.value].dateName;
                statsCount.value =
                  puffs.value["day"][selectedDay.value][countType.value];
                statsAvarage.value =
                  puffs.value["day"][selectedDay.value].avarage;

                myChart.data.labels =
                  puffs.value["day"][selectedDay.value].labels;
                myChart.data.datasets[0].data =
                  puffs.value["day"][selectedDay.value][chartType.value];
                myChart.update();
              }
            } else {
              toggleDataText.value = today.value["today"];
            }
            break;
        }
      }
    };
    // Строка текста отображаемая между стрелка статистики
    const toggleDataText = ref(null);

    const statsCount = ref(0);
    const statsAvarage = ref(0);
    const statsAvarageDay = ref(0);

    setTimeout(() => {
      // Проверяем есть ли что в базе по затяжкам - берем минимальную еденицу
      if (puffs.value["day"].length) {
        //document.querySelector('#chart-day')['style'].height = '';
        toggleDataText.value = puffs.value["day"][selectedDay.value].dateName;
        statsCount.value =
          puffs.value["day"][selectedDay.value][countType.value];
        statsAvarage.value = puffs.value["day"][selectedDay.value].avarage;
        setTimeout(() => {
          setStats(
            "chart-day",
            puffs.value["day"][selectedDay.value].labels,
            puffs.value["day"][selectedDay.value]
          );
        }, 10);
      } else {
        toggleDataText.value = today.value["today"];
      }
    }, 100);

    onBeforeMount(async () => {
      await store.dispatch("initData");
    });

    watchEffect(async () => {
      if (puffs.value["day"].length) {
        statsAvarageDay.value = puffs.value["day"][selectedDay.value].avarage;
      }

      if (!store.state.deviceConnect) router.push({ name: "DeviceList" });

      if (
        store.state.deviceDetail.unixtime != 0 &&
        store.state.syncEvent == false &&
        store.state.powerControl != 0
      ) {
        // Активируем событие сихронизации - факт что была синхронизация чтобы не синхронизировать повторно
        store.state.syncEvent = true;
        store.state.puffSyncing = true;

        setTimeout(async () => {
          try {
            let resultReadDevice = await store.dispatch("getDevicePuffs");
            if (resultReadDevice) {
              setTimeout(async () => {
                await store.dispatch("sendPuffGroupToServer");
                store.state.puffSyncing = false;
                // CLEAR PUFF FROM DEVICE
              }, 50);
            }
          } catch (e) {}
        }, 2000);
      }

      // Если это первая затяжка в истории
      if (
        (myChart.data == undefined && puffs.value["day"].length) ||
        (myChart.data == undefined && store.state.chartUpdate == true)
      ) {
        let len = 0; //puffs.value['day'].length > 1 ? puffs.value['day'].length - 1 : 0;
        if (Object.keys(myChart).length) myChart = {};

        setTimeout(() => {
          console.log(puffs.value["day"][selectedDay.value].labels);
          setStats(
            "chart-day",
            puffs.value["day"][selectedDay.value].labels,
            puffs.value["day"][selectedDay.value][chartType.value]
          );
        }, 10);

        setTimeout(() => {
          console.log("Update chart before init");

          // Если активна вкладка текущего дня
          if (activeStatsTab.value == "day") {
            if (selectedDay.value == 0) {
              console.log("Update chart INIt DAY");
              myChart.data.labels = puffs.value["day"][len].labels;
              myChart.data.datasets[0].data =
                puffs.value["day"][len][chartType.value];
              statsCount.value = puffs.value["day"][len][countType.value];
              toggleDataText.value = today.value["today"];
              //statsCount.value = puffs.value['day'][len].count;
            }
          }
          // Если активна вкладка текущей недели
          if (activeStatsTab.value == "week") {
            if (selectedWeek.value == 0) {
              console.log("Update chart INIT WEEK");
              myChart.data.labels = puffs.value["week"][len].labels;
              myChart.data.datasets[0].data =
                puffs.value["week"][len][chartType.value];
              statsCount.value = puffs.value["week"][len][countType.value];
              toggleDataText.value = today.value["week"];
              //statsCount.value = puffs.value['week'][len].count;
            }
          }
          // Если активна вкладка текущего месяца
          if (activeStatsTab.value == "month") {
            if (selectedMonth.value == 0) {
              console.log("Update chart INIT MONTH");
              myChart.data.labels = puffs.value["month"][len].labels;
              myChart.data.datasets[0].data =
                puffs.value["month"][len][chartType.value];
              statsCount.value = puffs.value["month"][len][countType.value];
              toggleDataText.value =
                puffs.value["month"][selectedMonth.value].monthName;
              //statsCount.value = puffs.value['month'][len].count;
            }
          }

          myChart.update();
          store.state.puffEventUpdateDay = false;

          if (store.state.chartUpdate == true) store.state.chartUpdate == false;
        }, 100);
      }

      if (
        chartType.value &&
        puffs.value["day"].length &&
        myChart != undefined &&
        store.state.puffEventUpdateDay
      ) {
        let len = 0;

        myChart.data.labels = puffs.value[activeStatsTab.value][len].labels;
        myChart.data.datasets[0].data =
          puffs.value[activeStatsTab.value][len][chartType.value];
        statsCount.value =
          puffs.value[activeStatsTab.value][len][countType.value];

        console.log(puffs.value["day"][selectedDay.value].labels);

        switch (activeStatsTab.value) {
          case "day":
            toggleDataText.value =
              puffs.value["day"][selectedDay.value].dateName;
            myChart.data.labels = puffs.value["day"][selectedDay.value].labels;
            myChart.data.datasets[0].data =
              puffs.value["day"][selectedDay.value][chartType.value];
            statsCount.value =
              puffs.value["day"][selectedDay.value][countType.value];
            break;
          case "week":
            toggleDataText.value =
              puffs.value["week"][selectedWeek.value].dateNameStartWeek +
              " - " +
              puffs.value["week"][selectedWeek.value].dateNameEndWeek;
            myChart.data.labels =
              puffs.value["week"][selectedWeek.value].labels;
            myChart.data.datasets[0].data =
              puffs.value["week"][selectedWeek.value][chartType.value];
            statsCount.value =
              puffs.value["week"][selectedWeek.value][countType.value];
            break;
          case "month":
            toggleDataText.value =
              puffs.value["month"][selectedMonth.value].monthName;
            myChart.data.labels =
              puffs.value["month"][selectedWeek.value].labels;
            myChart.data.datasets[0].data =
              puffs.value["month"][selectedWeek.value][chartType.value];
            statsCount.value =
              puffs.value["month"][selectedWeek.value][countType.value];
            break;
        }

        myChart.update();
        store.state.puffEventUpdateDay = false;
      }

      // Обновляем график дня
      if (
        (chartType.value &&
          store.state.globalPuffCount &&
          puffs.value["day"].length &&
          store.state.puffEventUpdateDay &&
          Object.keys(myChart).length > 0) ||
        (myChart != undefined && store.state.chartUpdate == true)
      ) {
        var len = 0; //puffs.value['day'].length > 1 ? puffs.value['day'].length - 1 : 0;
        // Так же добавить Avarage
        console.log("Update chart else !!");
        // Если активна вкладка текущего дня
        if (activeStatsTab.value == "day") {
          if (selectedDay.value == 0) {
            console.log("Update chart else DAY");
            myChart.data.labels = puffs.value["day"][len].labels;
            myChart.data.datasets[0].data =
              puffs.value["day"][len][chartType.value];
            statsCount.value = puffs.value["day"][len][countType.value];
            toggleDataText.value = today.value["today"];
          }
        }
        // Если активна вкладка текущей недели
        if (activeStatsTab.value == "week") {
          if (selectedWeek.value == 0) {
            console.log("Update chart else WEEK");
            myChart.data.labels = puffs.value["week"][len].labels;
            myChart.data.datasets[0].data =
              puffs.value["week"][len][chartType.value];
            statsCount.value = puffs.value["week"][len][countType.value];
            toggleDataText.value = today.value["week"];
          }
        }
        // Если активна вкладка текущего месяца
        if (activeStatsTab.value == "month") {
          if (selectedMonth.value == 0) {
            console.log("Update chart else MONTH");
            myChart.data.labels = puffs.value["month"][len].labels;
            myChart.data.datasets[0].data =
              puffs.value["month"][len][chartType.value];
            statsCount.value = puffs.value["month"][len][countType.value];
            toggleDataText.value =
              puffs.value["month"][selectedMonth.value].monthName;
          }
        }

        myChart.update();
        store.state.puffEventUpdateDay = false;

        if (store.state.chartUpdate == true && chartUpdateLocal.value == true)
          store.state.chartUpdate = false;
        chartUpdateLocal.value = false;
        console.log("UPD");
      }

      //Есть ли фокус приложения
      let focusInterval = null;
      focusInterval = setInterval(() => {
        store.state.hasFocus = window.document.hasFocus();

        if (store.state.hasFocus == false) {
          clearInterval(focusInterval);
          store.dispatch("clearsomebledeviceHandle");
          store.dispatch("resetState");
          router.push({ name: "DeviceList" });
        }

        if (router.currentRoute.value.name != "Main") {
          clearInterval(focusInterval);
        }
      }, 250);
    });

    return {
      setOpenSettings,
      setOpenPopupRadio,
      setMessage,

      valueBattery,
      statusCharge,
      globalPuffCount,
      deviceConnect,
      cartridgeType,

      toggleData,
      toggleDataText,

      statsCount,
      statsAvarage,
      statsAvarageDay,

      setStatsTab,
      activeStatsTab,

      getStatusWord,
      getStatusWordAvarage,

      today,

      puffSyncing,
      puffSyncingProgressBar,
      puffSyncingProgressCount,
      puffSyncingAllCount,

      rssiSignal,
      rssiSignalType,

      statusChargeAnimate,

      switchChartType,
      chartType,
      activeChartType,

      convertFixed,

      setActiveStatsType,
      activeStatsType,
    };
  },
});
</script>

<style lang="scss">
.swiper {
  width: 100%;
}

.fade-enter-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>