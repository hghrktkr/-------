import { GameMode, system } from "@minecraft/server";
import { TitleToPlayer } from "../utils/helpers";
import { playerSpawnPosition } from "../configs/playerConfig";
import { scoreWeight } from "../configs/scoreConfig";

export class GamePlayer {
    constructor(player) {
        this.player = player;
        this.id = player.id;
        this.name = player.name;

        // 状態
        this.team = null;               // チーム←TeamManager
        this.teamColorBlockType = null; // チームのブロックの色
        this.isAlive = true;
        this.isInInk = false;           // 自チームのインクの上にいるか
        this.isRespawning = false;      //  復活中か

        // 個人スコア
        this.paintBlockCount = 0;
        this.killCount = 0;
        this.deathCount = 0;
        this.totalScore = 0;

        // 一時的な状態
        this.lastLocation = player.location;
        this.cooldowns = {};

        // 初期設定
        this.onSpawn();
    }

    onSpawn() {
        this.player.setSpawnPoint(playerSpawnPosition.spawnPoint, playerSpawnPosition.spawnDimension);
        this.player.setGameMode(GameMode.Adventure);
    }


    onDeath() {
        this.isAlive = false;
        this.deathCount++;
        this.respawn();
    }

    respawn() {
        this.isRespawning = true;
        if(this.player?.isValid) {
            this.player.runCommand(`inputpermission set @s movement disabled`);
        }

        let count = 3;
        const interval = system.runInterval(() => {
            if(count <= 0) {
                system.clearRun(interval);
                return;
            }

            TitleToPlayer(this.player,"リスポーン中・・・", count);
            count--;
        }, 20);

        system.runTimeout(() => {
            this.isAlive = true;
            this.isRespawning = false;
            this.player.runCommand(`inputpermission set @s movement enabled`);

            this.player.runCommand("playsound random.orb @s");
            this.player.runCommand("particle minecraft:totem_particle ~ ~1 ~");
            TitleToPlayer(this.player, "§aスタート！");
        }, 20 * 3);
    }
    
    /** 足元のブロックの種類が自チームのインクの色か確認 */
    checkInInk() {
        const block = this.player.dimension.getBlockBelow(this.player.location);
        this.isInInk = block?.typeId === this.teamColorBlockType;
    }


    score() {
        const {paintScoreWeight, killScoreWeight, deathPenaltyWeight} = scoreWeight;
        const paintScore = this.paintBlockCount * paintScoreWeight;
        const killScore = this.killCount * killScoreWeight;
        const deathPenalty = this.deathCount * deathPenaltyWeight;
        this.totalScore = paintScore + killScore + deathPenalty;

        return {paintScore, killScore, deathPenalty, totalScore: this.totalScore};
    }
}