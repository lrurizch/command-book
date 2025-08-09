/**
 * 集成命令管理系统
 * 整合命令的创建、修改、构建、验证等所有功能
 */

import { CommandBuilder, createCommandBuilder } from './commandBuilder.js'
import { 
  CommandStructureAnalyzer, 
  createCommandAnalyzer,
  analyzeCommand 
} from './commandStructure.js'
import {
  createCreationValidator,
  createBuildValidator,
  validateCommandCreation,
  validateCommandBuild,
  CommandManagementRules
} from './commandValidation.js'

/**
 * 集成命令管理器
 */
export class IntegratedCommandManager {
  constructor(options = {}) {
    this.options = {
      enableValidation: true,
      enableSuggestions: true,
      enableSecurity: false,
      autoSave: true,
      maxHistoryVersions: 10,
      ...options
    }

    // 初始化组件
    this.analyzer = createCommandAnalyzer({
      strictMode: this.options.strictMode,
      enableSuggestions: this.options.enableSuggestions,
      validateSecurity: this.options.enableSecurity
    })

    this.creationValidator = createCreationValidator()
    this.buildValidator = createBuildValidator()

    // 命令历史和版本管理
    this.commandHistory = new Map()
    this.buildHistory = new Map()
    
    // 事件监听器
    this.eventListeners = new Map()
  }

  // ===== 命令创建管理 =====

  /**
   * 创建新命令
   * @param {Object} commandData 命令数据
   * @param {Object} context 创建上下文
   * @returns {Object} 创建结果
   */
  async createCommand(commandData, context = {}) {
    const result = {
      success: false,
      command: null,
      validation: null,
      analysis: null,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      // 1. 预处理命令数据
      const processedData = this.preprocessCommandData(commandData)

      // 2. 验证命令数据
      if (this.options.enableValidation) {
        result.validation = this.creationValidator.validate(processedData, context)
        
        if (!result.validation.isValid) {
          result.errors = result.validation.errors
          result.warnings = result.validation.warnings
          result.suggestions = result.validation.suggestions
          return result
        }
      }

      // 3. 分析命令结构
      if (processedData.command) {
        result.analysis = this.analyzer.analyze(processedData.command)
        
        if (!result.analysis.isValid) {
          result.errors.push(...result.analysis.errors.map(e => ({
            type: 'analysis',
            field: 'command',
            message: e
          })))
        }
        
        result.warnings.push(...result.analysis.warnings.map(w => ({
          type: 'analysis',
          field: 'command',
          message: w
        })))
      }

      // 4. 生成命令ID和元数据
      const command = this.finalizeCommand(processedData, context)

      // 5. 保存命令历史
      if (this.options.autoSave) {
        this.saveCommandVersion(command)
      }

      // 6. 触发事件
      this.emit('commandCreated', { command, context })

      result.success = true
      result.command = command
      
      return result

    } catch (error) {
      result.errors.push({
        type: 'system',
        field: 'general',
        message: `创建命令失败: ${error.message}`
      })
      return result
    }
  }

  /**
   * 修改现有命令
   * @param {string} commandId 命令ID
   * @param {Object} updateData 更新数据
   * @param {Object} context 修改上下文
   * @returns {Object} 修改结果
   */
  async updateCommand(commandId, updateData, context = {}) {
    const result = {
      success: false,
      command: null,
      validation: null,
      changes: [],
      errors: [],
      warnings: []
    }

    try {
      // 1. 获取原命令
      const originalCommand = context.originalCommand || 
        await this.getCommand(commandId)
      
      if (!originalCommand) {
        result.errors.push({
          type: 'notFound',
          field: 'commandId',
          message: `命令不存在: ${commandId}`
        })
        return result
      }

      // 2. 检查修改权限
      const permissionCheck = this.checkModificationPermission(originalCommand, updateData)
      if (!permissionCheck.allowed) {
        result.errors.push({
          type: 'permission',
          field: 'general',
          message: permissionCheck.reason
        })
        return result
      }

      // 3. 合并更新数据
      const mergedData = this.mergeUpdateData(originalCommand, updateData)

      // 4. 验证更新
      if (this.options.enableValidation) {
        result.validation = this.creationValidator.validate(mergedData, {
          ...context,
          isUpdate: true,
          originalCommand
        })
        
        if (!result.validation.isValid) {
          result.errors = result.validation.errors
          result.warnings = result.validation.warnings
          return result
        }
      }

      // 5. 记录变更
      result.changes = this.detectChanges(originalCommand, mergedData)

      // 6. 保存版本历史
      this.saveCommandVersion(originalCommand, 'beforeUpdate')
      
      // 7. 应用更新
      const updatedCommand = this.finalizeCommand(mergedData, context)

      // 8. 触发事件
      this.emit('commandUpdated', { 
        original: originalCommand, 
        updated: updatedCommand, 
        changes: result.changes 
      })

      result.success = true
      result.command = updatedCommand
      
      return result

    } catch (error) {
      result.errors.push({
        type: 'system',
        field: 'general',
        message: `修改命令失败: ${error.message}`
      })
      return result
    }
  }

