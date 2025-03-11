import { _decorator, AssetManager, AudioClip, ImageAsset, Prefab, SpriteFrame, resources, assetManager } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 资源管理器
 * 用于统一管理游戏中的资源加载、缓存和释放
 */
@ccclass('ResourceManager')
export class ResourceManager {
    private static _instance: ResourceManager = null;

    // 资源缓存
    private _prefabCache: Map<string, Prefab> = new Map();
    private _spriteFrameCache: Map<string, SpriteFrame> = new Map();
    private _audioCache: Map<string, AudioClip> = new Map();

    /**
     * 获取单例
     */
    public static getInstance(): ResourceManager {
        if (!this._instance) {
            this._instance = new ResourceManager();
        }
        return this._instance;
    }

    /**
     * 加载预制体
     * @param path 预制体路径，相对于 resources 文件夹
     * @param callback 加载完成回调
     */
    public loadPrefab(path: string, callback?: (prefab: Prefab) => void): void {
        // 检查缓存
        if (this._prefabCache.has(path)) {
            callback && callback(this._prefabCache.get(path));
            return;
        }

        // 加载资源
        resources.load(path, Prefab, (err, prefab) => {
            if (err) {
                console.error(`加载预制体失败: ${path}`, err);
                callback && callback(null);
                return;
            }

            // 缓存并返回
            this._prefabCache.set(path, prefab);
            callback && callback(prefab);
        });
    }

    /**
     * 加载精灵帧
     * @param path 图片路径，相对于 resources 文件夹
     * @param callback 加载完成回调
     */
    public loadSpriteFrame(path: string, callback?: (spriteFrame: SpriteFrame) => void): void {
        // 检查缓存
        if (this._spriteFrameCache.has(path)) {
            callback && callback(this._spriteFrameCache.get(path));
            return;
        }

        // 加载资源
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(`加载精灵帧失败: ${path}`, err);
                callback && callback(null);
                return;
            }

            // 缓存并返回
            this._spriteFrameCache.set(path, spriteFrame);
            callback && callback(spriteFrame);
        });
    }

    /**
     * 加载音频
     * @param path 音频路径，相对于 resources 文件夹
     * @param callback 加载完成回调
     */
    public loadAudio(path: string, callback?: (audio: AudioClip) => void): void {
        // 检查缓存
        if (this._audioCache.has(path)) {
            callback && callback(this._audioCache.get(path));
            return;
        }

        // 加载资源
        resources.load(path, AudioClip, (err, audio) => {
            if (err) {
                console.error(`加载音频失败: ${path}`, err);
                callback && callback(null);
                return;
            }

            // 缓存并返回
            this._audioCache.set(path, audio);
            callback && callback(audio);
        });
    }

    /**
     * Promise 风格的预制体加载
     * @param path 预制体路径
     * @returns Promise<Prefab>
     */
    public loadPrefabAsync(path: string): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            this.loadPrefab(path, (prefab) => {
                if (prefab) {
                    resolve(prefab);
                } else {
                    reject(new Error(`加载预制体失败: ${path}`));
                }
            });
        });
    }

    /**
     * Promise 风格的精灵帧加载
     * @param path 图片路径
     * @returns Promise<SpriteFrame>
     */
    public loadSpriteFrameAsync(path: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            this.loadSpriteFrame(path, (spriteFrame) => {
                if (spriteFrame) {
                    resolve(spriteFrame);
                } else {
                    reject(new Error(`加载精灵帧失败: ${path}`));
                }
            });
        });
    }

    /**
     * Promise 风格的音频加载
     * @param path 音频路径
     * @returns Promise<AudioClip>
     */
    public loadAudioAsync(path: string): Promise<AudioClip> {
        return new Promise((resolve, reject) => {
            this.loadAudio(path, (audio) => {
                if (audio) {
                    resolve(audio);
                } else {
                    reject(new Error(`加载音频失败: ${path}`));
                }
            });
        });
    }

    /**
     * 释放指定路径的资源
     * @param path 资源路径
     * @param type 资源类型
     */
    public releaseAsset(path: string, type: 'prefab' | 'spriteFrame' | 'audio'): void {
        switch (type) {
            case 'prefab':
                if (this._prefabCache.has(path)) {
                    const prefab = this._prefabCache.get(path);
                    assetManager.releaseAsset(prefab);
                    this._prefabCache.delete(path);
                }
                break;
            case 'spriteFrame':
                if (this._spriteFrameCache.has(path)) {
                    const spriteFrame = this._spriteFrameCache.get(path);
                    assetManager.releaseAsset(spriteFrame);
                    this._spriteFrameCache.delete(path);
                }
                break;
            case 'audio':
                if (this._audioCache.has(path)) {
                    const audio = this._audioCache.get(path);
                    assetManager.releaseAsset(audio);
                    this._audioCache.delete(path);
                }
                break;
        }
    }

    /**
     * 释放所有资源
     */
    public releaseAll(): void {
        // 释放预制体
        this._prefabCache.forEach((prefab, path) => {
            assetManager.releaseAsset(prefab);
        });
        this._prefabCache.clear();

        // 释放精灵帧
        this._spriteFrameCache.forEach((spriteFrame, path) => {
            assetManager.releaseAsset(spriteFrame);
        });
        this._spriteFrameCache.clear();

        // 释放音频
        this._audioCache.forEach((audio, path) => {
            assetManager.releaseAsset(audio);
        });
        this._audioCache.clear();
    }
}