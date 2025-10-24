/** エンティティイベントのハンドラ */

export function eventHandler(entity, eventId) {
    const gamePlayer = gamePlayerManager.gamePlayers.get(entity.id);
    if(!gamePlayer) return;

    switch(eventId) {
        case "start_sneaking":
            gamePlayer.checkIsSneaking("start_sneaking");
            break;
        
        case "stop_sneaking":
            gamePlayer.checkIsSneaking("stop_sneaking");
            break;
        
        default:
            console.log(`Unknown eventId: ${eventId}`);
            break;
    }
    
}