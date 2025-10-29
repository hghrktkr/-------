import { system, world } from "@minecraft/server";
import { flagConfig } from "../configs/flagConfig";
import { broadcastTitle } from "../utils/helpers";
import { flagManager } from "./flagManager";
import { gamePlayerManager } from "./gamePlayerManager";
import { inkManager } from "./inkManager";
import { scoreWeight } from "../configs/scoreConfig";
import { MessageFormData } from "@minecraft/server-ui";

class GameManager {
    constructor() {
        this.gameState = "PREPARE";  // PREPARE, PLAYING, END
        this.timer = 0;
        this.maxGameTime = 180;
        this.flagSpawnTime = flagConfig.spawnTime;
        this.tickInterval = null;

        this.inkScores = null;
        this.deathScores = null;
        this.blueScore = 0;
        this.yellowScore = 0;
    }

    prepareGame() {
        // 各チームへの振り分け

    }

    async startGame() {
        if(this.gameState !== "PREPARE") return;

        this.timer = 0;
        gamePlayerManager.teleportTeamPlayers();
        
        for(let i = 3; i >= 0; i--) {
            if(i > 0) {
                broadcastTitle(`§c${i}`);
                await system.waitTicks(20);
            }
            else {
                broadcastTitle('§cスタート！！', 'インクをぬりながらすすもう！');
                this.gameState = "PLAYING";
                gamePlayerManager.setCanShootTrue();
                this.tickInterval = system.runInterval(() => this.checkPerSecond(), 20);
            }
        }
    }

    checkPerSecond() {
        if(this.gameState !== "PLAYING") {
            system.clearRun(this.tickInterval);
            this.gameState = "PREPARE";
            return;
        }

        this.timer++;

        if(this.timer === this.flagSpawnTime) {
            flagManager.spawnFlag();
            broadcastTitle('§cフラッグしゅつげん！！', '見つけてもちかえろう！');
        }

        if(this.timer >= this.maxGameTime) {
            this.gameState = 'END';
            this.endGame('timeUp');
        }

        if(flagManager.checkFlagHolderInOwnArea()) {
            const flagHoldTeam = flagManager.flagHolder.team === "blue" ? "blue" : "yellow";
            this.gameState = 'END';
            this.endGame('flag', flagHoldTeam);
        }

        if(this.timer % 100 === 0) {
            inkManager.updateInkCount();
            // 全体へ表示
            const currentInkCounts = inkManager.getInkCount();
            broadcastTitle(`§b青${currentInkCounts.blue}§f : §6黄${currentInkCounts.yellow}`);
        }

        flagManager.checkFlagHolder();

    }

    endGame(endReason, flagHoldTeam = null) {
        if(this.gameState !== 'END') return;

        system.clearRun(this.tickInterval);
        this.timer = 0;
        gamePlayerManager.teleportTeamPlayers();
        gamePlayerManager.setCanShootFalse();

        broadcastTitle('しゅうりょう！！','結果集計中・・・');

        // 集計
        this.calculateScores(flagHoldTeam);

        // 結果表示
        this.showResults(flagHoldTeam);
    }

    calculateScores(flagHoldTeam) {
        inkManager.updateInkCount()
        this.inkScores = inkManager.getInkScore();
        this.deathScores = gamePlayerManager.getDeathScore();
        
        this.blueScore = inkScores.blue + (flagHoldTeam === "blue" ? scoreWeight.flagScoreWeight : 0) + deathScores.blue;
        this.yellowScore = inkScores.yellow + (flagHoldTeam === "yellow" ? scoreWeight.flagScoreWeight : 0) + deathScores.yellow;
    }

    async showResults(flagHoldTeam) {
        const title = "🎉 試合結果 🎉";
        const body = [
        `§9青チーム: §f${this.blueScore}`,
        `§6黄チーム: §f${this.yellowScore}`,
        "",
        this.blueScore > this.yellowScore
            ? "🏆 §9青チームの勝利！"
            : this.yellowScore > this.blueScore
            ? "🏆 §6黄チームの勝利！"
            : "🤝 引き分け！",
        "",
        "── 内訳 ──",
        "",
        `フラッグボーナス: ${
            flagHoldTeam === null
            ? "なし"
            : flagHoldTeam === "blue"
            ? "青チーム"
            : "黄チーム"
        }`,
        `ぬりスコア: 青 ${this.inkScores.blue} == 黄 ${this.inkScores.yellow}`,
        `死亡ペナルティ: 青 ${this.deathScores.blue} == 黄 ${this.deathScores.yellow}`,
        ].join("\n");

        for (const player of world.getPlayers()) {
        await new MessageFormData()
            .title(title)
            .body(body)
            .button1("OK")
            .button2("閉じる")
            .show(player);
        }
    }
}

export const gameManager = new GameManager();