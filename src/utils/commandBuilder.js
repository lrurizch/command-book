/**
 * 命令模板构建器 - 主要系统
 * 只包含必要的字段：名称、子命令、选项、参数、符号、分类、标签、常用完整命令
 */

// 参数类型定义
export const ParameterType = {
  REQUIRED: 'REQUIRED',
  OPTIONAL: 'OPTIONAL', 
  DISABLED: 'DISABLED'
}

export const DataType = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  FLOAT: 'float',
  BOOLEAN: 'boolean',
  FILE: 'file',
  DIRECTORY: 'directory',
  URL: 'url',
  EMAIL: 'email',
  ENUM: 'enum',
  REGEX: 'regex',
  JSON: 'json',
  ARRAY: 'array'
}

// 符号分类定义
export const SymbolCategory = {
  PIPE: 'pipe',           // 管道符号
  REDIRECT: 'redirect',   // 重定向符号
  LOGIC: 'logic',         // 逻辑操作符
  BACKGROUND: 'background', // 后台运行
  GROUPING: 'grouping',   // 分组符号
  WILDCARD: 'wildcard'    // 通配符
}

// 预定义符号库
export const PredefinedSymbols = {
  [SymbolCategory.PIPE]: [
    { symbol: '|', name: '管道', description: '将前一个命令的输出作为后一个命令的输入' },
    { symbol: '|&', name: '错误管道', description: '同时传递标准输出和标准错误' }
  ],
  [SymbolCategory.REDIRECT]: [
    { symbol: '>', name: '输出重定向', description: '将输出重定向到文件（覆盖）' },
    { symbol: '>>', name: '追加重定向', description: '将输出追加到文件末尾' },
    { symbol: '<', name: '输入重定向', description: '从文件读取输入' },
    { symbol: '2>', name: '错误重定向', description: '将错误输出重定向到文件' },
    { symbol: '&>', name: '全部重定向', description: '将所有输出重定向到文件' }
  ],
  [SymbolCategory.LOGIC]: [
    { symbol: '&&', name: '逻辑与', description: '前一个命令成功后执行后一个命令' },
    { symbol: '||', name: '逻辑或', description: '前一个命令失败后执行后一个命令' },
    { symbol: ';', name: '顺序执行', description: '依次执行命令，不管前一个是否成功' }
  ],
  [SymbolCategory.BACKGROUND]: [
    { symbol: '&', name: '后台运行', description: '在后台运行命令' },
    { symbol: 'nohup', name: '忽略挂起', description: '忽略挂起信号，命令持续运行' }
  ],
  [SymbolCategory.GROUPING]: [
    { symbol: '()', name: '子shell', description: '在子shell中执行命令组' },
    { symbol: '{}', name: '命令组', description: '在当前shell中执行命令组' }
  ],
  [SymbolCategory.WILDCARD]: [
    { symbol: '*', name: '任意字符', description: '匹配任意数量的字符' },
    { symbol: '?', name: '单个字符', description: '匹配单个字符' },
    { symbol: '[]', name: '字符集', description: '匹配方括号内的任意字符' },
    { symbol: '{}', name: '花括号展开', description: '展开花括号内的模式' }
  ]
}

/**
 * 命令模板结构
 */
export class CommandTemplate {
  constructor(config = {}) {
    // 基本信息
    this.name = config.name || ''
    this.category = config.category || ''
    this.tags = config.tags || []
    
    // 命令组件（全部可选）
    this.subcommands = config.subcommands || []
    this.options = config.options || []
    this.parameters = config.parameters || []
    this.symbols = config.symbols || []
    
    // 常用完整命令
    this.commonCommands = config.commonCommands || []
  }

  // 添加子命令
  addSubcommand(subcommand) {
    this.subcommands.push({
      name: subcommand.name || '',
      description: subcommand.description || '',
      type: subcommand.type || ParameterType.OPTIONAL
    })
    return this
  }

  // 添加选项
  addOption(option) {
    this.options.push({
      name: option.name || '',
      shortFlag: option.shortFlag || '',
      longFlag: option.longFlag || '',
      description: option.description || '',
      type: option.type || ParameterType.OPTIONAL,
      hasParameter: option.hasParameter || false,
      parameterType: option.parameterType || DataType.STRING
    })
    return this
  }

  // 添加参数
  addParameter(parameter) {
    this.parameters.push({
      name: parameter.name || '',
      description: parameter.description || '',
      type: parameter.type || ParameterType.OPTIONAL,
      dataType: parameter.dataType || DataType.STRING,
      placeholder: parameter.placeholder || ''
    })
    return this
  }

  // 添加符号
  addSymbol(symbol) {
    this.symbols.push({
      symbol: symbol.symbol || '',
      name: symbol.name || '',
      description: symbol.description || '',
      category: symbol.category || SymbolCategory.PIPE
    })
    return this
  }

  // 添加常用命令
  addCommonCommand(command) {
    this.commonCommands.push({
      name: command.name || '',
      command: command.command || '',
      description: command.description || '',
      frequency: command.frequency || 0
    })
    return this
  }

  // 导出为配置对象
  toConfig() {
    return {
      name: this.name,
      category: this.category,
      tags: this.tags,
      subcommands: this.subcommands,
      options: this.options,
      parameters: this.parameters,
      symbols: this.symbols,
      commonCommands: this.commonCommands
    }
  }
}

/**
 * 命令构建器
 */
export class CommandBuilder {
  constructor(template) {
    this.template = template || new CommandTemplate()
    this.selectedSubcommands = []
    this.selectedOptions = new Map() // option -> value
    this.parameterValues = new Map() // parameter -> value
    this.selectedSymbols = []
  }

