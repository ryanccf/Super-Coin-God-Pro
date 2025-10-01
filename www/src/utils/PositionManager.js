class PositionManager {
    static MIN_DISTANCE = 70;

    static findBasketPosition(currentBaskets, currentBumpers = [], currentFlippers = []) {
        const basketRadius = 40;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = 660;

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers)) {
                return { x, y };
            }
        }
        return null;
    }

    static findBumperPosition(currentBumpers, currentBaskets, currentFlippers = []) {
        const bumperRadius = 25;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = Phaser.Math.Between(300, 610);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers)) {
                return { x, y };
            }
        }
        return null;
    }

    static findFlipperPosition(currentFlippers, currentBaskets, currentBumpers) {
        const flipperWidth = 50;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = Phaser.Math.Between(350, 630);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers)) {
                return { x, y };
            }
        }
        return null;
    }

    static isValidPositionFromAll(x, y, baskets, bumpers, flippers) {
        const allObjects = [...baskets, ...bumpers, ...flippers];
        return this.isValidPosition(x, y, allObjects, this.MIN_DISTANCE);
    }

    static isValidPosition(x, y, existingPositions, minDistance) {
        for (let pos of existingPositions) {
            const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
            if (distance < minDistance) return false;
        }
        return true;
    }
}