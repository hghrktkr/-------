class InkGun {
    constructor() {
        this.knockback = 1;
        this.range = 5;
        this.consumeInkAmount = 2;
    }

    shoot(gamePlayer) {
        if(!gamePlayer.canShoot) return;

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

        let counter = 0;
        const intervalId = setInterval(() => {
            if(counter >= this.range) {
                clearInterval(intervalId);
                return;
            }

            counter++;
            const spawnPos = {
                x: startPos.x + dir.x * counter,
                y: startPos.y + dir.y * counter,
                z: startPos.z + dir.z * counter
            }
            gamePlayer.player.dimension.spawnEntity(gamePlayer.teamColorEntityType, spawnPos);

        }, 20 * 0.5);

        // gamePlayerのインクが0になったらcooldownを開始
        if(gamePlayer.currentInkAmount <= 0) {
            gamePlayer.player.sendMessage("インクが切れた！リロード中...");
            gamePlayer.cooldown();
        }
    }
}