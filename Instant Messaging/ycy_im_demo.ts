import TencentCloudChat from '@tencentcloud/chat';
import NodeWebSocket from 'ws';
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger, logger } from './logger';

const log = createLogger('im');

if (typeof (globalThis as any).WebSocket === 'undefined') {
    (globalThis as any).WebSocket = NodeWebSocket as unknown as typeof WebSocket;
}

const API_BASE = 'https://suo.jiushu1234.com/api.php';
const STATE_FILE = path.resolve(__dirname, '..', 'state.json');//uid & token 保存位置

type AppState = {
    uid: string | null;
    token: string | null;
    signature: string | null;
};

export class ChatClient {
    private chat: any = null;
    private state: AppState = { uid: null, token: null, signature: null };
    private initialized = false;
    private isReady = false;
    private initPromise: Promise<void> | null = null;
    private sendQueue: Promise<void> = Promise.resolve();
    private destroyed = false;

    constructor() {
        process.on('unhandledRejection', (reason: any) => {
            const msg = String(reason?.message || reason || '');
            const code = (reason && (reason.code ?? reason?.data?.code)) ?? undefined;
            if (code === 2801 || /请求超时/.test(msg)) return;
            log.error('unhandledRejection:', reason);
        });
        process.on('uncaughtException', (err: any) => {
            const msg = String(err?.message || err || '');
            const code = (err && (err.code ?? err?.data?.code)) ?? undefined;
            if (code === 2801 || /请求超时/.test(msg)) return;
            log.error('uncaughtException:', err);
        });
    }

    // ---------- 外部方法 ----------
    async send(payload: any) {
        this.sendQueue = this.sendQueue.then(() => this._doSend(payload)).catch(e => {
            log.error('send queue error:', e);
        });
        return this.sendQueue;
    }

    async destroy() {
        if (this.chat) {
            try {
                log.info('销毁 Chat 实例...');
                await this.chat.logout();
                await this.chat.destroy();
            } catch (e) {
                log.warn('销毁 Chat 实例出错:', (e as Error).message);
            } finally {
                this.chat = null;
                this.initialized = false;
                this.isReady = false;
                this.initPromise = null;
                this.destroyed = true;
            }
        }
    }

    // ---------- 内部逻辑 ----------
    private async _doSend(payload: any) {
        await this.ensureReady();
        if (!this.chat) {
            log.warn('IM 未初始化，丢弃消息');
            return;
        }

        const msg = this.chat.createTextMessage({
            to: this.state.uid,
            conversationType: TencentCloudChat.TYPES.CONV_C2C,
            payload: {
                text: JSON.stringify({
                    ...payload,
                    token: this.state.token,
                }),
            },
        });

        try {
            logger.debug(msg);
            await this.chat.sendMessage(msg);
            log.success('IM 消息发送成功');
        } catch (e: any) {
            log.error('IM send error:', e?.message || e);
            await this.destroy(); // 出错后主动销毁
        }
    }

    private async ensureReady() {
        if (this.destroyed) this.destroyed = false;
        if (this.isReady && this.initialized) return;
        if (!this.initPromise) {
            this.initPromise = this.initIM();
        }
        await this.initPromise;
    }

    private async initIM() {
        log.info('正在读取 state 与登录 IM...');
        await this.loadState();
        const { appId, userSig } = await this.requestGameSign("game_"+this.state.uid!, this.state.token!);
        this.state.signature = userSig;
        logger.debug(userSig)

        if (this.chat) await this.destroy();

        this.chat = TencentCloudChat.create({ SDKAppID: appId });
        // @ts-ignore
        this.chat.setLogLevel(TencentCloudChat.LOG_LEVEL?.NONE ?? 4);

        this.chat.on(TencentCloudChat.EVENT.SDK_READY, () => {
            this.isReady = true;
            this.initialized = true;
            log.success('Chat SDK ready');
            logger.log("当前登录用户:", this.chat.getLoginUser());
        });

        this.chat.on(TencentCloudChat.EVENT.KICKED_OUT, async () => {
            log.warn('IM 被踢下线，销毁旧实例后重连...');
            await this.destroy();
            const delay = 500 + Math.random() * 1000;
            setTimeout(() => this.ensureReady().catch(e => log.error('重连失败:', e)), delay);
        });

        this.chat.on(TencentCloudChat.EVENT.ERROR, (e: any) => {
            log.warn('Chat SDK error:', e?.message || e);
        });

        this.chat.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, (event: any) => {
            for (const msg of event.data) {
                try {
                    const content = JSON.parse(msg.payload.text);
                    console.log('📩 收到消息:', content);
                } catch {
                    console.log('📩 收到原始消息:', msg.payload.text);
                }
            }
        });

        log.info('调用 Chat.login...');
        const res = await this.chat.login({
            userID: "game_"+ this.state.uid,
            userSig: this.state.signature,
        });
        if (res?.data?.repeatLogin) log.warn('重复登录：', res.data.errorInfo);

        await this.waitReady();
    }

    private async waitReady(timeout = 15000) {
        if (this.isReady) return;
        await new Promise<void>((resolve, reject) => {
            const onReady = () => {
                this.isReady = true;
                cleanup();
                resolve();
            };
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error('等待 SDK_READY 超时'));
            }, timeout);
            const cleanup = () => {
                clearTimeout(timer);
                this.chat?.off(TencentCloudChat.EVENT.SDK_READY, onReady);
            };
            this.chat?.on(TencentCloudChat.EVENT.SDK_READY, onReady);
        });
    }

    private async loadState(): Promise<AppState> {
        const buf = await fs.readFile(STATE_FILE, 'utf-8');
        const obj = JSON.parse(buf);
        if (!obj?.uid || !obj?.token)
            throw new Error(`state.json 缺少 uid/token`);
        this.state.uid = obj.uid;
        this.state.token = obj.token;
        return this.state;
    }

    private async requestGameSign(uid: string, token: string) {
        const resp = await fetch(`${API_BASE}/user/game_sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, token }),
        });
        if (!resp.ok) throw new Error(`game_sign http ${resp.status}`);
        const payload = await resp.json();
        if (payload.code !== 1 || !payload.data)
            throw new Error(`game_sign 返回异常: ${JSON.stringify(payload)}`);
        return { appId: payload.data.appid, userSig: payload.data.sign };
    }
}

const im = new ChatClient();
setInterval(() => {
    im.send({ code: 'game_cmd', id: "test" });
}, 5*1000);
