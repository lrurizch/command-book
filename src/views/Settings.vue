<template>
  <div class="settings-page">
    <!-- 顶部导航 -->
    <div class="settings-header">
      <div class="header-left">
        <button class="btn btn-secondary" @click="goBack">
          ← 返回
        </button>
        <h1 class="page-title">设置</h1>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <div class="settings-container">
        <!-- 快捷键设置 -->
        <div class="settings-section card">
          <div class="card-header">
            <h3>快捷键设置</h3>
            <button
              class="btn btn-sm btn-secondary"
              @click="toggleShortcuts"
            >
              {{ keyboardStore.isEnabled ? '禁用' : '启用' }}快捷键
            </button>
          </div>
          <div class="card-body">
            <div class="shortcut-help">
              <div
                v-for="(category, categoryName) in keyboardStore.getShortcutHelp()"
                :key="categoryName"
                class="shortcut-category"
              >
                <h4 class="category-title">{{ categoryName }}</h4>
                <div class="shortcut-list">
                  <div
                    v-for="(description, shortcut) in category"
                    :key="shortcut"
                    class="shortcut-item"
                  >
                    <kbd class="shortcut-key">{{ shortcut }}</kbd>
                    <span class="shortcut-desc">{{ description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div class="settings-section card">
          <div class="card-header">
            <h3>数据管理</h3>
          </div>
          <div class="card-body">
            <div class="data-stats">
              <div class="stat-item">
                <div class="stat-value">{{ commandStore.commands.length }}</div>
                <div class="stat-label">命令总数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ workflowStore.workflows.length }}</div>
                <div class="stat-label">工作流总数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ commandStore.categories.length }}</div>
                <div class="stat-label">分类数量</div>
              </div>
            </div>
            
            <div class="data-actions">
              <button class="btn btn-primary" @click="exportData">
                📤 导出数据
              </button>
              <button class="btn btn-secondary" @click="importData">
                📥 导入数据
              </button>
              <button class="btn btn-warning" @click="clearStats">
                🧹 清除统计
              </button>
              <button class="btn btn-info" @click="resetCommandData">
                🔄 重置命令数据
              </button>
              <button class="btn btn-warning" @click="clearExampleData">
                🧹 清除示例数据
              </button>
              <button class="btn btn-danger" @click="clearAllData">
                🗑️ 清除所有数据
              </button>
            </div>
          </div>
        </div>

        <!-- 边框样式设置 -->
        <div class="settings-section card">
          <div class="card-header">
            <h3>边框样式设置</h3>
            <button class="btn btn-sm btn-warning" @click="resetBorders">
              重置默认
            </button>
          </div>
          <div class="card-body">
            <div class="border-settings">
              <div class="setting-item">
                <label>命令卡片边框</label>
                <div class="setting-controls">
                  <div class="control-group">
                    <span>圆角</span>
                    <input
                      v-model="borderSettings.commandCard.radius"
                      type="range"
                      min="0"
                      max="20"
                      @change="updateBorderSettings"
                    >
                    <span class="value">{{ borderSettings.commandCard.radius }}px</span>
                  </div>
                  <div class="control-group">
                    <span>边框宽度</span>
                    <input
                      v-model="borderSettings.commandCard.width"
                      type="range"
                      min="0"
                      max="5"
                      @change="updateBorderSettings"
                    >
                    <span class="value">{{ borderSettings.commandCard.width }}px</span>
                  </div>
                  <div class="control-group">
                    <span>边框颜色</span>
                    <input
                      v-model="borderSettings.commandCard.color"
                      type="color"
                      @change="updateBorderSettings"
                    >
                  </div>
                </div>
              </div>

              <div class="setting-item">
                <label>分类项边框</label>
                <div class="setting-controls">
                  <div class="control-group">
                    <span>圆角</span>
                    <input
                      v-model="borderSettings.categoryItem.radius"
                      type="range"
                      min="0"
                      max="20"
                      @change="updateBorderSettings"
                    >
                    <span class="value">{{ borderSettings.categoryItem.radius }}px</span>
                  </div>
                  <div class="control-group">
                    <span>边框宽度</span>
                    <input
                      v-model="borderSettings.categoryItem.width"
                      type="range"
                      min="0"
                      max="5"
                      @change="updateBorderSettings"
                    >
                    <span class="value">{{ borderSettings.categoryItem.width }}px</span>
                  </div>
                  <div class="control-group">
                    <span>边框颜色</span>
                    <input
                      v-model="borderSettings.categoryItem.color"
                      type="color"
                      @change="updateBorderSettings"
                    >
                  </div>
                </div>
              </div>

              <div class="setting-item">
                <label>按钮边框</label>
                <div class="setting-controls">
                  <div class="control-group">
                    <span>圆角</span>
                    <input
                      v-model="borderSettings.button.radius"
                      type="range"
                      min="0"
                      max="20"
                      @change="updateBorderSettings"
                    >
                    <span class="value">{{ borderSettings.button.radius }}px</span>
                  </div>
                  <div class="control-group">
                    <span>边框宽度</span>
                    <input
                      v-model="borderSettings.button.width"
                      type="range"
                      min="0"
                      max="5"
                      @change="updateBorderSettings"
                    >
                    <span class="value">{{ borderSettings.button.width }}px</span>
                  </div>
                  <div class="control-group">
                    <span>边框颜色</span>
                    <input
                      v-model="borderSettings.button.color"
                      type="color"
                      @change="updateBorderSettings"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分类管理 -->
        <div class="settings-section card">
          <div class="card-header">
            <h3>分类管理</h3>
            <button class="btn btn-sm btn-primary" @click="addCategory">
              + 新建分类
            </button>
          </div>
          <div class="card-body">
            <div class="categories-list">
              <div
                v-for="category in commandStore.categories"
                :key="category.id"
                class="category-item"
              >
                <div class="category-info">
                  <div
                    class="category-color"
                    :style="{ backgroundColor: category.color }"
                  ></div>
                  <input
                    v-model="category.name"
                    type="text"
                    class="category-name input"
                    @blur="updateCategory(category)"
                  >
                  <input
                    v-model="category.color"
                    type="color"
                    class="category-color-picker"
                    @change="updateCategory(category)"
                  >
                </div>
                <div class="category-actions">
                  <span class="command-count">
                    {{ getCommandCountByCategory(category.id) }} 个命令
                  </span>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="deleteCategory(category)"
                    :disabled="getCommandCountByCategory(category.id) > 0"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 执行历史 -->
        <div class="settings-section card">
          <div class="card-header">
            <h3>执行历史</h3>
            <button
              class="btn btn-sm btn-warning"
              @click="clearExecutionHistory"
            >
              清除历史
            </button>
          </div>
          <div class="card-body">
            <div v-if="workflowStore.executionHistory.length === 0" class="empty-history">
              <div class="empty-icon">📋</div>
              <div class="empty-text">暂无执行历史</div>
            </div>
            <div v-else class="execution-history">
              <div
                v-for="execution in workflowStore.executionHistory.slice(0, 10)"
                :key="execution.id"
                class="execution-item"
              >
                <div class="execution-info">
                  <div class="execution-name">{{ execution.workflowName }}</div>
                  <div class="execution-time">{{ formatDate(execution.startTime) }}</div>
                </div>
                <div class="execution-status">
                  <span
                    :class="['status-badge', `status-${execution.status}`]"
                  >
                    {{ getStatusText(execution.status) }}
                  </span>
                  <span v-if="execution.duration" class="execution-duration">
                    {{ formatDuration(execution.duration) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="settings-section card">
          <div class="card-header">
            <h3>关于</h3>
          </div>
          <div class="card-body">
            <div class="about-info">
              <div class="app-info">
                <h4>命令手册 v1.0.0</h4>
                <p>智能命令管理工具，支持命令管理、搜索、执行和工作流。</p>
              </div>
              
              <div class="features-list">
                <h5>主要功能:</h5>
                <ul>
                  <li>✅ 一键复制命令</li>
                  <li>✅ 命令分类管理</li>
                  <li>✅ 智能搜索过滤</li>
                  <li>✅ 自定义参数支持</li>
                  <li>✅ 全键盘操作</li>
                  <li>✅ 命令工作流</li>
                  <li>✅ 终端命令执行</li>
                  <li>✅ 使用统计分析</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认对话框 -->
    <ConfirmModal
      v-if="showConfirmModal"
      :title="confirmModal.title"
      :message="confirmModal.message"
      @confirm="confirmModal.onConfirm"
      @cancel="showConfirmModal = false"
    />

    <!-- 分类编辑模态框 -->
    <CategoryModal
      v-if="showCategoryModal"
      :category="editingCategory"
      @confirm="onCategoryConfirm"
      @cancel="showCategoryModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommandStore } from '../stores/command'
import { useWorkflowStore } from '../stores/workflow'
import { useKeyboardStore } from '../stores/keyboard'
import ConfirmModal from '../components/ConfirmModal.vue'
import CategoryModal from '../components/CategoryModal.vue'
import { loadBorderSettings, applyBorderSettings, saveBorderSettings, resetBorderSettings } from '../utils/theme'

const router = useRouter()
const commandStore = useCommandStore()
const workflowStore = useWorkflowStore()
const keyboardStore = useKeyboardStore()

// 响应式数据
const showConfirmModal = ref(false)
const showCategoryModal = ref(false)
const editingCategory = ref(null)
const confirmModal = ref({
  title: '',
  message: '',
  onConfirm: () => {}
})

// 边框设置状态
const borderSettings = ref(loadBorderSettings())

// 更新边框设置
const updateBorderSettings = () => {
  applyBorderSettings(borderSettings.value)
  saveBorderSettings(borderSettings.value)
}

// 重置边框设置
const resetBorders = () => {
  borderSettings.value = resetBorderSettings()
}

// 初始化边框设置
onMounted(() => {
  applyBorderSettings(borderSettings.value)
})

// 计算属性
const getCommandCountByCategory = (categoryId) => {
  return commandStore.commands.filter(cmd => cmd.category === categoryId).length
}

// 方法
const goBack = () => {
  router.push('/')
}

const toggleShortcuts = () => {
  keyboardStore.toggleShortcuts()
  const status = keyboardStore.isEnabled ? '启用' : '禁用'
  if (window.utoolsSystem) {
    window.utoolsSystem.showNotification(`快捷键已${status}`)
  }
}

const exportData = () => {
  const data = {
    commands: commandStore.exportCommands(),
    workflows: workflowStore.workflows,
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `command-handbook-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  if (window.utoolsSystem) {
    window.utoolsSystem.showNotification('数据导出完成')
  }
}

const importData = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        let importedCommands = 0
        let importedWorkflows = 0
        
        // 导入命令 - 支持多种格式
        if (data.commands) {
          const result = commandStore.importCommands(data.commands)
          if (result && result.success) {
            importedCommands = result.count
          }
        } else if (Array.isArray(data)) {
          // 直接是命令数组
          const result = commandStore.importCommands(data)
          if (result && result.success) {
            importedCommands = result.count
          }
        }
        
        // 导入工作流
        if (data.workflows && Array.isArray(data.workflows)) {
          data.workflows.forEach(workflow => {
            workflowStore.importWorkflow(workflow)
            importedWorkflows++
          })
        }
        
        // 显示导入结果
        let message = '数据导入完成'
        if (importedCommands > 0 || importedWorkflows > 0) {
          const parts = []
          if (importedCommands > 0) parts.push(`${importedCommands}个命令`)
          if (importedWorkflows > 0) parts.push(`${importedWorkflows}个工作流`)
          message = `成功导入 ${parts.join('、')}`
        }
        
        if (window.utoolsSystem) {
          window.utoolsSystem.showNotification(message)
        } else {
          alert(message)
        }
      } catch (error) {
        console.error('导入失败:', error)
        if (window.utoolsSystem) {
          window.utoolsSystem.showNotification('数据导入失败，请检查文件格式')
        }
      }
    }
    
    reader.readAsText(file)
  }
  
  input.click()
}

const clearStats = () => {
  confirmModal.value = {
    title: '清除统计数据',
    message: '确定要清除所有使用统计数据吗？此操作不可撤销。',
    onConfirm: () => {
      commandStore.resetCommandStats()
      showConfirmModal.value = false
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification('统计数据已清除')
      }
    }
  }
  showConfirmModal.value = true
}

const resetCommandData = () => {
  confirmModal.value = {
    title: '重置命令数据',
    message: '这将重置所有命令和分类为最新的默认状态，并会添加新的命令。你的个人统计和使用历史会被保留。确定继续吗？',
    onConfirm: () => {
      commandStore.resetToDefaultData()
      showConfirmModal.value = false
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification('命令数据已重置为最新版本')
      }
    }
  }
  showConfirmModal.value = true
}

const clearExampleData = () => {
  confirmModal.value = {
    title: '清除示例数据',
    message: '这将把所有示例命令移动到回收站，并移除示例分类。只保留你创建的内容。确定继续吗？',
    onConfirm: () => {
      const now = new Date().toISOString()
      let movedCommandCount = 0
      let removedCategoryCount = 0
      
      // 将所有示例命令移动到回收站
      commandStore.commands.forEach(cmd => {
        if (!cmd.isUserCreated && cmd.category !== 'recycle-bin') {
          cmd.category = 'recycle-bin'
          cmd.deletedAt = now
          movedCommandCount++
        }
      })
      
      // 移除所有示例分类（除了系统分类）
      const beforeCategoryCount = commandStore.categories.length
      commandStore.categories = commandStore.categories.filter(cat => 
        cat.id === 'all' || cat.id === 'recycle-bin' || cat.isUserCreated
      )
      removedCategoryCount = beforeCategoryCount - commandStore.categories.length
      
      commandStore.saveToStorage()
      showConfirmModal.value = false
      
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification(`已将 ${movedCommandCount} 个示例命令移至回收站，移除 ${removedCategoryCount} 个示例分类`)
      }
    }
  }
  showConfirmModal.value = true
}

const clearAllData = () => {
  confirmModal.value = {
    title: '清除所有数据',
    message: '确定要清除所有命令、工作流和设置数据吗？此操作不可撤销！',
    onConfirm: () => {
      // 清除所有数据
      commandStore.commands = []
      commandStore.searchHistory = []
      commandStore.commandStats = {}
      workflowStore.workflows = []
      workflowStore.executionHistory = []
      
      // 重新初始化默认数据
      commandStore.loadCommands()
      
      showConfirmModal.value = false
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification('所有数据已清除')
      }
    }
  }
  showConfirmModal.value = true
}

const addCategory = () => {
  editingCategory.value = null
  showCategoryModal.value = true
}

const updateCategory = (category) => {
  commandStore.updateCategory(category.id, {
    name: category.name,
    color: category.color
  })
}

const deleteCategory = (category) => {
  confirmModal.value = {
    title: '删除分类',
    message: `确定要删除分类 "${category.name}" 吗？`,
    onConfirm: () => {
      commandStore.deleteCategory(category.id)
      showConfirmModal.value = false
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification(`分类 "${category.name}" 已删除`)
      }
    }
  }
  showConfirmModal.value = true
}

const onCategoryConfirm = (categoryData) => {
  if (editingCategory.value) {
    commandStore.updateCategory(editingCategory.value.id, categoryData)
  } else {
    commandStore.addCategory(categoryData)
  }
  showCategoryModal.value = false
}

const clearExecutionHistory = () => {
  confirmModal.value = {
    title: '清除执行历史',
    message: '确定要清除所有工作流执行历史吗？',
    onConfirm: () => {
      workflowStore.clearExecutionHistory()
      showConfirmModal.value = false
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification('执行历史已清除')
      }
    }
  }
  showConfirmModal.value = true
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const formatDuration = (duration) => {
  if (duration < 1000) {
    return `${duration}ms`
  }
  return `${(duration / 1000).toFixed(1)}s`
}

const getStatusText = (status) => {
  const statusMap = {
    completed: '完成',
    failed: '失败',
    running: '运行中'
  }
  return statusMap[status] || status
}
</script>

<style lang="scss" scoped>
// Element Plus 设置页面样式
.settings-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--el-spacing-md);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-md);
    
    .page-title {
      margin: 0;
      font-size: var(--el-font-size-extra-large);
      font-weight: var(--el-font-weight-primary);
      color: var(--el-text-color-primary);
    }
  }
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: var(--spacing-lg);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: 600;
    }
  }
}

.shortcut-help {
  .shortcut-category {
    margin-bottom: var(--spacing-lg);
    
    .category-title {
      margin: 0 0 var(--spacing-md) 0;
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--primary-color);
    }
    
    .shortcut-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-sm);
    }
    
    .shortcut-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      .shortcut-key {
        background: var(--bg-secondary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: var(--font-size-xs);
        font-weight: 600;
        min-width: 80px;
        text-align: center;
      }
      
      .shortcut-desc {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
    }
  }
}

.data-stats {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  
  .stat-item {
    text-align: center;
    
    .stat-value {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--primary-color);
    }
    
    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }
  }
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.categories-list {
  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-sm);
    
    .category-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex: 1;
      
      .category-color {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid var(--border-color);
      }
      
      .category-name {
        flex: 1;
        max-width: 200px;
        font-weight: 600;
      }
      
      .category-color-picker {
        width: 40px;
        height: 32px;
        border: none;
        border-radius: var(--border-radius);
        cursor: pointer;
      }
    }
    
    .category-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      
      .command-count {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
      }
    }
  }
}

.empty-history {
  text-align: center;
  padding: var(--spacing-xl);
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
  }
  
  .empty-text {
    color: var(--text-muted);
  }
}

.execution-history {
  .execution-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-sm);
    
    .execution-info {
      .execution-name {
        font-weight: 600;
        margin-bottom: var(--spacing-xs);
      }
      
      .execution-time {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
      }
    }
    
    .execution-status {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      .status-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius);
        font-size: var(--font-size-xs);
        font-weight: 600;
        
        &.status-completed {
          background: rgba(40, 167, 69, 0.1);
          color: var(--success-color);
        }
        
        &.status-failed {
          background: rgba(220, 53, 69, 0.1);
          color: var(--danger-color);
        }
        
        &.status-running {
          background: rgba(255, 193, 7, 0.1);
          color: var(--warning-color);
        }
      }
      
      .execution-duration {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
      }
    }
  }
}

.about-info {
  .app-info {
    margin-bottom: var(--spacing-lg);
    
    h4 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--primary-color);
    }
    
    p {
      margin: 0;
      color: var(--text-secondary);
    }
  }
  
  .features-list {
    h5 {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--text-primary);
    }
    
    ul {
      margin: 0;
      padding-left: var(--spacing-lg);
      
      li {
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
      }
    }
  }
}

.border-settings {
  .setting-item {
    margin-bottom: var(--el-spacing-lg);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    label {
      display: block;
      font-weight: var(--el-font-weight-primary);
      margin-bottom: var(--el-spacing-sm);
      color: var(--el-text-color-primary);
    }
  }
  
  .setting-controls {
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    padding: var(--el-padding-md);
  }
  
  .control-group {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-md);
    margin-bottom: var(--el-spacing-sm);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    span {
      min-width: 80px;
      color: var(--el-text-color-regular);
    }
    
    input[type="range"] {
      flex: 1;
    }
    
    input[type="color"] {
      width: 40px;
      height: 24px;
      padding: 0;
      border: 1px solid var(--el-border-color);
      border-radius: var(--el-border-radius-small);
      cursor: pointer;
    }
    
    .value {
      min-width: 40px;
      text-align: right;
      color: var(--el-text-color-secondary);
    }
  }
}

@media (max-width: 768px) {
  .data-stats {
    flex-direction: column;
    text-align: center;
  }
  
  .data-actions {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
  
  .category-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
    
    .category-actions {
      justify-content: space-between;
    }
  }
  
  .execution-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
}
</style> 