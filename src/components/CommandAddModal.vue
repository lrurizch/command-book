<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEditing ? '修改命令' : '新建命令'"
    width="60%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="command-form">
      <!-- 基本信息 -->
      <div class="form-section">
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

        <div class="form-group">
          <label for="base-command" class="form-label">
            基础命令 <span class="required">*</span>
            <span v-if="isEditing && getFieldChanges().baseCommand" class="changed-indicator">已修改</span>
          </label>
          <el-input
            id="base-command"
            v-model="form.baseCommand"
            placeholder="输入基础命令 (如: git, npm, docker)"
            class="command-input"
            :class="{ 'field-changed': isEditing && getFieldChanges().baseCommand }"
          />
          <!-- 显示原始值对比 -->
          <div v-if="isEditing && getFieldChanges().baseCommand" class="comparison-info">
            <div class="original-value">
              <span class="label">原始值:</span>
              <span class="original-text">{{ originalData.baseCommand || '无' }}</span>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('baseCommand')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="command-content" class="form-label">
            完整命令模板 <span class="required">*</span>
            <span v-if="isEditing && getFieldChanges().command" class="changed-indicator">已修改</span>
          </label>
          <el-input
            id="command-content"
            v-model="form.command"
            type="textarea"
            :rows="4"
            placeholder="输入命令模板，使用 {{参数名}} 表示参数占位符，如: git commit -m {{message}}"
            @input="analyzeCommand"
            class="command-input"
            :class="{ 'field-changed': isEditing && getFieldChanges().command }"
          />
          <!-- 显示原始值对比 -->
          <div v-if="isEditing && getFieldChanges().command" class="comparison-info">
            <div class="original-value">
              <span class="label">原始值:</span>
              <pre class="original-text">{{ originalData.command }}</pre>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('command')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
          </div>
          <div class="command-help">
            <div class="help-item">
              💡 提示: 使用 <code>{{参数名}}</code> 创建参数占位符
            </div>
            <div class="help-item">
              📝 示例: <code>git commit -m "{{message}}"</code>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="command-description" class="form-label">
            作用
            <span v-if="isEditing && getFieldChanges().description" class="changed-indicator">已修改</span>
          </label>
          <el-input
            id="command-description"
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="200"
            placeholder="描述这个命令的作用和用途"
            :class="{ 'field-changed': isEditing && getFieldChanges().description }"
          />
          <!-- 显示原始值对比 -->
          <div v-if="isEditing && getFieldChanges().description" class="comparison-info">
            <div class="original-value">
              <span class="label">原始值:</span>
              <span class="original-text">{{ originalData.description || '无' }}</span>
              <el-button 
                type="text" 
                size="small" 
                @click="restoreField('description')"
                class="restore-btn"
                title="恢复到原始值"
              >
                ↺ 恢复
              </el-button>
            </div>
          </div>
        </div>
        
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
                  <SuccessFilled v-if="categoryStatus.type === 'success'" />
                  <WarningFilled v-if="categoryStatus.type === 'warning'" />
                </el-icon>
                <span class="hint-text">{{ categoryStatus.message }}</span>
                
                <!-- 如果是现有分类，显示层级信息 -->
                <span 
                  v-if="categoryStatus.exists && categoryStatus.category" 
                  class="category-level-info"
                >
                  ({{ ['一', '二', '三', '四'][categoryStatus.category.level] }}级分类)
                </span>
                
                <!-- 如果是新分类，显示父分类选择 -->
                <div v-if="!categoryStatus.exists && categoryStatus.message" class="category-actions">
                  <div class="parent-category-inline">
                    <label class="parent-label">父分类：</label>
                    <el-select
                      v-model="selectedParentCategory"
                      placeholder="选择父分类（可选）"
                      clearable
                      size="small"
                      class="parent-select"
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
                  </div>
                </div>
              </div>
            </div>
            </div>
            <!-- 显示原始分类对比 -->
            <div v-if="isEditing && getFieldChanges().category" class="comparison-info">
              <div class="original-value">
                <span class="label">原始值:</span>
                <span class="original-text">{{ getOriginalCategoryName() }}</span>
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
              v-model="form.tags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入标签"
              class="w-full"
              :class="{ 'field-changed': isEditing && getFieldChanges().tags }"
            >
              <el-option
                v-for="tag in commandStore.allTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
            <!-- 显示原始标签对比 -->
            <div v-if="isEditing && getFieldChanges().tags" class="comparison-info">
              <div class="original-value">
                <span class="label">原始值:</span>
                <span class="original-text">{{ getOriginalTagsDisplay() }}</span>
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
      </div>

      <!-- 命令选项 -->
      <div class="form-section">
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
          <el-button
            type="primary"
            text
            @click="addOption"
            icon="Plus"
          >
            + 添加选项
          </el-button>
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

      <!-- 常用参数组合 -->
      <div class="form-section">
        <h3 class="section-title">
          常用参数组合
          <span v-if="isEditing && getFieldChanges().commonParameters" class="changed-indicator">已修改</span>
        </h3>
        <div class="common-params-container">
          <div 
            v-for="(paramSet, index) in form.commonParameters" 
            :key="index" 
            class="param-set-item"
          >
            <div class="param-set-form">
              <el-input
                v-model="paramSet.name"
                placeholder="参数组合名称"
                class="param-set-name"
              />
              <el-input
                v-model="paramSet.params"
                placeholder="参数组合 (如: -la, --verbose --output=json)"
                class="param-set-params"
              />
              <el-input
                v-model="paramSet.description"
                placeholder="用途说明"
                class="param-set-description"
              />
              <el-button
                type="danger"
                text
                @click="removeCommonParam(index)"
                title="删除参数组合"
              >
                ×
              </el-button>
            </div>
          </div>
          <el-button
            type="primary"
            text
            @click="addCommonParam"
            icon="Plus"
          >
            + 添加常用参数
          </el-button>
        </div>
        <!-- 显示原始常用参数对比 -->
        <div v-if="isEditing && getFieldChanges().commonParameters" class="comparison-info">
          <div class="original-value">
            <span class="label">原始常用参数:</span>
            <div class="original-common-params">{{ getOriginalCommonParamsDisplay() }}</div>
            <el-button 
              type="text" 
              size="small" 
              @click="restoreField('commonParameters')"
              class="restore-btn"
              title="恢复到原始值"
            >
              ↺ 恢复
            </el-button>
          </div>
        </div>
      </div>

      <!-- 常用完整命令 -->
      <div class="form-section">
        <h3 class="section-title">
          常用完整命令
          <span v-if="isEditing && getFieldChanges().commonCommands" class="changed-indicator">已修改</span>
          <el-tooltip content="添加实际可执行的完整命令，无需参数占位符。最近使用的命令会自动成为默认复制命令" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </h3>
        <div class="section-description">
          添加基于上面命令模板的具体实例，这些是可以直接执行的完整命令。
        </div>
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

      <!-- 分隔符/运算符 -->
      <div class="form-section">
        <h3 class="section-title">
          分隔符/运算符
          <span v-if="isEditing && getFieldChanges().separators" class="changed-indicator">已修改</span>
        </h3>
        <div class="separators-container">
          <div 
            v-for="(separator, index) in form.separators" 
            :key="index" 
            class="separator-item"
          >
            <div class="separator-form">
              <el-input
                v-model="separator.symbol"
                placeholder="分隔符 (如: |, &&, ||, >, >>, <)"
                class="separator-symbol"
              />
              <el-input
                v-model="separator.description"
                placeholder="用途说明"
                class="separator-description"
              />
              <el-input
                v-model="separator.example"
                placeholder="使用示例"
                class="separator-example"
              />
              <el-button
                type="danger"
                text
                @click="removeSeparator(index)"
                title="删除分隔符"
              >
                ×
              </el-button>
            </div>
          </div>
          <el-button
            type="primary"
            text
            @click="addSeparator"
            icon="Plus"
          >
            + 添加分隔符
          </el-button>
        </div>
        <!-- 显示原始分隔符对比 -->
        <div v-if="isEditing && getFieldChanges().separators" class="comparison-info">
          <div class="original-value">
            <span class="label">原始分隔符:</span>
            <div class="original-separators">{{ getOriginalSeparatorsDisplay() }}</div>
            <el-button 
              type="text" 
              size="small" 
              @click="restoreField('separators')"
              class="restore-btn"
              title="恢复到原始值"
            >
              ↺ 恢复
            </el-button>
          </div>
        </div>
      </div>

      <!-- 选项设置 -->
      <div class="form-section">
        <h3 class="section-title">
          选项设置
          <span v-if="isEditing && getFieldChanges().options" class="changed-indicator">已修改</span>
        </h3>
        <p class="section-description">配置命令的选项，如 -v, --verbose, --port 等</p>
        
        <div class="options-list">
          <el-card
            v-for="(option, index) in form.options"
            :key="`option-${index}`"
            class="option-item"
          >
            <div class="option-header">
              <div class="option-name-inputs">
                <el-input
                  v-model="option.shortName"
                  placeholder="短选项 (如: -v)"
                  class="option-short-input"
                />
                <el-input
                  v-model="option.longName"
                  placeholder="长选项 (如: --verbose)"
                  class="option-long-input"
                />
              </div>
              <el-button
                type="danger"
                size="small"
                @click="removeOption(index)"
              >
                删除
              </el-button>
            </div>
            
            <div class="option-body">
              <div class="form-group">
                <label class="form-label">描述</label>
                <el-input
                  v-model="option.description"
                  placeholder="选项描述"
                />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">选项类型</label>
                  <el-radio-group v-model="option.type">
                    <el-radio :value="ParameterType.REQUIRED">必选选项</el-radio>
                    <el-radio :value="ParameterType.OPTIONAL">可选选项</el-radio>
                    <el-radio :value="ParameterType.DISABLED">不可选选项</el-radio>
                  </el-radio-group>
                </div>
                <div class="form-group">
                  <el-checkbox v-model="option.hasValue">
                    需要参数值
                  </el-checkbox>
                </div>
              </div>
              
              <!-- 选项参数设置 -->
              <div v-if="option.hasValue" class="option-parameters">
                <label class="form-label">选项参数</label>
                <div class="option-param-list">
                  <div
                    v-for="(param, paramIndex) in option.parameters"
                    :key="`option-${index}-param-${paramIndex}`"
                    class="option-param-item"
                  >
                    <el-input
                      v-model="param.name"
                      placeholder="参数名"
                      class="option-param-name"
                    />
                    <el-input
                      v-model="param.description"
                      placeholder="参数描述"
                      class="option-param-desc"
                    />
                    <el-select v-model="param.type" class="option-param-type" placeholder="类型">
                      <el-option :value="ParameterType.REQUIRED" label="必选"></el-option>
                      <el-option :value="ParameterType.OPTIONAL" label="可选"></el-option>
                      <el-option :value="ParameterType.DISABLED" label="不可选"></el-option>
                    </el-select>
                    <el-button
                      type="danger"
                      size="small"
                      @click="removeOptionParameter(index, paramIndex)"
                    >
                      删除
                    </el-button>
                  </div>
                  <el-button
                    size="small"
                    @click="addOptionParameter(index)"
                  >
                    + 添加选项参数
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
          
          <el-button
            class="add-option-btn"
            @click="addOption"
          >
            + 添加选项
          </el-button>
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

      <!-- 命令级参数设置 -->
      <div v-if="detectedParameters.length > 0 || form.parameters.length > 0" class="form-section">
        <h3 class="section-title">
          命令级参数设置
          <span v-if="isEditing && getFieldChanges().parameters" class="changed-indicator">已修改</span>
        </h3>
        <p class="section-description">配置直接跟在命令后的位置参数，如文件路径、目标地址等</p>
        
        <div v-if="detectedParameters.length > 0" class="detected-params">
          <div class="detected-params-header">
            <span>检测到的参数:</span>
            <el-button
              type="primary"
              size="small"
              @click="addAllDetectedParams"
            >
              全部添加
            </el-button>
          </div>
          <div class="detected-params-list">
            <el-tag
              v-for="param in detectedParameters"
              :key="param"
              class="detected-param"
              @click="addParameter(param)"
            >
              + {{ param }}
            </el-tag>
          </div>
        </div>
        
        <div class="parameters-list">
          <el-card
            v-for="(param, index) in form.parameters"
            :key="index"
            class="parameter-item"
          >
            <div class="parameter-header">
              <el-input
                v-model="param.name"
                placeholder="参数名"
                class="param-name-input"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeParameter(index)"
              >
                删除
              </el-button>
            </div>
            
            <div class="parameter-body">
              <div class="form-group">
                <label class="form-label">描述</label>
                <el-input
                  v-model="param.description"
                  placeholder="参数描述"
                />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">默认值</label>
                  <el-input
                    v-model="param.defaultValue"
                    placeholder="默认值（可选）"
                  />
                </div>
                
                <div class="form-group">
                  <label class="form-label">参数类型</label>
                  <el-radio-group v-model="param.type">
                    <el-radio :value="ParameterType.REQUIRED">必选参数</el-radio>
                    <el-radio :value="ParameterType.OPTIONAL">可选参数</el-radio>
                    <el-radio :value="ParameterType.DISABLED">不可选参数</el-radio>
                  </el-radio-group>
                </div>
              </div>
            </div>
          </el-card>
          
          <el-button
            class="add-param-btn"
            @click="addCustomParameter"
          >
            + 添加命令级参数
          </el-button>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, SuccessFilled, WarningFilled, Plus, FolderAdd } from '@element-plus/icons-vue'
