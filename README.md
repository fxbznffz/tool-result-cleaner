
# tool-result-cleaner OpenClaw Plugin

OpenClaw 工具输出智能净化插件，过滤无用日志、自动去重、保留关键报错，高噪音场景节省 90%+ Token，提升大模型响应速度、保护上下文窗口。

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js version](https://img.shields.io/badge/node-%3E%3D16-green.svg)
![OpenClaw version](https://img.shields.io/badge/openclaw-%3E%3D2026.5.7-orange.svg)

## 基本信息

**支持 runtime**：pi  
**插件类型**：agentToolResultMiddleware
**版本**：v1.1.0
**语言**：JavaScript (ES Module)

## 简介

**tool-result-cleaner** 是一个 OpenClaw 插件，专门用于在工具调用结果发送到语言模型之前对其进行清理和压缩。它能够智能地去除搜索/执行输出中的噪声、重复内容和无关信息，同时保留对决策最关键的内容。

## 特性

### 🎯 核心功能
- **智能垃圾过滤**：自动识别并去除 npm、yarn、pip、apt 等包管理工具的警告、进度信息、调试日志等噪声
- **重复内容去除**：trim 后去重，解决带空格的重复刷屏问题
- **关键词保留**：优先保留包含 error、fail、warning、critical 等重要关键词的内容
- **空白行清理**：清理纯空格、制表符等无意义的空行
- **行数限制**：默认限制每个文本块最多显示 80 行
- **配置灵活**：支持自定义关键词、行数限制和调试模式

### 📊 测试结果

#### 场景：npm install request（包含大量废弃警告）
**原始输出**（673字符，227 Token）：
```
npm warn deprecated har-validator@5.1.5: this library is no longer supported
npm warn deprecated uuid@3.4.0: uuid@10 and below is no longer supported. For ESM codebases, update to uuid@latest. For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
npm warn deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142

added 48 packages, and audited 49 packages in 1s

3 packages are looking for funding
  run `npm fund` for details

4 vulnerabilities (2 moderate, 2 critical)

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.
```

**清理后**（42字符，14 Token）：
```
4 vulnerabilities (2 moderate, 2 critical)
```

**优化效果**：
- 字符节省：**93.8%**
- Token节省：**93.8%**
- 保留了最关键的安全漏洞信息

## 安装方法

### 方法一：使用 OpenClaw 扩展管理器（推荐）

```bash
# 直接下载到 extensions 目录
git clone https://github.com/fxbznffz/tool-result-cleaner.git ~/.openclaw/extensions/tool-result-cleaner

# 或者使用 npm 安装
npm install -g openclaw-plugin-tool-result-cleaner
```

### 方法二：手动安装

1. 下载插件代码到 OpenClaw 扩展目录：
   ```bash
   mkdir -p ~/.openclaw/extensions/tool-result-cleaner
   cd ~/.openclaw/extensions/tool-result-cleaner
   wget https://github.com/fxbznffz/tool-result-cleaner/archive/refs/heads/main.zip
   unzip main.zip
   mv tool-result-cleaner-main/* .
   rm -rf tool-result-cleaner-main main.zip
   ```

2. 更新配置文件 `~/.openclaw/openclaw.json`，确保插件被启用：
   ```json
   {
     "plugins": {
       "entries": {
         "tool-result-cleaner": {
           "enabled": true
         }
       }
     }
   }
   ```

3. 重启 OpenClaw 服务：
   ```bash
   openclaw restart
   ```

## 使用方法

### 启用插件
```json
// ~/.openclaw/openclaw.json
{
  "plugins": {
    "entries": {
      "tool-result-cleaner": {
        "enabled": true
      }
    }
  }
}
```

### 配置选项

#### 基础配置
```json
{
  "plugins": {
    "entries": {
      "tool-result-cleaner": {
        "enabled": true,
        "maxLinesPerBlock": 80,
        "importantKeywords": ["error", "fail", "warning", "critical", "ERR", "FAIL"],
        "debug": false
      }
    }
  }
}
```

#### 自定义关键词
```json
{
  "plugins": {
    "entries": {
      "tool-result-cleaner": {
        "enabled": true,
        "importantKeywords": ["error", "warning", "fail", "exception", "critical"]
      }
    }
  }
}
```

### 调试模式
```json
{
  "plugins": {
    "entries": {
      "tool-result-cleaner": {
        "enabled": true,
        "debug": true
      }
    }
  }
}
```

## 工作原理

### 处理流程
1. **工具调用**：OpenClaw 执行工具调用
2. **原始输出**：工具返回原始格式的结果
3. **插件处理**：tool-result-cleaner 按照以下步骤处理结果
   - 垃圾日志过滤
   - 空白行清理
   - 行级去重
   - 关键词保留
   - 行数限制
4. **发送到模型**：处理后的结果作为上下文发送到语言模型

### 执行位置
```
工具调用 → 原始输出 → tool-result-cleaner 插件处理 → 发送到模型
```

### 支持的工具类型
- 搜索工具（web_search）
- 执行命令（exec）
- 浏览器操作（browser）
- 文件操作（read、write）
- 其他所有 OpenClaw 工具

## 技术架构

### 核心文件结构
```
tool-result-cleaner/
├── index.js           # 主处理逻辑
├── openclaw.plugin.json    # 插件元数据
├── package.json       # 依赖和配置
└── README.md          # 说明文档
```

### 依赖
- 无外部依赖，完全使用 Node.js 内置模块
- 支持 CommonJS 和 ES 模块

## 测试与验证

### 运行测试
```bash
cd ~/.openclaw/extensions/tool-result-cleaner
node test_simple.js
```

### 测试结果

| 场景 | 原始字符 | 原始Token | 清理后字符 | 清理后Token | 节省率 |
|------|----------|-----------|------------|------------|--------|
| npm install request | 673 | 227 | 42 | 14 | 93.8% |
| npm install lodash | 345 | 115 | 58 | 19 | 83.5% |
| pip install numpy | 289 | 96 | 37 | 12 | 87.5% |

## 常见问题

### 1. 插件不工作？
- 检查配置文件是否设置 `enabled: true`
- 确认 OpenClaw 版本 >= 2026.5.7
- 重启 OpenClaw 服务
- 检查是否有其他插件冲突

### 2. 如何自定义过滤规则？
在 `index.js` 中修改垃圾日志过滤的正则表达式：
```javascript
const GARBAGE_PATTERNS = /^\s*(npm notice|npm WARN|Tarball Details|File:)/gim;
```

### 3. 如何调整行数限制？
```json
{
  "plugins": {
    "entries": {
      "tool-result-cleaner": {
        "maxLinesPerBlock": 100
      }
    }
  }
}
```

### 4. 插件会影响性能吗？
- 处理时间：<1ms/字符
- 内存使用：可忽略不计
- 对性能影响：无明显影响

## 许可证

MIT License

## 作者

fxbznffz

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 [Issue](https://github.com/fxbznffz/tool-result-cleaner/issues)
- 发送邮件至：52745091@qq.com

## 更新日志

### v1.1.0（2026-05-14）
- ✨ 增强 npm/yarn/pip/apt 垃圾日志匹配
- ✨ 优化空白行、伪重复行去重
- ✨ 关键词大小写不敏感识别
- ✨ 智能保留漏洞、错误、警告关键行
- ✨ 增加调试模式和详细的统计信息

### v1.0.0（2026-05-13）
- 基础插件功能
- 垃圾日志过滤
- 空白行清理
- 关键词保留
