/**
 * 数据库查询条件说明：
 * 
 * 所有查询的共同条件：
 * 1. is_simple_transfer = 1：必须是普通转账
 * 2. to_account = CONFIG.TOKENS.SOL.ACCOUNT：接收账户是 SOL 代币的账户
 * 3. token_amount >= 0.0001：转账金额必须大于等于最小捐赠金额
 * 
 * 这些条件确保了：
 * 1. 只处理普通的转账交易
 * 2. 只处理发送到指定账户的交易
 * 3. 只处理超过最小金额的交易
 * 4. 按照合适的顺序处理交易（时间升序或降序）
 */

import { CONFIG, DB, formatLog, formatDate } from '../config.js';

// 数据库表结构定义
const DB_SCHEMA = {
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
};

/**
 * 创建本地数据库连接
 * @param {Object} db 数据库连接对象
 * @returns {Promise<Object>} 初始化后的数据库连接对象
 */
export async function createLocalDB(db) {
    try {
        // 初始化数据库表
        await initDB(db);
        return db;
    } catch (error) {
        console.error(formatLog('db.error', 'init_failed', { error: error.message }));
        throw error;
    }
}

/**
 * 获取最新的交易签名
 * @param {Object} db 数据库连接
 * @param {string} tokenAccount 代币账户地址
 * @param {string} mint 代币地址
 * @returns {Promise<string|null>} 最新的交易签名
 * 
 *  * 查询条件：
 * - 指定代币地址和接收账户
 * - 按时间戳倒序，获取最新的一条记录
 * 
 */
export async function getLatestSignature(db, tokenAccount, mint) {
    try {
        const stmt = await db.prepare(`
            SELECT ${DB.QUERY.FIELDS.TRANSACTIONS.SIGNATURE} 
            FROM transactions 
            WHERE ${DB.QUERY.FIELDS.TRANSACTIONS.MINT} = ?
            AND ${DB.QUERY.FIELDS.TRANSACTIONS.TO_ACCOUNT} = ?
            ORDER BY ${DB.QUERY.SORT.TIMESTAMP_DESC}
            LIMIT 1
        `);
        const result = await stmt.first(mint);
        return result?.signature || null;
    } catch (error) {
        console.error(formatLog('db.error', 'get_signature_failed', { 
            account: tokenAccount,
            mint,
            error: error.message 
        }));
        throw error;
    }
}

/**
 * 检查表是否存在
 */
export async function checkTableExists(db, tableName) {
    const stmt = await db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
    `);
    const result = await stmt.first(tableName);
    return !!result;
}

/**
 * 初始化数据库
 */
export async function initDB(db) {
    console.log(formatLog('db', 'init'));
    
    try {
        // 检查必要的表是否已存在
        const tablesExist = await Promise.all([
            checkTableExists(db, 'transactions'),
            checkTableExists(db, 'donations')
        ]);
        
        if (tablesExist.every(exists => exists)) {
            console.log(formatLog('db', 'tables_exist'));
            return true;
        }

        // 创建 transactions 表
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                signature TEXT PRIMARY KEY,
                from_account TEXT,
                to_account TEXT,
                token_amount REAL,
                mint TEXT,
                timestamp INTEGER,
                processed_at TEXT,
                is_simple_transfer INTEGER DEFAULT 1
            )
        `);

        // 创建 transactions 表的索引
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_transactions_timestamp 
            ON transactions(timestamp DESC)
        `);

        // 创建 donations 表
        await db.exec(`
            CREATE TABLE IF NOT EXISTS donations (
                from_account TEXT PRIMARY KEY,
                token_amounts TEXT,
                first_donation_time INTEGER,
                last_donation_time INTEGER,
                last_processed_signature TEXT,
                donation_count INTEGER DEFAULT 0
            )
        `);

        // 创建 donations 表的索引
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_donations_first_time 
            ON donations(first_donation_time DESC)
        `);
        await db.exec(`
            CREATE INDEX IF NOT EXISTS idx_donations_last_time 
            ON donations(last_donation_time DESC)
        `);
        
        console.log(formatLog('db', 'init_success'));
        return true;
    } catch (error) {
        console.error(formatLog('db.error', 'init_failed'), error);
        throw error;
    }
}

/**
 * 批量保存交易记录
 */
