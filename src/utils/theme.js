/**
 * 主题管理工具 - 升级版本
 * 支持深色模式、自定义主题和边框设置
 */

// 主题类型
export const ThemeMode = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
}

// 默认主题设置
export const defaultThemeSettings = {
  mode: ThemeMode.AUTO,
  primaryColor: '#409eff',
  borderRadius: '4px',
  fontSize: '14px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
}

// 默认边框设置
export const defaultBorderSettings = {
  // 分类项边框
  categoryItemBorderWidth: '1px',
  categoryItemBorderColor: '#dcdfe6',
  categoryItemBorderRadius: '4px',
  
  // 按钮边框
  buttonBorderWidth: '1px',
  buttonBorderColor: '#dcdfe6',
  buttonBorderRadius: '4px',
  
  // 输入框边框
  inputBorderWidth: '1px',
  inputBorderColor: '#dcdfe6',
  inputBorderRadius: '4px',
  
  // 卡片边框
  cardBorderWidth: '1px',
  cardBorderColor: '#dcdfe6',
  cardBorderRadius: '4px',
  
  // 模态框边框
  modalBorderWidth: '1px',
  modalBorderColor: '#dcdfe6',
  modalBorderRadius: '4px'
}

/**
 * 初始化主题系统
 */
export const initializeTheme = () => {
  console.log('🎨 初始化主题系统...')
  
  // 加载保存的主题设置
  const savedTheme = loadThemeSettings()
  applyThemeSettings(savedTheme)
  
  // 加载保存的边框设置
  const savedBorders = loadBorderSettings()
  applyBorderSettings(savedBorders)
  
  // 监听系统主题变化
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    // 初始化时检查系统主题
    handleSystemThemeChange(mediaQuery)
  }
  
  // 监听字体大小变化（无障碍支持）
  if (window.matchMedia) {
    const fontSizeQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    fontSizeQuery.addEventListener('change', handleAccessibilityChange)
    handleAccessibilityChange(fontSizeQuery)
  }
  
  console.log('✅ 主题系统初始化完成')
}

/**
 * 处理系统主题变化
 * @param {MediaQueryList} mediaQuery 媒体查询对象
 */
const handleSystemThemeChange = (mediaQuery) => {
  const savedTheme = loadThemeSettings()
  
  if (savedTheme.mode === ThemeMode.AUTO) {
    const isDark = mediaQuery.matches
    applyColorScheme(isDark ? ThemeMode.DARK : ThemeMode.LIGHT)
    console.log(`🌓 系统主题变化: ${isDark ? '深色' : '浅色'}模式`)
  }
}

/**
 * 处理无障碍设置变化
 * @param {MediaQueryList} mediaQuery 媒体查询对象
 */
const handleAccessibilityChange = (mediaQuery) => {
  const root = document.documentElement
  
  if (mediaQuery.matches) {
    // 减少动画
    root.style.setProperty('--transition-duration', '0.01ms')
    console.log('♿ 启用无障碍模式：减少动画')
  } else {
    // 正常动画
    root.style.setProperty('--transition-duration', '0.3s')
  }
}

/**
 * 应用主题设置
 * @param {Object} settings 主题设置
 */
export const applyThemeSettings = (settings) => {
  const root = document.documentElement
  
  // 应用基础设置
  root.style.setProperty('--primary-color', settings.primaryColor)
  root.style.setProperty('--border-radius-base', settings.borderRadius)
  root.style.setProperty('--font-size-base', settings.fontSize)
  root.style.setProperty('--font-family-base', settings.fontFamily)
  
  // 应用颜色模式
  applyColorScheme(settings.mode)
  
  console.log('🎨 主题设置已应用:', settings)
}

/**
 * 应用颜色模式
 * @param {string} mode 颜色模式
 */
export const applyColorScheme = (mode) => {
  const root = document.documentElement
  
  switch (mode) {
    case ThemeMode.DARK:
      root.classList.add('dark')
      root.classList.remove('light')
      break
    case ThemeMode.LIGHT:
      root.classList.add('light')
      root.classList.remove('dark')
      break
    case ThemeMode.AUTO:
      // 自动模式根据系统设置
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
      root.classList.toggle('light', !isDark)
      break
  }
  
  // 设置数据属性供CSS使用
  root.setAttribute('data-theme', mode)
}

/**
 * 应用边框设置到CSS变量
 * @param {Object} settings 边框设置
 */
export const applyBorderSettings = (settings) => {
  const root = document.documentElement
  
  // 分类项边框
  root.style.setProperty('--category-item-border-width', settings.categoryItemBorderWidth)
  root.style.setProperty('--category-item-border-color', settings.categoryItemBorderColor)
  root.style.setProperty('--category-item-radius', settings.categoryItemBorderRadius)
  
  // 按钮边框
  root.style.setProperty('--button-border-width', settings.buttonBorderWidth)
  root.style.setProperty('--button-border-color', settings.buttonBorderColor)
  root.style.setProperty('--button-radius', settings.buttonBorderRadius)
  
  // 输入框边框
  root.style.setProperty('--input-border-width', settings.inputBorderWidth)
  root.style.setProperty('--input-border-color', settings.inputBorderColor)
  root.style.setProperty('--input-radius', settings.inputBorderRadius)
  
  // 卡片边框
  root.style.setProperty('--card-border-width', settings.cardBorderWidth)
  root.style.setProperty('--card-border-color', settings.cardBorderColor)
  root.style.setProperty('--card-radius', settings.cardBorderRadius)
  
  // 模态框边框
  root.style.setProperty('--modal-border-width', settings.modalBorderWidth)
  root.style.setProperty('--modal-border-color', settings.modalBorderColor)
  root.style.setProperty('--modal-radius', settings.modalBorderRadius)
  
  console.log('🎨 边框设置已应用:', settings)
}

