export const npcConfigs = {
    teamSelect: {
        id: "npc_team_select",
        entityId: "edu:game_master",
        nameTag: "チームわけかかり",
        dimension: "overworld",
        position: { x: 2, y: 0, z: 0 },
        title: "チームをえらぼう！",
        body: "さんかするチームをえらんでください。",
        options: [
            { label: "§b青チーム", action: "join_blue" },
            { label: "§6黄チーム", action: "join_yellow" },
            { label: "かんきゃく", action: "nothing" }
        ]
    },
    gameStart: {
        id: "npc_game_start",
        entityId: "edu:game_master",
        nameTag: "ゲームかいしかかり",
        dimension: "overworld",
        position: { x: 4, y: 0, z: 0 },
        title: "ゲームかいし",
        body: "§l§nぜんいんがチームにさんかしたら§r、ゲームをかいししましょう！",
        options: [
            { label: "ゲームかいし", action: "teleport_teams" },
            { label: "キャンセル", action: "nothing" }
        ]
    }
};
