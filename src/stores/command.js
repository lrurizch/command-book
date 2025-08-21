/**
 * 命令手册的数据存储 - 升级版本
 * 集成完整的参数分类、验证和智能管理系统
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Fuse from 'fuse.js'
// 简化模式，不再需要复杂的构建器类

// 使用内置模板，不再导入外部数据文件

export const useCommandStore = defineStore('command', () => {
  // ===== 基础状态 =====
  const commands = ref([])
  const categories = ref([
    { id: 'all', name: '全部', color: '#999999', level: 0, parentId: null },
    { id: 'recycle-bin', name: '回收站', color: '#6b7280', level: 0, parentId: null },
    
    // 根据实际命令数据定义分类
    // Git 分类
    { id: 'git-basic', name: 'Git 基础', color: '#f56565', level: 0, parentId: null },
    { id: 'git-branch', name: 'Git 分支', color: '#ed8936', level: 0, parentId: null },
    { id: 'git-remote', name: 'Git 远程', color: '#ecc94b', level: 0, parentId: null },
    { id: 'git', name: 'Git 通用', color: '#48bb78', level: 0, parentId: null },
    
    // 开发工具
    { id: 'docker', name: 'Docker', color: '#0db7ed', level: 0, parentId: null },
    { id: 'npm', name: 'NPM', color: '#cb3837', level: 0, parentId: null },
    
    // 系统管理
    { id: 'system', name: '系统管理', color: '#9f7aea', level: 0, parentId: null },
    
    // 网络工具
    { id: 'network', name: '网络工具', color: '#38a169', level: 0, parentId: null }
  ])
  
  // ===== 增强状态 =====
  const buildHistory = ref([])
  const validationResults = ref({})
  const suggestions = ref({})
  const currentSearchQuery = ref('')
  const selectedCategory = ref('all')
  const selectedTags = ref([])
  const searchHistory = ref([])
  const commandStats = ref({})
  const recentCommands = ref([])
  const sortPreferences = ref({
    categories: [],
    tags: [],
    commands: []
  })
  
  // 智能复制设置
  const defaultCopyCommands = ref({}) // { commandId: 'selectedFullCommand' }
  const autoUpdateCopyCommand = ref({}) // { commandId: boolean }
  const frequentCommands = ref({}) // { commandId: [fullCommand1, fullCommand2, ...] }
  
  // 显示设置
  const displaySettings = ref({
    showCommandName: true,        // 显示命令名称
    showDescription: true,        // 显示描述
    showCategory: false,          // 显示分类
    showTags: false,              // 显示标签
    showUsageStats: false,        // 显示使用统计
    showParameters: false,        // 显示参数信息
    compactMode: false,           // 紧凑模式
    // 浏览模式设置
    enablePagination: false,      // 启用分页器（默认关闭）
    stickyPagination: true,       // 滚动时固定分页器
    enableInfiniteScroll: true    // 启用无限滚动（默认主要模式）
  })
  
  // ===== 预计算的分类索引 =====
  const categoryIndex = ref(new Map())
  
  // ===== 全局分类索引系统 =====
  const globalCategoryIndex = ref(new Map()) // 分类索引：categoryId -> 命令数组
  const indexMetadata = ref({
    version: '1.0',
    lastUpdated: null,
    totalCommands: 0,
    categoryStats: {} // 每个分类的统计信息
  })
  const indexIsLoading = ref(false)
  const indexIsDirty = ref(false) // 标记索引是否需要重建
  
  // 搜索索引（大数据量优化）
  const searchIndex = ref(new Map()) // 预处理的搜索索引：keyword -> 命令ID数组
  
  // ===== 分类索引持久化 =====
  const CATEGORY_INDEX_KEY = 'command-category-index'
  const INDEX_METADATA_KEY = 'command-index-metadata'
  
  /**
   * 保存分类索引到本地存储
   */
  const saveCategoryIndex = () => {
    try {
      const indexData = {}
      globalCategoryIndex.value.forEach((commands, categoryId) => {
        indexData[categoryId] = commands
      })
      
      // 使用utoolsDB或localStorage
      if (typeof window !== 'undefined' && window.utoolsDB) {
        window.utoolsDB.setItem(CATEGORY_INDEX_KEY, JSON.stringify(indexData))
        window.utoolsDB.setItem(INDEX_METADATA_KEY, JSON.stringify(indexMetadata.value))
      } else {
        localStorage.setItem(CATEGORY_INDEX_KEY, JSON.stringify(indexData))
        localStorage.setItem(INDEX_METADATA_KEY, JSON.stringify(indexMetadata.value))
      }
      
      console.log('分类索引已保存到本地存储')
    } catch (error) {
      console.error('保存分类索引失败:', error)
    }
  }
  
  /**
   * 从本地存储加载分类索引
   */
  const loadCategoryIndex = () => {
    try {
      let indexData = null
      let metadata = null
      
      // 从utoolsDB或localStorage读取
      if (typeof window !== 'undefined' && window.utoolsDB) {
        const indexStr = window.utoolsDB.getItem(CATEGORY_INDEX_KEY)
        const metaStr = window.utoolsDB.getItem(INDEX_METADATA_KEY)
        indexData = indexStr ? JSON.parse(indexStr) : null
        metadata = metaStr ? JSON.parse(metaStr) : null
      } else {
        const indexStr = localStorage.getItem(CATEGORY_INDEX_KEY)
        const metaStr = localStorage.getItem(INDEX_METADATA_KEY)
        indexData = indexStr ? JSON.parse(indexStr) : null
        metadata = metaStr ? JSON.parse(metaStr) : null
      }
      
      if (indexData && metadata) {
        // 恢复Map结构
        globalCategoryIndex.value.clear()
        Object.entries(indexData).forEach(([categoryId, commands]) => {
          globalCategoryIndex.value.set(categoryId, commands)
        })
        
        indexMetadata.value = metadata
        console.log(`分类索引已加载: ${Object.keys(indexData).length} 个分类，共 ${metadata.totalCommands} 条命令`)
        return true
      }
    } catch (error) {
      console.error('加载分类索引失败:', error)
    }
    return false
  }
  
  /**
   * 清除本地存储的分类索引
   */
  const clearCategoryIndex = () => {
    try {
      if (typeof window !== 'undefined' && window.utoolsDB) {
        window.utoolsDB.removeItem(CATEGORY_INDEX_KEY)
        window.utoolsDB.removeItem(INDEX_METADATA_KEY)
      } else {
        localStorage.removeItem(CATEGORY_INDEX_KEY)
        localStorage.removeItem(INDEX_METADATA_KEY)
      }
      
      globalCategoryIndex.value.clear()
      indexMetadata.value = {
        version: '1.0',
        lastUpdated: null,
        totalCommands: 0,
        categoryStats: {}
      }
      console.log('分类索引已清除')
    } catch (error) {
      console.error('清除分类索引失败:', error)
    }
  }
  
  /**
   * 构建全局分类索引
   */
  const buildGlobalCategoryIndex = async () => {
    if (indexIsLoading.value) return
    
    console.log('开始构建全局分类索引...', {
      totalCommands: commands.value.length,
      categoriesCount: categories.value.length
    })
    indexIsLoading.value = true
    
    try {
      const startTime = performance.now()
      
      // 清空现有索引
      globalCategoryIndex.value.clear()
      
      // 获取所有分类ID
      const allCategoryIds = ['all', 'recent', 'recycle-bin', ...categories.value.map(cat => cat.id)]
      
      // 大数据量优化：分片处理，避免阻塞UI
      const CHUNK_SIZE = 10 // 每次处理10个分类
      const chunks = []
      for (let i = 0; i < allCategoryIds.length; i += CHUNK_SIZE) {
        chunks.push(allCategoryIds.slice(i, i + CHUNK_SIZE))
      }
      
      // 分片构建索引
      for (const chunk of chunks) {
        await new Promise(resolve => {
          // 使用requestAnimationFrame确保不阻塞UI
          requestAnimationFrame(() => {
            for (const categoryId of chunk) {
              let categoryCommands = []
              
              if (categoryId === 'all') {
                // 全部命令（排除已删除的）
                categoryCommands = commands.value.filter(cmd => !cmd.isDeleted)
              } else if (categoryId === 'recent') {
                // 最近使用的命令 - 从已有的命令中筛选最近使用的
                const recentIds = recentCommands.value.map(cmd => cmd.id || cmd)
                categoryCommands = commands.value.filter(cmd => 
                  !cmd.isDeleted && recentIds.includes(cmd.id)
                )
              } else if (categoryId === 'recycle-bin') {
                // 回收站命令
                categoryCommands = commands.value.filter(cmd => cmd.isDeleted)
              } else {
                // 普通分类
                categoryCommands = commands.value.filter(cmd => {
                  return !cmd.isDeleted && cmd.category === categoryId
                })
              }
              
              // 存储到索引中
              globalCategoryIndex.value.set(categoryId, categoryCommands)
            }
            resolve()
          })
        })
      }
      
      // 更新元数据
      const stats = {}
      globalCategoryIndex.value.forEach((commands, categoryId) => {
        stats[categoryId] = {
          count: commands.length,
          lastUpdated: new Date().toISOString()
        }
      })
      
      indexMetadata.value = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        totalCommands: commands.value.length,
        categoryStats: stats
      }
      
      // 保存到本地存储
      saveCategoryIndex()
      
      indexIsDirty.value = false
      
      const duration = performance.now() - startTime
      console.log(`全局分类索引构建完成: ${globalCategoryIndex.value.size} 个分类，耗时 ${duration.toFixed(2)}ms`, {
        indexSize: globalCategoryIndex.value.size,
        indexKeys: Array.from(globalCategoryIndex.value.keys()),
        commandCounts: Object.fromEntries(
          Array.from(globalCategoryIndex.value.entries()).map(([key, cmds]) => [key, cmds.length])
        )
      })
      
    } catch (error) {
      console.error('构建全局分类索引失败:', error)
    } finally {
      indexIsLoading.value = false
    }
  }
  
  /**
   * 标记索引需要重建
   */
  const markIndexDirty = () => {
    indexIsDirty.value = true
  }
  
  /**
   * 更新单个命令在索引中的位置
   */
  const updateCommandInIndex = (command, oldCategoryId = null) => {
    try {
      // 从旧分类中移除
      if (oldCategoryId && globalCategoryIndex.value.has(oldCategoryId)) {
        const oldCategoryCommands = globalCategoryIndex.value.get(oldCategoryId)
        const index = oldCategoryCommands.findIndex(cmd => cmd.id === command.id)
        if (index > -1) {
          oldCategoryCommands.splice(index, 1)
        }
      }
      
      // 添加到新分类
      const newCategoryId = command.isDeleted ? 'recycle-bin' : command.category
      if (globalCategoryIndex.value.has(newCategoryId)) {
        const categoryCommands = globalCategoryIndex.value.get(newCategoryId)
        const existingIndex = categoryCommands.findIndex(cmd => cmd.id === command.id)
        if (existingIndex > -1) {
          // 更新现有命令
          categoryCommands[existingIndex] = command
        } else {
          // 添加新命令
          categoryCommands.push(command)
        }
      } else {
        // 创建新分类
        globalCategoryIndex.value.set(newCategoryId, [command])
      }
      
      // 更新"全部"分类
      if (globalCategoryIndex.value.has('all')) {
        const allCommands = globalCategoryIndex.value.get('all')
        const allIndex = allCommands.findIndex(cmd => cmd.id === command.id)
        if (allIndex > -1) {
          if (command.isDeleted) {
            allCommands.splice(allIndex, 1) // 删除命令时从"全部"中移除
          } else {
            allCommands[allIndex] = command // 更新命令
          }
        } else if (!command.isDeleted) {
          allCommands.push(command) // 新增命令时添加到"全部"
        }
      }
      
      // 保存索引
      saveCategoryIndex()
      
    } catch (error) {
      console.error('更新命令索引失败:', error)
      markIndexDirty() // 标记需要重建
    }
  }
  
  /**
   * 从索引中获取分类命令（替代原有的filteredCommands）
   */
  const getCommandsFromIndex = (categoryId, searchQuery = '', tags = []) => {
    const startTime = performance.now()
    
    // 从全局索引获取基础命令列表
    const baseCommands = globalCategoryIndex.value.get(categoryId) || []
    
    // 如果没有搜索和标签过滤，直接返回
    if (!searchQuery && tags.length === 0) {
      return baseCommands
    }
    
    // 大数据量优化：使用更高效的过滤方式
    let filteredCommands = baseCommands
    
    // 标签过滤（优化：提前过滤）
    if (tags.length > 0) {
      filteredCommands = filteredCommands.filter(cmd => {
        if (!cmd.tags || cmd.tags.length === 0) return false
        // 使用Set进行快速查找
        const cmdTagsSet = new Set(cmd.tags)
        return tags.some(tag => cmdTagsSet.has(tag))
      })
    }
    
    // 搜索过滤（优化：预编译正则表达式）
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      // 对于大数据量，使用更高效的字符串匹配
      filteredCommands = filteredCommands.filter(cmd => {
        const nameMatch = cmd.name.toLowerCase().includes(lowerQuery)
        const descMatch = cmd.description?.toLowerCase().includes(lowerQuery)
        const cmdMatch = cmd.command.toLowerCase().includes(lowerQuery)
        const tagMatch = cmd.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        
        return nameMatch || descMatch || cmdMatch || tagMatch
      })
    }
    
    const endTime = performance.now()
    if (endTime - startTime > 10) { // 只在耗时超过10ms时输出警告
      console.warn(`🐌 索引查询耗时过长: ${(endTime - startTime).toFixed(2)}ms，数据量: ${baseCommands.length} -> ${filteredCommands.length}`)
    }
    
    return filteredCommands
  }
  
  // ===== 搜索配置 =====
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'command', weight: 0.2 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true
  }
  
  // ===== 参数升级功能 =====
  
  /**
   * 升级命令参数到新的分类系统
   * @param {Object} command 原始命令
   * @returns {Object} 升级后的命令
   */
  const upgradeCommandParameters = (command) => {
    if (!command.parameters || !Array.isArray(command.parameters)) {
      return {
        ...command,
        parameterStats: {
          total: 0,
          required: 0,
          optional: 0,
          commandLevel: 0,
          optionLevel: 0,
          global: 0
        }
      }
    }
    
    const upgradedParameters = command.parameters.map(param => {
      return {
        ...param,
        // 添加级别信息（如果未设置）
        level: param.level || 'command',
        // 添加作用域信息
        scope: param.scope || 'local',
        // 添加位置信息
        position: param.position || 'positional',
        // 增强验证规则
        validation: {
          ...param.validation,
          classified: true,
          rules: []
        }
      }
    })
    
    return {
      ...command,
      parameters: upgradedParameters,
      // 添加参数统计
      parameterStats: {
        total: upgradedParameters.length,
        required: upgradedParameters.filter(p => p.required === true).length,
        optional: upgradedParameters.filter(p => p.required === false).length,
        commandLevel: upgradedParameters.filter(p => p.level === 'command').length,
        optionLevel: upgradedParameters.filter(p => p.level === 'option').length,
        global: upgradedParameters.filter(p => p.level === 'global').length
      }
    }
  }
  
  // ===== 计算属性 =====
  
  /**
   * 升级后的命令列表 - 懒加载，不在分类切换时触发
   */
  const commandCache = new Map()
  const enhancedCommands = computed(() => {
    // 注意：这个计算属性现在主要用于其他功能（如统计），
    // 不用于分类显示，避免影响切换性能
    if (!commands.value || !Array.isArray(commands.value)) {
      return []
    }
    return commands.value.map(cmd => {
      // 使用缓存避免重复升级相同的命令
      const cacheKey = `${cmd.id}-${cmd.updatedAt || cmd.createdAt}`
      if (commandCache.has(cacheKey)) {
        return commandCache.get(cacheKey)
      }
      
      const enhanced = upgradeCommandParameters(cmd)
      commandCache.set(cacheKey, enhanced)
      
      // 限制缓存大小，避免内存泄漏
      if (commandCache.size > 1000) {
        const firstKey = commandCache.keys().next().value
        commandCache.delete(firstKey)
      }
      
      return enhanced
    })
  })
  
  /**
   * 设置命令的默认复制内容
   * @param {string} commandId 命令ID
   * @param {string} fullCommand 完整命令
   */
  const setDefaultCopyCommand = (commandId, fullCommand) => {
    defaultCopyCommands.value[commandId] = fullCommand
    saveToStorage()
  }
  
  /**
   * 获取命令的默认复制内容
   * @param {string} commandId 命令ID
   * @returns {string} 默认复制的完整命令
   */
  const getDefaultCopyCommand = (commandId) => {
    // 查找命令对象
    const command = commands.value.find(cmd => cmd.id === commandId)
    
    if (command && command.commonCommands && command.commonCommands.length > 0) {
      // 优先使用标记为默认的常用完整命令
      const defaultCommand = command.commonCommands.find(cmd => cmd.isDefault)
      if (defaultCommand && defaultCommand.command) {
        return defaultCommand.command
      }
      
      // 如果没有默认标记，使用最近使用的常用命令
      const sortedCommands = command.commonCommands
        .filter(cmd => cmd.command && cmd.command.trim())
        .sort((a, b) => {
          // 按使用次数和最后使用时间排序
          if (a.usageCount !== b.usageCount) {
            return (b.usageCount || 0) - (a.usageCount || 0)
          }
          return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0)
        })
      
      if (sortedCommands.length > 0) {
        return sortedCommands[0].command
      }
    }
    
    // 如果手动设置了默认复制命令，使用设置的命令
    if (defaultCopyCommands.value[commandId]) {
      return defaultCopyCommands.value[commandId]
    }
    
    // 否则使用最近的构建命令
    const recentBuild = buildHistory.value
      .filter(item => item.templateId === commandId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
    
    return recentBuild?.finalCommand || null
  }
  
  /**
   * 切换命令的自动更新设置
   * @param {string} commandId 命令ID
   * @param {boolean} autoUpdate 是否自动更新
   */
  const setAutoUpdateCopyCommand = (commandId, autoUpdate) => {
    autoUpdateCopyCommand.value[commandId] = autoUpdate
    saveToStorage()
  }
  
  /**
   * 添加常用完整命令
   * @param {string} commandId 命令ID
   * @param {string} fullCommand 完整命令
   */
  const addFrequentCommand = (commandId, fullCommand) => {
    if (!frequentCommands.value[commandId]) {
      frequentCommands.value[commandId] = []
    }
    
    // 避免重复添加
    if (!frequentCommands.value[commandId].includes(fullCommand)) {
      frequentCommands.value[commandId].unshift(fullCommand)
      // 最多保留10个常用命令
      if (frequentCommands.value[commandId].length > 10) {
        frequentCommands.value[commandId] = frequentCommands.value[commandId].slice(0, 10)
      }
    }
    saveToStorage()
  }
  
  /**
   * 获取命令的常用完整命令列表
   * @param {string} commandId 命令ID
   * @returns {Array} 常用完整命令数组
   */
  const getFrequentCommands = (commandId) => {
    return frequentCommands.value[commandId] || []
  }

  /**
   * 更新常用完整命令的使用统计
   * @param {string} commandId 命令ID
   * @param {string} executedCommand 执行的命令
   */
  const updateCommonCommandUsage = (commandId, executedCommand) => {
    const command = commands.value.find(cmd => cmd.id === commandId)
    if (!command || !command.commonCommands) return

    // 查找匹配的常用命令
    const commonCommand = command.commonCommands.find(cmd => cmd.command === executedCommand)
    if (commonCommand) {
      commonCommand.usageCount = (commonCommand.usageCount || 0) + 1
      commonCommand.lastUsed = new Date().toISOString()
      
      // 如果没有设置默认命令，自动将最常用的设为默认
      const hasDefault = command.commonCommands.some(cmd => cmd.isDefault)
      if (!hasDefault) {
        // 重置所有默认状态
        command.commonCommands.forEach(cmd => cmd.isDefault = false)
        // 设置当前命令为默认
        commonCommand.isDefault = true
      }
      
      saveToStorage()
    }
  }
  
  /**
   * 更新显示设置
   * @param {Object} settings 新的显示设置
   */
  const updateDisplaySettings = (settings) => {
    displaySettings.value = { ...displaySettings.value, ...settings }
    saveToStorage()
  }
  
  /**
   * 获取显示设置
   * @returns {Object} 当前显示设置
   */
  const getDisplaySettings = () => {
    return displaySettings.value
  }

  /**
   * 获取叶子分类（没有子分类的分类）
   * @returns {Array} 叶子分类数组
   */
  const getLeafCategories = () => {
    // 获取所有分类ID
    const allCategoryIds = categories.value.map(cat => cat.id)
    
    // 找出没有子分类的分类（叶子分类）
    const leafCategories = categories.value.filter(category => {
      // 检查是否有其他分类以此分类ID为父级
      const hasChildren = categories.value.some(otherCategory => 
        otherCategory.parentId === category.id
      )
      return !hasChildren
    })
    
    return leafCategories
  }

  /**
   * 更新分类索引 - 超快速分类映射
   */
  const updateCategoryIndex = () => {
    const index = new Map()
    const allCommands = []
    const recycleBinCommands = []
    
    // 单次遍历，最小化操作
    for (const cmd of commands.value) {
      if (cmd.isDeleted) {
        recycleBinCommands.push(cmd)
    } else {
        allCommands.push(cmd)
        
        // 直接操作，避免重复检查
        const categoryCommands = index.get(cmd.category)
        if (categoryCommands) {
          categoryCommands.push(cmd)
        } else {
          index.set(cmd.category, [cmd])
        }
      }
    }
    
    // 设置特殊分类
    index.set('all', allCommands)
    index.set('recycle-bin', recycleBinCommands)
    
    // 最近使用命令（简化处理）
    const recentCommandObjects = []
    for (const id of recentCommands.value) {
      const cmd = commands.value.find(c => c.id === id)
      if (cmd && !cmd.isDeleted) {
        recentCommandObjects.push(cmd)
      }
    }
    index.set('recent', recentCommandObjects)
    
    categoryIndex.value = index
  }

    /**
   * 过滤后的命令列表（使用预计算索引，无参数升级）
   */
  const filteredCommands = computed(() => {
    const category = selectedCategory.value
    const tags = selectedTags.value
    const query = currentSearchQuery.value.trim()
    
    // 优先使用全局索引
    if (globalCategoryIndex.value.size > 0) {
      return getCommandsFromIndex(category, query, tags)
    }
    
    // 回退到原有的分类索引（兼容性）
    let filtered = categoryIndex.value.get(category) || []
    
    // 对于基本分类切换，直接返回原始命令（最快）
    if (tags.length === 0 && !query) {
      return filtered
    }
    
    // 只在有搜索或标签时才进行过滤
    const result = filtered.filter(cmd => {
    // 标签过滤
      if (tags.length > 0) {
        if (!cmd.tags || !tags.some(tag => cmd.tags.includes(tag))) {
          return false
        }
    }
    
    // 搜索过滤
      if (query) {
        const lowerQuery = query.toLowerCase()
        return cmd.name.toLowerCase().includes(lowerQuery) ||
          cmd.description?.toLowerCase().includes(lowerQuery) ||
          cmd.command.toLowerCase().includes(lowerQuery) ||
          cmd.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    }
    
      return true
    })
    
    return result
  })
  
  /**
   * 所有标签（增强版）
   */
  const allTags = computed(() => {
    const tagMap = new Map()
    enhancedCommands.value.forEach(cmd => {
      if (cmd.tags && Array.isArray(cmd.tags)) {
        cmd.tags.forEach(tag => {
          if (tagMap.has(tag)) {
            tagMap.set(tag, tagMap.get(tag) + 1)
          } else {
            tagMap.set(tag, 1)
          }
        })
      }
    })
    
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ name: tag, count }))
      .sort((a, b) => b.count - a.count)
  })
  
  /**
   * 分类树（增强版）
   */
  const categoryTree = computed(() => {
    const tree = []
    const categoryMap = new Map()
    
    // 创建分类映射
    categories.value.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        commandCount: 0,
        hasCommands: false
      })
    })
    
    // 计算命令数量
    enhancedCommands.value.forEach(cmd => {
      if (!cmd.isDeleted && categoryMap.has(cmd.category)) {
        const cat = categoryMap.get(cmd.category)
        cat.commandCount++
        cat.hasCommands = true
        
        // 更新父分类的计数
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          categoryMap.get(cat.parentId).commandCount++
          categoryMap.get(cat.parentId).hasCommands = true
        }
      }
    })
    
    // 构建树形结构
    categoryMap.forEach(cat => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          parent.children.push(cat)
        }
      } else {
        tree.push(cat)
      }
    })
    
    // 排序子分类
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          // 按照排序偏好或名称排序
          const aPref = sortPreferences.value.categories.indexOf(a.id)
          const bPref = sortPreferences.value.categories.indexOf(b.id)
          
          if (aPref !== -1 && bPref !== -1) {
            return aPref - bPref
          } else if (aPref !== -1) {
            return -1
          } else if (bPref !== -1) {
            return 1
          } else {
            return a.name.localeCompare(b.name)
          }
        })
        
        node.children.forEach(sortChildren)
      }
    }
    
    tree.forEach(sortChildren)
    return tree
  })
  
  // ===== 增强的命令操作 =====
  
  /**
   * 创建增强命令
   * @param {Object} commandData 命令数据
   * @param {Object} options 创建选项
   * @returns {Promise<Object>} 创建结果
   */
  const createEnhancedCommand = async (commandData, options = {}) => {
    try {
      // 使用增强的参数构建器
      const paramBuilder = createEnhancedParameterBuilder()
      
      // 如果有参数定义，进行分类处理
      if (commandData.parameters && Array.isArray(commandData.parameters)) {
        commandData.parameters.forEach(param => {
          // 根据参数类型添加到构建器
          if (param.required && param.level === ParameterLevel.COMMAND) {
            paramBuilder.addRequiredCommand(param.name, param.description, param)
          } else if (!param.required && param.level === ParameterLevel.COMMAND) {
            paramBuilder.addOptionalCommand(param.name, param.description, param.defaultValue, param)
          } else if (param.level === ParameterLevel.OPTION) {
            paramBuilder.addOptionParameter(param.name, param.parentOption, param.description, param.required, param)
          } else if (param.conditionalOn) {
            paramBuilder.addConditionalParameter(param.name, param.description, param.conditionalOn, param)
          } else if (param.level === ParameterLevel.GLOBAL) {
            paramBuilder.addGlobalParameter(param.name, param.description, param)
          }
        })
        
        // 替换为分类后的参数
        commandData.parameters = paramBuilder.getParameters()
      }
      
      // 使用集成管理器创建命令
      const result = await commandManager.createCommand(commandData, {
        categories: categories.value,
        existingCommands: commands.value,
        ...options
      })
      
      if (result.success) {
        // 添加到命令列表
        addCommand(result.command)
        
        // 保存验证结果
        if (result.validation) {
          validationResults.value[result.command.id] = result.validation
        }
        
        // 保存建议
        if (result.suggestions) {
          suggestions.value[result.command.id] = result.suggestions
        }
      }
      
      return result
    } catch (error) {
      console.error('Enhanced command creation failed:', error)
      return {
        success: false,
        errors: [{ type: 'system', message: error.message }]
      }
    }
  }
  
  /**
   * 构建增强命令
   * @param {Object} command 命令对象
   * @param {Object} buildConfig 构建配置
   * @returns {Promise<Object>} 构建结果
   */
  const buildEnhancedCommand = async (command, buildConfig = {}) => {
    try {
      // 升级命令定义
      const enhancedCommand = upgradeCommandParameters(command)
      
      // 增强构建配置
      const enhancedBuildConfig = {
        mode: 'executable',
        useDefaults: true,
        validateRequired: true,
        escapeValues: true,
        ...buildConfig,
        // 添加分类验证
        validateByClassification: true,
        // 添加智能建议
        enableSuggestions: true
      }
      
      // 使用集成管理器构建
      const result = await commandManager.buildCommand(enhancedCommand, enhancedBuildConfig)
      
      if (result.success) {
        // 添加到构建历史
        buildHistory.value.unshift({
          commandId: command.id,
          config: enhancedBuildConfig,
          result: result.builtCommand,
          timestamp: new Date().toISOString(),
          metadata: result.metadata
        })
        
        // 限制历史记录数量
        if (buildHistory.value.length > 50) {
          buildHistory.value = buildHistory.value.slice(0, 50)
        }
        
        // 更新使用统计
        updateCommandStats(command.id)
      }
      
      return result
    } catch (error) {
      console.error('Enhanced command build failed:', error)
      return {
        success: false,
        errors: [{ type: 'system', message: error.message }]
      }
    }
  }
  
  /**
   * 获取命令构建建议
   * @param {Object} command 命令对象
   * @param {Object} partialConfig 部分配置
   * @returns {Object} 建议结果
   */
  const getCommandSuggestions = (command, partialConfig = {}) => {
    try {
      const enhancedCommand = upgradeCommandParameters(command)
      return commandManager.getCommandBuildSuggestions(enhancedCommand, partialConfig)
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      return {
        parameters: [],
        options: [],
        combinations: [],
        warnings: [],
        error: error.message
      }
    }
  }
  
  /**
   * 分析命令结构
   * @param {string|Object} input 命令输入
   * @param {Object} options 分析选项
   * @returns {Object} 分析结果
   */
  const analyzeCommand = (input, options = {}) => {
    try {
      return commandManager.analyzeCommandComprehensive(input, options)
    } catch (error) {
      console.error('Command analysis failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  // ===== 基础命令操作 =====
  
  /**
   * 添加命令
   * @param {Object} command 命令对象
   */
  const addCommand = (command) => {
    // 确保有必要的元数据
    const enhancedCommand = {
      ...command,
      id: command.id || generateId(),
      isUserCreated: command.isUserCreated !== undefined ? command.isUserCreated : true,
      createdAt: command.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: command.usageCount || 0,
      lastUsed: command.lastUsed || null
    }
    
    commands.value.push(enhancedCommand)
    updateCategoryIndex() // 立即更新索引
    
    // 更新全局索引
    updateCommandInIndex(enhancedCommand)
    
    saveToStorage()
  }

  /**
   * 创建通用命令结构
   * @param {Object} config 配置对象
   * @returns {UniversalCommandStructure} 通用命令结构实例
   */
  const createUniversalCommand = (config = {}) => {
    return new UniversalCommandStructure(config)
  }

  /**
   * 从现有命令创建通用结构
   * @param {Object} command 现有命令对象
   * @returns {UniversalCommandStructure} 通用命令结构实例
   */
  const convertToUniversalStructure = (command) => {
    const structure = new UniversalCommandStructure({
      id: command.id,
      name: command.name || command.commandName,
      description: command.description,
      category: command.category,
      mainCommand: command.mainCommand,
      tags: command.tags || [],
      author: command.author || 'User',
      created: command.createdAt ? new Date(command.createdAt) : new Date(),
      updated: command.updatedAt ? new Date(command.updatedAt) : new Date()
    })

    // 转换子命令
    if (command.subcommands) {
      command.subcommands.forEach(sub => {
        structure.addSubcommand({
          name: sub.name,
          type: sub.type || 'OPTIONAL',
          description: sub.description || '',
          aliases: sub.aliases || []
        })
      })
    }

    // 转换参数
    if (command.parameters) {
      command.parameters.forEach((param, index) => {
        structure.addParameter({
          name: param.name,
          type: param.type || 'OPTIONAL',
          dataType: param.dataType || 'STRING',
          description: param.description || '',
          placeholder: param.placeholder || '',
          position: index,
          repeatable: param.repeatable || false
        })
      })
    }

    // 转换选项
    if (command.options) {
      command.options.forEach(option => {
        structure.addOption({
          name: option.name || option.longName || option.shortName,
          shortFlag: option.shortName,
          longFlag: option.longName,
          type: option.type || 'OPTIONAL',
          description: option.description || '',
          parameterRequired: option.hasParameter || false,
          parameterDataType: option.parameterType || 'STRING'
        })
      })
    }

    return structure
  }

  /**
   * 构建通用命令
   * @param {UniversalCommandStructure} structure 命令结构
   * @param {Object} selections 用户选择和输入
   * @returns {String} 构建的命令字符串
   */
  const buildUniversalCommand = (structure, selections = {}) => {
    const builder = new UniversalCommandBuilder(structure)

    // 应用子命令选择
    if (selections.subcommands) {
      selections.subcommands.forEach(name => {
        builder.selectSubcommand(name)
      })
    }

    // 应用选项选择
    if (selections.options) {
      Object.entries(selections.options).forEach(([name, value]) => {
        builder.selectOption(name, value)
      })
    }

    // 应用参数值
    if (selections.parameters) {
      Object.entries(selections.parameters).forEach(([name, value]) => {
        builder.setParameter(name, value)
      })
    }

    return builder.build()
  }

  /**
   * 获取命令模板
   * @param {String} type 模板类型 ('git', 'docker', 'npm')
   * @returns {UniversalCommandStructure} 命令模板
   */
  const getCommandTemplate = (type) => {
    switch (type) {
      case 'git':
        return CommandTemplateFactory.createGitTemplate()
      case 'docker':
        return CommandTemplateFactory.createDockerTemplate()
      case 'npm':
        return CommandTemplateFactory.createNpmTemplate()
      default:
        return new UniversalCommandStructure()
    }
  }

  /**
   * 添加通用命令（从UniversalCommandStructure）
   * @param {UniversalCommandStructure} structure 通用命令结构
   */
  const addUniversalCommand = (structure) => {
    const commandData = structure.toCommandData()
    addCommand(commandData)
  }
  
  /**
   * 更新命令
   * @param {string} commandId 命令ID
   * @param {Object} updates 更新数据
   */
  const updateCommand = (commandId, updates) => {
    const index = commands.value.findIndex(cmd => cmd.id === commandId)
    if (index !== -1) {
      const oldCommand = commands.value[index]
      const oldCategoryId = oldCommand.category
      
      commands.value[index] = {
        ...oldCommand,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // 更新全局索引
      updateCommandInIndex(commands.value[index], oldCategoryId)
      
      saveToStorage()
    }
  }
  
  /**
   * 删除命令（移到回收站）
   * @param {string} commandId 命令ID
   */
  const deleteCommand = (commandId) => {
    updateCommand(commandId, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    })
  }
  
  /**
   * 永久删除命令
   * @param {string} commandId 命令ID
   */
  const permanentDeleteCommand = (commandId) => {
    const index = commands.value.findIndex(cmd => cmd.id === commandId)
    if (index !== -1) {
      const command = commands.value[index]
      commands.value.splice(index, 1)
      
      // 从全局索引中移除
      globalCategoryIndex.value.forEach((categoryCommands) => {
        const cmdIndex = categoryCommands.findIndex(cmd => cmd.id === commandId)
        if (cmdIndex > -1) {
          categoryCommands.splice(cmdIndex, 1)
        }
      })
      
      // 保存索引
      saveCategoryIndex()
      saveToStorage()
    }
  }
  
  /**
   * 恢复命令
   * @param {string} commandId 命令ID
   */
  const restoreCommand = (commandId) => {
    const command = commands.value.find(cmd => cmd.id === commandId)
    if (command) {
      delete command.isDeleted
      delete command.deletedAt
      command.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }
  
  // ===== 分类操作 =====
  
  /**
   * 添加分类
   * @param {Object} category 分类对象
   */
  const addCategory = (category) => {
    const newCategory = {
      ...category,
      id: category.id || generateId(),
      isUserCreated: true
    }
    categories.value.push(newCategory)
    saveToStorage()
  }
  
  /**
   * 更新分类
   * @param {string} categoryId 分类ID
   * @param {Object} updates 更新数据
   */
  const updateCategory = (categoryId, updates) => {
    const index = categories.value.findIndex(cat => cat.id === categoryId)
    if (index !== -1) {
      categories.value[index] = {
        ...categories.value[index],
        ...updates
      }
      saveToStorage()
    }
  }
  
  /**
   * 删除分类
   * @param {string} categoryId 分类ID
   */
  const deleteCategory = (categoryId) => {
    // 检查是否有子分类
    const hasChildren = categories.value.some(cat => cat.parentId === categoryId)
    if (hasChildren) {
      throw new Error('无法删除包含子分类的分类')
    }
    
    // 检查是否有命令使用此分类
    const hasCommands = commands.value.some(cmd => cmd.category === categoryId)
    if (hasCommands) {
      throw new Error('无法删除包含命令的分类')
    }
    
    const index = categories.value.findIndex(cat => cat.id === categoryId)
    if (index !== -1) {
      categories.value.splice(index, 1)
      saveToStorage()
    }
  }

  /**
   * 更新分类的顺序和父子关系
   * @param {Object} payload - { movedItemId, newParentId, newIndex, orderedIds }
   */
  const updateCategoryOrder = (payload) => {
    const { movedItemId, newParentId, newIndex } = payload
    const movedCategory = categories.value.find(c => c.id === movedItemId)

    if (!movedCategory) return

    // 更新父级
    movedCategory.parentId = newParentId
    
    // 更新层级
    if (newParentId) {
      const parent = categories.value.find(c => c.id === newParentId)
      movedCategory.level = parent ? parent.level + 1 : 0
    } else {
      movedCategory.level = 0
    }

    // 更新整个列表的顺序以反映拖拽结果
    // 这是一个简化逻辑，实际可能需要更复杂的树操作
    const newOrderedCategories = []
    const rootCategories = categories.value.filter(c => !c.parentId)
    
    // 此处需要一个能根据 orderedIds 重建整个分类树顺序的算法
    // 为了简化，我们暂时只更新 parentId 和 level，并依赖后续的计算属性重建树
    
    saveToStorage()
  }
  
  // ===== 搜索和过滤 =====
  
  /**
   * 设置搜索查询
   * @param {string} query 搜索查询
   */
  const setSearchQuery = (query) => {
    currentSearchQuery.value = query
    
    // 添加到搜索历史
    if (query.trim() && !searchHistory.value.includes(query.trim())) {
      searchHistory.value.unshift(query.trim())
      if (searchHistory.value.length > 20) {
        searchHistory.value = searchHistory.value.slice(0, 20)
      }
      saveToStorage()
    }
  }
  
  /**
   * 设置选中的分类
   * @param {string} categoryId 分类ID
   */
  const setSelectedCategory = (categoryId) => {
    selectedCategory.value = categoryId
  }
  
  /**
   * 设置选中的标签
   * @param {Array} tags 标签数组
   */
  const setSelectedTags = (tags) => {
    selectedTags.value = tags
  }
  
  // ===== 统计功能 =====
  
  /**
   * 更新命令使用统计
   * @param {string} commandId 命令ID
   */
  const updateCommandStats = (commandId) => {
    const command = commands.value.find(cmd => cmd.id === commandId)
    if (command) {
      command.usageCount = (command.usageCount || 0) + 1
      command.lastUsed = new Date().toISOString()
      
      // 更新最近使用的命令
      recentCommands.value = recentCommands.value.filter(id => id !== commandId)
      recentCommands.value.unshift(commandId)
      if (recentCommands.value.length > 10) {
        recentCommands.value = recentCommands.value.slice(0, 10)
      }
      
      saveToStorage()
    }
  }
  
  /**
   * 获取参数分类统计
   * @returns {Object} 统计信息
   */
  const getParameterStatistics = computed(() => {
    const stats = {
      total: 0,
      byRequirement: {
        required: 0,
        optional: 0,
        conditional: 0
      },
      byLevel: {
        command: 0,
        option: 0,
        global: 0,
        subcommand: 0
      },
      byScope: {
        global: 0,
        local: 0,
        inherited: 0,
        isolated: 0
      }
    }
    
    if (enhancedCommands.value && Array.isArray(enhancedCommands.value)) {
      enhancedCommands.value.forEach(command => {
        if (command && command.parameters && Array.isArray(command.parameters)) {
          command.parameters.forEach(param => {
            stats.total++
            
            // 按必要性统计
            if (param.required === true) {
              stats.byRequirement.required++
            } else if (param.conditionalOn) {
              stats.byRequirement.conditional++
            } else {
              stats.byRequirement.optional++
            }
            
            // 按级别统计
            if (param.level) {
              stats.byLevel[param.level] = (stats.byLevel[param.level] || 0) + 1
            }
            
            // 按作用域统计
            if (param.scope) {
              stats.byScope[param.scope] = (stats.byScope[param.scope] || 0) + 1
            }
          })
        }
      })
    }
    
    return stats
  })
  
  // ===== 排序操作 =====

  /**
   * 更新排序顺序
   * @param {string} type 'categories' or 'commands'
   * @param {Array} orderedIds ID数组
   */
  const updateSortOrder = (type, orderedIds) => {
    if (sortPreferences.value[type]) {
      sortPreferences.value[type] = orderedIds
      saveToStorage()
    }
  }

  // ===== 工具函数 =====
  
  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  /**
   * 保存数据到存储
   */
  const saveToStorage = () => {
    const userData = {
      userCommands: commands.value.filter(cmd => cmd.isUserCreated),
      userCategories: categories.value.filter(cat => cat.isUserCreated),
      searchHistory: searchHistory.value,
      commandStats: commandStats.value,
      recentCommands: recentCommands.value,
      sortPreferences: sortPreferences.value,
      buildHistory: buildHistory.value.slice(0, 50), // 只保存最近50条
      // 智能复制设置
      defaultCopyCommands: defaultCopyCommands.value,
      autoUpdateCopyCommand: autoUpdateCopyCommand.value,
      frequentCommands: frequentCommands.value,
      displaySettings: displaySettings.value,
      lastSaveDate: new Date().toISOString()
    }
    
    if (window.utoolsDB) {
      window.utoolsDB.put('command-user-data', userData)
    } else {
      localStorage.setItem('command-handbook-user-data', JSON.stringify(userData))
    }
  }
  
  /**
   * 迁移命令数据（兼容旧版本）
   * @param {Array} oldCommands 旧版本命令数据
   * @returns {Array} 迁移后的命令数据
   */
  const migrateCommands = (oldCommands) => {
    if (!Array.isArray(oldCommands)) {
      return []
    }
    
    return oldCommands.map(cmd => {
      // 确保命令有必要的字段
      return {
        id: cmd.id || generateId(),
        name: cmd.name || '未命名命令',
        command: cmd.command || '',
        description: cmd.description || '',
        category: cmd.category || 'all',
        tags: Array.isArray(cmd.tags) ? cmd.tags : [],
        parameters: Array.isArray(cmd.parameters) ? cmd.parameters : [],
        isUserCreated: cmd.isUserCreated || false,
        createdAt: cmd.createdAt || new Date().toISOString(),
        updatedAt: cmd.updatedAt || new Date().toISOString(),
        usageCount: cmd.usageCount || 0,
        lastUsed: cmd.lastUsed || null
      }
    })
  }
  
  /**
   * 从存储加载数据
   */
  const loadFromStorage = async () => {
    let userData = null
    
    if (window.utoolsDB) {
      const result = window.utoolsDB.get('command-user-data')
      userData = result?.data
    } else {
      const stored = localStorage.getItem('command-handbook-user-data')
      userData = stored ? JSON.parse(stored) : null
    }
    
    if (userData) {
      // 合并用户数据
      if (userData.userCategories) {
        userData.userCategories.forEach(category => {
          category.isUserCreated = true
          categories.value.push(category)
        })
      }
      
      if (userData.userCommands) {
        const migratedUserCommands = migrateCommands(userData.userCommands)
        migratedUserCommands.forEach(command => {
          command.isUserCreated = true
          commands.value.push(command)
        })
      }
      
      // 恢复其他数据
      searchHistory.value = userData.searchHistory || []
      commandStats.value = userData.commandStats || {}
      recentCommands.value = userData.recentCommands || []
      sortPreferences.value = userData.sortPreferences || { categories: [], tags: [], commands: [] }
      buildHistory.value = userData.buildHistory || []
      
      // 恢复智能复制设置
      if (userData.defaultCopyCommands) {
        defaultCopyCommands.value = userData.defaultCopyCommands
      }
      if (userData.autoUpdateCopyCommand) {
        autoUpdateCopyCommand.value = userData.autoUpdateCopyCommand
      }
      if (userData.frequentCommands) {
        frequentCommands.value = userData.frequentCommands
      }
      if (userData.displaySettings) {
        displaySettings.value = { ...displaySettings.value, ...userData.displaySettings }
      }
    }
    
    // 尝试加载全局分类索引
    const indexLoaded = loadCategoryIndex()
    
    // 如果索引未加载成功或数据不匹配，重建索引
    if (!indexLoaded || indexMetadata.value.totalCommands !== commands.value.length) {
      console.log('全局分类索引需要重建...')
      await buildGlobalCategoryIndex()
    } else {
      console.log('全局分类索引加载成功')
    }
  }
  
  /**
   * 初始化示例数据
   */
  const initializeData = () => {
    try {
      // 添加基础命令
      const baseCommands = [
        // Git 命令
        {
          id: generateId(),
          name: 'Git 初始化仓库',
          command: 'git init',
          description: '在当前目录初始化Git仓库',
          category: 'git-basic',
          tags: ['git', 'init', '初始化'],
          parameters: [],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Git 克隆仓库',
          command: 'git clone {{url}}',
          description: '从远程仓库克隆代码',
          category: 'git-basic',
          tags: ['git', 'clone', '克隆'],
          parameters: [
            { name: 'url', description: '仓库地址', required: true, defaultValue: '', commonValues: [] }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Git 查看状态',
          command: 'git status',
          description: '查看当前仓库状态',
          category: 'git-basic',
          tags: ['git', 'status', '状态'],
          parameters: [],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Git 添加文件',
          command: 'git add {{files}}',
          description: '添加文件到暂存区',
          category: 'git-basic',
          tags: ['git', 'add', '暂存'],
          parameters: [
            { name: 'files', description: '文件路径', required: false, defaultValue: '.', commonValues: ['.', '*.js', '*.vue'] }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Git 提交更改',
          command: 'git commit -m "{{message}}"',
          description: '提交暂存区的更改',
          category: 'git-basic',
          tags: ['git', 'commit', '提交'],
          parameters: [
            { name: 'message', description: '提交消息', required: true, defaultValue: '', commonValues: ['feat: 新功能', 'fix: 修复bug', 'docs: 更新文档'] }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Git 查看分支',
          command: 'git branch -a',
          description: '查看所有分支（本地和远程）',
          category: 'git-branch',
          tags: ['git', 'branch', '分支'],
          parameters: [],
          commonCommands: [
            { name: '查看所有分支', command: 'git branch -a', isDefault: true, usageCount: 0, lastUsed: null },
            { name: '查看本地分支', command: 'git branch', isDefault: false, usageCount: 0, lastUsed: null },
            { name: '查看远程分支', command: 'git branch -r', isDefault: false, usageCount: 0, lastUsed: null }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Git 切换分支',
          command: 'git checkout {{branch}}',
          description: '切换到指定分支',
          category: 'git-branch',
          tags: ['git', 'checkout', '切换'],
          parameters: [
            { name: 'branch', description: '分支名称', required: true, defaultValue: '', commonValues: ['main', 'master', 'develop'] }
          ],
          commonCommands: [
            { name: '切换到主分支', command: 'git checkout main', isDefault: true, usageCount: 0, lastUsed: null },
            { name: '切换到开发分支', command: 'git checkout develop', isDefault: false, usageCount: 0, lastUsed: null },
            { name: '创建并切换分支', command: 'git checkout -b feature/new-branch', isDefault: false, usageCount: 0, lastUsed: null }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Git 推送到远程',
          command: 'git push origin {{branch}}',
          description: '推送本地分支到远程仓库',
          category: 'git-remote',
          tags: ['git', 'push', '推送'],
          parameters: [
            { name: 'branch', description: '分支名称', required: false, defaultValue: 'main', commonValues: ['main', 'master', 'develop'] }
          ],
          commonCommands: [
            { name: '推送到主分支', command: 'git push origin main', isDefault: true, usageCount: 0, lastUsed: null },
            { name: '推送到开发分支', command: 'git push origin develop', isDefault: false, usageCount: 0, lastUsed: null },
            { name: '强制推送', command: 'git push origin main --force', isDefault: false, usageCount: 0, lastUsed: null }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        
        // Docker 命令
        {
          id: generateId(),
          name: 'Docker 查看容器',
          command: 'docker ps -a',
          description: '列出所有Docker容器',
          category: 'docker',
          tags: ['docker', 'ps', '容器'],
          parameters: [],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'Docker 运行容器',
          command: 'docker run -d --name {{name}} {{image}}',
          description: '以守护进程模式运行Docker容器',
          category: 'docker',
          tags: ['docker', 'run', '运行'],
          parameters: [
            { name: 'name', description: '容器名称', required: true, defaultValue: '', commonValues: [] },
            { name: 'image', description: '镜像名称', required: true, defaultValue: '', commonValues: ['nginx', 'mysql', 'redis'] }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        
        // NPM 命令
        {
          id: generateId(),
          name: 'NPM 安装依赖',
          command: 'npm install',
          description: '安装package.json中的所有依赖',
          category: 'npm',
          tags: ['npm', 'install', '依赖'],
          parameters: [],
          commonCommands: [
            { name: '安装所有依赖', command: 'npm install', isDefault: true, usageCount: 0, lastUsed: null },
            { name: '安装并保存依赖', command: 'npm install --save', isDefault: false, usageCount: 0, lastUsed: null },
            { name: '安装开发依赖', command: 'npm install --save-dev', isDefault: false, usageCount: 0, lastUsed: null }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'NPM 安装包',
          command: 'npm install {{package}}',
          description: '安装指定的NPM包',
          category: 'npm',
          tags: ['npm', 'install', '包'],
          parameters: [
            { name: 'package', description: '包名称', required: true, defaultValue: '', commonValues: ['vue', 'react', 'lodash', 'axios'] }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: generateId(),
          name: 'NPM 运行脚本',
          command: 'npm run {{script}}',
          description: '运行package.json中定义的脚本',
          category: 'npm',
          tags: ['npm', 'run', '脚本'],
          parameters: [
            { name: 'script', description: '脚本名称', required: true, defaultValue: '', commonValues: ['dev', 'build', 'test', 'start'] }
          ],
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usageCount: 0
        }
      ]
      
      commands.value.push(...baseCommands)
      
      // 如果没有用户数据，创建初始示例
      if (commands.value.filter(cmd => cmd.isUserCreated).length === 0) {
        createInitialUserData()
      }
      
      console.log(`已加载 ${baseCommands.length} 个基础命令`)
      
    } catch (error) {
      console.error('初始化命令数据失败:', error)
      // 出错时仍然创建初始数据
      createInitialUserData()
    }
  }
  
  /**
   * 创建初始用户示例数据
   */
  const createInitialUserData = () => {
    // 添加用户创建的示例分类
    const userCategory = {
      id: 'my-custom-commands',
      name: '我的常用命令',
      color: '#8b5cf6',
      level: 0,
      parentId: null,
      isUserCreated: true
    }
    categories.value.push(userCategory)
    
    // 创建一个用户示例命令模板
    const userCommand = {
      id: generateId(),
      name: '快速启动项目',
      description: '开发项目快速启动命令模板',
      category: 'my-custom-commands',
      tags: ['开发', '启动', '自定义'],
      templateData: {
        name: 'npm',
        category: 'my-custom-commands',
        tags: ['开发', '启动', '自定义'],
        subcommands: [
          { name: 'run', description: '运行脚本' },
          { name: 'start', description: '启动应用' }
        ],
        options: [
          { name: 'port', longFlag: '--port', description: '指定端口号' }
        ],
        parameters: [
          { 
            name: 'project', 
            commonValues: [
              { value: 'my-app' },
              { value: 'current' },
              { value: 'webapp' }
            ], 
            defaultValueIndex: 1, 
            required: false 
          }
        ],
        commonCommands: [
          { name: '启动开发服务器', command: 'npm run dev --port 3000', description: '在3000端口启动开发服务器' }
        ]
      },
      isUserCreated: true,
      isSystemExample: false,
      created: new Date(),
      updated: new Date()
    }
    
    commands.value.push(userCommand)
    
    // 保存用户数据
    saveToStorage()
    
    console.log('创建初始用户数据完成')
  }
  
  // ===== 初始化 =====
  
  // 同步初始化基础数据
  initializeData()
  
  // 异步初始化函数
  const initializeStore = async () => {
    try {
      // 加载存储的数据（包括全局索引）
      await loadFromStorage()
      
      // 更新分类索引（兼容性保证）
      updateCategoryIndex()
      
      console.log('Store初始化完成')
    } catch (error) {
      console.error('Store初始化失败:', error)
      // 发生错误时，至少确保基础分类索引可用
      updateCategoryIndex()
    }
  }
  
  // 立即建立基础分类索引（确保UI可用）
  updateCategoryIndex()
  
  // 启动异步初始化
  initializeStore()
  
  // ===== 返回接口 =====
  
  return {
    // 基础数据
    commands: enhancedCommands,
    categories,
    filteredCommands,
    allTags,
    categoryTree,
    
    // 搜索和过滤状态
    currentSearchQuery,
    selectedCategory,
    selectedTags,
    searchHistory,
    
    // 增强功能状态
    buildHistory,
    validationResults,
    suggestions,
    recentCommands,
    sortPreferences,
    
    // 核心方法 - 增强版本
    createEnhancedCommand,
    buildEnhancedCommand,
    getCommandSuggestions,
    analyzeCommand,
    upgradeCommandParameters,
    
    // 基础命令操作
    addCommand,
    updateCommand,
    deleteCommand,
    permanentDeleteCommand,
    restoreCommand,
    
    // 分类操作
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryOrder,
    
    // 排序操作
    updateSortOrder,

    // 搜索和过滤
    setSearchQuery,
    setSelectedCategory,
    setSelectedTags,
    
    // 统计功能
    updateCommandStats,
    getParameterStatistics,
    
    // 分类查询
    getLeafCategories,
    
    // 智能复制功能
    setDefaultCopyCommand,
    getDefaultCopyCommand,
    setAutoUpdateCopyCommand,
    addFrequentCommand,
    getFrequentCommands,
    updateCommonCommandUsage,
    
    // 显示设置
    displaySettings,
    updateDisplaySettings,
    getDisplaySettings,
    
    // 全局分类索引
    globalCategoryIndex,
    indexMetadata,
    indexIsLoading,
    indexIsDirty,
    buildGlobalCategoryIndex,
    loadCategoryIndex,
    saveCategoryIndex,
    clearCategoryIndex,
    updateCommandInIndex,
    getCommandsFromIndex,
    markIndexDirty,
    
    // 工具方法
    generateId,
    saveToStorage,
    loadFromStorage,
    
    // 简化的命令模板数据结构（无需复杂构建器）
  }
})
