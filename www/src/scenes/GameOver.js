class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const totalSkulls = this.registry.get('totalSkulls');
        const bestRound = this.registry.get('highscore');

        this.add.image(centerX, 384, 'background');

        const message = [
            "Time's Up!",
            "",
            `Total Skulls: ${totalSkulls}`,
            `Best Round: ${bestRound}`,
            "",
            "Click to Continue"
        ];

        this.add.text(centerX, 384, message, {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}