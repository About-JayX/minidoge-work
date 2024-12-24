import { CONFIG, formatLog, formatDate } from '../config.js';
import fetch from 'node-fetch';
import { saveTransactions, getLatestSignature } from './database.js';

/**
 * 从Helius API获取账户的交易历史
 * @param {string} accountAddress 账户地址
 * @param {string|null} beforeSignature 分页标记
 * @param {number} limit 每页数量
 * @returns {Promise<Array>} 交易列表
 */
async function fetchAccountTransactions(accountAddress, beforeSignature = null, limit = CONFIG.HELIUS.BATCH_SIZE) {
    console.log(formatLog('tx', 'fetch', { 
        account: accountAddress,
        before: beforeSignature || formatLog('tx.signature', 'latest'),
        limit: limit
    }));

    let attempts = 0;
    const maxAttempts = CONFIG.TIMING.RETRY.MAX_ATTEMPTS;
    let delay = CONFIG.TIMING.RETRY.INITIAL_DELAY;

    while (attempts < maxAttempts) {
        try {
            const baseUrl = new URL(CONFIG.HELIUS.API_ENDPOINT);
            baseUrl.pathname += CONFIG.HELIUS.ENDPOINTS.GET_ACCOUNT_TRANSACTIONS.replace('{address}', accountAddress);
            baseUrl.searchParams.append('api-key', CONFIG.HELIUS.API_KEY);
            const actualLimit = Math.min(limit, CONFIG.HELIUS.BATCH_SIZE);
            baseUrl.searchParams.append('limit', actualLimit.toString());
            
            if (beforeSignature) {
                baseUrl.searchParams.append('before', beforeSignature);
            }

            console.log(formatLog('tx', 'request', {
                url: baseUrl.toString().replace(CONFIG.HELIUS.API_KEY, '***'),
                limit: actualLimit
            }));

            const response = await fetch(baseUrl.toString());
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(formatLog('tx.error', 'api_response', { status: response.status, error: errorText }));
            }

            const transactions = await response.json();
            console.log(formatLog('tx', 'response', {
                count: transactions?.length || 0,
                first: transactions?.[0]?.signature || formatLog('tx.signature', 'none'),
                last: transactions?.[transactions?.length - 1]?.signature || formatLog('tx.signature', 'none')
            }));
            
            return transactions || [];
        } catch (error) {
            attempts++;
            if (attempts === maxAttempts) {
                console.error(formatLog('tx.error', 'fetch_failed', { 
                    account: accountAddress,
                    error: error.message,
                    stack: error.stack,
                    details: JSON.stringify(error, Object.getOwnPropertyNames(error))
                }));
                throw error;
            }
            
            console.log(formatLog('tx', 'retry', {
                attempt: attempts,
                maxAttempts,
                delay,
                error: error.message
            }));
            
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, CONFIG.TIMING.RETRY.MAX_DELAY);
        }
    }
}

/**
 * 判断交易是否为简单转账
 * @param {Object} transaction 交易数据
 * @returns {boolean} 是否为简单转账
 */
function isSimpleTransfer(transaction) {
    if (!transaction) {
        return true;
    }

    // 判断是否为简单转账
    if (transaction.type !== 'TRANSFER') {
        return false;
    }

    // 判断是否为 SPL Token 和 SOL 转账
    if (transaction.source === 'SYSTEM_PROGRAM') {
        // SOL 转账：检查是否只转账给一个账户
        return transaction.nativeTransfers && transaction.nativeTransfers.length === 1;
    } else if (transaction.source === 'SOLANA_PROGRAM_LIBRARY') {
        // SPL Token 转账：检查是否只有一个代币转账
        return transaction.tokenTransfers && transaction.tokenTransfers.length === 1;
    }

    return false;
}

/**
 * 解析代币转账数据
 * @param {Object} transfer 转账数据
 * @param {string} tokenAccount 代币账户
 * @param {Object} transaction 完整交易数据
 * @returns {Object} 解析后的转账数据
 */
function parseTokenTransferData(transfer, tokenAccount, transaction) {
    return {
        signature: transaction.signature,
        fromAccount: transfer.fromUserAccount,
        toAccount: transfer.toUserAccount,
        tokenAmount: transfer.tokenAmount,
        mint: transfer.mint,
        timestamp: transaction.timestamp,
        is_simple_transfer: isSimpleTransfer(transaction) ? 1 : 0
    };
}