import { useCommandStore } from '../stores/command'
import { showSaveSuccess } from '../utils/toast'

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
  OPTIONAL: 'optional',     // 可选参数  
  DISABLED: 'disabled'      // 不可选参数（禁止使用）
}

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.editingCommand)

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

// 表单数据
const form = ref({
  commandName: '', // 命令名称
  baseCommand: '', // 基础命令
  command: '', // 完整命令模板
  description: '',
  usage: '',
  category: '',
  tags: [],
  parameters: [],
  options: [], // 命令选项
  commonParameters: [], // 常用参数
  commonCommands: [], // 常用完整命令
  separators: [] // 分隔符/运算符
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
      defaultValue: ''
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
    name: '',
    description: '',
    type: ParameterType.OPTIONAL,
    defaultValue: ''
  })
}

const removeParameter = (index) => {
  form.value.parameters.splice(index, 1)
  analyzeCommand() // 重新分析以更新检测到的参数
}

// 自动生成命令名称
const generateCommandName = (command) => {
  if (!command.trim()) return '新建命令'
  
  // 提取命令的主要部分作为名称
  const parts = command.trim().split(' ')
  if (parts.length === 0) return '新建命令'
  
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
    baseCommand: '',
    command: '',
    description: '',
    usage: '',
    category: lastUsedCategory.value,
    tags: [],
    parameters: [],
    options: [],
    commonParameters: [],
    commonCommands: [],
    separators: []
  }
  detectedParameters.value = []
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const saveCommand = async () => {
  // 如果分类是新的（不存在），先创建分类
  if (form.value.category && !categoryStatus.value.exists) {
    await handleCreateCategory(form.value.category)
  }

  const commandData = {
    name: form.value.commandName.trim() || generateCommandName(form.value.command.trim()),
    commandName: form.value.commandName.trim(),
    baseCommand: form.value.baseCommand.trim(),
    description: form.value.description.trim(),
    usage: form.value.usage.trim(),
    command: form.value.command.trim(),
    category: form.value.category || 'dev-tools', // 如果没有选择分类，默认为开发工具
    tags: form.value.tags,
    parameters: form.value.parameters.filter(p => p.name.trim()), // 过滤空参数
    options: form.value.options.filter(o => o.shortName.trim() || o.longName.trim()), // 过滤空选项
    commonParameters: form.value.commonParameters.filter(p => p.name.trim()), // 过滤空常用参数
    commonCommands: form.value.commonCommands.filter(c => c.name.trim()), // 过滤空常用命令
    separators: form.value.separators.filter(s => s.symbol.trim()) // 过滤空分隔符
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
  if (!form.value.command.trim()) {
    ElMessage.warning('请输入命令')
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
    JSON.stringify(original.commonParameters) !== JSON.stringify(current.commonParameters) ||
    JSON.stringify(original.commonCommands) !== JSON.stringify(current.commonCommands) ||
    JSON.stringify(original.separators) !== JSON.stringify(current.separators)
  )
})

