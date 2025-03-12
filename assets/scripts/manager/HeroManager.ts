import { _decorator, Component, Node, Vec3, Contact2DType, IPhysics2DContact, CircleCollider2D, sp, log, UITransform, Sprite, Collider2D, find, tween, v2, game } from 'cc';
import { HeroModel } from '../model/HeroModel';
import { EnemyManager } from './EnemyManager';
import { BaseBattleHelper } from '../utils/BaseBattleHelper';
const { ccclass, property } = _decorator;

/**
 * 英雄管理类
 * 负责英雄的战斗、移动、攻击范围检测和动画播放
 */
@ccclass('HeroManager')
export class HeroManager extends Component {
    @property
    public moveDirection: number = 1; // 移动方向 1 向右 -1 向左
    @property
    public attackInterval: number = 1; // 攻击间隔（秒）

    public heroModel: HeroModel = null; // 英雄数据模型

    public safeMove = true;


    private targetEnemy: Node = null; // 当前目标敌人
    private isAttacking: boolean = false; // 是否正在攻击
    private attackTimer: number = 0; // 攻击计时器
    private enemiesInRange: Node[] = []; // 攻击范围内的敌人

    private healthBarFill: Node = null; // 血条填充部分节点
    private whiteHealthBarFill: Node = null; // 新增白色过渡血条
    /**血条最大长度 */
    private healthBarMaxWidth = 0;
    private previousHealthPercent: number = 1; // 记录上次血量百分比

    private animationNode: Node = null; // 动画节点
    private attackRangeNode: Node = null; // 碰撞节点



    start() {
        //添加标签
        this.node["pid"] = "hero";
        //初始动画节点
        this.animationNode = find("anim", this.node);
        // 初始化英雄数据模型
        this.heroModel = new HeroModel();
        // 初始化攻击范围检测
        this.initAttackRangeDetection();
        // 初始化血条
        this.initHealthBar();

        // 添加波次事件监听
        game.on("WaveComplete", this.onWaveComplete, this);
        game.on("WaveReady", this.onWaveReady, this);
    }

    onDestroy() {
        game.off("WaveComplete", this.onWaveComplete, this);
        game.off("WaveReady", this.onWaveReady, this);
    }

    private onWaveComplete = () => {
        // 禁止自主移动
        this.safeMove = false;

        // 播放移动动画
        this.playAnimation('run');

        // 快速移动到初始位置
        tween(this.node)
            .to(2, { position: new Vec3(-400, 0, 0) })
            .call(() => {
                // 播放待机动画
                this.playAnimation('idle');
            })
            .start();
        // 发送背景快速移动事件
        game.emit("BackgroundContorllerState", true, 400);
    }

    private onWaveReady = () => {
        // 恢复自主移动
        this.safeMove = true;
        // 停止背景快速移动
        game.emit("BackgroundContorllerState", false, 200);
    }
    update(deltaTime: number) {
        // return
        // 更新攻击计时器
        if (this.isAttacking) {
            this.attackTimer += deltaTime;
            if (this.attackTimer >= this.attackInterval) {
                this.attackTimer = 0;
                this.performAttack();
            }
        }

        // 如果没有目标敌人但范围内有敌人，选择一个新目标
        if (!this.targetEnemy && this.enemiesInRange.length > 0) {
            this.selectTarget();
        }

        // 如果有目标敌人但不在攻击中，开始攻击
        if (this.targetEnemy && !this.isAttacking) {
            this.startAttack();
        }

        // 如果没有目标敌人且不在攻击中，可以移动
        if (!this.targetEnemy && !this.isAttacking) {
            this.move(deltaTime);
        }
    }