/**
 * 切换主题模式
 * @param {string} mode 新的主题模式
 */
export const switchThemeMode = (mode) => {
  const settings = loadThemeSettings()
  settings.mode = mode
  
  applyThemeSettings(settings)
  saveThemeSettings(settings)
  
  console.log(`🌓 切换主题模式: ${mode}`)
}

/**
 * 切换深色/浅色模式
 */
export const toggleDarkMode = () => {
  const settings = loadThemeSettings()
  const currentMode = settings.mode
  
  let newMode
  if (currentMode === ThemeMode.DARK) {
    newMode = ThemeMode.LIGHT
  } else if (currentMode === ThemeMode.LIGHT) {
    newMode = ThemeMode.DARK
  } else {
    // AUTO模式下根据当前系统主题切换
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    newMode = isDark ? ThemeMode.LIGHT : ThemeMode.DARK
  }
  
  switchThemeMode(newMode)
}

/**
 * 更新主色调
 * @param {string} color 新的主色调
 */
export const updatePrimaryColor = (color) => {
  const settings = loadThemeSettings()
  settings.primaryColor = color
  
  applyThemeSettings(settings)
  saveThemeSettings(settings)
  
  console.log(`🎨 更新主色调: ${color}`)
}

// ===== 存储管理 =====

/**
 * 保存主题设置到本地存储
 * @param {Object} settings 主题设置
 */
export const saveThemeSettings = (settings) => {
  try {
    if (window.utoolsDB) {
      window.utoolsDB.put('theme-settings', settings)
    } else {
      localStorage.setItem('theme-settings', JSON.stringify(settings))
    }
  } catch (error) {
    console.error('保存主题设置失败:', error)
  }
}

/**
 * 从本地存储加载主题设置
 * @returns {Object} 主题设置
 */
export const loadThemeSettings = () => {
  try {
    let savedSettings = null
    
    if (window.utoolsDB) {
      const result = window.utoolsDB.get('theme-settings')
      savedSettings = result?.data
    } else {
      const stored = localStorage.getItem('theme-settings')
      savedSettings = stored ? JSON.parse(stored) : null
    }
    
    return savedSettings ? { ...defaultThemeSettings, ...savedSettings } : defaultThemeSettings
  } catch (error) {
    console.error('加载主题设置失败:', error)
    return defaultThemeSettings
  }
}

/**
 * 保存边框设置到本地存储
 * @param {Object} settings 边框设置
 */
export const saveBorderSettings = (settings) => {
  try {
    if (window.utoolsDB) {
      window.utoolsDB.put('border-settings', settings)
    } else {
      localStorage.setItem('border-settings', JSON.stringify(settings))
    }
  } catch (error) {
    console.error('保存边框设置失败:', error)
  }
}

/**
 * 从本地存储加载边框设置
 * @returns {Object} 边框设置
 */
export const loadBorderSettings = () => {
  try {
    let savedSettings = null
    
    if (window.utoolsDB) {
      const result = window.utoolsDB.get('border-settings')
      savedSettings = result?.data
    } else {
      const stored = localStorage.getItem('border-settings')
      savedSettings = stored ? JSON.parse(stored) : null
    }
    
    return savedSettings ? { ...defaultBorderSettings, ...savedSettings } : defaultBorderSettings
  } catch (error) {
    console.error('加载边框设置失败:', error)
    return defaultBorderSettings
  }
}

/**
 * 重置主题设置为默认值
 */
export const resetThemeSettings = () => {
  applyThemeSettings(defaultThemeSettings)
  saveThemeSettings(defaultThemeSettings)
  console.log('🔄 主题设置已重置为默认值')
  return defaultThemeSettings
}

/**
 * 重置边框设置为默认值
 */
export const resetBorderSettings = () => {
  applyBorderSettings(defaultBorderSettings)
  saveBorderSettings(defaultBorderSettings)
  console.log('🔄 边框设置已重置为默认值')
  return defaultBorderSettings
}

// ===== 主题预设 =====

/**
 * 预设主题
 */
export const themePresets = {
  default: {
    name: '默认主题',
    settings: {
      ...defaultThemeSettings,
      primaryColor: '#409eff'
    }
  },
  blue: {
    name: '蓝色主题',
    settings: {
      ...defaultThemeSettings,
      primaryColor: '#1890ff'
    }
  },
  green: {
    name: '绿色主题',
    settings: {
      ...defaultThemeSettings,
      primaryColor: '#52c41a'
    }
  },
  purple: {
    name: '紫色主题',
    settings: {
      ...defaultThemeSettings,
      primaryColor: '#722ed1'
    }
  },
  orange: {
    name: '橙色主题',
    settings: {
      ...defaultThemeSettings,
      primaryColor: '#fa8c16'
    }
  }
}

/**
 * 应用预设主题
 * @param {string} presetName 预设名称
 */
export const applyThemePreset = (presetName) => {
  const preset = themePresets[presetName]
  if (!preset) {
    console.warn(`未找到主题预设: ${presetName}`)
    return
  }
  
  applyThemeSettings(preset.settings)
  saveThemeSettings(preset.settings)
  
  console.log(`🎨 应用主题预设: ${preset.name}`)
}

/**
 * 获取当前主题信息
 * @returns {Object} 当前主题信息
 */
export const getCurrentThemeInfo = () => {
  const settings = loadThemeSettings()
  const isDark = document.documentElement.classList.contains('dark')
  
  return {
    settings,
    mode: settings.mode,
    isDark,
    isLight: !isDark,
    primaryColor: settings.primaryColor
  }
} 