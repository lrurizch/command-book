/**
 * 命令手册主应用入口 - 升级版本
 * 集成完整的增强命令管理系统
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// 导入全局样式
import './styles/global.scss'

// 导入工具函数
import { initializeTheme } from './utils/theme'

// 创建应用实例
const app = createApp(App)

// 创建 Pinia 状态管理
const pinia = createPinia()

// 注册插件
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化主题
initializeTheme()

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err)
  console.error('Component:', vm)
  console.error('Error info:', info)
  
  // 可以在这里添加错误上报逻辑
  if (window.utoolsDB) {
    try {
      window.utoolsDB.put('error-log', {
        error: err.message,
        stack: err.stack,
        component: vm?.$options?.name || 'Unknown',
        info,
        timestamp: new Date().toISOString()
      })
    } catch (e) {
      console.error('Failed to save error log:', e)
    }
  }
}

// 全局警告处理
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Global warning:', msg)
  console.warn('Component:', vm)
  console.warn('Trace:', trace)
}

// 开发环境配置
if (import.meta.env.DEV) {
  // 开发模式下的调试配置
  app.config.devtools = true
  app.config.debug = true
  
  // 性能追踪
  app.config.performance = true
  
  console.log('🚀 命令手册 - 增强版本启动')
  console.log('📦 集成功能:')
  console.log('  ✅ 智能参数分类系统')
  console.log('  ✅ 高级命令验证')
  console.log('  ✅ 智能构建建议')
  console.log('  ✅ 命令结构分析')
  console.log('  ✅ 历史记录管理')
} else {
  // 生产环境配置
  app.config.devtools = false
  app.config.debug = false
  app.config.performance = false
}

// 挂载应用
app.mount('#app')

// 注册全局快捷键
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K 快速搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    // 触发搜索框聚焦事件
    window.dispatchEvent(new CustomEvent('focus-search'))
  }
  
  // Ctrl/Cmd + N 新建命令
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault()
    // 触发新建命令事件
    window.dispatchEvent(new CustomEvent('new-command'))
  }
  
  // Ctrl/Cmd + B 打开构建器
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    // 触发构建器事件
    window.dispatchEvent(new CustomEvent('open-builder'))
  }
})

// 应用生命周期钩子
window.addEventListener('beforeunload', () => {
  // 应用关闭前的清理工作
  console.log('应用正在关闭，清理资源...')
})

// 导出应用实例供调试使用
if (import.meta.env.DEV) {
  window.__VUE_APP__ = app
} 