// 获取字段变化状态
const getFieldChanges = () => {
  if (!isEditing.value || !originalData.value) return {}
  
  const original = originalData.value
  const current = form.value
  
  return {
    commandName: original.commandName !== current.commandName,
    baseCommand: original.baseCommand !== current.baseCommand,
    command: original.command !== current.command,
    description: original.description !== current.description,
    usage: original.usage !== current.usage,
    category: original.category !== current.category,
    tags: JSON.stringify(original.tags) !== JSON.stringify(current.tags),
    parameters: JSON.stringify(original.parameters) !== JSON.stringify(current.parameters),
    options: JSON.stringify(original.options) !== JSON.stringify(current.options),
    commonParameters: JSON.stringify(original.commonParameters) !== JSON.stringify(current.commonParameters),
    commonCommands: JSON.stringify(original.commonCommands) !== JSON.stringify(current.commonCommands),
    separators: JSON.stringify(original.separators) !== JSON.stringify(current.separators)
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
      case ParameterType.DISABLED:
        typeDisplay = ' (不可选)'
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
    case 'baseCommand':
      form.value.baseCommand = originalData.value.baseCommand
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
    case 'commonParameters':
      form.value.commonParameters = originalData.value.commonParameters ? 
        originalData.value.commonParameters.map(param => ({ ...param })) : []
      break
    case 'commonCommands':
      form.value.commonCommands = originalData.value.commonCommands ? 
        originalData.value.commonCommands.map(cmd => ({ ...cmd })) : []
      break
    case 'separators':
      form.value.separators = originalData.value.separators ? 
        originalData.value.separators.map(sep => ({ ...sep })) : []
      break
  }
  
  // 显示恢复成功提示
  ElMessage.success(`${getFieldDisplayName(fieldName)}已恢复到原始值`)
}

