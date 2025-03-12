import { _decorator, Component, easing, Node, tween, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BaseBattleHelper')
export class BaseBattleHelper {



    /**
     * 显示伤害过渡效果
     * @param fromPercent 起始百分比
     * @param toPercent 结束百分比
     */
    public static showDamageEffect(whiteHealthBarFill: Node, maxWidth: number, fromPercent: number, toPercent: number): void {
        if (!whiteHealthBarFill) return;
        const whiteTransform = whiteHealthBarFill.getComponent(UITransform);
        // 立即设置白色血条初始状态
        whiteTransform.width = maxWidth * fromPercent;
        tween(whiteHealthBarFill.getComponent(UITransform))
            .to(2, {
                width: maxWidth * toPercent,
            }, {
                easing: easing.quadOut,
            })
            .start();
    }

}


