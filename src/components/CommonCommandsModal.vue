<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${command.name} - 常用完整命令`"
    width="70%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="common-commands-modal">
      <!-- 命令信息 -->
      <div class="command-info">
        <div class="command-template">
          <label>模板命令:</label>
          <code>{{ command.command }}</code>
        </div>
        <div v-if="command.description" class="command-description">
          <label>说明:</label>
          <span>{{ command.description }}</span>
        </div>
      </div>

      <!-- 常用完整命令列表 -->
      <div class="commands-section">
        <div class="section-header">
          <h3>常用完整命令</h3>
          <el-button 
            type="primary" 
            size="small" 
            @click="showAddForm = !showAddForm"
            :icon="showAddForm ? 'Minus' : 'Plus'"
          >
            {{ showAddForm ? '取消添加' : '添加新命令' }}
          </el-button>
        </div>

        <!-- 添加新命令表单 -->
        <div v-if="showAddForm" class="add-command-form">
          <el-form :model="newCommand" label-width="80px" size="small">
            <el-form-item label="名称">
              <el-input 
                v-model="newCommand.name" 
                placeholder="命令名称 (如: 提交代码)"
              />
            </el-form-item>
            <el-form-item label="命令">
              <el-input 
                v-model="newCommand.command" 
                type="textarea"
                :rows="2"
                placeholder="完整可执行命令"
              />
            </el-form-item>
            <el-form-item label="说明">
              <el-input 
                v-model="newCommand.description" 
                placeholder="命令说明 (可选)"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addNewCommand" size="small">
                添加命令
              </el-button>
              <el-button @click="cancelAdd" size="small">取消</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 命令列表 -->
        <div v-if="commonCommands.length > 0" class="commands-list">
          <div 
            v-for="(cmd, index) in sortedCommands" 
            :key="index"
            class="command-item"
            :class="{ 'is-default': cmd.isDefault, 'most-used': index === 0 }"
          >
            <div class="command-content">
              <div class="command-header">
                <div class="command-name">
                  <span class="name">{{ cmd.name || `命令 ${index + 1}` }}</span>
                  <div class="badges">
                    <el-tag v-if="cmd.isDefault" type="success" size="small">默认</el-tag>
                    <el-tag v-if="index === 0 && cmd.usageCount > 0" type="primary" size="small">
                      最常用 ({{ cmd.usageCount }}次)
                    </el-tag>
                  </div>
                </div>
                <div class="command-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="copyCommand(cmd)"
                    :icon="CopyDocument"
                  >
                    复制
                  </el-button>
                  <el-button 
                    v-if="!cmd.isDefault"
                    type="success" 
                    size="small" 
                    text
                    @click="setAsDefault(index)"
                  >
                    设为默认
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    text
                    @click="removeCommand(index)"
                    :icon="Delete"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              
              <div class="command-text">
                <code>{{ cmd.command }}</code>
              </div>
              
              <div v-if="cmd.description" class="command-desc">
                {{ cmd.description }}
              </div>
              
              <div class="command-meta">
                <span v-if="cmd.usageCount > 0">
                  使用次数: {{ cmd.usageCount }}
                </span>
                <span v-if="cmd.lastUsed">
                  最后使用: {{ formatDate(cmd.lastUsed) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="暂无常用完整命令">
            <el-button type="primary" @click="showAddForm = true">
              添加第一个常用命令
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button 
          v-if="hasDefaultCommand"
          type="primary" 
          @click="copyDefaultCommand"
        >
          复制默认命令
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import { useCommandStore } from '../stores/command'
import { toast } from '../utils/toast'

const commandStore = useCommandStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  command: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:show', 'commandCopied'])

const dialogVisible = ref(false)
const showAddForm = ref(false)
const newCommand = ref({
  name: '',
  command: '',
  description: ''
})

// 监听show属性变化
watch(() => props.show, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:show', false)
    showAddForm.value = false
    resetNewCommand()
  }
})

// 常用命令列表
const commonCommands = computed(() => {
  if (!props.command) return []
  return props.command.commonCommands || []
})

// 排序后的命令列表 (按使用次数和最后使用时间排序)
const sortedCommands = computed(() => {
  return [...commonCommands.value].sort((a, b) => {
    // 默认命令排在前面
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    
    // 按使用次数排序
    if (a.usageCount !== b.usageCount) {
      return (b.usageCount || 0) - (a.usageCount || 0)
    }
    
    // 按最后使用时间排序
    return new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0)
  })
})

// 是否有默认命令
const hasDefaultCommand = computed(() => {
  return commonCommands.value.some(cmd => cmd.isDefault)
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 复制命令
const copyCommand = async (cmd) => {
  try {
    await navigator.clipboard.writeText(cmd.command)
    
    // 更新使用统计
    commandStore.updateCommonCommandUsage(props.command.id, cmd.command)
    
    toast.success(`已复制: ${cmd.name || '命令'}`)
    emit('commandCopied', cmd.command)
  } catch (error) {
    toast.error('复制失败: ' + error.message)
  }
}

// 复制默认命令
const copyDefaultCommand = () => {
  const defaultCmd = commonCommands.value.find(cmd => cmd.isDefault)
  if (defaultCmd) {
    copyCommand(defaultCmd)
  }
}

// 设为默认命令
const setAsDefault = (index) => {
  const updatedCommands = [...commonCommands.value]
  // 取消所有默认状态
  updatedCommands.forEach(cmd => cmd.isDefault = false)
  // 设置新的默认命令
  updatedCommands[index].isDefault = true
  
  // 更新命令数据
  commandStore.updateCommand(props.command.id, {
    commonCommands: updatedCommands
  })
  
  toast.success('已设置为默认命令')
}

// 删除命令
const removeCommand = (index) => {
  const updatedCommands = [...commonCommands.value]
  updatedCommands.splice(index, 1)
  
  // 更新命令数据
  commandStore.updateCommand(props.command.id, {
    commonCommands: updatedCommands
  })
  
  toast.success('命令已删除')
}

// 添加新命令
const addNewCommand = () => {
  if (!newCommand.value.name || !newCommand.value.command) {
    toast.error('请填写命令名称和命令内容')
    return
  }

  const cmdToAdd = {
    name: newCommand.value.name,
    command: newCommand.value.command,
    description: newCommand.value.description,
    isDefault: commonCommands.value.length === 0, // 第一个命令自动设为默认
    usageCount: 0,
    lastUsed: null
  }

  // 如果是设为默认的新命令，取消其他命令的默认状态
  if (cmdToAdd.isDefault) {
    commonCommands.value.forEach(cmd => cmd.isDefault = false)
  }

  const updatedCommonCommands = [...commonCommands.value, cmdToAdd]
  
  // 更新命令数据
  commandStore.updateCommand(props.command.id, {
    commonCommands: updatedCommonCommands
  })
  
  toast.success('命令已添加')
  cancelAdd()
}

// 取消添加
const cancelAdd = () => {
  showAddForm.value = false
  resetNewCommand()
}

// 重置新命令表单
const resetNewCommand = () => {
  newCommand.value = {
    name: '',
    command: '',
    description: ''
  }
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.common-commands-modal {
  .command-info {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    
    .command-template, .command-description {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      label {
        font-weight: 500;
        color: var(--el-text-color-primary);
        white-space: nowrap;
      }
      
      code {
        background: var(--el-fill-color-light);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: monospace;
        color: var(--el-color-primary);
      }
    }
  }

  .commands-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h3 {
        margin: 0;
        color: var(--el-text-color-primary);
      }
    }

    .add-command-form {
      margin-bottom: 24px;
      padding: 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 8px;
      border: 1px dashed var(--el-border-color);
    }

    .commands-list {
      .command-item {
        margin-bottom: 16px;
        border: 1px solid var(--el-border-color);
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: var(--el-color-primary-light-5);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        &.is-default {
          border-color: var(--el-color-success);
          background: var(--el-color-success-light-9);
        }
        
        &.most-used:not(.is-default) {
          border-color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }

        .command-content {
          padding: 16px;

          .command-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;

            .command-name {
              flex: 1;
              
              .name {
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-right: 8px;
              }
              
              .badges {
                display: inline-block;
                
                .el-tag {
                  margin-right: 4px;
                }
              }
            }

            .command-actions {
              display: flex;
              gap: 8px;
            }
          }

          .command-text {
            margin-bottom: 8px;
            
            code {
              display: block;
              background: var(--el-fill-color-light);
              padding: 8px 12px;
              border-radius: 4px;
              font-family: monospace;
              color: var(--el-text-color-primary);
              border: 1px solid var(--el-border-color-lighter);
              word-break: break-all;
            }
          }

          .command-desc {
            margin-bottom: 8px;
            color: var(--el-text-color-regular);
            font-size: 14px;
          }

          .command-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
            
            span {
              &:empty {
                display: none;
              }
            }
          }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 