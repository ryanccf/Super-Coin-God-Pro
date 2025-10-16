class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.setupBackground();
        this.createUI();
        this.setupInputHandlers();

        // Create auto-start UI if unlocked
        if (this.registry.get('autoStartUnlocked')) {
            this.createAutoStartUI();
        }
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
                this.pauseAutoStartTimer();
                this.scene.start('ClickerGame');
            }
        });

        // Add P key listener for testing
        this.input.keyboard.on('keydown-P', () => {
            const currentTotal = this.registry.get('totalSkulls');
            this.registry.set('totalSkulls', currentTotal + 100);
            this.scene.restart();
        });
    }

    createAutoStartUI() {
        const topRightX = GAME_CONFIG.WORLD_WIDTH - 30;
        const topRightY = 30;

        // Checkbox background
        const checkboxSize = 24;
        this.autoStartCheckbox = this.add.graphics();
        this.autoStartCheckbox.fillStyle(0xffffff);
        this.autoStartCheckbox.fillRect(topRightX - checkboxSize - 130, topRightY, checkboxSize, checkboxSize);
        this.autoStartCheckbox.lineStyle(3, 0x000000);
        this.autoStartCheckbox.strokeRect(topRightX - checkboxSize - 130, topRightY, checkboxSize, checkboxSize);
        this.autoStartCheckbox.setDepth(2);

        // Checkmark (if enabled)
        this.autoStartCheckmark = this.add.graphics();
        this.autoStartCheckmark.setDepth(3);
        this.updateCheckmark();

        // Label
        this.autoStartLabel = this.add.text(topRightX - 100, topRightY + 12, 'Auto-Start', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0, 0.5).setDepth(2);

        // Countdown timer (below checkbox)
        this.autoStartTimerText = this.add.text(topRightX - 77, topRightY + 30, '', {
            fontFamily: 'Arial Black',
            fontSize: 16,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(2);

        // Make checkbox interactive
        const hitArea = new Phaser.Geom.Rectangle(topRightX - checkboxSize - 130, topRightY, checkboxSize + 130, checkboxSize);
        this.autoStartCheckbox.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.autoStartCheckbox.on('pointerdown', () => this.toggleAutoStart());

        // Start or resume timer
        this.resumeAutoStartTimer();
    }

    updateCheckmark() {
        if (!this.autoStartCheckmark) return;

        this.autoStartCheckmark.clear();

        if (this.registry.get('autoStartEnabled')) {
            const topRightX = GAME_CONFIG.WORLD_WIDTH - 30;
            const topRightY = 30;
            const checkboxSize = 24;

            this.autoStartCheckmark.lineStyle(3, 0x000000);
            this.autoStartCheckmark.beginPath();
            this.autoStartCheckmark.moveTo(topRightX - checkboxSize - 125, topRightY + 12);
            this.autoStartCheckmark.lineTo(topRightX - checkboxSize - 120, topRightY + 17);
            this.autoStartCheckmark.lineTo(topRightX - checkboxSize - 110, topRightY + 7);
            this.autoStartCheckmark.strokePath();
        }
    }

    toggleAutoStart() {
        const current = this.registry.get('autoStartEnabled');
        this.registry.set('autoStartEnabled', !current);
        this.updateCheckmark();

        // Reset or stop timer
        if (!current) {
            this.resumeAutoStartTimer();
        } else {
            this.pauseAutoStartTimer();
        }
    }

    resumeAutoStartTimer() {
        if (!this.registry.get('autoStartEnabled')) return;

        const autoStartLevel = this.registry.get('autoStartLevel');
        const maxDelay = Math.max(1, 10 - autoStartLevel);
        let remainingTime = this.registry.get('autoStartRemainingTime');

        // If timer hasn't started yet, initialize it
        if (remainingTime <= 0) {
            remainingTime = maxDelay;
            this.registry.set('autoStartRemainingTime', remainingTime);
        }

        // Create countdown timer
        this.autoStartTimer = this.time.addEvent({
            delay: remainingTime * 1000,
            callback: () => this.autoStartGame(),
            callbackScope: this
        });
    }

    pauseAutoStartTimer() {
        if (this.autoStartTimer) {
            const remaining = this.autoStartTimer.getRemainingSeconds();
            this.registry.set('autoStartRemainingTime', Math.max(0, remaining));
            this.autoStartTimer.remove();
            this.autoStartTimer = null;
        }
    }

    autoStartGame() {
        if (!this.registry.get('autoStartEnabled')) return;

        // Reset timer for next cycle
        this.registry.set('autoStartRemainingTime', 0);

        this.scene.start('ClickerGame');
    }

    update() {
        // Update countdown display
        if (this.registry.get('autoStartEnabled') && this.autoStartTimer && this.autoStartTimerText) {
            const remaining = Math.ceil(this.autoStartTimer.getRemainingSeconds());
            this.autoStartTimerText.setText(`${remaining}s`);
        } else if (this.autoStartTimerText) {
            this.autoStartTimerText.setText('');
        }
    }

    shutdown() {
        this.pauseAutoStartTimer();
    }
}