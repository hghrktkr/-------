import { GamePlayer } from "../classes/gamePlayer";
import { GameMode, ItemStack } from "@minecraft/server";
import { teamConfig } from "../configs/playerConfig";

class GamePlayerManager {

    constructor() {
        this.gamePlayers = new Map();
        this.BlueTeamPlayers = new Set();
        this.YellowTeamPlayers = new Set();
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

    addBlueTeamPlayer(gamePlayer) {
        if(this.BlueTeamPlayers.has(gamePlayer)) return;
        if(this.YellowTeamPlayers.has(gamePlayer)) {
            this.YellowTeamPlayers.delete(gamePlayer);
            console.log(`Player ${gamePlayer.name} removed from Yellow Team.`);
        }

        this.BlueTeamPlayers.add(gamePlayer);
        console.log(`Player ${gamePlayer.name} added to Blue Team.`);
        gamePlayer.setTeam(teamConfig.teamBlue.teamColor, teamConfig.teamBlue.teamColorEntityType, teamConfig.teamBlue.teamColorBlockType);

        // edu:bib_blueを装備、解除不可にする
        const blueBib = new ItemStack("edu:bib_blue", 1)
                            .keepOnDeath = true
                            .lockMode = "slot";
        gamePlayer.player.getComponent("minecraft:equippable").setEquipment("chest", blueBib);
    }

    addYellowTeamPlayer(gamePlayer) {
        if(this.YellowTeamPlayers.has(gamePlayer)) return;
        if(this.BlueTeamPlayers.has(gamePlayer)) {
            this.BlueTeamPlayers.delete(gamePlayer);
            console.log(`Player ${gamePlayer.name} removed from Blue Team.`);
        }

        this.YellowTeamPlayers.add(gamePlayer);
        console.log(`Player ${gamePlayer.name} added to Yellow Team.`);
        gamePlayer.setTeam(teamConfig.teamYellow.teamColor, teamConfig.teamYellow.teamColorEntityType, teamConfig.teamYellow.teamColorBlockType);
        
        // edu:bib_yellowを装備、解除不可にする
        const yellowBib = new ItemStack("edu:bib_yellow", 1)
                            .keepOnDeath = true
                            .lockMode = "slot";
        gamePlayer.player.getComponent("minecraft:equippable").setEquipment("chest", yellowBib);
    }


}

export const gamePlayerManager = new GamePlayerManager();