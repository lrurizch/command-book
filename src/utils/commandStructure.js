/**
 * 命令结构完整分析和规则定义系统
 * 定义命令的各个组成部分及其关系和验证规则
 */

// ===== 命令组件类型定义 =====

/**
 * 基础命令类型
 */
export const BaseCommandType = {
  EXECUTABLE: 'executable',      // 可执行程序 (git, docker, npm)
  BUILTIN: 'builtin',           // 内置命令 (cd, echo, ls)
  SCRIPT: 'script',             // 脚本命令 (.sh, .bat)
  FUNCTION: 'function',         // 函数命令 (shell function)
  ALIAS: 'alias'                // 别名命令
}

/**
 * 选项类型
 */
export const OptionType = {
  SHORT: 'short',               // 短选项 (-v, -h)
  LONG: 'long',                 // 长选项 (--verbose, --help)
  GNU: 'gnu',                   // GNU风格 (--option=value)
  BUNDLED: 'bundled'            // 组合选项 (-vh, -abc)
}

/**
 * 参数类型
 */
export const ParameterType = {
  POSITIONAL: 'positional',     // 位置参数
  NAMED: 'named',               // 命名参数
  VARIADIC: 'variadic',         // 可变参数 (...args)
  OPTIONAL: 'optional',         // 可选参数 [arg]
  REQUIRED: 'required'          // 必选参数 <arg>
}

/**
 * 分隔符类型和规则
 */
export const SeparatorRules = {
  PIPE: {
    symbol: '|',
    name: '管道符',
    description: '将前一个命令的stdout传递给后一个命令的stdin',
    syntax: 'command1 | command2',
    precedence: 1,
    associativity: 'left',
    canChain: true,
    restrictions: {
      beforeCommand: true,
      afterCommand: true,
      minCommands: 2
    }
  },
  
  AND: {
    symbol: '&&',
    name: '逻辑与',
    description: '仅当前一个命令成功时才执行后一个命令',
    syntax: 'command1 && command2',
    precedence: 2,
    associativity: 'left',
    canChain: true,
    restrictions: {
      beforeCommand: true,
      afterCommand: true,
      exitCode: 0
    }
  },
  
  OR: {
    symbol: '||',
    name: '逻辑或',
    description: '仅当前一个命令失败时才执行后一个命令',
    syntax: 'command1 || command2',
    precedence: 2,
    associativity: 'left',
    canChain: true,
    restrictions: {
      beforeCommand: true,
      afterCommand: true,
      exitCode: '!= 0'
    }
  },
  
  SEQUENCE: {
    symbol: ';',
    name: '顺序执行',
    description: '按顺序执行命令，不管前一个命令是否成功',
    syntax: 'command1; command2',
    precedence: 3,
    associativity: 'left',
    canChain: true,
    restrictions: {
      beforeCommand: true,
      afterCommand: true
    }
  },
  
  BACKGROUND: {
    symbol: '&',
    name: '后台执行',
    description: '在后台执行命令，不阻塞当前shell',
    syntax: 'command &',
    precedence: 4,
    associativity: 'right',
    canChain: false,
    restrictions: {
      beforeCommand: true,
      afterCommand: false,
      position: 'end'
    }
  },
  
  REDIRECT_OUT: {
    symbol: '>',
    name: '输出重定向',
    description: '将命令输出重定向到文件',
    syntax: 'command > file',
    precedence: 0,
    associativity: 'right',
    canChain: false,
    restrictions: {
      beforeCommand: true,
      afterCommand: false,
      requiresTarget: true,
      targetType: 'file'
    }
  },
  
  REDIRECT_APPEND: {
    symbol: '>>',
    name: '追加重定向',
    description: '将命令输出追加到文件',
    syntax: 'command >> file',
    precedence: 0,
    associativity: 'right',
    canChain: false,
    restrictions: {
      beforeCommand: true,
      afterCommand: false,
      requiresTarget: true,
      targetType: 'file'
    }
  },
  
  REDIRECT_IN: {
    symbol: '<',
    name: '输入重定向',
    description: '从文件读取输入',
    syntax: 'command < file',
    precedence: 0,
    associativity: 'right',
    canChain: false,
    restrictions: {
      beforeCommand: true,
      afterCommand: false,
      requiresTarget: true,
      targetType: 'file'
    }
  }
}

