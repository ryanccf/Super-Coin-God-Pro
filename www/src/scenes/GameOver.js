class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        const totalSkulls = this.registry.get('totalSkulls');
        const bestRound = this.registry.get('highscore');

        this.add.image(512, 384, 'background');

        const message = [
            "Time's Up!",
            "",
            `Total Skulls: ${totalSkulls}`,
            `Best Round: ${bestRound}`,
            "",
            "Click to Continue"
        ];

        this.add.text(512, 384, message, {
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