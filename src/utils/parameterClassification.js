/**
 * 参数分类系统 - 完整定义和管理
 * 包括必选/可选参数，命令级别/选项级别参数的完整分类
 */

// ===== 参数必要性分类 =====

/**
 * 参数必要性级别
 */
export const ParameterRequirement = {
  REQUIRED: 'required',         // 必选参数 - 必须提供值
  OPTIONAL: 'optional',         // 可选参数 - 可以省略
  CONDITIONAL: 'conditional',   // 条件参数 - 在特定条件下必需
  NONE: 'none'                 // 无参数 - 命令本身完整
}

/**
 * 参数作用级别
 */
export const ParameterLevel = {
  COMMAND: 'command',           // 命令级别 - 影响整个命令
  OPTION: 'option',             // 选项级别 - 作为选项的值
  SUBCOMMAND: 'subcommand',     // 子命令级别 - 子命令的参数
  GLOBAL: 'global'              // 全局级别 - 影响所有操作
}

/**
 * 参数作用域
 */
export const ParameterScope = {
  GLOBAL: 'global',             // 全局作用域
  LOCAL: 'local',               // 局部作用域
  INHERITED: 'inherited',       // 继承作用域
  ISOLATED: 'isolated'          // 隔离作用域
}

/**
 * 参数位置类型
 */
export const ParameterPosition = {
  POSITIONAL: 'positional',     // 位置参数 - 按位置确定
  NAMED: 'named',               // 命名参数 - 按名称确定
  FLAG: 'flag',                 // 标志参数 - 作为选项标志
  VALUE: 'value'                // 值参数 - 作为选项值
}

// ===== 参数分类定义 =====

/**
 * 完整的参数分类系统
 */
export const ParameterClassification = {
  // 必选命令级别参数
  REQUIRED_COMMAND: {
    requirement: ParameterRequirement.REQUIRED,
    level: ParameterLevel.COMMAND,
    scope: ParameterScope.LOCAL,
    position: ParameterPosition.POSITIONAL,
    description: '命令执行必需的核心参数',
    examples: [
      { command: 'git clone {{url}}', parameter: 'url', description: '仓库地址' },
      { command: 'docker run {{image}}', parameter: 'image', description: '镜像名称' },
      { command: 'ssh {{host}}', parameter: 'host', description: '目标主机' }
    ]
  },

  // 可选命令级别参数
  OPTIONAL_COMMAND: {
    requirement: ParameterRequirement.OPTIONAL,
    level: ParameterLevel.COMMAND,
    scope: ParameterScope.LOCAL,
    position: ParameterPosition.POSITIONAL,
    description: '命令可选的补充参数',
    examples: [
      { command: 'ls {{directory}}', parameter: 'directory', description: '目录路径（默认当前目录）' },
      { command: 'grep {{pattern}} {{file}}', parameter: 'file', description: '搜索文件（默认stdin）' }
    ]
  },

  // 必选选项级别参数
  REQUIRED_OPTION: {
    requirement: ParameterRequirement.REQUIRED,
    level: ParameterLevel.OPTION,
    scope: ParameterScope.LOCAL,
    position: ParameterPosition.VALUE,
    description: '特定选项必需的参数值',
    examples: [
      { command: 'curl --timeout {{seconds}}', parameter: 'seconds', description: '超时秒数' },
      { command: 'docker run --name {{name}}', parameter: 'name', description: '容器名称' },
      { command: 'mysql -u {{username}}', parameter: 'username', description: '用户名' }
    ]
  },

  // 可选选项级别参数
  OPTIONAL_OPTION: {
    requirement: ParameterRequirement.OPTIONAL,
    level: ParameterLevel.OPTION,
    scope: ParameterScope.LOCAL,
    position: ParameterPosition.VALUE,
    description: '选项的可选参数值',
    examples: [
      { command: 'npm run dev --port {{port}}', parameter: 'port', description: '端口号（有默认值）' },
      { command: 'git log --max-count {{count}}', parameter: 'count', description: '显示条数' }
    ]
  },

  // 条件参数
  CONDITIONAL: {
    requirement: ParameterRequirement.CONDITIONAL,
    level: ParameterLevel.COMMAND,
    scope: ParameterScope.INHERITED,
    position: ParameterPosition.POSITIONAL,
    description: '在特定条件下必需的参数',
    examples: [
      { command: 'git push {{remote}} {{branch}}', parameter: 'remote', description: '仅在推送到远程时需要' },
      { command: 'docker exec {{container}} {{command}}', parameter: 'command', description: '仅在exec模式下需要' }
    ]
  },

  // 全局级别参数
  GLOBAL: {
    requirement: ParameterRequirement.OPTIONAL,
    level: ParameterLevel.GLOBAL,
    scope: ParameterScope.GLOBAL,
    position: ParameterPosition.NAMED,
    description: '影响所有子命令的全局参数',
    examples: [
      { command: 'git --git-dir={{dir}} status', parameter: 'dir', description: 'Git目录路径' },
      { command: 'docker --host={{host}} ps', parameter: 'host', description: 'Docker主机' }
    ]
  }
}

