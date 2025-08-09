<template>
  <el-dialog
    v-model="visible"
    title="管理复制命令"
    width="600px"
    :before-close="handleClose"
  >
    <div class="copy-command-manager">
      <!-- 当前命令信息 -->
      <div class="command-info">
        <h4>{{ command?.name }}</h4>
        <code class="command-template">{{ command?.command }}</code>
      </div>

      <!-- 自动更新设置 -->
      <div class="auto-update-section">
        <el-switch
          v-model="autoUpdate"
          @change="handleAutoUpdateChange"
          active-text="自动更新为最近使用的命令"
          inactive-text="手动选择默认复制命令"
        />
        <p class="help-text">
          开启后，每次构建新命令时会自动设置为默认复制命令
        </p>
      </div>

      <!-- 当前默认复制命令 -->
      <div class="current-default">
        <h5>当前默认复制命令：</h5>
        <div class="current-command">
          <code>{{ currentDefaultCommand }}</code>
          <el-button 
            type="primary" 
            size="small" 
            @click="copyToClipboard(currentDefaultCommand)"
            :icon="CopyDocument"
          >
            复制
          </el-button>
        </div>
      </div>

      <!-- 常用完整命令列表 -->
      <div class="frequent-commands">
        <div class="section-header">
          <h5>常用完整命令</h5>
          <el-button 
            type="primary" 
            size="small" 
            @click="showAddCommand = true"
            :icon="Plus"
          >
            添加命令
          </el-button>
        </div>

        <!-- 命令列表 -->
        <div class="command-list">
          <div 
            v-for="(cmd, index) in frequentCommands" 
            :key="index"
            class="command-item"
            :class="{ 'is-default': cmd === currentDefaultCommand }"
          >
            <div class="command-content">
              <code>{{ cmd }}</code>
            </div>
            <div class="command-actions">
              <el-button 
                size="small" 
                @click="copyToClipboard(cmd)"
                :icon="CopyDocument"
              >
                复制
              </el-button>
              <el-button 
                size="small" 
                type="primary"
                @click="setAsDefault(cmd)"
                :disabled="cmd === currentDefaultCommand"
              >
                设为默认
              </el-button>
              <el-button 
                size="small" 
                type="danger"
                @click="removeCommand(index)"
                :icon="Delete"
              />
            </div>
          </div>
          
          <div v-if="frequentCommands.length === 0" class="empty-state">
            <p>暂无常用命令</p>
            <p class="help-text">添加您经常使用的完整命令，方便快速复制</p>
          </div>
        </div>
      </div>

      <!-- 添加新命令 -->
      <div v-if="showAddCommand" class="add-command-section">
        <el-input
          v-model="newCommand"
          type="textarea"
          :rows="3"
          placeholder="输入完整命令..."
          class="command-input"
        />
        <div class="add-actions">
          <el-button @click="cancelAdd">取消</el-button>
          <el-button type="primary" @click="addCommand" :disabled="!newCommand.trim()">
            添加
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommandStore } from '../stores/command'
import { 
  CopyDocument, 
  Delete, 
  Plus 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  command: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Store
const commandStore = useCommandStore()

// Reactive data
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const autoUpdate = ref(true)
const showAddCommand = ref(false)
const newCommand = ref('')

// 常用命令列表
const frequentCommands = computed(() => {
  if (!props.command?.id) return []
  return commandStore.getFrequentCommands(props.command.id)
})

// 当前默认复制命令
const currentDefaultCommand = computed(() => {
  if (!props.command?.id) return ''
  
  const defaultCmd = commandStore.getDefaultCopyCommand(props.command.id)
  if (defaultCmd) return defaultCmd
  
  // 如果没有设置，返回最近的构建命令或模板命令
  const buildHistory = commandStore.buildHistory || []
  const recentBuild = buildHistory
    .filter(item => item.templateId === props.command.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
  
  return recentBuild?.finalCommand || props.command?.command || '暂无命令'
})

// 初始化设置
watch(() => props.command?.id, (commandId) => {
  if (commandId) {
    autoUpdate.value = commandStore.autoUpdateCopyCommand[commandId] !== false
  }
}, { immediate: true })

// 方法
const handleAutoUpdateChange = (value) => {
  if (props.command?.id) {
    commandStore.setAutoUpdateCopyCommand(props.command.id, value)
  }
}

const setAsDefault = (cmd) => {
  if (props.command?.id) {
    commandStore.setDefaultCopyCommand(props.command.id, cmd)
    ElMessage.success('已设置为默认复制命令')
  }
}

const addCommand = () => {
  if (props.command?.id && newCommand.value.trim()) {
    commandStore.addFrequentCommand(props.command.id, newCommand.value.trim())
    newCommand.value = ''
    showAddCommand.value = false
    ElMessage.success('命令已添加')
  }
}

const removeCommand = (index) => {
  if (props.command?.id) {
    const commands = [...frequentCommands.value]
    commands.splice(index, 1)
    // 这里需要更新store中的数据
    commandStore.frequentCommands[props.command.id] = commands
    commandStore.saveToStorage()
    ElMessage.success('命令已删除')
  }
}

const cancelAdd = () => {
  newCommand.value = ''
  showAddCommand.value = false
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleClose = () => {
  visible.value = false
  showAddCommand.value = false
  newCommand.value = ''
}
</script>

<style scoped>
.copy-command-manager {
  padding: 0;
}

.command-info {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.command-info h4 {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.command-template {
  display: block;
  padding: 8px 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.auto-update-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.help-text {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.current-default {
  margin-bottom: 24px;
}

.current-default h5 {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.current-command {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.current-command code {
  flex: 1;
  padding: 6px 10px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.frequent-commands h5 {
  margin: 0 0 16px 0;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h5 {
  margin: 0;
}

.command-list {
  max-height: 300px;
  overflow-y: auto;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.command-item:hover {
  border-color: var(--el-color-primary);
}

.command-item.is-default {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.command-content {
  flex: 1;
  min-width: 0;
}

.command-content code {
  display: block;
  padding: 6px 10px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.empty-state p {
  margin: 0 0 8px 0;
}

.add-command-section {
  margin-top: 16px;
  padding: 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.command-input {
  margin-bottom: 12px;
}

.add-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 