  // ===== 命令构建管理 =====

  /**
   * 构建可执行命令
   * @param {Object} commandData 命令数据
   * @param {Object} buildConfig 构建配置
   * @returns {Object} 构建结果
   */
  async buildCommand(commandData, buildConfig = {}) {
    const result = {
      success: false,
      builtCommand: '',
      template: '',
      validation: null,
      analysis: null,
      metadata: {},
      errors: [],
      warnings: []
    }

    try {
      // 1. 初始化构建器
      const builder = createCommandBuilder()
      
      if (commandData.commandName || commandData.baseCommand) {
        builder.setBaseCommand(commandData.commandName || commandData.baseCommand)
      }

      // 2. 加载命令定义
      if (commandData.parameters) {
        commandData.parameters.forEach(param => {
          builder.addParameter(param)
        })
      }

      if (commandData.options) {
        commandData.options.forEach(option => {
          builder.addOption(option)
        })
      }

      // 3. 设置参数值
      if (buildConfig.parameterValues) {
        Object.entries(buildConfig.parameterValues).forEach(([name, value]) => {
          try {
            builder.setParameterValue(name, value)
          } catch (error) {
            result.warnings.push({
              type: 'parameter',
              field: name,
              message: error.message
            })
          }
        })
      }

      // 4. 选择选项
      if (buildConfig.selectedOptions) {
        buildConfig.selectedOptions.forEach(flag => {
          try {
            builder.toggleOption(flag)
          } catch (error) {
            result.warnings.push({
              type: 'option',
              field: flag,
              message: error.message
            })
          }
        })
      }

      // 5. 验证构建配置
      if (this.options.enableValidation) {
        result.validation = this.buildValidator.validate(
          buildConfig, 
          commandData, 
          buildConfig.parameterValues || {}
        )
        
        if (!result.validation.isValid) {
          result.errors = result.validation.errors
          result.warnings.push(...result.validation.warnings)
        }
      }

      // 6. 构建命令
      result.template = builder.buildTemplate()
      
      if (buildConfig.mode === 'executable') {
        result.builtCommand = builder.buildExecutableCommand({
          useDefaults: buildConfig.useDefaults !== false,
          validateRequired: buildConfig.validateRequired !== false,
          escapeValues: buildConfig.escapeValues !== false
        })
      } else {
        result.builtCommand = result.template
      }

      // 7. 分析构建结果
      if (result.builtCommand) {
        result.analysis = this.analyzer.analyze(result.builtCommand)
        
        if (!result.analysis.isValid) {
          result.errors.push(...result.analysis.errors.map(e => ({
            type: 'syntax',
            field: 'builtCommand',
            message: e
          })))
        }
      }

      // 8. 生成元数据
      result.metadata = {
        buildTime: new Date().toISOString(),
        buildMode: buildConfig.mode || 'template',
        parameterCount: Object.keys(buildConfig.parameterValues || {}).length,
        optionCount: (buildConfig.selectedOptions || []).length,
        hasRequiredParams: commandData.parameters?.some(p => p.required) || false
      }

      // 9. 保存构建历史
      this.saveBuildHistory(commandData.id, {
        config: buildConfig,
        result: result.builtCommand,
        timestamp: new Date().toISOString()
      })

      // 10. 触发事件
      this.emit('commandBuilt', { 
        commandData, 
        buildConfig, 
        result: result.builtCommand 
      })

      result.success = result.errors.length === 0
      
      return result

    } catch (error) {
      result.errors.push({
        type: 'system',
        field: 'general',
        message: `构建命令失败: ${error.message}`
      })
      return result
    }
  }

