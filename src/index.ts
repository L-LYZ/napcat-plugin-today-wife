const config = {
    enabled: true,
    keyword: '今日老婆',
    cooldown: 5000,
    memberCacheExpiry: 3600000
};

const cooldownMap = new Map();
const todayWifeMap = new Map();
const memberCache = new Map();

export async function plugin_init(ctx) {
    ctx.logger.info('[今日老婆] 插件初始化完成');
}

export async function plugin_onmessage(ctx, event) {
    if (event.message_type !== 'group') return;
    
    const rawMessage = event.raw_message || '';
    if (!rawMessage.includes(config.keyword)) return;
    
    const groupId = event.group_id;
    const userId = event.user_id;
    
    const key = `${groupId}:${userId}`;
    const now = Date.now();
    
    if (cooldownMap.has(key)) {
        const lastTime = cooldownMap.get(key);
        if (now - lastTime < config.cooldown) return;
    }
    
    cooldownMap.set(key, now);
    
    try {
        const existingWife = getTodayWife(key, now);
        if (existingWife) {
            await sendWifeMessage(ctx, groupId, userId, existingWife.wifeId, existingWife.wifeName, true);
            return;
        }
        
        const members = await getGroupMembers(ctx, groupId);
        
        if (!members || members.length === 0) {
            await sendMessage(ctx, groupId, userId, '获取群成员列表失败，请稍后重试');
            return;
        }
        
        const filtered = members.filter(m => m.user_id !== userId);
        
        if (filtered.length === 0) {
            await sendMessage(ctx, groupId, userId, '没有可抽取的群成员');
            return;
        }
        
        const idx = Math.floor(Math.random() * filtered.length);
        const selected = filtered[idx];
        const wifeName = selected.card || selected.nickname || '未知成员';
        
        setTodayWife(key, selected.user_id, wifeName, now);
        
        ctx.logger.info(`[今日老婆] 群${groupId} 用户${userId} 抽取到 ${selected.user_id}(${wifeName})`);
        
        await sendWifeMessage(ctx, groupId, userId, selected.user_id, wifeName, false);
        
    } catch (err) {
        ctx.logger.error('[今日老婆] 错误:', err);
        await sendMessage(ctx, groupId, userId, '处理请求时发生错误');
    }
}

function getTodayWife(key, now) {
    const record = todayWifeMap.get(key);
    if (!record) return null;
    
    const recordDate = new Date(record.timestamp);
    const nowDate = new Date(now);
    
    if (recordDate.getFullYear() === nowDate.getFullYear() &&
        recordDate.getMonth() === nowDate.getMonth() &&
        recordDate.getDate() === nowDate.getDate()) {
        return record;
    }
    
    return null;
}

function setTodayWife(key, wifeId, wifeName, timestamp) {
    todayWifeMap.set(key, {
        wifeId: wifeId,
        wifeName: wifeName,
        timestamp: timestamp
    });
}

async function getGroupMembers(ctx, groupId) {
    const now = Date.now();
    const cacheKey = String(groupId);
    
    const cached = memberCache.get(cacheKey);
    if (cached && (now - cached.timestamp < config.memberCacheExpiry)) {
        ctx.logger.info(`[今日老婆] 使用缓存的群成员列表，共${cached.members.length}人`);
        return cached.members;
    }
    
    try {
        let result;
        
        if (ctx.actions.get_group_member_list) {
            result = await ctx.actions.get_group_member_list({ group_id: cacheKey });
        } else if (ctx.apis && ctx.apis.getGroupMemberList) {
            result = await ctx.apis.getGroupMemberList(cacheKey);
        } else {
            result = await ctx.actions.call(
                'get_group_member_list',
                { group_id: cacheKey },
                ctx.adapterName,
                ctx.pluginManager.config
            );
        }
        
        let members = [];
        
        if (Array.isArray(result)) {
            members = result;
        } else if (result && result.data) {
            if (Array.isArray(result.data)) {
                members = result.data;
            } else if (typeof result.data === 'object') {
                members = Object.values(result.data);
            }
        }
        
        if (members.length > 0) {
            memberCache.set(cacheKey, {
                members: members,
                timestamp: now
            });
            ctx.logger.info(`[今日老婆] 已缓存群${groupId}成员列表，共${members.length}人`);
        }
        
        return members;
    } catch (err) {
        ctx.logger.error('[今日老婆] 获取群成员失败:', err.message);
        
        if (cached) {
            ctx.logger.warn('[今日老婆] 使用过期的缓存数据');
            return cached.members;
        }
        
        return [];
    }
}

export async function plugin_cleanup(ctx) {
    memberCache.clear();
    todayWifeMap.clear();
    cooldownMap.clear();
    ctx.logger.info('[今日老婆] 插件已卸载，缓存已清理');
}

export function plugin_config_ui(ctx) {
    return ctx.NapCatConfig.combine(
        ctx.NapCatConfig.boolean('enabled', '启用插件', true),
        ctx.NapCatConfig.text('keyword', '触发关键词', '今日老婆'),
        ctx.NapCatConfig.number('cooldown', '冷却时间(毫秒)', 5000)
    );
}

export function plugin_get_config() {
    return config;
}

export function plugin_set_config(ctx, newConfig) {
    if (newConfig) {
        Object.assign(config, newConfig);
    }
}

async function sendMessage(ctx, groupId, userId, text) {
    try {
        const message = [
            { type: 'at', data: { qq: String(userId) } },
            { type: 'text', data: { text: ' ' + text } }
        ];
        
        if (ctx.actions.send_group_msg) {
            await ctx.actions.send_group_msg({ group_id: String(groupId), message });
        } else if (ctx.apis && ctx.apis.sendGroupMsg) {
            await ctx.apis.sendGroupMsg(String(groupId), message);
        } else {
            await ctx.actions.call(
                'send_group_msg',
                { group_id: String(groupId), message },
                ctx.adapterName,
                ctx.pluginManager.config
            );
        }
    } catch (err) {
        ctx.logger.error('[今日老婆] 发送消息失败:', err);
    }
}

async function sendWifeMessage(ctx, groupId, userId, wifeId, wifeName, isRepeat) {
    try {
        const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${wifeId}&s=640`;
        
        let text = '';
        if (isRepeat) {
            text = ` 你今天已经抽过老婆了！你的老婆依然是 @${wifeName}`;
        } else {
            text = ` 今天你的老婆是 @${wifeName}`;
        }
        
        const message = [
            { type: 'at', data: { qq: String(userId) } },
            { type: 'text', data: { text: text } },
            { type: 'image', data: { file: avatarUrl } }
        ];
        
        if (ctx.actions.send_group_msg) {
            await ctx.actions.send_group_msg({ group_id: String(groupId), message });
        } else if (ctx.apis && ctx.apis.sendGroupMsg) {
            await ctx.apis.sendGroupMsg(String(groupId), message);
        } else {
            await ctx.actions.call(
                'send_group_msg',
                { group_id: String(groupId), message },
                ctx.adapterName,
                ctx.pluginManager.config
            );
        }
    } catch (err) {
        ctx.logger.error('[今日老婆] 发送老婆消息失败:', err);
    }
}
