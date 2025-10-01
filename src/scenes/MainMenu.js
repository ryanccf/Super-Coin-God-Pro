class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.setupBackground();
        this.createUI();
        this.setupInputHandlers();
    }

    setupBackground() {
        this.add.image(512, 384, 'background');
    }

    createUI() {
        const totalSkulls = this.registry.get('totalSkulls');
        const highscore = this.registry.get('highscore');

        const textStyle = {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#6B4E71',
            stroke: '#FFFFFF',
            strokeThickness: 4
        };

        const totalSkullsText = this.add.text(32, 32, `Total Skulls: ${totalSkulls}`, textStyle);
        const bestRoundText = this.add.text(32, 80, `Best Round: ${highscore}`, textStyle);

        this.addFloatingAnimation([totalSkullsText, bestRoundText]);

        const instructions = [
            "SUPER SKULL GOD PRO",
            "CHAMPIONSHIP EDITION",
            "",
            "How many skulls can you",
            "collect for the Skull God?",
            "",
            "Buy upgrades in the shop",
            "& collect more skulls!",
            "",
            "SKULLS FOR THE SKULL GOD!"
        ];

        const instructionText = this.add.text(512, 400, instructions, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#6B4E71',
            stroke: '#FFFFFF',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        this.addPulseAnimation(instructionText);

        this.createButton(256, 650, 'PLAY', 0xFF6347, () => this.scene.start('ClickerGame'));
        this.createButton(512, 650, 'SHOP', COLORS.MINT_GREEN, () => this.scene.start('Shop'));
        this.createButton(768, 650, 'SETTINGS', COLORS.SOFT_PINK, () => this.scene.start('Settings'));
    }

    createButton(x, y, text, color, callback) {
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(color);
        buttonBg.fillRoundedRect(x-100, y-30, 200, 60, 15);
        buttonBg.lineStyle(4, color - 0x101010);
        buttonBg.strokeRoundedRect(x-100, y-30, 200, 60, 15);
        buttonBg.setInteractive(new Phaser.Geom.Rectangle(x-100, y-30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#4A5D4A'
        }).setOrigin(0.5);

        GameUtils.addButtonEffect(buttonBg, buttonText, callback);
    }

    addFloatingAnimation(targets) {
        this.tweens.add({
            targets: targets,
            y: '+=3',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    addPulseAnimation(target) {
        this.tweens.add({
            targets: target,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    setupInputHandlers() {
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (currentlyOver.length === 0) {
                this.scene.start('ClickerGame');
            }
        });
    }
}