  /**
   * 智能命令构建建议
   * @param {Object} commandData 命令数据
   * @param {Object} partialConfig 部分构建配置
   * @returns {Object} 构建建议
   */
  getCommandBuildSuggestions(commandData, partialConfig = {}) {
    const suggestions = {
      parameters: [],
      options: [],
      combinations: [],
      warnings: []
    }

    try {
      // 1. 参数建议
      if (commandData.parameters) {
        commandData.parameters.forEach(param => {
          const suggestion = {
            name: param.name,
            description: param.description,
            required: param.required,
            suggestions: this.getParameterSuggestions(param)
          }
          
          suggestions.parameters.push(suggestion)
        })
      }

      // 2. 选项建议
      if (commandData.options) {
        const compatibleOptions = this.getCompatibleOptions(
          commandData.options, 
          partialConfig.selectedOptions || []
        )
        
        suggestions.options = compatibleOptions
      }

      // 3. 常用组合建议
      if (commandData.commonCommands) {
        suggestions.combinations = commandData.commonCommands.map(combo => ({
          name: combo.name,
          description: combo.description,
          command: combo.command,
          confidence: this.calculateCombinationConfidence(combo, partialConfig)
        })).sort((a, b) => b.confidence - a.confidence)
      }

      // 4. 潜在问题警告
      suggestions.warnings = this.detectPotentialIssues(commandData, partialConfig)

      return suggestions

    } catch (error) {
      return {
        ...suggestions,
        error: `生成建议失败: ${error.message}`
      }
    }
  }

  // ===== 命令分析和验证 =====

  /**
   * 全面分析命令
   * @param {string|Object} input 命令字符串或命令对象
   * @param {Object} options 分析选项
   * @returns {Object} 分析结果
   */
  analyzeCommandComprehensive(input, options = {}) {
    const result = {
      success: false,
      structure: null,
      validation: null,
      suggestions: [],
      security: null,
      performance: null,
      compatibility: null
    }

    try {
      let commandString = ''
      let commandData = null

      if (typeof input === 'string') {
        commandString = input
      } else if (input && input.command) {
        commandString = input.command
        commandData = input
      } else {
        throw new Error('Invalid input: must be command string or command object')
      }

      // 1. 结构分析
      result.structure = this.analyzer.analyze(commandString)

      // 2. 验证分析
      if (commandData && this.options.enableValidation) {
        result.validation = this.creationValidator.validate(commandData, options.context || {})
      }

      // 3. 安全分析
      if (this.options.enableSecurity || options.security) {
        result.security = this.analyzeCommandSecurity(commandString, result.structure)
      }

      // 4. 性能分析
      if (options.performance) {
        result.performance = this.analyzeCommandPerformance(commandString, result.structure)
      }

      // 5. 兼容性分析
      if (options.compatibility) {
        result.compatibility = this.analyzeCommandCompatibility(commandString, result.structure)
      }

      // 6. 生成改进建议
      if (this.options.enableSuggestions) {
        result.suggestions = this.generateImprovementSuggestions(result)
      }

      result.success = true
      return result

    } catch (error) {
      result.error = error.message
      return result
    }
  }

  // ===== 内部工具方法 =====

  /**
   * 预处理命令数据
   * @param {Object} commandData 原始命令数据
   * @returns {Object} 处理后的命令数据
   */
  preprocessCommandData(commandData) {
    const processed = { ...commandData }

    // 1. 清理和标准化数据
    if (processed.name) {
      processed.name = processed.name.trim()
    }

    if (processed.description) {
      processed.description = processed.description.trim()
    }

    if (processed.command) {
      processed.command = processed.command.trim()
    }

    // 2. 标准化标签
    if (processed.tags && Array.isArray(processed.tags)) {
      processed.tags = processed.tags
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index) // 去重
    }

    // 3. 标准化参数
    if (processed.parameters && Array.isArray(processed.parameters)) {
      processed.parameters = processed.parameters.map(param => ({
        ...param,
        name: param.name?.trim(),
        description: param.description?.trim(),
        type: param.type || 'string',
        required: Boolean(param.required),
        defaultValue: param.defaultValue || ''
      })).filter(param => param.name && param.name.length > 0)
    }