// ===== 命令结构规则定义 =====

/**
 * 命令组件关系规则
 */
export const ComponentRelationshipRules = {
  // 基础命令规则
  baseCommand: {
    position: 'first',
    required: true,
    maxCount: 1,
    validation: {
      pattern: /^[a-zA-Z][a-zA-Z0-9._-]*$/,
      message: '基础命令只能包含字母、数字、点、下划线和连字符，且必须以字母开头'
    }
  },
  
  // 选项规则
  options: {
    position: 'afterBase',
    required: false,
    maxCount: Infinity,
    ordering: 'flexible',
    grouping: {
      canBundle: true,      // 短选项可以组合 (-abc)
      canRepeat: false,     // 选项不能重复
      canConflict: true     // 某些选项可能冲突
    },
    validation: {
      shortOption: {
        pattern: /^-[a-zA-Z0-9]$/,
        message: '短选项格式: -x (单个字符)'
      },
      longOption: {
        pattern: /^--[a-zA-Z][a-zA-Z0-9-]*$/,
        message: '长选项格式: --option-name'
      },
      gnuOption: {
        pattern: /^--[a-zA-Z][a-zA-Z0-9-]*=[^\s]+$/,
        message: 'GNU选项格式: --option=value'
      }
    }
  },
  
  // 参数规则
  parameters: {
    position: 'afterOptions',
    required: 'conditional',
    maxCount: Infinity,
    ordering: 'strict',
    precedence: ['required', 'optional', 'variadic'],
    validation: {
      required: {
        pattern: /^<[a-zA-Z][a-zA-Z0-9_-]*>$/,
        message: '必选参数格式: <parameter-name>'
      },
      optional: {
        pattern: /^\[[a-zA-Z][a-zA-Z0-9_-]*\]$/,
        message: '可选参数格式: [parameter-name]'
      },
      variadic: {
        pattern: /^\.\.\.?[a-zA-Z][a-zA-Z0-9_-]*$/,
        message: '可变参数格式: ...parameter-name'
      }
    }
  },
  
  // 分隔符规则
  separators: {
    position: 'anywhere',
    required: false,
    maxCount: Infinity,
    precedence: 'defined',
    validation: {
      syntax: true,
      semantics: true,
      compatibility: true
    }
  }
}

/**
 * 命令语法验证规则
 */
export const SyntaxRules = {
  // 基本语法规则
  basic: {
    mustStartWithCommand: true,
    noEmptyComponents: true,
    noConsecutiveSeparators: true,
    balancedQuotes: true,
    validCharacters: /^[a-zA-Z0-9\s\-\.\/_=\|\&\;\>\<\[\]\{\}\(\)\$\@\#\!\?\*\+\~\`\"\'\\]+$/
  },
  
  // 引号规则
  quotes: {
    single: {
      pattern: /^'[^']*'$/,
      escaping: false,
      nesting: false
    },
    double: {
      pattern: /^"[^"]*"$/,
      escaping: true,
      nesting: false,
      variableExpansion: true
    },
    backtick: {
      pattern: /^`[^`]*`$/,
      commandSubstitution: true
    }
  },
  
  // 转义规则
  escaping: {
    backslash: {
      enabled: true,
      escapable: [' ', '\\', '"', "'", '|', '&', ';', '>', '<', '$', '`', '!', '?', '*', '+', '~']
    },
    context: {
      insideQuotes: 'limited',
      outsideQuotes: 'full'
    }
  }
}

// ===== 命令构建和验证规则 =====

/**
 * 命令构建规则
 */
export const BuildRules = {
  // 组件顺序规则
  componentOrder: [
    'baseCommand',
    'globalOptions',
    'subcommand',
    'subcommandOptions',
    'parameters',
    'separators'
  ],
  
  // 空格规则
  spacing: {
    betweenComponents: 1,
    aroundSeparators: {
      '|': { before: 1, after: 1 },
      '&&': { before: 1, after: 1 },
      '||': { before: 1, after: 1 },
      ';': { before: 0, after: 1 },
      '&': { before: 1, after: 0 },
      '>': { before: 1, after: 1 },
      '>>': { before: 1, after: 1 },
      '<': { before: 1, after: 1 }
    },
    insideQuotes: 'preserve'
  },
  
  // 参数替换规则
  parameterSubstitution: {
    placeholder: {
      pattern: /\{\{([a-zA-Z][a-zA-Z0-9_-]*)\}\}/g,
      required: true,
      validation: true
    },
    optional: {
      pattern: /\{\{([a-zA-Z][a-zA-Z0-9_-]*)\?\}\}/g,
      required: false,
      defaultValue: ''
    },
    conditional: {
      pattern: /\{\{([a-zA-Z][a-zA-Z0-9_-]*):([^}]*)\}\}/g,
      required: false,
      hasDefault: true
    }
  }
}

