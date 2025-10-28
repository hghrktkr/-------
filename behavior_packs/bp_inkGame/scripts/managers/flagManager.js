import { world, ItemStack } from "@minecraft/server";
import { flagConfig } from "../configs/flagConfig";
import LOCATION_UTILS from "../utils/locationUtils";
import { gamePlayerManager } from "./gamePlayerManager";
import { broadcastChat, broadcastTitle } from "../utils/helpers";
import { teamConfig } from "../configs/playerConfig";

class FlagManager {
    constructor() {
        this.flagHolder = null;
    }


    spawnFlag() {
        const randomPos = LOCATION_UTILS.makeRandomPos(flagConfig.startPos, flagConfig.endPos);
        world.getDimension(flagConfig.dimension).setBlockType(randomPos, "edu:flag");
        broadcastTitle('フラッグしゅつげん！！', 'チームエリアに持っていこう');
    }

    checkFlagHolder() {
        this.flagHolder = null;
        for (const gamePlayer of gamePlayerManager.gamePlayers.values()) {
            if (gamePlayer.hasFlag) {
                if (this.flagHolder && this.flagHolder !== gamePlayer) {
                    // 複数保持状態を検出 → 強制修正
                    gamePlayer.hasFlag = false;
                    continue;
                }
                this.flagHolder = gamePlayer;
            }
        }
    }

    checkFlagHolderInOwnArea() {
        if (!this.flagHolder) return false;

        const { player, team } = this.flagHolder;
        const teamArea = team === "blue" ? teamConfig.teamBlue : teamConfig.teamYellow;

        const center = LOCATION_UTILS.toBlockPos({
            x: (teamArea.teamAreaStart.x + teamArea.teamAreaEnd.x) / 2,
            y: (teamArea.teamAreaStart.y + teamArea.teamAreaEnd.y) / 2,
            z: (teamArea.teamAreaStart.z + teamArea.teamAreaEnd.z) / 2,
        });

        return LOCATION_UTILS.isWithinRange(player, center, 3);
    }
    
    onGetFlag(gamePlayer) {
        if(gamePlayer.hasFlag) return;
        this.flagHolder = gamePlayer;
        const teamPlayers = gamePlayer.team === "blue" ? gamePlayerManager.BlueTeamPlayers : gamePlayerManager.YellowTeamPlayers;
        const otherTeamPlayers = gamePlayer.team === "blue" ? gamePlayerManager.YellowTeamPlayers : gamePlayerManager.BlueTeamPlayers;

        teamPlayers.forEach(teamPlayer => {
            teamPlayer.player.sendMessage(`§b${gamePlayer.name}§fが§eフラッグ§fをとりました！`);
            if(teamPlayer.id === gamePlayer.id) {
                gamePlayer.player.sendMessage('攻撃されずにもちかえろう！');
            }
            else {
                teamPlayer.player.sendMessage(`§b${teamPlayer.name}§fが攻撃されないよう守ろう！`);
            }
        });
        otherTeamPlayers.forEach(teamPlayer => {
            teamPlayer.player.sendMessage(`§b${gamePlayer.name}§fが§eフラッグ§fをとりました！攻撃して奪い返そう！`);
        });
    }

    onDamagedDropFlag(gamePlayer) {
        if(!gamePlayer.hasFlag) return;
        gamePlayer.hasFlag = false;
        this.flagHolder = null;
        broadcastChat(`§b${gamePlayer.name}§fが§eフラッグ§fを落とした！`);

        gamePlayer.player.dimension.setBlockType(gamePlayer.player.location, "edu:flag");

        // インベントリからedu:flagを削除
        const container = gamePlayer.player.getComponent("minecraft:inventory").container
        const flag = new ItemStack("edu:flag", 1);
        const slot = container.find(flag);
        if(slot !== undefined) {
            container.setItem(slot, null);
        }
        
    }
}

export const flagManager = new FlagManager();