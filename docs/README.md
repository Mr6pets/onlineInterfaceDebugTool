# 在线接口调试工具

## 项目概述

这是一个功能强大的在线API接口调试工具，支持多版本部署和跨平台使用。

## 版本说明

### Lite版 - 轻便版
- 基础HTTP请求功能
- 简洁的用户界面
- 适合快速接口测试

### Full版 - 完全版
- 完整的接口管理功能
- 环境变量支持
- 接口集合管理
- 历史记录
- 数据导入导出

### Pro版 - 加强版
- 团队协作功能
- 接口监控和性能分析
- Mock服务
- 自动化测试
- 高级认证支持

## 快速开始

### 安装依赖
```bash
pnpm install

### 开发模式
```
# Lite版
pnpm dev:lite

# Full版
pnpm dev:full

# Pro版
pnpm dev:pro
```
### 构建部署
```
# 构建所有版本
pnpm build:all

# 构建单个版本
pnpm build:lite
pnpm build:full
pnpm build:pro
```
## 技术栈
- 前端框架 : Vue 3 + TypeScript
- UI组件 : Element Plus
- 状态管理 : Pinia
- 构建工具 : Vite
- 代码编辑器 : Monaco Editor
- 图表库 : ECharts
## 项目结构
```
onlineInterfaceDebugTool/
├── packages/
│   ├── shared/          # 共享组件和工具
│   ├── web-lite/        # Lite版本
│   ├── web-full/        # Full版本
│   └── web-pro/         # Pro版本
├── scripts/             # 构建脚本
├── docs/               # 项目文档
└── dist/               # 构建输出
```
## 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request
## 许可证
MIT License

```

## 🎯 下一步操作

现在项目架构已经完整搭建完成！您可以：

1. **安装依赖并启动**：
```bash
cd 
d:\GitHubStore\onlineInterfaceDebugTool
pnpm install
pnpm dev:lite  # 启动Lite版
```
2. 查看不同版本 ：
   
   - Lite版： http://localhost:3000
   - Full版： http://localhost:3001
   - Pro版： http://localhost:3002
3. 继续开发 ：我可以帮您完善具体的功能模块
项目特色：

- ✅ 完整的Monorepo架构
- ✅ 三个版本渐进式功能
- ✅ 共享组件库
- ✅ TypeScript类型安全
- ✅ 现代化开发工具链
- ✅ 响应式设计