/**
 * 解析SOL转账数据
 * @param {Object} transaction 交易数据
 * @param {string} accountAddress 账户地址
 * @returns {Array|null} 解析后的转账数据数组
 */
function parseSolTransferData(transaction, accountAddress) {
    if (!transaction || !transaction.nativeTransfers) {
        return null;
    }

    const transfers = transaction.nativeTransfers.filter(transfer => 
        transfer.toUserAccount === accountAddress || 
        transfer.fromUserAccount === accountAddress
    );

    if (transfers.length === 0) {
        return null;
    }

    const isSimple = isSimpleTransfer(transaction);

    return transfers.map(transfer => ({
        signature: transaction.signature,
        fromAccount: transfer.fromUserAccount,
        toAccount: transfer.toUserAccount,
        tokenAmount: transfer.amount / 1e9, // 转换为 SOL
        mint: CONFIG.TOKENS.SOL.MINT,
        timestamp: transaction.timestamp,
        is_simple_transfer: isSimple ? 1 : 0
    }));
}

/**
 * 解析单个交易数据
 * @param {Object} transaction 交易数据
 * @param {string} tokenAccount 代币账户
 * @returns {Array|null} 解析后的转账数据数组
 */
function parseTransactionData(transaction, tokenAccount) {
    if (!transaction || transaction.transactionError || !transaction.signature || !transaction.timestamp) {
        return null;
    }

    // 如果是 SOL 账户，解析 SOL 转账
    if (tokenAccount === CONFIG.TOKENS.SOL.ACCOUNT) {
        return parseSolTransferData(transaction, tokenAccount);
    }

    // 处理代币转账
    if (!transaction.tokenTransfers) {
        return null;
    }

    // 只处理涉及目标代币账户的转账
    const relevantTransfers = transaction.tokenTransfers.filter(transfer => 
        (transfer.toTokenAccount === tokenAccount || transfer.fromTokenAccount === tokenAccount) &&
        transfer.tokenAmount > 0
    );

    if (relevantTransfers.length === 0) {
        return null;
    }

    return relevantTransfers.map(transfer => ({
        signature: transaction.signature,
        fromAccount: transfer.fromUserAccount,
        toAccount: transfer.toUserAccount,
        tokenAmount: transfer.tokenAmount,
        mint: transfer.mint,
        timestamp: transaction.timestamp,  // 保持原始的秒级时间戳
        is_simple_transfer: isSimpleTransfer(transaction) ? 1 : 0
    }));
}

/**
 * 解析交易数据
 * @param {Array} transactions 交易数据数组
 * @param {string} tokenAccount 代币账户
 * @returns {Array} 解析后的交易数据数组
 */
async function parseTransactions(transactions, tokenAccount) {
    const parsedTransactions = [];
    for (const transaction of transactions) {
        const parsedTx = parseTransactionData(transaction, tokenAccount);
        if (parsedTx) {
            if (Array.isArray(parsedTx)) {
                parsedTransactions.push(...parsedTx);
            } else {
                parsedTransactions.push(parsedTx);
            }
        }
    }
    return parsedTransactions;
}

/**
 * 解析并保存账户交易数据
 * @param {Object} db 数据库连接
 * @param {string} tokenAccount 代币账户
 * @param {string|null} fromSignature 从这个签名开始获取历史交易
 * @param {number} batchSize 批处理大小
 * @returns {Promise<Array>} 解析后的交易数据
 */
