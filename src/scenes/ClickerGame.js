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
        this.isGameOver = false;
    }

    initializeArrays() {
        this.skullObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
        this.flipperSprites = [];
        this.triangleSprites = [];
        this.boosterSprites = [];
        this.shrinkerSprites = [];
        this.duplicatorSprites = [];
        this.selectedFlipper = null;
        this.flipperManipulator = null;
        this.selectedTriangle = null;
        this.triangleManipulator = null;
        this.selectedBooster = null;
        this.boosterManipulator = null;
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

        // Set initial time scale based on fast forward state
        const fastForwardEnabled = this.registry.get('fastForwardEnabled');
        const scale = fastForwardEnabled ? 2 : 1;
        this.time.timeScale = scale;
        if (this.matter && this.matter.world) {
            this.matter.world.engine.timing.timeScale = scale;
        }

        // Start booster update loop
        this.startBoosterUpdate();
    }

    startBoosterUpdate() {
        // Check for booster and shrinker overlaps every physics frame
        this.boosterUpdateTimer = this.time.addEvent({
            delay: 16, // ~60fps
            callback: () => this.updateBoostersAndShrinkers(),
            callbackScope: this,
            loop: true
        });
    }

    updateBoostersAndShrinkers() {
        if (this.isGameOver) return;

        // Check each skull against each booster
        this.boosterSprites.forEach(booster => {
            if (!booster || !booster.body) return;

            this.skullObjects.forEach(skullObj => {
                if (!skullObj || !skullObj.sprite || !skullObj.sprite.body) return;

                // Check if skull overlaps with booster
                const collision = this.matter.overlap(skullObj.sprite.body, [booster.body]);

                if (collision) {
                    this.handleBoosterCollision(skullObj.sprite, booster);
                }
            });
        });

        // Check each skull against each shrinker
        this.shrinkerSprites.forEach(shrinker => {
            if (!shrinker || !shrinker.body) return;

            this.skullObjects.forEach(skullObj => {
                if (!skullObj || !skullObj.sprite || !skullObj.sprite.body) return;

                // Check if skull overlaps with shrinker
                const collision = this.matter.overlap(skullObj.sprite.body, [shrinker.body]);

                if (collision) {
                    this.handleShrinkerCollision(skullObj, shrinker);
                }
            });
        });

        // Check each skull against each duplicator
        this.duplicatorSprites.forEach(duplicator => {
            if (!duplicator || !duplicator.body) return;

            this.skullObjects.forEach(skullObj => {
                if (!skullObj || !skullObj.sprite || !skullObj.sprite.body) return;

                // Check if skull overlaps with duplicator
                const collision = this.matter.overlap(skullObj.sprite.body, [duplicator.body]);

                if (collision) {
                    this.handleDuplicatorCollision(skullObj, duplicator);
                }
            });
        });
    }

    setupWorld() {
        const bg = this.add.image(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2, 'game_background');
        // Scale to cover the entire screen
        const scaleX = GAME_CONFIG.WORLD_WIDTH / bg.width;
        const scaleY = GAME_CONFIG.WORLD_HEIGHT / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        this.add.image(512, GAME_CONFIG.FLOOR_Y, 'floor').setOrigin(0.5, 0);

        // Create dark grey sidebar
        const sidebar = this.add.graphics();
        sidebar.fillStyle(0x333333);
        sidebar.fillRect(GAME_CONFIG.PLAY_AREA_WIDTH, 0, GAME_CONFIG.SIDEBAR_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        // Create Matter world bounds (walls)
        // Make walls tall enough to contain balls from spawn area (-500) to floor (730)
        const wallHeight = 1300; // From y=-550 to y=750
        const wallCenterY = (-550 + 750) / 2; // y=100

        // Left wall
        this.matter.add.rectangle(-25, wallCenterY, 50, wallHeight, {
            isStatic: true,
            label: 'wall',
            restitution: 0.8
        });

        // Right wall (at play area boundary)
        this.matter.add.rectangle(GAME_CONFIG.PLAY_AREA_WIDTH + 25, wallCenterY, 50, wallHeight, {
            isStatic: true,
            label: 'wall',
            restitution: 0.8
        });

        // Top wall (far above screen to prevent balls escaping but allow spawning)
        this.matter.add.rectangle(GAME_CONFIG.PLAY_AREA_WIDTH / 2, -550, GAME_CONFIG.PLAY_AREA_WIDTH, 50, {
            isStatic: true,
            label: 'wall',
            restitution: 0.8
        });

        // Bottom wall/floor (at FLOOR_Y position)
        this.matter.add.rectangle(GAME_CONFIG.PLAY_AREA_WIDTH / 2, GAME_CONFIG.FLOOR_Y + 50, GAME_CONFIG.PLAY_AREA_WIDTH, 100, {
            isStatic: true,
            label: 'floor',
            restitution: 0.3
        });
    }

    createUI() {
        const sidebarX = GAME_CONFIG.PLAY_AREA_WIDTH + 30;
        const textStyle = {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 4
        };

        this.roundScoreText = this.add.text(sidebarX, 100, `Round: ${this.roundScore}`, textStyle).setDepth(1);
        this.totalSkullsText = this.add.text(sidebarX, 160, `Total: ${this.totalSkulls}`, textStyle).setDepth(1);
        this.maxSkullsText = this.add.text(sidebarX, 220, `Max: ${this.maxSkulls}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setDepth(1);
        this.timeText = this.add.text(sidebarX, 40, `Time: ${this.gameTime}`, textStyle).setDepth(1);

        // Auto-start UI (only show if unlocked)
        if (this.registry.get('autoStartUnlocked')) {
            this.createAutoStartUI();
        }

        // Fast Forward button (only show if Skeleton Warrior is unlocked)
        const unlockedItems = this.registry.get('unlockedItems');
        if (unlockedItems.includes('Skeleton Warrior')) {
            this.createFastForwardButton();
        }
    }

    createFastForwardButton() {
        const topRightX = GAME_CONFIG.WORLD_WIDTH - 30;
        const topRightY = this.registry.get('autoStartUnlocked') ? 70 : 30;

        // Button background
        const buttonWidth = 80;
        const buttonHeight = 30;
        this.fastForwardButton = this.add.graphics();
        this.updateFastForwardButton();

        // Label
        this.fastForwardLabel = this.add.text(topRightX - 40, topRightY + 15, '2X', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2);

        // Make button interactive
        const hitArea = new Phaser.Geom.Rectangle(topRightX - buttonWidth, topRightY, buttonWidth, buttonHeight);
        this.fastForwardButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.fastForwardButton.on('pointerdown', () => this.toggleFastForward());
    }

    updateFastForwardButton() {
        if (!this.fastForwardButton) return;

        const topRightX = GAME_CONFIG.WORLD_WIDTH - 30;
        const topRightY = this.registry.get('autoStartUnlocked') ? 70 : 30;
        const buttonWidth = 80;
        const buttonHeight = 30;

        this.fastForwardButton.clear();

        // Color based on state
        const isEnabled = this.registry.get('fastForwardEnabled');
        this.fastForwardButton.fillStyle(isEnabled ? 0x00FF00 : 0x808080);
        this.fastForwardButton.fillRoundedRect(topRightX - buttonWidth, topRightY, buttonWidth, buttonHeight, 8);
        this.fastForwardButton.lineStyle(3, 0x000000);
        this.fastForwardButton.strokeRoundedRect(topRightX - buttonWidth, topRightY, buttonWidth, buttonHeight, 8);
        this.fastForwardButton.setDepth(2);
    }

    toggleFastForward() {
        const current = this.registry.get('fastForwardEnabled');
        this.registry.set('fastForwardEnabled', !current);
        this.updateFastForwardButton();

        // Update time scale for timers and physics
        const scale = !current ? 2 : 1;
        this.time.timeScale = scale;
        if (this.matter && this.matter.world) {
            this.matter.world.engine.timing.timeScale = scale;
        }
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

        // Make checkbox interactive
        const hitArea = new Phaser.Geom.Rectangle(topRightX - checkboxSize - 130, topRightY, checkboxSize + 130, checkboxSize);
        this.autoStartCheckbox.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        this.autoStartCheckbox.on('pointerdown', () => this.toggleAutoStart());
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
    }

    createGameObjects() {
        this.createBaskets();
        this.createBumpers();
        this.createFlippers();
        this.createTriangles();
        this.createBoosters();
        this.createShrinkers();
        this.createDuplicators();
    }

    createBaskets() {
        const basketPositions = this.registry.get('baskets');
        basketPositions.forEach(pos => {
            const basket = this.add.image(pos.x, pos.y, 'basket');
            basket.setInteractive({ draggable: true });

            // Create Matter body - semicircle/arc shape approximated with rectangle
            this.matter.add.gameObject(basket, {
                shape: { type: 'rectangle', width: 70, height: 40 },
                isStatic: true,
                label: 'basket',
                isSensor: true  // Baskets are sensors (trigger zones)
            });

            basket.basket = true;  // Identification property
            this.basketSprites.push(basket);

            this.setupBasketDragging(basket, pos);
            basket.on('pointerdown', () => this.clickBasket(basket));
        });
    }

    setupBasketDragging(basket, originalPos) {
        let lastValidX = originalPos.x;

        basket.on('drag', (pointer, dragX, dragY) => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver || !basket.body) return;

            const basketPositions = this.registry.get('baskets');
            const index = this.basketSprites.indexOf(basket);

            // Allow any position - no overlap checking
            basket.x = dragX;
            basket.y = originalPos.y;
            this.matter.body.setPosition(basket.body, { x: dragX, y: originalPos.y });
            lastValidX = dragX;

            if (index !== -1 && basketPositions[index]) {
                basketPositions[index].x = dragX;
                this.registry.set('baskets', basketPositions);
            }
        });

        basket.on('dragend', () => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver) return;

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

            // Create Matter body - circular
            this.matter.add.gameObject(bumper, {
                shape: { type: 'circle', radius: 20 },
                isStatic: true,
                label: 'bumper',
                restitution: 0.9  // Bouncy, custom collision handler applies extra force
            });

            bumper.bumper = true;  // Identification property
            this.bumperSprites.push(bumper);

            this.setupBumperDragging(bumper);
            this.addBumperAnimation(bumper);
        });
    }

    setupBumperDragging(bumper) {
        let lastValidX = bumper.x;
        let lastValidY = bumper.y;

        bumper.on('drag', (pointer, dragX, dragY) => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver || !bumper.body) return;

            const bumperPositions = this.registry.get('bumpers');
            const index = this.bumperSprites.indexOf(bumper);

            // Allow any position - no overlap checking
            bumper.x = dragX;
            bumper.y = dragY;
            this.matter.body.setPosition(bumper.body, { x: dragX, y: dragY });
            lastValidX = dragX;
            lastValidY = dragY;

            if (index !== -1 && bumperPositions[index]) {
                bumperPositions[index].x = dragX;
                bumperPositions[index].y = dragY;
                this.registry.set('bumpers', bumperPositions);
            }
        });

        bumper.on('dragend', () => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver) return;

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

            // Create Matter body - rectangle that rotates with sprite
            this.matter.add.gameObject(flipper, {
                shape: { type: 'rectangle', width: 60, height: 15 },
                isStatic: true,
                label: 'flipper'
            });

            // Set origin based on facing direction
            if (pos.facingLeft) {
                flipper.setOrigin(0.2, 0.5);
            } else {
                flipper.setOrigin(0.8, 0.5);
            }

            // Load scaleX if flipper was flipped (default to 1 if not set)
            const scaleX = pos.scaleX !== undefined ? pos.scaleX : 1;
            flipper.setScale(scaleX, 1);  // setScale updates both sprite and Matter body

            // Store the base scale - this is the "true" scale without animations
            flipper.baseScaleX = scaleX;

            // Load saved angle or use default (in degrees)
            const angle = pos.angle !== undefined ? pos.angle : (pos.facingLeft ? 30 : -30);
            flipper.setRotation(Phaser.Math.DegToRad(angle));  // setRotation updates both sprite and body

            // Store the base angle - this is the "true" angle without animations
            flipper.baseAngle = angle;

            flipper.facingLeft = pos.facingLeft;
            flipper.flipper = true;  // Identification property
            this.flipperSprites.push(flipper);

            this.setupFlipperDragging(flipper);
        });
    }

    createTriangles() {
        const trianglePositions = this.registry.get('triangles');
        trianglePositions.forEach(pos => {
            const triangle = this.add.image(pos.x, pos.y, 'triangle');
            triangle.setInteractive({ draggable: true });

            // Create Matter body - rectangle (board) that rotates with sprite!
            this.matter.add.gameObject(triangle, {
                shape: { type: 'rectangle', width: 120, height: 60 },
                isStatic: true,
                label: 'triangle'
            });

            // Load saved angle or use default (pointing up)
            const angle = pos.angle !== undefined ? pos.angle : 0;
            triangle.setRotation(Phaser.Math.DegToRad(angle));  // setRotation updates both sprite and body

            // Store the base angle - this is the "true" angle without animations
            triangle.baseAngle = angle;

            triangle.triangle = true;  // Identification property
            this.triangleSprites.push(triangle);

            this.setupTriangleDragging(triangle);
        });
    }

    createBoosters() {
        const boosterPositions = this.registry.get('boosters');
        boosterPositions.forEach(pos => {
            const booster = this.add.image(pos.x, pos.y, 'booster');
            booster.setInteractive({ draggable: true });

            // Create Matter body - sensor rectangle (pass-through)
            this.matter.add.gameObject(booster, {
                shape: { type: 'rectangle', width: 140, height: 30 },
                isStatic: true,
                label: 'booster',
                isSensor: true  // Sensor so skulls pass through
            });

            // Load saved angle or use default (0 = pointing right)
            const angle = pos.angle !== undefined ? pos.angle : 0;
            booster.setRotation(Phaser.Math.DegToRad(angle));

            // Store the base angle
            booster.baseAngle = angle;

            booster.booster = true;  // Identification property
            this.boosterSprites.push(booster);

            this.setupBoosterDragging(booster);
        });
    }

    createShrinkers() {
        const shrinkerPositions = this.registry.get('shrinkers');
        shrinkerPositions.forEach(pos => {
            const shrinker = this.add.image(pos.x, pos.y, 'shrinker');
            shrinker.setInteractive({ draggable: true });

            // Create Matter body - sensor circle (pass-through)
            this.matter.add.gameObject(shrinker, {
                shape: { type: 'circle', radius: 20 },
                isStatic: true,
                label: 'shrinker',
                isSensor: true  // Sensor so skulls pass through
            });

            shrinker.shrinker = true;  // Identification property
            this.shrinkerSprites.push(shrinker);

            this.setupShrinkerDragging(shrinker);
        });
    }

    createDuplicators() {
        const duplicatorPositions = this.registry.get('duplicators');
        duplicatorPositions.forEach(pos => {
            const duplicator = this.add.image(pos.x, pos.y, 'duplicator');
            duplicator.setInteractive({ draggable: true });

            // Create Matter body - sensor circle (pass-through)
            this.matter.add.gameObject(duplicator, {
                shape: { type: 'circle', radius: 20 },
                isStatic: true,
                label: 'duplicator',
                isSensor: true  // Sensor so skulls pass through
            });

            duplicator.duplicator = true;  // Identification property
            this.duplicatorSprites.push(duplicator);

            this.setupDuplicatorDragging(duplicator);
        });
    }

    setupFlipperDragging(flipper) {
        let lastValidX = flipper.x;
        let lastValidY = flipper.y;
        let isDragging = false;

        // Track when drag actually starts
        flipper.on('dragstart', () => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver) return;
            isDragging = true;
            lastValidX = flipper.x;
            lastValidY = flipper.y;
        });

        flipper.on('drag', (pointer, dragX, dragY) => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver || !flipper.body) return;

            const flipperPositions = this.registry.get('flippers');
            const index = this.flipperSprites.indexOf(flipper);

            // Allow any position - no overlap checking
            flipper.x = dragX;
            flipper.y = dragY;
            this.matter.body.setPosition(flipper.body, { x: dragX, y: dragY });
            lastValidX = dragX;
            lastValidY = dragY;

            if (index !== -1 && flipperPositions[index]) {
                flipperPositions[index].x = dragX;
                flipperPositions[index].y = dragY;
                this.registry.set('flippers', flipperPositions);
            }
        });

        flipper.on('dragend', () => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver) return;

            // Only animate if we actually dragged
            if (isDragging) {
                const trueAngle = flipper.baseAngle;
                const wobbleOffset = flipper.facingLeft ? 10 : -10;

                // Simple angle-only animation - use baseAngle
                // Create a custom tween object to animate rotation (in radians)
                const startRotation = flipper.rotation;
                const wobbleRotation = Phaser.Math.DegToRad(trueAngle + wobbleOffset);
                const endRotation = Phaser.Math.DegToRad(trueAngle);

                this.tweens.add({
                    targets: { value: startRotation },
                    value: wobbleRotation,
                    duration: 100,
                    ease: 'Back.easeOut',
                    onUpdate: (tween) => {
                        // CRITICAL: Check game over AND body exists
                        if (this.isGameOver || !flipper.body) return;
                        const currentValue = tween.getValue();
                        flipper.setRotation(currentValue);
                    },
                    onComplete: () => {
                        // CRITICAL: Check game over BEFORE creating nested tween
                        if (this.isGameOver || !flipper.body) return;
                        this.tweens.add({
                            targets: { value: wobbleRotation },
                            value: endRotation,
                            duration: 100,
                            ease: 'Back.easeOut',
                            onUpdate: (tween) => {
                                // CRITICAL: Check game over AND body exists
                                if (this.isGameOver || !flipper.body) return;
                                const currentValue = tween.getValue();
                                flipper.setRotation(currentValue);
                            },
                            onComplete: () => {
                                // CRITICAL: Check game over AND body exists
                                if (this.isGameOver || !flipper.body) return;
                                flipper.setRotation(endRotation);
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
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver) return;
            isDragging = true;
            lastValidX = triangle.x;
            lastValidY = triangle.y;
        });

        triangle.on('drag', (pointer, dragX, dragY) => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver || !triangle.body) return;

            const trianglePositions = this.registry.get('triangles');
            const index = this.triangleSprites.indexOf(triangle);

            // Allow any position - no overlap checking
            triangle.x = dragX;
            triangle.y = dragY;
            this.matter.body.setPosition(triangle.body, { x: dragX, y: dragY });
            lastValidX = dragX;
            lastValidY = dragY;

            if (index !== -1 && trianglePositions[index]) {
                trianglePositions[index].x = dragX;
                trianglePositions[index].y = dragY;
                this.registry.set('triangles', trianglePositions);
            }

            // Update manipulator if this triangle is selected
            if (this.triangleManipulator && this.triangleManipulator.isActive && this.selectedTriangle === triangle) {
                this.triangleManipulator.updateUI();
            }
        });

        triangle.on('dragend', () => {
            // CRITICAL: Stop processing if game is over
            if (this.isGameOver) return;

            // Only create particles if we actually dragged
            if (isDragging) {
                GameUtils.createParticleEffect(this, triangle.x, triangle.y, 0xFF8C42, 4);
            }
            isDragging = false;
        });
    }

    setupBoosterDragging(booster) {
        let lastValidX = booster.x;
        let lastValidY = booster.y;
        let isDragging = false;

        booster.on('dragstart', () => {
            if (this.isGameOver) return;
            isDragging = true;
            lastValidX = booster.x;
            lastValidY = booster.y;
        });

        booster.on('drag', (pointer, dragX, dragY) => {
            if (this.isGameOver || !booster.body) return;

            const boosterPositions = this.registry.get('boosters');
            const index = this.boosterSprites.indexOf(booster);

            booster.x = dragX;
            booster.y = dragY;
            this.matter.body.setPosition(booster.body, { x: dragX, y: dragY });
            lastValidX = dragX;
            lastValidY = dragY;

            if (index !== -1 && boosterPositions[index]) {
                boosterPositions[index].x = dragX;
                boosterPositions[index].y = dragY;
                this.registry.set('boosters', boosterPositions);
            }

            // Update manipulator if this booster is selected
            if (this.boosterManipulator && this.boosterManipulator.isActive && this.selectedBooster === booster) {
                this.boosterManipulator.updateUI();
            }
        });

        booster.on('dragend', () => {
            if (this.isGameOver) return;

            if (isDragging) {
                GameUtils.createParticleEffect(this, booster.x, booster.y, 0x00FF00, 4);
            }
            isDragging = false;
        });
    }

    setupShrinkerDragging(shrinker) {
        let lastValidX = shrinker.x;
        let lastValidY = shrinker.y;
        let isDragging = false;

        shrinker.on('dragstart', () => {
            if (this.isGameOver) return;
            isDragging = true;
            lastValidX = shrinker.x;
            lastValidY = shrinker.y;
        });

        shrinker.on('drag', (pointer, dragX, dragY) => {
            if (this.isGameOver || !shrinker.body) return;

            const shrinkerPositions = this.registry.get('shrinkers');
            const index = this.shrinkerSprites.indexOf(shrinker);

            shrinker.x = dragX;
            shrinker.y = dragY;
            this.matter.body.setPosition(shrinker.body, { x: dragX, y: dragY });
            lastValidX = dragX;
            lastValidY = dragY;

            if (index !== -1 && shrinkerPositions[index]) {
                shrinkerPositions[index].x = dragX;
                shrinkerPositions[index].y = dragY;
                this.registry.set('shrinkers', shrinkerPositions);
            }
        });

        shrinker.on('dragend', () => {
            if (this.isGameOver) return;

            if (isDragging) {
                GameUtils.createParticleEffect(this, shrinker.x, shrinker.y, 0xFF69B4, 4);
            }
            isDragging = false;
        });
    }

    setupDuplicatorDragging(duplicator) {
        let lastValidX = duplicator.x;
        let lastValidY = duplicator.y;
        let isDragging = false;

        duplicator.on('dragstart', () => {
            if (this.isGameOver) return;
            isDragging = true;
            lastValidX = duplicator.x;
            lastValidY = duplicator.y;
        });

        duplicator.on('drag', (pointer, dragX, dragY) => {
            if (this.isGameOver || !duplicator.body) return;

            const duplicatorPositions = this.registry.get('duplicators');
            const index = this.duplicatorSprites.indexOf(duplicator);

            duplicator.x = dragX;
            duplicator.y = dragY;
            this.matter.body.setPosition(duplicator.body, { x: dragX, y: dragY });
            lastValidX = dragX;
            lastValidY = dragY;

            if (index !== -1 && duplicatorPositions[index]) {
                duplicatorPositions[index].x = dragX;
                duplicatorPositions[index].y = dragY;
                this.registry.set('duplicators', duplicatorPositions);
            }
        });

        duplicator.on('dragend', () => {
            if (this.isGameOver) return;

            if (isDragging) {
                GameUtils.createParticleEffect(this, duplicator.x, duplicator.y, 0x4169E1, 4);
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

    selectBooster(booster) {
        // Deselect previous booster if any
        if (this.selectedBooster !== booster) {
            this.deselectBooster();
        }

        this.selectedBooster = booster;

        // Create manipulator if it doesn't exist
        if (!this.boosterManipulator) {
            this.boosterManipulator = new BoosterManipulator(this, booster);
        } else {
            this.boosterManipulator.booster = booster;
        }

        this.boosterManipulator.show();
    }

    deselectBooster() {
        if (this.boosterManipulator) {
            this.boosterManipulator.hide();
        }
        this.selectedBooster = null;
    }

    setupPhysics() {
        // Matter Physics uses global collision events
        // Store reference so we can properly remove it later
        this.collisionHandler = (event) => {
            // CRITICAL: Stop processing collisions if game is over
            if (this.isGameOver) return;

            // CRITICAL: Wrap entire collision handling in try-catch
            try {
                event.pairs.forEach(pair => {
                    const { bodyA, bodyB } = pair;

                    // Safety check: bodies must exist
                    if (!bodyA || !bodyB) return;

                    // Get game objects from bodies
                    const gameObjectA = bodyA.gameObject;
                    const gameObjectB = bodyB.gameObject;

                    if (!gameObjectA || !gameObjectB) return;

                    // Check for skull collisions
                    const skull = gameObjectA.skull || gameObjectB.skull;
                    const other = skull === gameObjectA.skull ? gameObjectB : gameObjectA;

                    if (skull) {
                        // Skull hit basket (sensor collision)
                        if (other.basket) {
                            this.handleBasketCollection(skull.sprite, other);
                        }
                        // Skull hit bumper
                        else if (other.bumper) {
                            this.handleBumperCollision(skull.sprite, other);
                        }
                        // Skull hit flipper
                        else if (other.flipper) {
                            this.handleFlipperCollision(skull.sprite, other);
                        }
                        // Skull hit triangle/square (no effect - just bounces)
                        else if (other.triangle) {
                            this.handleTriangleCollision(skull.sprite, other);
                        }
                        // Skull hit booster (sensor collision)
                        else if (other.booster) {
                            this.handleBoosterCollision(skull.sprite, other);
                        }
                    }
                });
            } catch (e) {
                // Silently ignore collision errors during cleanup
                // This prevents crashes when bodies are being destroyed
            }
        };

        // Register the collision handler
        this.matter.world.on('collisionstart', this.collisionHandler);
    }

    setupCollisionForSkull(skull) {
        // In Matter Physics, collisions are handled globally in setupPhysics()
        // This function is kept for compatibility but does nothing
    }

    setupInput() {
        // Flag to track if gameobjectdown fired this click
        // Phaser guarantees gameobjectdown fires BEFORE pointerdown
        this.clickedGameObject = false;

        // Add P key listener for testing
        this.input.keyboard.on('keydown-P', () => {
            const currentTotal = this.registry.get('totalSkulls');
            this.registry.set('totalSkulls', currentTotal + 100);
            this.totalSkulls = currentTotal + 100;
            this.updateScoreDisplay();
        });

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

            if (this.boosterManipulator && this.boosterManipulator.isActive) {
                if (gameObject === this.boosterManipulator.rotationHandle ||
                    gameObject === this.boosterManipulator.outline ||
                    gameObject === this.boosterManipulator.rotationIcon) {
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
                        this.deselectBooster();
                        this.selectFlipper(flipper);
                    }
                } else if (gameObject.texture.key === 'triangle') {
                    const triangle = this.triangleSprites.find(t => t === gameObject);
                    if (triangle) {
                        this.deselectFlipper();
                        this.deselectBooster();
                        this.selectTriangle(triangle);
                    }
                } else if (gameObject.texture.key === 'booster') {
                    const booster = this.boosterSprites.find(b => b === gameObject);
                    if (booster) {
                        this.deselectFlipper();
                        this.deselectTriangle();
                        this.selectBooster(booster);
                    }
                } else {
                    // Clicked some other game object (basket, bumper, etc.) - deselect
                    this.deselectFlipper();
                    this.deselectTriangle();
                    this.deselectBooster();
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

                if (!clickedControls && this.boosterManipulator && this.boosterManipulator.isActive) {
                    clickedControls = Phaser.Geom.Circle.Contains(
                        new Phaser.Geom.Circle(
                            this.boosterManipulator.rotationHandle.x,
                            this.boosterManipulator.rotationHandle.y,
                            12
                        ),
                        pointer.x,
                        pointer.y
                    );
                }

                if (!clickedControls) {
                    this.deselectFlipper();
                    this.deselectTriangle();
                    this.deselectBooster();
                }
            }

            // Reset flag for next click
            this.clickedGameObject = false;
        });
    }

    spawnInitialSkulls() {
        for (let i = 0; i < this.maxSkulls; i++) {
            // Stagger spawn timing slightly so they don't all clump together
            this.time.delayedCall(i * 100, () => {
                this.spawnSkull();
            });
        }
    }

    startTimer() {
        this.timer = this.time.addEvent({
            delay: this.gameTime * 1000,
            callback: () => this.gameOver()
        });
    }

    spawnSkull(isBig = false) {
        // Spawn across the width of the play area
        const x = Phaser.Math.Between(100, GAME_CONFIG.PLAY_AREA_WIDTH - 100);
        // Spawn above the screen (all negative Y values)
        const y = Phaser.Math.Between(-100, -400);
        const value = isBig ? 10 : 1;

        const skull = new Skull(this, x, y, value, isBig);
        this.skullObjects.push(skull);

        this.setupCollisionForSkull(skull);
    }

    handleSkullClick(sprite) {
        // CRITICAL: Check if sprite still exists
        if (!sprite || !sprite.body) return;

        const skullObj = this.skullObjects.find(c => c.sprite === sprite);
        if (!skullObj || !skullObj.collect()) return;

        const prestigeMultiplier = this.registry.get('prestigeMultiplier');
        const displayValue = skullObj.value * prestigeMultiplier;

        this.addScore(skullObj.value);
        this.showBonusText(sprite.x, sprite.y, displayValue);
        this.updateScoreDisplay();
        this.removeSkullFromArray(skullObj);

        if (this.skullObjects.length < this.maxSkulls) {
            this.spawnSkull();
        }
    }

    handleBasketCollection(skullSprite, basket) {
        // CRITICAL: Check if basket still exists
        if (!basket || !basket.body) return;

        const skullObj = this.skullObjects.find(c => c.sprite === skullSprite);
        if (!skullObj || !skullObj.collectInBasket(basket)) return;

        const prestigeMultiplier = this.registry.get('prestigeMultiplier');
        const displayValue = skullObj.value * prestigeMultiplier;

        this.addScore(skullObj.value);
        this.showBasketBonusText(basket.x, basket.y, displayValue);
        this.updateScoreDisplay();
        this.removeSkullFromArray(skullObj);

        if (this.skullObjects.length < this.maxSkulls) {
            this.spawnSkull();
        }
    }

    handleBumperCollision(skullSprite, bumper) {
        // CRITICAL: Check if bumper still exists
        if (!bumper || !bumper.body) return;

        const skullObj = this.skullObjects.find(c => c.sprite === skullSprite);
        if (!skullObj || !skullObj.canHitBumper(bumper)) return;

        skullObj.hitBumper(bumper);
        this.showBumperEffect(bumper);
    }

    handleFlipperCollision(skullSprite, flipper) {
        // CRITICAL: Check if flipper still exists
        if (!flipper || !flipper.body) return;

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

    handleBoosterCollision(skullSprite, booster) {
        // CRITICAL: Check if booster still exists
        if (!booster || !booster.body) return;

        const skullObj = this.skullObjects.find(c => c.sprite === skullSprite);
        if (!skullObj || !skullObj.sprite || !skullObj.sprite.body) return;

        // Apply momentum in the direction of the booster's arrow
        const boosterAngle = booster.rotation;
        const forceMagnitude = 0.025;  // Moderate continuous force

        const forceX = Math.cos(boosterAngle) * forceMagnitude;
        const forceY = Math.sin(boosterAngle) * forceMagnitude;

        // Apply force to skull body using Matter.js directly
        this.matter.body.applyForce(
            skullObj.sprite.body,
            { x: skullObj.sprite.x, y: skullObj.sprite.y },
            { x: forceX, y: forceY }
        );

        // Visual effect (only show occasionally to avoid spam)
        if (!booster.lastEffectTime || this.time.now - booster.lastEffectTime > 200) {
            GameUtils.createParticleEffect(this, booster.x, booster.y, 0x00FF00, 4);
            booster.lastEffectTime = this.time.now;
        }
    }

    handleShrinkerCollision(skullObj, shrinker) {
        // CRITICAL: Check if shrinker still exists
        if (!shrinker || !shrinker.body) return;
        if (!skullObj || !skullObj.sprite || !skullObj.sprite.body) return;

        // Initialize shrinking tracking if not exists
        if (!skullObj.shrinkersApplied) {
            skullObj.shrinkersApplied = new Set();
        }

        // Check if this shrinker already affected this skull
        const shrinkerId = this.shrinkerSprites.indexOf(shrinker);
        if (skullObj.shrinkersApplied.has(shrinkerId)) return;

        // For big skulls, stop any pulsing tweens first
        if (skullObj.isBig) {
            this.tweens.getTweensOf(skullObj.sprite).forEach(tween => tween.remove());
        }

        // Calculate new scale (reduce by 10%, minimum 10% of original)
        const currentScale = skullObj.sprite.scaleX;
        const newScale = Math.max(0.1, currentScale * 0.9);

        // Apply shrinking
        skullObj.sprite.setScale(newScale);

        // For big skulls, restart pulsing tween at new scale
        if (skullObj.isBig) {
            this.tweens.add({
                targets: skullObj.sprite,
                scaleX: newScale * 1.2,
                scaleY: newScale * 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Mark this shrinker as applied
        skullObj.shrinkersApplied.add(shrinkerId);

        // Visual effect
        GameUtils.createParticleEffect(this, shrinker.x, shrinker.y, 0xFF69B4, 6);
    }

    handleDuplicatorCollision(skullObj, duplicator) {
        // CRITICAL: Check if duplicator still exists
        if (!duplicator || !duplicator.body) return;
        if (!skullObj || !skullObj.sprite || !skullObj.sprite.body) return;

        // Initialize duplication tracking if not exists
        if (!skullObj.duplicatorsApplied) {
            skullObj.duplicatorsApplied = new Set();
        }

        // Check if this duplicator already affected this skull
        const duplicatorId = this.duplicatorSprites.indexOf(duplicator);
        if (skullObj.duplicatorsApplied.has(duplicatorId)) return;

        // Create a clone at the same position
        const clone = new Skull(this, skullObj.sprite.x, skullObj.sprite.y, skullObj.value, skullObj.isBig);

        // Clone inherits the same scale as the original
        clone.sprite.setScale(skullObj.sprite.scaleX);

        // Clone inherits the shrinkersApplied Set (copy it)
        if (skullObj.shrinkersApplied) {
            clone.shrinkersApplied = new Set(skullObj.shrinkersApplied);
        }

        // Clone inherits the duplicatorsApplied Set from parent (copy it)
        // This ensures the clone AND its descendants cannot use the parent duplicator
        if (skullObj.duplicatorsApplied) {
            clone.duplicatorsApplied = new Set(skullObj.duplicatorsApplied);
        } else {
            clone.duplicatorsApplied = new Set();
        }

        // Also add the current duplicator to the clone's set
        clone.duplicatorsApplied.add(duplicatorId);

        // For big skulls, ensure clone has pulsing animation
        if (clone.isBig) {
            this.tweens.add({
                targets: clone.sprite,
                scaleX: clone.sprite.scaleX * 1.2,
                scaleY: clone.sprite.scaleY * 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Add clone to skull objects
        this.skullObjects.push(clone);
        this.setupCollisionForSkull(clone);

        // Mark this duplicator as applied to the original skull
        skullObj.duplicatorsApplied.add(duplicatorId);

        // Visual effect
        GameUtils.createParticleEffect(this, duplicator.x, duplicator.y, 0x4169E1, 8);
    }

    clickBasket(basket) {
        // CRITICAL: Don't process if game is over or basket is destroyed
        if (this.isGameOver || !basket || !basket.body) return;

        const bonusSkulls = 5;
        const prestigeMultiplier = this.registry.get('prestigeMultiplier');
        const displayValue = bonusSkulls * prestigeMultiplier;

        this.addScore(bonusSkulls);
        this.showBasketBonusText(basket.x, basket.y - 30, displayValue);
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
        const prestigeMultiplier = this.registry.get('prestigeMultiplier');
        const actualPoints = points * prestigeMultiplier;

        this.roundScore += actualPoints;
        this.totalSkulls += actualPoints;
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
            color: '#000000',
            stroke: '#ffffff',
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
            color: '#000000',
            stroke: '#ffffff',
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
        // CRITICAL: Don't process if game is over or bumper is destroyed
        if (this.isGameOver || !bumper || !bumper.body) return;

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
            color: '#000000',
            stroke: '#ffffff',
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
        // CRITICAL: Don't process if game is over or flipper is destroyed
        if (this.isGameOver || !flipper || !flipper.body) return;

        // Use base angle to prevent drift
        const trueAngle = flipper.baseAngle;
        const swingOffset = flipper.facingLeft ? -20 : 20;

        this.tweens.add({
            targets: flipper,
            angle: trueAngle + swingOffset,
            duration: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                // CRITICAL: Check game over BEFORE creating nested tween
                if (this.isGameOver || !flipper || !flipper.body) return;
                this.tweens.add({
                    targets: flipper,
                    angle: trueAngle,
                    duration: 200,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        // CRITICAL: Check game over AND body exists before setting angle
                        if (this.isGameOver || !flipper || !flipper.body) return;
                        flipper.setAngle(trueAngle);
                    }
                });
            }
        });

        GameUtils.createParticleEffect(this, flipper.x, flipper.y, 0xE87461, 5);

        const flipText = this.add.text(flipper.x, flipper.y + 20, 'FLIP!', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#000000',
            stroke: '#ffffff',
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
        // CRITICAL: Stop ALL updates if game is over
        if (this.isGameOver) return;
        if (!this.timer) return;

        // Wrap entire update in try-catch to catch any remaining issues
        try {
            this.timeText.setText(`Time: ${Math.ceil(this.timer.getRemainingSeconds())}`);

            // Check for out-of-bounds skulls and clean them up
            const skullsToRemove = [];
            this.skullObjects.forEach(skull => {
            if (!skull || !skull.sprite) {
                skullsToRemove.push(skull);
                return;
            }

            // Check if skull is out of bounds
            const isOutOfBounds =
                skull.sprite.x < -100 ||
                skull.sprite.x > GAME_CONFIG.PLAY_AREA_WIDTH + 100 ||
                skull.sprite.y > GAME_CONFIG.WORLD_HEIGHT + 200;

            if (isOutOfBounds) {
                // Let skull.destroy() handle body removal safely (no duplicate removal)
                skull.destroy();
                skullsToRemove.push(skull);
            } else {
                skull.updateValueText();
                skull.update();
            }
        });

        // Remove destroyed skulls from array
        skullsToRemove.forEach(skull => {
            const index = this.skullObjects.indexOf(skull);
            if (index > -1) {
                this.skullObjects.splice(index, 1);
            }
        });

        if (!this.bigSkullSpawned && this.timer.getRemainingSeconds() <= this.gameTime / 2) {
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

        // Update manipulator UI to follow booster
        if (this.boosterManipulator && this.boosterManipulator.isActive) {
            this.boosterManipulator.updateUI();
        }

        // Safety check: ensure flippers maintain correct scale and angle when not tweening
        this.flipperSprites.forEach(flipper => {
            // CRITICAL: Skip if flipper or body is destroyed/missing
            if (!flipper || !flipper.body) return;

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
            // CRITICAL: Skip if triangle or body is destroyed/missing
            if (!triangle || !triangle.body) return;

            if (!this.tweens.isTweening(triangle)) {
                if (triangle.baseAngle !== undefined && triangle.angle !== triangle.baseAngle) {
                    triangle.setAngle(triangle.baseAngle);
                }
            }
        });

        } catch (e) {
            // Silently ignore any errors during update - prevents crashes during cleanup
            console.error('Update error:', e);
        }
    }

    gameOver() {
        // Prevent multiple calls
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Save high score first
        const currentBest = this.registry.get('highscore');
        if (this.roundScore > currentBest) {
            this.registry.set('highscore', this.roundScore);
        }

        // Reset auto-start timer for the next cycle
        this.registry.set('autoStartRemainingTime', 0);

        // CRITICAL: Disable input FIRST to prevent new events from queuing
        this.input.enabled = false;

        // CRITICAL: Remove ALL timer events to prevent delayed spawns
        if (this.time) {
            this.time.removeAllEvents();
        }

        // CRITICAL: Remove scene-level input event listeners
        this.input.off('gameobjectdown');
        this.input.off('pointerdown');

        // CRITICAL: Remove ALL game object event listeners before destroying
        this.basketSprites.forEach(basket => {
            if (basket) {
                basket.off('pointerdown');
                basket.off('drag');
                basket.off('dragend');
            }
        });

        this.bumperSprites.forEach(bumper => {
            if (bumper) {
                bumper.off('drag');
                bumper.off('dragend');
                // CRITICAL: Stop infinite idle animation tween
                this.tweens.getTweensOf(bumper).forEach(tween => tween.remove());
            }
        });

        this.flipperSprites.forEach(flipper => {
            if (flipper) {
                flipper.off('dragstart');
                flipper.off('drag');
                flipper.off('dragend');
                // CRITICAL: Stop any running tweens on flipper
                this.tweens.getTweensOf(flipper).forEach(tween => tween.remove());
            }
        });

        this.triangleSprites.forEach(triangle => {
            if (triangle) {
                triangle.off('dragstart');
                triangle.off('drag');
                triangle.off('dragend');
                // CRITICAL: Stop any running tweens on triangle
                this.tweens.getTweensOf(triangle).forEach(tween => tween.remove());
            }
        });

        // Kill all tweens AFTER removing event listeners
        if (this.tweens) {
            this.tweens.killAll();
        }

        // CRITICAL: Disable Matter physics FIRST to stop all updates
        if (this.matter && this.matter.world) {
            this.matter.world.enabled = false;
            if (this.matter.world.engine) {
                this.matter.world.engine.enabled = false;
            }
        }

        // CRITICAL: THEN stop collision detection using stored handler reference
        if (this.matter && this.matter.world && this.collisionHandler) {
            try {
                this.matter.world.off('collisionstart', this.collisionHandler);
                this.collisionHandler = null;
            } catch (e) {}
        }

        // CRITICAL: Remove all Matter bodies from world BEFORE scene transition
        // Do this manually to prevent Phaser from trying to access destroyed bodies
        try {
            this.skullObjects.forEach(skull => {
                if (skull && skull.sprite && skull.sprite.body) {
                    try {
                        this.matter.world.remove(skull.sprite.body);
                    } catch (e) {}
                }
            });
        } catch (e) {}

        // Clear object arrays (let Phaser destroy the actual sprites during scene shutdown)
        this.skullObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
        this.flipperSprites = [];
        this.triangleSprites = [];
        this.boosterSprites = [];
        this.shrinkerSprites = [];
        this.duplicatorSprites = [];

        // Transition immediately - Phaser will call shutdown() which cleans up everything
        this.scene.start('GameOver');
    }

    shutdown() {
        // Set game over flag to stop update loop
        this.isGameOver = true;

        // Disable input
        if (this.input) {
            this.input.enabled = false;
        }

        // Stop collision detection using stored handler reference
        if (this.matter && this.matter.world && this.collisionHandler) {
            try {
                this.matter.world.off('collisionstart', this.collisionHandler);
                this.collisionHandler = null;
            } catch (e) {
                // Ignore errors
            }
        }

        // CRITICAL: Disable Matter physics to prevent updates during destruction
        if (this.matter && this.matter.world) {
            this.matter.world.enabled = false;
            if (this.matter.world.engine) {
                this.matter.world.engine.enabled = false;
            }
        }

        // Kill all tweens
        if (this.tweens) {
            this.tweens.killAll();
        }

        // Clean up manipulators (they don't touch physics bodies)
        if (this.flipperManipulator) {
            this.flipperManipulator.destroy();
            this.flipperManipulator = null;
        }
        if (this.triangleManipulator) {
            this.triangleManipulator.destroy();
            this.triangleManipulator = null;
        }

        // Just clear array references, let Phaser destroy the actual objects
        this.skullObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
        this.flipperSprites = [];
        this.triangleSprites = [];
        this.boosterSprites = [];
        this.shrinkerSprites = [];
        this.duplicatorSprites = [];
    }
}