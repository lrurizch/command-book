<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEditing ? '修改命令模板' : '新建命令模板'"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
    class="command-add-modal"
  >
    <!-- 命令模板表单 -->
    <div class="command-form">
      <!-- 基本信息 -->
      <div class="form-section basic-info-section">
        <div class="form-group">
          <label for="command-name" class="form-label">
            命令名称 <span class="required">*</span>
            <span v-if="isEditing && getFieldChanges().commandName" class="changed-indicator">已修改</span>
          </label>
          <el-input
            id="command-name"
            v-model="form.commandName"
            placeholder="输入命令名称 (如: Git提交代码, NPM安装依赖)"
            class="command-input"
            :class="{ 'field-changed': isEditing && getFieldChanges().commandName }"
          />
          <!-- 显示原始值对比 -->
          <div v-if="isEditing && getFieldChanges().commandName" class="comparison-info">
            <div class="original-value">
              <span class="label">原始值:</span>
              <span class="original-text">{{ originalData.commandName || '无' }}</span>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('commandName')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
          </div>
        </div>

        <!-- 常用完整命令 -->
        <div class="form-section common-commands-section">
          <h3 class="section-title">
            常用完整命令
            <span v-if="isEditing && getFieldChanges().commonCommands" class="changed-indicator">已修改</span>
            <el-tooltip content="添加实际可执行的完整命令，无需参数占位符。最近使用的命令会自动成为默认复制命令" placement="top">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </h3>
          <div class="common-commands-container">
            <div 
              v-for="(cmdExample, index) in form.commonCommands" 
              :key="index" 
              class="command-example-item"
            >
              <div class="command-example-form">
                <el-input
                  v-model="cmdExample.name"
                  placeholder="命令名称 (如: 提交功能代码, 提交修复代码)"
                  class="example-name"
                />
                <el-input
                  v-model="cmdExample.command"
                  type="textarea"
                  :rows="2"
                  placeholder="完整可执行命令 (如: git commit -m 'feat: 添加新功能' 或 git commit -m 'fix: 修复登录问题')"
                  class="example-command"
                />
                <el-input
                  v-model="cmdExample.description"
                  placeholder="使用场景说明 (可选)"
                  class="example-description"
                />
                <div class="command-actions">
                  <el-checkbox 
                    v-model="cmdExample.isDefault" 
                    :disabled="getDefaultCommandCount() > 0 && !cmdExample.isDefault"
                    @change="handleDefaultChange(index, $event)"
                  >
                    设为默认
                  </el-checkbox>
                <el-button
                  type="danger"
                  text
                    @click="removeCommonCommand(index)"
                    title="删除常用命令"
                >
                  ×
                </el-button>
                </div>
              </div>
            </div>
            <el-button
              type="primary"
              text
              @click="addCommonCommand"
              icon="Plus"
            >
              + 添加常用完整命令
            </el-button>
          </div>
          <!-- 显示原始常用命令对比 -->
          <div v-if="isEditing && getFieldChanges().commonCommands" class="comparison-info">
            <div class="original-value">
              <span class="label">原始常用命令:</span>
              <div class="original-common-commands">{{ getOriginalCommonCommandsDisplay() }}</div>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('commonCommands')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 使用说明 -->
        <div class="form-group">
          <label for="command-usage" class="form-label">
            使用说明
            <span v-if="isEditing && getFieldChanges().usage" class="changed-indicator">已修改</span>
          </label>
          <el-input
            id="command-usage"
            v-model="form.usage"
            type="textarea"
            :rows="3"
            maxlength="500"
            placeholder="详细的使用说明和注意事项"
            :class="{ 'field-changed': isEditing && getFieldChanges().usage }"
          />
          <!-- 显示原始值对比 -->
          <div v-if="isEditing && getFieldChanges().usage" class="comparison-info">
            <div class="original-value">
              <span class="label">原始值:</span>
              <span class="original-text">{{ originalData.usage || '无' }}</span>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('usage')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 分类和标签 -->
        <div class="form-row">
          <div class="form-group">
            <label for="command-category" class="form-label">
              分类
              <span v-if="isEditing && getFieldChanges().category" class="changed-indicator">已修改</span>
            </label>
            <div class="category-selector-container" :class="{ 'field-changed': isEditing && getFieldChanges().category }">
              <div class="category-selector">
                          <el-select
                v-model="form.category"
                filterable
                allow-create
                clearable
                default-first-option
                  placeholder="选择或输入分类（可选）"
                class="w-full"
                @visible-change="handleCategoryDropdownToggle"
                @create="handleCreateCategory"
              >
                <el-option
                  v-for="category in hierarchicalCategories"
                  :key="category.id"
                  :value="category.id"
                  :label="category.level === 0 ? category.name : `${category.name} (${category.pathInfo})`"
                  :class="`level-${category.level}-option`"
                />
              </el-select>
              
              <!-- 分类状态提示 -->
              <div 
                v-if="categoryStatus.message" 
                :class="['category-status-hint', `hint-${categoryStatus.type}`]"
              >
                <el-icon class="hint-icon">
                  <InfoFilled v-if="categoryStatus.type === 'info'" />
                  <WarningFilled v-if="categoryStatus.type === 'warning'" />
                  <SuccessFilled v-if="categoryStatus.type === 'success'" />
                </el-icon>
                <span class="hint-text">{{ categoryStatus.message }}</span>
                <span v-if="categoryStatus.level" class="category-level-info">（{{ categoryStatus.level }}级分类）</span>
                
                <!-- 添加父分类选择 -->
                <div v-if="categoryStatus.type === 'warning' && categoryStatus.action === 'needParent'" class="category-actions">
                  <div class="parent-category-inline">
                    <span class="parent-label">选择父分类:</span>
                    <el-select
                      v-model="categoryCreation.parentId"
                      class="parent-select"
                      placeholder="选择父分类（可选）"
                      clearable
                      >
                        <el-option
                        v-for="parent in availableParentCategories"
                        :key="parent.id"
                        :value="parent.id"
                        :label="parent.name"
                      />
            </el-select>
                  </div>
                </div>
              </div>
            </div>
            </div>
            <!-- 显示原始分类对比 -->
            <div v-if="isEditing && getFieldChanges().category" class="comparison-info">
              <div class="original-value">
                <span class="label">原始分类:</span>
                <span class="original-text">{{ getOriginalCategoryDisplay() }}</span>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="restoreField('category')"
                  class="restore-btn"
                  title="恢复到原始值"
                >
                  ↺ 恢复
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="command-tags" class="form-label">
              标签
              <span v-if="isEditing && getFieldChanges().tags" class="changed-indicator">已修改</span>
            </label>
            <el-select
              id="command-tags"
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="添加标签 (可选，支持创建新标签)"
              class="w-full"
              :class="{ 'field-changed': isEditing && getFieldChanges().tags }"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
            <!-- 显示原始标签对比 -->
            <div v-if="isEditing && getFieldChanges().tags" class="comparison-info">
              <div class="original-value">
                <span class="label">原始标签:</span>
                <span class="original-text">{{ (originalData.tags || []).join(', ') || '无' }}</span>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="restoreField('tags')"
                  class="restore-btn"
                  title="恢复到原始值"
                >
                  ↺ 恢复
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="main-command" class="form-label">
            主命令 <span class="required">*</span>
            <span v-if="isEditing && getFieldChanges().mainCommand" class="changed-indicator">已修改</span>
          </label>
          <el-input
            id="main-command"
            v-model="form.mainCommand"
            placeholder="输入主命令 (如: git, npm, docker)"
            class="command-input"
            :class="{ 'field-changed': isEditing && getFieldChanges().mainCommand }"
          />
          <!-- 显示原始值对比 -->
          <div v-if="isEditing && getFieldChanges().mainCommand" class="comparison-info">
            <div class="original-value">
              <span class="label">原始值:</span>
              <span class="original-text">{{ originalData.mainCommand || '无' }}</span>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('mainCommand')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
        </div>
      </div>

              <!-- 子命令管理 -->
      <div class="form-section subcommands-section">
          <h3 class="section-title">
            子命令
            <span v-if="isEditing && getFieldChanges().subcommands" class="changed-indicator">已修改</span>
          </h3>
          <div class="subcommands-container">
            <div 
              v-for="(subcommand, index) in form.subcommands" 
              :key="index" 
              class="subcommand-item"
            >
              <div class="subcommand-form">
                <el-input
                  v-model="subcommand.name"
                  placeholder="子命令名 (如: add, commit, push)"
                  class="subcommand-name"
                />
                <el-input
                  v-model="subcommand.description"
                  placeholder="子命令描述（可选）"
                  class="subcommand-description"
                />
                <el-radio-group v-model="subcommand.type" class="subcommand-type">
                  <el-radio :value="ParameterType.REQUIRED">必选</el-radio>
                  <el-radio :value="ParameterType.OPTIONAL">可选</el-radio>
                </el-radio-group>
                <el-button
                  type="danger"
                  text
                  @click="removeSubcommand(index)"
                  title="删除子命令"
                >
                  ×
                </el-button>
              </div>
            </div>
            <el-button
              type="primary"
              text
              @click="addSubcommand"
              icon="Plus"
            >
              + 添加子命令
            </el-button>
          </div>
          <!-- 显示原始子命令对比 -->
          <div v-if="isEditing && getFieldChanges().subcommands" class="comparison-info">
            <div class="original-value">
              <span class="label">原始子命令:</span>
              <div class="original-subcommands">{{ getOriginalSubcommandsDisplay() }}</div>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('subcommands')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
          </div>
        </div>
        

        



      <!-- 命令选项 -->
      <div class="form-section options-section">
        <h3 class="section-title">
          命令选项
          <span v-if="isEditing && getFieldChanges().options" class="changed-indicator">已修改</span>
        </h3>
        <div class="options-container">
          <div 
            v-for="(option, index) in form.options" 
            :key="index" 
            class="option-item"
          >
            <div class="option-form">
              <el-input
                v-model="option.flag"
                placeholder="选项名 (如: -h, --help)"
                class="option-flag"
              />
              <el-input
                v-model="option.description"
                placeholder="选项描述"
                class="option-description"
              />
              <el-button
                type="danger"
                text
                @click="removeOption(index)"
                title="删除选项"
              >
                ×
              </el-button>
            </div>
          </div>
          <div class="option-buttons">
          <el-button
            type="primary"
            text
            @click="addOption"
            icon="Plus"
          >
            + 添加选项
          </el-button>
            <el-button
              type="warning"
              text
              @click="addMutexOptionPair"
              icon="Switch"
              :disabled="availableOptionsForMutex.length < 2"
              :title="availableOptionsForMutex.length < 2 ? '至少需要两个选项才能设置互斥关系' : '从已有选项中设置互斥关系'"
            >
              设置互斥选项
          </el-button>
          </div>
        </div>
        <!-- 显示原始选项对比 -->
        <div v-if="isEditing && getFieldChanges().options" class="comparison-info">
          <div class="original-value">
            <span class="label">原始选项:</span>
            <div class="original-options">{{ getOriginalOptionsDisplay() }}</div>
            <el-button 
              type="text" 
              size="small" 
              @click="restoreField('options')"
              class="restore-btn"
              title="恢复到原始值"
            >
              ↺ 恢复
            </el-button>
          </div>
        </div>
      </div>

      <!-- 命令参数 -->
      <div class="form-section parameters-section">
        <h3 class="section-title">
          命令参数
          <span v-if="isEditing && getFieldChanges().parameters" class="changed-indicator">已修改</span>
          <el-tooltip content="配置命令的位置参数，如文件路径、目标地址等" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </h3>
        
        <!-- 参数列表 -->
        <div class="parameters-container">
          <div v-if="form.parameters.length === 0" class="parameters-actions">
            <el-button
              type="primary"
              text
              @click="addCustomParameter"
              icon="Plus"
            >
              + 添加参数
            </el-button>
          </div>
          
          <div v-else class="parameters-list">
            <div
              v-for="(param, index) in form.parameters"
            :key="index" 
              class="parameter-item"
          >
              <div class="parameter-header">
                <el-input
                  v-model="param.name"
                  placeholder="参数名称"
                  class="parameter-name"
                  size="small"
                />
                <el-button
                  type="danger"
                  text
                  @click="removeParameter(index)"
                  title="删除参数"
                  class="delete-param-btn"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              
                             <div class="parameter-body">
                 <!-- 常用参数值列表 -->
                 <div class="form-group">
                   <label class="form-label">常用参数值</label>
                   <div class="common-values-container">
                     <div v-if="param.commonValues.length === 0" class="empty-values">
            <el-button
              type="primary"
              text
                         @click="addCommonValue(index)"
              icon="Plus"
            >
                         + 添加常用值
            </el-button>
      </div>

                     <div v-else class="values-list">
                       <div
                         v-for="(value, valueIndex) in param.commonValues"
                         :key="valueIndex"
                         class="value-item"
                       >
              <el-input
                           v-model="value.value"
                           placeholder="参数值"
                           class="value-input"
                         />
                         <el-radio
                           v-model="param.defaultValueIndex"
                           :label="valueIndex"
                           class="default-radio"
                           title="设为默认值"
                         >
                           默认
                         </el-radio>
                <el-button
                  type="danger"
                  text
                           @click="removeCommonValue(index, valueIndex)"
                           title="删除此值"
                >
                           <el-icon><Delete /></el-icon>
                </el-button>
              </div>
                       
                       <!-- 无默认值选项 -->
                       <div class="value-item no-default-item">
                         <span class="no-default-label">无默认值</span>
                         <el-radio
                           v-model="param.defaultValueIndex"
                           :label="-1"
                           class="default-radio"
                           title="不设置默认值"
                         >
                           选择
                         </el-radio>
            </div>
                       
                       <div class="values-actions">
          <el-button
            type="primary"
            text
                           @click="addCommonValue(index)"
            icon="Plus"
          >
                           + 添加更多值
          </el-button>
        </div>
            </div>
          </div>
      </div>

                 <div class="form-group">
                   <label class="form-label">是否必带</label>
                   <el-switch
                     v-model="param.required"
                     active-text="必带"
                     inactive-text="可选"
                     active-color="#409eff"
                   />
                 </div>
                 
                 <div class="form-group">
                   <label class="form-label">可重复项</label>
                   <el-switch
                     v-model="param.repeatable"
                     active-text="可重复"
                     inactive-text="单值"
                     active-color="#67c23a"
                   />
                   <div class="param-help">
                     勾选后表示此参数可填写一个或多个值
                   </div>
                 </div>
          </div>
            </div>
            
            <div class="parameters-actions">
          <el-button
            type="primary"
            text
                @click="addCustomParameter"
            icon="Plus"
          >
                + 添加参数
          </el-button>
        </div>
          </div>
        </div>
        
        <!-- 显示原始参数对比 -->
        <div v-if="isEditing && getFieldChanges().parameters" class="comparison-info">
          <div class="original-value">
            <span class="label">原始参数:</span>
            <div class="original-parameters">{{ getOriginalParametersDisplay() }}</div>
            <el-button 
              type="text" 
              size="small" 
              @click="restoreField('parameters')"
              class="restore-btn"
              title="恢复到原始值"
            >
              ↺ 恢复
            </el-button>
          </div>
        </div>
      </div>



      <!-- 符号 -->
      <div class="form-section symbols-section">
        <h3 class="section-title">
          符号
          <span v-if="isEditing && getFieldChanges().symbols" class="changed-indicator">已修改</span>
        </h3>
                <div class="symbols-container">
          <!-- 符号选择区域 -->
          <div class="symbol-selection-area">
            <div class="selector-row">
              <div 
                v-for="category in symbolCategories" 
                :key="category.value"
                class="category-selector-item"
              >
                <label class="category-label">{{ category.label }}</label>
                <el-select
                  :model-value="getSelectedSymbolsForCategory(category.value)"
                  @update:model-value="updateCategorySymbols(category.value, $event)"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :max-collapse-tags="1"
                  :placeholder="`选择${category.label}`"
                  class="symbol-select"
                  clearable
                  filterable
                  size="small"
                >
                  <el-option
                    v-for="symbolOption in getSymbolsByCategory(category.value)"
                    :key="symbolOption.symbol"
                    :value="symbolOption.symbol"
                    :label="symbolOption.symbol"
                  >
                    <div 
                      class="symbol-option-only"
                      :title="`${symbolOption.name}: ${symbolOption.description}`"
                    >
                      <span class="symbol-char">{{ symbolOption.symbol }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
            </div>
          </div>
          
          <!-- 已选择符号展示 -->
          <div v-if="form.symbols.length > 0" class="selected-symbols-area">
            <div class="selected-symbols-header">
              <span class="symbols-count">已选择 {{ form.symbols.length }} 个符号</span>
              <el-button 
                type="text" 
                size="small" 
                @click="form.symbols = []"
                title="清空所有符号"
              >
                清空
              </el-button>
            </div>
            <div class="selected-symbols-tags">
              <el-tag
                v-for="(symbol, index) in form.symbols"
                :key="`${symbol.category}-${symbol.symbol}`"
                closable
                @close="removeSymbolByIndex(index)"
                size="small"
                type="primary"
                class="symbol-tag"
              >
                {{ symbol.symbol }}
              </el-tag>
            </div>
          </div>

        </div>
        
        <!-- 显示原始符号对比 -->
        <div v-if="isEditing && getFieldChanges().symbols" class="comparison-info">
          <div class="original-value">
            <span class="label">原始符号:</span>
            <div class="original-symbols">{{ getOriginalSymbolsDisplay() }}</div>
            <el-button 
              type="text" 
              size="small" 
              @click="restoreField('symbols')"
              class="restore-btn"
              title="恢复到原始值"
            >
              ↺ 恢复
            </el-button>
          </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button plain @click="handleClose">取消</el-button>
        <el-button v-if="!isEditing" type="primary" @click="handleConfirm">
          确认添加
        </el-button>
        <el-button v-if="!isEditing" type="success" @click="handleConfirmAndContinue">
          确认添加并继续
        </el-button>
        <el-button v-if="isEditing" type="primary" @click="handleConfirm">
          保存修改
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 选择父分类对话框 -->
  <el-dialog
    v-model="showParentCategoryDialog"
    title="创建新分类"
    width="400px"
    :close-on-click-modal="false"
  >
    <div class="parent-category-selector">
      <p class="category-info">
        新分类名称: <strong>{{ newCategoryName }}</strong>
      </p>
      
      <div class="form-group">
        <label class="form-label">选择父分类（可选）</label>
        <el-select
          v-model="selectedParentCategory"
          placeholder="选择父分类，不选择则创建为一级分类"
          clearable
          class="w-full"
        >
          <el-option-group
            v-for="topCategory in parentCategoryOptions"
            :key="topCategory.id"
            :label="topCategory.name"
          >
            <el-option
              :key="topCategory.id"
              :label="topCategory.name"
              :value="topCategory.id"
            />
            <template v-for="level1 in topCategory.children" :key="level1.id">
              <el-option
                :label="`├─ ${level1.name}`"
                :value="level1.id"
                class="level-1-option"
              />
              <template v-for="level2 in level1.children" :key="level2.id">
                <el-option
                  :label="`│  ├─ ${level2.name}`"
                  :value="level2.id"
                  class="level-2-option"
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
        <div class="help-text">
          不选择父分类将创建为一级分类，最多支持四级分类
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelCreateCategory">取消</el-button>
        <el-button type="primary" @click="confirmCreateCategory">
          确认创建
        </el-button>
      </span>
    </template>
  </el-dialog>

  

  <!-- 互斥选项配对对话框 -->
  <el-dialog
    v-model="showMutexOptionDialog"
    title="创建互斥选项对"
    width="500px"
  >
    <div class="mutex-pairing-selection">
      <p>从已有选项中选择两个选项设置为互斥：</p>
      <div v-if="availableOptionsForMutex.length < 2" class="no-options-warning">
        <el-alert
          title="选项不足"
          description="至少需要两个已创建的非互斥选项才能设置互斥关系"
          type="warning"
          show-icon
          :closable="false"
        />
      </div>
      <div v-else class="mutex-selection-form">
        <div class="form-group">
          <label>选择第一个选项：</label>
          <el-select v-model="selectedOption1" placeholder="请选择选项">
            <el-option
              v-for="option in availableOptionsForMutex"
              :key="option.index"
              :value="option.index.toString()"
              :label="`${option.shortName ? '-' + option.shortName : option.longName ? '--' + option.longName : ''} - ${option.description || '无描述'}`"
            />
          </el-select>
        </div>
        <div class="form-group">
          <label>选择第二个选项：</label>
          <el-select v-model="selectedOption2" placeholder="请选择选项">
            <el-option
              v-for="option in availableOptionsForMutex"
              :key="option.index"
              :value="option.index.toString()"
              :label="`${option.shortName ? '-' + option.shortName : option.longName ? '--' + option.longName : ''} - ${option.description || '无描述'}`"
              :disabled="option.index.toString() === selectedOption1"
            />
          </el-select>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showMutexOptionDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmMutexPairing"
          :disabled="availableOptionsForMutex.length < 2 || !selectedOption1 || !selectedOption2"
        >
          确认创建互斥对
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 添加选项设置对话框 -->
  <el-dialog
    v-model="showAddOptionDialog"
    :title="currentEditingIndex !== -1 ? '编辑选项' : '添加选项'"
    width="700px"
  >
    <div class="add-option-form">
      <div class="form-section dialog-form-section">
        <h4>基本信息</h4>
        
        <!-- 命令与选项间分隔符 -->
        <div class="form-group">
          <label class="form-label">命令与选项间分隔符</label>
          <div class="separator-input-wrapper">
            <el-input
              v-model="newOptionForm.commandSeparator"
              placeholder="分隔符"
              maxlength="5"
              class="command-separator-input"
            />
            <span class="separator-hint-inline">{{ commandSeparatorDescription }}</span>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">短选项名</label>
            <div class="option-name-input">
              <span class="option-prefix">-</span>
              <el-input
                v-model="newOptionForm.shortName"
                placeholder="h, v, la, rf"
                clearable
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">长选项名</label>
            <div class="option-name-input">
              <span class="option-prefix">--</span>
              <el-input
                v-model="newOptionForm.longName"
                placeholder="help, version, file"
                clearable
              />
            </div>
          </div>
        </div>
        
        <div class="option-name-hint">
          <span class="hint-text">
            <span v-if="!newOptionForm.shortName && !newOptionForm.longName" class="required-hint">⚠ </span>
            请填写短选项名（如 -h、-la）或长选项名（如 --help、--verbose），至少选择其中一个。前缀横线会自动添加。
          </span>
        </div>
        
        <div class="form-group">
          <label class="form-label">选项描述</label>
          <el-input
            v-model="newOptionForm.description"
            placeholder="详细描述这个选项的作用（可选）"
            maxlength="100"
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">选项类型</label>
            <el-radio-group v-model="newOptionForm.type">
              <el-radio :value="ParameterType.REQUIRED">必选选项</el-radio>
              <el-radio :value="ParameterType.OPTIONAL">可选选项</el-radio>
            </el-radio-group>
          </div>
          <div class="form-group">
            <label class="form-label">参数类型</label>
            <el-radio-group v-model="newOptionForm.valueType">
              <el-radio :value="ParameterValueType.REQUIRED">必带参数</el-radio>
              <el-radio :value="ParameterValueType.OPTIONAL">可选参数</el-radio>
              <el-radio :value="ParameterValueType.NONE">不可带参数</el-radio>
            </el-radio-group>
            

          </div>
        </div>
      </div>
      
      <!-- 参数配置区域 -->
      <div v-if="shouldShowParameterConfig" class="form-section dialog-form-section">
        <div class="section-header">
          <h4>参数配置</h4>
        </div>
        
        <!-- 选项与参数间分隔符和参数名称 -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">选项与参数间分隔符</label>
            <div class="separator-input-wrapper">
              <el-input
                v-model="newOptionForm.optionSeparator"
                placeholder="分隔符"
                maxlength="5"
                class="option-separator-input"
              />
              <span class="separator-hint-inline">{{ optionSeparatorDescription }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">参数名称</label>
            <el-input
              v-model="newOptionForm.parameterName"
              placeholder="输入参数名称"
              class="parameter-name-input"
            />
          </div>
        </div>
        

        
        <div v-if="newOptionForm.parameters.length > 0" class="params-list">
          <div
            v-for="(param, index) in newOptionForm.parameters"
            :key="`new-param-${index}`"
            class="param-item"
          >
            <div class="param-header">
              <span class="param-title">常用参数值</span>
              <el-button
                type="danger"
                size="small"
                @click="removeNewOptionParameter(index)"
                icon="Delete"
              >
              </el-button>
            </div>
            
            <div class="param-values-section">
              <div class="common-values">
                <label class="values-label">常用参数值：</label>
                <div class="values-list">
                  <div 
                    v-for="(commonValue, valueIndex) in param.commonValues"
                    :key="`common-value-${index}-${valueIndex}`"
                    class="value-item"
                  >
                    <el-input
                      v-model="param.commonValues[valueIndex]"
                      placeholder="常用值"
                      size="small"
                      class="value-input"
                    />
                    <el-checkbox
                      :model-value="param.defaultValue === commonValue"
                      @change="(checked) => setDefaultValue(index, valueIndex, checked)"
                      class="default-checkbox"
                    >
                      默认
                    </el-checkbox>
                    <el-button
                      type="text"
                      size="small"
                      @click="removeOptionCommonValue(index, valueIndex)"
                      icon="Close"
                      class="remove-value-btn"
                    >
                    </el-button>
                  </div>
                  <el-button
                    type="primary"
                    size="small"
                    @click="addOptionCommonValue(index)"
                    icon="Plus"
                    plain
                    class="add-value-btn"
                  >
                    添加常用值
                  </el-button>
                </div>
              </div>
              

            </div>
          </div>
        </div>
        

      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showAddOptionDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAddOption"
        >
          {{ currentEditingIndex !== -1 ? '确认更新' : '确认添加' }}
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 常用选项参数选择对话框 -->
  <el-dialog
    v-model="showCommonParamsDialog"
    :title="currentOptionIndex === -1 ? '选择已有选项和参数 - 创建常用组合' : '选择已有选项和参数 - 添加到选项'"
    width="700px"
  >
    <div class="common-params-selection">
      <p v-if="currentOptionIndex === -1">从当前命令已添加的选项和参数中选择，创建常用参数组合：</p>
      <p v-else>从当前命令已添加的选项和参数中选择，添加到当前选项：</p>
      
      <div v-if="Object.keys(filteredCommonParams).length === 0" class="empty-state">
        <p>当前命令还没有添加任何选项或参数</p>
        <p class="hint">请先在命令中添加选项或参数，然后再使用此功能</p>
      </div>
      <div v-else class="params-categories">
        <div 
          v-for="(params, category) in filteredCommonParams" 
          :key="category"
          class="param-category"
        >
          <h4 class="category-title">{{ category }} ({{ params.length }}项)</h4>
          <div class="params-grid">
            <el-checkbox-group v-model="selectedCommonParams">
              <el-checkbox 
                v-for="(param, paramIndex) in params" 
                :key="`${category}-${paramIndex}`"
                :value="`${category}-${paramIndex}`"
                class="param-checkbox"
              >
                <div class="param-item">
                  <strong>{{ param.name }}</strong>
                  <span class="param-desc">{{ param.description }}</span>
                  <el-tag 
                    :type="param.paramType === ParameterType.REQUIRED ? 'danger' : (param.paramType === ParameterType.OPTIONAL ? 'info' : 'warning')" 
                    size="small"
                  >
                    {{ param.paramType === ParameterType.REQUIRED ? '必选' : (param.paramType === ParameterType.OPTIONAL ? '可选' : '禁用') }}
                  </el-tag>
                  <el-tag 
                    :type="param.type === 'option' ? 'success' : (param.type === 'option-param' ? 'primary' : '')"
                    size="small"
                  >
                    {{ param.type === 'option' ? '选项' : (param.type === 'option-param' ? '选项参数' : '命令参数') }}
                  </el-tag>
                </div>
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showCommonParamsDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAddCommonParams"
          :disabled="selectedCommonParams.length === 0"
        >
          添加选中参数 ({{ selectedCommonParams.length }})
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, SuccessFilled, WarningFilled, Plus, Delete, FolderAdd, CircleCloseFilled, Check, ArrowDown, ArrowRight, Search } from '@element-plus/icons-vue'
import { useCommandStore } from '../stores/command'
import { showSaveSuccess } from '../utils/toast'
// 简化为直接创建命令模板，无需复杂构建器

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  editingCommand: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const commandStore = useCommandStore()

// 参数类型枚举
const ParameterType = {
  REQUIRED: 'required',     // 必选参数
  OPTIONAL: 'optional'      // 可选参数  
}

// 简化模式，直接创建命令模板

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.editingCommand)