    // 4. 标准化选项
    if (processed.options && Array.isArray(processed.options)) {
      processed.options = processed.options.map(option => ({
        ...option,
        flag: option.flag?.trim(),
        description: option.description?.trim(),
        required: Boolean(option.required),
        hasValue: Boolean(option.hasValue)
      })).filter(option => option.flag && option.flag.length > 0)
    }

    return processed
  }

  /**
   * 完成命令创建
   * @param {Object} commandData 命令数据
   * @param {Object} context 创建上下文
   * @returns {Object} 最终命令对象
   */
  finalizeCommand(commandData, context) {
    const now = new Date().toISOString()
    
    return {
      ...commandData,
      id: commandData.id || this.generateCommandId(),
      isUserCreated: context.isUpdate ? commandData.isUserCreated : true,
      createdAt: commandData.createdAt || now,
      updatedAt: now,
      version: (commandData.version || 0) + 1,
      usageCount: commandData.usageCount || 0,
      lastUsed: commandData.lastUsed || null
    }
  }

  /**
   * 生成命令ID
   * @returns {string} 命令ID
   */
  generateCommandId() {
    return 'cmd_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 检查修改权限
   * @param {Object} originalCommand 原命令
   * @param {Object} updateData 更新数据
   * @returns {Object} 权限检查结果
   */
  checkModificationPermission(originalCommand, updateData) {
    // 1. 检查系统命令
    if (!originalCommand.isUserCreated && !this.options.allowSystemModification) {
      return {
        allowed: false,
        reason: '系统命令不能修改'
      }
    }

    // 2. 检查保护字段
    const protectedFields = CommandManagementRules.modification.protectedFields
    const attemptedProtectedChanges = Object.keys(updateData).filter(key =>
      protectedFields.includes(key) && updateData[key] !== originalCommand[key]
    )

    if (attemptedProtectedChanges.length > 0) {
      return {
        allowed: false,
        reason: `不能修改保护字段: ${attemptedProtectedChanges.join(', ')}`
      }
    }

    return { allowed: true }
  }

  /**
   * 合并更新数据
   * @param {Object} originalCommand 原命令
   * @param {Object} updateData 更新数据
   * @returns {Object} 合并后的数据
   */
  mergeUpdateData(originalCommand, updateData) {
    const allowedFields = CommandManagementRules.modification.allowedFields
    const merged = { ...originalCommand }

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        merged[key] = updateData[key]
      }
    })

    return merged
  }

  /**
   * 检测变更
   * @param {Object} original 原对象
   * @param {Object} updated 更新后对象
   * @returns {Array} 变更列表
   */
  detectChanges(original, updated) {
    const changes = []
    
    Object.keys(updated).forEach(key => {
      if (JSON.stringify(original[key]) !== JSON.stringify(updated[key])) {
        changes.push({
          field: key,
          oldValue: original[key],
          newValue: updated[key],
          timestamp: new Date().toISOString()
        })
      }
    })

    return changes
  }

  /**
   * 保存命令版本
   * @param {Object} command 命令对象
   * @param {string} action 操作类型
   */
  saveCommandVersion(command, action = 'save') {
    if (!command.id) return

    if (!this.commandHistory.has(command.id)) {
      this.commandHistory.set(command.id, [])
    }

    const history = this.commandHistory.get(command.id)
    history.push({
      command: { ...command },
      action,
      timestamp: new Date().toISOString()
    })

    // 限制历史版本数量
    if (history.length > this.options.maxHistoryVersions) {
      history.splice(0, history.length - this.options.maxHistoryVersions)
    }
  }

  /**
   * 保存构建历史
   * @param {string} commandId 命令ID
   * @param {Object} buildRecord 构建记录
   */
  saveBuildHistory(commandId, buildRecord) {
    if (!commandId) return

    if (!this.buildHistory.has(commandId)) {
      this.buildHistory.set(commandId, [])
    }

    const history = this.buildHistory.get(commandId)
    history.push(buildRecord)

    // 限制历史版本数量
    if (history.length > this.options.maxHistoryVersions) {
      history.splice(0, history.length - this.options.maxHistoryVersions)
    }
  }

  /**
   * 获取参数建议
   * @param {Object} parameter 参数定义
   * @returns {Array} 建议值列表
   */
  getParameterSuggestions(parameter) {
    const suggestions = []

    // 基于参数类型的建议
    switch (parameter.type) {
      case 'boolean':
        suggestions.push('true', 'false')
        break
      case 'number':
        if (parameter.name.includes('port')) {
          suggestions.push('3000', '8080', '80', '443')
        } else if (parameter.name.includes('count') || parameter.name.includes('limit')) {
          suggestions.push('10', '50', '100')
        }
        break
      case 'string':
        if (parameter.name.includes('url') || parameter.name.includes('link')) {
          suggestions.push('https://example.com', 'http://localhost:3000')
        } else if (parameter.name.includes('email')) {
          suggestions.push('user@example.com')
        }
        break
      case 'file':
        suggestions.push('./file.txt', '../path/to/file', '*.txt')
        break
      case 'directory':
        suggestions.push('./', '../', '/path/to/directory')
        break
    }

    // 基于默认值的建议
    if (parameter.defaultValue) {
      suggestions.unshift(parameter.defaultValue)
    }

    return [...new Set(suggestions)] // 去重
  }

  /**
   * 获取兼容选项
   * @param {Array} allOptions 所有选项
   * @param {Array} selectedOptions 已选选项
   * @returns {Array} 兼容选项列表
   */
  getCompatibleOptions(allOptions, selectedOptions) {
    return allOptions.filter(option => {
      // 排除已选择的选项
      if (selectedOptions.includes(option.flag)) {
        return false
      }

      // 检查冲突
      if (option.conflictsWith) {
        const hasConflict = option.conflictsWith.some(conflictFlag =>
          selectedOptions.includes(conflictFlag)
        )
        if (hasConflict) return false
      }

      return true
    }).map(option => ({
      ...option,
      recommended: this.calculateOptionRecommendation(option, selectedOptions)
    })).sort((a, b) => b.recommended - a.recommended)
  }

  /**
   * 计算选项推荐度
   * @param {Object} option 选项
   * @param {Array} selectedOptions 已选选项
   * @returns {number} 推荐度分数
   */
  calculateOptionRecommendation(option, selectedOptions) {
    let score = 0

    // 基于依赖关系
    if (option.dependsOn) {
      const satisfiedDeps = option.dependsOn.filter(dep =>
        selectedOptions.includes(dep)
      ).length
      score += (satisfiedDeps / option.dependsOn.length) * 50
    }

    // 基于选项类型
    if (option.flag.startsWith('--help') || option.flag.startsWith('-h')) {
      score += 10 // 帮助选项通常有用
    }

    if (option.flag.startsWith('--verbose') || option.flag.startsWith('-v')) {
      score += 5 // 详细输出选项
    }

    return score
  }

  /**
   * 计算组合推荐度
   * @param {Object} combination 命令组合
   * @param {Object} partialConfig 部分配置
   * @returns {number} 推荐度分数
   */
  calculateCombinationConfidence(combination, partialConfig) {
    let confidence = 50 // 基础分数

    // 基于已选参数的匹配度
    if (partialConfig.parameterValues && combination.parameters) {
      const matchedParams = Object.keys(partialConfig.parameterValues).filter(key =>
        combination.parameters.hasOwnProperty(key)
      )
      confidence += (matchedParams.length / Object.keys(combination.parameters).length) * 30
    }

    // 基于命令复杂度（简单命令通常更受欢迎）
    const commandComplexity = (combination.command.match(/\s+/g) || []).length
    confidence -= Math.min(commandComplexity, 20)

    return Math.max(0, Math.min(100, confidence))
  }

  /**
   * 检测潜在问题
   * @param {Object} commandData 命令数据
   * @param {Object} partialConfig 部分配置
   * @returns {Array} 问题列表
   */
  detectPotentialIssues(commandData, partialConfig) {
    const warnings = []

    // 检查必选参数
    if (commandData.parameters) {
      const requiredParams = commandData.parameters.filter(p => p.required)
      const providedParams = Object.keys(partialConfig.parameterValues || {})
      
      requiredParams.forEach(param => {
        if (!providedParams.includes(param.name)) {
          warnings.push({
            type: 'missingRequired',
            field: param.name,
            message: `缺少必选参数: ${param.name}`
          })
        }
      })
    }

    // 检查选项冲突
    if (commandData.options && partialConfig.selectedOptions) {
      const conflicts = this.detectOptionConflicts(
        commandData.options,
        partialConfig.selectedOptions
      )
      warnings.push(...conflicts)
    }

    return warnings
  }

  /**
   * 检测选项冲突
   * @param {Array} allOptions 所有选项
   * @param {Array} selectedOptions 已选选项
   * @returns {Array} 冲突列表
   */
  detectOptionConflicts(allOptions, selectedOptions) {
    const conflicts = []
    const optionMap = new Map(allOptions.map(opt => [opt.flag, opt]))

    selectedOptions.forEach(flag => {
      const option = optionMap.get(flag)
      if (option && option.conflictsWith) {
        const conflictingOptions = option.conflictsWith.filter(conflictFlag =>
          selectedOptions.includes(conflictFlag)
        )
        
        if (conflictingOptions.length > 0) {
          conflicts.push({
            type: 'optionConflict',
            field: flag,
            message: `选项 "${flag}" 与以下选项冲突: ${conflictingOptions.join(', ')}`
          })
        }
      }
    })

    return conflicts
  }

  // ===== 事件系统 =====

  /**
   * 注册事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听函数
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(listener)
  }

  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听函数
   */
  off(event, listener) {
    if (!this.eventListeners.has(event)) return
    
    const listeners = this.eventListeners.get(event)
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  emit(event, data) {
    if (!this.eventListeners.has(event)) return
    
    this.eventListeners.get(event).forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error)
      }
    })
  }

  // ===== 公用接口方法 =====

  /**
   * 获取命令历史
   * @param {string} commandId 命令ID
   * @returns {Array} 历史记录
   */
  getCommandHistory(commandId) {
    return this.commandHistory.get(commandId) || []
  }

  /**
   * 获取构建历史
   * @param {string} commandId 命令ID
   * @returns {Array} 构建历史
   */
  getBuildHistory(commandId) {
    return this.buildHistory.get(commandId) || []
  }

  /**
   * 清除历史记录
   * @param {string} commandId 命令ID
   * @param {string} type 历史类型 ('command' | 'build' | 'all')
   */
  clearHistory(commandId, type = 'all') {
    if (type === 'command' || type === 'all') {
      this.commandHistory.delete(commandId)
    }
    if (type === 'build' || type === 'all') {
      this.buildHistory.delete(commandId)
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    return {
      totalCommands: this.commandHistory.size,
      totalBuilds: Array.from(this.buildHistory.values()).reduce((sum, builds) => sum + builds.length, 0),
      averageBuildsPerCommand: this.commandHistory.size > 0 ? 
        Array.from(this.buildHistory.values()).reduce((sum, builds) => sum + builds.length, 0) / this.commandHistory.size : 0
    }
  }
}

