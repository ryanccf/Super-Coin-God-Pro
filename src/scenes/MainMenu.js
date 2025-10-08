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
        const bg = this.add.image(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2, 'main_menu_background');
        // Scale to cover the entire screen
        const scaleX = GAME_CONFIG.WORLD_WIDTH / bg.width;
        const scaleY = GAME_CONFIG.WORLD_HEIGHT / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);
    }

    createUI() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const totalSkulls = this.registry.get('totalSkulls');
        const highscore = this.registry.get('highscore');

        const textStyle = {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#000000',
            stroke: '#ffffff',
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

        // Position text in the center of the right third of the screen
        const rightThirdCenterX = GAME_CONFIG.WORLD_WIDTH * (5/6);
        const instructionText = this.add.text(rightThirdCenterX, 400, instructions, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);

        this.addPulseAnimation(instructionText);

        this.createButton(centerX - 384, 650, 'PLAY', 0xFF6347, () => this.scene.start('ClickerGame'));
        this.createButton(centerX - 128, 650, 'SHOP', COLORS.MINT_GREEN, () => this.scene.start('Shop'));
        this.createButton(centerX + 128, 650, 'ALTAR', 0x4A4A4A, () => this.scene.start('Altar'));
        this.createButton(centerX + 384, 650, 'SETTINGS', COLORS.SOFT_PINK, () => this.scene.start('Settings'));
    }

    createButton(x, y, text, color, callback) {
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(color);
        buttonBg.fillRoundedRect(x-100, y-30, 200, 60, 15);
        buttonBg.lineStyle(3, 0x000000);
        buttonBg.strokeRoundedRect(x-100, y-30, 200, 60, 15);
        buttonBg.setInteractive(new Phaser.Geom.Rectangle(x-100, y-30, 200, 60), Phaser.Geom.Rectangle.Contains);
        
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3
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
            // Resume audio context on first user interaction
            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }

            if (currentlyOver.length === 0) {
                this.scene.start('ClickerGame');
            }
        });
    }
}