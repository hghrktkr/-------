// プレイヤーに関する設定ファイル

/** 初期スポーン位置、ディメンション */
export const playerSpawnPosition = {
    spawnPoint: { x: 0, y: 66, z: 0 },
    spawnDimension: "overworld"
};

/** チームごとの色・ブロックの設定 */
export const teamConfig = {
    teamBlue: {
        teamColor: "blue",
        teamColorEntityType: "edu:falling_ink_blue",
        teamColorBlockType: "edu:ink_blue",
        teamAreaStart: {x: -30, y: 0, z: -30},
        teamAreaEnd: {x: -30, y: 0, z: 0},
        teamSpawnPos: {x: -30, y: 0, z: -15}
    },
    teamYellow: {
        teamColor: "yellow",
        teamColorEntityType: "edu:falling_ink_yellow",
        teamColorBlockType: "edu:ink_yellow",
        teamAreaStart: {x: 30, y: 0, z: -30},
        teamAreaEnd: {x: 30, y: 0, z: 0},
        teamSpawnPos: {x: 30, y: 0, z: -15}
    },
    spectator: {
        spawnPos: {x: 0, y: 0, z: 0 }
    }
}