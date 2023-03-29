import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Main from '../views/Main.vue'
import FirmwareUpdate from '../views/FirmwareUpdate.vue'
import Connect from '../views/Connect.vue'
import Auth from '../views/Auth.vue'
import Reg from '../views/Reg.vue'
import RecoveryPassword from '../views/RecoveryPassword.vue'
import DeviceList from '../views/DeviceList.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Main',
    component: Main
  },
  {
    path: '/update',
    name: 'FirmwareUpdate',
    component: FirmwareUpdate
  },
  {
    path: '/connect',
    name: 'Connect',
    component: Connect
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth
  },
  {
    path: '/reg',
    name: 'Reg',
    component: Reg
  },
  {
    path: '/reset',
    name: 'RecoveryPassword',
    component: RecoveryPassword
  },
  {
    path: '/profile/devices',
    name: 'DeviceList',
    component: DeviceList
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router