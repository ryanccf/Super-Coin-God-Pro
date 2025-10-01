const GAME_CONFIG = {
    WORLD_WIDTH: 1024,
    WORLD_HEIGHT: 768,
    FLOOR_Y: 680,
    GRAVITY: 400,
    PHYSICS_BOUNDS: {
        x: 0, 
        y: -400, 
        width: 1024, 
        height: 768 + 310
    }
};

const DEFAULT_SAVE_DATA = {
    totalSkulls: 200,
    maxSkulls: 10,
    upgradeLevel: 0,
    basketLevel: 0,
    timerLevel: 0,
    bumperLevel: 0,
    flipperLevel: 0,
    gameTime: 10,
    baskets: [],
    bumpers: [],
    flippers: [],
    highscore: 0
};