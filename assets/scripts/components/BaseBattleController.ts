import { _decorator, Component, Node, instantiate, Prefab, Vec3, log, game, Sprite, Color, ProgressBar, Label } from 'cc';
import { EnemyManager } from '../manager/EnemyManager';
import { HeroManager } from '../manager/HeroManager';
import { ToastHelper } from '../utils/ToastHelper';
import { SceneManager } from '../manager/SceneManager';
const { ccclass, property } = _decorator;

/**
 * 基础战斗控制器
 * 负责管理战斗流程、英雄和敌人的生成与管理
 */
@ccclass('BaseBattleController')
export class BaseBattleController extends Component {
    @property(Prefab)
    heroPrefab: Prefab = null;
    @property(Prefab)
    enemyPrefab: Prefab = null;
    @property(Node)
    battleField: Node = null;


    public totalPoint: number = 3; //总关卡数
    private point: number = 1; // 关卡数

    protected heroes: HeroManager[] = []; // 当前战场上的英雄
    protected enemies: EnemyManager[] = []; // 当前战场上的敌人

    protected isBattleActive: boolean = false; // 战斗是否进行中
    protected isWaveComplete: boolean = false; // 当前波次是否完成

    @property(Node)
    pointContainer: Node = null; // 关卡显示容器节点

    @property(Prefab)
    pointItemPrefab: Prefab = null; // 关卡显示项预制体

    private pointItems: Node[] = []; // 关卡显示项节点数组
    private battleData: any = null; // 关卡显示项节点数组

    start() {
        // 获取从主场景传递的参数
        const params = SceneManager.getInstance().getSceneParams();
        if (params) {
            this.initBattleScene(params);
            this.battleData = params;
            // 初始化战斗场景
            // 清除场景参数
            SceneManager.getInstance().clearSceneParams();
        }
        // 预加载主场景，为返回做准备
        // this.preloadIndexScene();
    }

    private initBattleScene(params: any): void {
        console.log('初始化战斗场景，参数:', params);
        this.initPointDisplay();
        this.initBattle();
    }

    /**
    * 预加载主场景
    */
    preloadIndexScene() {
        // 在适当时机预加载主场景，提高返回速度
        SceneManager.getInstance().preloadScene(
            SceneManager.SCENE_INDEX,
            (progress) => {
                // 可以在这里更新预加载进度，也可以不显示
                console.log(`主场景预加载进度: ${progress * 100}%`);
            }
        );
    }

    /**
  * 返回主场景
  */
    returnToIndex() {
        // 显示加载界面
        this.showLoading(true);
        // 准备返回主场景的数据
        const returnParams = {
            // 例如: 战斗结果、获得的资源等
            battleResult: 'victory',
            rewards: {
                // 奖励数据
            }
        };
        // 返回主场景
        SceneManager.getInstance().returnToIndex(
            returnParams,
            (progress) => {
                // 更新加载进度
                // if (this.loadingBar) {
                //     this.loadingBar.progress = progress;
                // }
                // if (this.loadingLabel) {
                //     this.loadingLabel.string = `加载中... ${Math.floor(progress * 100)}%`;
                // }
            }
        );
    }

    /**
     * 显示/隐藏加载界面
     */
    showLoading(show: boolean) {

    }

    update(deltaTime: number) {
        if (!this.isBattleActive) return;

        this.checkBattleStatus();
    }

    /**
     * 初始化战斗
     */
    protected initBattle(): void {
        this.isBattleActive = true;
        this.isWaveComplete = false;

        // 清空战场
        this.clearBattleField();

        // 生成初始英雄和敌人
        this.spawnInitialUnits();
    }

    /**
     * 生成初始单位
     */
    protected spawnInitialUnits(): void {
        // 生成英雄
        this.spawnHero(new Vec3(-400, 0, 0));

        // 生成敌人
        this.spawnEnemy(new Vec3(400, 0, 0));
    }

    /**
     * 生成英雄
     */
    protected spawnHero(position: Vec3): HeroManager {
        if (!this.heroPrefab || !this.battleField) return null;

        const heroNode = instantiate(this.heroPrefab);
        heroNode.setParent(this.battleField);
        heroNode.setPosition(position);

        const heroManager = heroNode.getComponent(HeroManager);
        if (heroManager) {
            this.heroes.push(heroManager);
        }

        return heroManager;
    }

