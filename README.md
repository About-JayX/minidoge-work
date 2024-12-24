# MiniDoge 捐赠追踪器

## 项目简介
MiniDoge 捐赠追踪器是一个基于 Cloudflare Worker 的服务，用于追踪和统计 MiniDoge 项目的捐赠记录。该服务支持多种代币的捐赠追踪，包括 SOL、MINIDOGE、USDC 和 USDT。

## 系统架构

### 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                        │
├─────────────────┬─────────────────────┬───────────────────┤
│   HTTP 服务层   │    业务逻辑层       │    数据访问层     │
│                 │                     │                   │
│ - 路由处理      │ - 捐赠数据处理      │ - 数据库操作      │
│ - CORS 中间件   │ - 交易追踪          │ - 缓存管理        │
│ - 错误处理      │ - 定时任务          │ - 数据同步        │
└─────────┬───────┴──────────┬──────────┴────────┬──────────┘
          │                  │                   │
          ▼                  ▼                   ▼
    External API        Cloudflare D1      Solana Chain
    (Helius API)         Database
```

### 核心模块说明

#### 1. HTTP 服务层
- **路由管理**
  - `/health`: 健康检查接口
  - `/members`: 捐赠者查询接口
- **中间件处理**
  - CORS 跨域处理
  - 请求参数验证
  - 响应格式化
- **错误处理**
  - HTTP 错误处理
  - 业务异常处理
  - 全局异常捕获

#### 2. 业务逻辑层
- **App 类**
  ```
  App
  ├── init()           // 应用初始化
  ├── start()          // 启动服务
  ├── stop()           // 停止服务
  ├── handleRequest()  // 处理 HTTP 请求
  └── setupSignalHandlers() // 信号处理
  ```

- **DonationService 类**
  ```
  DonationService
  ├── processDonationData()    // 处理捐赠数据
  ├── startProgressDisplay()   // 显示进度
  ├── stopProgressDisplay()    // 停止进度显示
  ├── startCountdown()        // 开始倒计时
  └── getTimeToNextFullUpdate() // 获取下次更新时间
  ```

- **Tracker 类**
  ```
  Tracker
  ├── init()           // 初始化追踪器
  ├── start()          // 开始追踪
  ├── stop()           // 停止追踪
  └── processTransactions() // 处理交易
  ```

#### 3. 数据访问层
- **数据库操作**
  ```
  Database
  ├── createLocalDB()      // 创建数据库连接
  ├── getDonations()       // 获取捐赠记录
  ├── saveDonations()      // 保存捐赠记录
  ├── getTransactions()    // 获取交易记录
  └── saveTransactions()   // 保存交易记录
  ```

### 数据流说明

1. **捐赠数据处理流程**
```
链上交易 ──► Helius API ──► Tracker ──► DonationService ──► Database
                                          │
                                          ▼
                                    数据统计和更新
```

2. **API 请求处理流程**
```
HTTP 请求 ──► Worker ──► App.handleRequest ──► 业务处理 ──► Database ──► HTTP 响应
```

3. **定时任务处理流程**
```
Cron 触发 ──► scheduled() ──► App 初始化 ──► 全量更新 ──► 完成
```

### 数据模型

1. **交易记录模型**
```typescript
interface Transaction {
    signature: string;        // 交易签名（主键）
    from_account: string;     // 发送方地址
    to_account: string;       // 接收方地址
    token_amount: number;     // 代币数量
    mint: string;            // 代币类型
    timestamp: number;        // 交易时间
    processed_at: string;     // 处理时间
    is_simple_transfer: number; // 是否简单转账
}
```

2. **捐赠记录模型**
```typescript
interface Donation {
    from_account: string;     // 捐赠者地址（主键）
    token_amounts: {          // 代币数量（JSON）
        SOL?: number;
        MINIDOGE?: number;
        USDC?: number;
        USDT?: number;
    };
    first_donation_time: number;  // 首次捐赠时间
    last_donation_time: number;   // 最后捐赠时间
    last_processed_signature: string; // 最后处理的交易
    donation_count: number;      // 捐赠次数
}
```

### 模块交互

1. **初始化流程**
```
App.init()
  ├── 创建数据库连接
  ├── 初始化 Tracker
  └── 初始化 DonationService
```

2. **数据更新流程**
```
DonationService.processDonationData()
  ├── 获取交易数据
  ├── 解析交易信息
  ├── 更新捐赠统计
  └── 保存到数据库
```

3. **API 调用流程**
```
App.handleRequest()
  ├── 路由匹配
  ├── 参数验证
  ├── 业务处理
  └── 响应格式化
```

### 定时任务

1. **重启任务 (每2小时)**
```
scheduled()
  ├── 创建 App 实例
  ├── 初始化应用
  ├── 执行全量更新
  └── 记录执行日志
