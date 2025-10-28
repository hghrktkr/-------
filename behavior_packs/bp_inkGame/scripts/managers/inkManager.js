import { world } from "@minecraft/server";
import { stageConfig } from "../configs/stageConfig";
import { scoreWeight } from "../configs/scoreConfig";

class InkManager {
    constructor() {
        this.checkArea = {
            dimension: stageConfig.dimension,
            from: stageConfig.from,
            to: stageConfig.to
        };
        this.inkCount = {
            blue: 0,
            yellow: 0
        };
    }

    updateInkCount() {
        let blue = 0;
        let yellow = 0;
        const {dimension, from, to} = this.checkArea;
        const dim = world.getDimension(dimension);

        for(let x = from.x; x <= to.x; x++) {
            for(let y = from.y; y <= to.y; y++) {
                for(let z = from.z; z <= to.z; z++) {
                    const block = dim.getBlock({x, y, z});
                    if(!block) continue;

                    switch (block.typeId) {
                        case "edu:ink_blue":
                            blue++;
                            break;
                        
                        case "edu:ink_yellow":
                            yellow++;
                            break;

                        default:
                            break;
                    }
                }
            }
        }

        this.inkCount.blue = blue;
        this.inkCount.yellow = yellow;
    }

    getInkCount() {
        return {
            blue: this.inkCount.blue,
            yellow: this.inkCount.yellow
        };
    }

    getInkScore() {
        return {
            blue: this.inkCount.blue * scoreWeight.inkScoreWeight,
            yellow: this.inkCount.yellow * scoreWeight.inkScoreWeight
        };
    }
}

export const inkManager = new InkManager();