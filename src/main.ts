import { createApp } from 'vue'
import App from './App.vue'
import Maska from 'maska'
import router from './router'
import store from './store'

createApp(App)
.use(store)
.use(Maska)
.use(router)
.mount('#app')
