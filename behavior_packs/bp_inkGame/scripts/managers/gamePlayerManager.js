import { GamePlayer } from "../classes/gamePlayer";
import { EquipmentSlot, GameMode, ItemLockMode, ItemStack } from "@minecraft/server";
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

        this.equipPlayerBib(gamePlayer, "edu:bib_blue");
        this.givePlayerInkGun(gamePlayer);
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

        this.equipPlayerBib(gamePlayer, "edu:bib_yellow");
        this.givePlayerInkGun(gamePlayer);
    }

    equipPlayerBib(gamePlayer, bibItemId) {
        const bib = new ItemStack(bibItemId, 1);
        bib.keepOnDeath = true;
        bib.lockMode = ItemLockMode.slot;
        gamePlayer.player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Chest, bib);
    }

    givePlayerInkGun(gamePlayer) {
        const inkGun = new ItemStack("edu:ink_gun", 1);
        inkGun.name = "インクガン";
        inkGun.keepOnDeath = true;
        inkGun.lockMode = ItemLockMode.inventory;
        inkGun.setCanDestroy(["edu:flag"]);
        gamePlayer.player.getComponent("minecraft:inventory").container.addItem(inkGun);
        console.log(`Gave Ink Gun to player ${gamePlayer.name}.`);
    }

    teleportTeamPlayers() {
        this.BlueTeamPlayers.forEach(blueTeamPlayer => {
            blueTeamPlayer.player.teleport(teamConfig.teamBlue.teamSpawnPos);
        });
        this.YellowTeamPlayers.forEach(yellowTeamPlayer => {
            yellowTeamPlayer.player.teleport(teamConfig.teamYellow.teamSpawnPos);
        });
    }


}

export const gamePlayerManager = new GamePlayerManager();