/**
 * 命令验证规则
 */
export const ValidationRules = {
  // 结构验证
  structure: {
    hasBaseCommand: true,
    validSyntax: true,
    balancedStructure: true,
    noCircularDependencies: true
  },
  
  // 语义验证
  semantics: {
    optionCompatibility: true,
    parameterRequirements: true,
    separatorLogic: true,
    resourceAvailability: false // 可选：检查文件/命令是否存在
  },
  
  // 安全验证
  security: {
    noInjection: true,
    noPrivilegeEscalation: true,
    noDestructiveOperations: false, // 可配置
    whitelistCommands: false        // 可配置
  }
}

// ===== 命令分析器类 =====

/**
 * 命令结构分析器
 */
export class CommandStructureAnalyzer {
  constructor(options = {}) {
    this.options = {
      strictMode: false,
      enableSuggestions: true,
      validateSecurity: false,
      ...options
    }
    this.errors = []
    this.warnings = []
    this.suggestions = []
  }

  /**
   * 分析命令结构
   * @param {string} command 要分析的命令
   * @returns {Object} 分析结果
   */
  analyze(command) {
    this.reset()
    
    const tokens = this.tokenize(command)
    const structure = this.parseStructure(tokens)
    const validation = this.validateStructure(structure)
    
    return {
      command,
      tokens,
      structure,
      validation,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions,
      isValid: this.errors.length === 0
    }
  }

  /**
   * 重置分析器状态
   */
  reset() {
    this.errors = []
    this.warnings = []
    this.suggestions = []
  }

  /**
   * 命令分词
   * @param {string} command 命令字符串
   * @returns {Array} 分词结果
   */
  tokenize(command) {
    const tokens = []
    let current = ''
    let inQuotes = false
    let quoteChar = null
    let escaped = false

    for (let i = 0; i < command.length; i++) {
      const char = command[i]
      const nextChar = command[i + 1]

      if (escaped) {
        current += char
        escaped = false
        continue
      }

      if (char === '\\' && !inQuotes) {
        escaped = true
        continue
      }

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true
        quoteChar = char
        current += char
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false
        current += char
        quoteChar = null
      } else if (inQuotes) {
        current += char
      } else if (char === ' ' || char === '\t') {
        if (current) {
          tokens.push(this.createToken(current))
          current = ''
        }
      } else if (this.isSeparator(char, nextChar)) {
        if (current) {
          tokens.push(this.createToken(current))
          current = ''
        }
        
        const separator = this.getSeparator(char, nextChar)
        tokens.push({
          type: 'separator',
          value: separator.symbol,
          ...separator
        })
        
        if (separator.symbol.length > 1) {
          i++ // 跳过下一个字符
        }
      } else {
        current += char
      }
    }

    if (current) {
      tokens.push(this.createToken(current))
    }