    /**
     * 设置英雄数据
     * @param heroData 英雄数据
     */
    public setHeroData(heroData: HeroModel): void {
        this.heroModel = heroData;

        const moveSpeed = heroData.moveSpeed;
        // 更新攻击范围
        if (this.attackRangeNode) {
            // 假设攻击范围是一个圆形碰撞体，设置其半径为英雄的攻击范围
            const collider = this.attackRangeNode.getComponent(CircleCollider2D);
            if (collider) {
                // 这里需要根据你的具体碰撞体类型来设置范围
                // 例如，如果是圆形碰撞体：
                // const circleCollider = collider as CircleCollider2D;
                // circleCollider.radius = this.heroModel.attackRange;
            }
        }
    }

    /**
     * 初始化攻击范围检测
     */
    private initAttackRangeDetection(): void {
        this.attackRangeNode = find("attackRange", this.node);
        if (!this.attackRangeNode) return;

        const collider = this.attackRangeNode.getComponent(CircleCollider2D);


        if (collider) {
            // 注册碰撞回调
            collider.on(Contact2DType.BEGIN_CONTACT, this.onEnemyEnterRange, this);
            collider.on(Contact2DType.END_CONTACT, this.onEnemyExitRange, this);
        }
    }

    /**
     * 敌人进入攻击范围回调
     */
    private onEnemyEnterRange(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
        const colliderNode = otherCollider.node.getParent();
        // 确认碰撞的是敌人
        if (colliderNode["pid"] === 'enemy') {
            // 将敌人添加到范围内敌人列表
            this.enemiesInRange.push(colliderNode);

            // 如果没有当前目标，选择这个敌人作为目标
            if (!this.targetEnemy) {
                this.selectTarget();
            }
        }
    }

    /**
     * 敌人离开攻击范围回调
     */
    private onEnemyExitRange(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
        const colliderNode = otherCollider.node.getParent();
        // 确认碰撞的是敌人
        if (colliderNode["pid"] === 'enemy') {
            // 从范围内敌人列表移除
            const index = this.enemiesInRange.indexOf(colliderNode);
            if (index !== -1) {
                this.enemiesInRange.splice(index, 1);
            }

            // 如果离开的是当前目标，重新选择目标
            if (this.targetEnemy === colliderNode) {
                this.targetEnemy = null;
                this.stopAttack();
                this.selectTarget();
            }
        }
    }

    /**
     * 选择攻击目标
     * 可以根据需要实现不同的目标选择策略（最近的、最弱的等）
     */
    private selectTarget(): void {

        if (this.enemiesInRange.length === 0) {
            this.targetEnemy = null;
            return;
        }
        log("select target !")

        // 简单策略：选择第一个敌人作为目标
        this.targetEnemy = this.enemiesInRange[0];

        // 面向目标
        this.faceTarget();
    }

    /**
     * 面向目标
     */
    private faceTarget(): void {
        if (!this.targetEnemy) return;

        // 获取目标方向
        const targetPos = this.targetEnemy.position;
        const selfPos = this.node.position;

        const scale = this.animationNode.scale;
        // 根据目标位置调整朝向
        if (targetPos.x > selfPos.x) {
            // 目标在右边，设置为正向
            this.animationNode.scale = new Vec3(Math.abs(scale.x), scale.y, scale.z);
        } else {
            // 目标在左边，设置为反向
            this.animationNode.scale = new Vec3(-Math.abs(scale.x), scale.y, scale.z);
        }
    }

    /**
     * 开始攻击
     */
    private startAttack(): void {
        this.isAttacking = true;
        this.attackTimer = 0;

        // 播放攻击动画
        this.playAnimation('attack');
    }

    /**
     * 停止攻击
     */
    private stopAttack(): void {
        this.isAttacking = false;

        // 播放待机动画
        this.playAnimation('idle');
    }

