import { CONFIG, formatLog, getMessage } from '../config.js';
import { getDonations, saveDonations, getAllTransactions, getNewTransactions } from './database.js';

/**
 * 处理捐赠数据
 * @param {Object} db 数据库连接
 * @param {boolean} isIncremental 是否增量处理，默认为true
 * @returns {Promise<void>}
 */
export async function processDonations(db, isIncremental = true) {
    const startTime = Date.now();
    console.log(formatLog('donation', `process_${isIncremental ? 'incremental' : 'all'}_start`, {
        time: new Date(startTime).toISOString()
    }));

    try {
        // 1. 获取需要处理的交易记录
        console.log(formatLog('donation', 'fetch_transactions_start', {
            type: isIncremental ? 'incremental' : 'all',
            time: new Date().toISOString()
        }));

        const transactions = isIncremental ? 
            await getNewTransactions(db) : 
            await getAllTransactions(db);

        console.log(formatLog('donation', 'fetch_transactions_complete', {
            type: isIncremental ? 'incremental' : 'all',
            count: transactions.length,
            time: new Date().toISOString()
        }));

        if (transactions.length === 0) {
            console.log(formatLog('donation', 'process_no_new_data', {
                type: isIncremental ? 'incremental' : 'all',
                time: new Date().toISOString()
            }));
            return {
                newRecords: 0,
                totalRecords: 0,
                timeRange: { start: null, end: null }
            };
        }

        // 2. 获取现有捐赠记录
        let donationStats = new Map();
        if (isIncremental) {
            console.log(formatLog('donation', 'fetch_existing_donations_start', {
                time: new Date().toISOString()
            }));

            const existingDonations = await getDonations(db, 1, Number.MAX_SAFE_INTEGER);
            
            console.log(formatLog('donation', 'fetch_existing_donations_complete', {
                count: existingDonations.donations.length,
                time: new Date().toISOString()
            }));

            if (existingDonations.donations.length > 0) {
                donationStats = new Map(existingDonations.donations.map(d => [d.from, d]));
            }
        }

        // 3. 处理交易记录
        console.log(formatLog('donation', 'process_transactions_start', {
            count: transactions.length,
            time: new Date().toISOString()
        }));

        let processedCount = 0;
        const logInterval = Math.max(1, Math.floor(transactions.length / 10)); // 每处理10%记录一次日志

        for (const tx of transactions) {
            // 获取代币符号
            const tokenSymbol = Object.entries(CONFIG.TOKENS).find(
                ([_, config]) => config.MINT === tx.mint
            )?.[0] || tx.mint;

            // 获取或创建捐赠者的统计数据
            const fromStats = donationStats.get(tx.from_account) || {
                from: tx.from_account,
                tokenAmounts: {},
                firstDonationTime: tx.timestamp,
                lastDonationTime: tx.timestamp,
                lastSignature: tx.signature,
                donationCount: 0
            };

            // 更新统计数据
            fromStats.tokenAmounts[tokenSymbol] = (fromStats.tokenAmounts[tokenSymbol] || 0) + tx.token_amount;
            fromStats.lastDonationTime = Math.max(fromStats.lastDonationTime, tx.timestamp);
            fromStats.firstDonationTime = Math.min(fromStats.firstDonationTime, tx.timestamp);
            fromStats.lastSignature = tx.signature;
            fromStats.donationCount++;

            // 更新 Map
            donationStats.set(tx.from_account, fromStats);

            // 记录处理进度
            processedCount++;
            if (processedCount % logInterval === 0) {
                const progress = (processedCount / transactions.length * 100).toFixed(1);
                console.log(formatLog('donation', 'process_progress', {
                    processed: processedCount,
                    total: transactions.length,
                    progress: `${progress}%`,
                    time: new Date().toISOString()
                }));
            }
        }

        // 4. 转换为数组并按首次捐赠时间排序
        console.log(formatLog('donation', 'sort_donations_start', {
            count: donationStats.size,
            time: new Date().toISOString()
        }));

        const donations = Array.from(donationStats.values())
            .sort((a, b) => a.firstDonationTime - b.firstDonationTime);

        console.log(formatLog('donation', 'sort_donations_complete', {
            count: donations.length,
            time: new Date().toISOString()
        }));

        // 5. 保存处理后的捐赠记录
        console.log(formatLog('donation', 'save_donations_start', {
            count: donations.length,
            time: new Date().toISOString()
        }));

        await saveDonations(db, donations);

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        // 获取时间范围
        const timeRange = transactions.length > 0 ? {
            start: new Date(transactions[0].timestamp).toISOString(),
            end: new Date(transactions[transactions.length - 1].timestamp).toISOString()
        } : { start: null, end: null };

        console.log(formatLog('donation', 'process_incremental_complete', {
            newTransactions: transactions.length,
            totalDonations: donations.length,
            duration: duration.toFixed(1),
            timeRange: {
                start: timeRange.start,
                end: timeRange.end
            }
        }));

        return {
            newRecords: transactions.length,
            totalRecords: donations.length,
            timeRange
        };

    } catch (error) {
        console.error(formatLog('donation.error', 'process_failed', { 
            error: error.message,
            stack: error.stack,
            type: isIncremental ? 'incremental' : 'all',
            time: new Date().toISOString()
        }));
        throw error;
    }
} 