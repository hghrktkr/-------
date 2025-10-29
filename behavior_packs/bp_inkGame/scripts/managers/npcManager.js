import { system,world } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { gamePlayerManager } from "../managers/gamePlayerManager";
import { gameManager } from "./gameManager";

export class NPCManager {
    constructor() {
        this.npcConfigs = new Map();
        // [
        //     ["npc_team_select", { id: "npc_team_select", entityId: "edu:npc_team_select", ... }],
        //     ["npc_game_start", { id: "npc_game_start", entityId: "edu:npc_game_start", ... }]
        // ]
    }

    registerNPC(id, config) {
        this.npcConfigs.set(id, config);
    }

    async handleInteraction(player, npcId) {
        const npcConfig = this.npcConfigs.get(npcId);
        if (!npcConfig) {
            console.warn(`NPC ${npcId} not found.`);
            return;
        }

        const form = new ActionFormData()
            .title(npcConfig.title || "選択してください")
            .body(npcConfig.body || "");

        npcConfig.options.forEach(opt => form.button(opt.label));

        // フォームを表示
        return new Promise(resolve => {
            system.run(() => {
                form.show(player).then(res => {
                    if(res.canceled) {
                        resolve(null);
                    }
                    else {
                        resolve(this.executeAction(player, npcConfig.options[res.selection].action));
                    };
                });
            });
        });

    }

    async executeAction(player, action) {
        let gamePlayer = gamePlayerManager.gamePlayers.get(player.id);
        if (!gamePlayer) {
            gamePlayerManager.addGamePlayer(player);
            gamePlayer = gamePlayerManager.gamePlayers.get(player.id);
        }

        switch (action) {
            case "join_blue":
                gamePlayerManager.addBlueTeamPlayer(gamePlayer);
                break;

            case "join_yellow":
                gamePlayerManager.addYellowTeamPlayer(gamePlayer);
                break;

            case "teleport_teams":
                await this.confirmAndStartGame(player);
                break;

            case "reset_player":
                gamePlayerManager.resetPlayer();
                break;

            case "nothing":
                break;

            default:
                console.log(`Unknown action: ${action}`);
        }
    }

    /**
     * ゲーム開始前の確認ダイアログ
     */
    async confirmAndStartGame(player) {
        
        // 確認フォーム
        const confirmForm = new MessageFormData()
        .title("ゲームかいしかくにん")
        .body("§l§nぜんいんじゅんびできましたか？\n§rゲームをかいししますか？")
        .button1("かいしする")
        .button2("まだ");
        
        const res = await confirmForm.show(player);
        if (res.canceled) return;
        
        if (res.selection === 0) {
            // ✅ 「はい」が選ばれたらゲーム開始

            world.sendMessage("§aゲームが開始されました！");
            gameManager.startGame();
        } else {
            // ❌ 「いいえ」が選ばれたらキャンセル
            player.sendMessage("§7ゲーム開始をキャンセルしました。");
        }
    }

    spawnAllNPCs() {
        for (const npc of this.npcConfigs.values()) {
            const dim = world.getDimension(npc.dimension ?? "overworld");
            const existing = [...dim.getEntities({ type: npc.entityId, name: npc.nameTag })];
            if (existing.length > 0) continue; // すでに存在するならスキップ

            dim.spawnEntity(npc.entityId, npc.position);
            const spawned = [...dim.getEntities({ type: npc.entityId, location: npc.position })][0];
            if (spawned) spawned.nameTag = npc.nameTag;
            console.log(`Spawned NPC: ${npc.nameTag}`);
        }
    }
}

export const npcManager = new NPCManager();
