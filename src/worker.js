/**
 * 主程序入口文件
 * 负责初始化和管理整个应用的生命周期
 */

import { CONFIG, formatLog, getMessage } from './config.js';
import { Tracker } from './donate/tracker.js';
import { createLocalDB, getDonations } from './donate/database.js';
import { processDonations } from './donate/donation.js';

// CORS 配置
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

// 处理 OPTIONS 请求
function handleOptions(request) {
    if (request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null) {
        return new Response(null, {
            headers: corsHeaders
        });
    }
    return new Response(null, {
        headers: {
            Allow: 'GET, POST, OPTIONS',
        }
    });
}

/**
 * 捐赠数据处理服务类
 */
class DonationService {
    constructor(db) {
        this.db = db;
        this.isRunning = false;
        this.countdownTimer = null;
        this.progressTimer = null;
        this.lastFullUpdateTime = 0;
    }

    /**
     * 显示更新进度
     * @param {string} type - 更新类型（'full' 或 'incremental'）
     */
    startProgressDisplay(type) {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
        }

        const startTime = new Date();
        this.progressTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const message = type === 'full' 
                ? messages.donation.progress.full.replace('{elapsed}', elapsed)
                : messages.donation.progress.incremental.replace('{elapsed}', elapsed);
            console.log(formatLog('donation', 'progress', { message }));
        }, 10000); // 每10秒显示一次
    }

    /**
     * 停止进度显示
     */
    stopProgressDisplay() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
        }
    }

    /**
     * 显示全量更新倒计时
     * @param {number} endTime - 结束时间戳
     */
    startCountdown(endTime) {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }

        const showRemaining = () => {
            const now = Date.now();
            const remaining = Math.ceil((endTime - now) / 1000);
            
            // 只在剩余时间是 10 的倍数时显示，或者剩余时间小于 10 秒时每秒显示
            if (remaining > 0 && (remaining <= 10 || remaining % 10 === 0)) {
                console.log(formatLog('donation', 'countdown', { 
                    remaining: remaining
                }));
            }

            if (remaining <= 0 && this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }
        };

        this.countdownTimer = setInterval(showRemaining, 1000);
        showRemaining(); // 立即显示第一次
    }

    /**
     * 获取离下一次全量更新的剩余时间（秒）
     */
    getTimeToNextFullUpdate() {
        const nextUpdateTime = this.lastFullUpdateTime + CONFIG.DONATION.FULL_UPDATE.MIN_INTERVAL;
        return Math.ceil((nextUpdateTime - Date.now()) / 1000);
    }

    /**
     * 执行捐赠数据更新
     * @param {boolean} isIncremental - 是否为增量更新
     */
    async processDonationData(isIncremental = false) {
        const startTime = new Date();
        try {
            if (isIncremental) {
                // 开始增量更新
                console.log(formatLog('main', 'donation_incremental_update_start', {
                    time: startTime.toISOString(),
                    lastFullUpdate: new Date(this.lastFullUpdateTime).toISOString(),
                    nextFullUpdate: new Date(this.lastFullUpdateTime + CONFIG.DONATION.FULL_UPDATE.MIN_INTERVAL).toISOString()
                }));

                // 显示进度
                this.startProgressDisplay('incremental');

                // 执行更新
                const result = await processDonations(this.db, true);

                // 停止进度显示
                this.stopProgressDisplay();

                // 完成更新
                const endTime = new Date();
                const duration = (endTime - startTime) / 1000;

                // 打印详细结果
                console.log(formatLog('main', 'donation_incremental_update_complete', {
                    duration: `${duration.toFixed(1)}${getMessage('system.units', 'second')}`,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    newRecords: result?.newRecords || 0,
                    totalRecords: result?.totalRecords || 0,
                    timeRange: {
                        start: result?.timeRange?.start || '',
                        end: result?.timeRange?.end || ''
                    }
                }));
            } else {
                console.log(formatLog('main', 'donation_full_update_start', {
                    time: startTime.toISOString()
                }));
                this.startProgressDisplay('full');
                await processDonations(this.db, false);
                this.lastFullUpdateTime = Date.now();
                this.stopProgressDisplay();
                const endTime = new Date();
                const duration = (endTime - startTime) / 1000;
                console.log(formatLog('main', 'donation_full_update_complete', {
                    duration: `${duration.toFixed(1)}${getMessage('system.units', 'second')}`,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString()
                }));
            }
        } catch (error) {
            this.stopProgressDisplay();
            console.error(formatLog('main.error', 'donation_update_failed', { 
                error: error.message,
                type: isIncremental ? 'incremental' : 'full',
                duration: `${((Date.now() - startTime) / 1000).toFixed(1)}${getMessage('system.units', 'second')}`,
                startTime: startTime.toISOString()
            }));
            throw error;
        }
    }

    /**
     * 启动全量更新服务
     */
    async start() {
        if (this.isRunning) {
            console.log(formatLog('main', 'donation_service_already_running'));
            return;
        }

        this.isRunning = true;
        console.log(formatLog('main', 'donation_service_start'));

        while (this.isRunning) {
            try {
                await this.processDonationData(false);
                const nextUpdateTime = Date.now() + CONFIG.DONATION.FULL_UPDATE.MIN_INTERVAL;
                this.startCountdown(nextUpdateTime);
                await new Promise(resolve => setTimeout(resolve, CONFIG.DONATION.FULL_UPDATE.MIN_INTERVAL));
            } catch (error) {
                console.error(formatLog('main.error', 'donation_service_error', { error: error.message }));
                const retryTime = Date.now() + CONFIG.DONATION.RETRY_INTERVAL;
                this.startCountdown(retryTime);
                await new Promise(resolve => setTimeout(resolve, CONFIG.DONATION.RETRY_INTERVAL));
            }
        }
    }

    /**
     * 停止服务
     */
    stop() {
        console.log(formatLog('main', 'donation_service_stop'));
        this.isRunning = false;
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        this.stopProgressDisplay();
    }
}