// 选项验证逻辑
const optionValidations = computed(() => {
  const validations = []
  
  if (form.value.options.length === 0) {
    return validations
  }
  
  const requiredOptions = form.value.options.filter(opt => opt.type === ParameterType.REQUIRED)
  const optionalOptions = form.value.options.filter(opt => opt.type === ParameterType.OPTIONAL)
  const otherOptions = form.value.options.filter(opt => 
    ![ParameterType.REQUIRED, ParameterType.OPTIONAL].includes(opt.type)
  )
  
  // 检查是否有无效的选项类型
  if (otherOptions.length > 0) {
    validations.push({
      type: 'invalid_type',
      level: 'error',
      message: `发现 ${otherOptions.length} 个无效选项类型，请检查选项配置`
    })
  }
  
  // 检查是否没有必选选项
  if (requiredOptions.length === 0) {
    validations.push({
      type: 'no_required',
      level: 'warning',
      message: '当前命令没有必选选项，建议至少设置一个必选选项以确保命令正确性'
    })
  }
  
  // 检查互斥组的完整性
  if (form.value.mutexGroups && form.value.mutexGroups.length > 0) {
    form.value.mutexGroups.forEach((group, index) => {
      if (group.optionIndexes.length !== 2) {
      validations.push({
          type: 'invalid_mutex_group',
          level: 'error',
          message: `${group.name}选项数量异常，互斥组必须包含且仅包含2个选项`
      })
    } else {
        // 检查选项是否都是可选类型
        const invalidOptions = group.optionIndexes.filter(idx => {
          const option = form.value.options[idx]
          return !option || option.type !== ParameterType.OPTIONAL
        })
        
        if (invalidOptions.length > 0) {
      validations.push({
            type: 'mutex_non_optional',
            level: 'error',
            message: `${group.name}包含非可选选项，互斥组只能包含可选选项`
          })
        } else {
          // 正常的互斥组
          const option1 = form.value.options[group.optionIndexes[0]]
          const option2 = form.value.options[group.optionIndexes[1]]
          const name1 = option1.shortName || option1.longName || '未命名'
          const name2 = option2.shortName || option2.longName || '未命名'
          
    validations.push({
            type: 'valid_mutex_group',
      level: 'info',
            message: `${group.name}：${name1} ⇄ ${name2}，这两个选项不能同时使用`
          })
        }
      }
    })
  }

  
  return validations
})