```

### 性能优化策略

1. **数据库优化**
   - 使用索引加速查询
   - 批量处理事务
   - 增量更新机制

2. **缓存策略**
   - 内存缓存热点数据
   - 定期刷新机制
   - 按需加载

3. **并发处理**
   - 异步处理大量数据
   - 分批处理交易记录
   - 避免阻塞主线程

### 安全架构

1. **数据安全**
   - 参数验证和清理
   - SQL 注入防护
   - 敏感信息加密

2. **访问控制**
   - CORS 策略
   - API 访问限制
   - 错误信息脱敏

3. **监控告警**
   - 错误日志记录
   - 性能指标监控
   - 异常情况告警

## 技术架构

### 核心组件
1. **App 类**
   - 负责管理整个应用的生命周期
   - 处理 HTTP 请求和路由
   - 管理服务实例和数据库连接

2. **DonationService 类**
   - 负责处理捐赠数据的更新
   - 支持全量更新和增量更新
   - 包含进度显示和倒计时功能

3. **Tracker 类**
   - 负责追踪链上交易
   - 实时监控捐赠交易
   - 处理交易数据的解析和存储

### 数据库结构
1. **transactions 表**
```sql
CREATE TABLE transactions (
    signature TEXT PRIMARY KEY,
    from_account TEXT,
    to_account TEXT,
    token_amount REAL,
    mint TEXT,
    timestamp INTEGER,
    processed_at TEXT,
    is_simple_transfer INTEGER DEFAULT 1
);
```

2. **donations 表**
```sql
CREATE TABLE donations (
    from_account TEXT PRIMARY KEY,
    token_amounts TEXT,  -- JSON格式存储各代币数量
    first_donation_time INTEGER,
    last_donation_time INTEGER,
    last_processed_signature TEXT,
    donation_count INTEGER DEFAULT 0
);
```

## API 接口

### 1. 健康检查
- **路径**: `/health`
- **方法**: GET
- **响应示例**:
```json
{
    "status": "ok"
}
```

### 2. 捐赠者列表
- **路径**: `/members`
- **方法**: GET
- **参数**:
  - `page`: 页码（默认：1）
  - `pageSize`: 每页记录数（默认：10）
- **响应示例**:
```json
{
    "success": true,
    "data": {
        "donations": [
            {
                "from": "钱包地址",
                "tokenAmounts": {
                    "SOL": 0.1,
                    "MINIDOGE": 1000
                },
                "firstDonationTime": 1642438400000,
                "lastDonationTime": 1642524800000,
                "lastSignature": "交易签名",
                "donationCount": 1
            }
        ],
        "total": 100,
        "page": 1,
        "pageSize": 10,
        "totalPages": 10
    }
}
```

## 定时任务
服务包含自动化的定时任务：

1. **重启任务**
   - 频率：每2小时执行一次
   - 配置：`wrangler.toml` 中的 `crons = ["*/120 * * * *"]`
   - 功能：
     - 重新初始化应用
     - 执行全量数据更新
     - 记录执行日志

## 配置说明

### 1. 核心配置 (config.js)
```javascript
export const CONFIG = {
    // Helius API 配置
    HELIUS: {
        API_KEY: 'your-api-key',
        API_ENDPOINT: 'https://api.helius.xyz/v0'
    },

    // RPC配置
    RPC: {
        ENDPOINT: 'your-rpc-endpoint',
        COMMITMENT: 'confirmed',
        TIMEOUT: 10000
    },

    // 代币配置
    TOKENS: {
        SOL: { ... },
        MINIDOGE: { ... },
        USDC: { ... },
        USDT: { ... }
    },

    // 功能开关
    FEATURES: {
        ENABLE_CRON: false,
        ENABLE_START_API: true
    }
};
```

### 2. 数据库配置
```javascript
export const DB = {
    PATH: '.wrangler/state/v3/d1/minidoge-donation-tracker-db.sqlite3',
    MIN_DONATION_AMOUNT: 0.0001
};
```

## 跨域支持
服务支持跨域请求（CORS），配置如下：
```javascript
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};
```

## 部署说明

### 1. 环境要求
- Node.js >= 14
- Wrangler CLI

### 2. 安装依赖
```bash
yarn install
```

### 3. 本地开发
```bash
yarn dev
```

### 4. 部署到 Cloudflare
```bash
yarn deploy
```

## 错误处理
服务实现了完整的错误处理机制：
1. HTTP 请求错误处理
2. 数据库操作错误处理
3. 定时任务错误处理
4. 未捕获异常处理

## 监控和日志
服务使用 `formatLog` 函数统一处理日志格式，包含：
1. 操作类型
2. 时间戳
3. 详细信息
4. 错误堆栈（如果有）

## 性能优化
1. 数据库索引优化
2. 增量更新机制
3. 批量处理事务
4. 响应数据缓存

## 安全措施
1. 输入参数验证
2. SQL 注入防护
3. API 访问控制
4. 敏感信息保护

## 国际化支持
支持中文和英文两种语言，通过 `locales` 目录下的语言文件配置。 