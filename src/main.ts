import '@fontsource/michroma'
import '@fontsource-variable/source-sans-3'
import './styles/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
