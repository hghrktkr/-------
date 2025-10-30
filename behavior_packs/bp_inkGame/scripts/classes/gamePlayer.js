import { BlockVolume, EquipmentSlot, GameMode, ItemStack, system, world } from "@minecraft/server";
import { broadcastChat, TitleToPlayer } from "../utils/helpers";
import { playerSpawnPosition } from "../configs/playerConfig";
import { scoreWeight } from "../configs/scoreConfig";
import { gamePlayerManager } from "../managers/gamePlayerManager";
import LOCATION_UTILS from "../utils/locationUtils";
import { flagManager } from "../managers/flagManager";

/** プレイヤー情報 */
export class GamePlayer {
    constructor(player) {
        this.player = player;
        this.id = player.id;
        this.name = player.name;

        // 状態
        this.team = null;               // チーム←TeamManager
        this.teamColorEntityType = null; // チームのブロックの色のブロックエンティティ名
        this.teamColorBlockType = null; // チームのブロックの色のブロック名
        this.isAlive = true;
        this.isInInk = false;           // 自チームのインクの上にいるか
        this.isRespawning = false;      //  復活中か
        this.isSneaking = false;
        this.hasFlag = false;          // フラッグを持っているか
        
        // インク関連
        this.canShoot = false;        // インクを撃てるか
        this.currentInkAmount = 100;   // インクの量
        this.maxInkAmount = 100;    // インクの最大量
        this.reloadInkRate = 10;      // インクのリロード速度（1tickあたり）

        // 個人スコア
        this.deathCount = 0;

        // 一時的な状態
        this.lastLocation = player.location;
        this.cooldowns = {};

        // 初期設定
        this.onSpawn();
    }

    onSpawn() {
        const dimensionLocation = {
            dimension: world.getDimension(playerSpawnPosition.spawnDimension),
            x: playerSpawnPosition.spawnPoint.x,
            y: playerSpawnPosition.spawnPoint.y,
            z: playerSpawnPosition.spawnPoint.z
        }
        this.player.setSpawnPoint(dimensionLocation);
        this.player.setGameMode(GameMode.Adventure);
    }

    /** チームカラー、インクのタイプを設定 */
    setTeam(teamColor, entityType, blockType) {
        this.team = teamColor;
        this.teamColorEntityType = entityType;
        this.teamColorBlockType = blockType;
        console.log(`${this.name} has joined team ${this.team}`);
    }


    onDeath() {
        this.isAlive = false;
        this.canShoot = false;
        this.deathCount++;
        console.log(`${this.name} has died. Total deaths: ${this.deathCount}`);
        this.respawn();
    }

    respawn() {
        this.isRespawning = true;
        if(this.player?.isValid) {
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
            this.isRespawning = false;
            this.isAlive = true;
            this.canShoot = true;

            this.player.runCommand("playsound random.orb @s");
            this.player.runCommand("particle minecraft:totem_particle ~ ~1 ~");
            TitleToPlayer(this.player, "§aスタート！");
        }, 20 * 3);
    }

    getInkRatio() {
        return this.currentInkAmount / this.maxInkAmount;
    }

    /** 毎ティック更新処理 */
    updatePerTick() {
        this.checkIsSneaking();
        this.checkInInk();
        this.checkOutOfInk();
        this.checkHasFlag();
        this.updateCurrentInkAmount();
        this.sprintSpeedMultiplier();
        this.showInkStatus();

        // console.log(`[GamePlayer] ${this.name} - Ink: ${this.currentInkAmount.toFixed(2)}/${this.maxInkAmount}, InInk: ${this.isInInk}, Sneaking: ${this.isSneaking}`);
        // console.log(`[GamePlayer] ${this.name} - Effects: ${JSON.stringify(this.player.getEffects())}`);
    }

    checkIsSneaking() {
        if(!this.isAlive) return;
        if(this.player.isSneaking) {
            this.isSneaking = true;
        } else {
            this.isSneaking = false;
        }
    }
    
    /** 足元のブロックの種類が自チームのインクの色か確認 */
    checkInInk() {
        const playerPos = LOCATION_UTILS.toBlockPos(this.player.location);
        const block = this.player.dimension.getBlock(playerPos);
        this.isInInk = block?.typeId === this.teamColorBlockType;
    }

    checkHasFlag() {
        // const container = this.player.getComponent("minecraft:inventory").container;
        // const flag = new ItemStack("edu:flag", 1);
        // const slot = container.find(flag);
        // this.hasFlag = slot !== undefined;
        if(this.hasFlag) {
            const loc = {
                x: this.player.location.x,
                y: this.player.location.y + 1.5,
                z: this.player.location.z
            }
            this.player.spawnParticle("minecraft:magic_critical_hit_emitter", loc);
        }
    }

    showInkStatus() {
        const inkRatio = this.getInkRatio();
        const barLength = 5; // バーの長さ
        const filled = Math.round(inkRatio * barLength);
        const empty = barLength - filled;

        // 視覚的なゲージ表示（青い部分と灰色部分）
        const bar = "§b" + "\ue102".repeat(filled) + "§7" + "".repeat(empty);

        const percent = Math.floor(inkRatio * 100);
        const text = `インク: ${bar} §f${percent}%`;

        try {
            this.player.onScreenDisplay.setActionBar(text);
        } catch (e) {
            console.warn(`[InkBar] ${this.name} に表示失敗: ${e}`);
        }
    }

    updateCurrentInkAmount() {
        let currentReloadInkRate = this.reloadInkRate;

        if(this.isSneaking && this.isInInk) {
            currentReloadInkRate *= 2; // スニーク中はリロード速度2倍
        }
        else if(this.isSneaking && !this.isInInk) {
            currentReloadInkRate *= 0.5; // スニーク中でインク外はリロード速度半分
        }
        else if(!this.isSneaking && this.isInInk) {
            currentReloadInkRate *= 1.0; // インク内はリロード速度1.0倍
        }
        else {
            currentReloadInkRate = 0; // どれでもない場合は回復しない
        }

        this.currentInkAmount = Math.min(this.currentInkAmount + currentReloadInkRate, this.maxInkAmount);
    }

    sprintSpeedMultiplier() {
        // 旗がある場合は最優先で速度低下
        if(this.hasFlag) {
            if(this.isSpeedUp) {
                this.isSpeedUp = false;
            }
            this.player.addEffect("slowness", 40, { amplifier: 1, showParticles: false });
            return;
        }
        if(this.isInInk) {
            this.player.addEffect("speed", 40, { amplifier: 3, showParticles: false });
            this.player.addEffect("jump_boost", 40, { amplifier: 3, showParticles: false });
        }
    }

    clearEquipments() {
        this.player.getComponent("minecraft:inventory").container.clearAll();
        this.player.getComponent("minecraft:equippable").setEquipment(EquipmentSlot.Chest);
    }


    consumeInk(inkAmount) {
        if(!this.canShoot) return false;
        if(this.currentInkAmount >= inkAmount) {
            this.currentInkAmount -= inkAmount;
            return true;
        } else {
            return false;
        }
    }

    cooldown() {
        this.canShoot = false;
        this.player.sendMessage('§bクールダウン中・・・インクがふえるのをまとう');
        const intervalId = system.runInterval(() => {
            if(this.currentInkAmount > 50) {
                system.clearRun(intervalId);
                this.canShoot = true;
                this.player.sendMessage("リロード完了！");
                return;
            }
        }, 10);
    }

}