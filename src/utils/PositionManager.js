class PositionManager {
    static MIN_DISTANCE = 70;
    static MIN_DISTANCE_TRIANGLE = 150;

    static findBasketPosition(currentBaskets, currentBumpers = [], currentFlippers = [], currentTriangles = []) {
        const basketRadius = 40;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = 660;

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y };
            }
        }
        return null;
    }

    static findBumperPosition(currentBumpers, currentBaskets, currentFlippers = [], currentTriangles = []) {
        const bumperRadius = 25;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = Phaser.Math.Between(300, 610);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y };
            }
        }
        return null;
    }

    static findFlipperPosition(currentFlippers, currentBaskets, currentBumpers, currentTriangles = []) {
        const flipperWidth = 50;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = Phaser.Math.Between(350, 630);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y };
            }
        }
        return null;
    }

    static findTrianglePosition(currentTriangles, currentBaskets, currentBumpers, currentFlippers) {
        const squareSize = 120;
        const margin = 150;

        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = Phaser.Math.Between(300, 630);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y };
            }
        }
        return null;
    }

    static findBoosterPosition(currentBoosters, currentBaskets, currentBumpers, currentFlippers, currentTriangles) {
        const boosterLength = 140;  // 120 + 20 for arrow
        const margin = 150;

        for (let attempts = 0; attempts < 100; attempts++) {
            // Bottom right quadrant: x from 512 to 924, y from 450 to 630
            const x = Phaser.Math.Between(512, GAME_CONFIG.PLAY_AREA_WIDTH - margin);
            const y = Phaser.Math.Between(450, 630);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y, angle: Phaser.Math.Between(0, 360) };
            }
        }
        return null;
    }

    static findShrinkerPosition(currentShrinkers, currentBaskets, currentBumpers, currentFlippers, currentTriangles) {
        const shrinkerRadius = 20;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            // Bottom right quadrant: x from 512 to 924, y from 450 to 630
            const x = Phaser.Math.Between(512, GAME_CONFIG.PLAY_AREA_WIDTH - margin);
            const y = Phaser.Math.Between(450, 630);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y };
            }
        }
        return null;
    }

    static findPortalPosition(currentPortals, currentBaskets, currentBumpers, currentFlippers, currentTriangles) {
        const portalRadius = 20;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            // Bottom right quadrant: x from 512 to 924, y from 450 to 630
            const x = Phaser.Math.Between(512, GAME_CONFIG.PLAY_AREA_WIDTH - margin);
            const y = Phaser.Math.Between(450, 630);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y };
            }
        }
        return null;
    }

    static findDuplicatorPosition(currentDuplicators, currentBaskets, currentBumpers, currentFlippers, currentTriangles) {
        const duplicatorRadius = 20;
        const margin = 100;

        for (let attempts = 0; attempts < 100; attempts++) {
            // Bottom right quadrant: x from 512 to 924, y from 450 to 630
            const x = Phaser.Math.Between(512, GAME_CONFIG.PLAY_AREA_WIDTH - margin);
            const y = Phaser.Math.Between(450, 630);

            if (this.isValidPositionFromAll(x, y, currentBaskets, currentBumpers, currentFlippers, currentTriangles)) {
                return { x, y };
            }
        }
        return null;
    }

    static isValidPositionFromAll(x, y, baskets, bumpers, flippers, triangles = []) {
        const allObjects = [...baskets, ...bumpers, ...flippers, ...triangles];
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