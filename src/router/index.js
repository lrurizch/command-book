import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Settings from '../views/Settings.vue'
import CategoryTree from '../components/CategoryTree.vue'

const routes = [
  {
    path: '/',
    components: {
      default: Home,
      sidebar: CategoryTree
    }
  },
  {
    path: '/settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 