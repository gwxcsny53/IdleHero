import { _decorator, Component, Node, Label, tween, Vec3, find, UITransform, color, Color, LabelOutline, UIOpacity } from 'cc';

export class ToastHelper {
    /**
     * 显示提示信息
     * @param message 提示文本
     * @param duration 持续时间(秒)，默认2秒
     */
    public static show(message: string, duration: number = 2): void {
        // 获取或创建 Canvas
        const canvas = find('Canvas');
        if (!canvas) return;

        // 创建提示节点
        const toastNode = new Node('Toast');
        toastNode.setParent(canvas);

        // 设置节点位置和大小
        const transform = toastNode.addComponent(UITransform);
        transform.width = 500;
        transform.height = 80;
        toastNode.setPosition(new Vec3(0, 0, 0));

        // 创建文本节点
        const textNode = new Node('Text');
        textNode.setParent(toastNode);

        // 添加文本组件
        const label = textNode.addComponent(Label);
        label.string = message;
        label.fontSize = 32;
        label.lineHeight = 32;
        label.color = Color.WHITE;

        // 添加文本描边
        label.outlineColor = new Color(0, 0, 0, 255);
        label.outlineWidth = 2;

        // 设置文本节点大小和位置
        const textTransform = textNode.getComponent(UITransform);
        textTransform.width = 500;
        textTransform.height = 80;

        // 初始状态
        toastNode.setScale(new Vec3(0.5, 0.5, 1));
        toastNode.setPosition(new Vec3(0, -100, 0));

        // 动画效果
        tween(toastNode)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .to(0.2, { position: new Vec3(0, 100, 0) })
            .delay(duration)
            .call(() => {
                toastNode.destroy();
            })
            .start();
    }
}