    /**
     * 生成敌人
     */
    protected spawnEnemy(position: Vec3): EnemyManager {
        if (!this.enemyPrefab || !this.battleField) return null;

        const enemyNode = instantiate(this.enemyPrefab);
        enemyNode.setParent(this.battleField);
        enemyNode.setPosition(position);

        const enemyManager = enemyNode.getComponent(EnemyManager);
        if (enemyManager) {

            this.enemies.push(enemyManager);
            if (position.x < 0) {
                enemyManager.moveDirection = 1;
            }
        }

        return enemyManager;
    }

    /**
     * 检查战斗状态
     */
    protected checkBattleStatus(): void {
        // 清理已销毁的单位
        this.cleanupDestroyedUnits();

        // 检查战斗是否结束
        if (this.enemies.length === 0) {
            this.onWaveComplete();
        } else if (this.heroes.length === 0) {
            this.onBattleFailed();
        }
    }

    /**
     * 清理已销毁的单位
     */
    protected cleanupDestroyedUnits(): void {
        this.heroes = this.heroes.filter(hero => hero.node && hero.node.isValid);
        this.enemies = this.enemies.filter(enemy => enemy.node && enemy.node.isValid);
    }

    /**
     * 清空战场
     */
    protected clearBattleField(): void {
        this.heroes.forEach(hero => {
            if (hero.node && hero.node.isValid) {
                hero.node.destroy();
            }
        });
        this.enemies.forEach(enemy => {
            if (enemy.node && enemy.node.isValid) {
                enemy.node.destroy();
            }
        });

        this.heroes = [];
        this.enemies = [];
    }

    /**
     * 当波次完成时调用
     */
    protected onWaveComplete(): void {
        if (this.isWaveComplete) return;

        this.isWaveComplete = true;
        this.point++;

        // 更新关卡显示
        this.updatePointDisplay();

        // 检查是否完成所有关卡
        if (this.point > this.totalPoint) {
            this.onBattleComplete();
            return;
        }

        // 发送波次完成事件
        game.emit("WaveComplete");

        // 延迟开始下一波
        this.scheduleOnce(() => {
            game.emit("WaveReady");
            this.startNextWave();
        }, 2);
    }

    /**
     * 开始下一波战斗
     * 根据关卡数生成新的敌人
     */
    protected startNextWave(): void {
        log("next wave");
        this.isWaveComplete = false;
        if (this.point == 2) {
            this.spawnEnemy(new Vec3(400, 0, 0));
            this.spawnEnemy(new Vec3(-900, 0, 0));
        } else if (this.point == 3) {
            this.spawnEnemy(new Vec3(500, 0, 0));
            // this.spawnEnemy(new Vec3(400, 0, 0));
        }
    }

    /**
     * 当战斗失败时调用
     */
    protected onBattleFailed(): void {
        this.isBattleActive = false;
        // 在这里处理战斗失败逻辑
        log("fail");
        this.clearBattleField();
    }

    /**
     * 重新开始战斗
     */
    public restartBattle(): void {
        this.point = 1;
        this.initBattle();
    }

    /**
     * 初始化关卡显示
     */
    private initPointDisplay(): void {
        if (!this.pointContainer || !this.pointItemPrefab) return;

        // 清空现有显示
        this.pointContainer.removeAllChildren();
        this.pointItems = [];

        // 根据总关卡数生成显示项
        for (let i = 0; i < this.totalPoint; i++) {
            const item = instantiate(this.pointItemPrefab);
            item.setParent(this.pointContainer);
            this.pointItems.push(item);
        }

        // 更新显示状态
        this.updatePointDisplay();
    }

    /**
     * 更新关卡显示状态
     */
    private updatePointDisplay(): void {
        this.pointItems.forEach((item, index) => {
            const sprite = item.getComponent(Sprite);
            if (sprite) {
                // 当前关卡之前的显示为已完成状态
                if (index < this.point - 1) {
                    sprite.color = new Color(100, 100, 100, 255); // 灰色表示已完成
                }
                // 当前关卡显示为进行中状态
                else if (index === this.point - 1) {
                    sprite.color = new Color(255, 215, 0, 255); // 金色表示当前
                }
                // 后续关卡显示为未开始状态
                else {
                    sprite.color = new Color(255, 255, 255, 255); // 白色表示未开始
                }
            }
        });
    }

    /**
     * 战斗全部完成
     */
    private onBattleComplete(): void {
        this.isBattleActive = false;
        log("battle complete!");
        // 这里可以添加通关奖励或者切换场景等逻辑
        ToastHelper.show("battle complete!", 0.5, () => {
            this.returnToIndex();
        });
        this.clearBattleField()
    }
}