    return tokens
  }

  /**
   * 创建token对象
   * @param {string} value token值
   * @returns {Object} token对象
   */
  createToken(value) {
    const token = {
      type: this.getTokenType(value),
      value: value,
      raw: value
    }

    // 添加额外的属性
    switch (token.type) {
      case 'option':
        token.isShort = value.match(/^-[^-]$/) !== null
        token.isLong = value.startsWith('--')
        token.hasValue = value.includes('=')
        if (token.hasValue) {
          const [flag, val] = value.split('=', 2)
          token.flag = flag
          token.optionValue = val
        }
        break
      
      case 'parameter':
        token.isRequired = value.startsWith('<') && value.endsWith('>')
        token.isOptional = value.startsWith('[') && value.endsWith(']')
        token.isVariadic = value.startsWith('...')
        token.isPlaceholder = /^\{\{.*\}\}$/.test(value)
        break
    }

    return token
  }

  /**
   * 获取token类型
   * @param {string} value token值
   * @returns {string} token类型
   */
  getTokenType(value) {
    if (!value) return 'empty'
    
    // 检查是否是选项
    if (value.startsWith('-')) {
      return 'option'
    }
    
    // 检查是否是参数占位符
    if (/^\{\{.*\}\}$/.test(value) || 
        (value.startsWith('<') && value.endsWith('>')) ||
        (value.startsWith('[') && value.endsWith(']'))) {
      return 'parameter'
    }
    
    // 检查是否是引用字符串
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return 'quoted'
    }
    
    // 检查是否是路径
    if (value.includes('/') || value.includes('\\') || value.includes('.')) {
      return 'path'
    }
    
    // 默认为参数
    return 'argument'
  }

  /**
   * 检查是否是分隔符
   * @param {string} char 当前字符
   * @param {string} nextChar 下一个字符
   * @returns {boolean} 是否是分隔符
   */
  isSeparator(char, nextChar) {
    const twoChar = char + (nextChar || '')
    return Object.values(SeparatorRules).some(rule => 
      rule.symbol === char || rule.symbol === twoChar
    )
  }

  /**
   * 获取分隔符信息
   * @param {string} char 当前字符
   * @param {string} nextChar 下一个字符
   * @returns {Object} 分隔符信息
   */
  getSeparator(char, nextChar) {
    const twoChar = char + (nextChar || '')
    
    // 优先匹配两字符分隔符
    let separator = Object.values(SeparatorRules).find(rule => rule.symbol === twoChar)
    if (separator) return separator
    
    // 匹配单字符分隔符
    separator = Object.values(SeparatorRules).find(rule => rule.symbol === char)
    return separator || { symbol: char, name: 'unknown', description: '未知分隔符' }
  }

  /**
   * 解析命令结构
   * @param {Array} tokens token数组
   * @returns {Object} 命令结构
   */
  parseStructure(tokens) {
    const structure = {
      baseCommand: null,
      subcommands: [],
      options: [],
      arguments: [],
      parameters: [],
      separators: [],
      components: []
    }

    let currentComponent = null
    let expectingArgument = false

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]

      switch (token.type) {
        case 'argument':
          if (i === 0) {
            // 第一个参数是基础命令
            structure.baseCommand = token
            currentComponent = {
              type: 'command',
              baseCommand: token,
              options: [],
              arguments: [],
              parameters: []
            }
          } else if (currentComponent) {
            if (this.isSubcommand(token, structure.baseCommand)) {
              structure.subcommands.push(token)
              currentComponent.subcommand = token
            } else {
              structure.arguments.push(token)
              currentComponent.arguments.push(token)
            }
          }
          break

        case 'option':
          if (currentComponent) {
            structure.options.push(token)
            currentComponent.options.push(token)
          }
          break

        case 'parameter':
          if (currentComponent) {
            structure.parameters.push(token)
            currentComponent.parameters.push(token)
          }
          break

        case 'separator':
          structure.separators.push(token)
          
          // 分隔符结束当前组件
          if (currentComponent) {
            structure.components.push(currentComponent)
            currentComponent = null
          }
          
          // 某些分隔符后期望新的命令
          if (token.value === '|' || token.value === '&&' || 
              token.value === '||' || token.value === ';') {
            expectingArgument = true
          }
          break

        default:
          if (currentComponent) {
            structure.arguments.push(token)
            currentComponent.arguments.push(token)
          }
      }
    }

    // 添加最后一个组件
    if (currentComponent) {
      structure.components.push(currentComponent)
    }

    return structure
  }

  /**
   * 判断是否是子命令
   * @param {Object} token token对象
   * @param {Object} baseCommand 基础命令
   * @returns {boolean} 是否是子命令
   */
  isSubcommand(token, baseCommand) {
    if (!baseCommand) return false
    
    // 基于基础命令的已知子命令
    const knownSubcommands = {
      git: ['clone', 'pull', 'push', 'commit', 'add', 'status', 'log', 'branch', 'checkout', 'merge'],
      docker: ['run', 'build', 'pull', 'push', 'ps', 'images', 'exec', 'logs', 'stop', 'start'],
      npm: ['install', 'run', 'build', 'test', 'publish', 'init', 'start', 'stop'],
      yarn: ['add', 'remove', 'install', 'run', 'build', 'test'],
      kubectl: ['get', 'create', 'delete', 'apply', 'describe', 'logs', 'exec'],
      aws: ['s3', 'ec2', 'iam', 'lambda', 'cloudformation']
    }

    const baseCmd = baseCommand.value
    return knownSubcommands[baseCmd]?.includes(token.value) || false
  }

  /**
   * 验证命令结构
   * @param {Object} structure 命令结构
   * @returns {Object} 验证结果
   */
  validateStructure(structure) {
    const validation = {
      structure: this.validateBasicStructure(structure),
      syntax: this.validateSyntax(structure),
      semantics: this.validateSemantics(structure),
      security: this.options.validateSecurity ? this.validateSecurity(structure) : null
    }

    validation.isValid = Object.values(validation).every(v => v === null || v.isValid)
    
    return validation
  }

  /**
   * 验证基本结构
   * @param {Object} structure 命令结构
   * @returns {Object} 验证结果
   */
  validateBasicStructure(structure) {
    const result = { isValid: true, errors: [], warnings: [] }

    // 检查是否有基础命令
    if (!structure.baseCommand) {
      result.errors.push('命令必须有基础命令')
      result.isValid = false
    }

    // 检查选项格式
    structure.options.forEach((option, index) => {
      if (!this.isValidOption(option.value)) {
        result.errors.push(`选项 "${option.value}" 格式不正确`)
        result.isValid = false
      }
    })

    // 检查分隔符使用
    structure.separators.forEach((separator, index) => {
      const rule = SeparatorRules[Object.keys(SeparatorRules).find(key => 
        SeparatorRules[key].symbol === separator.value
      )]
      
      if (rule && rule.restrictions) {
        if (rule.restrictions.beforeCommand && index === 0) {
          result.errors.push(`分隔符 "${separator.value}" 前面必须有命令`)
          result.isValid = false
        }
        
        if (rule.restrictions.afterCommand && index === structure.separators.length - 1) {
          if (separator.value !== '&') { // 后台执行符号例外
            result.warnings.push(`分隔符 "${separator.value}" 后面通常需要命令`)
          }
        }
      }
    })

    return result
  }

  /**
   * 验证语法
   * @param {Object} structure 命令结构
   * @returns {Object} 验证结果
   */
  validateSyntax(structure) {
    const result = { isValid: true, errors: [], warnings: [] }

    // 检查连续分隔符
    for (let i = 0; i < structure.separators.length - 1; i++) {
      const current = structure.separators[i]
      const next = structure.separators[i + 1]
      
      if (this.areConsecutiveSeparators(current, next)) {
        result.errors.push(`不能有连续的分隔符: "${current.value}" "${next.value}"`)
        result.isValid = false
      }
    }

    // 检查分隔符优先级
    this.checkSeparatorPrecedence(structure.separators, result)

    return result
  }

  /**
   * 验证语义
   * @param {Object} structure 命令结构
   * @returns {Object} 验证结果
   */
  validateSemantics(structure) {
    const result = { isValid: true, errors: [], warnings: [] }

    // 检查选项冲突
    this.checkOptionConflicts(structure.options, result)

    // 检查必需参数
    this.checkRequiredParameters(structure.parameters, result)

    // 检查分隔符逻辑
    this.checkSeparatorLogic(structure, result)

    return result
  }

  /**
   * 验证安全性
   * @param {Object} structure 命令结构
   * @returns {Object} 验证结果
   */
  validateSecurity(structure) {
    const result = { isValid: true, errors: [], warnings: [] }

    // 检查命令注入
    this.checkCommandInjection(structure, result)

    // 检查危险操作
    this.checkDangerousOperations(structure, result)

    return result
  }

  /**
   * 检查是否是有效选项
   * @param {string} option 选项字符串
   * @returns {boolean} 是否有效
   */
  isValidOption(option) {
    const rules = ComponentRelationshipRules.options.validation
    return rules.shortOption.pattern.test(option) ||
           rules.longOption.pattern.test(option) ||
           rules.gnuOption.pattern.test(option)
  }

  /**
   * 检查是否是连续分隔符
   * @param {Object} current 当前分隔符
   * @param {Object} next 下一个分隔符
   * @returns {boolean} 是否连续
   */
  areConsecutiveSeparators(current, next) {
    // 某些分隔符组合是允许的
    const allowedCombinations = [
      ['|', '&'],  // 管道后台执行
      ['>', '>'],  // 重定向追加 (应该是 >>)
    ]

    return !allowedCombinations.some(combo => 
      combo[0] === current.value && combo[1] === next.value
    )
  }

  /**
   * 检查分隔符优先级
   * @param {Array} separators 分隔符数组
   * @param {Object} result 验证结果对象
   */
  checkSeparatorPrecedence(separators, result) {
    // 实现分隔符优先级检查逻辑
    // 例如: && 和 || 具有相同优先级，| 优先级更高
  }

  /**
   * 检查选项冲突
   * @param {Array} options 选项数组
   * @param {Object} result 验证结果对象
   */
  checkOptionConflicts(options, result) {
    // 检查重复选项
    const seen = new Set()
    options.forEach(option => {
      const flag = option.flag || option.value
      if (seen.has(flag)) {
        result.errors.push(`重复的选项: ${flag}`)
        result.isValid = false
      }
      seen.add(flag)
    })
  }

  /**
   * 检查必需参数
   * @param {Array} parameters 参数数组
   * @param {Object} result 验证结果对象
   */
  checkRequiredParameters(parameters, result) {
    parameters.forEach(param => {
      if (param.isRequired && !param.value) {
        result.errors.push(`缺少必需参数: ${param.raw}`)
        result.isValid = false
      }
    })
  }

  /**
   * 检查分隔符逻辑
   * @param {Object} structure 命令结构
   * @param {Object} result 验证结果对象
   */
  checkSeparatorLogic(structure, result) {
    // 检查分隔符的逻辑正确性
    structure.separators.forEach(separator => {
      const rule = Object.values(SeparatorRules).find(r => r.symbol === separator.value)
      if (rule && rule.restrictions) {
        // 实现具体的逻辑检查
      }
    })
  }

  /**
   * 检查命令注入
   * @param {Object} structure 命令结构
   * @param {Object} result 验证结果对象
   */
  checkCommandInjection(structure, result) {
    const dangerousPatterns = [
      /;\s*rm\s+-rf/,
      /\$\([^)]*\)/,
      /`[^`]*`/,
      /\|\s*sh/,
      /\|\s*bash/
    ]

    structure.arguments.forEach(arg => {
      dangerousPatterns.forEach(pattern => {
        if (pattern.test(arg.value)) {
          result.errors.push(`检测到潜在的命令注入: ${arg.value}`)
          result.isValid = false
        }
      })
    })
  }

  /**
   * 检查危险操作
   * @param {Object} structure 命令结构
   * @param {Object} result 验证结果对象
   */
  checkDangerousOperations(structure, result) {
    const dangerousCommands = ['rm', 'del', 'format', 'fdisk', 'mkfs']
    
    if (structure.baseCommand && 
        dangerousCommands.includes(structure.baseCommand.value)) {
      result.warnings.push(`危险命令: ${structure.baseCommand.value}`)
    }
  }
}

// ===== 导出主要接口 =====

/**
 * 创建命令分析器实例
 * @param {Object} options 配置选项
 * @returns {CommandStructureAnalyzer} 分析器实例
 */
export const createCommandAnalyzer = (options = {}) => {
  return new CommandStructureAnalyzer(options)
}

/**
 * 快速分析命令
 * @param {string} command 命令字符串
 * @param {Object} options 配置选项
 * @returns {Object} 分析结果
 */
export const analyzeCommand = (command, options = {}) => {
  const analyzer = createCommandAnalyzer(options)
  return analyzer.analyze(command)
}

/**
 * 验证命令格式
 * @param {string} command 命令字符串
 * @returns {boolean} 是否有效
 */
export const isValidCommand = (command) => {
  const result = analyzeCommand(command)
  return result.isValid
}

/**
 * 获取命令建议
 * @param {string} partialCommand 部分命令
 * @returns {Array} 建议列表
 */
export const getCommandSuggestions = (partialCommand) => {
  // 实现命令自动补全和建议逻辑
  const analyzer = createCommandAnalyzer({ enableSuggestions: true })
  const result = analyzer.analyze(partialCommand)
  return result.suggestions
} 