// 父分类选择选项（包含所有分类，排除系统分类）
const parentCategoryOptions = computed(() => {
  return commandStore.categoryTree.filter(category => 
    category.id !== 'all' && category.id !== 'recycle-bin'
  )
})

// 层级分类数据（只显示叶子分类）
const hierarchicalCategories = computed(() => {
  // 获取所有叶子分类（没有子分类的分类）
  const leafCategories = commandStore.getLeafCategories().filter(category => 
    category.id !== 'all' && category.id !== 'recycle-bin'
  )
  
  // 为每个叶子分类构建完整的路径信息
  leafCategories.forEach(leafCategory => {
    // 构建完整路径
    const path = []
    let current = leafCategory
    const categoryMap = new Map()
    
    // 创建分类映射
    commandStore.categories.forEach(cat => {
      categoryMap.set(cat.id, cat)
    })
    
    while (current) {
      path.unshift(current)
      current = current.parentId ? categoryMap.get(current.parentId) : null
    }
    
    // 设置路径信息
    leafCategory.pathInfo = path.map(cat => cat.name).join(' › ')
  })
  
  return leafCategories
})

// 分类状态检查
const categoryStatus = computed(() => {
  const currentCategory = form.value.category
  
  // 输入框为空时不显示任何提示
  if (!currentCategory || !currentCategory.trim()) {
    return {
      exists: false,
      message: '',
      type: 'info'
    }
  }
  
  const trimmedCategory = currentCategory.trim()
  
  // 首先检查是否是分类ID（通过下拉选择）
  const categoryById = commandStore.categories.find(c => c.id === trimmedCategory)
  if (categoryById) {
    return {
      exists: true,
      message: '',
      type: 'success',
      category: categoryById
    }
  }
  
  // 然后检查是否是分类名称（手动输入）
  const categoryByName = commandStore.categories.find(c => 
    c.name.trim().toLowerCase() === trimmedCategory.toLowerCase()
  )
  
  if (categoryByName) {
    return {
      exists: true,
      message: '',
      type: 'success',
      category: categoryByName
    }
  } else {
    // 新分类：显示提示和父分类选择选项
    return {
      exists: false,
      message: '新分类，未选择父分类将创建为一级分类',
      type: 'info'
    }
  }
})

// 符号选择器相关状态（保留以防其他地方使用）

// 符号分类数据
const symbolCategories = ref([
  {
    value: 'pipe',
    label: '管道符号',
    description: '数据传输'
  },
  {
    value: 'redirect',
    label: '重定向符号',
    description: '输入输出重定向'
  },
  {
    value: 'logic',
    label: '逻辑符号',
    description: '逻辑运算'
  },
  {
    value: 'background',
    label: '后台符号',
    description: '后台执行'
  },
  {
    value: 'grouping',
    label: '分组符号',
    description: '命令分组'
  },
  {
    value: 'wildcard',
    label: '通配符号',
    description: '模式匹配'
  },
  {
    value: 'separator',
    label: '分隔符号',
    description: '参数分隔'
  }
])



// 各分类下的具体符号
const symbolsByCategory = ref({
  pipe: [
    { symbol: '|', name: '管道', description: '将前一个命令的输出作为后一个命令的输入' },
    { symbol: '|&', name: '错误管道', description: '同时传递标准输出和标准错误' },
    { symbol: 'xargs', name: '参数传递', description: '将输入转换为命令行参数' }
  ],
  redirect: [
    { symbol: '>', name: '输出重定向', description: '将输出重定向到文件（覆盖）' },
    { symbol: '>>', name: '追加重定向', description: '将输出追加到文件末尾' },
    { symbol: '<', name: '输入重定向', description: '从文件读取输入' },
    { symbol: '<<', name: 'Here文档', description: '内嵌文档输入' },
    { symbol: '2>', name: '错误重定向', description: '重定向标准错误到文件' },
    { symbol: '2>>', name: '错误追加', description: '追加标准错误到文件' },
    { symbol: '&>', name: '全部重定向', description: '重定向标准输出和错误' },
    { symbol: '2>&1', name: '错误合并', description: '将标准错误重定向到标准输出' }
  ],
  logic: [
    { symbol: '&&', name: '逻辑与', description: '前一个命令成功才执行后一个' },
    { symbol: '||', name: '逻辑或', description: '前一个命令失败才执行后一个' },
    { symbol: ';', name: '顺序执行', description: '依次执行命令，不考虑成败' },
    { symbol: '!', name: '逻辑非', description: '取反命令的退出状态' }
  ],
  background: [
    { symbol: '&', name: '后台执行', description: '在后台运行命令' },
    { symbol: 'nohup', name: '忽略挂起', description: '忽略挂起信号，继续运行' },
    { symbol: 'disown', name: '脱离控制', description: '将作业从作业表中移除' }
  ],
  grouping: [
    { symbol: '()', name: '子shell分组', description: '在子shell中执行命令组' },
    { symbol: '{}', name: '当前shell分组', description: '在当前shell中执行命令组' },
    { symbol: '[]', name: '条件测试', description: '条件测试表达式' },
    { symbol: '[[]]', name: '扩展测试', description: '扩展的条件测试' }
  ],
  wildcard: [
    { symbol: '*', name: '任意字符', description: '匹配任意数量的任意字符' },
    { symbol: '?', name: '单个字符', description: '匹配单个任意字符' },
    { symbol: '[...]', name: '字符集', description: '匹配字符集中的任意一个字符' },
    { symbol: '{...}', name: '大括号扩展', description: '大括号扩展模式' },
    { symbol: '~', name: '主目录', description: '用户主目录路径' }
  ],
  separator: [
    { symbol: ' ', name: '空格', description: '默认参数分隔符' },
    { symbol: '=', name: '等号', description: '键值对分隔符' },
    { symbol: ':', name: '冒号', description: '路径或配置分隔符' },
    { symbol: ',', name: '逗号', description: '列表项分隔符' },
    { symbol: '-', name: '连字符', description: '选项前缀或范围分隔符' },
    { symbol: '--', name: '双连字符', description: '长选项前缀' }
  ]
})

// 表单数据
const form = ref({
  commandName: '', // 命令名称
  mainCommand: '', // 主命令
  subcommands: [], // 子命令列表
  command: '', // 完整命令模板
  description: '',
  usage: '',
  category: '',
  tags: [],
  parameters: [],
  options: [], // 命令选项
  mutexGroups: [], // 互斥选项组
  // 已删除常用参数字段
  commonCommands: [], // 常用完整命令
  symbols: [] // 符号（替代原来的separators）
})

const detectedParameters = ref([])

// 记住上次选择的分类
const lastUsedCategory = ref('全部')

// 方法
const analyzeCommand = () => {
  const command = form.value.command
  const regex = /\{\{([^}]+)\}\}/g
  const params = []
  let match

  while ((match = regex.exec(command)) !== null) {
    const paramName = match[1].trim()
    if (paramName && !params.includes(paramName)) {
      params.push(paramName)
    }
  }

  // 过滤掉已存在的参数
  const existingParamNames = form.value.parameters.map(p => p.name)
  detectedParameters.value = params.filter(param => !existingParamNames.includes(param))
}

const addParameter = (paramName) => {
  if (!form.value.parameters.find(p => p.name === paramName)) {
    form.value.parameters.push({
      name: paramName,
      description: '',
      required: false,
      defaultValue: '',
      separator: ' ',  // 默认为空格
      repeatable: false
    })
  }
  
  // 从检测到的参数中移除
  const index = detectedParameters.value.indexOf(paramName)
  if (index > -1) {
    detectedParameters.value.splice(index, 1)
  }
}

const addAllDetectedParams = () => {
  detectedParameters.value.forEach(param => {
    addParameter(param)
  })
}

const addCustomParameter = () => {
  form.value.parameters.push({
    name: '',               // 参数名称
    commonValues: [],       // 常用参数值数组
    defaultValueIndex: -1,  // 默认值索引（-1表示无默认值）
    required: false,        // 是否必带（默认为可选）
    repeatable: false       // 是否可重复
  })
}

const removeParameter = (index) => {
  form.value.parameters.splice(index, 1)
  
  // 更新默认参数选择
  if (defaultCommandParam.value === index) {
    defaultCommandParam.value = null
  } else if (defaultCommandParam.value > index) {
    defaultCommandParam.value -= 1
  }
  
  analyzeCommand() // 重新分析以更新检测到的参数
}

// 添加常用参数值
const addCommonValue = (paramIndex) => {
  if (!form.value.parameters[paramIndex].commonValues) {
    form.value.parameters[paramIndex].commonValues = []
  }
  
  form.value.parameters[paramIndex].commonValues.push({
    value: ''
  })
  
  // 不自动设置默认值，保持用户的选择
}

// 删除常用参数值
const removeCommonValue = (paramIndex, valueIndex) => {
  const param = form.value.parameters[paramIndex]
  param.commonValues.splice(valueIndex, 1)
  
  // 调整默认值索引
  if (param.defaultValueIndex === valueIndex) {
    // 如果删除的是默认值，设置为无默认值
    param.defaultValueIndex = -1
  } else if (param.defaultValueIndex > valueIndex) {
    // 如果删除的值在默认值之前，调整索引
    param.defaultValueIndex--
  }
  
  // 如果没有值了，设置为无默认值
  if (param.commonValues.length === 0) {
    param.defaultValueIndex = -1
  }
}