export async function saveTransactions(db, transactions) {
    if (!transactions || transactions.length === 0) {
        return;
    }

    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO transactions 
        (${DB.QUERY.FIELDS.TRANSACTIONS.SIGNATURE}, 
         ${DB.QUERY.FIELDS.TRANSACTIONS.FROM_ACCOUNT}, 
         ${DB.QUERY.FIELDS.TRANSACTIONS.TO_ACCOUNT}, 
         ${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT}, 
         ${DB.QUERY.FIELDS.TRANSACTIONS.MINT}, 
         ${DB.QUERY.FIELDS.TRANSACTIONS.TIMESTAMP}, 
         ${DB.QUERY.FIELDS.TRANSACTIONS.PROCESSED_AT}, 
         ${DB.QUERY.FIELDS.TRANSACTIONS.IS_SIMPLE_TRANSFER})
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 使用 formatDate 格式化当前时间
    const now = formatDate(Date.now());
    const batch = transactions.map(tx => ({
        stmt: stmt.toString(),
        values: [
            tx.signature,
            tx.fromAccount,
            tx.toAccount,
            tx.tokenAmount,
            tx.mint,
            tx.timestamp,
            now,
            tx.is_simple_transfer ? DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER : 0
        ]
    }));

    // 执行批量插入
    await db.batch(batch);

    console.log(formatLog('parser', 'saved', { 
        count: transactions.length,
        time_range: `${formatDate(transactions[0].timestamp)} 到 ${formatDate(transactions[transactions.length - 1].timestamp)}`
    }));
}

/**
 * 获取指定代币的交易记录数
 * @param {Object} db 数据库连接
 * @param {string} mint 代币地址
 * @returns {Promise<number>} 记录数
 */
export async function getTransactionCount(db, mint) {
    const stmt = await db.prepare(`
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE ${DB.QUERY.FIELDS.TRANSACTIONS.MINT} = ?
    `);
    const result = await stmt.first(mint);
    return result.count;
}

/**
 * 获取捐赠记录列表（按首次捐赠时间倒序排列，最新捐赠的显示在最前）
 * @param {Object} db 数据库连接
 * @param {number} page 页码，从1开始
 * @param {number} pageSize 每页记录数
 * @returns {Promise<Object>} 返回对象包含：
 *   - donations: 捐赠记录数组
 *   - total: 总记录数
 *   - page: 当前页码
 *   - pageSize: 每页记录数
 *   - totalPages: 总页数
 *   获取捐赠记录列表
 *   查询条件：
 * - 必须是普通转账 (is_simple_transfer = 1)
 * - 接收账户是 SOL 代币的账户
 * - 转账金额大于等于最小捐赠金额
 * - 按首次捐赠时间倒序排列
 */
export async function getDonations(db, page = 1, pageSize = 10) {
    try {
        // 1. 获取总记录数（只统计符合捐赠条件的记录：普通转账 且 金额>=0.0001）
        const countStmt = await db.prepare(`
            WITH donor_stats AS (
                SELECT DISTINCT t.from_account
                FROM transactions t
                WHERE t.is_simple_transfer = ?
                AND t.to_account = ?
                AND t.token_amount >= ?
            )
            SELECT COUNT(*) as total FROM donor_stats
        `);
        const { total } = await countStmt.first(
            DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER,
            CONFIG.TOKENS.SOL.ACCOUNT,
            DB.QUERY.DONATION_CONDITIONS.MIN_AMOUNT
        );

        // 2. 计算分页参数
        const totalPages = Math.ceil(total / pageSize);
        const offset = (page - 1) * pageSize;

        // 3. 获取分页数据
        const stmt = await db.prepare(`
            WITH donor_stats AS (
                SELECT 
                    t.from_account,
                    t.mint,
                    SUM(t.token_amount) as total_amount,
                    MIN(t.timestamp) as first_donation_time,
                    MAX(t.timestamp) as last_donation_time,
                    MAX(t.signature) as last_signature,
                    COUNT(*) as donation_count
                FROM transactions t
                WHERE t.is_simple_transfer = ?
                AND t.to_account = ?
                AND t.token_amount >= ?
                GROUP BY t.from_account, t.mint
            ),
            donor_summary AS (
                SELECT 
                    from_account,
                    json_group_object(
                        CASE 
                            WHEN mint = ? THEN 'SOL'
                            WHEN mint = ? THEN 'MINIDOGE'
                            WHEN mint = ? THEN 'USDC'
                            WHEN mint = ? THEN 'USDT'
                            ELSE mint 
                        END,
                        total_amount
                    ) as token_amounts,
                    MIN(first_donation_time) as first_donation_time,
                    MAX(last_donation_time) as last_donation_time,
                    MAX(last_signature) as last_signature,
                    SUM(donation_count) as donation_count
                FROM donor_stats
                GROUP BY from_account
                ORDER BY ${DB.QUERY.SORT.FIRST_DONATION_DESC}
                LIMIT ? OFFSET ?
            )
            SELECT 
                from_account,
                token_amounts,
                first_donation_time,
                last_donation_time,
                last_signature,
                donation_count
            FROM donor_summary
            ORDER BY ${DB.QUERY.SORT.FIRST_DONATION_DESC}
        `);

        const { results: donations } = await stmt.all(
            DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER,
            CONFIG.TOKENS.SOL.ACCOUNT,
            DB.QUERY.DONATION_CONDITIONS.MIN_AMOUNT,
            CONFIG.TOKENS.SOL.MINT,
            CONFIG.TOKENS.MINIDOGE.MINT,
            CONFIG.TOKENS.USDC.MINT,
            CONFIG.TOKENS.USDT.MINT,
            pageSize,
            offset
        );

        // 4. 处理返回的数据
        const processedDonations = donations.map(donation => ({
            from: donation.from_account,
            tokenAmounts: JSON.parse(donation.token_amounts),
            firstDonationTime: donation.first_donation_time,
            lastDonationTime: donation.last_donation_time,
            lastSignature: donation.last_signature,
            donationCount: Number(donation.donation_count)
        }));

        return {
            donations: processedDonations,
            total,
            page,
            pageSize,
            totalPages
        };
    } catch (error) {
        console.error(formatLog('donation.error', 'get_failed', { error: error.message }));
        throw error;
    }
}

