class Lightbox extends Phaser.Scene {
    constructor() {
        super('Lightbox');
    }

    init(data) {
        this.itemName = data.itemName;
    }

    create() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

        // Semi-transparent black overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT), Phaser.Geom.Rectangle.Contains);
        overlay.on('pointerdown', () => this.close());

        // Display full-size image
        const image = this.add.image(centerX, centerY, this.itemName);

        // Scale image to fit screen while maintaining aspect ratio
        const maxWidth = GAME_CONFIG.WORLD_WIDTH * 0.8;
        const maxHeight = GAME_CONFIG.WORLD_HEIGHT * 0.8;
        const scaleX = maxWidth / image.width;
        const scaleY = maxHeight / image.height;
        const scale = Math.min(scaleX, scaleY);
        image.setScale(scale);

        // Add item name text
        this.add.text(centerX, 50, this.itemName, {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add close instruction
        this.add.text(centerX, GAME_CONFIG.WORLD_HEIGHT - 50, 'Click anywhere to close', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    close() {
        this.scene.stop();
        this.scene.resume('Altar');
    }
}
