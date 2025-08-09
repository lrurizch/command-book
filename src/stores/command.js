/**
 * 命令手册的数据存储 - 升级版本
 * 集成完整的参数分类、验证和智能管理系统
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Fuse from 'fuse.js'
import { 
  createCommandManager,
  quickCreateCommand,
  quickBuildCommand,
  quickAnalyzeCommand
} from '../utils/commandManager.js'
import {
  createParameterClassifier,
  createEnhancedParameterBuilder,
  ParameterClassification,
  ParameterRequirement,
  ParameterLevel
} from '../utils/parameterClassification.js'

// 导入示例数据
import gitCommands from '../../git-commands-processed.json'
import updatedCommands from '../../updated-commands.json'

export const useCommandStore = defineStore('command', () => {
  // ===== 核心管理器 =====
  const commandManager = createCommandManager({
    enableValidation: true,
    enableSuggestions: true,
    enableSecurity: false,
    autoSave: true
  })
  
  const parameterClassifier = createParameterClassifier()
  
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
  
  // ===== 预计算的分类索引 =====
  const categoryIndex = ref(new Map())
  
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
      // 自动分类现有参数
      const classification = parameterClassifier.classify(param)
      
      return {
        ...param,
        // 添加分类信息
        classification,
        // 添加级别信息（如果未设置）
        level: param.level || (param.parentOption ? ParameterLevel.OPTION : ParameterLevel.COMMAND),
        // 添加作用域信息
        scope: param.scope || (classification.level === ParameterLevel.GLOBAL ? 'global' : 'local'),
        // 添加位置信息
        position: param.position || (param.parentOption ? 'value' : 'positional'),
        // 增强验证规则
        validation: {
          ...param.validation,
          classified: true,
          rules: classification.rules
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
        commandLevel: upgradedParameters.filter(p => p.level === ParameterLevel.COMMAND).length,
        optionLevel: upgradedParameters.filter(p => p.level === ParameterLevel.OPTION).length,
        global: upgradedParameters.filter(p => p.level === ParameterLevel.GLOBAL).length
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
    console.time(`🔍 Store: filteredCommands 计算`)
    const category = selectedCategory.value
    const tags = selectedTags.value
    const query = currentSearchQuery.value.trim()
    
    console.log(`🔍 Store: 开始过滤 - 分类: ${category}, 标签: ${tags.length}, 搜索: "${query}"`)
    
    // 从索引中直接获取分类命令（瞬间完成！）
    let filtered = categoryIndex.value.get(category) || []
    console.log(`📊 Store: 从索引获取 ${category} 分类命令数量: ${filtered.length}`)
    
    // 对于基本分类切换，直接返回原始命令（最快）
    if (tags.length === 0 && !query) {
      console.log(`⚡ Store: 无额外过滤，直接返回`)
      console.timeEnd(`🔍 Store: filteredCommands 计算`)
      return filtered
    }
    
    console.log(`🎯 Store: 需要额外过滤`)
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
    
    console.log(`📈 Store: 过滤后命令数量: ${result.length}`)
    console.timeEnd(`🔍 Store: filteredCommands 计算`)
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
    saveToStorage()
  }
  
  /**
   * 更新命令
   * @param {string} commandId 命令ID
   * @param {Object} updates 更新数据
   */
  const updateCommand = (commandId, updates) => {
    const index = commands.value.findIndex(cmd => cmd.id === commandId)
    if (index !== -1) {
      commands.value[index] = {
        ...commands.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
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
      commands.value.splice(index, 1)
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
    
    enhancedCommands.value.forEach(command => {
      if (command.parameters) {
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
      lastSaveDate: new Date().toISOString()
    }
    
    if (window.utoolsDB) {
      window.utoolsDB.put('command-user-data', userData)
    } else {
      localStorage.setItem('command-handbook-user-data', JSON.stringify(userData))
    }
  }
  
  /**
   * 从存储加载数据
   */
  const loadFromStorage = () => {
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
        userData.userCommands.forEach(command => {
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
    }
  }
  
  /**
   * 初始化示例数据
   */
  const initializeData = () => {
    // 加载Git命令数据
    if (gitCommands && gitCommands.commands) {
      gitCommands.commands.forEach(cmd => {
        commands.value.push({
          ...cmd,
          isUserCreated: false
        })
      })
    }
    
    // 加载更新的命令数据
    if (updatedCommands && updatedCommands.commands) {
      updatedCommands.commands.forEach(cmd => {
        commands.value.push({
          ...cmd,
          isUserCreated: false
        })
      })
    }
    
    // 如果没有用户数据，创建初始示例
    if (commands.value.filter(cmd => cmd.isUserCreated).length === 0) {
      createInitialUserData()
    }
  }
  
  /**
   * 创建初始用户示例数据
   */
  const createInitialUserData = () => {
    const now = new Date().toISOString()
    
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
    
    // 添加用户手动创建的示例命令
    const userCommands = [
      {
        id: generateId(),
        name: '快速启动项目',
        command: 'npm run dev --port {{port}}',
        description: '启动开发服务器',
        category: 'my-custom-commands',
        tags: ['开发', '启动', '自定义'],
        parameters: [
          {
            name: 'port',
            description: '端口号',
            required: false,
            defaultValue: '3000',
            level: 'option',
            parentOption: '--port'
          }
        ],
        options: [
          { flag: '--host', description: '指定主机地址' },
          { flag: '--port', description: '指定端口号' }
        ],
        isUserCreated: true,
        createdAt: now,
        updatedAt: now
      }
    ]
    
    // 将用户命令添加到commands数组
    commands.value.push(...userCommands)
    
    // 保存用户数据
    saveToStorage()
  }
  
  // ===== 初始化 =====
  
  // 加载存储的数据
  loadFromStorage()
  
  // 初始化示例数据
  initializeData()
  
  // 立即建立分类索引
  updateCategoryIndex()
  
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
    
    // 工具方法
    generateId,
    saveToStorage,
    loadFromStorage,
    
    // 管理器实例（高级用法）
    commandManager,
    parameterClassifier
  }
})
