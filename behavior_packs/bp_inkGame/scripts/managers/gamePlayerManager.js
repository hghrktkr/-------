import { GamePlayer } from "../classes/gamePlayer";
import { EquipmentSlot, GameMode, ItemLockMode, ItemStack } from "@minecraft/server";
import { teamConfig } from "../configs/playerConfig";
import { scoreWeight } from "../configs/scoreConfig";

class GamePlayerManager {

    constructor() {
        this.gamePlayers = new Map();
        this.BlueTeamPlayers = new Set();
        this.YellowTeamPlayers = new Set();
        this.spectators = new Set();
        this.deathScore = {
            blue: 0,
            yellow: 0
        };
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
            this.deathScore[gamePlayer.team]++;
            console.log(`Player ${gamePlayer.name} has died.`);
        }
    }

    getDeathScore() {
        return {
            blue: this.deathScore.blue * scoreWeight.deathPenaltyWeight,
            yellow: this.deathScore.yellow * scoreWeight.deathPenaltyWeight
        };
    }

    checkPlayerGameMode() {
        this.gamePlayers.forEach((gamePlayer) => {
            if(this.spectators.has(gamePlayer) && gamePlayer.player.gameMode !== GameMode.Spectator) {
                gamePlayer.player.setGameMode(GameMode.Spectator);
            }
            else if(gamePlayer.player.gameMode !== GameMode.Adventure) {
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

        gamePlayer.clearEquipments();
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

        gamePlayer.clearEquipments();
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
        const container = gamePlayer.player.getComponent("minecraft:inventory").container;
        const inkGun = new ItemStack("edu:ink_gun", 1);
        const slot = container.find(inkGun);

        if(slot !== undefined) return;  // 既に持っている場合は飛ばす

        inkGun.name = "インクガン";
        inkGun.keepOnDeath = true;
        inkGun.lockMode = ItemLockMode.inventory;
        inkGun.setCanDestroy(["edu:flag"]);
        container.addItem(inkGun);
        console.log(`Gave Ink Gun to player ${gamePlayer.name}.`);
    }

    teleportTeamPlayers() {
        this.BlueTeamPlayers.forEach(blueTeamPlayer => {
            blueTeamPlayer.player.teleport(teamConfig.teamBlue.teamSpawnPos);
        });
        this.YellowTeamPlayers.forEach(yellowTeamPlayer => {
            yellowTeamPlayer.player.teleport(teamConfig.teamYellow.teamSpawnPos);
        });

        this.setSpectators();
        if(this.spectators.size === 0) return;
        this.spectators.forEach(spectator => {
            spectator.player.teleport(teamConfig.spectator.spawnPos);
        });
    }

    setSpectators() {
        for(const [, gamePlayer] of this.gamePlayers) {
            if(!this.BlueTeamPlayers.has(gamePlayer) && !this.YellowTeamPlayers.has(gamePlayer)) {
                this.spectators.add(gamePlayer);
            }
        }
    }

    setCanShootTrue() {
        this.gamePlayers.forEach(gamePlayer => gamePlayer.canShoot = true);
    }

    setCanShootFalse() {
        this.gamePlayers.forEach(gamePlayer => gamePlayer.canShoot = false);
    }

    reset() {
        this.BlueTeamPlayers = new Set();
        this.YellowTeamPlayers = new Set();
        this.spectators = new Set();
        this.deathScore = {
            blue: 0,
            yellow: 0
        };
        for(let gamePlayer of this.gamePlayers.values()) {
            gamePlayer.clearEquipments();
        }
    }

    resetPlayer(gamePlayer) {
        if(!this.gamePlayers.has(gamePlayer.id)) return;

        if(this.BlueTeamPlayers.has(gamePlayer)) {
            this.BlueTeamPlayers.delete(gamePlayer);
        }
        else if(this.YellowTeamPlayers.has(gamePlayer)) {
            this.YellowTeamPlayers.delete(gamePlayer);
        }
        gamePlayer.clearEquipments();
    }


}

export const gamePlayerManager = new GamePlayerManager();