class ClickerGame extends Phaser.Scene {
    constructor() {
        super('ClickerGame');
    }

    init() {
        this.initializeGameState();
        this.initializeArrays();
    }

    initializeGameState() {
        this.roundScore = 0;
        this.totalSkulls = this.registry.get('totalSkulls');
        this.maxSkulls = this.registry.get('maxSkulls');
        this.gameTime = this.registry.get('gameTime');
        this.bigSkullSpawned = false;
    }

    initializeArrays() {
        this.skullObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
        this.flipperSprites = [];
    }

    create() {
        this.setupWorld();
        this.createUI();
        this.createGameObjects();
        this.setupPhysics();
        this.setupInput();
        this.spawnInitialSkulls();
        this.startTimer();
    }

    setupWorld() {
        this.add.image(512, 384, 'background');
        this.add.image(512, GAME_CONFIG.FLOOR_Y, 'floor').setOrigin(0.5, 0);

        // Create dark grey sidebar
        const sidebar = this.add.graphics();
        sidebar.fillStyle(0x333333);
        sidebar.fillRect(GAME_CONFIG.PLAY_AREA_WIDTH, 0, GAME_CONFIG.SIDEBAR_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        this.physics.world.setBounds(
            GAME_CONFIG.PHYSICS_BOUNDS.x,
            GAME_CONFIG.PHYSICS_BOUNDS.y,
            GAME_CONFIG.PHYSICS_BOUNDS.width,
            GAME_CONFIG.PHYSICS_BOUNDS.height
        );
    }

    createUI() {
        const sidebarX = GAME_CONFIG.PLAY_AREA_WIDTH + 30;
        const textStyle = {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff'
        };

        this.roundScoreText = this.add.text(sidebarX, 100, `Round: ${this.roundScore}`, textStyle).setDepth(1);
        this.totalSkullsText = this.add.text(sidebarX, 160, `Total: ${this.totalSkulls}`, textStyle).setDepth(1);
        this.maxSkullsText = this.add.text(sidebarX, 220, `Max: ${this.maxSkulls}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff'
        }).setDepth(1);
        this.timeText = this.add.text(sidebarX, 40, `Time: ${this.gameTime}`, textStyle).setDepth(1);
    }

    createGameObjects() {
        this.createBaskets();
        this.createBumpers();
        this.createFlippers();
    }

    createBaskets() {
        const basketPositions = this.registry.get('baskets');
        basketPositions.forEach(pos => {
            const basket = this.add.image(pos.x, pos.y, 'basket');
            basket.setInteractive({ draggable: true });
            this.physics.add.existing(basket, true);
            basket.body.setSize(70, 40);
            this.basketSprites.push(basket);
            
            this.setupBasketDragging(basket, pos);
            basket.on('pointerdown', () => this.clickBasket(basket));
        });
    }

    setupBasketDragging(basket, originalPos) {
        let lastValidX = originalPos.x;

        basket.on('drag', (pointer, dragX, dragY) => {
            const basketPositions = this.registry.get('baskets');
            const bumperPositions = this.registry.get('bumpers');
            const flipperPositions = this.registry.get('flippers');
            const index = this.basketSprites.indexOf(basket);

            // Create temporary position array without current basket
            const otherBaskets = basketPositions.filter((_, i) => i !== index);
            const allOtherObjects = [...otherBaskets, ...bumperPositions, ...flipperPositions];

            // Check if new position is valid
            if (PositionManager.isValidPosition(dragX, originalPos.y, allOtherObjects, PositionManager.MIN_DISTANCE)) {
                basket.x = dragX;
                basket.y = originalPos.y;
                basket.body.x = dragX - 35;
                basket.body.y = originalPos.y - 20;
                lastValidX = dragX;

                if (index !== -1 && basketPositions[index]) {
                    basketPositions[index].x = dragX;
                    this.registry.set('baskets', basketPositions);
                }
            } else {
                // Snap back to last valid position
                basket.x = lastValidX;
                basket.body.x = lastValidX - 35;
            }
        });

        basket.on('dragend', () => {
            this.tweens.add({
                targets: basket,
                scaleX: 1.15,
                scaleY: 1.15,
                duration: 150,
                yoyo: true,
                ease: 'Back.easeOut'
            });
            GameUtils.createParticleEffect(this, basket.x, basket.y, 0xB34E00, 4);
        });
    }

    createBumpers() {
        const bumperPositions = this.registry.get('bumpers');
        bumperPositions.forEach(pos => {
            const bumper = this.add.image(pos.x, pos.y, 'bumper');
            bumper.setInteractive({ draggable: true });
            this.physics.add.existing(bumper, true);
            bumper.body.setSize(40, 40);
            bumper.body.setCircle(20);
            this.bumperSprites.push(bumper);
            
            this.setupBumperDragging(bumper);
            this.addBumperAnimation(bumper);
        });
    }

    setupBumperDragging(bumper) {
        let lastValidX = bumper.x;
        let lastValidY = bumper.y;

        bumper.on('drag', (pointer, dragX, dragY) => {
            const basketPositions = this.registry.get('baskets');
            const bumperPositions = this.registry.get('bumpers');
            const flipperPositions = this.registry.get('flippers');
            const index = this.bumperSprites.indexOf(bumper);

            // Create temporary position array without current bumper
            const otherBumpers = bumperPositions.filter((_, i) => i !== index);
            const allOtherObjects = [...basketPositions, ...otherBumpers, ...flipperPositions];

            // Check if new position is valid
            if (PositionManager.isValidPosition(dragX, dragY, allOtherObjects, PositionManager.MIN_DISTANCE)) {
                bumper.x = dragX;
                bumper.y = dragY;
                bumper.body.x = dragX - 20;
                bumper.body.y = dragY - 20;
                bumper.body.updateFromGameObject();
                lastValidX = dragX;
                lastValidY = dragY;

                if (index !== -1 && bumperPositions[index]) {
                    bumperPositions[index].x = dragX;
                    bumperPositions[index].y = dragY;
                    this.registry.set('bumpers', bumperPositions);
                }
            } else {
                // Snap back to last valid position
                bumper.x = lastValidX;
                bumper.y = lastValidY;
                bumper.body.x = lastValidX - 20;
                bumper.body.y = lastValidY - 20;
                bumper.body.updateFromGameObject();
            }
        });

        bumper.on('dragend', () => {
            this.tweens.add({
                targets: bumper,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 150,
                yoyo: true,
                ease: 'Back.easeOut'
            });
            GameUtils.createParticleEffect(this, bumper.x, bumper.y, 0x6B2C3E, 4);
        });
    }

    addBumperAnimation(bumper) {
        this.tweens.add({
            targets: bumper,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createFlippers() {
        const flipperPositions = this.registry.get('flippers');
        flipperPositions.forEach(pos => {
            const flipper = this.add.image(pos.x, pos.y, 'flipper');
            flipper.setInteractive({ draggable: true });
            this.physics.add.existing(flipper, true);
            flipper.body.setSize(60, 15);

            if (pos.facingLeft) {
                // LEFT Flipper: pivot (dot) on LEFT side, extends to the right
                // Origin at the left where dot is, at top edge for pivot point
                flipper.setOrigin(0.2, 0);
                flipper.setAngle(30);  // Rest: angles downward to the right
            } else {
                // RIGHT Flipper: pivot (dot) on RIGHT side, extends to the left
                // Origin at the right where dot would be, at top edge for pivot point
                flipper.setOrigin(0.8, 0);
                flipper.setAngle(-30);  // Rest: angles downward to the left
            }

            flipper.facingLeft = pos.facingLeft;
            this.flipperSprites.push(flipper);

            this.setupFlipperDragging(flipper);
        });
    }

    setupFlipperDragging(flipper) {
        let lastValidX = flipper.x;
        let lastValidY = flipper.y;

        flipper.on('drag', (pointer, dragX, dragY) => {
            const basketPositions = this.registry.get('baskets');
            const bumperPositions = this.registry.get('bumpers');
            const flipperPositions = this.registry.get('flippers');
            const index = this.flipperSprites.indexOf(flipper);

            // Create temporary position array without current flipper
            const otherFlippers = flipperPositions.filter((_, i) => i !== index);
            const allOtherObjects = [...basketPositions, ...bumperPositions, ...otherFlippers];

            // Check if new position is valid
            if (PositionManager.isValidPosition(dragX, dragY, allOtherObjects, PositionManager.MIN_DISTANCE)) {
                flipper.x = dragX;
                flipper.y = dragY;
                flipper.body.x = dragX - 30;
                flipper.body.y = dragY - 7.5;
                flipper.body.updateFromGameObject();
                lastValidX = dragX;
                lastValidY = dragY;

                if (index !== -1 && flipperPositions[index]) {
                    flipperPositions[index].x = dragX;
                    flipperPositions[index].y = dragY;
                    this.registry.set('flippers', flipperPositions);
                }
            } else {
                // Snap back to last valid position
                flipper.x = lastValidX;
                flipper.y = lastValidY;
                flipper.body.x = lastValidX - 30;
                flipper.body.y = lastValidY - 7.5;
                flipper.body.updateFromGameObject();
            }
        });

        flipper.on('dragend', () => {
            const restAngle = flipper.facingLeft ? 30 : -30;
            this.tweens.add({
                targets: flipper,
                angle: restAngle + (flipper.facingLeft ? 10 : -10),
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 150,
                yoyo: true,
                ease: 'Back.easeOut',
                onComplete: () => {
                    flipper.setAngle(restAngle);
                    flipper.setScale(1);
                }
            });
            GameUtils.createParticleEffect(this, flipper.x, flipper.y, 0xE87461, 4);
        });
    }

    setupPhysics() {}

    setupCollisionForSkull(skull) {
        if (this.basketSprites.length > 0) {
            this.basketSprites.forEach(basket => {
                this.physics.add.overlap(skull.sprite, basket, (skullSprite, basket) => {
                    this.handleBasketCollection(skullSprite, basket);
                });
            });
        }

        if (this.bumperSprites.length > 0) {
            this.bumperSprites.forEach(bumper => {
                this.physics.add.collider(skull.sprite, bumper, (skullSprite, bumper) => {
                    this.handleBumperCollision(skullSprite, bumper);
                });
            });
        }

        if (this.flipperSprites.length > 0) {
            this.flipperSprites.forEach(flipper => {
                this.physics.add.collider(skull.sprite, flipper, (skullSprite, flipper) => {
                    this.handleFlipperCollision(skullSprite, flipper);
                });
            });
        }
    }

    setupInput() {
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject.texture) {
                if (gameObject.texture.key.startsWith('skull_')) {
                    this.handleSkullClick(gameObject);
                } else if (gameObject.texture.key === 'bigskull') {
                    this.handleSkullClick(gameObject);
                }
            }
        });
    }

    spawnInitialSkulls() {
        for (let i = 0; i < this.maxSkulls; i++) {
            this.spawnSkull();
        }
    }

    startTimer() {
        this.timer = this.time.addEvent({
            delay: this.gameTime * 1000,
            callback: () => this.gameOver()
        });
    }

    spawnSkull(isBig = false) {
        const x = Phaser.Math.Between(128, 896);
        const y = Phaser.Math.Between(0, -400);
        const value = isBig ? 10 : 1;

        const skull = new Skull(this, x, y, value, isBig);
        this.skullObjects.push(skull);

        this.setupCollisionForSkull(skull);
    }

    handleSkullClick(sprite) {
        const skullObj = this.skullObjects.find(c => c.sprite === sprite);
        if (!skullObj || !skullObj.collect()) return;

        this.addScore(skullObj.value);
        this.showBonusText(sprite.x, sprite.y, skullObj.value);
        this.updateScoreDisplay();
        this.removeSkullFromArray(skullObj);

        if (this.skullObjects.length < this.maxSkulls) {
            this.spawnSkull();
        }
    }

    handleBasketCollection(skullSprite, basket) {
        const skullObj = this.skullObjects.find(c => c.sprite === skullSprite);
        if (!skullObj || !skullObj.collectInBasket(basket)) return;

        this.addScore(skullObj.value);
        this.showBasketBonusText(basket.x, basket.y, skullObj.value);
        this.updateScoreDisplay();
        this.removeSkullFromArray(skullObj);

        if (this.skullObjects.length < this.maxSkulls) {
            this.spawnSkull();
        }
    }

    handleBumperCollision(skullSprite, bumper) {
        const skullObj = this.skullObjects.find(c => c.sprite === skullSprite);
        if (!skullObj || !skullObj.canHitBumper(bumper)) return;

        skullObj.hitBumper(bumper);
        skullObj.doubleValue();
        this.showBumperEffect(bumper);
    }

    handleFlipperCollision(skullSprite, flipper) {
        const skullObj = this.skullObjects.find(c => c.sprite === skullSprite);
        if (!skullObj || !skullObj.canHitFlipper(flipper)) return;

        const upwardForce = -500;
        const horizontalForce = flipper.facingLeft ? -200 : 200;

        skullObj.hitFlipper(flipper, upwardForce, horizontalForce);
        this.showFlipperEffect(flipper);
    }

    clickBasket(basket) {
        const bonusSkulls = 5;
        this.addScore(bonusSkulls);
        this.showBasketBonusText(basket.x, basket.y - 30, bonusSkulls);
        this.updateScoreDisplay();
        
        this.tweens.add({
            targets: basket,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    addScore(points) {
        this.roundScore += points;
        this.totalSkulls += points;
        this.registry.set('totalSkulls', this.totalSkulls);
    }

    updateScoreDisplay() {
        this.roundScoreText.setText(`Round: ${this.roundScore}`);
        this.totalSkullsText.setText(`Total: ${this.totalSkulls}`);
        
        this.tweens.add({
            targets: [this.roundScoreText, this.totalSkullsText],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    showBonusText(x, y, value) {
        const color = value > 1 ? '#FFEB3B' : '#0AA1DD';
        const stroke = value > 1 ? '#8B1A1A' : '#000000';
        
        const bonusText = this.add.text(x, y - 30, `+${value}!`, {
            fontFamily: 'Arial Black',
            fontSize: value > 10 ? 36 : 24,
            color: color,
            stroke: stroke,
            strokeThickness: value > 10 ? 4 : 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: bonusText,
            y: y - (value > 10 ? 100 : 60),
            scaleX: value > 10 ? 1.5 : 1,
            scaleY: value > 10 ? 1.5 : 1,
            alpha: 0,
            duration: value > 10 ? 2000 : 1200,
            onComplete: () => bonusText.destroy()
        });
    }

    showBasketBonusText(x, y, value) {
        const bonusText = this.add.text(x, y - 40, `+${value}!`, {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#FFEB3B',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: bonusText,
            y: y - 70,
            alpha: 0,
            duration: 1000,
            onComplete: () => bonusText.destroy()
        });
    }

    showBumperEffect(bumper) {
        this.tweens.add({
            targets: bumper,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        });

        GameUtils.createParticleEffect(this, bumper.x, bumper.y, 0x6B2C3E, 6);

        const bonusText = this.add.text(bumper.x, bumper.y - 30, '2x!', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#E87461',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: bonusText,
            y: bumper.y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => bonusText.destroy()
        });
    }

    showFlipperEffect(flipper) {
        // LEFT flipper (pivot on left): rest at +30°, swings counter-clockwise to -30°
        // RIGHT flipper (pivot on right): rest at -30°, swings clockwise to +30°
        // The bottom of the flipper swings UP, then returns down
        const restAngle = flipper.facingLeft ? 30 : -30;
        const swingAngle = flipper.facingLeft ? -30 : 30;

        this.tweens.add({
            targets: flipper,
            angle: swingAngle,
            duration: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: flipper,
                    angle: restAngle,
                    duration: 200,
                    ease: 'Bounce.easeOut'
                });
            }
        });

        GameUtils.createParticleEffect(this, flipper.x, flipper.y, 0xE87461, 5);

        const flipText = this.add.text(flipper.x, flipper.y + 20, 'FLIP!', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#0AA1DD',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: flipText,
            y: flipper.y - 10,
            alpha: 0,
            duration: 600,
            onComplete: () => flipText.destroy()
        });
    }

    removeSkullFromArray(skullObj) {
        const index = this.skullObjects.indexOf(skullObj);
        if (index > -1) {
            this.skullObjects.splice(index, 1);
        }
    }

    update() {
        if (!this.timer) return;

        this.timeText.setText(`Time: ${Math.ceil(this.timer.getRemainingSeconds())}`);

        this.skullObjects.forEach(skull => {
            skull.updateValueText();
            skull.update();
        });

        if (!this.bigSkullSpawned && this.timer.getRemainingSeconds() <= 5) {
            this.spawnSkull(true);
            this.bigSkullSpawned = true;
        }
    }

    gameOver() {
        this.skullObjects.forEach(skull => {
            skull.sprite.setVelocity(0, 0);
            if (!skull.isBig) skull.sprite.play('vanish');
            skull.destroy();
        });
        this.skullObjects = [];

        this.input.off('gameobjectdown');

        const currentBest = this.registry.get('highscore');
        if (this.roundScore > currentBest) {
            this.registry.set('highscore', this.roundScore);
        }

        this.time.delayedCall(2000, () => this.scene.start('GameOver'));
    }

    shutdown() {
        this.skullObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
        this.flipperSprites = [];
    }
}