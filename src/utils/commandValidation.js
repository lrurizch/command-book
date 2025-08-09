/**
 * 命令验证和管理规则系统
 * 为命令手册的创建、修改、构建功能提供完整的验证规则
 */

import { 
  ParameterType, 
  SeparatorRules, 
  ComponentRelationshipRules,
  analyzeCommand 
} from './commandStructure.js'

// ===== 命令生命周期管理规则 =====

/**
 * 命令创建规则
 */
export const CommandCreationRules = {
  // 基本信息验证
  basicInfo: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()]+$/,
      message: '命令名称只能包含中文、英文、数字、空格、连字符、下划线和括号'
    },
    description: {
      required: true,
      minLength: 5,
      maxLength: 500,
      message: '命令描述长度应在5-500字符之间'
    },
    command: {
      required: true,
      minLength: 1,
      maxLength: 2000,
      validation: 'syntax',
      message: '命令格式必须正确'
    }
  },

  // 分类验证
  category: {
    required: true,
    mustExist: true,
    notRecycleBin: true,
    maxDepth: 4,
    message: '必须选择有效的分类'
  },

  // 标签验证
  tags: {
    required: false,
    maxCount: 10,
    maxLength: 20,
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\-_]+$/,
    noDuplicates: true,
    message: '标签只能包含中文、英文、数字、连字符和下划线'
  },

  // 参数验证
  parameters: {
    maxCount: 20,
    uniqueNames: true,
    validTypes: Object.values(ParameterType),
    requiredFirst: true, // 必选参数必须在可选参数前面
    validation: {
      name: {
        pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        message: '参数名必须以字母开头，只能包含字母、数字、连字符和下划线'
      },
      description: {
        required: true,
        maxLength: 200
      }
    }
  },

  // 选项验证
  options: {
    maxCount: 50,
    uniqueFlags: true,
    validation: {
      flag: {
        pattern: /^-{1,2}[a-zA-Z][a-zA-Z0-9-]*$/,
        message: '选项标志必须以-或--开头'
      },
      noConflicts: true,
      validCombinations: true
    }
  }
}

/**
 * 命令修改规则
 */
export const CommandModificationRules = {
  // 允许修改的字段
  allowedFields: [
    'name', 'description', 'command', 'category', 'tags', 
    'parameters', 'options', 'commonCommands', 'separators'
  ],

  // 不允许修改的字段
  protectedFields: ['id', 'createdAt', 'isUserCreated'],

  // 系统命令保护
  systemCommands: {
    modifiable: false,
    deletable: false,
    message: '系统命令不能修改或删除'
  },

  // 版本控制
  versioning: {
    enabled: true,
    maxVersions: 10,
    trackChanges: true
  },

  // 依赖检查
  dependencyCheck: {
    enabled: true,
    checkUsage: true,
    preventBreaking: true
  }
}

/**
 * 命令构建规则
 */
export const CommandBuildRules = {
  // 构建模式
  buildModes: {
    TEMPLATE: 'template',     // 构建模板（带占位符）
    EXECUTABLE: 'executable', // 构建可执行命令
    VALIDATION: 'validation'  // 仅验证模式
  },

  // 参数处理规则
  parameterProcessing: {
    // 必选参数处理
    required: {
      mustProvideValue: true,
      noEmptyValue: true,
      validateType: true,
      errorOnMissing: true
    },

    // 可选参数处理
    optional: {
      useDefaultIfEmpty: true,
      allowEmpty: true,
      validateIfProvided: true
    },

    // 参数替换规则
    substitution: {
      placeholder: '{{parameter}}',
      escapeSpecialChars: true,
      preserveQuotes: true,
      validateAfterSubstitution: true
    }
  },

  // 选项处理规则
  optionProcessing: {
    // 选项冲突检查
    conflictResolution: {
      enabled: true,
      strategy: 'error', // 'error' | 'warn' | 'lastWins'
      reportConflicts: true
    },

    // 选项依赖检查
    dependencyCheck: {
      enabled: true,
      autoInclude: false, // 是否自动包含依赖选项
      warnMissing: true
    },

    // 选项值验证
    valueValidation: {
      enabled: true,
      typeCheck: true,
      rangeCheck: true,
      enumCheck: true
    }
  },

  // 分隔符处理规则
  separatorProcessing: {
    // 语法检查
    syntaxCheck: {
      enabled: true,
      checkPrecedence: true,
      checkCombinations: true,
      validateContext: true
    },

    // 语义检查
    semanticCheck: {
      enabled: true,
      checkLogic: true,
      warnRiskyOperations: true
    }
  }
}