// ===== 参数验证规则 =====

/**
 * 参数分类验证规则
 */
export const ParameterValidationRules = {
  // 必选参数验证
  [ParameterRequirement.REQUIRED]: {
    mustHaveValue: true,
    allowEmpty: false,
    requireValidation: true,
    errorOnMissing: true,
    priority: 'high'
  },

  // 可选参数验证
  [ParameterRequirement.OPTIONAL]: {
    mustHaveValue: false,
    allowEmpty: true,
    requireValidation: false,
    errorOnMissing: false,
    priority: 'medium'
  },

  // 条件参数验证
  [ParameterRequirement.CONDITIONAL]: {
    mustHaveValue: 'conditional',
    allowEmpty: false,
    requireValidation: true,
    errorOnMissing: 'conditional',
    priority: 'high'
  },

  // 命令级别参数验证
  [ParameterLevel.COMMAND]: {
    position: 'flexible',
    orderMatters: true,
    canBeOmitted: false,
    affectsExecution: true
  },

  // 选项级别参数验证
  [ParameterLevel.OPTION]: {
    position: 'fixed',
    orderMatters: false,
    canBeOmitted: true,
    affectsExecution: false
  }
}

// ===== 参数分类器 =====

/**
 * 参数分类器类
 */
export class ParameterClassifier {
  constructor() {
    this.rules = ParameterValidationRules
    this.classifications = ParameterClassification
  }

  /**
   * 对参数进行分类
   * @param {Object} parameter 参数对象
   * @returns {Object} 分类结果
   */
  classify(parameter) {
    const classification = {
      requirement: this.classifyByRequirement(parameter),
      level: this.classifyByLevel(parameter),
      scope: this.classifyByScope(parameter),
      position: this.classifyByPosition(parameter),
      category: null,
      rules: null
    }

    // 确定具体分类
    classification.category = this.determineCategory(classification)
    classification.rules = this.getRulesForClassification(classification)

    return classification
  }

  /**
   * 按必要性分类
   * @param {Object} parameter 参数对象
   * @returns {string} 必要性分类
   */
  classifyByRequirement(parameter) {
    if (parameter.required === true) {
      return ParameterRequirement.REQUIRED
    } else if (parameter.required === false || parameter.required === undefined) {
      if (parameter.conditionalOn) {
        return ParameterRequirement.CONDITIONAL
      }
      return ParameterRequirement.OPTIONAL
    }
    return ParameterRequirement.NONE
  }

  /**
   * 按级别分类
   * @param {Object} parameter 参数对象
   * @returns {string} 级别分类
   */
  classifyByLevel(parameter) {
    // 显式指定级别
    if (parameter.level) {
      return parameter.level
    }

    // 根据父选项判断
    if (parameter.parentOption) {
      return ParameterLevel.OPTION
    }

    // 根据作用域判断
    if (parameter.scope === 'global') {
      return ParameterLevel.GLOBAL
    }

    // 根据名称模式判断
    if (parameter.name && parameter.name.includes('global-')) {
      return ParameterLevel.GLOBAL
    }

    // 默认为命令级别
    return ParameterLevel.COMMAND
  }

  /**
   * 按作用域分类
   * @param {Object} parameter 参数对象
   * @returns {string} 作用域分类
   */
  classifyByScope(parameter) {
    if (parameter.scope) {
      return parameter.scope
    }

    // 根据级别推断作用域
    switch (this.classifyByLevel(parameter)) {
      case ParameterLevel.GLOBAL:
        return ParameterScope.GLOBAL
      case ParameterLevel.OPTION:
        return ParameterScope.LOCAL
      case ParameterLevel.SUBCOMMAND:
        return ParameterScope.INHERITED
      default:
        return ParameterScope.LOCAL
    }
  }

  /**
   * 按位置分类
   * @param {Object} parameter 参数对象
   * @returns {string} 位置分类
   */
  classifyByPosition(parameter) {
    if (parameter.position) {
      return parameter.position
    }

    // 根据参数名称和上下文推断
    if (parameter.parentOption) {
      return ParameterPosition.VALUE
    }

    if (parameter.isFlag) {
      return ParameterPosition.FLAG
    }

    if (parameter.name && parameter.name.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)) {
      return ParameterPosition.NAMED
    }

