<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量迁移命令"
    width="50%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-migrate-form">
      <!-- 选择命令 -->
      <div class="form-section">
        <div class="form-group">
          <label class="form-label">选择要迁移的命令</label>
          <div class="command-list">
            <el-checkbox-group v-model="selectedCommands">
              <el-checkbox
                v-for="command in availableCommands"
                :key="command.id"
                :label="command.id"
                class="command-checkbox"
              >
                <div class="command-item">
                  <div class="command-header">
                    <span class="command-name">{{ command.name }}</span>
                    <el-tag 
                      size="small" 
                      :type="getCategoryType(command.category)"
                      class="category-tag"
                    >
                      {{ getCategoryName(command.category) }}
                    </el-tag>
                  </div>
                  <div class="command-description">{{ command.description }}</div>
                  <div class="command-code">{{ command.command }}</div>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>

      <!-- 目标分类选择 -->
      <div class="form-section">
        <div class="form-group">
          <label class="form-label">目标分类</label>
          <el-select
            v-model="targetCategory"
            placeholder="选择目标分类"
            class="w-full"
            clearable
          >
            <el-option-group
              v-for="topCategory in leafCategories"
              :key="topCategory.id"
              :label="topCategory.name"
            >
              <el-option
                :key="topCategory.id"
                :label="topCategory.name"
                :value="topCategory.id"
                v-if="!topCategory.children || topCategory.children.length === 0"
              />
              <template v-for="level1 in topCategory.children" :key="level1.id">
                <el-option
                  :label="`├─ ${level1.name}`"
                  :value="level1.id"
                  class="level-1-option"
                  v-if="!level1.children || level1.children.length === 0"
                />
                <template v-for="level2 in level1.children" :key="level2.id">
                  <el-option
                    :label="`│  ├─ ${level2.name}`"
                    :value="level2.id"
                    class="level-2-option"
                    v-if="!level2.children || level2.children.length === 0"
                  />
                  <template v-for="level3 in level2.children" :key="level3.id">
                    <el-option
                      :label="`│  │  └─ ${level3.name}`"
                      :value="level3.id"
                      class="level-3-option"
                    />
                  </template>
                </template>
              </template>
            </el-option-group>
          </el-select>
          
          <!-- 迁移信息 -->
          <div v-if="selectedCommands.length > 0 && targetCategory" class="migrate-info">
            <el-alert
              :title="`即将迁移 ${selectedCommands.length} 个命令到 ${getCategoryName(targetCategory)}`"
              type="info"
              show-icon
              :closable="false"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleMigrate"
          :disabled="selectedCommands.length === 0 || !targetCategory"
          :loading="loading"
        >
          迁移 ({{ selectedCommands.length }})
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useCommandStore } from '../stores/command'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  sourceCategory: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'migrated'])

const commandStore = useCommandStore()

const dialogVisible = ref(false)
const selectedCommands = ref([])
const targetCategory = ref('')
const loading = ref(false)

// 可用的命令列表
const availableCommands = computed(() => {
  if (props.sourceCategory) {
    // 如果指定了源分类，只显示该分类下的命令
    return commandStore.commands.filter(cmd => cmd.category === props.sourceCategory)
  } else {
    // 否则显示所有非回收站命令
    return commandStore.commands.filter(cmd => cmd.category !== 'recycle-bin')
  }
})

// 叶子分类列表
const leafCategories = computed(() => {
  const filterLeafCategories = (categories) => {
    return categories.reduce((result, category) => {
      if (category.children && category.children.length > 0) {
        const leafChildren = filterLeafCategories(category.children)
        if (leafChildren.length > 0) {
          result.push({
            ...category,
            children: leafChildren
          })
        }
      } else {
        // 排除系统分类
        if (category.id !== 'all' && category.id !== 'recycle-bin') {
          result.push(category)
        }
      }
      return result
    }, [])
  }
  
  return filterLeafCategories(commandStore.categoryTree)
})

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = commandStore.categories.find(cat => cat.id === categoryId)
  return category ? category.name : '未知分类'
}

// 获取分类标签类型
const getCategoryType = (categoryId) => {
  const category = commandStore.categories.find(cat => cat.id === categoryId)
  if (!category) return ''
  
  switch (category.level) {
    case 0: return 'primary'
    case 1: return 'success'
    case 2: return 'warning'
    case 3: return 'info'
    default: return ''
  }
}

// 处理迁移
const handleMigrate = async () => {
  if (selectedCommands.value.length === 0 || !targetCategory.value) {
    ElMessage.warning('请选择要迁移的命令和目标分类')
    return
  }

  loading.value = true
  
  try {
    const migratedCount = await commandStore.batchMigrateCommands(
      selectedCommands.value,
      targetCategory.value
    )
    
    ElMessage.success(`成功迁移 ${migratedCount} 个命令`)
    emit('migrated', {
      count: migratedCount,
      targetCategory: targetCategory.value
    })
    handleClose()
  } catch (error) {
    ElMessage.error('迁移失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false
  selectedCommands.value = []
  targetCategory.value = ''
  loading.value = false
  emit('update:visible', false)
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    // 重置表单
    selectedCommands.value = []
    targetCategory.value = ''
  }
})
</script>

<style lang="scss" scoped>
.batch-migrate-form {
  .form-section {
    margin-bottom: var(--el-spacing-lg);
  }

  .form-label {
    display: block;
    margin-bottom: var(--el-spacing-sm);
    font-weight: var(--el-font-weight-primary);
    color: var(--el-text-color-primary);
  }

  .command-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    padding: var(--el-spacing-sm);
  }

  .command-checkbox {
    width: 100%;
    margin: 0 0 var(--el-spacing-sm) 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  .command-item {
    flex: 1;
    margin-left: var(--el-spacing-sm);
    padding: var(--el-spacing-sm);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-small);
    background: var(--el-fill-color-blank);
    
    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  .command-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--el-spacing-xs);
  }

  .command-name {
    font-weight: var(--el-font-weight-primary);
    color: var(--el-text-color-primary);
  }

  .category-tag {
    flex-shrink: 0;
  }

  .command-description {
    color: var(--el-text-color-regular);
    font-size: var(--el-font-size-small);
    margin-bottom: var(--el-spacing-xs);
  }

  .command-code {
    font-family: var(--el-font-family-mono);
    font-size: var(--el-font-size-extra-small);
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
    padding: 2px 6px;
    border-radius: var(--el-border-radius-small);
    border: 1px solid var(--el-border-color-lighter);
  }

  .migrate-info {
    margin-top: var(--el-spacing-sm);
  }

  // 层级选择器样式
  .level-1-option {
    padding-left: var(--el-spacing-lg) !important;
    color: var(--el-color-success);
  }
  
  .level-2-option {
    padding-left: calc(var(--el-spacing-lg) * 2) !important;
    color: var(--el-color-warning);
  }
  
  .level-3-option {
    padding-left: calc(var(--el-spacing-lg) * 3) !important;
    color: var(--el-color-info);
  }
}
</style> 