// 获取字段显示名称
const getFieldDisplayName = (fieldName) => {
  const fieldNames = {
    commandName: '命令名',
    command: '完整命令',
    description: '作用描述',
    usage: '使用说明',
    category: '分类',
    tags: '标签',
    parameters: '参数设置',
    options: '命令选项',
    commonParameters: '常用参数',
    commonCommands: '常用命令',
    separators: '分隔符/运算符'
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
      case ParameterType.DISABLED:
        typeDisplay = ' (不可选)'
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
          case ParameterType.DISABLED:
            pTypeDisplay = ' (不可选)'
            break
        }
        const pDesc = p.description ? ` - ${p.description}` : ''
        return `${p.name}${pTypeDisplay}${pDesc}`
      }).join(', ')
    }
    return `${nameDisplay}${typeDisplay}${hasValue}${description}${params}`
  }).join('\n')
}

// 获取原始常用参数显示
const getOriginalCommonParamsDisplay = () => {
  if (!originalData.value || !originalData.value.commonParameters || originalData.value.commonParameters.length === 0) return '无常用参数'
  
  return originalData.value.commonParameters.map(param => {
    return `${param.name}: ${param.params} - ${param.description || '无说明'}`
  }).join('\n')
}

// 获取原始常用命令显示
const getOriginalCommonCommandsDisplay = () => {
  if (!originalData.value || !originalData.value.commonCommands || originalData.value.commonCommands.length === 0) return '无命令示例'
  
  return originalData.value.commonCommands.map(cmd => {
    return `${cmd.name}:\n${cmd.command}\n${cmd.description || '无说明'}`
  }).join('\n\n')
}

