import { zhLocale } from './locales/zh.js';
import { enLocale } from './locales/en.js';

// 语言配置
const LANGUAGE = {
    CURRENT: 'zh',  // 在这里明确指定使用的语言
    LOCALES: {
        zh: zhLocale,
        en: enLocale
    }
};

// 替换消息中的变量
function replaceVariables(message, data = {}) {
    return Object.entries(data).reduce(
        (msg, [key, value]) => msg.replace(`{${key}}`, value),
        message
    );
}

// 获取消息
export function getMessage(module, action, data = {}) {
    // 获取当前语言的消息
    const locale = LANGUAGE.LOCALES[LANGUAGE.CURRENT];
    
    // 先获取模块
    let message = locale[module];
    if (!message) {
        return `[${module}.${action}]`;
    }
    
    // 按路径获取消息
    const path = action.split('.');
    for (const key of path) {
        message = message[key];
        if (!message) {
            return `[${module}.${action}]`;
        }
    }
    
    // 替换消息中的变量
    return typeof message === 'string' 
        ? replaceVariables(message, data)
        : `[${module}.${action}]`;
}

// 核心���置
export const CONFIG = {
    // Helius API 配置
    HELIUS: {
        API_KEY: 'f9fa6d1c-2032-44fb-9f6f-5f74de53e767',
        API_ENDPOINT: 'https://api.helius.xyz/v0',
        ENDPOINTS: {
            GET_ACCOUNT_TRANSACTIONS: '/addresses/{address}/transactions'
        },
        // Helius API 限制每次最多返回 100 条记录
        BATCH_SIZE: 100
    },

    // RPC配置
    RPC: {
        ENDPOINT: 'https://boldest-broken-gas.solana-mainnet.quiknode.pro/95cb652a0dbf38d8ec52bfbe02e99a941ab51a67/',
        COMMITMENT: 'confirmed',
        TIMEOUT: 10000
    },

    // 代币配置
    TOKENS: {
        // SOL代币
        SOL: {
            MINT: "So11111111111111111111111111111111111111112",
            ACCOUNT: "FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5"
        },
        // MINIDOGE代币
        MINIDOGE: {
            MINT: "8J6CexwfJ8CSzn2DgWhzQe1NHd2hK9DKX59FCNNMo2hu",
            ACCOUNT: "8fiAHtmdP3g8ah4TceoDcgjtH81krQHco8RaUSmC3kVi"
        },
        // USDC代币
        USDC: {
            MINT: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            ACCOUNT: "DD7nZPcgbhfM7qMG33iuKJ3in8U3wbUzVnheB5ob27pf"
        },
        // USDT代币
        USDT: {
            MINT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            ACCOUNT: "VQkRW7jv4NVe5TJeSMTYMvWUzZUoHYeHZKa39MbYnMN"
        },
    },

    // 时间相关配置
    TIMING: {
        API_TIMEOUT: 10000,
        RETRY: {
            MAX_ATTEMPTS: 10,
            INITIAL_DELAY: 1000,
            MAX_DELAY: 10000
        },
        // 监控间隔
        MONITOR_INTERVAL: 60000,
        COUNTDOWN: {
            INTERVAL: 1000  // 倒计时更新间隔 (1秒)
        }
    },

    // 功能开关
    FEATURES: {
        ENABLE_CRON: true,
        ENABLE_START_API: true
    },

    // 捐赠记录更新配置
    DONATION: {
        // 全量更新配置
        FULL_UPDATE: {
            // 两次全量更新的间隔（毫秒）
            MIN_INTERVAL: 1 * 5 * 60 * 1000  // 5分钟
        },

        // 出错重试间隔（毫秒）
        RETRY_INTERVAL: 60 * 1000  // 1分钟
    },

    // 获取代币列表
    getTokensList() {
        return Object.keys(this.TOKENS);
    }
};

