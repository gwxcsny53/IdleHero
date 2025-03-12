import { _decorator, Component, Node, ProgressBar, Label, log } from 'cc';
import { SceneManager } from '../manager/SceneManager';
const { ccclass, property } = _decorator;

@ccclass('IndexController')
export class IndexController extends Component {
    start() {
        // 场景启动时，预加载战斗场景
        this.preloadBattleScene();

        // 检查是否有从战斗场景返回的数据
        const params = SceneManager.getInstance().getSceneParams();
        if (params) {
            // 处理从战斗场景返回的数据
            this.handleReturnFromBattle(params);
            // 清除场景参数
            SceneManager.getInstance().clearSceneParams();
        }
    }

    /**
     * 预加载战斗场景
     */
    preloadBattleScene() {
        // 在适当时机预加载战斗场景，提高切换速度
        SceneManager.getInstance().preloadScene(
            SceneManager.SCENE_BATTLE,
            (progress) => {
                // 可以在这里更新预加载进度，也可以不显示
                console.log(`战斗场景预加载进度: ${progress * 100}%`);
            }
        );
    }

    /**
     * 处理从战斗场景返回的数据
     */
    handleReturnFromBattle(params: any) {
        // 处理从战斗场景返回的数据
        // 例如: 更新玩家资源、显示战斗结果等
        console.log('从战斗场景返回，数据:', params);
    }

    /**
     * 切换到战斗场景
     */
    battle() {
        // 显示加载界面
        this.showLoading(true);

        // 准备传递给战斗场景的参数
        const battleParams = {
            // 例如: 玩家数据、关卡信息等
            level: 1,
            playerData: {
                // 玩家数据
            }
        };

        // 切换到战斗场景
        SceneManager.getInstance().enterBattle(
            battleParams,
            (progress) => {
                log(`加载中... ${Math.floor(progress * 100)}%`)
            }
        );
    }

    /**
     * 显示/隐藏加载界面
     */
    showLoading(show: boolean) {
        log("加载中... 0%")
    }

    update(deltaTime: number) {
        // 更新逻辑
    }
}


