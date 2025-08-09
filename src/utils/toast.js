import { createApp } from 'vue'
import Toast from '../components/Toast.vue'

let toastContainer = null
let toastCount = 0

// 初始化Toast容器
const initToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      pointer-events: none;
    `
    document.body.appendChild(toastContainer)
  }
}

// 显示Toast
const showToast = (options) => {
  initToastContainer()
  
  const {
    title,
    message = '',
    type = 'success',
    duration = 1000
  } = options
  
  // 创建Toast实例
  const toastId = `toast-${++toastCount}`
  const toastElement = document.createElement('div')
  toastElement.id = toastId
  toastElement.style.cssText = `
    position: relative;
    margin-bottom: 10px;
    pointer-events: auto;
  `
  
  toastContainer.appendChild(toastElement)
  
  const app = createApp(Toast, {
    title,
    message,
    type,
    duration,
    onClose: () => {
      // 清理DOM和Vue实例
      if (toastElement && toastElement.parentNode) {
        app.unmount()
        toastElement.parentNode.removeChild(toastElement)
      }
      
      // 如果没有Toast了，清理容器
      if (toastContainer && toastContainer.children.length === 0) {
        document.body.removeChild(toastContainer)
        toastContainer = null
      }
    }
  })
  
  app.mount(toastElement)
  
  return {
    close: () => {
      const toastInstance = app._instance
      if (toastInstance && toastInstance.exposed) {
        toastInstance.exposed.close()
      }
    }
  }
}

// 快捷方法
export const toast = {
  success: (title, message) => showToast({ title, message, type: 'success' }),
  error: (title, message) => showToast({ title, message, type: 'error' }),
  warning: (title, message) => showToast({ title, message, type: 'warning' }),
  info: (title, message) => showToast({ title, message, type: 'info' }),
  show: showToast
}

// 复制成功的专用方法
export const showCopySuccess = (commandName) => {
  toast.success('复制成功', `命令 "${commandName}" 已复制到剪贴板`)
}

// 执行成功的专用方法
export const showExecuteSuccess = (commandName) => {
  toast.success('执行成功', `命令 "${commandName}" 已执行并复制到剪贴板`)
}

// 删除成功的专用方法
export const showDeleteSuccess = (commandName) => {
  toast.success('删除成功', `命令 "${commandName}" 已删除`)
}

// 保存成功的专用方法
export const showSaveSuccess = (commandName, isEdit = false) => {
  const action = isEdit ? '更新' : '创建'
  toast.success(`${action}成功`, `命令 "${commandName}" 已${action}`)
}

export default toast 