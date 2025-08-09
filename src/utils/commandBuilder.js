/**
 * 命令构建工具类
 * 实现完整的命令创建、验证和构建功能
 */

// 参数类型枚举
export const ParameterType = {
  STRING: 'string',
  NUMBER: 'number',
  FILE: 'file',
  DIRECTORY: 'directory',
  URL: 'url',
  EMAIL: 'email',
  BOOLEAN: 'boolean',
  ENUM: 'enum'
}

// 参数必选级别
export const ParameterRequirement = {
  REQUIRED: 'required',     // 必选参数
  OPTIONAL: 'optional',     // 可选参数
  NONE: 'none'             // 不需要参数
}

// 分隔符类型
export const SeparatorType = {
  PIPE: { symbol: '|', name: '管道符', description: '将前一个命令的输出传递给后一个命令' },
  AND: { symbol: '&&', name: '逻辑与', description: '前一个命令成功时才执行后一个命令' },
  OR: { symbol: '||', name: '逻辑或', description: '前一个命令失败时才执行后一个命令' },
  SEQUENCE: { symbol: ';', name: '顺序执行', description: '按顺序执行命令，不管前一个是否成功' },
  BACKGROUND: { symbol: '&', name: '后台执行', description: '在后台执行命令' }
}

// 验证规则
export const ValidationRules = {
  // 文件路径验证
  FILE_PATH: {
    pattern: /^[^\s<>:"|?*]+$/,
    message: '文件路径不能包含特殊字符'
  },
  
  // URL验证
  URL: {
    pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    message: 'URL格式不正确'
  },
  
  // 邮箱验证
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '邮箱格式不正确'
  },
  
  // 数字验证
  NUMBER: {
    pattern: /^-?\d*\.?\d+$/,
    message: '必须是有效的数字'
  }
}

/**
 * 命令构建器主类
 */
export class CommandBuilder {
  constructor() {
    this.reset()
  }

  /**
   * 重置构建器状态
   */
  reset() {
    this.baseCommand = ''
    this.parameters = []
    this.options = []
    this.separators = []
    this.commonCombinations = []
    this.parameterValues = {}
    this.selectedOptions = new Set()
    this.selectedSeparators = new Set()
    this.validationRules = []
  }

  /**
   * 设置基础命令
   * @param {string} command 基础命令
   */
  setBaseCommand(command) {
    this.baseCommand = command.trim()
    return this
  }

  /**
   * 添加参数定义
   * @param {Object} parameter 参数对象
   */
  addParameter(parameter) {
    const param = {
      name: parameter.name,
      description: parameter.description || '',
      required: parameter.required || false,
      defaultValue: parameter.defaultValue || '',
      type: parameter.type || ParameterType.STRING,
      validation: parameter.validation || null,
      placeholder: parameter.placeholder || '',
      enumValues: parameter.enumValues || null // 枚举类型的可选值
    }

    // 验证参数定义
    if (!param.name) {
      throw new Error('参数名称不能为空')
    }

    // 检查参数名是否重复
    if (this.parameters.find(p => p.name === param.name)) {
      throw new Error(`参数名称 "${param.name}" 已存在`)
    }

    this.parameters.push(param)
    return this
  }

  /**
   * 添加选项定义
   * @param {Object} option 选项对象
   */
  addOption(option) {
    const opt = {
      flag: option.flag,
      description: option.description || '',
      required: option.required || false,
      hasValue: option.hasValue || false,
      valueType: option.valueType || 'string',
      conflictsWith: option.conflictsWith || [],
      dependsOn: option.dependsOn || []
    }

    // 验证选项定义
    if (!opt.flag) {
      throw new Error('选项标志不能为空')
    }

    if (!opt.flag.startsWith('-')) {
      throw new Error('选项标志必须以 "-" 开头')
    }

    // 检查选项是否重复
    if (this.options.find(o => o.flag === opt.flag)) {
      throw new Error(`选项 "${opt.flag}" 已存在`)
    }

    this.options.push(opt)
    return this
  }

  /**
   * 添加分隔符支持
   * @param {string} symbol 分隔符符号
   */
  addSeparator(symbol) {
    const separator = Object.values(SeparatorType).find(s => s.symbol === symbol)
    if (!separator) {
      throw new Error(`不支持的分隔符: ${symbol}`)
    }

    if (!this.separators.find(s => s.symbol === symbol)) {
      this.separators.push(separator)
    }
    return this
  }

  /**
   * 添加常用组合
   * @param {Object} combination 组合对象
   */
  addCommonCombination(combination) {
    const combo = {
      name: combination.name,
      description: combination.description || '',
      command: combination.command,
      parameters: combination.parameters || {}
    }

    this.commonCombinations.push(combo)
    return this
  }

