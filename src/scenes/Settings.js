class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        this.add.image(512, 384, 'background');
        
        this.add.text(512, 200, 'SETTINGS', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.createResetButton();
        this.createBackButton();
    }

    createResetButton() {
        const resetButtonBg = this.add.graphics();
        resetButtonBg.fillStyle(0xCC0000);
        resetButtonBg.fillRoundedRect(362, 320, 300, 80, 10);
        resetButtonBg.lineStyle(3, 0x000000);
        resetButtonBg.strokeRoundedRect(362, 320, 300, 80, 10);
        resetButtonBg.setInteractive(new Phaser.Geom.Rectangle(362, 320, 300, 80), Phaser.Geom.Rectangle.Contains);

        this.add.text(512, 360, 'RESET EVERYTHING', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(512, 450, 'Warning: This will reset all your progress!', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        resetButtonBg.on('pointerdown', () => this.resetGame());
    }

    createBackButton() {
        const backButtonBg = this.add.graphics();
        backButtonBg.fillStyle(COLORS.ROYAL_BLUE);
        backButtonBg.fillRoundedRect(412, 550, 200, 60, 10);
        backButtonBg.lineStyle(3, 0x000000);
        backButtonBg.strokeRoundedRect(412, 550, 200, 60, 10);
        backButtonBg.setInteractive(new Phaser.Geom.Rectangle(412, 550, 200, 60), Phaser.Geom.Rectangle.Contains);

        this.add.text(512, 580, 'BACK', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        backButtonBg.on('pointerdown', () => this.scene.start('MainMenu'));
    }

    resetGame() {
        Object.keys(DEFAULT_SAVE_DATA).forEach(key => {
            this.registry.set(key, DEFAULT_SAVE_DATA[key]);
        });
        this.scene.start('MainMenu');
    }
}