import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCommandStore } from './command'

export const useKeyboardStore = defineStore('keyboard', () => {
  const router = useRouter()
  const commandStore = useCommandStore()
  
  // 状态
  const shortcuts = ref({})
  const isEnabled = ref(true)
  const currentFocus = ref(null)
  
  // 默认快捷键配置
  const defaultShortcuts = {
    // 全局快捷键
    'ctrl+n': () => router.push('/command'),
    'ctrl+shift+n': () => router.push('/workflow'),
    'ctrl+f': () => focusSearch(),
    'ctrl+,': () => router.push('/settings'),
    'escape': () => handleEscape(),
    
    // 列表导航
    'arrowdown': () => navigateList('down'),
    'arrowup': () => navigateList('up'),
    'enter': () => selectCurrentItem(),
    'ctrl+c': () => copyCurrentCommand(),
    'ctrl+e': () => executeCurrentCommand(),
    
    // 分类和标签
    'ctrl+1': () => selectCategory(0),
    'ctrl+2': () => selectCategory(1),
    'ctrl+3': () => selectCategory(2),
    'ctrl+4': () => selectCategory(3),
    'ctrl+5': () => selectCategory(4),
    
    // 搜索历史
    'ctrl+h': () => showSearchHistory(),
    'ctrl+shift+h': () => clearSearchHistory(),
    
    // 快速操作
    'delete': () => deleteCurrentItem(),
    'f2': () => editCurrentItem(),
    'ctrl+d': () => duplicateCurrentItem()
  }
  
  // 初始化快捷键
  const initShortcuts = () => {
    shortcuts.value = { ...defaultShortcuts }
    
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeydown)
      document.addEventListener('keyup', handleKeyup)
    }
  }
  
  // 键盘事件处理
  const handleKeydown = (event) => {
    if (!isEnabled.value) return
    
    // 忽略在输入框中的按键
    const activeElement = document.activeElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )) {
      // 只处理特定的快捷键
      if (!['escape', 'enter'].includes(event.key.toLowerCase())) {
        return
      }
    }
    
    const key = buildKeyString(event)
    const handler = shortcuts.value[key]
    
    if (handler) {
      event.preventDefault()
      event.stopPropagation()
      handler(event)
    }
  }
  
  const handleKeyup = (event) => {
    // 处理需要在keyup时触发的事件
  }
  
  // 构建按键字符串
  const buildKeyString = (event) => {
    const parts = []
    
    if (event.ctrlKey) parts.push('ctrl')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    if (event.metaKey) parts.push('meta')
    
    const key = event.key.toLowerCase()
    if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
      parts.push(key)
    }
    
    return parts.join('+')
  }
  
  // 快捷键功能实现
  const focusSearch = () => {
    const searchInput = document.querySelector('.search-input')
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }
  
  const handleEscape = () => {
    const activeElement = document.activeElement
    if (activeElement && activeElement.blur) {
      activeElement.blur()
    }
    
    // 清除选择状态
    currentFocus.value = null
    
    // 关闭模态框等
    const modal = document.querySelector('.modal.show')
    if (modal) {
      const closeBtn = modal.querySelector('.modal-close, .btn-cancel')
      if (closeBtn) closeBtn.click()
    }
  }
  
  const navigateList = (direction) => {
    const listItems = document.querySelectorAll('.command-item, .workflow-item')
    if (listItems.length === 0) return
    
    let currentIndex = -1
    if (currentFocus.value) {
      currentIndex = Array.from(listItems).findIndex(item => 
        item.dataset.id === currentFocus.value
      )
    }
    
    let newIndex
    if (direction === 'down') {
      newIndex = currentIndex < listItems.length - 1 ? currentIndex + 1 : 0
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : listItems.length - 1
    }
    
    const newItem = listItems[newIndex]
    if (newItem) {
      // 移除之前的焦点样式
      listItems.forEach(item => item.classList.remove('keyboard-focus'))
      
      // 添加新的焦点样式
      newItem.classList.add('keyboard-focus')
      newItem.scrollIntoView({ block: 'nearest' })
      
      currentFocus.value = newItem.dataset.id
    }
  }
  
  const selectCurrentItem = () => {
    if (!currentFocus.value) return
    
    const focusedItem = document.querySelector(`[data-id="${currentFocus.value}"]`)
    if (focusedItem) {
      const link = focusedItem.querySelector('a, .item-link')
      if (link) {
        link.click()
      }
    }
  }
  
  const copyCurrentCommand = () => {
    if (!currentFocus.value) return
    
    const command = commandStore.getCommand(currentFocus.value)
    if (command) {
      commandStore.executeCommand(command.command)
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification(`已复制: ${command.name}`)
      }
    }
  }
  
  const executeCurrentCommand = async () => {
    if (!currentFocus.value) return
    
    const command = commandStore.getCommand(currentFocus.value)
    if (command) {
      // 如果命令有参数，显示参数输入对话框
      if (command.parameters && command.parameters.length > 0) {
        // 触发参数输入模态框
        const event = new CustomEvent('show-parameter-modal', {
          detail: { commandId: currentFocus.value }
        })
        document.dispatchEvent(event)
      } else {
        // 直接执行命令
        await commandStore.executeCommand(command.command)
        commandStore.incrementCommandUsage(command.id)
        
        if (window.utoolsSystem) {
          window.utoolsSystem.showNotification(`已执行: ${command.name}`)
        }
      }
    }
  }
  
  const selectCategory = (index) => {
    const categories = commandStore.categories
    if (categories[index]) {
      commandStore.setSelectedCategory(categories[index].id)
    }
  }
  
  const showSearchHistory = () => {
    const event = new CustomEvent('show-search-history')
    document.dispatchEvent(event)
  }
  
  const clearSearchHistory = () => {
    commandStore.clearSearchHistory()
    if (window.utoolsSystem) {
      window.utoolsSystem.showNotification('搜索历史已清除')
    }
  }
  
  const deleteCurrentItem = () => {
    if (!currentFocus.value) return
    
    const event = new CustomEvent('delete-current-item', {
      detail: { id: currentFocus.value }
    })
    document.dispatchEvent(event)
  }
  
  const editCurrentItem = () => {
    if (!currentFocus.value) return
    
    const command = commandStore.getCommand(currentFocus.value)
    if (command) {
      router.push(`/command/${currentFocus.value}`)
    }
  }
  
  const duplicateCurrentItem = () => {
    if (!currentFocus.value) return
    
    const event = new CustomEvent('duplicate-current-item', {
      detail: { id: currentFocus.value }
    })
    document.dispatchEvent(event)
  }
  
  // 自定义快捷键
  const addShortcut = (key, handler) => {
    shortcuts.value[key] = handler
  }
  
  const removeShortcut = (key) => {
    delete shortcuts.value[key]
  }
  
  const updateShortcut = (oldKey, newKey, handler) => {
    delete shortcuts.value[oldKey]
    shortcuts.value[newKey] = handler
  }
  
  // 启用/禁用快捷键
  const enableShortcuts = () => {
    isEnabled.value = true
  }
  
  const disableShortcuts = () => {
    isEnabled.value = false
  }
  
  const toggleShortcuts = () => {
    isEnabled.value = !isEnabled.value
  }
  
  // 获取快捷键帮助信息
  const getShortcutHelp = () => {
    return {
      '全局快捷键': {
        'Ctrl+N': '新建命令',
        'Ctrl+Shift+N': '新建工作流',
        'Ctrl+F': '聚焦搜索框',
        'Ctrl+,': '打开设置',
        'Esc': '取消/关闭'
      },
      '列表导航': {
        '↑/↓': '上下导航',
        'Enter': '选择当前项',
        'Ctrl+C': '复制当前命令',
        'Ctrl+E': '执行当前命令'
      },
      '快速操作': {
        'Delete': '删除当前项',
        'F2': '编辑当前项',
        'Ctrl+D': '复制当前项',
        'Ctrl+H': '显示搜索历史'
      },
      '分类快捷键': {
        'Ctrl+1-5': '快速选择分类'
      }
    }
  }
  
  // 清理资源
  const cleanup = () => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('keyup', handleKeyup)
    }
  }
  
  return {
    // 状态
    shortcuts,
    isEnabled,
    currentFocus,
    
    // 方法
    initShortcuts,
    addShortcut,
    removeShortcut,
    updateShortcut,
    enableShortcuts,
    disableShortcuts,
    toggleShortcuts,
    getShortcutHelp,
    cleanup,
    
    // 导航方法（供外部调用）
    navigateList,
    selectCurrentItem,
    focusSearch
  }
}) 