  /**
   * 设置参数值
   * @param {string} paramName 参数名
   * @param {*} value 参数值
   */
  setParameterValue(paramName, value) {
    const parameter = this.parameters.find(p => p.name === paramName)
    if (!parameter) {
      throw new Error(`参数 "${paramName}" 不存在`)
    }

    // 验证参数值
    const validation = this.validateParameterValue(parameter, value)
    if (!validation.isValid) {
      throw new Error(`参数 "${paramName}" 验证失败: ${validation.errors.join(', ')}`)
    }

    this.parameterValues[paramName] = value
    return this
  }

  /**
   * 选择/取消选择选项
   * @param {string} flag 选项标志
   */
  toggleOption(flag) {
    const option = this.options.find(o => o.flag === flag)
    if (!option) {
      throw new Error(`选项 "${flag}" 不存在`)
    }

    if (this.selectedOptions.has(flag)) {
      this.selectedOptions.delete(flag)
    } else {
      // 检查冲突
      const conflicts = this.checkOptionConflicts(flag)
      if (conflicts.length > 0) {
        throw new Error(`选项 "${flag}" 与以下选项冲突: ${conflicts.join(', ')}`)
      }

      this.selectedOptions.add(flag)
    }
    return this
  }

  /**
   * 选择/取消选择分隔符
   * @param {string} symbol 分隔符符号
   */
  toggleSeparator(symbol) {
    if (this.selectedSeparators.has(symbol)) {
      this.selectedSeparators.delete(symbol)
    } else {
      this.selectedSeparators.add(symbol)
    }
    return this
  }

  /**
   * 验证参数值
   * @param {Object} parameter 参数定义
   * @param {*} value 参数值
   * @returns {Object} 验证结果
   */
  validateParameterValue(parameter, value) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // 必选参数检查
    if (parameter.required && (!value || value.toString().trim() === '')) {
      result.errors.push('必选参数不能为空')
      result.isValid = false
      return result
    }

    // 如果值为空且有默认值，使用默认值
    if (!value && parameter.defaultValue) {
      return result
    }

    // 类型验证
    switch (parameter.type) {
      case ParameterType.NUMBER:
        if (value && !ValidationRules.NUMBER.pattern.test(value)) {
          result.errors.push(ValidationRules.NUMBER.message)
          result.isValid = false
        }
        break

      case ParameterType.URL:
        if (value && !ValidationRules.URL.pattern.test(value)) {
          result.errors.push(ValidationRules.URL.message)
          result.isValid = false
        }
        break

      case ParameterType.EMAIL:
        if (value && !ValidationRules.EMAIL.pattern.test(value)) {
          result.errors.push(ValidationRules.EMAIL.message)
          result.isValid = false
        }
        break

      case ParameterType.FILE:
      case ParameterType.DIRECTORY:
        if (value && !ValidationRules.FILE_PATH.pattern.test(value)) {
          result.errors.push(ValidationRules.FILE_PATH.message)
          result.isValid = false
        }
        break

      case ParameterType.ENUM:
        if (value && parameter.enumValues && !parameter.enumValues.includes(value)) {
          result.errors.push(`值必须是以下之一: ${parameter.enumValues.join(', ')}`)
          result.isValid = false
        }
        break

      case ParameterType.BOOLEAN:
        if (value && !['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
          result.errors.push('布尔值必须是 true/false, 1/0, yes/no 之一')
          result.isValid = false
        }
        break
    }

    // 自定义验证规则
    if (parameter.validation && typeof parameter.validation === 'function') {
      try {
        const customResult = parameter.validation(value)
        if (!customResult.isValid) {
          result.errors.push(...customResult.errors)
          result.isValid = false
        }
        if (customResult.warnings) {
          result.warnings.push(...customResult.warnings)
        }
      } catch (error) {
        result.errors.push(`自定义验证失败: ${error.message}`)
        result.isValid = false
      }
    }

    return result
  }

  /**
   * 检查选项冲突
   * @param {string} flag 选项标志
   * @returns {Array} 冲突的选项列表
   */
  checkOptionConflicts(flag) {
    const option = this.options.find(o => o.flag === flag)
    if (!option) return []

    const conflicts = []
    
    // 检查与当前选中选项的冲突
    option.conflictsWith.forEach(conflictFlag => {
      if (this.selectedOptions.has(conflictFlag)) {
        conflicts.push(conflictFlag)
      }
    })

    return conflicts
  }

  /**
   * 检查选项依赖
   * @param {string} flag 选项标志
   * @returns {Array} 缺失的依赖选项
   */
  checkOptionDependencies(flag) {
    const option = this.options.find(o => o.flag === flag)
    if (!option) return []

    const missingDeps = []
    
    option.dependsOn.forEach(depFlag => {
      if (!this.selectedOptions.has(depFlag)) {
        missingDeps.push(depFlag)
      }
    })

    return missingDeps
  }

