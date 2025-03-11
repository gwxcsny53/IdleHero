import { _decorator, Component, Node, Animation, Vec3, Contact2DType, IPhysics2DContact, CircleCollider2D, sp, log, SkeletalAnimation, UITransform, Sprite, Collider2D, find } from 'cc';
import { EnemyModel } from '../model/EnemyModel';
import { HeroManager } from './HeroManager';
const { ccclass, property } = _decorator;

/**
 * 敌人管理类
 * 负责敌人的战斗、移动、攻击范围检测和动画播放
 */
@ccclass('EnemyManager')
export class EnemyManager extends Component {
    @property
    public moveDirection: number = 1; // 移动方向 1 向右 -1 向左
    @property
    private attackInterval: number = 1.5; // 攻击间隔（秒）
    public enemyModel: EnemyModel = null; // 敌人数据模型
    private targetHero: Node = null; // 当前目标英雄
    private isAttacking: boolean = false; // 是否正在攻击
    private attackTimer: number = 0; // 攻击计时器
    private heroesInRange: Node[] = []; // 攻击范围内的英雄
    private isDead: boolean = false; // 是否已死亡

    private healthBarFill: Node = null; // 血条填充部分节点
    /**血条最大长度 */
    private healthBarMaxWidth = 0;

    private animationNode: Node = null; // 动画节点
    private attackRangeNode: Node = null; // 碰撞节点

    start() {
        //添加标签
        this.node["pid"] = "enemy";
        //初始动画节点
        this.animationNode = find("anim", this.node);
        // 初始化敌人数据模型
        this.enemyModel = new EnemyModel();
        // 初始化攻击范围检测
        this.initAttackRangeDetection();
        // 初始化血条
        this.initHealthBar();
    }

    update(deltaTime: number) {
        // return
        if (this.isDead) return;

        // 更新攻击计时器
        if (this.isAttacking) {
            this.attackTimer += deltaTime;
            if (this.attackTimer >= this.attackInterval) {
                this.attackTimer = 0;
                this.performAttack();
            }
        }

        // 如果没有目标英雄但范围内有英雄，选择一个新目标
        if (!this.targetHero && this.heroesInRange.length > 0) {
            this.selectTarget();
        }

        // 如果有目标英雄但不在攻击中，开始攻击
        if (this.targetHero && !this.isAttacking) {
            this.startAttack();
        }

        // 如果没有目标英雄且不在攻击中，可以移动
        if (!this.targetHero && !this.isAttacking) {
            this.move(deltaTime);
        }
    }

