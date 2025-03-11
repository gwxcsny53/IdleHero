import { _decorator, Component, Node, Vec3, tween, Tween, log } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 背景控制器
 * 实现背景的移动、暂停和震动效果
 */
@ccclass('BackgroundController')
export class BackgroundController extends Component {
    @property
    private moveSpeed: number = 100; // 移动速度，单位：像素/秒

    @property
    private direction: Vec3 = new Vec3(-1, 0, 0); // 移动方向，默认向左

    @property
    private isMoving: boolean = true; // 是否正在移动

    @property
    private resetPositionX: number = 0; // 重置位置的X坐标

    @property
    private moveResetPositionX: number = 0; // 移动到某一点时进行重置

    private originalPosition: Vec3 = new Vec3(); // 原始位置
    private currentShakeTween: Tween<Node> = null; // 当前震动动画

    start() {
        // 记录原始位置
        this.originalPosition.set(this.node.position);
    }

    update(deltaTime: number) {
        // 如果正在移动，则更新位置
        if (this.isMoving) {
            const moveAmount = this.moveSpeed * deltaTime;
            const currentPos = this.node.position;

            // 计算新位置
            const newPos = new Vec3(
                currentPos.x + this.direction.x * moveAmount,
                currentPos.y + this.direction.y * moveAmount,
                currentPos.z + this.direction.z * moveAmount
            );

            this.node.setPosition(newPos);

            // 检查是否需要重置位置（例如，背景循环）
            if (this.direction.x < 0) {
                if (newPos.x <= this.resetPositionX)
                    this.resetPosition();
            } else if (this.direction.x > 0 && newPos.x >= this.resetPositionX) {
                this.resetPosition();
            }
        }
    }

    /**
     * 开始移动背景
     */
    public startMoving(): void {
        this.isMoving = true;
    }

    /**
     * 暂停移动背景
     */
    public pauseMoving(): void {
        this.isMoving = false;
    }

    /**
     * 重置背景位置
     */
    private resetPosition(): void {
        log('resetPosition');
        this.node.setPosition(this.moveResetPositionX, this.originalPosition.y, this.originalPosition.z);
    }

    /**
     * 震动效果
     * @param duration 震动持续时间
     * @param strength 震动强度
     * @param times 震动次数
     */
    public shake(duration: number = 0.5, strength: number = 10, times: number = 5): void {
        // 如果已经有震动效果在进行，先停止
        if (this.currentShakeTween) {
            this.currentShakeTween.stop();
        }

        // 记录当前位置
        const currentPos = new Vec3(this.node.position);

        // 创建震动效果
        this.currentShakeTween = tween(this.node)
            .to(duration / times, { position: new Vec3(currentPos.x + strength, currentPos.y, currentPos.z) })
            .to(duration / times, { position: new Vec3(currentPos.x - strength, currentPos.y, currentPos.z) })
            .union()
            .repeat(times)
            .call(() => {
                // 震动结束后恢复原位
                this.node.setPosition(currentPos);
                this.currentShakeTween = null;
            })
            .start();
    }

    /**
     * 设置移动速度
     * @param speed 新的移动速度
     */
    public setMoveSpeed(speed: number): void {
        this.moveSpeed = speed;
    }

    /**
     * 设置移动方向
     * @param direction 新的移动方向
     */
    public setDirection(direction: Vec3): void {
        this.direction.set(direction);
    }
}