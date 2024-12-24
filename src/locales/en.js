export const enLocale = {
    main: {
        start: "🚀 Start checking latest transactions - {time}",
        init_db: "⚙️ Initializing database...",
        init_db_success: "✅ Database initialized",
        tokens_info: "🔍 Checking tokens: {tokens}",
        token_status: {
            title: "\n💎 SPL Token {token}:",
            mint: "  📝 MINT address: {mint}",
            local_sig: "  📌 Database signature: {signature}",
            remote_sig: "  🌐 Chain signature: {signature}",
            status: "  📊 Status: {message}",
            db_count: "  📈 Database records: {count}"
        },
        update_start: "\n🔄 Starting update for {token} transactions...",
        update_complete: "✅ {token} update completed:",
        update_stats: {
            new_count: "  📥 New records: {count}",
            total_count: "  📊 Total records: {count}",
            time_range: "  🕒 Time range: {start} to {end}"
        },
        update_failed: "❌ {token} update failed: {error}",
        check_failed: "❌ Check failed: {error}",
        token_error: "❌ {token} processing failed: {error}",
        db_close_error: "❌ Failed to close database: {error}",
        app_init: '⚡️ Initializing application...',
        app_init_success: '✨ Application initialized',
        app_started: '🎉 Application started and running',
        app_stopping: '🛑 Stopping application...',
        app_stopped: '⏹️ Application fully stopped',
        app_start_sequence: '🚀 {message} [time={time}]',
        waiting: '⏳ Waiting for next update, interval: {interval}ms',
        donation_service_start: '🎯 Starting donation processing service',
        donation_service_stop: '🔚 Donation processing service stopped',
        donation_service_already_running: '⚠️ Donation processing service is already running',
        donation_full_update_start: '📊 Starting full donation update [time={time}]',
        donation_full_update_complete: '✅ Full donation update completed [duration: {duration}s, start: {startTime}, end: {endTime}]',
        donation_incremental_update_start: '📈 Starting incremental donation update [time={time}]\n  ⏰ Last full update: {lastFullUpdate}\n  ⏰ Next full update: {nextFullUpdate}',
        donation_incremental_update_complete: '✅ Incremental donation update completed\n  ⏱️ Duration: {duration}\n  🕒 Time range: {timeRange.start} to {timeRange.end}\n  📥 New records: {newRecords}\n  📊 Total records: {totalRecords}',
        donation_waiting: '⏳ Waiting for next donation update, interval: {interval}ms',
        errors: {
            init_failed: '❌ Application initialization failed: {error}',
            start_failed: '❌ Application start failed: {error}',
            donation_service_failed: '❌ Donation processing service error: {error}',
            donation_update_failed: '❌ Donation update failed [type={type}] [duration={duration}]: {error}',
            tracker_check_failed: '❌ Tracker check failed: {error}',
            uncaught_exception: '💥 Uncaught exception: {error}',
            unhandled_rejection: '💥 Unhandled Promise rejection: {error}'
        },
        tracker_loop_start: "🔄 Entering tracker main loop [time={time}]",
        tracker_countdown_start: "⏳ Starting new check cycle [next check={nextCheckTime}]"
    },
    tx: {
        fetch: '📡 Fetching account transactions [account={account}, before={before}, limit={limit}]',
        request: '🌐 Sending API request [url={url}, limit={limit}]',
        response: '📥 Received API response [count={count}, first={first}, last={last}]',
        retry: '🔄 Retrying request [attempt {attempt}/{maxAttempts}, delay={delay}ms]\n  ❌ Error: {error}',
        signature: {
            none: 'None',
            latest: 'Latest'
        },
        errors: {
            fetch_failed: '💥 Transaction fetch failed [account={account}]\n  ❌ Error: {error}\n  📜 Stack: {stack}\n  ℹ️ Details: {details}',
            api_response: '❌ API response error: {status}, {error}'
        }
    },
    db: {
        init: "🔧 Initializing database",
        init_success: "✅ Database initialization complete",
        tables_exist: "📋 Database tables exist",
        errors: {
            init_failed: "💥 Database initialization failed",
            get_signature_failed: "❌ Failed to get latest signature [account: {account}, token: {mint}]\n  Error: {error}"
        }
    },
    parser: {
        start: '🔄 Start parsing transactions for account {account} [from={from}, batch={batchSize}]',
        fetch_page: '📑 Fetching page {page} [current={current}]',
        no_more_data: '🔚 All data retrieved',
        all_synced: '✅ Data synced to latest',
        page_saved: '💾 Page {page} saved [page={count}, total={total}]\n  ⏰ Time range: {time_range}',
        all_pages_complete: '🎉 All data processing complete [pages={pages}, total={total}]\n  ⏰ Time range: {time_range}',
        saving: '💾 Saving transaction data [total={total}]\n  ⏰ Time range: {time_range}',
        saved: '��� Save complete [total={total}]\n  ⏰ Time range: {time_range}',
        process_account: '🔄 Processing {token} account',
        start_all: '🚀 Start processing all token accounts',
        incremental_update: '📈 Executing incremental update [local signature={signature}]',
        found_existing: '📎 Found existing transaction [signature={signature}]',
        skipping_known: '⏩ Skipping known transactions [count={count}]',
        no_new_transactions: 'ℹ️ No new transactions to update',
        errors: {
            account_not_found: '❌ Token configuration not found for account {account}',
            process_failed: '❌ Processing failed: {error}'
        }
    },
    system: {
        update_progress: {
            full: 'Full update in progress... [elapsed: {elapsed}s]',
            incremental: 'Incremental update in progress... [elapsed: {elapsed}s]'
        },
        monitor_start: "👀 Start monitoring [interval: {interval}ms]",
        monitor_stop: "⏹️ Monitoring stopped",
        monitor_error: "⚠️ Monitor error: {error}",
        already_running: "⚠️ Monitor is already running",
        fatal_error: "💥 Fatal error: {error}",
        countdown: "⏳ Countdown: {remaining} seconds until next check",
        retry: "🔄 Retrying {token} [attempt {attempt}/{maxAttempts}, delay: {delay}ms]\n  ❌ Error: {error}",
        cron_disabled: "⚠️ Cron task is disabled",
        errors: {
            unknown: "❓ Unknown error",
            api_response: "🌐 API response error",
            transaction_timeout: "⏰ Transaction timeout"
        },
        units: {
            second: "s",
            millisecond: "ms",
            minute: "min",
            hour: "h",
            day: "d"
        }
    },
    donation: {
        process_start: '🎯 Start processing donations...',
        process_complete: '✨ Donation processing complete, processed {count} records',
        countdown: '⏳ Next full update in {remaining} seconds',
        process_incremental_start: '📈 Start incremental donation processing...',
        process_all_start: '📊 Start full donation processing [time={time}]',
        process_no_new_data: '📭 No new donations to process [type={type}, time={time}]',
        fetch_transactions_start: '📡 Start fetching transactions [type={type}, time={time}]',
        fetch_transactions_complete: '✅ Transaction fetch complete [type={type}, count={count}, time={time}]',
        fetch_existing_donations_start: '🔍 Start fetching existing donations [time={time}]',
        fetch_existing_donations_complete: '✅ Existing donations fetch complete [count={count}, time={time}]',
        process_transactions_start: '⚙️ Start processing transactions [count={count}, time={time}]',
        process_progress: '📊 Processing progress: {processed}/{total} ({progress}) [time={time}]',
        sort_donations_start: '📋 Start sorting donations [count={count}, time={time}]',
        sort_donations_complete: '✅ Donation sorting complete [count={count}, time={time}]',
        save_donations_start: '💾 Start saving donations [count={count}, time={time}]',
        saved: '💾 Donations saved [count={count}]',
        progress: {
            full: '⏳ Full update in progress... [elapsed: {elapsed}s]',
            incremental: '⏳ Incremental update in progress... [elapsed: {elapsed}s]'
        },
        errors: {
            process_failed: '❌ Donation processing failed [type={type}, time={time}]\n  Error: {error}\n  Stack: {stack}',
            get_failed: '❌ Failed to get donations: {error}'
        },
        process_incremental_complete: '✅ Incremental processing complete [new transactions: {newTransactions}, total donations: {totalDonations}, duration: {duration}s, time range: {timeRange.start} to {timeRange.end}]'
    },
    tracker: {
        countdown: '⏳ Next check in {remaining} seconds',
        init: '🔧 Initializing tracker',
        init_success: '✅ Tracker initialization complete',
        start: '���� Tracker started',
        stop: '🔴 Tracker stopped',
        check_start: '🔍 Start checking updates',
        check_complete: '✅ Check complete',
        check_error: '❌ Check failed: {error}',
        next_check: '⏳ Next check time: {time}',
        status: {
            running: '🟢 Tracker running',
            stopped: '🔴 Tracker stopped',
            error: '🟡 Tracker error: {error}'
        },
        errors: {
            init_failed: '❌ Tracker initialization failed: {error}',
            check_failed: '❌ Update check failed: {error}',
            start_failed: '❌ Tracker start failed: {error}',
            get_signature_failed: '❌ Failed to get signature: {error}'
        },
        incremental_update: '📈 Preparing to start donation incremental update check [time={time}]',
        remaining_time: '⏳ Next full update in {remaining} seconds',
        status_message: {
            up_to_date: 'Up to date',
            need_update: 'Update needed'
        },
        signature: {
            none: 'None'
        },
        loop: {
            start: 'Entering tracker main loop',
            new_cycle: 'Starting new check cycle'
        }
    },
    'main.error': {
        donation_update_failed: 'Donation {type} update failed: {error}',
        donation_service_failed: 'Donation service failed: {error}',
        start_failed: 'Start failed: {error}',
        init_failed: 'Initialization failed: {error}',
        uncaught_exception: 'Uncaught exception: {error}',
        unhandled_rejection: 'Unhandled Promise rejection: {error}'
    },
    params: {
        time: 'time',
        interval: 'interval',
        remaining: 'remaining',
        token: 'token',
        attempt: 'attempt',
        maxAttempts: 'max attempts',
        delay: 'delay',
        error: 'error',
        account: 'account',
        before: 'before',
        limit: 'limit',
        url: 'URL',
        count: 'count',
        first: 'first',
        last: 'last',
        signature: 'signature',
        mint: 'mint address',
        page: 'page',
        current: 'current',
        total: 'total',
        time_range: 'time range',
        start: 'start',
        end: 'end'
    }
};