    /**
     * 执行攻击
     */
    private performAttack(): void {
        if (!this.targetEnemy || !this.heroModel) return;

        // 获取目标敌人的生命组件
        const enemyManager = this.targetEnemy.getComponent(EnemyManager); // 假设敌人有一个EnemyHealth组件
        if (enemyManager) {
            if (!enemyManager.enemyModel.isAlive()) {
                this.targetEnemy = null;
                this.stopAttack();
                // 从攻击范围内移除已死亡的英雄
                const index = this.enemiesInRange.indexOf(this.targetEnemy);
                if (index !== -1) {
                    this.enemiesInRange.splice(index, 1);
                }
                return;
            }
            // 对敌人造成伤害
            enemyManager.takeDamage(this.heroModel.attack);

            // 播放攻击动画
            this.playAnimation('attack');
        }
    }

    /**
     * 移动英雄
     */
    private move(deltaTime: number): void {
        //判断朝向
        const scale = this.animationNode.scale;
        if (scale.x < 0) {
            this.animationNode.scale = new Vec3(Math.abs(scale.x), scale.y, scale.z);
        }
        if (!this.safeMove) {
            return
        }
        // 简单的向右移动
        const currentPos = this.node.position;
        const newPos = new Vec3(
            currentPos.x + this.heroModel.moveSpeed * deltaTime,
            currentPos.y,
            currentPos.z
        );
        this.node.setPosition(newPos);

        // 播放移动动画
        this.playAnimation('run');
    }

    /**
     * 播放动画
     * @param animName 动画名称
     */
    private playAnimation(animName: string): void {
        if (animName == "hit") {
            return
        }
        if (!this.animationNode) return;
        const skeleton: sp.Skeleton = this.animationNode.getComponent(sp.Skeleton);
        const nowAnimName = skeleton.animation;
        if (animName == "run") {
            if (nowAnimName === animName) {
                return
            }
            skeleton.setAnimation(0, animName, true);
            return
        }
        skeleton.setAnimation(0, animName, false);
    }

    /**
     * 初始化血条
     */
    private initHealthBar(): void {
        this.healthBarFill = find("healthBar/Fill", this.node);
        this.whiteHealthBarFill = find("healthBar/WhiteFill", this.node);
        this.healthBarMaxWidth = this.healthBarFill.getComponent(UITransform).width;
        // 初始化白色血条
        if (this.whiteHealthBarFill) {
            const whiteTransform = this.whiteHealthBarFill.getComponent(UITransform);
            whiteTransform.width = this.healthBarMaxWidth;
        }
        this.updateHealthBar();
    }

    /**
     * 更新血条显示
     */
    private updateHealthBar(): void {
        if (!this.healthBarFill || !this.heroModel) return;

        // 计算血量百分比
        const healthPercent = this.heroModel.currentHp / this.heroModel.maxHp;
        const uiTransform = this.healthBarFill.getComponent(UITransform);
        // 更新血条填充宽度
        // 血量减少时触发白色过渡动画
        if (healthPercent < this.previousHealthPercent) {
            BaseBattleHelper.showDamageEffect(this.whiteHealthBarFill, this.healthBarMaxWidth, this.previousHealthPercent, healthPercent)
        }
        if (uiTransform) {
            uiTransform.width = this.healthBarMaxWidth * healthPercent;
        }
        this.previousHealthPercent = healthPercent;
    }

    /**
     * 受到伤害
     * @param damage 伤害值
     */
    public takeDamage(damage: number): void {
        if (!this.heroModel) return;

        const actualDamage = this.heroModel.takeDamage(damage);

        // 更新血条
        this.updateHealthBar();

        // 播放受伤动画
        this.playAnimation('hit');

        // 检查是否死亡
        if (!this.heroModel.isAlive()) {
            this.die();
        }
    }

    /**
     * 治疗生命值
     * @param amount 治疗量
     */
    public heal(amount: number): void {
        if (!this.heroModel) return;

        this.heroModel.heal(amount);

        // 更新血条
        this.updateHealthBar();
    }

    /**
     * 死亡处理
     */
    private die(): void {
        // 播放死亡动画
        this.playAnimation('dead');

        // 禁用碰撞和行为
        this.enabled = false;

        // 可以在这里添加死亡后的处理逻辑
        this.node.destroy();
    }
}