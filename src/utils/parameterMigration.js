/**
 * 参数类型迁移工具
 * 将旧版本的required字段转换为新的type字段系统
 */

// 参数类型枚举
export const ParameterType = {
  REQUIRED: 'required',     // 必选参数
  OPTIONAL: 'optional'      // 可选参数  
}

/**
 * 迁移单个参数对象
 * @param {Object} param 参数对象
 * @returns {Object} 迁移后的参数对象
 */
export function migrateParameter(param) {
  if (!param) return param
  
  const migratedParam = { ...param }
  
  // 如果存在旧的required字段，转换为type字段
  if (param.required !== undefined && !param.type) {
    migratedParam.type = param.required ? ParameterType.REQUIRED : ParameterType.OPTIONAL
    delete migratedParam.required
  }
  
  // 确保有默认的type值
  if (!migratedParam.type) {
    migratedParam.type = ParameterType.OPTIONAL
  }
  
  return migratedParam
}

/**
 * 迁移选项对象
 * @param {Object} option 选项对象
 * @returns {Object} 迁移后的选项对象
 */
export function migrateOption(option) {
  if (!option) return option
  
  const migratedOption = { ...option }
  
  // 迁移选项本身的required字段
  if (option.required !== undefined && !option.type) {
    migratedOption.type = option.required ? ParameterType.REQUIRED : ParameterType.OPTIONAL
    delete migratedOption.required
  }
  
  // 确保有默认的type值
  if (!migratedOption.type) {
    migratedOption.type = ParameterType.OPTIONAL
  }
  
  // 迁移选项参数
  if (option.parameters && Array.isArray(option.parameters)) {
    migratedOption.parameters = option.parameters.map(migrateParameter)
  }
  
  // 移除旧的flag字段，确保使用shortName/longName
  if (option.flag && !option.shortName && !option.longName) {
    if (option.flag.startsWith('--')) {
      migratedOption.longName = option.flag
    } else {
      migratedOption.shortName = option.flag
    }
    delete migratedOption.flag
  }
  
  return migratedOption
}

/**
 * 迁移完整的命令对象
 * @param {Object} command 命令对象
 * @returns {Object} 迁移后的命令对象
 */
export function migrateCommand(command) {
  if (!command) return command
  
  const migratedCommand = { ...command }
  
  // 迁移命令级参数
  if (command.parameters && Array.isArray(command.parameters)) {
    migratedCommand.parameters = command.parameters.map(migrateParameter)
  }
  
  // 迁移选项
  if (command.options && Array.isArray(command.options)) {
    migratedCommand.options = command.options.map(migrateOption)
  }
  
  // 迁移常用参数
  if (command.commonParameters && Array.isArray(command.commonParameters)) {
    migratedCommand.commonParameters = command.commonParameters.map(migrateParameter)
  }
  
  return migratedCommand
}

/**
 * 批量迁移命令数组
 * @param {Array} commands 命令数组
 * @returns {Array} 迁移后的命令数组
 */
export function migrateCommands(commands) {
  if (!Array.isArray(commands)) return commands
  
  return commands.map(migrateCommand)
}

/**
 * 验证参数类型是否有效
 * @param {string} type 参数类型
 * @returns {boolean} 是否有效
 */
export function isValidParameterType(type) {
  return Object.values(ParameterType).includes(type)
}

/**
 * 获取参数类型的显示名称
 * @param {string} type 参数类型
 * @returns {string} 显示名称
 */
export function getParameterTypeLabel(type) {
  switch (type) {
    case ParameterType.REQUIRED:
      return '必选'
    case ParameterType.OPTIONAL:
      return '可选'
    case ParameterType.MUTEX:
      return '互斥'
    default:
      return '未知'
  }
} 