import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 英雄基础类
 * 包含英雄的基本属性和方法
 */
@ccclass('HeroModel')
export class HeroModel {
    @property
    private _name: string = 'hero'; // 英雄名称

    @property
    private _maxHp: number = 300; // 最大生命值

    @property
    private _currentHp: number = 300; // 当前生命值

    @property
    private _attack: number = 15; // 攻击力

    @property
    private _defense: number = 5; // 防御力

    @property
    private _attackRange: number = 1; // 攻击范围

    @property
    private _moveSpeed: number = 60; // 移动速度

    @property
    private _level: number = 1; // 英雄等级

    // 属性访问器
    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get maxHp(): number {
        return this._maxHp;
    }

    public set maxHp(value: number) {
        this._maxHp = value;
        // 确保当前血量不超过最大血量
        if (this._currentHp > this._maxHp) {
            this._currentHp = this._maxHp;
        }
    }

    public get currentHp(): number {
        return this._currentHp;
    }

    public set currentHp(value: number) {
        // 确保血量在有效范围内
        this._currentHp = Math.max(0, Math.min(value, this._maxHp));
    }

    public get attack(): number {
        return this._attack;
    }

    public set attack(value: number) {
        this._attack = value;
    }

    public get defense(): number {
        return this._defense;
    }

    public set defense(value: number) {
        this._defense = value;
    }

    public get attackRange(): number {
        return this._attackRange;
    }

    public set attackRange(value: number) {
        this._attackRange = value;
    }

    public get moveSpeed(): number {
        return this._moveSpeed;
    }

    public set moveSpeed(value: number) {
        this._moveSpeed = value;
    }

    public get level(): number {
        return this._level;
    }

    public set level(value: number) {
        this._level = value;
    }

    /**
     * 初始化英雄属性
     */
    public init(data: {
        name?: string,
        maxHp?: number,
        attack?: number,
        defense?: number,
        attackRange?: number,
        moveSpeed?: number,
        level?: number
    }): void {
        if (data.name) this._name = data.name;
        if (data.maxHp) {
            this._maxHp = data.maxHp;
            this._currentHp = data.maxHp;
        }
        if (data.attack) this._attack = data.attack;
        if (data.defense) this._defense = data.defense;
        if (data.attackRange) this._attackRange = data.attackRange;
        if (data.moveSpeed) this._moveSpeed = data.moveSpeed;
        if (data.level) this._level = data.level;
    }

    /**
     * 受到伤害
     * @param damage 伤害值
     * @returns 实际造成的伤害
     */
    public takeDamage(damage: number): number {
        // 计算实际伤害（考虑防御力）
        const actualDamage = Math.max(1, damage - this._defense);

        // 扣除生命值
        this.currentHp -= actualDamage;

        return actualDamage;
    }

    /**
     * 治疗生命值
     * @param amount 治疗量
     * @returns 实际恢复的生命值
     */
    public heal(amount: number): number {
        const oldHp = this._currentHp;
        this.currentHp += amount;
        return this._currentHp - oldHp;
    }

    /**
     * 判断英雄是否存活
     */
    public isAlive(): boolean {
        return this._currentHp > 0;
    }

    /**
     * 升级英雄
     * @param levels 升级的等级数
     */
    public levelUp(levels: number = 1): void {
        this._level += levels;

        // 这里可以根据等级提升属性
        this._maxHp += levels * 10;
        this._attack += levels * 2;
        this._defense += levels;

        // 升级后恢复满血
        this._currentHp = this._maxHp;
    }
}