    /**
     * 设置敌人数据
     * @param enemyData 敌人数据
     */
    public setEnemyData(enemyData: EnemyModel): void {
        this.enemyModel = enemyData;

        // 更新攻击范围
        if (this.attackRangeNode) {
            const collider = this.attackRangeNode.getComponent(CircleCollider2D);
            if (collider) {
                const circleCollider = collider as CircleCollider2D;
                circleCollider.radius = this.enemyModel.attackRange;
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
            collider.on(Contact2DType.BEGIN_CONTACT, this.onHeroEnterRange, this);
            collider.on(Contact2DType.END_CONTACT, this.onHeroExitRange, this);
        }
    }

    /**
     * 英雄进入攻击范围回调
     */
    private onHeroEnterRange(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
        // 确认碰撞的是英雄
        const colliderNode = otherCollider.node.getParent();
        if (colliderNode["pid"] === 'hero') {
            // 将英雄添加到范围内英雄列表
            this.heroesInRange.push(colliderNode);

            // 如果没有当前目标，选择这个英雄作为目标
            if (!this.targetHero) {
                this.selectTarget();
            }
        }
    }

    /**
     * 英雄离开攻击范围回调
     */
    private onHeroExitRange(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {

        const colliderNode = otherCollider.node.getParent();
        // 确认碰撞的是英雄
        if (colliderNode["pid"] === 'hero') {
            // 从范围内英雄列表移除
            const index = this.heroesInRange.indexOf(colliderNode);
            if (index !== -1) {
                this.heroesInRange.splice(index, 1);
            }

            // 如果离开的是当前目标，重新选择目标
            if (this.targetHero === colliderNode) {
                this.targetHero = null;
                this.stopAttack();
                this.selectTarget();
            }
        }
    }

    /**
     * 选择攻击目标
     */
    private selectTarget(): void {
        if (this.heroesInRange.length === 0) {
            this.targetHero = null;
            return;
        }

        // 简单策略：选择第一个英雄作为目标
        this.targetHero = this.heroesInRange[0];

        // 面向目标
        this.faceTarget();
    }

    /**
     * 面向目标
     */
    private faceTarget(): void {
        if (!this.targetHero) return;

        // 获取目标方向
        const targetPos = this.targetHero.position;
        const selfPos = this.node.position;

        // 根据目标位置调整朝向
        if (targetPos.x > selfPos.x) {
            // 目标在右边，设置为正向
            this.animationNode.scale = new Vec3(-Math.abs(this.node.scale.x), this.node.scale.y, this.node.scale.z);
        } else {
            // 目标在左边，设置为反向
            this.animationNode.scale = new Vec3(Math.abs(this.node.scale.x), this.node.scale.y, this.node.scale.z);
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
        this.playAnimation('stand');
    }

    /**
     * 执行攻击
     */
    private performAttack(): void {
        if (!this.targetHero || !this.enemyModel) return;

        // 获取目标英雄的管理组件
        const heroManager: HeroManager = this.targetHero.getComponent(HeroManager);
        if (heroManager) {
            if (!heroManager.heroModel.isAlive()) {
                // 英雄已死亡，清除目标并停止攻击
                this.targetHero = null;
                this.stopAttack();
                // 从攻击范围内移除已死亡的英雄
                const index = this.heroesInRange.indexOf(this.targetHero);
                if (index !== -1) {
                    this.heroesInRange.splice(index, 1);
                }
                return;
            }
            // 对英雄造成伤害
            heroManager.takeDamage(this.enemyModel.attack);

            // 播放攻击动画
            this.playAnimation('attack');
        }
    }

    /**
     * 移动敌人
     */
    private move(deltaTime: number): void {
        if (!this.enemyModel) return;

        const currentPos = this.node.position;
        const newPos = new Vec3(
            currentPos.x + (this.enemyModel.moveSpeed * deltaTime) * this.moveDirection,
            currentPos.y,
            currentPos.z
        );
        this.node.setPosition(newPos);

        // 播放移动动画
        this.playAnimation('walk');
    }

    /**
     * 播放动画
     * @param animName 动画名称
     */
    private playAnimation(animName: string): void {

        if (animName == "hit") {
            // log("播放动画 - enemy", animName);
            return
        }


        if (!this.animationNode) return;

        // const

        const skeleton: sp.Skeleton = this.animationNode.getComponent(sp.Skeleton);
        const nowAnimName = skeleton.animation;
        if (nowAnimName === animName) return;
        // 播放指定动画
        if (animName) {
            skeleton.setAnimation(0, animName, true);
        }
    }

    /**
     * 初始化血条
     */
    private initHealthBar(): void {
        this.healthBarFill = find("healthBar/Fill", this.node);
        this.healthBarMaxWidth = this.healthBarFill.getComponent(UITransform).width;
        if (!this.healthBarFill) return;
        // 确保血条初始状态是满的
        this.updateHealthBar();
    }

    /**
     * 更新血条显示
     */
    private updateHealthBar(): void {
        if (!this.healthBarFill || !this.enemyModel) return;

        // 计算血量百分比
        const healthPercent = this.enemyModel.currentHp / this.enemyModel.maxHp;

        // 更新血条填充宽度
        const uiTransform = this.healthBarFill.getComponent(UITransform);
        if (uiTransform) {
            const maxWidth = this.healthBarMaxWidth;
            uiTransform.width = maxWidth * healthPercent;
        }
    }

    /**
     * 受到伤害
     * @param damage 伤害值
     */
    public takeDamage(damage: number): void {
        if (!this.enemyModel || this.isDead) return;

        const actualDamage = this.enemyModel.takeDamage(damage);

        // 更新血条
        this.updateHealthBar();

        // 播放受伤动画
        this.playAnimation('hit');

        // 检查是否死亡
        if (!this.enemyModel.isAlive()) {
            this.die();
        }
    }

    /**
     * 死亡处理
     */
    private die(): void {
        if (this.isDead) return;

        this.isDead = true;

        // 播放死亡动画
        this.playAnimation('dead');

        // 禁用碰撞和行为
        this.isAttacking = false;

        // 获取奖励
        const rewards = this.enemyModel.getRewards();

        // 通知游戏管理器敌人死亡，提供奖励
        // 这里可以发送事件或直接调用游戏管理器
        // 例如: GameManager.getInstance().onEnemyDefeated(rewards);

        // 延迟销毁敌人节点
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 2); // 2秒后销毁，给死亡动画播放的时间
    }

    /**
     * 获取敌人当前生命值百分比
     */
    public getHealthPercentage(): number {
        if (!this.enemyModel) return 0;
        return this.enemyModel.currentHp / this.enemyModel.maxHp;
    }
}