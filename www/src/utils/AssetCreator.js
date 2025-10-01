class AssetCreator {
    static createSkullFrames(scene) {
        for (let i = 1; i <= 7; i++) {
            const skullCanvas = scene.add.graphics();
            const radius = 20 + Math.sin(i * 0.5) * 5;

            // White skull base
            skullCanvas.fillStyle(COLORS.GOLD);
            skullCanvas.fillCircle(25, 25, radius);
            skullCanvas.lineStyle(3, COLORS.ORANGE);
            skullCanvas.strokeCircle(25, 25, radius);

            // Black eyes (two circles)
            skullCanvas.fillStyle(0x000000);
            skullCanvas.fillCircle(19, 20, 3);  // Left eye
            skullCanvas.fillCircle(31, 20, 3);  // Right eye

            // Jack-o-lantern style grin (triangular teeth)
            skullCanvas.fillStyle(0x000000);
            // Bottom grin arc with triangular teeth
            skullCanvas.beginPath();
            skullCanvas.arc(25, 25, 10, 0.3, Math.PI - 0.3, false);
            skullCanvas.lineTo(25, 33);
            skullCanvas.closePath();
            skullCanvas.fillPath();

            // Triangular teeth cutouts (white)
            skullCanvas.fillStyle(COLORS.GOLD);
            // Left tooth
            skullCanvas.beginPath();
            skullCanvas.moveTo(20, 28);
            skullCanvas.lineTo(22, 32);
            skullCanvas.lineTo(18, 32);
            skullCanvas.closePath();
            skullCanvas.fillPath();
            // Middle tooth
            skullCanvas.beginPath();
            skullCanvas.moveTo(25, 28);
            skullCanvas.lineTo(27, 32);
            skullCanvas.lineTo(23, 32);
            skullCanvas.closePath();
            skullCanvas.fillPath();
            // Right tooth
            skullCanvas.beginPath();
            skullCanvas.moveTo(30, 28);
            skullCanvas.lineTo(32, 32);
            skullCanvas.lineTo(28, 32);
            skullCanvas.closePath();
            skullCanvas.fillPath();

            skullCanvas.generateTexture('skull_' + i.toString().padStart(2, '0'), 50, 50);
            skullCanvas.destroy();
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
        // Light grey gradient
        bgCanvas.fillGradientStyle(0xCCCCCC, 0xCCCCCC, 0xAAAAAA, 0xAAAAAA);
        bgCanvas.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        bgCanvas.generateTexture('background', GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        bgCanvas.destroy();
    }

    static createBasket(scene) {
        const basketCanvas = scene.add.graphics();
        basketCanvas.fillStyle(0xB34E00);  // Dark orange from palette
        basketCanvas.beginPath();
        basketCanvas.arc(40, 35, 35, 0, Math.PI, false);
        basketCanvas.fillPath();
        basketCanvas.lineStyle(4, 0x8B3A00);  // Darker orange
        basketCanvas.beginPath();
        basketCanvas.arc(40, 35, 35, 0, Math.PI, false);
        basketCanvas.strokePath();
        basketCanvas.generateTexture('basket', 80, 50);
        basketCanvas.destroy();
    }

    static createBumper(scene) {
        const bumperCanvas = scene.add.graphics();
        bumperCanvas.fillStyle(0x6B2C3E);  // Deep burgundy from palette
        bumperCanvas.fillCircle(25, 25, 20);
        bumperCanvas.lineStyle(4, 0x4A1F2C);  // Darker burgundy
        bumperCanvas.strokeCircle(25, 25, 20);
        bumperCanvas.fillStyle(0xFFFFFF, 0.4);
        bumperCanvas.fillCircle(18, 18, 8);
        bumperCanvas.generateTexture('bumper', 50, 50);
        bumperCanvas.destroy();
    }

    static createFlipper(scene) {
        const flipperCanvas = scene.add.graphics();

        // Coffin shape - wider at shoulder, narrower at foot
        flipperCanvas.fillStyle(0xE87461);  // Coral from palette
        flipperCanvas.beginPath();
        flipperCanvas.moveTo(60, 7.5);
        flipperCanvas.lineTo(45, 0);
        flipperCanvas.lineTo(15, 0);
        flipperCanvas.lineTo(0, 7.5);
        flipperCanvas.lineTo(15, 15);
        flipperCanvas.lineTo(45, 15);
        flipperCanvas.closePath();
        flipperCanvas.fillPath();

        flipperCanvas.lineStyle(3, 0xB34E00);  // Dark orange from palette
        flipperCanvas.beginPath();
        flipperCanvas.moveTo(60, 7.5);
        flipperCanvas.lineTo(45, 0);
        flipperCanvas.lineTo(15, 0);
        flipperCanvas.lineTo(0, 7.5);
        flipperCanvas.lineTo(15, 15);
        flipperCanvas.lineTo(45, 15);
        flipperCanvas.closePath();
        flipperCanvas.strokePath();

        flipperCanvas.generateTexture('flipper', 60, 15);
        flipperCanvas.destroy();
    }

    static createBigSkull(scene) {
        const bigSkullCanvas = scene.add.graphics();

        // White skull base
        bigSkullCanvas.fillStyle(COLORS.LIGHT_YELLOW);
        bigSkullCanvas.fillCircle(35, 35, 30);
        bigSkullCanvas.lineStyle(5, COLORS.GOLD);
        bigSkullCanvas.strokeCircle(35, 35, 30);

        // Black eyes (two circles) - scaled up for big skull
        bigSkullCanvas.fillStyle(0x000000);
        bigSkullCanvas.fillCircle(26, 28, 5);  // Left eye
        bigSkullCanvas.fillCircle(44, 28, 5);  // Right eye

        // Jack-o-lantern style grin (triangular teeth) - scaled up
        bigSkullCanvas.fillStyle(0x000000);
        // Bottom grin arc with triangular teeth
        bigSkullCanvas.beginPath();
        bigSkullCanvas.arc(35, 35, 15, 0.3, Math.PI - 0.3, false);
        bigSkullCanvas.lineTo(35, 47);
        bigSkullCanvas.closePath();
        bigSkullCanvas.fillPath();

        // Triangular teeth cutouts (white) - scaled up
        bigSkullCanvas.fillStyle(COLORS.LIGHT_YELLOW);
        // Left tooth
        bigSkullCanvas.beginPath();
        bigSkullCanvas.moveTo(28, 40);
        bigSkullCanvas.lineTo(31, 46);
        bigSkullCanvas.lineTo(25, 46);
        bigSkullCanvas.closePath();
        bigSkullCanvas.fillPath();
        // Middle tooth
        bigSkullCanvas.beginPath();
        bigSkullCanvas.moveTo(35, 40);
        bigSkullCanvas.lineTo(38, 46);
        bigSkullCanvas.lineTo(32, 46);
        bigSkullCanvas.closePath();
        bigSkullCanvas.fillPath();
        // Right tooth
        bigSkullCanvas.beginPath();
        bigSkullCanvas.moveTo(42, 40);
        bigSkullCanvas.lineTo(45, 46);
        bigSkullCanvas.lineTo(39, 46);
        bigSkullCanvas.closePath();
        bigSkullCanvas.fillPath();

        bigSkullCanvas.generateTexture('bigskull', 70, 70);
        bigSkullCanvas.destroy();
    }

    static createFloor(scene) {
        const floorCanvas = scene.add.graphics();
        const floorHeight = GAME_CONFIG.WORLD_HEIGHT - GAME_CONFIG.FLOOR_Y;
        floorCanvas.fillStyle(0x4A4A4A);  // Medium gray
        floorCanvas.fillRect(0, 0, GAME_CONFIG.PLAY_AREA_WIDTH, floorHeight);
        floorCanvas.lineStyle(2, 0x2A2A2A);  // Darker gray

        const lineSpacing = 4;
        const numLines = Math.floor(floorHeight / lineSpacing);
        for (let i = 0; i < numLines; i++) {
            const y = i * lineSpacing;
            floorCanvas.lineBetween(0, y, GAME_CONFIG.PLAY_AREA_WIDTH, y);
        }

        floorCanvas.generateTexture('floor', GAME_CONFIG.PLAY_AREA_WIDTH, floorHeight);
        floorCanvas.destroy();
    }
}