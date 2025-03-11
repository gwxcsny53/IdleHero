import { _decorator, Component, game, Node, tween, Vec3, find } from 'cc';
import { HeroManager } from './HeroManager';
import { EnemyManager } from './EnemyManager';
const { ccclass, property } = _decorator;

@ccclass('MoveManager')
export class MoveManager extends Component {
    @property(Node)
    public heroNode: Node = null;

    private moveAreaWidth = 200;
    private moveisScrolling = false;
    private heroManager: HeroManager = null;
    private currentTarget: Node = null;
    private enemies: Node[] = [];
    private isMovingToTarget = false;

    start() {
        this.heroManager = this.heroNode?.getComponent(HeroManager);
        this.updateEnemyList();
    }

    update(deltaTime: number) {
        if (!this.heroNode || !this.heroManager) return;

        // 更新敌人列表
        this.updateEnemyList();
        
        // 检查当前目标是否有效
        this.checkCurrentTarget();
        
        // 如果没有目标，寻找新目标
        if (!this.currentTarget) {
            this.findNewTarget();
        }

        // 如果有目标且不在攻击范围内，移动向目标
        if (this.currentTarget && !this.isInAttackRange(this.currentTarget)) {
            this.moveTowardsTarget(deltaTime);
        }

        // 检查边界
        this.checkPlayerBounds();
    }

    private updateEnemyList(): void {
        // 获取场景中所有敌人
        const enemyNodes = this.node.parent.children.filter(node => {
            const enemy = node.getComponent(EnemyManager);
            return enemy && !enemy.isDead;
        });
        this.enemies = enemyNodes;
    }

    private checkCurrentTarget(): void {
        if (!this.currentTarget?.isValid || 
            this.currentTarget.getComponent(EnemyManager)?.isDead) {
            this.currentTarget = null;
        }
    }

    private findNewTarget(): void {
        if (this.enemies.length === 0) return;

        // 找到最近的敌人
        let nearestEnemy = null;
        let minDistance = Infinity;

        for (const enemy of this.enemies) {
            const distance = Math.abs(enemy.position.x - this.heroNode.position.x);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }

        this.currentTarget = nearestEnemy;
    }

    private isInAttackRange(target: Node): boolean {
        const distance = Math.abs(target.position.x - this.heroNode.position.x);
        return distance <= this.heroManager.heroModel.attackRange;
    }

    private moveTowardsTarget(deltaTime: number): void {
        if (!this.currentTarget || !this.heroNode) return;

        const direction = this.currentTarget.position.x > this.heroNode.position.x ? 1 : -1;
        const moveSpeed = this.heroManager.heroModel.moveSpeed;
        
        const newPos = new Vec3(
            this.heroNode.position.x + moveSpeed * deltaTime * direction,
            this.heroNode.position.y,
            this.heroNode.position.z
        );

        // 限制移动范围
        newPos.x = Math.max(-this.moveAreaWidth, Math.min(this.moveAreaWidth, newPos.x));
        this.heroNode.setPosition(newPos);
    }

    private checkPlayerBounds() {
        const exceedRight = this.heroNode.position.x > this.moveAreaWidth;
        const exceedLeft = this.heroNode.position.x < -this.moveAreaWidth;

        if ((exceedRight || exceedLeft) && !this.moveisScrolling) {
            this.startBgScroll(exceedRight ? 1 : -1);
        }
    }

    private startBgScroll(direction: number) {
        this.moveisScrolling = true;
        game.emit("BackgroundContorllerState", true);
        
        // 将英雄移回可移动区域内
        const targetX = direction > 0 ? this.moveAreaWidth : -this.moveAreaWidth;
        this.heroNode.setPosition(new Vec3(targetX, this.heroNode.position.y, this.heroNode.position.z));
        
        this.scheduleOnce(() => {
            this.moveisScrolling = false;
            game.emit("BackgroundContorllerState", false);
        }, 0.5);
    }

    public isAllEnemiesDefeated(): boolean {
        return this.enemies.length === 0;
    }
}