  /**
   * 构建命令模板
   * @returns {string} 命令模板
   */
  buildTemplate() {
    let template = this.baseCommand

    // 添加选中的选项
    this.selectedOptions.forEach(flag => {
      template += ` ${flag}`
    })

    // 添加参数占位符
    this.parameters.forEach(param => {
      if (param.required) {
        template += ` {{${param.name}}}`
      } else {
        template += ` [{{${param.name}}}]`
      }
    })

    return template.trim()
  }

  /**
   * 构建可执行命令
   * @param {Object} options 构建选项
   * @returns {string} 可执行命令
   */
  buildExecutableCommand(options = {}) {
    const { 
      useDefaults = true, 
      validateRequired = true,
      escapeValues = true 
    } = options

    let command = this.baseCommand

    // 添加选中的选项
    this.selectedOptions.forEach(flag => {
      command += ` ${flag}`
    })

    // 添加参数值
    this.parameters.forEach(param => {
      let value = this.parameterValues[param.name]

      // 使用默认值
      if (!value && useDefaults && param.defaultValue) {
        value = param.defaultValue
      }

      // 验证必选参数
      if (validateRequired && param.required && !value) {
        throw new Error(`必选参数 "${param.name}" 未提供值`)
      }

      // 添加参数值到命令
      if (value) {
        // 转义特殊字符
        if (escapeValues && typeof value === 'string') {
          value = this.escapeCommandValue(value)
        }
        command += ` ${value}`
      }
    })

    return command.trim()
  }

  /**
   * 转义命令值中的特殊字符
   * @param {string} value 要转义的值
   * @returns {string} 转义后的值
   */
  escapeCommandValue(value) {
    // 如果包含空格或特殊字符，用引号包围
    if (/[\s<>"|&;()$`\\]/.test(value)) {
      return `"${value.replace(/"/g, '\\"')}"`
    }
    return value
  }

  /**
   * 完整验证命令
   * @returns {Object} 验证结果
   */
  validateCommand() {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    }

    // 检查基础命令
    if (!this.baseCommand) {
      result.errors.push('基础命令不能为空')
      result.isValid = false
    }

    // 验证必选参数
    this.parameters.forEach(param => {
      if (param.required) {
        const value = this.parameterValues[param.name]
        if (!value || value.toString().trim() === '') {
          result.errors.push(`必选参数 "${param.name}" 未提供值`)
          result.isValid = false
        } else {
          // 验证参数值
          const paramValidation = this.validateParameterValue(param, value)
          if (!paramValidation.isValid) {
            result.errors.push(`参数 "${param.name}": ${paramValidation.errors.join(', ')}`)
            result.isValid = false
          }
          result.warnings.push(...paramValidation.warnings)
        }
      }
    })

    // 验证必选选项
    this.options.forEach(option => {
      if (option.required && !this.selectedOptions.has(option.flag)) {
        result.errors.push(`必选选项 "${option.flag}" 未选择`)
        result.isValid = false
      }
    })

    // 检查选项依赖
    this.selectedOptions.forEach(flag => {
      const missingDeps = this.checkOptionDependencies(flag)
      if (missingDeps.length > 0) {
        result.errors.push(`选项 "${flag}" 依赖以下选项: ${missingDeps.join(', ')}`)
        result.isValid = false
      }
    })

    return result
  }

  /**
   * 解析现有命令
   * @param {string} command 要解析的命令
   * @returns {Object} 解析结果
   */
  parseCommand(command) {
    const tokens = command.trim().split(/\s+/)
    const analysis = {
      baseCommand: '',
      options: [],
      arguments: [],
      separators: []
    }

    if (tokens.length === 0) return analysis

    // 第一个token是基础命令
    analysis.baseCommand = tokens[0]

    // 解析其余tokens
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i]