    return ParameterPosition.POSITIONAL
  }

  /**
   * 确定具体分类类别
   * @param {Object} classification 分类信息
   * @returns {string} 分类类别
   */
  determineCategory(classification) {
    const { requirement, level } = classification

    if (requirement === ParameterRequirement.REQUIRED && level === ParameterLevel.COMMAND) {
      return 'REQUIRED_COMMAND'
    } else if (requirement === ParameterRequirement.OPTIONAL && level === ParameterLevel.COMMAND) {
      return 'OPTIONAL_COMMAND'
    } else if (requirement === ParameterRequirement.REQUIRED && level === ParameterLevel.OPTION) {
      return 'REQUIRED_OPTION'
    } else if (requirement === ParameterRequirement.OPTIONAL && level === ParameterLevel.OPTION) {
      return 'OPTIONAL_OPTION'
    } else if (requirement === ParameterRequirement.CONDITIONAL) {
      return 'CONDITIONAL'
    } else if (level === ParameterLevel.GLOBAL) {
      return 'GLOBAL'
    }

    return 'UNKNOWN'
  }

  /**
   * 获取分类对应的规则
   * @param {Object} classification 分类信息
   * @returns {Object} 验证规则
   */
  getRulesForClassification(classification) {
    const requirementRules = this.rules[classification.requirement] || {}
    const levelRules = this.rules[classification.level] || {}

    return {
      ...requirementRules,
      ...levelRules,
      classification: classification.category
    }
  }

  /**
   * 验证参数分类
   * @param {Object} parameter 参数对象
   * @param {*} value 参数值
   * @param {Object} context 验证上下文
   * @returns {Object} 验证结果
   */
  validateParameterByClassification(parameter, value, context = {}) {
    const classification = this.classify(parameter)
    const rules = classification.rules
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      classification
    }

    // 必要性验证
    if (rules.mustHaveValue === true && (value === undefined || value === null)) {
      result.errors.push(`${classification.category}参数 "${parameter.name}" 必须提供值`)
      result.isValid = false
    }

    if (rules.allowEmpty === false && value === '') {
      result.errors.push(`${classification.category}参数 "${parameter.name}" 不能为空`)
      result.isValid = false
    }

    // 条件验证
    if (rules.mustHaveValue === 'conditional') {
      const conditionMet = this.checkCondition(parameter, context)
      if (conditionMet && (value === undefined || value === null)) {
        result.errors.push(`条件参数 "${parameter.name}" 在当前条件下必须提供值`)
        result.isValid = false
      }
    }

    // 位置验证
    if (rules.position === 'fixed' && !this.validatePosition(parameter, context)) {
      result.warnings.push(`选项级别参数 "${parameter.name}" 位置可能不正确`)
    }

    return result
  }

  /**
   * 检查条件参数的条件
   * @param {Object} parameter 参数对象
   * @param {Object} context 上下文
   * @returns {boolean} 条件是否满足
   */
  checkCondition(parameter, context) {
    if (!parameter.conditionalOn) return false

    // 检查依赖的选项或参数是否存在
    if (parameter.conditionalOn.option) {
      return context.selectedOptions?.includes(parameter.conditionalOn.option) || false
    }

    if (parameter.conditionalOn.parameter) {
      return context.parameterValues?.hasOwnProperty(parameter.conditionalOn.parameter) || false
    }

    // 检查自定义条件函数
    if (typeof parameter.conditionalOn === 'function') {
      return parameter.conditionalOn(context)
    }

    return false
  }

  /**
   * 验证参数位置
   * @param {Object} parameter 参数对象
   * @param {Object} context 上下文
   * @returns {boolean} 位置是否正确
   */
  validatePosition(parameter, context) {
    // 实现具体的位置验证逻辑
    // 这里简化处理，实际可以根据具体需求实现
    return true
  }
}

// ===== 参数构建器增强 =====

/**
 * 增强的参数构建器
 */
export class EnhancedParameterBuilder {
  constructor() {
    this.classifier = new ParameterClassifier()
    this.parameters = []
  }

  /**
   * 添加必选命令参数
   * @param {string} name 参数名
   * @param {string} description 描述
   * @param {Object} options 选项
   * @returns {EnhancedParameterBuilder} 链式调用
   */
  addRequiredCommand(name, description, options = {}) {
    return this.addParameter({
      name,
      description,
      required: true,
      level: ParameterLevel.COMMAND,
      ...options
    })
  }