/**
 * 保存或更新捐赠记录
 * 如果记录已存在（相同的 from_account），则更新；否则插入新记录
 * @param {Object} db 数据库连接
 * @param {Array} donations 捐赠记录数组，每条记录包含：
 *   - from: 捐赠者地址
 *   - tokenAmounts: 代币数量对象 {SOL: 0.1, MINIDOGE: 1000, ...}
 *   - firstDonationTime: 首次捐赠时间
 *   - lastDonationTime: 最后捐赠时间
 *   - lastSignature: 最后处理的交易签名
 *   - donationCount: 捐赠次数
 * @returns {Promise<void>}
 */
export async function saveDonations(db, donations) {
    if (!donations || donations.length === 0) {
        return;
    }

    const stmt = await db.prepare(`
        INSERT OR REPLACE INTO donations 
        (${DB.QUERY.FIELDS.DONATIONS.FROM_ACCOUNT}, 
         ${DB.QUERY.FIELDS.DONATIONS.TOKEN_AMOUNTS}, 
         ${DB.QUERY.FIELDS.DONATIONS.FIRST_DONATION_TIME}, 
         ${DB.QUERY.FIELDS.DONATIONS.LAST_DONATION_TIME}, 
         ${DB.QUERY.FIELDS.DONATIONS.LAST_SIGNATURE}, 
         ${DB.QUERY.FIELDS.DONATIONS.DONATION_COUNT})
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const batch = donations.map(donation => ({
        stmt: stmt.toString(),
        values: [
            donation.from,
            JSON.stringify(donation.tokenAmounts),
            donation.firstDonationTime,
            donation.lastDonationTime,
            donation.lastSignature,
            donation.donationCount
        ]
    }));

    await db.batch(batch);
    console.log(formatLog('donation', 'saved', { count: donations.length }));
}

/**
 * 获取所有符合捐赠条件的交易记录
 * 条件：普通转账 且 金额>=0.0001
 * @param {Object} db 数据库连接
 * @returns {Promise<Array>} 交易记录数组，按时间升序排序
 * 查询条件：
 * - 与 getDonations 的基本条件相同
 * - 按时间戳升序排序，从旧到新
 */
export async function getAllTransactions(db) {
    const stmt = await db.prepare(`
        SELECT 
            t.${DB.QUERY.FIELDS.TRANSACTIONS.FROM_ACCOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.MINT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TIMESTAMP},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.SIGNATURE}
        FROM transactions t
        WHERE t.${DB.QUERY.FIELDS.TRANSACTIONS.IS_SIMPLE_TRANSFER} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TO_ACCOUNT} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT} >= ?
        ORDER BY ${DB.QUERY.SORT.TIMESTAMP_ASC}
    `);
    
    const { results: transactions } = await stmt.all(
        DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER,
        CONFIG.TOKENS.SOL.ACCOUNT,
        DB.QUERY.DONATION_CONDITIONS.MIN_AMOUNT
    );
    return transactions;
}

/**
 * 获取最后一条符合捐赠条件的交易记录
 * 用于增量更新时确定起始位置
 * @param {Object} db 数据库连接
 * @returns {Promise<Object|null>} 最后一条交易记录，如果没有则返回null
 * 查询条件：
 * - 与 getDonations 的基本条件相同
 * - 按时间戳和签名倒序，确保获取最新的一条记录
 */
export async function getLastValidTransaction(db) {
    const stmt = await db.prepare(`
        SELECT 
            t.${DB.QUERY.FIELDS.TRANSACTIONS.FROM_ACCOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.MINT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TIMESTAMP},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.SIGNATURE}
        FROM transactions t
        WHERE t.${DB.QUERY.FIELDS.TRANSACTIONS.IS_SIMPLE_TRANSFER} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TO_ACCOUNT} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT} >= ?
        ORDER BY ${DB.QUERY.SORT.TIMESTAMP_AND_SIG_DESC}
        LIMIT 1
    `);
    
    const result = await stmt.first(
        DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER,
        CONFIG.TOKENS.SOL.ACCOUNT,
        DB.QUERY.DONATION_CONDITIONS.MIN_AMOUNT
    );
    return result || null;
}

/**
 * 获取已处理的最新交易记录
 * 用于增量更新时确定起始位置
 * @param {Object} db 数据库连接
 * @returns {Promise<Array>} 新的交易记录数组
 * 查询条件：
 * - 基本条件与 getDonations 相同
 * - 额外条件：处理时间等于最后一次处理时间
 * - 按时间戳和签名倒序排序
 */
export async function getLastProcessedTransactions(db) {
    // 先获取最后处理时间
    const stmt = await db.prepare(`
        SELECT MAX(t.${DB.QUERY.FIELDS.TRANSACTIONS.PROCESSED_AT}) as last_processed_at
        FROM transactions t
        WHERE t.${DB.QUERY.FIELDS.TRANSACTIONS.IS_SIMPLE_TRANSFER} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TO_ACCOUNT} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT} >= ?
    `);
    
    const result = await stmt.first(
        DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER,
        CONFIG.TOKENS.SOL.ACCOUNT,
        DB.QUERY.DONATION_CONDITIONS.MIN_AMOUNT
    );
    if (!result || !result.last_processed_at) {
        return [];
    }

    // 获取该时间点的所有交易
    const txStmt = await db.prepare(`
        SELECT 
            t.${DB.QUERY.FIELDS.TRANSACTIONS.FROM_ACCOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.MINT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TIMESTAMP},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.SIGNATURE},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.PROCESSED_AT}
        FROM transactions t
        WHERE t.${DB.QUERY.FIELDS.TRANSACTIONS.IS_SIMPLE_TRANSFER} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TO_ACCOUNT} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT} >= ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.PROCESSED_AT} = ?
        ORDER BY ${DB.QUERY.SORT.TIMESTAMP_AND_SIG_DESC}
    `);
    
    const { results: transactions } = await txStmt.all(
        DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER,
        CONFIG.TOKENS.SOL.ACCOUNT,
        DB.QUERY.DONATION_CONDITIONS.MIN_AMOUNT,
        result.last_processed_at
    );
    return transactions;
}

/**
 * 获取新的交易记录（用于增量更新）
 * 基于最后处理时间来获取新交易
 * 如果没有处理过的交易，则获取所有符合条件的交易
 * @param {Object} db 数据库连接
 * @returns {Promise<Array>} 新的交易记录数组，按时间和签名升序排序
 * 查询条件：
 * - 基本条件与 getDonations 相同
 * - 额外条件：时间戳大于最后一条捐赠记录的时间
 * - 按时间戳和签名升序排序，确保按时间顺序处理
 */
export async function getNewTransactions(db) {
    // 1. 获取最后一条捐赠记录的时间
    const stmt = await db.prepare(`
        SELECT IFNULL(MAX(${DB.QUERY.FIELDS.DONATIONS.LAST_DONATION_TIME}), 0) as last_time
        FROM donations
    `);
    
    const result = await stmt.first();
    const lastTime = result?.last_time || 0;

    // 2. 获取比最后捐赠时间更新的交易
    const txStmt = await db.prepare(`
        SELECT 
            t.${DB.QUERY.FIELDS.TRANSACTIONS.FROM_ACCOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.MINT},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.TIMESTAMP},
            t.${DB.QUERY.FIELDS.TRANSACTIONS.SIGNATURE}
        FROM transactions t
        WHERE t.${DB.QUERY.FIELDS.TRANSACTIONS.IS_SIMPLE_TRANSFER} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TO_ACCOUNT} = ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TOKEN_AMOUNT} >= ?
        AND t.${DB.QUERY.FIELDS.TRANSACTIONS.TIMESTAMP} > ?
        ORDER BY ${DB.QUERY.SORT.TIMESTAMP_AND_SIG_ASC}
    `);
    
    const { results: transactions } = await txStmt.all(
        DB.QUERY.DONATION_CONDITIONS.IS_SIMPLE_TRANSFER,
        CONFIG.TOKENS.SOL.ACCOUNT,
        DB.QUERY.DONATION_CONDITIONS.MIN_AMOUNT,
        lastTime
    );
    return transactions;
}


