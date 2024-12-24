# MiniDoge 捐赠追踪器 API 文档

## API 基本信息

- **基础URL**: `https://donate.mini-doge.com`
- **支持方法**: GET, POST, OPTIONS
- **响应格式**: JSON
- **字符编码**: UTF-8

## 通用说明

### 请求头
所有请求都需要包含以下头部：
```http
Content-Type: application/json
```

### 响应格式
所有响应都遵循以下格式：
```typescript
interface ApiResponse<T> {
    success: boolean;        // 请求是否成功
    data?: T;               // 成功时的数据
    message?: string;       // 错误时的消息
    error?: {              // 错误详情
        name: string;      // 错误类型
        message: string;   // 错误描述
    };
}
```

### 错误码说明
| HTTP状态码 | 说明 |
|------------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 接口不存在 |
| 500 | 服务器内部错误 |

## API 端点

### 1. 健康检查

检查服务是否正常运行。

- **URL**: `/health`
- **方法**: GET
- **描述**: 返回服务的健康状态

#### 请求示例
```http
GET https://donate.mini-doge.com/health
```

#### 响应示例
```json
{
    "status": "ok"
}
```

### 2. 捐赠者列表

获取捐赠者列表，支持分页查询。

- **URL**: `/members`
- **方法**: GET
- **描述**: 分页获取所有捐赠者的捐赠记录，按首次捐赠时间倒序排序

#### 查询参数
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码，从1开始 |
| pageSize | number | 否 | 10 | 每页记录数，最大100 |

#### 请求示例
```http
GET https://donate.mini-doge.com/members?page=1&pageSize=10
```

#### 响应示例
```json
{
    "success": true,
    "data": {
        "donations": [
            {
                "from": "7nK22ynPZP2QzYdQQE5wvDPXtKqGnTAXzGEgqB9F3tBY",
                "tokenAmounts": {
                    "SOL": 0.1,
                    "MINIDOGE": 1000000,
                    "USDC": 100,
                    "USDT": 100
                },
                "firstDonationTime": 1642438400000,
                "lastDonationTime": 1642524800000,
                "lastSignature": "2ZFT8bnSAkzYoNTWXzwwp5KWHPqHQqt1yCxF8kKXKtXQswHqxgvgKzz3wHyUgKxGUhYPqexFyy7hKWHFYraNxXdd",
                "donationCount": 5
            }
            // ... 更多记录
        ],
        "total": 156,        // 总记录数
        "page": 1,          // 当前页码
        "pageSize": 10,     // 每页记录数
        "totalPages": 16    // 总页数
    }
}
```

#### 错误响应示例
```json
{
    "success": false,
    "message": "查询失败",
    "error": {
        "name": "QueryError",
        "message": "数据库查询错误"
    }
}
```

### 响应字段说明

#### Donation 对象
| 字段 | 类型 | 说明 |
|------|------|------|
| from | string | 捐赠者的钱包地址 |
| tokenAmounts | object | 各代币的捐赠总额 |
| firstDonationTime | number | 首次捐赠时间戳（毫秒） |
| lastDonationTime | number | 最后捐赠时间戳（毫秒） |
| lastSignature | string | 最后处理的交易签名 |
| donationCount | number | 捐赠次数 |

#### TokenAmounts 对象
| 字段 | 类型 | 说明 |
|------|------|------|
| SOL | number | SOL代币数量 |
| MINIDOGE | number | MINIDOGE代币数量 |
| USDC | number | USDC代币数量 |
| USDT | number | USDT代币数量 |

## 跨域支持

API 支持跨域请求（CORS），允许的配置如下：

```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

## 使用限制

1. 请求频率限制
   - 每个IP每分钟最多100次请求
   - 超出限制将返回 429 状态码

2. 数据限制
   - 每页最多返回100条记录
   - 时间戳使用毫秒级

## 最佳实践

1. 建议使用
   - 使用适当的页面大小（10-20条记录）
   - 实现请求重试机制
   - 缓存不常变化的数据

2. 避免
   - 频繁请求相同数据
   - 使用过大的页面大小
   - 在短时间内发送大量请求

## 更新日志

### v1.0.0 (2024-01-20)
- 初始版本发布
- 支持健康检查接口
- 支持捐赠者列表查询

## 联系方式

如有API相关问题，请通过以下方式联系：
- GitHub Issues: [项目地址](https://github.com/yourusername/minidoge-donation-tracker)
- Email: support@mini-doge.com 