  /**
   * 添加可选命令参数
   * @param {string} name 参数名
   * @param {string} description 描述
   * @param {string} defaultValue 默认值
   * @param {Object} options 选项
   * @returns {EnhancedParameterBuilder} 链式调用
   */
  addOptionalCommand(name, description, defaultValue = '', options = {}) {
    return this.addParameter({
      name,
      description,
      required: false,
      defaultValue,
      level: ParameterLevel.COMMAND,
      ...options
    })
  }

  /**
   * 添加选项参数
   * @param {string} name 参数名
   * @param {string} parentOption 父选项
   * @param {string} description 描述
   * @param {boolean} required 是否必需
   * @param {Object} options 选项
   * @returns {EnhancedParameterBuilder} 链式调用
   */
  addOptionParameter(name, parentOption, description, required = false, options = {}) {
    return this.addParameter({
      name,
      description,
      required,
      level: ParameterLevel.OPTION,
      parentOption,
      ...options
    })
  }

  /**
   * 添加条件参数
   * @param {string} name 参数名
   * @param {string} description 描述
   * @param {Object} condition 条件
   * @param {Object} options 选项
   * @returns {EnhancedParameterBuilder} 链式调用
   */
  addConditionalParameter(name, description, condition, options = {}) {
    return this.addParameter({
      name,
      description,
      required: true,
      conditionalOn: condition,
      level: ParameterLevel.COMMAND,
      ...options
    })
  }

  /**
   * 添加全局参数
   * @param {string} name 参数名
   * @param {string} description 描述
   * @param {Object} options 选项
   * @returns {EnhancedParameterBuilder} 链式调用
   */
  addGlobalParameter(name, description, options = {}) {
    return this.addParameter({
      name,
      description,
      required: false,
      level: ParameterLevel.GLOBAL,
      scope: ParameterScope.GLOBAL,
      ...options
    })
  }

  /**
   * 添加参数（通用方法）
   * @param {Object} parameter 参数对象
   * @returns {EnhancedParameterBuilder} 链式调用
   */
  addParameter(parameter) {
    // 自动分类
    const classification = this.classifier.classify(parameter)
    
    // 合并分类信息
    const enhancedParameter = {
      ...parameter,
      classification,
      id: this.generateParameterId(),
      createdAt: new Date().toISOString()
    }

    this.parameters.push(enhancedParameter)
    return this
  }

  /**
   * 获取所有参数
   * @returns {Array} 参数数组
   */
  getParameters() {
    return this.parameters
  }

  /**
   * 按分类获取参数
   * @param {string} category 分类类别
   * @returns {Array} 指定分类的参数
   */
  getParametersByCategory(category) {
    return this.parameters.filter(p => 
      p.classification.category === category
    )
  }

  /**
   * 获取必选参数
   * @returns {Array} 必选参数
   */
  getRequiredParameters() {
    return this.parameters.filter(p => 
      p.classification.requirement === ParameterRequirement.REQUIRED
    )
  }

  /**
   * 生成参数ID
   * @returns {string} 参数ID
   */
  generateParameterId() {
    return 'param_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 验证所有参数
   * @param {Object} values 参数值
   * @param {Object} context 验证上下文
   * @returns {Object} 验证结果
   */
  validateAll(values, context = {}) {
    const results = this.parameters.map(param => {
      const value = values[param.name]
      return this.classifier.validateParameterByClassification(param, value, context)
    })

    const allValid = results.every(r => r.isValid)
    const allErrors = results.flatMap(r => r.errors)
    const allWarnings = results.flatMap(r => r.warnings)

    return {
      isValid: allValid,
      errors: allErrors,
      warnings: allWarnings,
      results
    }
  }
}

// ===== 导出接口 =====

/**
 * 创建参数分类器
 * @returns {ParameterClassifier} 分类器实例
 */
export const createParameterClassifier = () => {
  return new ParameterClassifier()
}

/**
 * 创建增强参数构建器
 * @returns {EnhancedParameterBuilder} 构建器实例
 */
export const createEnhancedParameterBuilder = () => {
  return new EnhancedParameterBuilder()
}

/**
 * 快速分类参数
 * @param {Object} parameter 参数对象
 * @returns {Object} 分类结果
 */
export const classifyParameter = (parameter) => {
  const classifier = createParameterClassifier()
  return classifier.classify(parameter)
}

/**
 * 获取参数分类定义
 * @returns {Object} 分类定义
 */
export const getParameterClassifications = () => {
  return ParameterClassification
}

/**
 * 获取参数验证规则
 * @returns {Object} 验证规则
 */
export const getParameterValidationRules = () => {
  return ParameterValidationRules
} 