      if (token.startsWith('-')) {
        analysis.options.push(token)
      } else if (Object.values(SeparatorType).some(s => s.symbol === token)) {
        analysis.separators.push(token)
      } else {
        analysis.arguments.push(token)
      }
    }

    return analysis
  }

  /**
   * 从现有命令定义加载
   * @param {Object} commandDef 命令定义对象
   */
  loadFromDefinition(commandDef) {
    this.reset()
    
    // 解析基础命令
    if (commandDef.commandName) {
      this.setBaseCommand(commandDef.commandName)
    } else if (commandDef.command) {
      // 从完整命令中提取基础命令
      const baseCmd = commandDef.command.split(/\s+/)[0]
      this.setBaseCommand(baseCmd)
    }

    // 加载参数定义
    if (commandDef.parameters && Array.isArray(commandDef.parameters)) {
      commandDef.parameters.forEach(param => {
        this.addParameter(param)
      })
    }

    // 加载选项定义
    if (commandDef.options && Array.isArray(commandDef.options)) {
      commandDef.options.forEach(option => {
        this.addOption(option)
      })
    }

    // 加载分隔符
    if (commandDef.separators && Array.isArray(commandDef.separators)) {
      commandDef.separators.forEach(sep => {
        this.addSeparator(sep.symbol)
      })
    }

    // 加载常用组合
    if (commandDef.commonCommands && Array.isArray(commandDef.commonCommands)) {
      commandDef.commonCommands.forEach(combo => {
        this.addCommonCombination({
          name: combo.name,
          description: combo.description,
          command: combo.command
        })
      })
    }

    return this
  }

  /**
   * 导出为命令定义对象
   * @returns {Object} 命令定义对象
   */
  exportDefinition() {
    return {
      commandName: this.baseCommand,
      command: this.buildTemplate(),
      parameters: this.parameters,
      options: this.options,
      separators: this.separators,
      commonCombinations: this.commonCombinations
    }
  }

  /**
   * 获取参数建议
   * @param {string} paramName 参数名
   * @returns {Array} 建议值列表
   */
  getParameterSuggestions(paramName) {
    const parameter = this.parameters.find(p => p.name === paramName)
    if (!parameter) return []

    const suggestions = []

    // 枚举类型返回所有可选值
    if (parameter.type === ParameterType.ENUM && parameter.enumValues) {
      return parameter.enumValues
    }

    // 布尔类型返回常用值
    if (parameter.type === ParameterType.BOOLEAN) {
      return ['true', 'false', 'yes', 'no', '1', '0']
    }

    // 根据参数名称提供智能建议
    const paramLower = paramName.toLowerCase()
    if (paramLower.includes('file') || paramLower.includes('path')) {
      suggestions.push('./example.txt', '/path/to/file', '*.txt')
    } else if (paramLower.includes('url') || paramLower.includes('link')) {
      suggestions.push('https://example.com', 'http://localhost:3000')
    } else if (paramLower.includes('port')) {
      suggestions.push('3000', '8080', '80', '443')
    } else if (paramLower.includes('host')) {
      suggestions.push('localhost', '127.0.0.1', '0.0.0.0')
    }

    return suggestions
  }
}

/**
 * 命令模板管理器
 */
export class CommandTemplateManager {
  constructor() {
    this.templates = new Map()
  }

  /**
   * 保存命令模板
   * @param {string} name 模板名称
   * @param {CommandBuilder} builder 命令构建器实例
   */
  saveTemplate(name, builder) {
    const template = {
      name,
      definition: builder.exportDefinition(),
      createdAt: new Date().toISOString()
    }
    this.templates.set(name, template)
    return template
  }

  /**
   * 加载命令模板
   * @param {string} name 模板名称
   * @returns {CommandBuilder} 命令构建器实例
   */
  loadTemplate(name) {
    const template = this.templates.get(name)
    if (!template) {
      throw new Error(`模板 "${name}" 不存在`)
    }

    const builder = new CommandBuilder()
    builder.loadFromDefinition(template.definition)
    return builder
  }

  /**
   * 获取所有模板
   * @returns {Array} 模板列表
   */
  getAllTemplates() {
    return Array.from(this.templates.values())
  }

  /**
   * 删除模板
   * @param {string} name 模板名称
   */
  deleteTemplate(name) {
    return this.templates.delete(name)
  }
}

// 导出工具函数
export const createCommandBuilder = () => new CommandBuilder()
export const createTemplateManager = () => new CommandTemplateManager()

// 预设的常用命令构建器
export const createGitCommandBuilder = () => {
  const builder = new CommandBuilder()
  
  builder.setBaseCommand('git')
    .addOption({ flag: '-v', description: '显示详细信息' })
    .addOption({ flag: '--help', description: '显示帮助信息' })
    .addSeparator('&&')
    .addSeparator('|')
  
  return builder
}

export const createDockerCommandBuilder = () => {
  const builder = new CommandBuilder()
  
  builder.setBaseCommand('docker')
    .addOption({ flag: '-d', description: '后台运行' })
    .addOption({ flag: '--rm', description: '容器退出时自动删除' })
    .addParameter({
      name: 'image',
      description: '镜像名称',
      required: true,
      type: ParameterType.STRING
    })
  
  return builder
}

export const createNpmCommandBuilder = () => {
  const builder = new CommandBuilder()
  
  builder.setBaseCommand('npm')
    .addParameter({
      name: 'command',
      description: 'npm命令',
      required: true,
      type: ParameterType.ENUM,
      enumValues: ['install', 'run', 'build', 'test', 'publish', 'start']
    })
    .addOption({ flag: '--save-dev', description: '保存到开发依赖' })
    .addOption({ flag: '--global', description: '全局安装' })
  
  return builder
} 