// 自动生成命令名称
const generateCommandName = (command) => {
  if (!command.trim()) return '新建命令模板'
  
  // 提取命令的主要部分作为名称
  const parts = command.trim().split(' ')
  if (parts.length === 0) return '新建命令模板'
  
  // 处理常见命令格式
  const mainCommand = parts[0]
  const subCommand = parts[1]
  
  // 常见命令映射
  const commandMap = {
    'git': {
      'status': 'Git 状态查看',
      'add': 'Git 添加文件',
      'commit': 'Git 提交',
      'push': 'Git 推送',
      'pull': 'Git 拉取',
      'checkout': 'Git 切换分支',
      'branch': 'Git 分支操作',
      'clone': 'Git 克隆仓库',
      'init': 'Git 初始化'
    },
    'docker': {
      'ps': 'Docker 容器列表',
      'run': 'Docker 运行容器',
      'stop': 'Docker 停止容器',
      'start': 'Docker 启动容器',
      'build': 'Docker 构建镜像',
      'pull': 'Docker 拉取镜像',
      'push': 'Docker 推送镜像'
    },
    'npm': {
      'install': 'NPM 安装包',
      'run': 'NPM 运行脚本',
      'start': 'NPM 启动项目',
      'build': 'NPM 构建项目',
      'test': 'NPM 运行测试'
    }
  }
  
  if (commandMap[mainCommand] && commandMap[mainCommand][subCommand]) {
    return commandMap[mainCommand][subCommand]
  }
  
  // 如果没有匹配，使用首字母大写的命令名
  if (subCommand) {
    return `${mainCommand.charAt(0).toUpperCase() + mainCommand.slice(1)} ${subCommand}`
  } else {
    return mainCommand.charAt(0).toUpperCase() + mainCommand.slice(1) + ' 命令'
  }
}

const resetForm = () => {
  form.value = {
    commandName: '',
    mainCommand: '',
    subcommands: [],
    command: '',
    description: '',
    usage: '',
    category: lastUsedCategory.value,
    tags: [],
    parameters: [],
    options: [],
    // commonParameters已删除
    commonCommands: [],
    symbols: [],
    commandParameterSeparator: ' ',  // 命令与参数间分隔符，默认空格
    symbols: [] // 符号
  }
  detectedParameters.value = []
}

// 已删除复杂的模板构建器，简化为直接创建命令模板

// 已移除旧的通用构建器相关函数，使用新的模板构建器

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const saveCommand = async () => {
  // 创建命令模板数据
  const templateData = {
    name: form.value.mainCommand.trim(),
    category: form.value.category || 'custom',
    tags: form.value.tags || [],
    subcommands: form.value.subcommands || [],
    options: form.value.options || [],
    parameters: form.value.parameters || [],
    commonCommands: form.value.commonCommands || []
  }
  
  try {
    const commandData = {
      id: isEditing.value ? props.editingCommand.id : undefined,
      name: form.value.commandName.trim(),
      description: form.value.description || `${form.value.commandName.trim()} 命令模板`,
      category: form.value.category,
      tags: form.value.tags,
      templateData: templateData,
      isUserCreated: true,
      isSystemExample: false,
      created: isEditing.value ? props.editingCommand.created : new Date(),
      updated: new Date()
    }
    
    if (isEditing.value) {
      commandStore.updateCommand(props.editingCommand.id, commandData)
      showSaveSuccess(commandData.name, true)
    } else {
      commandStore.addCommand(commandData)
      showSaveSuccess(commandData.name, false)
    }
    
    emit('saved')
    return commandData
  } catch (error) {
    ElMessage.error(error.message)
    throw error
  }

  // 传统模式
  // 如果分类是新的（不存在），先创建分类
  if (form.value.category && !categoryStatus.value.exists) {
    await handleCreateCategory(form.value.category)
  }

  const commandData = {
    name: form.value.commandName.trim() || generateCommandName(form.value.command.trim()),
    commandName: form.value.commandName.trim(),
    mainCommand: form.value.mainCommand.trim(),
    subcommands: form.value.subcommands.filter(s => s.name.trim()), // 过滤空子命令
    description: form.value.description.trim(),
    usage: form.value.usage.trim(),
    command: form.value.command.trim(),
    category: form.value.category || 'dev-tools', // 如果没有选择分类，默认为开发工具
    tags: form.value.tags,
    parameters: form.value.parameters.filter(p => p.name.trim()).map((param, index) => ({
      ...param,
      isDefault: defaultCommandParam.value === index
    })), // 过滤空参数并设置默认参数
    options: form.value.options.filter(o => o.shortName.trim() || o.longName.trim()), // 过滤空选项
    // commonParameters已删除
    commonCommands: form.value.commonCommands.filter(c => c.name.trim()), // 过滤空常用命令
    symbols: form.value.symbols.filter(s => s.symbol.trim()) // 过滤空符号
  }

  try {
  if (isEditing.value) {
    commandStore.updateCommand(props.editingCommand.id, commandData)
    showSaveSuccess(commandData.name, true)
  } else {
    commandStore.addCommand(commandData)
    showSaveSuccess(commandData.name, false)
  }

  emit('saved')
  return commandData
  } catch (error) {
    ElMessage.error(error.message)
    throw error
  }
}

const validateForm = () => {
  // 命令模板的验证
  if (!form.value.commandName.trim()) {
    ElMessage.warning('请输入命令模板名称')
    return false
  }
  if (!form.value.mainCommand.trim()) {
    ElMessage.warning('请输入主命令')
    return false
  }
  return true
}

const handleConfirm = async () => {
  if (!validateForm()) return
  try {
    await saveCommand()
  handleClose()
  } catch (error) {
    // 错误已在saveCommand中处理，这里不需要额外处理
  }
}

const handleConfirmAndContinue = () => {
  if (!validateForm()) return
  const savedCommand = saveCommand()
  // 保留当前分类和标签，重置其他字段
  const currentCategory = form.value.category
  const currentTags = [...form.value.tags]
  resetForm()
  form.value.category = currentCategory
  form.value.tags = currentTags
}

// 处理分类下拉框显示/隐藏
const handleCategoryDropdownToggle = (visible) => {
  // 统一由@create事件处理新分类创建，避免重复触发
}

// 新分类创建状态
const showParentCategoryDialog = ref(false)
const newCategoryName = ref('')
const selectedParentCategory = ref('')

// 创建新分类
const handleCreateCategory = async (categoryName) => {
  // 检查输入的分类名是否为空
  if (!categoryName || !categoryName.trim()) {
    ElMessage.warning('分类名称不能为空')
    return
  }
  
  // 检查分类是否已存在（忽略大小写和空格）
  const trimmedName = categoryName.trim()
  const existingCategory = commandStore.categories.find(c => 
    c.name.trim().toLowerCase() === trimmedName.toLowerCase()
  )
  
  if (existingCategory) {
    ElMessage.warning(`分类 "${trimmedName}" 已存在`)
    return
  }

  // 根据选择的父分类创建新分类
  try {
    let newCategory
    
    if (selectedParentCategory.value) {
      // 有父分类，创建子分类
      const parentCategory = commandStore.categories.find(cat => cat.id === selectedParentCategory.value)
      newCategory = {
        name: trimmedName,
        parentId: selectedParentCategory.value,
        level: parentCategory.level + 1,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      }
    } else {
      // 无父分类，创建一级分类
      newCategory = {
        name: trimmedName,
        parentId: null,
        level: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      }
    }

    const createdCategory = await commandStore.addCategory(newCategory)
    
    // 更新表单的分类值为新分类的ID
    form.value.category = createdCategory.id
    
    // 清空父分类选择
    selectedParentCategory.value = ''
    
    const levelText = selectedParentCategory.value ? `${newCategory.level + 1}级分类` : '一级分类'
    ElMessage.success(`已创建${levelText}: ${trimmedName}`)
  } catch (error) {
    ElMessage.error('创建分类失败: ' + error.message)
  }
}

// 确认创建新分类
const confirmCreateCategory = async () => {
  try {
    const parentCategory = selectedParentCategory.value ? 
      commandStore.categories.find(c => c.id === selectedParentCategory.value) : null
    
  const newCategory = {
      name: newCategoryName.value,
      parentId: parentCategory ? parentCategory.id : null,
      level: parentCategory ? parentCategory.level + 1 : 0,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    }

    const createdCategory = await commandStore.addCategory(newCategory)
  
  // 更新表单的分类值为新分类的ID
    form.value.category = createdCategory.id
    
    // 关闭对话框
    showParentCategoryDialog.value = false
    ElMessage.success(`已创建新分类: ${newCategoryName.value}`)
  } catch (error) {
    ElMessage.error('创建分类失败: ' + error.message)
  }
}

// 取消创建分类
const cancelCreateCategory = () => {
  showParentCategoryDialog.value = false
  newCategoryName.value = ''
  selectedParentCategory.value = ''
}





// 原始数据（用于对比）
const originalData = ref(null)

// 计算属性：检测字段变化
const hasChanges = computed(() => {
  if (!isEditing.value || !originalData.value) return false
  
  const original = originalData.value
  const current = form.value
  
  return (
    original.commandName !== current.commandName ||
    original.command !== current.command ||
    original.description !== current.description ||
    original.usage !== current.usage ||
    original.category !== current.category ||
    JSON.stringify(original.tags) !== JSON.stringify(current.tags) ||
    JSON.stringify(original.parameters) !== JSON.stringify(current.parameters) ||
    JSON.stringify(original.options) !== JSON.stringify(current.options) ||
    // commonParameters已删除
    JSON.stringify(original.commonCommands) !== JSON.stringify(current.commonCommands) ||
          JSON.stringify(original.symbols) !== JSON.stringify(current.symbols)
  )
})

// 获取字段变化状态
const getFieldChanges = () => {
  if (!isEditing.value || !originalData.value) return {}
  
  const original = originalData.value
  const current = form.value
  
  return {
    commandName: original.commandName !== current.commandName,
    mainCommand: original.mainCommand !== current.mainCommand,
    subcommands: JSON.stringify(original.subcommands) !== JSON.stringify(current.subcommands),
    command: original.command !== current.command,
    description: original.description !== current.description,
    usage: original.usage !== current.usage,
    category: original.category !== current.category,
    tags: JSON.stringify(original.tags) !== JSON.stringify(current.tags),
    parameters: JSON.stringify(original.parameters) !== JSON.stringify(current.parameters),
    options: JSON.stringify(original.options) !== JSON.stringify(current.options),
    // commonParameters已删除
    commonCommands: JSON.stringify(original.commonCommands) !== JSON.stringify(current.commonCommands),
          symbols: JSON.stringify(original.symbols) !== JSON.stringify(current.symbols)
  }
}

// 获取原始分类名称
const getOriginalCategoryName = () => {
  if (!originalData.value || !originalData.value.category) return '无'
  const category = commandStore.categories.find(cat => cat.id === originalData.value.category)
  return category ? category.name : '未知分类'
}

// 获取原始标签显示
const getOriginalTagsDisplay = () => {
  if (!originalData.value || !originalData.value.tags || originalData.value.tags.length === 0) return '无'
  return originalData.value.tags.join(', ')
}

// 获取原始参数显示
const getOriginalParametersDisplay = () => {
  if (!originalData.value || !originalData.value.parameters || originalData.value.parameters.length === 0) return '无参数'
  
  return originalData.value.parameters.map(param => {
    let typeDisplay = ''
    switch (param.type) {
      case ParameterType.REQUIRED:
        typeDisplay = ' (必选)'
        break
      case ParameterType.OPTIONAL:
        typeDisplay = ' (可选)'
        break
    }
    
    const defaultValue = param.defaultValue ? ` [默认: ${param.defaultValue}]` : ''
    const description = param.description ? ` - ${param.description}` : ''
    return `${param.name}${typeDisplay}${defaultValue}${description}`
  }).join('\n')
}

// 恢复单个字段到原始值
const restoreField = (fieldName) => {
  if (!originalData.value) return
  
  switch (fieldName) {
    case 'commandName':
      form.value.commandName = originalData.value.commandName
      break
    case 'mainCommand':
      form.value.mainCommand = originalData.value.mainCommand
      break
    case 'subcommands':
      form.value.subcommands = originalData.value.subcommands ? 
        originalData.value.subcommands.map(sub => ({ ...sub })) : []
      break
    case 'command':
      form.value.command = originalData.value.command
      analyzeCommand() // 重新分析命令以更新参数
      break
    case 'description':
      form.value.description = originalData.value.description
      break
    case 'usage':
      form.value.usage = originalData.value.usage
      break
    case 'category':
      form.value.category = originalData.value.category
      break
    case 'tags':
      form.value.tags = [...originalData.value.tags]
      break
    case 'parameters':
      form.value.parameters = originalData.value.parameters ? 
        originalData.value.parameters.map(param => ({ ...param })) : []
      break
    case 'options':
      form.value.options = originalData.value.options ? 
        originalData.value.options.map(option => ({ ...option })) : []
      break
    // commonParameters case已删除
    case 'commonCommands':
      form.value.commonCommands = originalData.value.commonCommands ? 
        originalData.value.commonCommands.map(cmd => ({ ...cmd })) : []
      break
          case 'symbols':
        form.value.symbols = originalData.value.symbols ?
          originalData.value.symbols.map(sym => ({ ...sym })) : []
      break
    case 'symbols':
      form.value.symbols = originalData.value.symbols ? 
        originalData.value.symbols.map(symbol => ({ ...symbol })) : []
      break
  }
  
  // 显示恢复成功提示
  ElMessage.success(`${getFieldDisplayName(fieldName)}已恢复到原始值`)
}

