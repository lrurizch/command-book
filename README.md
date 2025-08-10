# 命令手册 - uTools插件

一个功能强大的智能命令管理工具，支持命令管理、搜索、执行和工作流。专为提高开发者效率而设计。

## ✨ 主要功能

### 🚀 核心功能
- **一键复制命令** - 快速复制命令到剪贴板
- **命令分类管理** - 按技术栈、场景等分类组织命令
- **智能搜索过滤** - 支持模糊搜索、关键词搜索和标签筛选
- **自定义参数支持** - 动态参数替换，支持必填和默认值
- **一键创建命令** - 快速添加和编辑命令

### 🔍 搜索和过滤
- **智能搜索** - 支持模糊搜索、关键词搜索
- **标签过滤** - 按技术栈、场景、难度等标签筛选
- **历史搜索** - 保存搜索历史，快速重复查找
- **分类筛选** - 按分类快速定位命令

### ⌨️ 全键盘操作
- **快捷键支持** - 全键盘操作，无需鼠标
- **快速导航** - 上下键导航，回车选择
- **快速操作** - Ctrl+C复制，Ctrl+E执行，F2编辑
- **全局快捷键** - Ctrl+N新建命令模板，Ctrl+F聚焦搜索

### 🔄 命令工作流
- **多步骤工作流** - 将多个命令组合成工作流
- **条件执行** - 根据条件执行不同命令
- **错误处理** - 支持出错时继续执行
- **执行历史** - 记录工作流执行历史和结果

### 🖥️ 终端执行
- **直接执行** - 可选择直接在终端中执行命令
- **参数输入** - 智能参数输入界面
- **执行反馈** - 显示执行结果和状态

### 📊 使用统计
- **使用频率** - 显示最常用的命令
- **统计分析** - 命令使用次数统计
- **热门推荐** - 基于使用频率推荐命令

## 🎯 快捷键说明

### 全局快捷键
- `Ctrl + N` - 新建命令模板
- `Ctrl + Shift + N` - 新建工作流
- `Ctrl + F` - 聚焦搜索框
- `Ctrl + ,` - 打开设置
- `Esc` - 取消/关闭

### 列表导航
- `↑ / ↓` - 上下导航
- `Enter` - 选择当前项
- `Ctrl + C` - 复制当前命令
- `Ctrl + E` - 执行当前命令

### 快速操作
- `Delete` - 删除当前项
- `F2` - 编辑当前项
- `Ctrl + D` - 复制当前项
- `Ctrl + H` - 显示搜索历史

### 分类快捷键
- `Ctrl + 1-5` - 快速选择分类

## 🛠️ 技术栈

- **框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **样式**: SCSS
- **搜索**: Fuse.js (模糊搜索)
- **代码高亮**: Highlight.js

## 📦 安装和使用

### 开发环境

1. 克隆项目
```bash
git clone https://github.com/lruri2/command-handbook.git
cd command-handbook
```

2. 安装依赖
```bash
npm install
```

3. 开发调试
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

### uTools插件安装

1. 构建插件
```bash
npm run build
```

2. 在uTools中安装
   - 打开uTools
   - 进入插件管理
   - 选择"开发者模式"
   - 导入插件文件夹

## 📁 项目结构

```
command-handbook/
├── src/
│   ├── components/          # Vue组件
│   │   ├── CommandCard.vue     # 命令卡片组件
│   │   ├── ParameterModal.vue  # 参数输入模态框
│   │   ├── ConfirmModal.vue    # 确认对话框
│   │   ├── CategoryModal.vue   # 分类编辑模态框
│   │   └── ExecutionHistory.vue # 执行历史组件
│   ├── views/               # 页面组件
│   │   ├── Home.vue            # 主页
│   │   ├── CommandEditor.vue   # 命令编辑器
│   │   ├── WorkflowEditor.vue  # 工作流编辑器
│   │   └── Settings.vue        # 设置页面
│   ├── stores/              # Pinia状态管理
│   │   ├── command.js          # 命令管理
│   │   ├── workflow.js         # 工作流管理
│   │   └── keyboard.js         # 键盘快捷键
│   ├── styles/              # 样式文件
│   │   └── global.scss         # 全局样式
│   ├── router/              # 路由配置
│   │   └── index.js
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
├── public/                  # 静态资源
├── plugin.json             # uTools插件配置
├── preload.js              # uTools预加载脚本
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
└── README.md               # 项目文档
```

## 🔧 核心功能实现

### 数据存储
- 使用uTools数据库进行数据持久化
- 支持导入导出功能
- 本地存储作为fallback

### 搜索引擎
- 基于Fuse.js实现模糊搜索
- 支持多字段搜索（名称、描述、命令、标签）
- 可配置搜索权重和阈值

### 参数系统
- 支持`{{参数名}}`占位符
- 动态参数检测和管理
- 必填参数验证
- 默认值支持

### 工作流引擎
- 支持命令、延迟、条件三种步骤类型
- 条件判断支持等于、不等于、包含、存在
- 错误处理和继续执行
- 执行历史记录

### 键盘导航
- 全键盘操作支持
- 可配置快捷键
- 列表导航和焦点管理
- 模态框键盘交互

## 🎨 界面设计

### 设计原则
- **简洁直观** - 清晰的信息层次和操作流程
- **高效操作** - 支持键盘快捷键和快速操作
- **响应式设计** - 适配不同屏幕尺寸
- **现代化UI** - 使用现代设计语言和交互模式

### 主题色彩
- 主色调: `#007acc` (蓝色)
- 成功色: `#28a745` (绿色)  
- 警告色: `#ffc107` (黄色)
- 危险色: `#dc3545` (红色)
- 信息色: `#17a2b8` (青色)

## 🔒 数据安全

- 所有数据存储在本地
- 支持数据导出备份
- 不收集任何用户信息
- 开源透明，可审查代码

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [uTools](https://u.tools/) - 强大的桌面效率工具
- [Fuse.js](https://fusejs.io/) - 轻量级模糊搜索库
- [Highlight.js](https://highlightjs.org/) - 语法高亮库

## 📞 联系方式

- 作者: lruri2
- 邮箱: [your-email@example.com]
- GitHub: [https://github.com/lruri2]

---

**让命令管理更简单，让开发更高效！** 🚀