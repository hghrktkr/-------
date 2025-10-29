// プレイヤーに関する設定ファイル

/** 初期スポーン位置、ディメンション */
export const playerSpawnPosition = {
    spawnPoint: { x: 0, y: 0, z: 40 },
    spawnDimension: "overworld"
};

/** チームごとの色・ブロックの設定 */
export const teamConfig = {
    teamBlue: {
        teamColor: "blue",
        teamColorEntityType: "edu:falling_ink_blue",
        teamColorBlockType: "edu:ink_blue",
        teamAreaStart: {x: -48, y: 8, z: -2},
        teamAreaEnd: {x: -44, y: 8, z: 2},
        teamDimension: "overworld",
        teamSpawnPos: {x: -46, y: 8, z: 0}
    },
    teamYellow: {
        teamColor: "yellow",
        teamColorEntityType: "edu:falling_ink_yellow",
        teamColorBlockType: "edu:ink_yellow",
        teamAreaStart: {x: 44, y: 8, z: -2},
        teamAreaEnd: {x: 48, y: 8, z: 2},
        teamDimension: "overworld",
        teamSpawnPos: {x: 46, y: 8, z: 0}
    },
    spectator: {
        spawnPos: {x: 0, y: 10, z: 0 }
    }
}