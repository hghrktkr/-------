import { GamePlayer } from "../classes/gamePlayer";
import { GameMode } from "@minecraft/server";

class GamePlayerManager {

    constructor() {
        this.gamePlayers = new Map();
    }

    

    addGamePlayer(player) {
        if(!this.gamePlayers.has(player.id)) {
            const gamePlayer = new GamePlayer(player);
            this.gamePlayers.set(player.id, gamePlayer);
            console.log(`Added GamePlayer: ${player.name} (ID: ${player.id})`);
        }
    }

    checkDeadPlayer(deadEntityId) {
        const gamePlayer = this.gamePlayers.get(deadEntityId);
        if(gamePlayer) {
            gamePlayer.onDeath();
            console.log(`Player ${gamePlayer.name} has died.`);
        }
    }

    checkPlayerGameMode() {
        this.gamePlayers.forEach((gamePlayer) => {
            if(gamePlayer.player.gameMode !== GameMode.Adventure) {
                gamePlayer.player.setGameMode(GameMode.Adventure);
                // console.log(`Reset game mode for player ${gamePlayer.name} to Adventure.`);
            }
        });
    }

}

export const gamePlayerManager = new GamePlayerManager();