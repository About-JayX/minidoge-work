import { CONFIG, formatLog, formatDate, getMessage } from '../config.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { parseAndSaveAccountTransactions } from './parser.js';
import { getLatestSignature, getTransactionCount } from './database.js';

export class Tracker {
    constructor() {
        this.db = null;
        this.connection = null;
        this.isRunning = false;
        this.countdownTimer = null;
        this.app = null;
    }

    /**
     * 初始化追踪器
     */
    async init(app) {
        this.app = app;
        // 使用应用传入的数据库实例
        this.db = app.db;
        
        // 初始化 RPC 连接
        this.connection = new Connection(CONFIG.RPC.ENDPOINT, {
            commitment: CONFIG.RPC.COMMITMENT || 'confirmed',
            timeout: CONFIG.RPC.TIMEOUT || 30000
        });
    }

    /**
     * 显示倒计时
     * @param {number} endTime - 结束时间戳
     */
    startCountdown(endTime) {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }

        const showRemaining = () => {
            const now = Date.now();
            const remaining = Math.ceil((endTime - now) / 1000);
            
            if (remaining > 0 && (remaining <= 10 || remaining % 10 === 0)) {
                console.log(formatLog('tracker', 'countdown', { 
                    remaining: remaining
                }));
            }

            if (remaining <= 0 && this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }
        };