// ===== 验证器类定义 =====

/**
 * 命令验证器基类
 */
export class CommandValidator {
  constructor(rules = {}) {
    this.rules = rules
    this.errors = []
    this.warnings = []
    this.suggestions = []
  }

  /**
   * 重置验证结果
   */
  reset() {
    this.errors = []
    this.warnings = []
    this.suggestions = []
  }

  /**
   * 添加错误
   * @param {string} field 字段名
   * @param {string} message 错误信息
   * @param {*} value 字段值
   */
  addError(field, message, value = null) {
    this.errors.push({
      type: 'error',
      field,
      message,
      value,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 添加警告
   * @param {string} field 字段名
   * @param {string} message 警告信息
   * @param {*} value 字段值
   */
  addWarning(field, message, value = null) {
    this.warnings.push({
      type: 'warning',
      field,
      message,
      value,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 添加建议
   * @param {string} field 字段名
   * @param {string} message 建议信息
   * @param {*} suggestion 建议值
   */
  addSuggestion(field, message, suggestion = null) {
    this.suggestions.push({
      type: 'suggestion',
      field,
      message,
      suggestion,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 验证是否通过
   * @returns {boolean} 是否通过验证
   */
  isValid() {
    return this.errors.length === 0
  }

  /**
   * 获取验证结果
   * @returns {Object} 验证结果对象
   */
  getResult() {
    return {
      isValid: this.isValid(),
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions,
      summary: {
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        suggestionCount: this.suggestions.length
      }
    }
  }
}

/**
 * 命令创建验证器
 */
export class CommandCreationValidator extends CommandValidator {
  constructor() {
    super(CommandCreationRules)
  }

  /**
   * 验证命令创建数据
   * @param {Object} commandData 命令数据
   * @param {Object} context 验证上下文
   * @returns {Object} 验证结果
   */
  validate(commandData, context = {}) {
    this.reset()

    // 验证基本信息
    this.validateBasicInfo(commandData)

    // 验证分类
    this.validateCategory(commandData, context)

    // 验证标签
    this.validateTags(commandData)

    // 验证参数
    this.validateParameters(commandData)

    // 验证选项
    this.validateOptions(commandData)

    // 验证命令语法
    this.validateCommandSyntax(commandData)

    // 检查重复
    this.checkDuplicates(commandData, context)

    return this.getResult()
  }

  /**
   * 验证基本信息
   * @param {Object} commandData 命令数据
   */
  validateBasicInfo(commandData) {
    const rules = this.rules.basicInfo

    // 验证名称
    if (!commandData.name) {
      this.addError('name', '命令名称不能为空')
    } else {
      if (commandData.name.length < rules.name.minLength) {
        this.addError('name', `命令名称长度不能少于${rules.name.minLength}个字符`)
      }
      if (commandData.name.length > rules.name.maxLength) {
        this.addError('name', `命令名称长度不能超过${rules.name.maxLength}个字符`)
      }
      if (!rules.name.pattern.test(commandData.name)) {
        this.addError('name', rules.name.message)
      }
    }

    // 验证描述
    if (!commandData.description) {
      this.addError('description', '命令描述不能为空')
    } else {
      if (commandData.description.length < rules.description.minLength) {
        this.addError('description', `命令描述长度不能少于${rules.description.minLength}个字符`)
      }
      if (commandData.description.length > rules.description.maxLength) {
        this.addError('description', `命令描述长度不能超过${rules.description.maxLength}个字符`)
      }
    }

    // 验证命令
    if (!commandData.command) {
      this.addError('command', '命令内容不能为空')
    } else {
      if (commandData.command.length > rules.command.maxLength) {
        this.addError('command', `命令长度不能超过${rules.command.maxLength}个字符`)
      }
    }
  }

  /**
   * 验证分类
   * @param {Object} commandData 命令数据
   * @param {Object} context 验证上下文
   */
  validateCategory(commandData, context) {
    const rules = this.rules.category

    if (!commandData.category) {
      this.addError('category', '必须选择命令分类')
      return
    }

    // 检查分类是否存在
    if (context.categories) {
      const category = context.categories.find(cat => cat.id === commandData.category)
      if (!category) {
        this.addError('category', '选择的分类不存在')
      } else {
        // 检查是否是回收站
        if (category.id === 'recycle-bin') {
          this.addError('category', '不能直接将命令创建到回收站')
        }

        // 检查分类深度
        if (category.level >= rules.maxDepth) {
          this.addError('category', `分类层级不能超过${rules.maxDepth}级`)
        }
      }
    }
  }

  /**
   * 验证标签
   * @param {Object} commandData 命令数据
   */
  validateTags(commandData) {
    const rules = this.rules.tags

    if (!commandData.tags) {
      commandData.tags = []
      return
    }

    if (!Array.isArray(commandData.tags)) {
      this.addError('tags', '标签必须是数组格式')
      return
    }

    // 检查标签数量
    if (commandData.tags.length > rules.maxCount) {
      this.addError('tags', `标签数量不能超过${rules.maxCount}个`)
    }

    // 验证每个标签
    const uniqueTags = new Set()
    commandData.tags.forEach((tag, index) => {
      if (typeof tag !== 'string') {
        this.addError(`tags[${index}]`, '标签必须是字符串')
        return
      }

      if (tag.length === 0) {
        this.addError(`tags[${index}]`, '标签不能为空')
        return
      }

      if (tag.length > rules.maxLength) {
        this.addError(`tags[${index}]`, `标签长度不能超过${rules.maxLength}个字符`)
      }

      if (!rules.pattern.test(tag)) {
        this.addError(`tags[${index}]`, rules.message)
      }

      // 检查重复标签
      if (uniqueTags.has(tag.toLowerCase())) {
        this.addError(`tags[${index}]`, `重复的标签: ${tag}`)
      } else {
        uniqueTags.add(tag.toLowerCase())
      }
    })
  }

  /**
   * 验证参数
   * @param {Object} commandData 命令数据
   */
  validateParameters(commandData) {
    const rules = this.rules.parameters

    if (!commandData.parameters) {
      commandData.parameters = []
      return
    }

    if (!Array.isArray(commandData.parameters)) {
      this.addError('parameters', '参数必须是数组格式')
      return
    }

    // 检查参数数量
    if (commandData.parameters.length > rules.maxCount) {
      this.addError('parameters', `参数数量不能超过${rules.maxCount}个`)
    }

    // 验证参数顺序（必选参数在前）
    let foundOptional = false
    const uniqueNames = new Set()

    commandData.parameters.forEach((param, index) => {
      // 验证参数结构
      if (!param || typeof param !== 'object') {
        this.addError(`parameters[${index}]`, '参数必须是对象格式')
        return
      }

      // 验证参数名
      if (!param.name) {
        this.addError(`parameters[${index}].name`, '参数名不能为空')
      } else {
        if (!rules.validation.name.pattern.test(param.name)) {
          this.addError(`parameters[${index}].name`, rules.validation.name.message)
        }

        // 检查参数名重复
        if (uniqueNames.has(param.name.toLowerCase())) {
          this.addError(`parameters[${index}].name`, `重复的参数名: ${param.name}`)
        } else {
          uniqueNames.add(param.name.toLowerCase())
        }
      }

      // 验证参数描述
      if (!param.description) {
        this.addError(`parameters[${index}].description`, '参数描述不能为空')
      } else if (param.description.length > rules.validation.description.maxLength) {
        this.addError(`parameters[${index}].description`, '参数描述过长')
      }

      // 验证参数类型
      if (param.type && !rules.validTypes.includes(param.type)) {
        this.addError(`parameters[${index}].type`, `无效的参数类型: ${param.type}`)
      }

      // 验证参数顺序
      if (rules.requiredFirst) {
        if (param.required === false || param.required === undefined) {
          foundOptional = true
        } else if (param.required === true && foundOptional) {
          this.addWarning(`parameters[${index}]`, '建议将必选参数放在可选参数前面')
        }
      }

      // 验证默认值
      if (param.required && param.defaultValue) {
        this.addWarning(`parameters[${index}].defaultValue`, '必选参数不应设置默认值')
      }
    })
  }

  /**
   * 验证选项
   * @param {Object} commandData 命令数据
   */
  validateOptions(commandData) {
    const rules = this.rules.options

    if (!commandData.options) {
      commandData.options = []
      return
    }

    if (!Array.isArray(commandData.options)) {
      this.addError('options', '选项必须是数组格式')
      return
    }

    // 检查选项数量
    if (commandData.options.length > rules.maxCount) {
      this.addError('options', `选项数量不能超过${rules.maxCount}个`)
    }

    const uniqueFlags = new Set()

    commandData.options.forEach((option, index) => {
      // 验证选项结构
      if (!option || typeof option !== 'object') {
        this.addError(`options[${index}]`, '选项必须是对象格式')
        return
      }

      // 验证选项标志
      if (!option.flag) {
        this.addError(`options[${index}].flag`, '选项标志不能为空')
      } else {
        if (!rules.validation.flag.pattern.test(option.flag)) {
          this.addError(`options[${index}].flag`, rules.validation.flag.message)
        }

        // 检查标志重复
        if (uniqueFlags.has(option.flag)) {
          this.addError(`options[${index}].flag`, `重复的选项标志: ${option.flag}`)
        } else {
          uniqueFlags.add(option.flag)
        }
      }

      // 验证选项描述
      if (!option.description) {
        this.addError(`options[${index}].description`, '选项描述不能为空')
      }

      // 验证选项值类型
      if (option.hasValue && !option.valueType) {
        this.addWarning(`options[${index}].valueType`, '带值选项应指定值类型')
      }

      // 验证选项类型
      if (option.type && !['required', 'optional'].includes(option.type)) {
        this.addError(`options[${index}].type`, `无效的选项类型: ${option.type}`)
      }
    })

    // 验证互斥组
    if (commandData.mutexGroups && Array.isArray(commandData.mutexGroups)) {
      commandData.mutexGroups.forEach((group, groupIndex) => {
        if (!group.optionIndexes || !Array.isArray(group.optionIndexes)) {
          this.addError(`mutexGroups[${groupIndex}].optionIndexes`, '互斥组必须包含选项索引数组')
        } else if (group.optionIndexes.length !== 2) {
          this.addError(`mutexGroups[${groupIndex}].optionIndexes`, '互斥组必须包含且仅包含2个选项')
        } else {
          // 验证选项索引的有效性
          group.optionIndexes.forEach(optionIndex => {
            if (optionIndex < 0 || optionIndex >= commandData.options.length) {
              this.addError(`mutexGroups[${groupIndex}].optionIndexes`, `无效的选项索引: ${optionIndex}`)
            } else {
              const option = commandData.options[optionIndex]
              if (option.type !== 'optional') {
                this.addError(`mutexGroups[${groupIndex}].optionIndexes`, '互斥组只能包含可选选项')
              }
            }
          })
        }
      })
    }
  }

  /**
   * 验证命令语法
   * @param {Object} commandData 命令数据
   */
  validateCommandSyntax(commandData) {
    if (!commandData.command) return

    try {
      const analysis = analyzeCommand(commandData.command)
      
      if (!analysis.isValid) {
        analysis.errors.forEach(error => {
          this.addError('command', `语法错误: ${error}`)
        })
      }

      if (analysis.warnings && analysis.warnings.length > 0) {
        analysis.warnings.forEach(warning => {
          this.addWarning('command', `语法警告: ${warning}`)
        })
      }

      // 验证参数占位符与参数定义的一致性
      this.validateParameterConsistency(commandData, analysis)

    } catch (error) {
      this.addError('command', `命令分析失败: ${error.message}`)
    }
  }

  /**
   * 验证参数一致性
   * @param {Object} commandData 命令数据
   * @param {Object} analysis 命令分析结果
   */
  validateParameterConsistency(commandData, analysis) {
    if (!commandData.parameters || !analysis.structure) return

    // 提取命令中的参数占位符
    const commandParams = new Set()
    const paramPattern = /\{\{([a-zA-Z][a-zA-Z0-9_-]*)\}\}/g
    let match
    while ((match = paramPattern.exec(commandData.command)) !== null) {
      commandParams.add(match[1])
    }

    // 提取参数定义中的参数名
    const definedParams = new Set(commandData.parameters.map(p => p.name))

    // 检查未定义的参数
    commandParams.forEach(paramName => {
      if (!definedParams.has(paramName)) {
        this.addError('command', `命令中使用了未定义的参数: {{${paramName}}}`)
      }
    })

    // 检查未使用的参数定义
    definedParams.forEach(paramName => {
      if (!commandParams.has(paramName)) {
        this.addWarning('parameters', `定义了但未在命令中使用的参数: ${paramName}`)
      }
    })
  }

  /**
   * 检查重复
   * @param {Object} commandData 命令数据
   * @param {Object} context 验证上下文
   */
  checkDuplicates(commandData, context) {
    if (!context.existingCommands) return

    // 检查命令名重复
    const duplicate = context.existingCommands.find(cmd => 
      cmd.name === commandData.name && cmd.id !== commandData.id
    )
    
    if (duplicate) {
      this.addWarning('name', `已存在相同名称的命令: ${commandData.name}`)
    }

    // 检查命令内容重复
    const sameCmdContent = context.existingCommands.find(cmd =>
      cmd.command === commandData.command && cmd.id !== commandData.id
    )

    if (sameCmdContent) {
      this.addWarning('command', '已存在相同内容的命令')
    }
  }
}

/**
 * 命令构建验证器
 */
export class CommandBuildValidator extends CommandValidator {
  constructor() {
    super(CommandBuildRules)
  }

  /**
   * 验证命令构建
   * @param {Object} buildConfig 构建配置
   * @param {Object} commandData 命令数据
   * @param {Object} parameterValues 参数值
   * @returns {Object} 验证结果
   */
  validate(buildConfig, commandData, parameterValues = {}) {
    this.reset()

    // 验证构建模式
    this.validateBuildMode(buildConfig)

    // 验证参数值
    this.validateParameterValues(commandData, parameterValues, buildConfig)

    // 验证选项组合
    this.validateOptionCombinations(commandData, buildConfig)

    // 验证最终命令
    if (buildConfig.mode === this.rules.buildModes.EXECUTABLE) {
      this.validateFinalCommand(buildConfig, commandData, parameterValues)
    }

    return this.getResult()
  }

  /**
   * 验证构建模式
   * @param {Object} buildConfig 构建配置
   */
  validateBuildMode(buildConfig) {
    const validModes = Object.values(this.rules.buildModes)
    
    if (!buildConfig.mode) {
      this.addError('buildMode', '必须指定构建模式')
    } else if (!validModes.includes(buildConfig.mode)) {
      this.addError('buildMode', `无效的构建模式: ${buildConfig.mode}`)
    }
  }

  /**
   * 验证参数值
   * @param {Object} commandData 命令数据
   * @param {Object} parameterValues 参数值
   * @param {Object} buildConfig 构建配置
   */
  validateParameterValues(commandData, parameterValues, buildConfig) {
    if (!commandData.parameters) return

    const rules = this.rules.parameterProcessing

    commandData.parameters.forEach(param => {
      const value = parameterValues[param.name]

      // 必选参数检查
      if (param.required) {
        if (rules.required.mustProvideValue && (value === undefined || value === null)) {
          this.addError(`parameter.${param.name}`, `必选参数 "${param.name}" 必须提供值`)
        }
        
        if (rules.required.noEmptyValue && value === '') {
          this.addError(`parameter.${param.name}`, `必选参数 "${param.name}" 不能为空`)
        }
      }

      // 参数类型验证
      if (value !== undefined && value !== null && value !== '') {
        this.validateParameterType(param, value)
      }
    })
  }

  /**
   * 验证参数类型
   * @param {Object} param 参数定义
   * @param {*} value 参数值
   */
  validateParameterType(param, value) {
    switch (param.type) {
      case ParameterType.NUMBER:
        if (isNaN(Number(value))) {
          this.addError(`parameter.${param.name}`, `参数 "${param.name}" 必须是数字`)
        }
        break

      case ParameterType.URL:
        try {
          new URL(value)
        } catch {
          this.addError(`parameter.${param.name}`, `参数 "${param.name}" 必须是有效的URL`)
        }
        break

      case ParameterType.EMAIL:
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailPattern.test(value)) {
          this.addError(`parameter.${param.name}`, `参数 "${param.name}" 必须是有效的邮箱地址`)
        }
        break

      case ParameterType.FILE:
      case ParameterType.DIRECTORY:
        // 基本路径格式检查
        if (value.includes('..') || value.includes('//')) {
          this.addWarning(`parameter.${param.name}`, `参数 "${param.name}" 路径格式可能不安全`)
        }
        break

      case ParameterType.BOOLEAN:
        const validBooleans = ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']
        if (!validBooleans.includes(value.toLowerCase())) {
          this.addError(`parameter.${param.name}`, `参数 "${param.name}" 必须是布尔值`)
        }
        break
    }
  }

  /**
   * 验证选项组合
   * @param {Object} commandData 命令数据
   * @param {Object} buildConfig 构建配置
   */
  validateOptionCombinations(commandData, buildConfig) {
    if (!commandData.options || !buildConfig.selectedOptions) return

    const selectedOptions = Array.from(buildConfig.selectedOptions)
    const optionMap = new Map(commandData.options.map(opt => [opt.flag, opt]))

    // 检查选项冲突
    this.checkOptionConflicts(selectedOptions, optionMap)

    // 检查选项依赖
    this.checkOptionDependencies(selectedOptions, optionMap)
  }

  /**
   * 检查选项冲突
   * @param {Array} selectedOptions 选中的选项
   * @param {Map} optionMap 选项映射
   */
  checkOptionConflicts(selectedOptions, optionMap) {
    const conflicts = new Map()

    selectedOptions.forEach(flag => {
      const option = optionMap.get(flag)
      if (option && option.conflictsWith) {
        option.conflictsWith.forEach(conflictFlag => {
          if (selectedOptions.includes(conflictFlag)) {
            if (!conflicts.has(flag)) conflicts.set(flag, [])
            conflicts.get(flag).push(conflictFlag)
          }
        })
      }
    })

    conflicts.forEach((conflictList, flag) => {
      this.addError('options', `选项 "${flag}" 与以下选项冲突: ${conflictList.join(', ')}`)
    })
  }

  /**
   * 检查选项依赖
   * @param {Array} selectedOptions 选中的选项
   * @param {Map} optionMap 选项映射
   */
  checkOptionDependencies(selectedOptions, optionMap) {
    selectedOptions.forEach(flag => {
      const option = optionMap.get(flag)
      if (option && option.dependsOn) {
        option.dependsOn.forEach(depFlag => {
          if (!selectedOptions.includes(depFlag)) {
            this.addError('options', `选项 "${flag}" 依赖选项 "${depFlag}"`)
          }
        })
      }
    })
  }

  /**
   * 验证最终命令
   * @param {Object} buildConfig 构建配置
   * @param {Object} commandData 命令数据
   * @param {Object} parameterValues 参数值
   */
  validateFinalCommand(buildConfig, commandData, parameterValues) {
    if (!buildConfig.builtCommand) {
      this.addError('finalCommand', '构建的命令不能为空')
      return
    }

    // 分析最终命令
    try {
      const analysis = analyzeCommand(buildConfig.builtCommand)
      
      if (!analysis.isValid) {
        analysis.errors.forEach(error => {
          this.addError('finalCommand', `最终命令语法错误: ${error}`)
        })
      }

      // 检查是否还有未替换的占位符
      const unreplacedParams = buildConfig.builtCommand.match(/\{\{[^}]+\}\}/g)
      if (unreplacedParams) {
        unreplacedParams.forEach(param => {
          this.addError('finalCommand', `未替换的参数占位符: ${param}`)
        })
      }

    } catch (error) {
      this.addError('finalCommand', `最终命令分析失败: ${error.message}`)
    }
  }
}

// ===== 导出验证器工厂函数 =====

/**
 * 创建命令创建验证器
 * @returns {CommandCreationValidator} 验证器实例
 */
export const createCreationValidator = () => {
  return new CommandCreationValidator()
}

/**
 * 创建命令构建验证器
 * @returns {CommandBuildValidator} 验证器实例
 */
export const createBuildValidator = () => {
  return new CommandBuildValidator()
}

/**
 * 快速验证命令创建
 * @param {Object} commandData 命令数据
 * @param {Object} context 验证上下文
 * @returns {Object} 验证结果
 */
export const validateCommandCreation = (commandData, context = {}) => {
  const validator = createCreationValidator()
  return validator.validate(commandData, context)
}

/**
 * 快速验证命令构建
 * @param {Object} buildConfig 构建配置
 * @param {Object} commandData 命令数据
 * @param {Object} parameterValues 参数值
 * @returns {Object} 验证结果
 */
export const validateCommandBuild = (buildConfig, commandData, parameterValues = {}) => {
  const validator = createBuildValidator()
  return validator.validate(buildConfig, commandData, parameterValues)
}

// ===== 命令管理规则 =====

/**
 * 命令管理规则集合
 */
export const CommandManagementRules = {
  creation: CommandCreationRules,
  modification: CommandModificationRules,
  building: CommandBuildRules,
  
  // 删除规则
  deletion: {
    systemCommands: {
      preventDelete: true,
      message: '系统命令不能删除'
    },
    userCommands: {
      moveToRecycleBin: true,
      confirmRequired: true,
      retentionDays: 30
    },
    batchDelete: {
      maxCount: 100,
      confirmRequired: true
    }
  },
  
  // 导入/导出规则
  importExport: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['json', 'csv', 'yaml'],
    validation: {
      required: true,
      sanitization: true,
      deduplication: true
    },
    backup: {
      createBeforeImport: true,
      retentionCount: 5
    }
  }
}

/**
 * 获取完整的命令规则配置
 * @returns {Object} 完整规则配置
 */
export const getCommandRules = () => {
  return {
    structure: ComponentRelationshipRules,
    separators: SeparatorRules,
    management: CommandManagementRules,
    validation: {
      creation: CommandCreationRules,
      modification: CommandModificationRules,
      building: CommandBuildRules
    }
  }
} 