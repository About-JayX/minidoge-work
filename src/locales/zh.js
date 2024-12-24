export const zhLocale = {
    main: {
        start: "🚀 开始检查最新交易记录 - {time}",
        init_db: "⚙️ 正在初始化数据库...",
        init_db_success: "✅ 数据库初始化完成",
        tokens_info: "🔍 检查代币: {tokens}",
        token_status: {
            title: "\n💎 SPL代币 {token}:",
            mint: "  📝 MINIT地址: {mint}",
            local_sig: "  📌 数据库记录签名: {signature}",
            remote_sig: "  🌐 链上最新签名: {signature}",
            status: "  📊 状态: {message}",
            db_count: "  📈 数据库记录数: {count} 条"
        },
        update_start: "\n🔄 开始更新 {token} 的交易数据...",
        update_complete: "✅ {token} 更新完成:",
        update_stats: {
            new_count: "  📥 新增记录数: {count}",
            total_count: "  📊 总记录数: {count}",
            time_range: "  🕒 记录时间: {start} 至 {end}"
        },
        update_failed: "❌ {token} 更新失败: {error}",
        error: "❌ 检查失败: {error}",
        token_error: "❌ {token} 处理失败: {error}",
        db_close_error: "❌ 关闭数据库失败: {error}",
        app_init: '⚡️ 正在初始化应用...',
        app_init_success: '✨ 应用初始化完成',
        app_started: '🎉 应用已启动并开始运行',
        app_stopping: '🛑 正在停止应用...',
        app_stopped: '⏹️ 应用已完全停止',
        app_start_sequence: '🚀 {message} [时间={time}]',
        waiting: '⏳ 等待下次更新，间隔: {interval}ms',
        donation_service_start: '🎯 正在启动捐赠记录处理服务',
        donation_service_stop: '🔚 捐赠记录处理服务已停止',
        donation_service_already_running: '⚠️ 捐赠记录处理服务正在运行中',
        donation_full_update_start: '📊 开始全量更新捐赠记录 [当前时间={time}]',
        donation_full_update_complete: '✅ 全量更新捐赠数据完成 [耗时={duration}秒, 开始时间={startTime}, 结束时间={endTime}]',
        donation_incremental_update_start: '📈 开始增量更新捐赠记录 [当前时间={time}]\n  ⏰ 上次全量更新时间: {lastFullUpdate}\n  ⏰ 下次全量更新时间: {nextFullUpdate}',
        donation_incremental_update_complete: '✅ 增量更新捐赠数据完成\n  ⏱️ 耗时: {duration}\n  🕒 时间范围: {timeRange.start} 到 {timeRange.end}\n  📥 新增记录: {newRecords} 条\n  📊 总记录数: {totalRecords} 条',
        donation_waiting: '⏳ 等待下次捐赠数据更新，间隔: {interval}ms',
        errors: {
            init_failed: '❌ 应用初始化失败: {error}',
            start_failed: '❌ 应用启动失败: {error}',
            donation_service_failed: '❌ 捐赠记录处理服务出错: {error}',
            donation_update_failed: '❌ 捐赠记录更新失败 [更新类型={type}] [耗时={duration}]: {error}',
            tracker_check_failed: '❌ 追踪器检查失败: {error}',
            uncaught_exception: '💥 未捕获的异常: {error}',
            unhandled_rejection: '💥 未处理的Promise拒绝: {error}'
        },
        tracker_loop_start: "🔄 进入追踪器主循环 [时间={time}]",
        tracker_countdown_start: "⏳ 开始新的检查周期 [下次检查={nextCheckTime}]"
    },
    tx: {
        fetch: '📡 正在获取账户交易记录 [账户={account}, 起始签名={before}, 获取数量={limit}]',
        request: '🌐 发送API请求中 [请求地址={url}, 请求数量={limit}]',
        response: '📥 收到API响应数据 [记录数={count}, 起始签名={first}, 结束签名={last}]',
        retry: '🔄 重试请求 [第 {attempt}/{maxAttempts} 次, 延迟={delay}ms]\n  ❌ 错误: {error}',
        signature: {
            none: '无',
            latest: '最新'
        },
        errors: {
            fetch_failed: '💥 获取交易失败 [账户={account}]\n  ❌ 错误: {error}\n  📜 堆栈: {stack}\n  ℹ️ 详情: {details}',
            api_response: '❌ API响应错误: {status}, {error}'
        }
    },
    db: {
        init: "🔧 初始化数据库",
        init_success: "✅ 数据库初始化完成",
        tables_exist: "📋 数据库表已存在",
        errors: {
            init_failed: "💥 数据库初始化失败",
            get_signature_failed: "❌ 获取最新签名失败 [账户: {account}, 代币: {mint}]\n  错误: {error}"
        }
    },
    parser: {
        start: '🔄 开始解析账户 {account} 的交易数据 [起始签名={from}, 每批处理数={batchSize}]',
        fetch_page: '📑 正在获取第 {page} 页数据 [当前处理签名={current}]',
        no_more_data: '🔚 已获取所有数据',
        all_synced: '✅ 数据已同步至最新',
        page_saved: '💾 第 {page} 页数据已保存 [本页={count} 条, 总计={total} 条]\n  ⏰ 时间范围: {time_range}',
        all_pages_complete: '🎉 所有数据处理完成 [总页数={pages}, 总记录={total}]\n  ⏰ 时间范围: {time_range}',
        saving: '💾 正在保存交易数据 [总数={total} 条]\n  ⏰ 时间范围: {time_range}',
        saved: '✅ 保存完成 [总数={total} 条]\n  ⏰ 时间范围: {time_range}',
        process_account: '🔄 正在处理 {token} 账户',
        start_all: '🚀 开始处理所有代币账户',
        incremental_update: '📈 执行增量更新 [本地最新签名={signature}]',
        found_existing: '📎 发现已存在的交易 [签名={signature}]',
        skipping_known: '⏩ 跳过已知交易 [数量={count} 条]',
        no_new_transactions: 'ℹ️ 没有新的交易需要更新',
        errors: {
            account_not_found: '❌ 找不到账户 {account} 对应的代币配置',
            process_failed: '❌ 处理失败: {error}'
        }
    },
    system: {
        update_progress: {
            full: '全量更新进行中... [已耗时: {elapsed} 秒]',
            incremental: '增量更新进行中... [已耗时: {elapsed} 秒]'
        },
        monitor_start: "👀 开始监控 [间隔: {interval}ms]",
        monitor_stop: "⏹️ 监控已停止",
        monitor_error: "⚠️ 监控出错: {error}",
        already_running: "⚠️ 监控已在运行中",
        fatal_error: "💥 致命错误: {error}",
        countdown: "⏳ 倒计时: {remaining} 秒后开始下一轮检查",
        retry: "🔄 重试 {token} [第 {attempt}/{maxAttempts} 次, 延迟: {delay}ms]\n  ❌ 错误: {error}",
        cron_disabled: "⚠️ 定时任务已禁用",
        errors: {
            unknown: "❓ 未知错误",
            api_response: "🌐 API响应错误",
            transaction_timeout: "⏰ 交易超时"
        },
        units: {
            second: "秒",
            millisecond: "毫秒",
            minute: "分钟",
            hour: "小时",
            day: "天"
        }
    },
    donation: {
        process_start: '🎯 开始处理捐赠数据...',
        process_complete: '✨ 捐赠数据处理完成，共处理 {count} 条记录',
        countdown: '⏳ 距离下一次全量更新还有 {remaining} 秒',
        process_incremental_start: '📈 开始增量处理捐赠数据...',
        process_all_start: '📊 开始全量处理捐赠数据 [时间={time}]',
        process_no_new_data: '📭 没有新的捐赠数据需要处理 [类型={type}, 时间={time}]',
        fetch_transactions_start: '📡 开始获取交易记录 [类型={type}, 时间={time}]',
        fetch_transactions_complete: '✅ 交易记录获取完成 [类型={type}, 数量={count}, 时间={time}]',
        fetch_existing_donations_start: '🔍 开始获取现有捐赠记录 [时间={time}]',
        fetch_existing_donations_complete: '✅ 现有捐赠记录获取完成 [数量={count}, 时间={time}]',
        process_transactions_start: '⚙️ 开始处理交易记录 [数量={count}, 时间={time}]',
        process_progress: '📊 处理进度: {processed}/{total} ({progress}) [时间={time}]',
        sort_donations_start: '📋 开始排序捐赠记录 [数量={count}, 时间={time}]',
        sort_donations_complete: '✅ 捐赠记录排序完成 [数量={count}, 时间={time}]',
        save_donations_start: '💾 开始保存捐赠记录 [数量={count}, 时间={time}]',
        saved: '💾 捐赠记录保存完成 [数量={count}]',
        progress: {
            full: '⏳ 全量更新进行中... [已耗时: {elapsed} 秒]',
            incremental: '⏳ 增量更新进行中... [已耗时: {elapsed} 秒]'
        },
        errors: {
            process_failed: '❌ 处理捐赠数据失败 [类型={type}, 时间={time}]\n  错误: {error}\n  堆栈: {stack}',
            get_failed: '❌ 获取捐赠记录失败: {error}'
        },
        process_incremental_complete: '✅ 增量处理完成 [新增交易={newTransactions}, 总捐赠数={totalDonations}, 耗时={duration}, 时间范围={timeRange.start} 到 {timeRange.end}]'
    },
    tracker: {
        countdown: '⏳ 距离下一轮检查还有 {remaining} 秒',
        init: '🔧 初始化追踪器',
        init_success: '✅ 追踪器初始化完成',
        start: '🚀 追踪器启动',
        stop: '⏹️ 追踪器停止',
        check_start: '🔍 开始检查更新',
        check_complete: '✅ 检查完成',
        check_error: '❌ 检查失败: {error}',
        next_check: '⏳ 下次检查时间: {time}',
        status: {
            running: '🟢 追踪器运行中',
            stopped: '🔴 追踪器已停止',
            error: '🟡 追踪器发生错误: {error}'
        },
        errors: {
            init_failed: '❌ 追踪器初始化失败: {error}',
            check_failed: '❌ 检查更新失败: {error}',
            start_failed: '❌ 追踪器启动失败: {error}',
            get_signature_failed: '❌ 获取签名失败: {error}'
        },
        incremental_update: '📈 准备开始捐赠记录增量更新检查 [时间={time}]',
        remaining_time: '⏳ 距离下一次全量更新还有 {remaining} 秒',
        status_message: {
            up_to_date: '已是最新',
            need_update: '需要更新'
        },
        signature: {
            none: '无'
        },
        loop: {
            start: '进入追踪器主循环',
            new_cycle: '开始新的检查周期'
        }
    },
    'main.error': {
        donation_update_failed: '捐赠数据{type}更新失败：{error}',
        donation_service_failed: '捐赠数据处理服务失败：{error}',
        start_failed: '启动失败：{error}',
        init_failed: '初始化失败：{error}',
        uncaught_exception: '未捕获的异常：{error}',
        unhandled_rejection: '未处理的Promise拒绝：{error}'
    },
    params: {
        time: '时间',
        interval: '间隔',
        remaining: '剩余时间',
        token: '代币',
        attempt: '尝试次数',
        maxAttempts: '最大尝试次数',
        delay: '延迟',
        error: '错误',
        account: '账户',
        before: '起始签名',
        limit: '数量',
        url: 'URL',
        count: '数量',
        first: '首个',
        last: '最后',
        signature: '签名',
        mint: '代币地址',
        page: '页码',
        current: '当前签名',
        total: '总数',
        time_range: '时间范围',
        start: '开始时间',
        end: '结束时间'
    }
};