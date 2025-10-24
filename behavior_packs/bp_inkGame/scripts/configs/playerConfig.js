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
    },
    teamYellow: {
        teamColor: "yellow",
        teamColorEntityType: "edu:falling_ink_yellow",
        teamColorBlockType: "edu:ink_yellow"
    }
}