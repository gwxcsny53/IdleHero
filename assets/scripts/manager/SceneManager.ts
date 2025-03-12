import { _decorator, Component, Node, director, AssetManager, resources, ProgressBar, Label, game, macro, sys, profiler, log } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 场景管理器
 * 负责场景切换、预加载和资源管理
 */
@ccclass('SceneManager')
export class SceneManager {
    private static _instance: SceneManager = null;

    // 场景名称常量
    public static readonly SCENE_INDEX = 'index';
    public static readonly SCENE_BATTLE = 'battle';

    // 当前场景
    private _currentScene: string = '';

    // 预加载的场景资源
    private _preloadedScenes: Map<string, boolean> = new Map();

    // 加载进度回调
    private _progressCallback: (progress: number) => void = null;

    /**
     * 获取单例
     */
    public static getInstance(): SceneManager {
        if (!this._instance) {
            this._instance = new SceneManager();
        }
        return this._instance;
    }

    /**
     * 预加载场景
     * @param sceneName 场景名称
     * @param onProgress 加载进度回调
     * @param onComplete 加载完成回调
     */
    public preloadScene(sceneName: string, onProgress?: (progress: number) => void, onComplete?: () => void): void {
        if (this._preloadedScenes.get(sceneName)) {
            onComplete && onComplete();
            return;
        }

        this._progressCallback = onProgress;

        // 开始预加载场景
        director.preloadScene(sceneName,
            (completedCount, totalCount, item) => {
                const progress = completedCount / totalCount;
                onProgress && onProgress(progress);
            },
            (error) => {
                if (error) {
                    log(`预加载场景 ${sceneName} 失败: ${error}`);
                    return;
                }

                this._preloadedScenes.set(sceneName, true);
                log(`预加载场景 ${sceneName} 完成`);
                onComplete && onComplete();
            }
        );
    }

    /**
     * 切换到指定场景
     * @param sceneName 场景名称
     * @param onProgress 加载进度回调
     * @param onLaunched 场景启动完成回调
     * @param params 传递给新场景的参数
     */
    public loadScene(sceneName: string, onProgress?: (progress: number) => void, onLaunched?: () => void, params?: any): void {
        if (this._currentScene === sceneName) {
            return;
        }

        // 在切换场景前执行内存优化
        this._optimizeMemoryBeforeSceneChange();

        // 如果已预加载，直接切换
        if (this._preloadedScenes.get(sceneName)) {
            this._doLoadScene(sceneName, onLaunched, params);
            return;
        }

        // 否则先预加载再切换
        this.preloadScene(sceneName, onProgress, () => {
            this._doLoadScene(sceneName, onLaunched, params);
        });
    }

    /**
     * 执行场景加载
     */
    private _doLoadScene(sceneName: string, onLaunched?: () => void, params?: any): void {
        // 保存场景参数到全局，以便新场景访问
        if (params) {
            game['sceneParams'] = params;
        }

        director.loadScene(sceneName, (error) => {
            if (error) {
                log(`加载场景 ${sceneName} 失败: ${error}`);
                return;
            }

            this._currentScene = sceneName;

            // 场景加载完成后执行内存优化
            this._optimizeMemoryAfterSceneChange();

            onLaunched && onLaunched();
        });
    }

    /**
     * 获取传递给当前场景的参数
     */
    public getSceneParams(): any {
        return game['sceneParams'] || null;
    }

    /**
     * 清除场景参数
     */
    public clearSceneParams(): void {
        game['sceneParams'] = null;
    }

    /**
     * 切换场景前的内存优化
     */
    private _optimizeMemoryBeforeSceneChange(): void {
        // 强制垃圾回收
        sys.garbageCollect();

        // 关闭性能统计（如果开启的话）
        profiler.hideStats();
    }

    /**
     * 切换场景后的内存优化
     */
    private _optimizeMemoryAfterSceneChange(): void {
        // 延迟执行垃圾回收，确保场景加载完成后的资源释放
        this.scheduleOnce(() => {
            sys.garbageCollect();

            // 释放未使用的资源
            // resources.releaseUnusedAssets();
            // resources.releaseAll();
        }, 1);
    }

    /**
     * 延迟执行函数
     */
    private scheduleOnce(callback: Function, delay: number): void {
        setTimeout(() => {
            callback();
        }, delay * 1000);
    }

    /**
     * 从主场景进入战斗场景
     * @param params 传递给战斗场景的参数
     * @param onProgress 加载进度回调
     */
    public enterBattle(params?: any, onProgress?: (progress: number) => void): void {
        this.loadScene(SceneManager.SCENE_BATTLE, onProgress, null, params);
    }

    /**
     * 从战斗场景返回主场景
     * @param params 传递给主场景的参数
     * @param onProgress 加载进度回调
     */
    public returnToIndex(params?: any, onProgress?: (progress: number) => void): void {
        this.loadScene(SceneManager.SCENE_INDEX, onProgress, null, params);
    }

    /**
     * 获取当前场景名称
     */
    public getCurrentScene(): string {
        return this._currentScene;
    }

    /**
     * 预加载下一个可能的场景
     * 在当前场景加载完成后调用，提前准备下一个场景
     */
    public preloadNextPossibleScene(): void {
        if (this._currentScene === SceneManager.SCENE_INDEX) {
            this.preloadScene(SceneManager.SCENE_BATTLE);
        } else if (this._currentScene === SceneManager.SCENE_BATTLE) {
            this.preloadScene(SceneManager.SCENE_INDEX);
        }
    }
}