class AssetCreator {
    static createCoinFrames(scene) {
        for (let i = 1; i <= 7; i++) {
            const coinCanvas = scene.add.graphics();
            const radius = 20 + Math.sin(i * 0.5) * 5;
            
            coinCanvas.fillStyle(COLORS.GOLD);
            coinCanvas.fillCircle(25, 25, radius);
            coinCanvas.lineStyle(3, COLORS.ORANGE);
            coinCanvas.strokeCircle(25, 25, radius);
            coinCanvas.fillStyle(0xFFFFFF, 0.4);
            coinCanvas.fillCircle(20, 20, 8);
            
            coinCanvas.generateTexture('coin_' + i.toString().padStart(2, '0'), 50, 50);
            coinCanvas.destroy();
        }
    }

    static createVanishFrames(scene) {
        for (let i = 1; i <= 4; i++) {
            const vanishCanvas = scene.add.graphics();
            const alpha = 1 - (i - 1) / 3;
            
            vanishCanvas.fillStyle(COLORS.GOLD, alpha);
            vanishCanvas.fillCircle(25, 25, 20);
            vanishCanvas.lineStyle(3, COLORS.ORANGE, alpha);
            vanishCanvas.strokeCircle(25, 25, 20);
            
            vanishCanvas.generateTexture('vanish_' + i, 50, 50);
            vanishCanvas.destroy();
        }
    }

    static createBackground(scene) {
        const bgCanvas = scene.add.graphics();
        bgCanvas.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE6E6FA, 0xE6E6FA);
        bgCanvas.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        bgCanvas.generateTexture('background', GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        bgCanvas.destroy();
    }

    static createBasket(scene) {
        const basketCanvas = scene.add.graphics();
        basketCanvas.fillStyle(COLORS.BROWN);
        basketCanvas.beginPath();
        basketCanvas.arc(40, 35, 35, 0, Math.PI, false);
        basketCanvas.fillPath();
        basketCanvas.lineStyle(4, 0x654321);
        basketCanvas.beginPath();
        basketCanvas.arc(40, 35, 35, 0, Math.PI, false);
        basketCanvas.strokePath();
        basketCanvas.generateTexture('basket', 80, 50);
        basketCanvas.destroy();
    }

    static createBumper(scene) {
        const bumperCanvas = scene.add.graphics();
        bumperCanvas.fillStyle(COLORS.PURPLE);
        bumperCanvas.fillCircle(25, 25, 20);
        bumperCanvas.lineStyle(4, 0x9370DB);
        bumperCanvas.strokeCircle(25, 25, 20);
        bumperCanvas.fillStyle(0xFFFFFF, 0.6);
        bumperCanvas.fillCircle(18, 18, 8);
        bumperCanvas.generateTexture('bumper', 50, 50);
        bumperCanvas.destroy();
    }

    static createFlipper(scene) {
        const flipperCanvas = scene.add.graphics();

        // Coffin shape - wider at shoulder, narrower at foot
        flipperCanvas.fillStyle(0xFF6347);
        flipperCanvas.beginPath();
        flipperCanvas.moveTo(0, 7.5);
        flipperCanvas.lineTo(15, 0);
        flipperCanvas.lineTo(45, 0);
        flipperCanvas.lineTo(60, 7.5);
        flipperCanvas.lineTo(45, 15);
        flipperCanvas.lineTo(15, 15);
        flipperCanvas.closePath();
        flipperCanvas.fillPath();

        flipperCanvas.lineStyle(3, 0xFF4500);
        flipperCanvas.beginPath();
        flipperCanvas.moveTo(0, 7.5);
        flipperCanvas.lineTo(15, 0);
        flipperCanvas.lineTo(45, 0);
        flipperCanvas.lineTo(60, 7.5);
        flipperCanvas.lineTo(45, 15);
        flipperCanvas.lineTo(15, 15);
        flipperCanvas.closePath();
        flipperCanvas.strokePath();

        flipperCanvas.generateTexture('flipper', 60, 15);
        flipperCanvas.destroy();
    }

    static createBigCoin(scene) {
        const bigCoinCanvas = scene.add.graphics();
        bigCoinCanvas.fillStyle(COLORS.LIGHT_YELLOW);
        bigCoinCanvas.fillCircle(35, 35, 30);
        bigCoinCanvas.lineStyle(5, COLORS.GOLD);
        bigCoinCanvas.strokeCircle(35, 35, 30);
        bigCoinCanvas.fillStyle(0xFFFFFF, 0.6);
        bigCoinCanvas.fillCircle(25, 25, 12);
        bigCoinCanvas.fillStyle(0xFFFFFF, 0.3);
        bigCoinCanvas.fillCircle(45, 45, 8);
        bigCoinCanvas.generateTexture('bigcoin', 70, 70);
        bigCoinCanvas.destroy();
    }

    static createFloor(scene) {
        const floorCanvas = scene.add.graphics();
        floorCanvas.fillStyle(0xF5DEB3);
        floorCanvas.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, 70);
        floorCanvas.lineStyle(2, 0xDEB887);
        for (let i = 0; i < 15; i++) {
            const y = 10 + (i * 4);
            floorCanvas.lineBetween(0, y, GAME_CONFIG.WORLD_WIDTH, y);
        }
        floorCanvas.generateTexture('floor', GAME_CONFIG.WORLD_WIDTH, 70);
        floorCanvas.destroy();
    }
}