import { Difficulty, GameRules, system, world } from "@minecraft/server";
import { flagConfig } from "../configs/flagConfig";
import { broadcastTitle } from "../utils/helpers";
import { flagManager } from "./flagManager";
import { gamePlayerManager } from "./gamePlayerManager";
import { inkManager } from "./inkManager";
import { scoreWeight } from "../configs/scoreConfig";
import { MessageFormData } from "@minecraft/server-ui";
import { gameRuleConfig } from "../configs/gameRuleConfig";
import { playerSpawnPosition } from "../configs/playerConfig";

class GameManager {
    constructor() {
        this.gameState = "PREPARE";  // PREPARE, PLAYING, END, RESET
        this.timer = 0;
        this.maxGameTime = 180;
        this.flagSpawnTime = flagConfig.spawnTime;
        this.tickInterval = null;

        this.inkScores = null;
        this.deathScores = null;
        this.blueScore = 0;
        this.yellowScore = 0;
    }

    async startGame() {
        if(this.gameState !== "PREPARE") return;

        this.timer = 0;
        gamePlayerManager.teleportTeamPlayers();
        
        for(let i = 3; i >= 0; i--) {
            if(i > 0) {
                broadcastTitle(`§c${i}`);
                for( let gamePlayer of gamePlayerManager.gamePlayers.values()) {
                    gamePlayer.player.playSound("edu.beep", gamePlayer.player.locaation);
                }
                await system.waitTicks(20);
            }
            else {
                broadcastTitle('§cスタート！！', 'インクをぬりながらすすもう！');
                this.gameState = "PLAYING";
                gamePlayerManager.setCanShootTrue();
                for( let gamePlayer of gamePlayerManager.gamePlayers.values()) {
                    gamePlayer.player.playSound("edu.gong_start", gamePlayer.player.locaation);
                }
                system.waitTicks(20);
                for( let gamePlayer of gamePlayerManager.gamePlayers.values()) {
                    gamePlayer.player.playMusic("edu.game_bgm",{"loop": true});
                }
                this.tickInterval = system.runInterval(() => this.handleTick(), 20);
            }
        }
    }

    handleTick() {
        if(this.gameState !== "PLAYING") {
            if(this.tickInterval) {
                system.clearRun(this.tickInterval);
                this.tickInterval = null;
            }
            return;
        }

        this.timer++;

        if(this.timer === this.flagSpawnTime) {
            flagManager.spawnFlag();
            broadcastTitle('§cフラッグしゅつげん！！', '見つけてもちかえろう！');
        }

        if(this.timer >= this.maxGameTime) {
            this.gameState = 'END';
            this.endGame();
        }

        if(flagManager.flagHolder && flagManager.checkFlagHolderInOwnArea()) {
            const flagHoldTeam = flagManager.flagHolder.team === "blue" ? "blue" : "yellow";
            this.gameState = 'END';
            this.endGame(flagHoldTeam);
        }

        if(this.timer !== 0 && this.timer !== this.maxGameTime && this.timer % 60 === 0) {
            inkManager.updateInkCount();
            // 全体へ表示
            const currentInkCounts = inkManager.getInkCount();
            broadcastTitle(`§b青チーム${currentInkCounts.blue}§f : §6黄チーム${currentInkCounts.yellow}`);
        }

        flagManager.checkFlagHolder();
        flagManager.checkBlockOnFlag();

    }

    endGame(flagHoldTeam = null) {
        if(this.gameState !== 'END') return;
        for( let gamePlayer of gamePlayerManager.gamePlayers.values()) {
            gamePlayer.player.stopMusic();
            gamePlayer.player.playSound("edu.gong", gamePlayer.player.location);
        }
        system.clearRun(this.tickInterval);
        this.timer = 0;
        gamePlayerManager.setCanShootFalse();
        gamePlayerManager.teleportTeamPlayers();
        world.getDimension(playerSpawnPosition.spawnDimension).runCommand(`camera @a set minecraft:free pos 0 45 0 facing 0 24 0`); // カメラを俯瞰に
        
        broadcastTitle('しゅうりょう！！','結果集計中・・・');
        
        // 集計
        this.calculateScores(flagHoldTeam);
        
        // 結果表示
        system.runTimeout(() => {
            this.showResults(flagHoldTeam);
            this.gameState = "RESET";
            this.reset();
        }, 20 * 5);
    }

    reset() {
        if(this.gameState !== "RESET") return;
        world.getDimension(playerSpawnPosition.spawnDimension).runCommand(`camera @a clear`);
        gamePlayerManager.reset();
        inkManager.reset();
        flagManager.reset();
        this.inkScores = null;
        this.deathScores = null;
        this.blueScore = 0;
        this.yellowScore = 0;

        this.gameState = "PREPARE";
        gamePlayerManager.gamePlayers.forEach(gamePlayer => {
            gamePlayer.player.teleport(playerSpawnPosition.spawnPoint);
        })
    }

    calculateScores(flagHoldTeam) {
        inkManager.updateInkCount()
        this.inkScores = inkManager.getInkScore();
        this.deathScores = gamePlayerManager.getDeathScore();
        
        this.blueScore = this.inkScores.blue + (flagHoldTeam === "blue" ? scoreWeight.flagScoreWeight : 0) + this.deathScores.blue;
        this.yellowScore = this.inkScores.yellow + (flagHoldTeam === "yellow" ? scoreWeight.flagScoreWeight : 0) + this.deathScores.yellow;
    }

    async showResults(flagHoldTeam) {

        const coin = "\ue102";
        const agent = "\ue103";

        const title = `${agent} しあいけっか ${agent}`;
        const body = [
            `§9青チーム: §f${this.blueScore}`,
            `§6黄チーム: §f${this.yellowScore}`,
            "",
            this.blueScore > this.yellowScore
                ? `${agent} §9青チームの勝利！§f ${agent}`
                : this.yellowScore > this.blueScore
                ? `${agent} §6黄チームの勝利！§f ${agent}`
                : `${agent} 引き分け！ ${agent}`,
            "",
            "── 内訳 ──",
            "",
            ` ${coin} フラッグボーナス: ${
                flagHoldTeam === null
                ? "なし"
                : flagHoldTeam === "blue"
                ? "青チーム"
                : "黄チーム"
            }`,
            `${coin} ぬりスコア: 青 ${this.inkScores.blue} == 黄 ${this.inkScores.yellow}`,
            `${coin} 死亡ペナルティ: 青 ${this.deathScores.blue} == 黄 ${this.deathScores.yellow}`,
        ].join("\n");

        for (const player of world.getPlayers()) {
            try {
                const form = new MessageFormData()
                .title(title)
                .body(body)
                .button1("OK")
                .button2("とじる");

                // フォーム表示
                system.run(() => {
                    form.show(player);
                })

            } catch (e) {
                console.warn(`Form failed for ${player.name}: ${e}`);
            }
        }
    }

    enforceGameRule() {
        for(const [gameRule, value] of Object.entries(gameRuleConfig)) {
            if(GameRules[gameRule] && GameRules[gameRule] !== value) {
                GameRules[gameRule] = value;
            }
        }

        world.setDifficulty(Difficulty.Peaceful);
    }
}

export const gameManager = new GameManager();