        this.countdownTimer = setInterval(showRemaining, 1000);
        showRemaining();
    }

    /**
     * 清理倒计时
     */
    clearCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    /**
     * 检查账户的最新交易状态
     */
    async checkLatestTransactions(tokenName) {
        const tokenConfig = CONFIG.TOKENS[tokenName];
        
        // 从数据库获取最新签名
        const lastSignature = await getLatestSignature(this.db, tokenConfig.ACCOUNT, tokenConfig.MINT);
        
        // 获取远程最新签名，添加重试机制
        let attempts = 0;
        const maxAttempts = CONFIG.TIMING.RETRY.MAX_ATTEMPTS;
        let delay = CONFIG.TIMING.RETRY.INITIAL_DELAY;
        
        while (attempts < maxAttempts) {
            try {
                const latestSignatures = await this.connection.getSignaturesForAddress(
                    new PublicKey(tokenConfig.ACCOUNT),
                    { limit: 1 }
                );

                // 如果远程没有签名，说明账户没有交易
                if (latestSignatures.length === 0) {
                    return {
                        token: tokenName,
                        mint: tokenConfig.MINT,
                        needUpdate: false,
                        localSignature: lastSignature || formatLog('tracker.signature', 'none'),
                        remoteSignature: formatLog('tracker.signature', 'none'),
                        message: formatLog('tracker.status_message', 'up_to_date')
                    };
                }

                const remoteSignature = latestSignatures[0].signature;
                
                // 如果本地没有签名，或者远程签名与本地签名不同，说明需要更新
                const needUpdate = !lastSignature || lastSignature !== remoteSignature;

                return {
                    token: tokenName,
                    mint: tokenConfig.MINT,
                    needUpdate: needUpdate,
                    localSignature: lastSignature || formatLog('tracker.signature', 'none'),
                    remoteSignature: remoteSignature,
                    message: needUpdate ? formatLog('tracker.status_message', 'need_update') : formatLog('tracker.status_message', 'up_to_date')
                };
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts) {
                    throw new Error(formatLog('tracker.error', 'get_signature_failed', { error: error.message }));
                }
                
                console.log(formatLog('system', 'retry', {
                    token: tokenName,
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
     * 检查并更新所有代币
     */
    async checkAll() {
        const startTime = Date.now();
        console.log(formatLog('main', 'start', { time: new Date(startTime).toISOString() }));

        try {
            // 处理所有配置的代币
            const tokens = CONFIG.getTokensList();
            console.log(formatLog('main', 'tokens_info', { tokens: tokens.join(', ') }));

            // 检查每个代币的最新签名状态
            for (const tokenName of tokens) {
                try {
                    // 检查数据库中的记录
                    const count = await getTransactionCount(this.db, CONFIG.TOKENS[tokenName].MINT);
                    
                    const status = await this.checkLatestTransactions(tokenName);

                    console.log(formatLog('main', 'token_status.title', { token: tokenName }));
                    console.log(formatLog('main', 'token_status.mint', { mint: status.mint }));
                    console.log(formatLog('main', 'token_status.local_sig', { signature: status.localSignature }));
                    console.log(formatLog('main', 'token_status.remote_sig', { signature: status.remoteSignature }));
                    console.log(formatLog('main', 'token_status.status', { message: status.message }));
                    console.log(formatLog('main', 'token_status.db_count', { count }));

                    // 如果需要更新，则使用parser更新数据
                    if (status.needUpdate) {
                        console.log(formatLog('main', 'update_start', { token: tokenName }));
                        try {
                            // 如果本地没有签名，从最新的开始；否则本地签名开始
                            const parsedTransactions = await parseAndSaveAccountTransactions(
                                this.db, 
                                CONFIG.TOKENS[tokenName].ACCOUNT, 
                                null  // 让 parseAndSaveAccountTransactions 自己处理增量更新
                            );

                            // 更新后再次获取数据库记录数
                            const updatedCount = await getTransactionCount(this.db, CONFIG.TOKENS[tokenName].MINT);

                            console.log(formatLog('main', 'update_complete', { token: tokenName }));
                            console.log(formatLog('main', 'update_stats.new_count', { count: parsedTransactions.length }));
                            console.log(formatLog('main', 'update_stats.total_count', { count: updatedCount }));
                            
                            if (parsedTransactions.length > 0) {
                                const firstTx = parsedTransactions[0];
                                const lastTx = parsedTransactions[parsedTransactions.length - 1];
                                console.log(formatLog('main', 'update_stats.time_range', { 
                                    start: formatDate(firstTx.timestamp),
                                    end: formatDate(lastTx.timestamp)
                                }));
                            }
                            console.log();
                        } catch (error) {
                            console.error(formatLog('main', 'update_failed', { 
                                token: tokenName,
                                error: error.message 
                            }));
                        }
                    } else {
                        console.log(); // 添加空行，保持输出格式一致
                    }
                } catch (error) {
                    console.error(formatLog('main', 'token_error', {
                        token: tokenName,
                        error: error.message
                    }));
                }
            }
        } catch (error) {
            console.error(formatLog('main', 'error', { error: error.message }));
        }
    }

    /**
     * 启动监控
     */
    async start() {
        if (this.isRunning) {
            console.log(formatLog('system', 'already_running'));
            return;
        }

        this.isRunning = true;
        console.log(formatLog('tracker', 'start', {
            time: new Date().toISOString()
        }));

        // 先执行一次检查
        await this.checkAll();
        
        console.log(formatLog('main', 'tracker_loop_start', {
            message: formatLog('tracker.loop', 'start'),
            time: new Date().toISOString()
        }));

        while (this.isRunning) {
            try {
                // 开始倒计时到下一次检查
                const nextCheckTime = Date.now() + 60000; // 1分钟后
                console.log(formatLog('main', 'tracker_countdown_start', {
                    message: formatLog('tracker.loop', 'new_cycle'),
                    nextCheckTime: new Date(nextCheckTime).toISOString()
                }));
                
                this.startCountdown(nextCheckTime);

                // 等待到距离下一次检查前30秒
                await new Promise(resolve => setTimeout(resolve, 30000));

                // 增加日志，表明即将开始增量更新
                console.log(formatLog('tracker', 'incremental_update', {
                    time: new Date().toISOString()
                }));

                // 执行增量更新
                await this.app.donationService.processDonationData(true);

                // 等待到距离下一次检查前15秒
                await new Promise(resolve => setTimeout(resolve, 15000));

                // 显示全量更新剩余时间
                const remainingTime = this.app.donationService.getTimeToNextFullUpdate();
                console.log(formatLog('tracker', 'remaining_time', {
                    remaining: remainingTime
                }));

                // 执行tracker检查
                await this.checkAll();

                // 清理倒计时
                this.clearCountdown();
            } catch (error) {
                console.error(formatLog('main.error', 'tracker_check_failed', { error: error.message }));
                this.clearCountdown();
                await new Promise(resolve => setTimeout(resolve, CONFIG.DONATION.RETRY_INTERVAL));
            }
        }
    }

    /**
     * 停止监控
     */
    stop() {
        this.isRunning = false;
        this.clearCountdown();
        console.log(formatLog('system', 'monitor_stop'));
    }
}