// 获取字段显示名称
const getFieldDisplayName = (fieldName) => {
  const fieldNames = {
    commandName: '命令名',
    mainCommand: '主命令',
    subcommands: '子命令',
    command: '完整命令',
    description: '作用描述',
    usage: '使用说明',
    category: '分类',
    tags: '标签',
    parameters: '参数设置',
    options: '命令选项',
    // commonParameters已删除
    commonCommands: '常用命令',
    symbols: '符号',
    symbols: '符号'
  }
  return fieldNames[fieldName] || fieldName
}

// 获取原始选项显示
const getOriginalOptionsDisplay = () => {
  if (!originalData.value || !originalData.value.options || originalData.value.options.length === 0) return '无选项'
  
  return originalData.value.options.map(option => {
    const names = [option.shortName, option.longName].filter(Boolean)
    const nameDisplay = names.join(' / ') || '未命名选项'
    
    let typeDisplay = ''
    switch (option.type) {
      case ParameterType.REQUIRED:
        typeDisplay = ' (必选)'
        break
      case ParameterType.OPTIONAL:
        typeDisplay = ' (可选)'
        break
      case ParameterType.MUTEX:
        typeDisplay = ' (互斥)'
        break
    }
    
    const hasValue = option.hasValue ? ' 需要参数值' : ''
    const description = option.description ? ` - ${option.description}` : ' - 无描述'
    let params = ''
    if (option.hasValue && option.parameters && option.parameters.length > 0) {
      params = '\n  参数: ' + option.parameters.map(p => {
        let pTypeDisplay = ''
        switch (p.type) {
          case ParameterType.REQUIRED:
            pTypeDisplay = ' (必选)'
            break
          case ParameterType.OPTIONAL:
            pTypeDisplay = ' (可选)'
            break
        }
        const pDesc = p.description ? ` - ${p.description}` : ''
        return `${p.name}${pTypeDisplay}${pDesc}`
      }).join(', ')
    }
    return `${nameDisplay}${typeDisplay}${hasValue}${description}${params}`
  }).join('\n')
}

// getOriginalCommonParamsDisplay函数已删除

// 获取原始常用命令显示
const getOriginalCommonCommandsDisplay = () => {
  if (!originalData.value || !originalData.value.commonCommands || originalData.value.commonCommands.length === 0) return '无命令示例'
  
  return originalData.value.commonCommands.map(cmd => {
    return `${cmd.name}:\n${cmd.command}\n${cmd.description || '无说明'}`
  }).join('\n\n')
}

// 获取原始子命令显示
const getOriginalSubcommandsDisplay = () => {
  if (!originalData.value || !originalData.value.subcommands || originalData.value.subcommands.length === 0) return '无子命令'
  
  return originalData.value.subcommands.map(sub => {
    const typeText = sub.type === ParameterType.REQUIRED ? '必选' : '可选'
    return `${sub.name} (${typeText}) - ${sub.description || '无描述'}`
  }).join('\n')
}



// 添加选项设置对话框
const showAddOptionDialog = ref(false)

// 参数值类型枚举
const ParameterValueType = {
  REQUIRED: 'required',    // 必带参数
  OPTIONAL: 'optional',    // 可选参数
  NONE: 'none'            // 不可带参数
}

const newOptionForm = ref({
    shortName: '',
    longName: '',
    description: '',
    type: ParameterType.OPTIONAL,
  valueType: ParameterValueType.OPTIONAL, // 默认可选参数
    parameterName: '',  // 参数名称
    parameters: []
  })

// 默认参数管理
const defaultOptionParam = ref(null) // 新选项表单中的默认参数索引
const defaultCommandParam = ref(null) // 命令级默认参数索引

// 初始化命令级默认参数选择
watch(() => form.value.parameters, (newParams) => {
  if (newParams && newParams.length > 0) {
    const defaultIndex = newParams.findIndex(param => param.isDefault)
    defaultCommandParam.value = defaultIndex !== -1 ? defaultIndex : null
  } else {
    defaultCommandParam.value = null
  }
}, { immediate: true, deep: true })

// 显示添加选项对话框
const addOption = () => {
  // 重置表单
  newOptionForm.value = {
    shortName: '',
    longName: '',
    description: '',
    type: ParameterType.OPTIONAL,        // 默认可选选项
    valueType: ParameterValueType.OPTIONAL, // 默认可选参数
    commandSeparator: ' ',              // 命令与选项间分隔符，默认空格
    optionSeparator: ' ',               // 选项与参数间分隔符，默认空格
    parameterName: '',                  // 参数名称
    parameters: []
  }
  defaultOptionParam.value = null // 重置默认参数选择
  currentEditingIndex.value = -1
  showAddOptionDialog.value = true
}

// 检查是否需要显示参数配置
const shouldShowParameterConfig = computed(() => {
  return newOptionForm.value.valueType === ParameterValueType.REQUIRED || 
         newOptionForm.value.valueType === ParameterValueType.OPTIONAL
})

// 获取分隔符的描述
const getSeparatorDescription = (separator) => {
  if (!separator || separator === ' ') {
    return '当前：空格'
  }
  const separatorSymbol = symbolsByCategory.value.separator?.find(s => s.symbol === separator)
  if (separatorSymbol) {
    return `当前：${separatorSymbol.name}（${separator}）`
  }
  return `当前：${separator}`
}

// 命令与选项间分隔符描述
const commandSeparatorDescription = computed(() => {
  return getSeparatorDescription(newOptionForm.value.commandSeparator)
})

// 选项与参数间分隔符描述  
const optionSeparatorDescription = computed(() => {
  return getSeparatorDescription(newOptionForm.value.optionSeparator)
})

// 检查选项是否应该显示参数
const shouldShowParametersForOption = (option) => {
  // 兼容旧数据：如果有hasValue字段，使用它；否则使用valueType
  if (option.hasValue !== undefined) {
    return option.hasValue && option.parameters && option.parameters.length > 0
  }
  
  if (option.valueType) {
    const hasValueType = option.valueType === ParameterValueType.REQUIRED || 
                        option.valueType === ParameterValueType.OPTIONAL
    return hasValueType && option.parameters && option.parameters.length > 0
  }
  
  return false
}

// 获取参数值类型的显示标签
const getValueTypeLabel = (option) => {
  // 兼容旧数据
  if (option.hasValue !== undefined) {
    return option.hasValue ? '需要参数' : '无参数'
  }
  
  if (option.valueType) {
    switch (option.valueType) {
      case ParameterValueType.REQUIRED:
        return '必带参数'
      case ParameterValueType.OPTIONAL:
        return '可选参数'
      case ParameterValueType.NONE:
        return '不可带参数'
      default:
        return '未知'
    }
  }
  
  return '不可带参数'
}

// 获取参数值类型的标签颜色
const getValueTypeTagType = (option) => {
  // 兼容旧数据
  if (option.hasValue !== undefined) {
    return option.hasValue ? 'warning' : ''
  }
  
  if (option.valueType) {
    switch (option.valueType) {
      case ParameterValueType.REQUIRED:
        return 'warning'
      case ParameterValueType.OPTIONAL:
        return 'success'
      case ParameterValueType.NONE:
        return ''
      default:
        return ''
    }
  }
  
  return ''
}

// 新选项表单的参数管理
const addNewOptionParameter = () => {
  if (!newOptionForm.value.parameters) {
    newOptionForm.value.parameters = []
  }
  newOptionForm.value.parameters.push({
    commonValues: [],   // 常用参数值数组
    defaultValue: ''    // 默认参数值（从常用值中选择）
  })
}

const removeNewOptionParameter = (index) => {
  newOptionForm.value.parameters.splice(index, 1)
  
  // 更新默认参数选择
  if (defaultOptionParam.value === index) {
    defaultOptionParam.value = null
  } else if (defaultOptionParam.value > index) {
    defaultOptionParam.value -= 1
  }
}

// 选项参数的常用值管理
const addOptionCommonValue = (paramIndex) => {
  if (!newOptionForm.value.parameters[paramIndex].commonValues) {
    newOptionForm.value.parameters[paramIndex].commonValues = []
  }
  newOptionForm.value.parameters[paramIndex].commonValues.push('')
}

const removeOptionCommonValue = (paramIndex, valueIndex) => {
  const param = newOptionForm.value.parameters[paramIndex]
  const removedValue = param.commonValues[valueIndex]
  
  // 删除常用值
  param.commonValues.splice(valueIndex, 1)
  
  // 如果删除的值是默认值，清空默认值选择
  if (param.defaultValue === removedValue) {
    param.defaultValue = ''
  }
}

// 设置默认参数值
const setDefaultValue = (paramIndex, valueIndex, checked) => {
  const param = newOptionForm.value.parameters[paramIndex]
  const currentValue = param.commonValues[valueIndex]
  
  if (checked) {
    // 设置为默认值（自动取消之前的默认值）
    param.defaultValue = currentValue
  } else {
    // 取消默认值
    param.defaultValue = ''
  }
}

// 编辑已有选项
const editOption = (optionIndex) => {
  const option = form.value.options[optionIndex]
  
  // 数据迁移：将旧的hasValue转换为新的valueType
  let valueType = ParameterValueType.NONE
  if (option.hasValue !== undefined) {
    valueType = option.hasValue ? ParameterValueType.REQUIRED : ParameterValueType.NONE
  } else if (option.valueType) {
    valueType = option.valueType
  }
  
  newOptionForm.value = { 
    ...option,
    valueType: valueType,
    commandSeparator: option.commandSeparator || ' ',  // 确保有默认值
    optionSeparator: option.optionSeparator || ' '     // 确保有默认值
  }
  
  // 恢复默认参数选择
  defaultOptionParam.value = null
  if (option.parameters) {
    const defaultIndex = option.parameters.findIndex(param => param.isDefault)
    if (defaultIndex !== -1) {
      defaultOptionParam.value = defaultIndex
    }
  }
  
  currentEditingIndex.value = optionIndex
  showAddOptionDialog.value = true
}

const currentEditingIndex = ref(-1)

// 确认添加选项
const confirmAddOption = () => {
  // 验证必填字段
  if (!newOptionForm.value.shortName && !newOptionForm.value.longName) {
    ElMessage.warning('请填写短选项名或长选项名')
    return
  }
  

  
  if (!form.value.options) {
    form.value.options = []
  }
  
  // 清理数据：确保只使用新的数据结构
  const cleanedOption = { ...newOptionForm.value }
  delete cleanedOption.hasValue // 移除旧字段
  
  // 处理默认参数设置
  if (cleanedOption.parameters) {
    cleanedOption.parameters.forEach((param, index) => {
      param.isDefault = (defaultOptionParam.value === index)
    })
  }

  if (currentEditingIndex.value !== -1) {
    // 编辑模式：更新已有选项
    form.value.options[currentEditingIndex.value] = cleanedOption
    ElMessage.success('选项更新成功')
    currentEditingIndex.value = -1
  } else {
    // 添加模式：添加新选项
    form.value.options.push(cleanedOption)
    ElMessage.success('选项添加成功')
  }
  
  showAddOptionDialog.value = false
}

// 互斥选项管理
const showMutexOptionDialog = ref(false)
const selectedOption1 = ref('')
const selectedOption2 = ref('')

// 获取可用于互斥的选项（只能选择可选选项）
const availableOptionsForMutex = computed(() => {
  if (!form.value.options) return []
  return form.value.options
    .map((opt, index) => ({ ...opt, index }))
    .filter(opt => opt.type === ParameterType.OPTIONAL) // 只能选择可选选项
    .filter(opt => opt.shortName || opt.longName) // 必须有名称
    .filter(opt => !isOptionInMutexGroup(index)) // 不能选择已经在互斥组中的选项
})

// 检查选项是否在互斥组中
const isOptionInMutexGroup = (optionIndex) => {
  if (!form.value.mutexGroups) return false
  return form.value.mutexGroups.some(group => 
    group.optionIndexes.includes(optionIndex)
  )
}

// 获取所有普通选项（不在互斥组中的选项）
const regularOptions = computed(() => {
  if (!form.value.options) return []
  return form.value.options
    .map((opt, index) => ({ ...opt, originalIndex: index }))
    .filter((opt, index) => !isOptionInMutexGroup(index))
})

// 获取互斥组显示数据
const mutexGroupsDisplay = computed(() => {
  if (!form.value.mutexGroups || !form.value.options) return []
  
  return form.value.mutexGroups.map((group, groupIndex) => ({
    ...group,
    groupIndex,
    options: group.optionIndexes.map(index => ({
      ...form.value.options[index],
      originalIndex: index
    }))
  }))
})

// 显示互斥选项配对对话框
const showMutexPairingDialog = () => {
  selectedOption1.value = ''
  selectedOption2.value = ''
  showMutexOptionDialog.value = true
}