// 数据库配置
export const DB = {
    // 本地测试配置
    // PATH: '.wrangler/state/v3/d1/minidoge-donation-tracker-db.sqlite3',
    
    // 最小捐赠金额
    MIN_DONATION_AMOUNT: 0.0001,
    
    // 数据库表结构
    SCHEMA: {
        transactions: `
            CREATE TABLE IF NOT EXISTS transactions (
                signature TEXT PRIMARY KEY,
                from_account TEXT,
                to_account TEXT,
                token_amount REAL,
                mint TEXT,
                timestamp INTEGER,
                processed_at TEXT,
                is_simple_transfer INTEGER DEFAULT 1  -- 1表示是普通转账
            );
            CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
        `,
        donations: `
            CREATE TABLE IF NOT EXISTS donations (
                from_account TEXT PRIMARY KEY,
                token_amounts TEXT,  -- JSON格式存储各代币数量 {"SOL": 0.1, "MINIDOGE": 1000, ...}
                first_donation_time INTEGER,
                last_donation_time INTEGER,
                last_processed_signature TEXT,
                donation_count INTEGER DEFAULT 0  -- 捐赠次数
            );
            CREATE INDEX IF NOT EXISTS idx_donations_first_time ON donations(first_donation_time DESC);
            CREATE INDEX IF NOT EXISTS idx_donations_last_time ON donations(last_donation_time DESC);
        `
    },

    // 查询条件
    QUERY: {
        // 获取捐赠记录的基本条件
        DONATION_CONDITIONS: {
            IS_SIMPLE_TRANSFER: 1,
            MIN_AMOUNT: 0.0001
        },
        
        // 排序
        SORT: {
            TIMESTAMP_DESC: 'timestamp DESC',
            TIMESTAMP_ASC: 'timestamp ASC',
            FIRST_DONATION_DESC: 'first_donation_time DESC',
            TIMESTAMP_AND_SIG_DESC: 'timestamp DESC, signature DESC',
            TIMESTAMP_AND_SIG_ASC: 'timestamp ASC, signature ASC'
        },

        // 表字段
        FIELDS: {
            TRANSACTIONS: {
                SIGNATURE: 'signature',
                FROM_ACCOUNT: 'from_account',
                TO_ACCOUNT: 'to_account',
                TOKEN_AMOUNT: 'token_amount',
                MINT: 'mint',
                TIMESTAMP: 'timestamp',
                PROCESSED_AT: 'processed_at',
                IS_SIMPLE_TRANSFER: 'is_simple_transfer'
            },
            DONATIONS: {
                FROM_ACCOUNT: 'from_account',
                TOKEN_AMOUNTS: 'token_amounts',
                FIRST_DONATION_TIME: 'first_donation_time',
                LAST_DONATION_TIME: 'last_donation_time',
                LAST_SIGNATURE: 'last_processed_signature',
                DONATION_COUNT: 'donation_count'
            }
        }
    }
};

// 错误信息
export const ERROR_MESSAGES = {
    TRANSACTION_TIMEOUT: getMessage('system.error', 'transaction_timeout'),
    INVALID_RESPONSE: getMessage('system.error', 'api_response'),
    DATABASE_ERROR: getMessage('db.error', 'init_failed'),
    UNKNOWN_ERROR: getMessage('system.error', 'unknown')
};

// 参数名称翻译映射
const PARAM_NAME_MAP = Object.keys(LANGUAGE.LOCALES[LANGUAGE.CURRENT].params).reduce((map, key) => {
    map[key] = getMessage('params', key);
    return map;
}, {});

/**
 * 格式化日期
 * @param {number} timestamp 时间戳（秒或毫秒）
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(timestamp) {
    // 如果时间戳小于 2000 年，说明是秒级时间戳，需要转换为毫秒
    const milliseconds = timestamp < 946684800000 ? timestamp * 1000 : timestamp;
    return new Date(milliseconds).toISOString();
}

/**
 * 格式化日志消息
 * @param {string} module 模块名称
 * @param {string} action 动作
 * @param {Object} data 数据
 * @returns {string} 格式化后的消息
 */
export function formatLog(module, action, data = {}) {
    const timestamp = formatDate(new Date());
    const prefix = `[${timestamp}] `;
    
    // 处理时间相关数据
    const processedData = { ...data };
    if (processedData.time) {
        processedData.time = formatDate(processedData.time);
    }
    if (processedData.start) {
        processedData.start = formatDate(processedData.start);
    }
    if (processedData.end) {
        processedData.end = formatDate(processedData.end);
    }
    
    // 获取消息模板并替换参数
    const message = getMessage(module, action, processedData);
    
    // 于某些特定的消息类型，不显示原始数据
    const skipDataDisplay = [
        'main.token_status.title',
        'main.token_status.mint',
        'main.token_status.local_sig',
        'main.token_status.remote_sig',
        'main.token_status.status',
        'main.token_status.db_count',
        'main.update_stats.new_count',
        'main.update_stats.total_count',
        'main.update_stats.time_range',
        'parser.saving',
        'parser.saved',
        'parser.page_saved',
        'parser.all_pages_complete',
        'system.countdown',
        'main.tracker_loop_start',
        'main.tracker_countdown_start'
    ];

    const shouldShowData = !skipDataDisplay.includes(`${module}.${action}`);
    
    if (!shouldShowData) {
        return `${prefix}${message}`;
    }

    // 格式��数据对象，使用翻译后的参数名称
    const formattedData = Object.entries(processedData)
        .filter(([key]) => !message.includes(`{${key}}`)) // 只显示未在消息中使用的数据
        .map(([key, value]) => `${PARAM_NAME_MAP[key] || key}=${value}`)
        .join(', ');
    
    return formattedData ? `${prefix}${message} [${formattedData}]` : `${prefix}${message}`;
}

// 导出当前语言设置
export const LOCALE = 'zh';