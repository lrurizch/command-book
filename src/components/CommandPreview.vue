<template>
  <div class="command-preview">
    <!-- 预览头部 -->
    <div class="preview-header">
      <div class="preview-title">
        <el-icon><View /></el-icon>
        <span>命令预览</span>
      </div>
      <div class="preview-actions">
        <el-button type="primary" size="small" @click="copyCommand" icon="DocumentCopy">
          复制命令
        </el-button>
        <el-button 
          type="success" 
          size="small" 
          @click="testCommand" 
          icon="VideoPlay"
          :loading="testing"
        >
          测试命令
        </el-button>
        <el-button 
          type="info" 
          size="small" 
          @click="analyzeCommand" 
          icon="Search"
          :loading="analyzing"
        >
          分析命令
        </el-button>
      </div>
    </div>

    <!-- 命令显示区域 -->
    <div class="command-display">
      <div class="terminal-window">
        <div class="terminal-header">
          <div class="terminal-controls">
            <span class="control red"></span>
            <span class="control yellow"></span>
            <span class="control green"></span>
          </div>
          <div class="terminal-title">Terminal</div>
        </div>
        
        <div class="terminal-body">
          <div class="command-line">
            <span class="prompt">{{ promptText }}</span>
            <span class="command-text">{{ displayCommand }}</span>
            <span v-if="showCursor" class="cursor">|</span>
          </div>
          
          <!-- 命令输出 -->
          <div v-if="commandOutput" class="command-output">
            <div class="output-line" v-for="(line, index) in outputLines" :key="index">
              {{ line }}
            </div>
          </div>
          
          <!-- 错误信息 -->
          <div v-if="commandError" class="command-error">
            <div class="error-line" v-for="(line, index) in errorLines" :key="index">
              {{ line }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 命令信息 -->
    <div class="command-info">
      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <div class="info-grid">
            <div class="info-item">
              <label>命令名称:</label>
              <span>{{ commandData.name }}</span>
            </div>
            <div class="info-item">
              <label>主命令:</label>
              <span>{{ commandData.mainCommand }}</span>
            </div>
            <div class="info-item">
              <label>分类:</label>
              <el-tag size="small">{{ commandData.category }}</el-tag>
            </div>
            <div class="info-item">
              <label>标签:</label>
              <div class="tags-container">
                <el-tag 
                  v-for="tag in commandData.tags" 
                  :key="tag" 
                  size="small" 
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <div class="description">
            <label>描述:</label>
            <p>{{ commandData.description || '暂无描述' }}</p>
          </div>
        </el-tab-pane>

        <!-- 参数分析 -->
        <el-tab-pane label="参数分析" name="parameters">
          <div class="parameters-analysis">
            <!-- 子命令 -->
            <div v-if="commandData.subcommands && commandData.subcommands.length > 0" class="param-section">
              <h4>子命令</h4>
              <div class="param-list">
                <div 
                  v-for="sub in commandData.subcommands" 
                  :key="sub.name"
                  class="param-item"
                >
                  <div class="param-name">{{ sub.name }}</div>
                  <div class="param-type">{{ getTypeLabel(sub.type) }}</div>
                  <div class="param-desc">{{ sub.description || '暂无描述' }}</div>
                </div>
              </div>
            </div>

            <!-- 选项 -->
            <div v-if="commandData.options && commandData.options.length > 0" class="param-section">
              <h4>选项</h4>
              <div class="param-list">
                <div 
                  v-for="option in commandData.options" 
                  :key="option.name"
                  class="param-item"
                >
                  <div class="param-name">
                    <span v-if="option.shortFlag">{{ option.shortFlag }}</span>
                    <span v-if="option.shortFlag && option.longFlag">, </span>
                    <span v-if="option.longFlag">{{ option.longFlag }}</span>
                  </div>
                  <div class="param-type">{{ getTypeLabel(option.type) }}</div>
                  <div class="param-desc">{{ option.description || '暂无描述' }}</div>
                </div>
              </div>
            </div>

            <!-- 位置参数 -->
            <div v-if="commandData.parameters && commandData.parameters.length > 0" class="param-section">
              <h4>位置参数</h4>
              <div class="param-list">
                <div 
                  v-for="param in commandData.parameters" 
                  :key="param.name"
                  class="param-item"
                >
                  <div class="param-name">{{ param.name }}</div>
                  <div class="param-type">{{ getTypeLabel(param.type) }}</div>
                  <div class="param-desc">{{ param.description || '暂无描述' }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 使用示例 -->
        <el-tab-pane label="使用示例" name="examples">
          <div class="examples-section">
            <div v-if="commandData.usage" class="usage-info">
              <h4>使用说明</h4>
              <pre>{{ commandData.usage }}</pre>
            </div>
            
            <div class="command-examples">
              <h4>命令示例</h4>
              <div 
                v-for="(example, index) in commandExamples" 
                :key="index"
                class="example-item"
              >
                <div class="example-command">
                  <code>{{ example.command }}</code>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="copyExample(example.command)"
                    icon="DocumentCopy"
                  >
                    复制
                  </el-button>
                </div>
                <div class="example-desc">{{ example.description }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 验证结果 -->
        <el-tab-pane label="验证结果" name="validation">
          <div class="validation-section">
            <div v-if="validationResult" class="validation-results">
              <div class="validation-status">
                <el-icon v-if="validationResult.isValid" class="success-icon"><SuccessFilled /></el-icon>
                <el-icon v-else class="error-icon"><CircleCloseFilled /></el-icon>
                <span :class="validationResult.isValid ? 'success-text' : 'error-text'">
                  {{ validationResult.isValid ? '验证通过' : '验证失败' }}
                </span>
              </div>

              <!-- 错误信息 -->
              <div v-if="validationResult.errors.length > 0" class="validation-errors">
                <h4>错误信息</h4>
                <el-alert
                  v-for="error in validationResult.errors"
                  :key="error"
                  :title="error"
                  type="error"
                  show-icon
                  :closable="false"
                />
              </div>

              <!-- 警告信息 -->
              <div v-if="validationResult.warnings.length > 0" class="validation-warnings">
                <h4>警告信息</h4>
                <el-alert
                  v-for="warning in validationResult.warnings"
                  :key="warning"
                  :title="warning"
                  type="warning"
                  show-icon
                  :closable="false"
                />
              </div>
            </div>
            
            <div v-else class="no-validation">
              <el-empty description="暂无验证结果" :image-size="60" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  View, 
  DocumentCopy, 
  VideoPlay, 
  Search, 
  SuccessFilled, 
  CircleCloseFilled 
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  command: {
    type: String,
    required: true
  },
  commandData: {
    type: Object,
    default: () => ({})
  },
  validationResult: {
    type: Object,
    default: null
  },
  promptText: {
    type: String,
    default: '$ '
  }
})

// Emits
const emit = defineEmits(['test-command', 'analyze-command'])

// 响应式数据
const testing = ref(false)
const analyzing = ref(false)
const commandOutput = ref('')
const commandError = ref('')
const activeTab = ref('basic')
const showCursor = ref(true)
const cursorInterval = ref(null)

// 计算属性
const displayCommand = computed(() => {
  return props.command || '# 请构建命令'
})

const outputLines = computed(() => {
  return commandOutput.value ? commandOutput.value.split('\n').filter(line => line.trim()) : []
})

const errorLines = computed(() => {
  return commandError.value ? commandError.value.split('\n').filter(line => line.trim()) : []
})

const commandExamples = computed(() => {
  const examples = []
  const baseCommand = props.commandData.mainCommand || ''
  
  if (baseCommand) {
    // 基本示例
    examples.push({
      command: `${baseCommand} --help`,
      description: '显示帮助信息'
    })
    
    // 基于子命令的示例
    if (props.commandData.subcommands) {
      props.commandData.subcommands.slice(0, 3).forEach(sub => {
        examples.push({
          command: `${baseCommand} ${sub.name}`,
          description: sub.description || `执行 ${sub.name} 子命令`
        })
      })
    }
    
    // 基于选项的示例
    if (props.commandData.options) {
      const firstOption = props.commandData.options[0]
      if (firstOption) {
        const flag = firstOption.longFlag || firstOption.shortFlag
        examples.push({
          command: `${baseCommand} ${flag}`,
          description: firstOption.description || `使用 ${flag} 选项`
        })
      }
    }
  }
  
  return examples
})

// 方法
const copyCommand = async () => {
  try {
    await navigator.clipboard.writeText(props.command)
    ElMessage.success('命令已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const copyExample = async (command) => {
  try {
    await navigator.clipboard.writeText(command)
    ElMessage.success('示例命令已复制')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const testCommand = async () => {
  if (!props.command || props.command.includes('# 请构建命令')) {
    ElMessage.warning('请先构建有效的命令')
    return
  }
  
  testing.value = true
  commandOutput.value = ''
  commandError.value = ''
  
  try {
    // 模拟命令测试
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 这里应该调用实际的命令测试API
    // 目前使用模拟数据
    commandOutput.value = `命令测试完成: ${props.command}\n语法检查: 通过\n参数验证: 通过\n测试时间: ${new Date().toLocaleTimeString()}`
    
    emit('test-command', {
      command: props.command,
      success: true,
      output: commandOutput.value
    })
    
    ElMessage.success('命令测试完成')
  } catch (error) {
    commandError.value = `测试失败: ${error.message}`
    ElMessage.error('命令测试失败')
  } finally {
    testing.value = false
  }
}

const analyzeCommand = async () => {
  if (!props.command || props.command.includes('# 请构建命令')) {
    ElMessage.warning('请先构建有效的命令')
    return
  }
  
  analyzing.value = true
  
  try {
    // 模拟命令分析
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const analysis = {
      complexity: '中等',
      riskLevel: '低',
      estimatedTime: '< 1秒',
      dependencies: ['系统内置'],
      recommendations: [
        '建议添加错误处理参数',
        '可以考虑使用更简洁的选项'
      ]
    }
    
    emit('analyze-command', {
      command: props.command,
      analysis
    })
    
    commandOutput.value = `命令分析结果:\n复杂度: ${analysis.complexity}\n风险等级: ${analysis.riskLevel}\n预估执行时间: ${analysis.estimatedTime}\n依赖: ${analysis.dependencies.join(', ')}`
    
    ElMessage.success('命令分析完成')
  } catch (error) {
    commandError.value = `分析失败: ${error.message}`
    ElMessage.error('命令分析失败')
  } finally {
    analyzing.value = false
  }
}

const getTypeLabel = (type) => {
  const typeMap = {
    'REQUIRED': '必选',
    'OPTIONAL': '可选',
    'DISABLED': '禁用',
    'required': '必选',
    'optional': '可选',
    'disabled': '禁用'
  }
  return typeMap[type] || type
}

const startCursorBlink = () => {
  cursorInterval.value = setInterval(() => {
    showCursor.value = !showCursor.value
  }, 1000)
}

const stopCursorBlink = () => {
  if (cursorInterval.value) {
    clearInterval(cursorInterval.value)
    cursorInterval.value = null
  }
}

// 生命周期
onMounted(() => {
  startCursorBlink()
})

onUnmounted(() => {
  stopCursorBlink()
})

// 监听器
watch(() => props.command, (newCommand) => {
  // 命令变化时清空输出
  commandOutput.value = ''
  commandError.value = ''
})
</script>

<style lang="scss" scoped>
.command-preview {
  display: flex;
  flex-direction: column;
  gap: var(--el-spacing-lg);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--el-spacing-md);
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-light);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: var(--el-spacing-sm);
  font-size: var(--el-font-size-large);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preview-actions {
  display: flex;
  gap: var(--el-spacing-sm);
}

.command-display {
  .terminal-window {
    background: var(--el-color-black);
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
    box-shadow: var(--el-box-shadow);
  }

  .terminal-header {
    display: flex;
    align-items: center;
    padding: var(--el-spacing-sm) var(--el-spacing-md);
    background: #2d2d2d;
    border-bottom: 1px solid #3d3d3d;
  }

  .terminal-controls {
    display: flex;
    gap: var(--el-spacing-xs);
    margin-right: var(--el-spacing-md);
    
    .control {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      
      &.red { background: #ff5f56; }
      &.yellow { background: #ffbd2e; }
      &.green { background: #27ca3f; }
    }
  }

  .terminal-title {
    color: #ffffff;
    font-size: var(--el-font-size-small);
    flex: 1;
    text-align: center;
  }

  .terminal-body {
    padding: var(--el-spacing-lg);
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: var(--el-font-size-base);
    line-height: 1.5;
    min-height: 120px;
  }

  .command-line {
    display: flex;
    align-items: center;
    margin-bottom: var(--el-spacing-sm);
    
    .prompt {
      color: var(--el-color-success);
      font-weight: bold;
      margin-right: var(--el-spacing-sm);
    }
    
    .command-text {
      color: var(--el-color-white);
      word-break: break-all;
      flex: 1;
    }
    
    .cursor {
      color: var(--el-color-white);
      font-weight: bold;
      animation: blink 1s infinite;
    }
  }

  .command-output {
    margin-top: var(--el-spacing-md);
    
    .output-line {
      color: var(--el-color-info-light-3);
      margin-bottom: var(--el-spacing-xs);
      white-space: pre-wrap;
    }
  }

  .command-error {
    margin-top: var(--el-spacing-md);
    
    .error-line {
      color: var(--el-color-danger-light-3);
      margin-bottom: var(--el-spacing-xs);
      white-space: pre-wrap;
    }
  }
}

.command-info {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--el-spacing-md);
    margin-bottom: var(--el-spacing-lg);
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
    
    label {
      font-weight: 600;
      color: var(--el-text-color-secondary);
      min-width: 80px;
    }
    
    span {
      color: var(--el-text-color-primary);
    }
  }

  .tags-container {
    display: flex;
    gap: var(--el-spacing-xs);
    flex-wrap: wrap;
  }

  .description {
    label {
      font-weight: 600;
      color: var(--el-text-color-secondary);
      display: block;
      margin-bottom: var(--el-spacing-sm);
    }
    
    p {
      margin: 0;
      color: var(--el-text-color-primary);
      line-height: 1.6;
    }
  }
}

.parameters-analysis {
  .param-section {
    margin-bottom: var(--el-spacing-xl);
    
    h4 {
      margin: 0 0 var(--el-spacing-md) 0;
      color: var(--el-text-color-primary);
      font-size: var(--el-font-size-medium);
      border-bottom: 1px solid var(--el-border-color-light);
      padding-bottom: var(--el-spacing-sm);
    }
  }

  .param-list {
    display: flex;
    flex-direction: column;
    gap: var(--el-spacing-sm);
  }

  .param-item {
    display: grid;
    grid-template-columns: 200px 80px 1fr;
    gap: var(--el-spacing-md);
    padding: var(--el-spacing-sm);
    background: var(--el-fill-color-extra-light);
    border-radius: var(--el-border-radius-base);
    align-items: center;
    
    .param-name {
      font-weight: 600;
      color: var(--el-text-color-primary);
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    
    .param-type {
      font-size: var(--el-font-size-small);
      color: var(--el-color-primary);
      font-weight: 600;
    }
    
    .param-desc {
      color: var(--el-text-color-secondary);
      font-size: var(--el-font-size-small);
    }
  }
}

.examples-section {
  .usage-info {
    margin-bottom: var(--el-spacing-xl);
    
    h4 {
      margin: 0 0 var(--el-spacing-md) 0;
      color: var(--el-text-color-primary);
    }
    
    pre {
      background: var(--el-fill-color-extra-light);
      padding: var(--el-spacing-md);
      border-radius: var(--el-border-radius-base);
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
  }

  .command-examples {
    h4 {
      margin: 0 0 var(--el-spacing-md) 0;
      color: var(--el-text-color-primary);
    }
  }

  .example-item {
    margin-bottom: var(--el-spacing-md);
    padding: var(--el-spacing-md);
    background: var(--el-fill-color-extra-light);
    border-radius: var(--el-border-radius-base);
    
    .example-command {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--el-spacing-sm);
      
      code {
        background: var(--el-color-black);
        color: var(--el-color-white);
        padding: var(--el-spacing-xs) var(--el-spacing-sm);
        border-radius: var(--el-border-radius-small);
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        flex: 1;
        margin-right: var(--el-spacing-sm);
      }
    }
    
    .example-desc {
      color: var(--el-text-color-secondary);
      font-size: var(--el-font-size-small);
    }
  }
}

.validation-section {
  .validation-status {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
    margin-bottom: var(--el-spacing-lg);
    font-size: var(--el-font-size-large);
    font-weight: 600;
    
    .success-icon {
      color: var(--el-color-success);
      font-size: var(--el-font-size-extra-large);
    }
    
    .error-icon {
      color: var(--el-color-danger);
      font-size: var(--el-font-size-extra-large);
    }
    
    .success-text {
      color: var(--el-color-success);
    }
    
    .error-text {
      color: var(--el-color-danger);
    }
  }

  .validation-errors,
  .validation-warnings {
    margin-bottom: var(--el-spacing-lg);
    
    h4 {
      margin: 0 0 var(--el-spacing-md) 0;
      color: var(--el-text-color-primary);
    }
    
    .el-alert {
      margin-bottom: var(--el-spacing-sm);
    }
  }

  .no-validation {
    text-align: center;
    padding: var(--el-spacing-xl);
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

// 响应式设计
@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    gap: var(--el-spacing-md);
  }

  .preview-actions {
    width: 100%;
    justify-content: center;
  }

  .param-item {
    grid-template-columns: 1fr;
    gap: var(--el-spacing-sm);
    
    .param-name {
      font-size: var(--el-font-size-small);
    }
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style> 