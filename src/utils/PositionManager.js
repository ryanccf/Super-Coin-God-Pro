class PositionManager {
    static findBasketPosition(currentBaskets) {
        const basketRadius = 40;
        const minDistance = basketRadius * 2.2;
        const margin = 100;
        
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = 660;
            
            if (this.isValidPosition(x, y, currentBaskets, minDistance)) {
                return { x, y };
            }
        }
        return null;
    }

    static findBumperPosition(currentBumpers, currentBaskets) {
        const bumperRadius = 25;
        const minDistance = bumperRadius * 2.5;
        const margin = 100;
        
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Phaser.Math.Between(margin, GAME_CONFIG.WORLD_WIDTH - margin);
            const y = Phaser.Math.Between(300, 610);
            
            const validFromBumpers = this.isValidPosition(x, y, currentBumpers, minDistance);
            const validFromBaskets = this.isValidPosition(x, y, currentBaskets, 80);
            
            if (validFromBumpers && validFromBaskets) {
                return { x, y };
            }
        }
        return null;
    }

    static isValidPosition(x, y, existingPositions, minDistance) {
        for (let pos of existingPositions) {
            const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
            if (distance < minDistance) return false;
        }
        return true;
    }
}