export async function parseAndSaveAccountTransactions(db, tokenAccount, fromSignature = null, batchSize = CONFIG.HELIUS.BATCH_SIZE) {
    // 获取代币配置
    const tokenConfig = Object.values(CONFIG.TOKENS).find(config => config.ACCOUNT === tokenAccount);
    if (!tokenConfig) {
        throw new Error(formatLog('parser.error', 'account_not_found', { account: tokenAccount }));
    }

    let currentSignature = null;  // 初始化 currentSignature

    // 如果没有指定起始签名，获取数据库中最新的签名
    if (!fromSignature) {
        fromSignature = await getLatestSignature(db, tokenAccount, tokenConfig.MINT);
        if (fromSignature) {
            console.log(formatLog('parser', 'incremental_update', { signature: fromSignature }));
            // 如果已经有最新签名，检查远程是否有更新
            const latestTx = await fetchAccountTransactions(tokenAccount, null, 1);
            if (latestTx && latestTx.length > 0) {
                if (latestTx[0].signature === fromSignature) {
                    console.log(formatLog('parser', 'no_new_transactions'));
                    return [];
                }
                // 从最新的交易开始获取
                currentSignature = null;
            }
        }
    }

    console.log(formatLog('parser', 'start', { 
        account: tokenAccount,
        from: getMessage('tx.signature', 'latest'),
        batchSize
    }));

    let allParsedTransactions = [];
    let pageCount = 0;
    let hasMore = true;

    while (hasMore) {
        pageCount++;
        console.log(formatLog('parser', 'fetch_page', { 
            page: pageCount,
            current: getMessage('tx.signature', 'latest')
        }));

        // 获取交易数据
        const transactions = await fetchAccountTransactions(tokenAccount, currentSignature, batchSize);
        if (!transactions || transactions.length === 0) {
            console.log(formatLog('parser', 'no_more_data'));
            break;
        }

        // 如果遇到已知的签名，说明后面的数据都已经处理过了
        if (fromSignature) {
            const knownSignatureIndex = transactions.findIndex(tx => tx.signature === fromSignature);
            if (knownSignatureIndex !== -1) {
                console.log(formatLog('parser', 'found_existing', { signature: fromSignature }));
                // 只处理到已知签名之前的交易
                transactions.length = knownSignatureIndex;
                hasMore = false;
                if (transactions.length === 0) {
                    console.log(formatLog('parser', 'all_synced'));
                    break;
                }
                console.log(formatLog('parser', 'skipping_known', { count: transactions.length }));
            }
        }

        // 解析交易数据
        const parsedTransactions = await parseTransactions(transactions, tokenAccount);
        if (parsedTransactions.length > 0) {
            // 保存到数据库
            await saveTransactions(db, parsedTransactions);
            
            // 添加到总结果中
            allParsedTransactions.push(...parsedTransactions);
            
            // 更新下一页的起始签名
            currentSignature = transactions[transactions.length - 1].signature;
            
            console.log(formatLog('parser', 'page_saved', {
                page: pageCount,
                count: parsedTransactions.length,
                total: allParsedTransactions.length,
                time_range: `${formatDate(parsedTransactions[0].timestamp)} 到 ${formatDate(parsedTransactions[parsedTransactions.length - 1].timestamp)}`
            }));
            
            // 如果返回的数据少于请求的数量，说明没有更多数据了
            if (transactions.length < batchSize) {
                hasMore = false;
            }
            
            // 添加延迟，避免API限制
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.TIMING.BATCH_DELAY));
            }
        } else {
            hasMore = false;
        }
    }

    if (allParsedTransactions.length > 0) {
        console.log(formatLog('parser', 'all_pages_complete', {
            pages: pageCount,
            total: allParsedTransactions.length,
            time_range: `${formatDate(allParsedTransactions[0].timestamp)} 到 ${formatDate(allParsedTransactions[allParsedTransactions.length - 1].timestamp)}`
        }));
    }

    // 最终返回前，确保所有交易按时间正序排列
    allParsedTransactions.sort((a, b) => a.timestamp - b.timestamp);
    return allParsedTransactions;
}

/**
 * 解析并保存所有置的代币账户交易
 * @param {Object} db 数据库连接
 * @returns {Promise<Object>} 处理结果
 */
export async function parseAllTokenTransactions(db) {
    console.log(formatLog('parser', 'start_all'));
    
    const results = {};
    
    for (const [symbol, config] of Object.entries(CONFIG.TOKENS)) {
        console.log(formatLog('parser', 'process_account', { token: symbol }));
        
        try {
            const transactions = await parseAndSaveAccountTransactions(db, config.ACCOUNT);
            results[symbol] = {
                success: true,
                count: transactions.length
            };
        } catch (error) {
            console.error(formatLog('parser.error', 'process_failed', { 
                token: symbol,
                error: error.message 
            }));
            
            results[symbol] = {
                success: false,
                error: error.message
            };
        }
    }

    return results;
} 