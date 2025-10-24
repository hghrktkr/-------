import { system } from "@minecraft/server";

class InkGun {
    constructor() {
        this.isShooting = false;
        this.knockback = 1;
        this.range = 5;
        this.consumeInkAmount = 2;
    }

    shoot(gamePlayer) {
        if(!gamePlayer.canShoot) return;
        if(this.isShooting) return; // 連射防止
        this.isShooting = true;

        // インクを消費できたら射撃処理を行う
        const inkConsumed = gamePlayer.consumeInk(this.consumeInkAmount);
        if(!inkConsumed) return;

        // 射撃処理
        const dir = gamePlayer.player.getViewDirection();
        const playerPos = gamePlayer.player.location;
        const startPos = {
            x: playerPos.x + dir.x,
            y: playerPos.y + dir.y,
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
                y: startPos.y + dir.y * counter,
                z: startPos.z + dir.z * counter
            }
            gamePlayer.player.dimension.spawnEntity(gamePlayer.teamColorEntityType, spawnPos);

        }, 1);

        // gamePlayerのインクが0になったらcooldownを開始
        if(gamePlayer.currentInkAmount <= 0) {
            gamePlayer.player.sendMessage("インクが切れた！リロード中...");
            gamePlayer.cooldown();
        }
    }
}

export const inkGun = new InkGun();