// utils/locationUtils.js
import { BlockVolume, world } from "@minecraft/server";

// NPCやプレイヤーの座標操作をまとめたユーティリティ
const LOCATION_UTILS = (() => {

    /**
     * 範囲内からランダムな座標を選んで返す
     * @param {vector3} startPos 
     * @param {vector3} endPos 
     * @returns {vector3}
     */
    function makeRandomPos(startPos, endPos){

        // 座標を小⇒大になるように整理
        const minX = Math.min(startPos.x, endPos.x), minY = Math.min(startPos.y, endPos.y), minZ = Math.min(startPos.z, startPos.z);
        const maxX = Math.max(startPos.x, endPos.x), maxY = Math.max(startPos.y, endPos.y), maxZ = Math.max(startPos.z, endPos.z);

        // ランダム座標を生成
        const randPos = {
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY),
            z: minZ + Math.random() * (maxZ - minZ)
        }

        // ブロック座標に変換して返す
        return toBlockPos(randPos);
    }

    /**
     * ワールド座標をブロック座標に変換
     * 小数を切り捨てて整数化することで、ブロック単位で扱える
     * @param {object} vec3 - {x, y, z} ワールド座標
     * @returns {object} ブロック座標 {x, y, z}
     */
    function toBlockPos(vec3) {
        return {
            x: Math.floor(vec3.x),
            y: Math.floor(vec3.y),
            z: Math.floor(vec3.z)
        };
    }

    /**
     * ブロック座標をワールド座標（ブロック中央）に変換
     * Minecraft のブロックは座標原点が角になるので中央に補正
     * @param {object} blockPos - {x, y, z} ブロック座標
     * @returns {object} ワールド座標 {x, y, z}
     */
    function toWorldPos(blockPos) {
        return {
            x: blockPos.x + 0.5,
            y: blockPos.y,
            z: blockPos.z + 0.5
        };
    }

    /**
     * 下が地面の位置を調べる
     * @param {dimension} dim 現在のディメンション
     * @param {object} vec3 調べたい座標
     * @returns {object} 下が地面の座標
     */
    function toGroundPos(dim,vec3) {
        let currentHeight = vec3.y;

        while(currentHeight > -64) {
            // 現在の座標の1ブロック下のブロックの種類を調べる
            const belowBlock = dim.getBlock(
                {
                    x: vec3.x,
                    y: currentHeight - 1,
                    z: vec3.z
                }
            );
            // ブロックが存在して空気でなく、液体でないならループを抜ける
            if(belowBlock && belowBlock.typeId !== "minecraft:air" && !belowBlock.isLiquid) break;
            currentHeight--;
        }

        return {
            x: vec3.x,
            y: currentHeight,
            z: vec3.z
        }
    }

    /**
     * 2点間の距離（3D）を計算
     * 範囲判定や接近判定で使用
     * @param {object} pos1 - {x, y, z}
     * @param {object} pos2 - {x, y, z}
     * @returns {number} 距離
     */
    function distance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * エンティティが指定座標の範囲内にいるか判定
     * @param {Entity} entity - プレイヤーやNPC
     * @param {object} targetPos - {x, y, z} 判定座標
     * @param {number} range - 範囲
     * @returns {boolean} 範囲内か
     */
    function isWithinRange(entity, targetPos, range) {
        // entity.location がなければ position コンポーネントから取得
        const entityPos = entity.location || entity.getComponent("minecraft:position").position;
        return distance(entityPos, targetPos) <= range;
    }

    /**
     * NPC の現在位置を取得
     * 安全に取得できるようラップ
     * @param {Entity} npc - NPC エンティティ
     * @returns {object} {x, y, z} 座標
     */
    function getNpcPosition(npc) {
        return npc.location || npc.getComponent("minecraft:position").position;
    }

    /**
     * 任意のオフセットを加えた座標を作る
     * 高さ補正やNPCの目線位置などに使用
     * @param {object} pos - 元座標 {x, y, z}
     * @param {object} offset - {x, y, z} 加算値
     * @returns {object} オフセット後の座標
     */
    function offsetPosition(pos, offset) {
        return {
            x: pos.x + (offset.x || 0),
            y: pos.y + (offset.y || 0),
            z: pos.z + (offset.z || 0)
        };
    }    



    // 外部に公開する関数
    return {
        toBlockPos,
        toWorldPos,
        toGroundPos,
        distance,
        isWithinRange,
        getNpcPosition,
        offsetPosition,
        makeRandomPos
    };
})();

export default LOCATION_UTILS;