// 选项管理
const addOption = () => {
  if (!form.value.options) {
    form.value.options = []
  }
  form.value.options.push({
    shortName: '',
    longName: '',
    description: '',
    type: ParameterType.OPTIONAL,
    hasValue: false,
    parameters: []
  })
}

const removeOption = (index) => {
  form.value.options.splice(index, 1)
}

const addOptionParameter = (optionIndex) => {
  if (!form.value.options[optionIndex].parameters) {
    form.value.options[optionIndex].parameters = []
  }
  form.value.options[optionIndex].parameters.push({
    name: '',
    description: '',
    type: ParameterType.OPTIONAL
  })
}

const removeOptionParameter = (optionIndex, paramIndex) => {
  form.value.options[optionIndex].parameters.splice(paramIndex, 1)
}

// 常用参数管理
const addCommonParam = () => {
  if (!form.value.commonParameters) {
    form.value.commonParameters = []
  }
  form.value.commonParameters.push({
    name: '',
    params: '',
    description: ''
  })
}

const removeCommonParam = (index) => {
  form.value.commonParameters.splice(index, 1)
}

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

// 分隔符管理
const addSeparator = () => {
  if (!form.value.separators) {
    form.value.separators = []
  }
  form.value.separators.push({
    symbol: '',
    description: '',
    example: ''
  })
}

