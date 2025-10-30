import { system } from "@minecraft/server";
import { flagManager } from "../managers/flagManager";
import { gamePlayerManager } from "../managers/gamePlayerManager";
import LOCATION_UTILS from "../utils/locationUtils";

class InkGun {
    constructor(config = {}) {
        this.knockback = config.knockback;
        this.range = config.range;
        this.consumeInkAmount = config.consumeInkAmount;
        this.damage = config.damage;
        this.isShooting = false;
    }

    shoot(gamePlayer) {
        if(!gamePlayer.canShoot) return;
        if(this.isShooting) return; // 連射防止
        this.isShooting = true;

        // インクを消費できたら射撃処理を行う
        console.log(`[InkGun] ${gamePlayer.name} is attempting to shoot ink gun. Current ink: ${gamePlayer.currentInkAmount}`);
        const inkConsumed = gamePlayer.consumeInk(this.consumeInkAmount);
        if(!inkConsumed) {
            gamePlayer.player.sendMessage("インクがたりない！リロード中...");
            gamePlayer.cooldown();
        }

        // 射撃処理
        const dir = gamePlayer.player.getViewDirection();
        const playerPos = gamePlayer.player.location;
        const startPos = {
            x: playerPos.x + dir.x + 0.5,
            y: playerPos.y + Math.max(0, dir.y) + 0.7,    // 地面より下にスポーンしないように調整
            z: playerPos.z + dir.z
        }
        console.log(`[InkGun] ${gamePlayer.name} is shooting ink gun from (${startPos.x.toFixed(2)}, ${startPos.y.toFixed(2)}, ${startPos.z.toFixed(2)}) in direction (${dir.x.toFixed(2)}, ${dir.y.toFixed(2)}, ${dir.z.toFixed(2)})`);
        gamePlayer.player.playSound("edu.gun_shoot", gamePlayer.player.location);

        let counter = 0;
        const intervalId = system.runInterval(() => {
            if(counter >= this.range) {
                system.clearRun(intervalId);
                this.isShooting = false;
                return;
            }

            counter++;
            const spawnPos = {
                x: startPos.x + dir.x * counter,
                y: startPos.y + Math.max(0, dir.y) * counter,
                z: startPos.z + dir.z * counter
            }

            const block = gamePlayer.player.dimension.getBlock(spawnPos);
            if(block && block.typeId !== "minecraft:air") {
                console.log(`[InkGun] Bullet hit a solid block at (${spawnPos.x.toFixed(2)}, ${spawnPos.y.toFixed(2)}, ${spawnPos.z.toFixed(2)})`);
                system.clearRun(intervalId);
                this.isShooting = false;
                return;
            }

            gamePlayer.player.dimension.spawnEntity(gamePlayer.teamColorEntityType, spawnPos);

            // 敵プレイヤーに当たったかチェック
            this.checkHitEnemy(gamePlayer, spawnPos);
            

        }, 1);
    }

    /** 敵プレイヤーへの命中判定 */
    checkHitEnemy(gamePlayer, position) {
        if(!gamePlayerManager.gamePlayers.has(gamePlayer.id)) {
            return;
        }
        
        const offsetPos = {
            x: position.x,
            y: position.y - 0.7,    // shoot()で調整している分を戻す
            z: position.z
        }
        const victimTeamPlayers = gamePlayer.team === "blue" ? gamePlayerManager.YellowTeamPlayers : gamePlayerManager.BlueTeamPlayers;

        const players = gamePlayer.player.dimension.getPlayers( {
            location: offsetPos,
            maxDistance: 1.4
        });

        if(players.length === 0) {
            return;
        }

        const victim = gamePlayerManager.gamePlayers.get(players[0].id);    // インスタンスを取得
        if(victimTeamPlayers.has(victim)) {
            this.onHitEnemy(victim, gamePlayer);
        }

    }

    /** 命中時処理（ダメージ、ノックバックなど） */
    onHitEnemy(victim, attackerGamePlayer) {
        const dir = attackerGamePlayer.player.getViewDirection();

        victim.player.applyKnockback({x: dir.x, z: dir.z}, this.knockback);
        victim.player.applyDamage(this.damage);
        flagManager.onDamagedDropFlag(victim);

        attackerGamePlayer.player.sendMessage(`🎯 ${victim.name} に命中！`);
        victim.player.sendMessage(`💥 ${attackerGamePlayer.name} の攻撃を受けた！`);
    }

    
}

export const inkGun = new InkGun(
    {
        knockback: 0.4,
        range: 7,
        consumeInkAmount: 10,
        damage: 20
    }
);