// ===== 导出接口 =====

/**
 * 创建集成命令管理器
 * @param {Object} options 配置选项
 * @returns {IntegratedCommandManager} 管理器实例
 */
export const createCommandManager = (options = {}) => {
  return new IntegratedCommandManager(options)
}

/**
 * 默认命令管理器实例
 */
export const defaultCommandManager = createCommandManager()

/**
 * 快速创建命令
 * @param {Object} commandData 命令数据
 * @param {Object} context 创建上下文
 * @returns {Promise<Object>} 创建结果
 */
export const quickCreateCommand = async (commandData, context = {}) => {
  return await defaultCommandManager.createCommand(commandData, context)
}

/**
 * 快速构建命令
 * @param {Object} commandData 命令数据
 * @param {Object} buildConfig 构建配置
 * @returns {Promise<Object>} 构建结果
 */
export const quickBuildCommand = async (commandData, buildConfig = {}) => {
  return await defaultCommandManager.buildCommand(commandData, buildConfig)
}

/**
 * 快速分析命令
 * @param {string|Object} input 命令输入
 * @param {Object} options 分析选项
 * @returns {Object} 分析结果
 */
export const quickAnalyzeCommand = (input, options = {}) => {
  return defaultCommandManager.analyzeCommandComprehensive(input, options)
} 