// 确认创建互斥选项对
const confirmMutexPairing = () => {
  if (!selectedOption1.value || !selectedOption2.value) {
    ElMessage.warning('请选择两个不同的选项进行互斥配对')
    return
  }
  
  if (selectedOption1.value === selectedOption2.value) {
    ElMessage.warning('不能选择相同的选项')
    return
  }
  
  // 初始化互斥组数组
  if (!form.value.mutexGroups) {
    form.value.mutexGroups = []
  }
  
  // 创建新的互斥组
  const option1Index = parseInt(selectedOption1.value)
  const option2Index = parseInt(selectedOption2.value)
  
  form.value.mutexGroups.push({
    id: `mutex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `互斥组 ${form.value.mutexGroups.length + 1}`,
    optionIndexes: [option1Index, option2Index]
  })
  
  showMutexOptionDialog.value = false
  ElMessage.success('互斥选项对创建成功')
}

// 添加互斥选项对（保持向后兼容）
const addMutexOptionPair = () => {
  showMutexPairingDialog()
}

// 常用参数相关代码已删除

// showCommonParamsModal函数已删除

// confirmAddCommonParams函数已删除

// 获取已添加的选项和参数
const getExistingOptionsAndParams = computed(() => {
  const groups = {
    '选项': [],
    '命令级参数': []
  }
  
  // 添加已有选项
  if (form.value.options && form.value.options.length > 0) {
    form.value.options.forEach((option, optionIndex) => {
      // 添加选项本身
      groups['选项'].push({
        type: 'option',
        name: option.shortName ? `-${option.shortName}` : (option.longName ? `--${option.longName}` : '未命名选项'),
        description: option.description || '无描述',
        data: option,
        sourceIndex: optionIndex,
        paramType: option.type
      })
      
      // 添加选项的参数
      if (option.parameters && option.parameters.length > 0) {
        option.parameters.forEach((param, paramIndex) => {
          groups['选项'].push({
            type: 'option-param',
            name: `${option.shortName ? `-${option.shortName}` : `--${option.longName}`} ${param.name}`,
            description: param.description || '无描述',
            data: param,
            sourceIndex: optionIndex,
            paramIndex: paramIndex,
            paramType: param.type
          })
        })
      }
    })
  }
  
  // 添加命令级参数
  if (form.value.parameters && form.value.parameters.length > 0) {
    form.value.parameters.forEach((param, paramIndex) => {
      groups['命令级参数'].push({
        type: 'command-param',
        name: param.name,
        description: param.description || '无描述',
        data: param,
        sourceIndex: paramIndex,
        paramType: param.type
      })
    })
  }
  
  return groups
})

// 按分类分组常用参数（修改为使用已有选项和参数）
const groupedCommonParams = computed(() => {
  return getExistingOptionsAndParams.value
})

// 过滤掉空的分类
const filteredCommonParams = computed(() => {
  const groups = groupedCommonParams.value
  const filtered = {}
  Object.keys(groups).forEach(category => {
    if (groups[category].length > 0) {
      filtered[category] = groups[category]
    }
  })
  return filtered
})

// 判断是否为默认参数
const isDefaultParam = (param, paramIndex, option) => {
  // 如果参数本身有isDefault标记，使用该标记
  if (param.hasOwnProperty('isDefault')) {
    return param.isDefault
  }
  
  // 否则基于当前的默认参数选择判断
  if (option) {
    // 这是选项的参数，找到选项在当前编辑中的默认参数
    if (currentEditingIndex.value !== -1 && form.value.options[currentEditingIndex.value] === option) {
      return defaultOptionParam.value === paramIndex
    }
    // 对于已保存的选项，检查其parameters中的isDefault
    return false
  } else {
    // 这是命令级参数
    return defaultCommandParam.value === paramIndex
  }
}

// 处理选项参数默认选择变化
const handleDefaultOptionParamChange = (index, checked) => {
  if (checked) {
    defaultOptionParam.value = index
  } else {
    // 如果取消选择当前默认参数，则清空选择
    if (defaultOptionParam.value === index) {
      defaultOptionParam.value = null
    }
  }
}

// 处理命令级参数默认选择变化
const handleDefaultCommandParamChange = (index, checked) => {
  if (checked) {
    defaultCommandParam.value = index
  } else {
    // 如果取消选择当前默认参数，则清空选择
    if (defaultCommandParam.value === index) {
      defaultCommandParam.value = null
    }
  }
}

// 删除互斥组
const removeMutexGroup = (groupIndex) => {
  if (!form.value.mutexGroups) return
  
  // 删除指定的互斥组
  form.value.mutexGroups.splice(groupIndex, 1)
  
  ElMessage.success('互斥组删除成功')
}

const removeOption = (index) => {
  // 从互斥组中移除该选项
  if (form.value.mutexGroups) {
    form.value.mutexGroups.forEach((group, groupIndex) => {
      const optionPosition = group.optionIndexes.indexOf(index)
      if (optionPosition !== -1) {
        group.optionIndexes.splice(optionPosition, 1)
        // 如果互斥组只剩一个选项，删除整个组
        if (group.optionIndexes.length < 2) {
          form.value.mutexGroups.splice(groupIndex, 1)
        }
      }
    })
    
    // 更新互斥组中的选项索引（因为删除选项后索引会变化）
    form.value.mutexGroups.forEach(group => {
      group.optionIndexes = group.optionIndexes.map(idx => 
        idx > index ? idx - 1 : idx
      )
    })
  }
  
  // 移除选项
  form.value.options.splice(index, 1)
}

// 子命令管理
const addSubcommand = () => {
  if (!form.value.subcommands) {
    form.value.subcommands = []
  }
  form.value.subcommands.push({
    name: '',
    description: '',
    type: ParameterType.OPTIONAL
  })
}

const removeSubcommand = (index) => {
  form.value.subcommands.splice(index, 1)
}

// 常用参数管理函数已删除

// 常用命令管理
const addCommonCommand = () => {
  if (!form.value.commonCommands) {
    form.value.commonCommands = []
  }
  form.value.commonCommands.push({
    name: '',
    command: '',
    description: '',
    isDefault: false,
    lastUsed: null,
    usageCount: 0
  })
}

const removeCommonCommand = (index) => {
  form.value.commonCommands.splice(index, 1)
}

// 获取默认命令数量
const getDefaultCommandCount = () => {
  return form.value.commonCommands.filter(cmd => cmd.isDefault).length
}

// 处理默认命令变更
const handleDefaultChange = (index, isDefault) => {
  if (isDefault) {
    // 取消其他命令的默认状态
    form.value.commonCommands.forEach((cmd, i) => {
      if (i !== index) {
        cmd.isDefault = false
      }
    })
  }
}

// 符号管理
const toggleSymbol = (symbolOption, categoryValue) => {
  if (!form.value.symbols) {
    form.value.symbols = []
  }
  
  const existingIndex = form.value.symbols.findIndex(s => 
    s.symbol === symbolOption.symbol && s.category === categoryValue
  )
  
  if (existingIndex >= 0) {
    // 如果已选择，则移除
    form.value.symbols.splice(existingIndex, 1)
  } else {
    // 如果未选择，则添加
    form.value.symbols.push({
      category: categoryValue,
      symbol: symbolOption.symbol,
      name: symbolOption.name,
      description: symbolOption.description
    })
  }
}

const removeSymbolByIndex = (index) => {
  form.value.symbols.splice(index, 1)
}

// 检查符号是否已选择
const isSymbolSelected = (symbolOption) => {
  if (!form.value.symbols) return false
  return form.value.symbols.some(s => s.symbol === symbolOption.symbol)
}

// 根据分类获取符号列表
const getSymbolsByCategory = (category) => {
  if (!category) return []
  return symbolsByCategory.value[category] || []
}

// 获取分类标签
const getCategoryLabel = (categoryValue) => {
  const category = symbolCategories.value.find(c => c.value === categoryValue)
  return category ? category.label : categoryValue
}

// 获取某分类下已选择的符号
const getSelectedSymbolsForCategory = (categoryValue) => {
  if (!form.value.symbols) return []
  return form.value.symbols
    .filter(symbol => symbol.category === categoryValue)
    .map(symbol => symbol.symbol)
}

// 更新某分类下的符号选择
const updateCategorySymbols = (categoryValue, selectedSymbols) => {
  if (!form.value.symbols) {
    form.value.symbols = []
  }
  
  // 移除该分类下所有符号
  form.value.symbols = form.value.symbols.filter(symbol => symbol.category !== categoryValue)
  
  // 添加新选择的符号
  const categorySymbols = getSymbolsByCategory(categoryValue)
  selectedSymbols.forEach(symbolChar => {
    const symbolOption = categorySymbols.find(s => s.symbol === symbolChar)
    if (symbolOption) {
      form.value.symbols.push({
        category: categoryValue,
        symbol: symbolOption.symbol,
        name: symbolOption.name,
        description: symbolOption.description
      })
    }
  })
}

// 获取原始符号显示
const getOriginalSymbolsDisplay = () => {
  if (!originalData.value || !originalData.value.symbols || originalData.value.symbols.length === 0) {
    // 兼容旧的separators字段
    if (originalData.value && originalData.value.separators && originalData.value.separators.length > 0) {
  return originalData.value.separators.map(sep => {
    return `${sep.symbol}: ${sep.description || '无说明'} (示例: ${sep.example || '无'})`
      }).join('\n')
    }
    return '无符号'
  }
  
  return originalData.value.symbols.map(symbol => {
    const categoryLabel = symbolCategories.value.find(cat => cat.value === symbol.category)?.label || symbol.category
    const description = symbol.customDescription || 
      getSymbolsByCategory(symbol.category).find(s => s.symbol === symbol.symbol)?.description || '无说明'
    return `[${categoryLabel}] ${symbol.symbol}: ${description} (示例: ${symbol.example || '无'})`
  }).join('\n')
}

// 监听命令内容变化
watch(() => form.value.command, () => {
  analyzeCommand()
})

// 监听编辑命令变化
watch(() => props.editingCommand, (newCommand) => {
  if (newCommand) {
    const commandData = {
      commandName: newCommand.commandName || newCommand.name || '',
      mainCommand: newCommand.mainCommand || newCommand.baseCommand || '', // 兼容旧数据
      subcommands: newCommand.subcommands ? [...newCommand.subcommands] : [],
      command: newCommand.command,
      description: newCommand.description,
      usage: newCommand.usage || '',
      category: newCommand.category,
      tags: [...(newCommand.tags || [])],
      parameters: newCommand.parameters ? [...newCommand.parameters] : [],
      options: newCommand.options ? [...newCommand.options] : [],
      // commonParameters已删除
      commonCommands: newCommand.commonCommands ? [...newCommand.commonCommands] : [],
              symbols: newCommand.symbols ? [...newCommand.symbols] : [],
      commandParameterSeparator: newCommand.commandParameterSeparator || ' '  // 确保有默认值
    }
    
    form.value = { ...commandData }
    originalData.value = { ...commandData } // 保存原始数据
    analyzeCommand()
  } else {
    resetForm()
    originalData.value = null
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
/* ===== 统一命令模板创建表单样式 ===== */

/* 主容器样式 */
.command-form {
  padding: var(--el-dialog-padding-primary);
  background: var(--el-bg-color-page);
}

/* 表单区块统一样式 */
.form-section {
  margin-bottom: var(--el-spacing-xl);
  padding: var(--el-spacing-lg);
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: all var(--el-transition-duration);
  
  &:hover {
    border-color: var(--el-border-color-light);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
  
  .section-title {
    margin: 0 0 var(--el-spacing-lg) 0;
    padding: 0 0 var(--el-spacing-sm) 0;
    font-size: var(--el-font-size-large);
    font-weight: var(--el-font-weight-bold);
    color: var(--el-color-primary);
    border-bottom: 2px solid var(--el-color-primary-light-8);
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
    
    .info-icon {
      color: var(--el-color-info);
      cursor: help;
      transition: color var(--el-transition-duration);
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
    
    .changed-indicator {
      color: var(--el-color-warning);
      font-size: var(--el-font-size-small);
      font-weight: 500;
      padding: 2px 8px;
      background: var(--el-color-warning-light-9);
      border-radius: var(--el-border-radius-small);
      border: 1px solid var(--el-color-warning-light-7);
    }
  }
  
  .section-description {
    margin-bottom: var(--el-spacing-lg);
    padding: var(--el-spacing-md);
    background: var(--el-color-info-light-9);
    border-left: 4px solid var(--el-color-info);
    border-radius: 0 var(--el-border-radius-small) var(--el-border-radius-small) 0;
    color: var(--el-color-info-dark-2);
    font-size: var(--el-font-size-small);
    line-height: 1.6;
  }
}

/* 表单行统一样式 */
.form-row {
  display: flex;
  gap: var(--el-spacing-lg);
  margin-bottom: var(--el-spacing-lg);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .form-group {
    flex: 1;
  }
}

/* 表单组统一样式 */
.form-group {
  margin-bottom: var(--el-spacing-lg);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .form-label {
    display: flex;
    align-items: center;
    font-size: var(--el-font-size-base);
    font-weight: var(--el-font-weight-primary);
    margin-bottom: var(--el-spacing-sm);
    color: var(--el-text-color-primary);
    
    .required {
      color: var(--el-color-danger);
      margin-left: 2px;
    }
    
    .changed-indicator {
      color: var(--el-color-warning);
      font-size: var(--el-font-size-small);
      font-weight: 500;
      margin-left: var(--el-spacing-sm);
      padding: 1px 6px;
      background: var(--el-color-warning-light-9);
      border-radius: var(--el-border-radius-small);
      border: 1px solid var(--el-color-warning-light-7);
    }
  }
  
  /* 输入框统一样式 */
  .el-input,
  .el-select,
  .el-textarea {
    .el-input__wrapper,
    .el-textarea__inner {
      border-radius: var(--el-border-radius-small);
      transition: all var(--el-transition-duration);
      
      &:hover {
        border-color: var(--el-color-primary-light-5);
      }
      
      &:focus-within {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
      }
    }
  }
  
  /* 字段变更状态样式 */
  &.field-changed {
    .el-input__wrapper,
    .el-textarea__inner {
      border-color: var(--el-color-warning-light-5);
      background-color: var(--el-color-warning-light-9);
    }
  }
}

/* 对比信息统一样式 */
.comparison-info {
  margin-top: var(--el-spacing-sm);
  padding: var(--el-spacing-sm);
  background: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  border-radius: var(--el-border-radius-small);
  
  .original-value {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
    
    .label {
      font-size: var(--el-font-size-small);
      color: var(--el-color-info-dark-2);
      font-weight: 500;
      white-space: nowrap;
    }
    
    .original-text,
    .original-common-commands,
    .original-subcommands,
    .original-symbols {
      flex: 1;
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-regular);
      background: var(--el-bg-color);
      padding: var(--el-spacing-xs) var(--el-spacing-sm);
      border-radius: var(--el-border-radius-small);
      border: 1px solid var(--el-border-color-lighter);
      max-height: 60px;
      overflow-y: auto;
    }
    
    .restore-btn {
      color: var(--el-color-primary);
      font-size: var(--el-font-size-small);
      padding: var(--el-spacing-xs) var(--el-spacing-sm);
      
      &:hover {
        color: var(--el-color-primary-dark-2);
        background: var(--el-color-primary-light-9);
      }
    }
  }
}

/* 按钮统一样式 */
.el-button {
      border-radius: var(--el-border-radius-small);
  font-weight: 500;
  transition: all var(--el-transition-duration);
  
  &.is-text {
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }
  
  &[type="primary"] {
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
    }
  }
  
  &[type="danger"] {
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
    }
  }
}

/* 帮助提示统一样式 */
.command-help,
.separator-hint {
  margin-top: var(--el-spacing-md);
  padding: var(--el-spacing-md);
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: var(--el-border-radius-small);
  
  .help-item,
  .hint-text {
    font-size: var(--el-font-size-small);
    color: var(--el-color-success-dark-2);
    line-height: 1.6;
    margin-bottom: var(--el-spacing-xs);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    code {
      padding: 2px 6px;
      background: var(--el-color-success-light-8);
      border-radius: var(--el-border-radius-small);
      font-family: var(--el-font-family-mono);
      color: var(--el-color-success-dark-2);
    }
  }
}

/* 空状态统一样式 */
.empty-state {
  padding: var(--el-spacing-lg);
  text-align: center;
  background: var(--el-color-info-light-9);
  border: 2px dashed var(--el-color-info-light-5);
  border-radius: var(--el-border-radius-base);
  transition: all var(--el-transition-duration);
      
      &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
  
  .el-empty {
    .el-empty__description {
      color: var(--el-text-color-secondary);
    font-size: var(--el-font-size-small);
    }
  }
}

/* 动作按钮容器统一样式 */
.parameters-actions,
.option-buttons {
      display: flex;
      gap: var(--el-spacing-sm);
  align-items: center;
  padding: var(--el-spacing-md) 0;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: var(--el-spacing-lg);
}

/* 列表项统一样式 */
.parameter-item,
.command-example-item,
.subcommand-item {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
        border-radius: var(--el-border-radius-base);
  margin-bottom: var(--el-spacing-md);
  transition: all var(--el-transition-duration);
    
    &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: var(--el-spacing-md);
  }
  
  .form-section {
    padding: var(--el-spacing-md);
    margin-bottom: var(--el-spacing-lg);
  }
  
  .command-form {
    padding: var(--el-spacing-md);
  }
}

:deep(.el-select) {
  width: 100%;
}

.w-full {
  width: 100%;
}

.command-input {
  :deep(.el-textarea__inner) {
    font-family: var(--el-font-family-monospace);
    font-size: var(--el-font-size-base);
    line-height: 1.6;
    background-color: var(--el-fill-color-darker);
    color: var(--el-text-color-primary);
    
    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
  }
}

// 分类选择器容器
.category-selector-container {
  position: relative;
}

// 层级分类选择器样式
.category-selector {
  .level-0-option {
    color: var(--el-color-primary);
    font-weight: var(--el-font-weight-primary);
  }
  
  .level-1-option {
    color: var(--el-color-success);
    font-weight: var(--el-font-weight-secondary);
  }
  
  .level-2-option {
    color: var(--el-color-warning);
    font-weight: var(--el-font-weight-secondary);
  }
  
  .level-3-option {
    color: var(--el-color-info);
    font-weight: var(--el-font-weight-secondary);
  }
  
  // 叶子分类样式优化
  :deep(.el-option) {
    padding: var(--el-spacing-sm) var(--el-spacing-md);
    
    // 一级分类样式
    &.level-0-option {
      .category-name-only {
        font-weight: var(--el-font-weight-primary);
        color: var(--el-color-primary);
        font-size: var(--el-font-size-base);
      }
    }
    
    // 多级分类样式
    &.level-1-option,
    &.level-2-option,
    &.level-3-option {
      .category-option-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        
        .category-name {
          font-weight: var(--el-font-weight-primary);
          color: var(--el-text-color-primary);
          font-size: var(--el-font-size-base);
          flex: 0 0 auto;
        }
        
        .category-separator {
          color: var(--el-color-info);
          font-size: var(--el-font-size-small);
          margin: 0 var(--el-spacing-xs);
          opacity: 0.6;
          flex: 0 0 auto;
        }
        
        .category-path {
          color: var(--el-text-color-secondary);
          font-size: var(--el-font-size-small);
          font-weight: normal;
          opacity: 0.75;
          flex: 1 1 auto;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
    
    // 层级颜色区分
    &.level-1-option .category-name { color: var(--el-color-success); }
    &.level-2-option .category-name { color: var(--el-color-warning); }
    &.level-3-option .category-name { color: var(--el-color-info); }
  }
}

// 分类状态提示样式
.category-status-hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-top: var(--el-spacing-xs);
  padding: var(--el-spacing-xs) var(--el-spacing-sm);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-small);
  transition: all var(--el-transition-duration);
  gap: var(--el-spacing-xs);
  
  .hint-icon {
    margin-right: var(--el-spacing-xs);
    flex-shrink: 0;
  }
  
  .hint-text {
    flex: 1;
    min-width: 120px;
  }
  
  .category-level-info {
    margin-left: var(--el-spacing-xs);
    font-size: var(--el-font-size-extra-small);
    opacity: 0.8;
  }
  
  .category-actions {
    margin-top: var(--el-spacing-xs);
    
    .parent-category-inline {
      display: flex;
      align-items: center;
      gap: var(--el-spacing-sm);
      
      .parent-label {
        font-size: var(--el-font-size-small);
        color: var(--el-text-color-regular);
        white-space: nowrap;
      }
      
      .parent-select {
        flex: 1;
        min-width: 200px;
      }
    }
  }
  
  &.hint-success {
    background: var(--el-color-success-light-9);
    border: 1px solid var(--el-color-success-light-7);
    color: var(--el-color-success-dark-2);
    
    .hint-icon {
      color: var(--el-color-success);
    }
  }
  
  &.hint-warning {
    background: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-7);
    color: var(--el-color-warning-dark-2);
    
    .hint-icon {
      color: var(--el-color-warning);
    }
  }
  
  &.hint-info {
    background: var(--el-color-info-light-9);
    border: 1px solid var(--el-color-info-light-7);
    color: var(--el-color-info-dark-2);
    
    .hint-icon {
      color: var(--el-color-info);
    }
  }
}

// 父分类选择器样式
.parent-category-selector {
  .category-info {
    margin-bottom: var(--el-spacing-lg);
    padding: var(--el-spacing-md);
    background: var(--el-color-primary-light-9);
    border-radius: var(--el-border-radius-base);
    border-left: 4px solid var(--el-color-primary);
  }
  
  .help-text {
    margin-top: var(--el-spacing-xs);
    font-size: var(--el-font-size-small);
    color: var(--el-text-color-secondary);
  }
}

// 常用完整命令样式
.command-example-form {
  .command-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--el-spacing-sm);
    
    .el-checkbox {
      color: var(--el-text-color-regular);
      font-size: var(--el-font-size-small);
    }
  }
}

.section-title {
  .info-icon {
    margin-left: var(--el-spacing-xs);
    color: var(--el-color-info);
    cursor: help;
  }
}

.section-description {
  margin-bottom: var(--el-spacing-md);
  padding: var(--el-spacing-sm);
  background: var(--el-color-info-light-9);
  border-left: 3px solid var(--el-color-info);
  border-radius: var(--el-border-radius-small);
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

// 选项按钮组样式
.option-buttons {
  display: flex;
  gap: var(--el-spacing-sm);
  align-items: center;
  
  .add-mutex-option-btn {
    border: 1px dashed var(--el-color-warning);
    color: var(--el-color-warning);
    
    &:hover {
      background: var(--el-color-warning-light-9);
      border-color: var(--el-color-warning);
    }
  }
}



// 选项分区样式
.regular-options-section,
.mutex-options-section {
  margin-bottom: var(--el-spacing-lg);
}

.subsection-title {
  font-size: var(--el-font-size-medium);
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: var(--el-spacing-md);
  padding-bottom: var(--el-spacing-xs);
  border-bottom: 2px solid var(--el-border-color-light);
}

// 互斥选项组样式
.mutex-group-item {
  margin-bottom: var(--el-spacing-md);
  border: 2px solid var(--el-color-warning-light-7);
  
  .mutex-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--el-spacing-md);
    padding-bottom: var(--el-spacing-sm);
    border-bottom: 1px solid var(--el-border-color-light);
    
    h5 {
      margin: 0;
      color: var(--el-color-warning-dark-2);
      font-weight: 600;
    }
  }
  
  .mutex-options-row {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-md);
  }
  
  .mutex-option-item {
    flex: 1;
    padding: var(--el-spacing-sm);
    border: 1px dashed var(--el-color-warning-light-5);
    border-radius: var(--el-border-radius-base);
    background: var(--el-color-warning-light-9);
  }
  
  .mutex-separator {
    text-align: center;
    
    .mutex-vs {
      display: inline-block;
      padding: var(--el-spacing-xs) var(--el-spacing-sm);
      background: var(--el-color-warning);
      color: white;
      border-radius: var(--el-border-radius-round);
      font-weight: bold;
      font-size: var(--el-font-size-small);
    }
  }
}



// 互斥选项配对对话框样式
.mutex-pairing-selection {
  .no-options-warning {
    margin-bottom: var(--el-spacing-md);
  }
  
  .mutex-selection-form {
    .form-group {
      margin-bottom: var(--el-spacing-md);
      
      label {
        display: block;
        margin-bottom: var(--el-spacing-xs);
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }
}

// 选项显示样式
.option-display {
  .option-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--el-spacing-md);
    
    .option-names {
      display: flex;
      align-items: center;
      gap: var(--el-spacing-sm);
      
      .short-name {
        font-weight: 600;
        color: var(--el-color-primary);
        font-size: var(--el-font-size-medium);
      }
      
      .long-name {
        color: var(--el-text-color-regular);
        font-size: var(--el-font-size-medium);
      }
    }
    
    .option-actions {
      display: flex;
      gap: var(--el-spacing-xs);
    }
  }
  
  .option-description {
    color: var(--el-text-color-secondary);
    font-size: var(--el-font-size-small);
    line-height: 1.4;
    margin-bottom: var(--el-spacing-sm);
  }
  
  .option-params {
    display: flex;
    align-items: flex-start;
    gap: var(--el-spacing-xs);
    
    .params-label {
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-secondary);
      font-weight: 500;
    }
    
    .params-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--el-spacing-xs);
      
      .param-tag {
        display: inline-flex;
        align-items: center;
        gap: var(--el-spacing-xs);
        padding: var(--el-spacing-xs) var(--el-spacing-sm);
        background: var(--el-color-info-light-9);
        border-radius: var(--el-border-radius-small);
        font-size: var(--el-font-size-small);
        color: var(--el-text-color-regular);
      }
    }
  }
}

// 添加选项表单样式
.add-option-form {
  .form-section {
    margin-bottom: var(--el-spacing-lg);
    
    h4 {
      margin: 0 0 var(--el-spacing-md) 0;
      color: var(--el-color-primary);
      font-size: var(--el-font-size-medium);
      font-weight: 600;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--el-spacing-md);
    }
  }
  
  .empty-params {
    text-align: center;
    padding: var(--el-spacing-lg);
    color: var(--el-text-color-secondary);
    background: var(--el-color-info-light-9);
    border-radius: var(--el-border-radius-base);
    margin-bottom: var(--el-spacing-md);
    
    p {
      margin: 0;
      font-size: var(--el-font-size-small);
    }
  }
  
  .params-list {
    margin-bottom: var(--el-spacing-md);
    
    .param-item {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: var(--el-border-radius-base);
      padding: var(--el-spacing-md);
      margin-bottom: var(--el-spacing-md);
      background: var(--el-bg-color);
      
      .param-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--el-spacing-md);
        
        .param-title {
          font-weight: 600;
          color: var(--el-text-color-primary);
          font-size: var(--el-font-size-small);
        }
      }
      
      .param-values-section {
        .common-values {
          margin-bottom: var(--el-spacing-md);
          
          .values-label {
            display: block;
            font-size: var(--el-font-size-small);
            font-weight: 600;
            color: var(--el-text-color-regular);
            margin-bottom: var(--el-spacing-xs);
          }
        }
        
        .values-list {
          .value-item {
            display: flex;
            align-items: center;
            gap: var(--el-spacing-xs);
            margin-bottom: var(--el-spacing-xs);
            
            .value-input {
              flex: 1;
            }
            
            .default-checkbox {
              flex-shrink: 0;
              margin-left: var(--el-spacing-xs);
            }
            
            .remove-value-btn {
              flex-shrink: 0;
              padding: 4px;
              min-height: auto;
            }
          }
          
          .add-value-btn {
            margin-top: var(--el-spacing-xs);
          }
        }
      }
    }
  }
  

  
  .option-name-input {
    display: flex;
    align-items: center;
    
    .option-prefix {
      background: var(--el-color-info-light-9);
      border: 1px solid var(--el-border-color);
      border-right: none;
      padding: 0 8px;
      height: 32px;
      line-height: 30px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: var(--el-color-info-dark-2);
      border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
      user-select: none;
      white-space: nowrap;
    }
    
    :deep(.el-input) {
      .el-input__wrapper {
        border-radius: 0 var(--el-border-radius-base) var(--el-border-radius-base) 0;
        border-left: none;
      }
    }
  }
  
  .option-name-hint,
  .separator-hint {
    margin-top: var(--el-spacing-sm);
    
    .hint-text {
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-secondary);
      line-height: 1.4;
      
      .required-hint {
        color: var(--el-color-warning);
        font-weight: bold;
      }
    }
  }
  
  .form-help {
    display: block;
    margin-top: var(--el-spacing-xs);
    font-size: var(--el-font-size-small);
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
  
  .param-default-checkbox {
    margin-top: var(--el-spacing-xs);
    
    :deep(.el-checkbox__label) {
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-secondary);
    }
  }
  
  .param-separator-input {
    max-width: 100px;
  }
  
  .separator-input-wrapper {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
    
    .separator-hint-inline {
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      flex-shrink: 0;
    }
  }
  
  .command-separator-input,
  .option-separator-input,
  .command-parameter-separator-input {
    flex: 0 0 120px;
  }
  
  .param-tag {
    .default-tag {
      margin-left: var(--el-spacing-xs);
      font-size: var(--el-font-size-extra-small);
    }
  }
}

// 子命令样式
.subcommands-container {
  .subcommand-item {
    margin-bottom: var(--el-spacing-md);
    
    .subcommand-form {
      display: flex;
      align-items: center;
      gap: var(--el-spacing-sm);
      padding: var(--el-spacing-md);
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--el-border-radius-base);
      background: var(--el-fill-color-extra-light);
      
      .subcommand-name {
        flex: 0 0 200px;
      }
      
      .subcommand-description {
        flex: 1;
      }
      
      .subcommand-type {
        flex: 0 0 160px;
        
        :deep(.el-radio-group) {
          display: flex;
          gap: var(--el-spacing-sm);
          
          .el-radio {
            margin-right: 0;
            font-size: var(--el-font-size-small);
            
            &.is-checked {
              .el-radio__label {
                color: var(--el-color-primary);
                font-weight: 600;
              }
            }
          }
        }
      }
    }
  }
}

// 常用参数相关样式
.common-params-actions {
  margin-top: var(--el-spacing-xs);
}

.common-params-selection {
  .params-categories {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .param-category {
    margin-bottom: var(--el-spacing-lg);
    
    .category-title {
      margin: 0 0 var(--el-spacing-md) 0;
      padding-bottom: var(--el-spacing-xs);
      border-bottom: 1px solid var(--el-border-color-light);
      color: var(--el-color-primary);
      font-size: var(--el-font-size-medium);
      font-weight: 600;
    }
    
    .params-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--el-spacing-sm);
      
      .param-checkbox {
        margin: 0;
        padding: var(--el-spacing-sm);
        border: 1px solid var(--el-border-color-light);
        border-radius: var(--el-border-radius-base);
        transition: all 0.3s;
        
        &:hover {
          border-color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }
        
        &.is-checked {
          border-color: var(--el-color-primary);
          background: var(--el-color-primary-light-8);
        }
        
        .param-item {
          display: flex;
          flex-direction: column;
          gap: var(--el-spacing-xs);
          margin-left: var(--el-spacing-md);
          
          strong {
            color: var(--el-text-color-primary);
            font-size: var(--el-font-size-small);
          }
          
          .param-desc {
            color: var(--el-text-color-secondary);
            font-size: var(--el-font-size-extra-small);
            line-height: 1.4;
          }
        }
      }
    }
  }
  
  .empty-state {
    padding: var(--el-spacing-md) 0;
  }
  
  /* 强制统一所有表单区域样式 */
  .form-section {
    background: var(--el-bg-color) !important;
    border: 1px solid var(--el-border-color-lighter) !important;
    border-radius: var(--el-border-radius-base) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04) !important;
    padding: var(--el-spacing-lg) !important;
    margin-bottom: var(--el-spacing-xl) !important;
    transition: all var(--el-transition-duration) !important;
    
    &:hover {
      border-color: var(--el-border-color-light) !important;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08) !important;
    }
  }
  
  /* 确保所有具体的section类也应用相同样式 */
  .basic-info-section,
  .common-commands-section,
  .subcommands-section,
  .options-section,
  .parameters-section,
  .symbols-section,
  .dialog-form-section {
    /* 继承上面的.form-section样式 */
  }

  /* 命令参数样式 */
  .parameters-container {
    .parameters-actions {
      display: flex;
      gap: var(--el-spacing-sm);
      align-items: center;
    }
    
    .parameters-list {
      .parameter-item {
        border: 1px solid var(--el-border-color-light);
        border-radius: var(--el-border-radius-base);
        margin-bottom: var(--el-spacing-md);
        background: var(--el-bg-color-page);
        transition: all 0.2s ease;
        
        &:hover {
          border-color: var(--el-border-color);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }
        
        .parameter-header {
          display: flex;
          align-items: center;
          gap: var(--el-spacing-sm);
          padding: var(--el-spacing-md);
          background: var(--el-fill-color-lighter);
          border-bottom: 1px solid var(--el-border-color-lighter);
          
          .parameter-name {
            flex: 0 0 200px;
            max-width: 200px;
          }
          
          .delete-param-btn {
            flex-shrink: 0;
            margin-left: auto;
          }
        }
        
        .parameter-body {
          padding: var(--el-spacing-md);
          
          .form-row {
            display: flex;
            gap: var(--el-spacing-md);
            margin-bottom: var(--el-spacing-md);
            
            .form-group {
              flex: 1;
            }
          }
          
          .form-group {
            margin-bottom: var(--el-spacing-md);
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
     
     /* 常用参数值样式 */
     .common-values-container {
       .empty-values {
    text-align: center;
         padding: var(--el-spacing-lg);
         border: 2px dashed var(--el-border-color-light);
         border-radius: var(--el-border-radius-base);
    color: var(--el-text-color-secondary);
       }
       
       .values-list {
                   .value-item {
            display: flex;
            align-items: center;
            gap: var(--el-spacing-sm);
            margin-bottom: var(--el-spacing-sm);
            padding: var(--el-spacing-sm);
            border: 1px solid var(--el-border-color-lighter);
            border-radius: var(--el-border-radius-base);
            background: var(--el-fill-color-extra-light);
            
            &:hover {
              border-color: var(--el-border-color);
            }
            
            .value-input {
              flex: 1;
            }
            
            .default-radio {
              flex-shrink: 0;
              
              :deep(.el-radio__label) {
      font-size: var(--el-font-size-small);
                color: var(--el-text-color-regular);
              }
              
              &.is-checked {
                :deep(.el-radio__label) {
                  color: var(--el-color-primary);
                  font-weight: 500;
                }
              }
            }
            
            &.no-default-item {
              background: var(--el-fill-color-blank);
              border-style: dashed;
              border-color: var(--el-border-color);
              
              .no-default-label {
                flex: 1;
                color: var(--el-text-color-secondary);
                font-style: italic;
              }
              
              &:hover {
                background: var(--el-fill-color-light);
              }
            }
          }
         
         .values-actions {
           text-align: center;
           padding: var(--el-spacing-sm) 0;
           border-top: 1px solid var(--el-border-color-lighter);
           margin-top: var(--el-spacing-sm);
         }
       }
     }
   }
}

// 符号样式
.symbols-container {
  /* 符号选择区域 */
  .symbol-selection-area {
    margin-bottom: 16px;
    
    .selection-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;
      
      .section-title {
        font-size: var(--el-font-size-base);
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .section-desc {
        font-size: var(--el-font-size-small);
        color: var(--el-text-color-secondary);
      }
    }
    
    .selector-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-start;
    }
    
    .category-selector-item {
      flex: 1;
      min-width: 160px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .category-label {
        font-size: var(--el-font-size-small);
        font-weight: 500;
        color: var(--el-text-color-regular);
        margin-bottom: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .symbol-select {
        width: 100%;
      }
    }
  }
  
  /* 纯符号选项样式 */
  .symbol-option-only {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 6px 12px;
    
    .symbol-char {
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 16px;
      color: var(--el-color-primary);
      text-align: center;
      min-width: 24px;
    }
  }

  /* 已选择符号区域 */
  .selected-symbols-area {
    margin-bottom: 16px;
    padding: 8px;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 4px;
    
    .selected-symbols-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      
      .symbols-count {
        font-size: var(--el-font-size-small);
        color: var(--el-color-primary-dark-2);
        font-weight: 500;
      }
    }
    
    .selected-symbols-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .symbol-tag {
        margin: 0;
        height: 28px;
        line-height: 28px;
        padding: 0 12px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        font-size: 16px;
        background: var(--el-color-primary);
        color: white;
        border: none;
        border-radius: 6px;
        
        &:hover {
          background: var(--el-color-primary-dark-2);
        }
        
        .el-tag__close {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          margin-left: 6px;
          
          &:hover {
            color: white;
            background: rgba(255, 255, 255, 0.2);
          }
        }
      }
    }
  }



      .symbol-categories {
      .category-section {
        margin-bottom: 8px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 4px;
        background: var(--el-bg-color);
        
        &.collapsed {
          .collapse-icon {
            transition: transform var(--el-transition-duration);
          }
        }
        
        .category-header {
          &.clickable {
            cursor: pointer;
            user-select: none;
            
            &:hover {
              background: var(--el-color-primary-light-9);
              
              .category-title h4 {
                color: var(--el-color-primary);
              }
            }
          }
          
          padding: 8px;
          border-bottom: 1px solid var(--el-border-color-lighter);
          
          .category-title {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 2px;
            
            .collapse-icon {
              color: var(--el-color-primary);
              transition: transform var(--el-transition-duration);
            }
            
            h4 {
              margin: 0;
              font-size: var(--el-font-size-large);
              color: var(--el-text-color-primary);
              transition: color var(--el-transition-duration);
            }
            
            .category-count {
              color: var(--el-text-color-placeholder);
              font-size: var(--el-font-size-small);
              font-weight: normal;
            }
          }
          
          .category-desc {
            color: var(--el-text-color-secondary);
            font-size: var(--el-font-size-small);
          }
        }
      
      .symbols-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--el-spacing-md);
        
        .symbol-card {
          position: relative;
          padding: var(--el-spacing-md);
          border: 2px solid var(--el-border-color-light);
          border-radius: var(--el-border-radius-base);
          background: var(--el-bg-color);
          cursor: pointer;
          transition: all var(--el-transition-duration);
          
          &:hover {
            border-color: var(--el-color-primary-light-5);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }
          
          &.selected {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          }
          
          .symbol-content {
            display: flex;
            align-items: center;
            gap: var(--el-spacing-sm);
            margin-bottom: var(--el-spacing-sm);
            
            .symbol-text {
              font-family: var(--el-font-family-mono);
              font-weight: bold;
              color: var(--el-color-primary);
              font-size: var(--el-font-size-large);
              padding: var(--el-spacing-xs) var(--el-spacing-sm);
              background: var(--el-color-primary-light-8);
              border-radius: var(--el-border-radius-small);
            }
            
            .symbol-name {
              color: var(--el-text-color-primary);
              font-weight: 500;
            }
          }
          
          .symbol-description {
            color: var(--el-text-color-secondary);
            font-size: var(--el-font-size-small);
            line-height: 1.5;
          }
          
          .selected-indicator {
            position: absolute;
            top: var(--el-spacing-sm);
            right: var(--el-spacing-sm);
            width: 20px;
            height: 20px;
            background: var(--el-color-primary);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }
        }
      }
    }
  }
  

  
  .empty-state {
    padding: var(--el-spacing-xl);
    text-align: center;
    background: var(--el-color-info-light-9);
    border: 2px dashed var(--el-color-info-light-5);
    border-radius: var(--el-border-radius-base);
    margin-top: var(--el-spacing-lg);
  }
}

// 符号选项样式
.symbol-option {
  .symbol-text {
    font-family: var(--el-font-family-mono);
    font-weight: bold;
    color: var(--el-color-primary);
    margin-right: var(--el-spacing-sm);
  }
  
  .symbol-name {
    color: var(--el-text-color-primary);
    margin-right: var(--el-spacing-sm);
  }
  
  .symbol-desc {
    font-size: var(--el-font-size-small);
    color: var(--el-text-color-secondary);
    margin-top: var(--el-spacing-xs);
  }
}


</style> 