/**
 * 应用程序类
 */
class App {
    constructor(env) {
        this.db = env.DATABASE;  // 使用 DATABASE 绑定
        this.tracker = null;
        this.donationService = null;
    }

    async init() {
        console.log(formatLog('main', 'app_init'));
        try {
            // 初始化数据库
            this.db = await createLocalDB(this.db);

            // 创建服务实例
            this.tracker = new Tracker();
            this.donationService = new DonationService(this.db);

            // 初始化追踪器
            await this.tracker.init(this);

            console.log(formatLog('main', 'app_init_success'));
            return true;
        } catch (error) {
            console.error(formatLog('main.error', 'init_failed', { error: error.message }));
            return false;
        }
    }

    /**
     * 处理 HTTP 请求
     */
    async handleRequest(request) {
        // 处理预检请求
        if (request.method === 'OPTIONS') {
            return handleOptions(request);
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;

            // 路由处理
            switch (path) {
                case '/health':
                    const healthStatus = {
                        status: 'ok',
                        database: {
                            connected: !!this.db,
                            initialized: true
                        },
                        services: {
                            tracker: !!this.tracker,
                            donationService: !!this.donationService
                        },
                        timestamp: new Date().toISOString()
                    };

                    try {
                        // 测试数据库连接
                        await this.db.prepare('SELECT 1').first();
                    } catch (error) {
                        healthStatus.status = 'error';
                        healthStatus.database.initialized = false;
                        healthStatus.error = error.message;
                    }

                    return new Response(JSON.stringify(healthStatus), {
                        headers: {
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    });
                case '/members':
                    // 获取分页参数
                    const page = parseInt(url.searchParams.get('page')) || 1;
                    const pageSize = parseInt(url.searchParams.get('pageSize')) || 10;

                    try {
                        // 获取捐赠记录
                        const result = await getDonations(this.db, page, pageSize);
                        
                        return new Response(JSON.stringify({
                            success: true,
                            data: result
                        }), {
                            headers: {
                                'Content-Type': 'application/json',
                                ...corsHeaders
                            }
                        });
                    } catch (error) {
                        return new Response(JSON.stringify({
                            success: false,
                            message: error.message,
                            error: {
                                name: error.name || 'QueryError',
                                message: error.message
                            }
                        }), {
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                ...corsHeaders
                            }
                        });
                    }
                default:
                    return new Response('Not Found', { 
                        status: 404,
                        headers: corsHeaders
                    });
            }
        } catch (error) {
            return new Response(JSON.stringify({
                error: error.message
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }

    /**
     * 启动应用
     */
    async start() {
        try {
            console.log(formatLog('main', 'app_start_sequence', {
                message: '开始启动应用程序序列',
                time: new Date().toISOString()
            }));

            // 启动捐赠数据处理服务
            this.donationService.start().catch(error => {
                console.error(formatLog('main.error', 'donation_service_failed', { error: error.message }));
            });

            console.log(formatLog('main', 'tracker_starting', {
                message: '准备启动追踪器',
                time: new Date().toISOString()
            }));

            // 启动追踪器
            await this.tracker.start();

            // 设置进程信号处理器
            this.setupSignalHandlers();

            console.log(formatLog('main', 'app_started'));
        } catch (error) {
            console.error(formatLog('main.error', 'start_failed', { error: error.message }));
            this.stop();
        }
    }

    /**
     * 设置进程信号处理器
     */
    setupSignalHandlers() {
        // 处理 Ctrl+C
        process.on('SIGINT', () => {
            console.log(formatLog('main', 'app_stopping'));
            this.stop();
        });

        // 处理终止信号
        process.on('SIGTERM', () => {
            console.log(formatLog('main', 'app_stopping'));
            this.stop();
        });

        // 处理未捕获的异常
        process.on('uncaughtException', (error) => {
            console.error(formatLog('main.error', 'uncaught_exception', { error: error.message }));
            this.stop();
        });

        // 处理未处理的Promise拒绝
        process.on('unhandledRejection', (reason) => {
            console.error(formatLog('main.error', 'unhandled_rejection', { error: reason.message }));
            this.stop();
        });
    }

    /**
     * 停止应用
     */
    stop() {
        console.log(formatLog('main', 'app_stopping'));
        
        if (this.tracker) {
            this.tracker.stop();
        }
        
        if (this.donationService) {
            this.donationService.stop();
        }

        setTimeout(() => {
            console.log(formatLog('main', 'app_stopped'));
            process.exit(0);
        }, 1000);
    }
}

// 处理定时任务
async function handleScheduled(event, env) {
    if (!CONFIG.FEATURES.ENABLE_CRON) {
        console.log(formatLog('system', 'cron_disabled'));
        return;
    }

    const app = new App(env);
    await app.init();
    await app.donationService.start();
}

// 处理 HTTP 请求
async function handleRequest(request, env) {
    if (request.method === 'OPTIONS') {
        return handleOptions(request);
    }

    const app = new App(env);
    await app.init();
    await app.start(); // 确保服务启动

    // 直接使用 App 类的请求处理方法
    return app.handleRequest(request);
}

// 导出 Worker 处理函数
export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    },

    async scheduled(event, env, ctx) {
        ctx.waitUntil(handleScheduled(event, env));
    }
};