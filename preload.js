const { ipcRenderer } = require('electron')

// 插件入口
utools.onPluginEnter(({ code, type, payload }) => {
  // 插件启动逻辑
})

// 插件退出
utools.onPluginOut(() => {
  // 插件退出逻辑
})

// 数据存储服务
window.utoolsDB = {
  // 保存数据
  put(data) {
    return utools.db.put(data)
  },
  
  // 获取数据
  get(id) {
    return utools.db.get(id)
  },
  
  // 删除数据
  remove(id) {
    return utools.db.remove(id)
  },
  
  // 获取所有数据
  allDocs(key) {
    return utools.db.allDocs(key)
  }
}

// 系统服务
window.utoolsSystem = {
  // 复制到剪贴板
  copyText(text) {
    utools.copyText(text)
    utools.showNotification('已复制到剪贴板')
  },
  
  // 显示通知
  showNotification(text) {
    utools.showNotification(text)
  },
  
  // 隐藏插件
  hideMainWindow() {
    utools.hideMainWindow()
  },
  
  // 执行shell命令
  async shellOpenExternal(command) {
    try {
      const { shell } = require('electron')
      await shell.openExternal(command)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },
  
  // 执行终端命令
  async executeCommand(command) {
    try {
      const { spawn } = require('child_process')
      return new Promise((resolve, reject) => {
        const process = spawn(command, { shell: true })
        let output = ''
        let error = ''
        
        process.stdout.on('data', (data) => {
          output += data.toString()
        })
        
        process.stderr.on('data', (data) => {
          error += data.toString()
        })
        
        process.on('close', (code) => {
          resolve({
            success: code === 0,
            output,
            error,
            code
          })
        })
        
        process.on('error', (err) => {
          reject(err)
        })
      })
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// 键盘快捷键处理
window.utoolsKeyboard = {
  // 注册全局快捷键
  registerShortcut(accelerator, callback) {
    try {
      utools.onPluginEnter(() => {
        document.addEventListener('keydown', (e) => {
          // 解析快捷键
          const keys = accelerator.toLowerCase().split('+')
          let match = true
          
          if (keys.includes('ctrl') && !e.ctrlKey) match = false
          if (keys.includes('shift') && !e.shiftKey) match = false
          if (keys.includes('alt') && !e.altKey) match = false
          if (keys.includes('meta') && !e.metaKey) match = false
          
          const key = keys[keys.length - 1]
          if (e.key.toLowerCase() !== key) match = false
          
          if (match) {
            e.preventDefault()
            callback()
          }
        })
      })
    } catch (error) {
      console.error('注册快捷键失败:', error)
    }
  }
} 