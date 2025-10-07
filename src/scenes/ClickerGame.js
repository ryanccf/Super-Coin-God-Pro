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
        this.triangleSprites = [];
        this.selectedFlipper = null;
        this.flipperManipulator = null;
        this.selectedTriangle = null;
        this.triangleManipulator = null;
        this.clickedGameObject = false;
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
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        this.roundScoreText = this.add.text(sidebarX, 100, `Round: ${this.roundScore}`, textStyle).setDepth(1);
        this.totalSkullsText = this.add.text(sidebarX, 160, `Total: ${this.totalSkulls}`, textStyle).setDepth(1);
        this.maxSkullsText = this.add.text(sidebarX, 220, `Max: ${this.maxSkulls}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(1);
        this.timeText = this.add.text(sidebarX, 40, `Time: ${this.gameTime}`, textStyle).setDepth(1);
    }

    createGameObjects() {
        this.createBaskets();
        this.createBumpers();
        this.createFlippers();
        this.createTriangles();
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

            // Use circular hitbox for better rotation collision
            // Radius of ~20 captures the main body area
            flipper.body.setCircle(20);
            flipper.body.setOffset(10, -12.5); // Offset to center on the pivot point

            // Set origin based on facing direction
            if (pos.facingLeft) {
                flipper.setOrigin(0.2, 0);
            } else {
                flipper.setOrigin(0.8, 0);
            }

            // Load scaleX if flipper was flipped (default to 1 if not set)
            const scaleX = pos.scaleX !== undefined ? pos.scaleX : 1;
            flipper.setScale(scaleX, 1);

            // Store the base scale - this is the "true" scale without animations
            flipper.baseScaleX = scaleX;

            // Load saved angle or use default (in degrees)
            const angle = pos.angle !== undefined ? pos.angle : (pos.facingLeft ? 30 : -30);
            flipper.setAngle(angle);

            // Store the base angle - this is the "true" angle without animations
            flipper.baseAngle = angle;

            flipper.facingLeft = pos.facingLeft;
            this.flipperSprites.push(flipper);

            this.setupFlipperDragging(flipper);
        });
    }

    createTriangles() {
        const trianglePositions = this.registry.get('triangles');
        trianglePositions.forEach(pos => {
            const triangle = this.add.image(pos.x, pos.y, 'triangle');
            triangle.setInteractive({ draggable: true });
            this.physics.add.existing(triangle, true);

            // Square hitbox - 120x120
            triangle.body.setSize(120, 120);

            // Load saved angle or use default (pointing up)
            const angle = pos.angle !== undefined ? pos.angle : 0;
            triangle.setAngle(angle);

            // Store the base angle - this is the "true" angle without animations
            triangle.baseAngle = angle;

            this.triangleSprites.push(triangle);

            this.setupTriangleDragging(triangle);
        });
    }

    setupFlipperDragging(flipper) {
        let lastValidX = flipper.x;
        let lastValidY = flipper.y;
        let isDragging = false;

        // Track when drag actually starts
        flipper.on('dragstart', () => {
            isDragging = true;
            lastValidX = flipper.x;
            lastValidY = flipper.y;
        });

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
                flipper.body.updateFromGameObject();
            }
        });

        flipper.on('dragend', () => {
            // Only animate if we actually dragged
            if (isDragging) {
                const trueAngle = flipper.baseAngle;
                const wobbleOffset = flipper.facingLeft ? 10 : -10;

                // Simple angle-only animation - use baseAngle
                this.tweens.add({
                    targets: flipper,
                    angle: trueAngle + wobbleOffset,
                    duration: 100,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: flipper,
                            angle: trueAngle,
                            duration: 100,
                            ease: 'Back.easeOut',
                            onComplete: () => {
                                flipper.setAngle(trueAngle);
                            }
                        });
                    }
                });
                GameUtils.createParticleEffect(this, flipper.x, flipper.y, 0xE87461, 4);
            }
            isDragging = false;
        });
    }

    setupTriangleDragging(triangle) {
        let lastValidX = triangle.x;
        let lastValidY = triangle.y;
        let isDragging = false;

        // Track when drag actually starts
        triangle.on('dragstart', () => {
            isDragging = true;
            lastValidX = triangle.x;
            lastValidY = triangle.y;
        });

        triangle.on('drag', (pointer, dragX, dragY) => {
            const basketPositions = this.registry.get('baskets');
            const bumperPositions = this.registry.get('bumpers');
            const flipperPositions = this.registry.get('flippers');
            const trianglePositions = this.registry.get('triangles');
            const index = this.triangleSprites.indexOf(triangle);

            // Create temporary position array without current triangle
            const otherTriangles = trianglePositions.filter((_, i) => i !== index);
            const allOtherObjects = [...basketPositions, ...bumperPositions, ...flipperPositions, ...otherTriangles];

            // Check if new position is valid
            if (PositionManager.isValidPosition(dragX, dragY, allOtherObjects, PositionManager.MIN_DISTANCE)) {
                triangle.x = dragX;
                triangle.y = dragY;
                triangle.body.x = dragX - 60;
                triangle.body.y = dragY - 60;
                triangle.body.updateFromGameObject();
                lastValidX = dragX;
                lastValidY = dragY;

                if (index !== -1 && trianglePositions[index]) {
                    trianglePositions[index].x = dragX;
                    trianglePositions[index].y = dragY;
                    this.registry.set('triangles', trianglePositions);
                }
            } else {
                // Snap back to last valid position
                triangle.x = lastValidX;
                triangle.y = lastValidY;
                triangle.body.x = lastValidX - 60;
                triangle.body.y = lastValidY - 60;
                triangle.body.updateFromGameObject();
            }
        });

        triangle.on('dragend', () => {
            // Only create particles if we actually dragged
            if (isDragging) {
                GameUtils.createParticleEffect(this, triangle.x, triangle.y, 0xFF8C42, 4);
            }
            isDragging = false;
        });
    }

    selectFlipper(flipper) {
        // Deselect previous flipper if any
        if (this.selectedFlipper !== flipper) {
            this.deselectFlipper();
        }

        this.selectedFlipper = flipper;

        // Create manipulator if it doesn't exist
        if (!this.flipperManipulator) {
            this.flipperManipulator = new FlipperManipulator(this, flipper);
        } else {
            this.flipperManipulator.flipper = flipper;
        }

        this.flipperManipulator.show();
    }

    deselectFlipper() {
        if (this.flipperManipulator) {
            this.flipperManipulator.hide();
        }
        this.selectedFlipper = null;
    }

    selectTriangle(triangle) {
        // Deselect previous triangle if any
        if (this.selectedTriangle !== triangle) {
            this.deselectTriangle();
        }

        this.selectedTriangle = triangle;

        // Create manipulator if it doesn't exist
        if (!this.triangleManipulator) {
            this.triangleManipulator = new TriangleManipulator(this, triangle);
        } else {
            this.triangleManipulator.triangle = triangle;
        }

        this.triangleManipulator.show();
    }

    deselectTriangle() {
        if (this.triangleManipulator) {
            this.triangleManipulator.hide();
        }
        this.selectedTriangle = null;
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

        if (this.triangleSprites.length > 0) {
            this.triangleSprites.forEach(triangle => {
                this.physics.add.collider(skull.sprite, triangle, (skullSprite, triangle) => {
                    this.handleTriangleCollision(skullSprite, triangle);
                });
            });
        }
    }

    setupInput() {
        // Flag to track if gameobjectdown fired this click
        // Phaser guarantees gameobjectdown fires BEFORE pointerdown
        this.clickedGameObject = false;

        this.input.on('gameobjectdown', (pointer, gameObject) => {
            this.clickedGameObject = true;

            // Check if this is a manipulator UI element - if so, ignore it completely
            if (this.flipperManipulator && this.flipperManipulator.isActive) {
                if (gameObject === this.flipperManipulator.rotationHandle ||
                    gameObject === this.flipperManipulator.flipButton ||
                    gameObject === this.flipperManipulator.outline ||
                    gameObject === this.flipperManipulator.rotationIcon ||
                    gameObject === this.flipperManipulator.flipIcon) {
                    return; // Ignore clicks on manipulator UI
                }
            }

            if (this.triangleManipulator && this.triangleManipulator.isActive) {
                if (gameObject === this.triangleManipulator.rotationHandle ||
                    gameObject === this.triangleManipulator.outline ||
                    gameObject === this.triangleManipulator.rotationIcon) {
                    return; // Ignore clicks on manipulator UI
                }
            }

            if (gameObject.texture) {
                if (gameObject.texture.key.startsWith('skull_')) {
                    this.handleSkullClick(gameObject);
                } else if (gameObject.texture.key === 'bigskull') {
                    this.handleSkullClick(gameObject);
                } else if (gameObject.texture.key === 'flipper') {
                    const flipper = this.flipperSprites.find(f => f === gameObject);
                    if (flipper) {
                        this.deselectTriangle();
                        this.selectFlipper(flipper);
                    }
                } else if (gameObject.texture.key === 'triangle') {
                    const triangle = this.triangleSprites.find(t => t === gameObject);
                    if (triangle) {
                        this.deselectFlipper();
                        this.selectTriangle(triangle);
                    }
                } else {
                    // Clicked some other game object (basket, bumper, etc.) - deselect
                    this.deselectFlipper();
                    this.deselectTriangle();
                }
            }
        });

        // Handle clicks on empty space (when no game object was clicked)
        this.input.on('pointerdown', (pointer) => {
            // If gameobjectdown fired, the flag will be true
            if (!this.clickedGameObject) {
                // Clicked empty space - check if clicked controls
                let clickedControls = false;
                if (this.flipperManipulator && this.flipperManipulator.isActive) {
                    clickedControls = Phaser.Geom.Circle.Contains(
                        new Phaser.Geom.Circle(
                            this.flipperManipulator.rotationHandle.x,
                            this.flipperManipulator.rotationHandle.y,
                            12
                        ),
                        pointer.x,
                        pointer.y
                    ) || Phaser.Geom.Circle.Contains(
                        new Phaser.Geom.Circle(
                            this.flipperManipulator.flipButton.x,
                            this.flipperManipulator.flipButton.y,
                            12
                        ),
                        pointer.x,
                        pointer.y
                    );
                }

                if (!clickedControls && this.triangleManipulator && this.triangleManipulator.isActive) {
                    clickedControls = Phaser.Geom.Circle.Contains(
                        new Phaser.Geom.Circle(
                            this.triangleManipulator.rotationHandle.x,
                            this.triangleManipulator.rotationHandle.y,
                            12
                        ),
                        pointer.x,
                        pointer.y
                    );
                }

                if (!clickedControls) {
                    this.deselectFlipper();
                    this.deselectTriangle();
                }
            }

            // Reset flag for next click
            this.clickedGameObject = false;
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
        this.showBumperEffect(bumper);
    }

    handleFlipperCollision(skullSprite, flipper) {
        const skullObj = this.skullObjects.find(c => c.sprite === skullSprite);
        if (!skullObj || !skullObj.canHitFlipper(flipper)) return;

        // Calculate force based on flipper's actual rotation angle
        const flipperAngle = flipper.rotation;
        const forceMagnitude = 500;

        // Force perpendicular to flipper surface (normal vector)
        // Adding 90 degrees (PI/2) to get perpendicular direction
        const forceAngle = flipperAngle + Math.PI / 2;

        const horizontalForce = Math.cos(forceAngle) * forceMagnitude * (flipper.scaleX > 0 ? 1 : -1);
        const verticalForce = Math.sin(forceAngle) * forceMagnitude;

        skullObj.hitFlipper(flipper, horizontalForce, verticalForce);
        this.showFlipperEffect(flipper);
    }

    handleTriangleCollision(skullSprite, triangle) {
        // Triangles are static - skulls just roll off them naturally
        // No force application needed
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
        const bonusText = this.add.text(x, y - 30, `+${value}!`, {
            fontFamily: 'Arial Black',
            fontSize: value > 10 ? 36 : 24,
            color: '#ffffff',
            stroke: '#000000',
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
            color: '#ffffff',
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
            color: '#ffffff',
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
        // Use base angle to prevent drift
        const trueAngle = flipper.baseAngle;
        const swingOffset = flipper.facingLeft ? -20 : 20;

        this.tweens.add({
            targets: flipper,
            angle: trueAngle + swingOffset,
            duration: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: flipper,
                    angle: trueAngle,
                    duration: 200,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        // Ensure exact return to base angle
                        flipper.setAngle(trueAngle);
                    }
                });
            }
        });

        GameUtils.createParticleEffect(this, flipper.x, flipper.y, 0xE87461, 5);

        const flipText = this.add.text(flipper.x, flipper.y + 20, 'FLIP!', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#ffffff',
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

        // Update manipulator UI to follow flipper
        if (this.flipperManipulator && this.flipperManipulator.isActive) {
            this.flipperManipulator.updateUI();
        }

        // Update manipulator UI to follow triangle
        if (this.triangleManipulator && this.triangleManipulator.isActive) {
            this.triangleManipulator.updateUI();
        }

        // Safety check: ensure flippers maintain correct scale and angle when not tweening
        this.flipperSprites.forEach(flipper => {
            if (!this.tweens.isTweening(flipper)) {
                if (flipper.baseScaleX !== undefined &&
                    (flipper.scaleX !== flipper.baseScaleX || flipper.scaleY !== 1)) {
                    flipper.setScale(flipper.baseScaleX, 1);
                }
                if (flipper.baseAngle !== undefined && flipper.angle !== flipper.baseAngle) {
                    flipper.setAngle(flipper.baseAngle);
                }
            }
        });

        // Safety check: ensure triangles maintain correct angle when not tweening
        this.triangleSprites.forEach(triangle => {
            if (!this.tweens.isTweening(triangle)) {
                if (triangle.baseAngle !== undefined && triangle.angle !== triangle.baseAngle) {
                    triangle.setAngle(triangle.baseAngle);
                }
            }
        });
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
        if (this.flipperManipulator) {
            this.flipperManipulator.destroy();
            this.flipperManipulator = null;
        }
        if (this.triangleManipulator) {
            this.triangleManipulator.destroy();
            this.triangleManipulator = null;
        }
        this.skullObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
        this.flipperSprites = [];
        this.triangleSprites = [];
    }
}