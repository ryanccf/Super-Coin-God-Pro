class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
        const totalSkulls = this.registry.get('totalSkulls');
        const bestRound = this.registry.get('highscore');

        // Add background - use fallback if image doesn't exist
        if (this.textures.exists('game_over_background')) {
            const bg = this.add.image(centerX, centerY, 'game_over_background');
            // Scale to cover the entire screen
            const scaleX = GAME_CONFIG.WORLD_WIDTH / bg.width;
            const scaleY = GAME_CONFIG.WORLD_HEIGHT / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
        } else {
            // Fallback to solid color background
            const bg = this.add.graphics();
            bg.fillStyle(0x2a2a2a);
            bg.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        }

        const message = [
            "Time's Up!",
            "",
            `Total Skulls: ${totalSkulls}`,
            `Best Round: ${bestRound}`,
            "",
            "Click to Continue"
        ].join('\n');

        this.add.text(centerX, 384, message, {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Create auto-start UI if unlocked
        if (this.registry.get('autoStartUnlocked')) {
            this.createAutoStartUI();
        }

        this.input.once('pointerdown', () => {
            this.pauseAutoStartTimer();
            this.scene.start('MainMenu');
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