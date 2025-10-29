import { system } from "@minecraft/server";
import { flagManager } from "../managers/flagManager";

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
            if(block && block.isSolid && block.typeId !== gamePlayer.teamColorBlockTypeId) {
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
        const players = gamePlayer.player.dimension.getPlayers();

        for (const p of players) {
            if (p.id === gamePlayer.player.id) continue; // 自分は除外

            const victimGamePlayer = gamePlayerManager.gamePlayers.get(p.id);
            if (!victimGamePlayer) continue;

            // 同じチームならスキップ
            if (
                (gamePlayerManager.BlueTeamPlayers.has(gamePlayer) && gamePlayerManager.BlueTeamPlayers.has(victimGamePlayer)) ||
                (gamePlayerManager.YellowTeamPlayers.has(gamePlayer) && gamePlayerManager.YellowTeamPlayers.has(victimGamePlayer)) ||
                victimGamePlayer.isRespawning   // リスポーン中も除外
            ) continue;

            // 命中距離判定
            const victimPos = p.location;
            const dx = victimPos.x - position.x;
            const dy = victimPos.y - position.y;
            const dz = victimPos.z - position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < 1.2) { // 命中判定距離
                flagManager.onDamagedDropFlag(p);
                this.onHitEnemy(p, gamePlayer);
                break;
            }
        }
    }

    /** 命中時処理（ダメージ、ノックバックなど） */
    onHitEnemy(victim, attackerGamePlayer) {
        const dir = attackerGamePlayer.player.getViewDirection();
        const knockbackVec = new Vector(dir.x * this.knockback, 0.3, dir.z * this.knockback);

        victim.applyKnockback(knockbackVec.x, knockbackVec.z, this.knockback, 0.3);
        victim.applyDamage(this.damage);

        attackerGamePlayer.player.sendMessage(`🎯 ${victim.name} に命中！`);
        victim.sendMessage(`💥 ${attackerGamePlayer.name} の攻撃を受けた！`);
    }

    
}

export const inkGun = new InkGun(
    {
        knockback: 1,
        range: 7,
        consumeInkAmount: 10,
        damage: 5
    }
);