const removeSeparator = (index) => {
  form.value.separators.splice(index, 1)
}

// 获取原始分隔符显示
const getOriginalSeparatorsDisplay = () => {
  if (!originalData.value || !originalData.value.separators || originalData.value.separators.length === 0) return '无分隔符'
  
  return originalData.value.separators.map(sep => {
    return `${sep.symbol}: ${sep.description || '无说明'} (示例: ${sep.example || '无'})`
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
      baseCommand: newCommand.baseCommand || '',
      command: newCommand.command,
      description: newCommand.description,
      usage: newCommand.usage || '',
      category: newCommand.category,
      tags: [...(newCommand.tags || [])],
      parameters: newCommand.parameters ? [...newCommand.parameters] : [],
      options: newCommand.options ? [...newCommand.options] : [],
      commonParameters: newCommand.commonParameters ? [...newCommand.commonParameters] : [],
      commonCommands: newCommand.commonCommands ? [...newCommand.commonCommands] : [],
      separators: newCommand.separators ? [...newCommand.separators] : []
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
.command-form {
  padding: var(--el-dialog-padding-primary);
}

.form-section {
  margin-bottom: var(--el-spacing-lg);
  
  .section-title {
    margin: 0 0 var(--el-spacing-md) 0;
    font-size: var(--el-font-size-large);
    font-weight: var(--el-font-weight-bold);
    color: var(--el-text-color-primary);
    border-bottom: 2px solid var(--el-border-color);
    padding-bottom: var(--el-spacing-xs);
  }
}

.form-row {
  display: flex;
  gap: var(--el-spacing-md);
  
  .form-group {
    flex: 1;
  }
}

.form-group {
  margin-bottom: var(--el-spacing-md);
  
  .form-label {
    display: flex;
    align-items: center;
    font-size: var(--el-font-size-base);
    font-weight: var(--el-font-weight-primary);
    margin-bottom: var(--el-spacing-sm);
    color: var(--el-text-color-primary);
    
    .required {
      color: var(--el-color-danger);
    }
    
    .changed-indicator {
      color: var(--el-color-warning);
      font-size: var(--el-font-size-small);
      font-weight: 500;
      margin-left: var(--el-spacing-sm);
      padding: 1px 6px;
      background: var(--el-color-warning-light-9);
      border-radius: var(--el-border-radius-small);
    }
  }
}

// 字段变化样式
.field-changed {
  border-color: var(--el-color-warning) !important;
  background-color: var(--el-color-warning-light-9) !important;
}

// 对比信息样式
.comparison-info {
  margin-top: var(--el-spacing-sm);
  padding: var(--el-spacing-sm);
  background: var(--el-fill-color-extra-light);
  border-radius: var(--el-border-radius-base);
  border-left: 3px solid var(--el-color-info);
  
  .original-value {
    display: flex;
    align-items: flex-start;
    gap: var(--el-spacing-sm);
    
    .label {
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-secondary);
      font-weight: 500;
      margin-right: var(--el-spacing-sm);
      flex-shrink: 0;
    }
    
    .original-text {
      color: var(--el-text-color-regular);
      font-size: var(--el-font-size-small);
      background: var(--el-fill-color-light);
      padding: var(--el-spacing-xs) var(--el-spacing-sm);
      border-radius: var(--el-border-radius-small);
      display: inline-block;
      max-width: 100%;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
      flex: 1;
    }
    
    .restore-btn {
      color: var(--el-color-primary);
      padding: 2px 6px;
      font-size: var(--el-font-size-small);
      flex-shrink: 0;
      
      &:hover {
        color: var(--el-color-primary-light-3);
        background: var(--el-color-primary-light-9);
      }
    }
    
    .original-parameters {
      color: var(--el-text-color-regular);
      font-size: var(--el-font-size-small);
      background: var(--el-fill-color-light);
      padding: var(--el-spacing-sm);
      border-radius: var(--el-border-radius-small);
      white-space: pre-line;
      line-height: 1.5;
      font-family: monospace;
      flex: 1;
    }
  }
}

.command-help {
  margin-top: var(--el-spacing-sm);
  padding: var(--el-spacing-sm);
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  
  .help-item {
    font-size: var(--el-font-size-small);
    color: var(--el-text-color-secondary);
    margin-bottom: var(--el-spacing-xs);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    code {
      background: var(--el-fill-color);
      padding: 2px 4px;
      border-radius: var(--el-border-radius-small);
      font-family: var(--el-font-family-monospace);
    }
  }
}

.detected-params {
  margin-bottom: var(--el-spacing-md);
  padding: var(--el-spacing-md);
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  
  .detected-params-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--el-spacing-sm);
    font-size: var(--el-font-size-base);
    font-weight: var(--el-font-weight-primary);
  }
  
  .detected-params-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--el-spacing-xs);
    
    .detected-param {
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

// 选项样式
.options-list {
  .option-item {
    margin-bottom: var(--el-spacing-md);
    
    .option-header {
      display: flex;
      gap: var(--el-spacing-sm);
      margin-bottom: var(--el-spacing-sm);
      align-items: flex-end;
      
      .option-name-inputs {
        display: flex;
        gap: var(--el-spacing-sm);
        flex: 1;
        
        .option-short-input {
          flex: 0 0 120px;
        }
        
        .option-long-input {
          flex: 1;
        }
      }
    }
    
    .option-body {
      padding-left: var(--el-spacing-md);
      
      .option-parameters {
        margin-top: var(--el-spacing-md);
        padding: var(--el-spacing-md);
        background: var(--el-fill-color-light);
        border-radius: var(--el-border-radius-base);
        
        .option-param-list {
          .option-param-item {
            display: flex;
            gap: var(--el-spacing-sm);
            margin-bottom: var(--el-spacing-sm);
            align-items: center;
            
            .option-param-name {
              flex: 0 0 150px;
            }
            
            .option-param-desc {
              flex: 1;
            }
            
            .option-param-type {
              flex: 0 0 120px;
            }
          }
        }
      }
    }
  }
  
  .add-option-btn {
    width: 100%;
    height: var(--el-button-size);
    border: 2px dashed var(--el-border-color);
    background: transparent;
    
    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }
  }
}

.parameters-list {
  .parameter-item {
    margin-bottom: var(--el-spacing-md);
    
    .parameter-header {
      display: flex;
      gap: var(--el-spacing-sm);
      margin-bottom: var(--el-spacing-sm);
      
      .param-name-input {
        flex: 1;
      }
    }
    
    .parameter-body {
      padding-left: var(--el-spacing-md);
    }
  }
  
  .add-param-btn {
    width: 100%;
    height: var(--el-button-size);
    border: 2px dashed var(--el-border-color);
    background: transparent;
    
    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--el-spacing-sm);
}

// 响应式设计
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
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
</style> 