  // 选择子命令
  selectSubcommand(name) {
    if (!this.selectedSubcommands.includes(name)) {
      this.selectedSubcommands.push(name)
    }
    return this
  }

  // 取消选择子命令
  deselectSubcommand(name) {
    const index = this.selectedSubcommands.indexOf(name)
    if (index > -1) {
      this.selectedSubcommands.splice(index, 1)
    }
    return this
  }

  // 设置选项
  setOption(name, value = null) {
    this.selectedOptions.set(name, value)
    return this
  }

  // 设置参数
  setParameter(name, value) {
    this.parameterValues.set(name, value)
    return this
  }

  // 添加符号
  addSymbol(symbol) {
    this.selectedSymbols.push(symbol)
    return this
  }

  // 构建命令
  build() {
    let command = this.template.name

    // 添加子命令
    if (this.selectedSubcommands.length > 0) {
      command += ' ' + this.selectedSubcommands.join(' ')
    }

    // 添加选项
    const optionParts = []
    this.selectedOptions.forEach((value, name) => {
      const option = this.template.options.find(opt => opt.name === name)
      if (option) {
        let optionStr = option.shortFlag || option.longFlag
        if (value && option.hasParameter) {
          optionStr += ` ${value}`
        }
        optionParts.push(optionStr)
      }
    })
    if (optionParts.length > 0) {
      command += ' ' + optionParts.join(' ')
    }

    // 添加参数
    const parameterParts = []
    this.parameterValues.forEach((value, name) => {
      if (value) {
        parameterParts.push(value)
      }
    })
    if (parameterParts.length > 0) {
      command += ' ' + parameterParts.join(' ')
    }

    // 添加符号（如管道、重定向等）
    if (this.selectedSymbols.length > 0) {
      command += ' ' + this.selectedSymbols.join(' ')
    }

    return command.trim()
  }

  // 重置构建器
  reset() {
    this.selectedSubcommands = []
    this.selectedOptions.clear()
    this.parameterValues.clear()
    this.selectedSymbols = []
    return this
  }

  // 获取验证结果
  validate() {
    const errors = []
    const warnings = []

    // 检查必需的子命令
    const requiredSubcommands = this.template.subcommands.filter(
      sub => sub.type === ParameterType.REQUIRED
    )
    for (const required of requiredSubcommands) {
      if (!this.selectedSubcommands.includes(required.name)) {
        errors.push(`缺少必需的子命令: ${required.name}`)
      }
    }

    // 检查必需的参数
    const requiredParameters = this.template.parameters.filter(
      param => param.type === ParameterType.REQUIRED
    )
    for (const required of requiredParameters) {
      if (!this.parameterValues.has(required.name) || !this.parameterValues.get(required.name)) {
        errors.push(`缺少必需的参数: ${required.name}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * 模板工厂
 */
export class TemplateFactory {
  // 创建Git模板
  static createGitTemplate() {
    return new CommandTemplate({
      name: 'git',
      category: 'version-control',
      tags: ['git', '版本控制', 'vcs']
    })
    .addSubcommand({ name: 'add', description: '添加文件到暂存区' })
    .addSubcommand({ name: 'commit', description: '提交更改' })
    .addSubcommand({ name: 'push', description: '推送到远程仓库' })
    .addSubcommand({ name: 'pull', description: '拉取远程更改' })
    .addOption({ name: 'message', shortFlag: '-m', description: '提交信息', hasParameter: true })
    .addOption({ name: 'all', shortFlag: '-a', description: '添加所有文件' })
    .addParameter({ name: 'file', description: '文件路径', dataType: DataType.FILE })
    .addSymbol({ symbol: '&&', name: '逻辑与', category: SymbolCategory.LOGIC })
    .addCommonCommand({ 
      name: '快速提交', 
      command: 'git add . && git commit -m "update" && git push',
      description: '添加、提交并推送所有更改'
    })
  }

  // 创建Docker模板
  static createDockerTemplate() {
    return new CommandTemplate({
      name: 'docker',
      category: 'container',
      tags: ['docker', '容器', 'container']
    })
    .addSubcommand({ name: 'run', description: '运行容器' })
    .addSubcommand({ name: 'build', description: '构建镜像' })
    .addSubcommand({ name: 'ps', description: '列出容器' })
    .addOption({ name: 'detach', shortFlag: '-d', description: '后台运行' })
    .addOption({ name: 'port', shortFlag: '-p', description: '端口映射', hasParameter: true })
    .addParameter({ name: 'image', description: '镜像名称', dataType: DataType.STRING })
    .addSymbol({ symbol: '|', name: '管道', category: SymbolCategory.PIPE })
    .addCommonCommand({
      name: '运行Nginx',
      command: 'docker run -d -p 80:80 nginx',
      description: '后台运行Nginx容器'
    })
  }

  // 创建文件操作模板
  static createFileTemplate() {
    return new CommandTemplate({
      name: 'ls',
      category: 'filesystem',
      tags: ['文件', '目录', 'file']
    })
    .addOption({ name: 'long', shortFlag: '-l', description: '详细列表' })
    .addOption({ name: 'all', shortFlag: '-a', description: '显示隐藏文件' })
    .addParameter({ name: 'path', description: '目录路径', dataType: DataType.DIRECTORY })
    .addSymbol({ symbol: '>', name: '输出重定向', category: SymbolCategory.REDIRECT })
    .addCommonCommand({
      name: '详细列表',
      command: 'ls -la',
      description: '显示所有文件的详细信息'
    })
  }
}

export default {
  CommandTemplate,
  CommandBuilder,
  TemplateFactory,
  SymbolCategory,
  PredefinedSymbols
} 