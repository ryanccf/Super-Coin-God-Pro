class Shop extends Phaser.Scene {
    constructor() {
        super('Shop');
    }

    create() {
        this.setupBackground();
        this.createHeader();
        this.createUpgradeButtons();
        this.createNavigationButtons();
        this.setupInput();
    }

    setupInput() {
        // Add P key listener for testing
        this.input.keyboard.on('keydown-P', () => {
            const currentTotal = this.registry.get('totalSkulls');
            this.registry.set('totalSkulls', currentTotal + 100);
            this.scene.restart();
        });
    }

    setupBackground() {
        this.add.image(GAME_CONFIG.WORLD_WIDTH / 2, 384, 'background');
    }

    createHeader() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const totalSkulls = this.registry.get('totalSkulls');
        const maxSkulls = this.registry.get('maxSkulls');
        const gameTime = this.registry.get('gameTime');

        this.add.text(centerX, 60, 'SKULL SHOP', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(centerX, 120, `Your Skulls: ${totalSkulls}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(centerX, 160, `Max Skulls: ${maxSkulls} | Game Time: ${gameTime}s`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createUpgradeButtons() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const upgradeColumns = this.getUpgradeData();
        const startY = 240;
        const buttonSpacing = 95;

        // Left column
        const leftX = centerX - 342;
        upgradeColumns.left.forEach((upgrade, index) => {
            const y = startY + index * buttonSpacing;
            this.createUpgradeButton(leftX, y, upgrade);
        });

        // Center column
        const centerColX = centerX;
        upgradeColumns.center.forEach((upgrade, index) => {
            const y = startY + index * buttonSpacing;
            this.createUpgradeButton(centerColX, y, upgrade);
        });

        // Right column
        const rightX = centerX + 342;
        upgradeColumns.right.forEach((upgrade, index) => {
            const y = startY + index * buttonSpacing;
            this.createUpgradeButton(rightX, y, upgrade);
        });
    }

    getUpgradeData() {
        const totalSkulls = this.registry.get('totalSkulls');
        const upgradeLevel = this.registry.get('upgradeLevel');
        const timerLevel = this.registry.get('timerLevel');
        const basketLevel = this.registry.get('basketLevel');
        const bumperLevel = this.registry.get('bumperLevel');
        const flipperLevel = this.registry.get('flipperLevel');
        const triangleLevel = this.registry.get('triangleLevel');
        const autoStartUnlocked = this.registry.get('autoStartUnlocked');
        const autoStartLevel = this.registry.get('autoStartLevel');

        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');

        const autoStartDelay = Math.max(1, 10 - autoStartLevel);
        const unlockCost = 100;
        const upgradeCost = 200;

        const prestigeLevel = this.registry.get('prestigeLevel');
        const prestigeCost = 1000000 * Math.pow(2, prestigeLevel);

        const boosterLevel = this.registry.get('boosterLevel');
        const boosters = this.registry.get('boosters');

        // Organized by column: left (4), center (2), right (4) - sorted by initial price
        return {
            left: [
                {
                    name: 'Game Time +2s',
                    cost: GameUtils.calculateUpgradeCost(25, timerLevel, 1.8),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(25, timerLevel, 1.8),
                    canPurchase: true,
                    color: 0x1F3A5F,  // Dark blue
                    action: () => this.buyTimerUpgrade()
                },
                {
                    name: 'Max Skulls +1',
                    cost: GameUtils.calculateUpgradeCost(10, upgradeLevel, 1.6),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(10, upgradeLevel, 1.6),
                    canPurchase: true,
                    color: 0x2F7F4F,  // Dark green
                    action: () => this.buySkullUpgrade()
                },
                {
                    name: autoStartUnlocked ? `Auto-Start -1s\n(${autoStartDelay}s)` : 'Unlock Auto-Start',
                    cost: autoStartUnlocked ? upgradeCost : unlockCost,
                    canAfford: totalSkulls >= (autoStartUnlocked ? upgradeCost : unlockCost),
                    canPurchase: !autoStartUnlocked || autoStartLevel < 9,
                    color: 0x7B3F00,  // Dark brown
                    action: () => this.buyAutoStart()
                },
                {
                    name: `Prestige\n2X Skull Value\n+1 Max Duplicators`,
                    cost: prestigeCost,
                    canAfford: totalSkulls >= prestigeCost,
                    canPurchase: true,
                    color: 0x9B30FF,  // Purple
                    action: () => this.buyPrestige()
                }
            ],
            center: [
                {
                    name: 'Buy Booster',
                    cost: GameUtils.calculateUpgradeCost(10, boosterLevel, 1.5),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(10, boosterLevel, 1.5),
                    canPurchase: PositionManager.findBoosterPosition(boosters, baskets, bumpers, flippers, triangles) !== null,
                    color: 0x00AA00,  // Green
                    action: () => this.buyBooster()
                },
                {
                    name: 'Buy Head Shrinker',
                    cost: GameUtils.calculateUpgradeCost(15, this.registry.get('shrinkerLevel'), 1.5),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(15, this.registry.get('shrinkerLevel'), 1.5),
                    canPurchase: PositionManager.findShrinkerPosition(this.registry.get('shrinkers'), baskets, bumpers, flippers, triangles) !== null,
                    color: 0xFF69B4,  // Pink
                    action: () => this.buyShrinker()
                },
                {
                    name: `Buy Duplicator\n(${this.registry.get('duplicators').length}/${this.registry.get('maxDuplicators')})`,
                    cost: GameUtils.calculateUpgradeCost(1000, this.registry.get('duplicatorLevel'), 1.5),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(1000, this.registry.get('duplicatorLevel'), 1.5),
                    canPurchase: this.registry.get('duplicators').length < this.registry.get('maxDuplicators') && PositionManager.findDuplicatorPosition(this.registry.get('duplicators'), baskets, bumpers, flippers, triangles) !== null,
                    color: 0x4169E1,  // Royal Blue
                    action: () => this.buyDuplicator()
                }
            ],
            right: [
                {
                    name: 'Buy Board',
                    cost: GameUtils.calculateUpgradeCost(10, triangleLevel, 1.5),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(10, triangleLevel, 1.5),
                    canPurchase: PositionManager.findTrianglePosition(triangles, baskets, bumpers, flippers) !== null,
                    color: 0xCC6600,  // Dark orange
                    action: () => this.buyTriangle()
                },
                {
                    name: 'Buy Flipper',
                    cost: GameUtils.calculateUpgradeCost(20, flipperLevel, 1.5),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(20, flipperLevel, 1.5),
                    canPurchase: PositionManager.findFlipperPosition(flippers, baskets, bumpers, triangles) !== null,
                    color: 0xE87461,  // Coral
                    action: () => this.buyFlipper()
                },
                {
                    name: 'Buy Bumper',
                    cost: GameUtils.calculateUpgradeCost(25, bumperLevel, 1.7),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(25, bumperLevel, 1.7),
                    canPurchase: PositionManager.findBumperPosition(bumpers, baskets, flippers, triangles) !== null,
                    color: 0x6B2C3E,  // Deep burgundy
                    action: () => this.buyBumper()
                },
                {
                    name: 'Buy Basket',
                    cost: GameUtils.calculateUpgradeCost(50, basketLevel, 1.7),
                    canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(50, basketLevel, 1.7),
                    canPurchase: PositionManager.findBasketPosition(baskets, bumpers, flippers, triangles) !== null,
                    color: 0xB34E00,  // Dark orange
                    action: () => this.buyBasket()
                }
            ]
        };
    }

    createUpgradeButton(x, y, upgrade) {
        const available = upgrade.canAfford && upgrade.canPurchase;
        const color = available ? upgrade.color : 0x4A4A4A;  // Gray for unavailable

        const button = this.add.graphics();
        button.fillStyle(color);
        button.fillRoundedRect(x-140, y-35, 280, 70, 10);
        button.lineStyle(3, 0x000000);
        button.strokeRoundedRect(x-140, y-35, 280, 70, 10);

        let buttonText = `${upgrade.name}\nCost: ${upgrade.cost}`;

        // Special handling for duplicator max limit
        if (upgrade.name.includes('Duplicator') && !upgrade.canPurchase) {
            const duplicators = this.registry.get('duplicators');
            const maxDuplicators = this.registry.get('maxDuplicators');
            if (duplicators.length >= maxDuplicators) {
                buttonText += ' (Max!)';
            } else {
                buttonText += ' (No space!)';
            }
        } else if (!upgrade.canPurchase) {
            buttonText += ' (No space!)';
        } else if (!upgrade.canAfford) {
            buttonText += ' (Need more!)';
        }

        this.add.text(x, y, buttonText, {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 2,
            align: 'center'
        }).setOrigin(0.5);

        if (available) {
            button.setInteractive(new Phaser.Geom.Rectangle(x-140, y-35, 280, 70), Phaser.Geom.Rectangle.Contains);
            button.on('pointerdown', upgrade.action);
        }
    }

    createNavigationButtons() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        this.createNavButton(centerX - 282, 670, 'BACK', () => this.scene.start('MainMenu'));
        this.createNavButton(centerX + 282, 670, 'PLAY', () => this.scene.start('ClickerGame'));
    }

    createNavButton(x, y, text, callback) {
        const button = this.add.graphics();
        button.fillStyle(text === 'BACK' ? 0x0B5563 : 0x8B1A1A);  // Dark teal or dark red
        button.fillRoundedRect(x-60, y-20, 120, 40, 6);
        button.lineStyle(3, 0x000000);
        button.strokeRoundedRect(x-60, y-20, 120, 40, 6);
        button.setInteractive(new Phaser.Geom.Rectangle(x-60, y-20, 120, 40), Phaser.Geom.Rectangle.Contains);

        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);

        button.on('pointerdown', callback);
    }

        buySkullUpgrade() {
        const cost = GameUtils.calculateUpgradeCost(10, this.registry.get('upgradeLevel'), 1.6);
        if (this.registry.get('totalSkulls') >= cost) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('upgradeLevel', this.registry.get('upgradeLevel') + 1);
            this.registry.set('maxSkulls', this.registry.get('maxSkulls') + 1);
            this.scene.restart();
        }
    }

    buyTimerUpgrade() {
        const cost = GameUtils.calculateUpgradeCost(25, this.registry.get('timerLevel'), 1.8);
        if (this.registry.get('totalSkulls') >= cost) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('timerLevel', this.registry.get('timerLevel') + 1);
            this.registry.set('gameTime', this.registry.get('gameTime') + 2);
            this.scene.restart();
        }
    }

    buyBasket() {
        const cost = GameUtils.calculateUpgradeCost(50, this.registry.get('basketLevel'), 1.7);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');
        const newPosition = PositionManager.findBasketPosition(baskets, bumpers, flippers, triangles);

        if (this.registry.get('totalSkulls') >= cost && newPosition) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('basketLevel', this.registry.get('basketLevel') + 1);

            baskets.push(newPosition);
            this.registry.set('baskets', baskets);
            this.scene.restart();
        }
    }

    buyBumper() {
        const cost = GameUtils.calculateUpgradeCost(25, this.registry.get('bumperLevel'), 1.7);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');
        const newPosition = PositionManager.findBumperPosition(bumpers, baskets, flippers, triangles);

        if (this.registry.get('totalSkulls') >= cost && newPosition) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('bumperLevel', this.registry.get('bumperLevel') + 1);

            bumpers.push(newPosition);
            this.registry.set('bumpers', bumpers);
            this.scene.restart();
        }
    }

    buyTriangle() {
        const cost = GameUtils.calculateUpgradeCost(10, this.registry.get('triangleLevel'), 1.5);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');
        const newPosition = PositionManager.findTrianglePosition(triangles, baskets, bumpers, flippers);

        if (this.registry.get('totalSkulls') >= cost && newPosition) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('triangleLevel', this.registry.get('triangleLevel') + 1);

            newPosition.angle = 0;  // Default angle (pointing up)
            triangles.push(newPosition);
            this.registry.set('triangles', triangles);
            this.scene.restart();
        }
    }

    buyFlipper() {
        const cost = GameUtils.calculateUpgradeCost(20, this.registry.get('flipperLevel'), 1.5);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');
        const newPosition = PositionManager.findFlipperPosition(flippers, baskets, bumpers, triangles);

        if (this.registry.get('totalSkulls') >= cost && newPosition) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('flipperLevel', this.registry.get('flipperLevel') + 1);

            const facingLeft = flippers.length % 2 === 0;
            newPosition.facingLeft = facingLeft;
            newPosition.angle = facingLeft ? 30 : -30;  // Default angle
            newPosition.scaleX = 1;  // Default scale (not flipped)
            flippers.push(newPosition);
            this.registry.set('flippers', flippers);
            this.scene.restart();
        }
    }

    buyAutoStart() {
        const autoStartUnlocked = this.registry.get('autoStartUnlocked');
        const autoStartLevel = this.registry.get('autoStartLevel');
        const cost = autoStartUnlocked ? 200 : 100;

        if (this.registry.get('totalSkulls') >= cost) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);

            if (!autoStartUnlocked) {
                this.registry.set('autoStartUnlocked', true);
            } else if (autoStartLevel < 9) {
                this.registry.set('autoStartLevel', autoStartLevel + 1);
            }

            this.scene.restart();
        }
    }

    buyPrestige() {
        const prestigeLevel = this.registry.get('prestigeLevel');
        const cost = 1000000 * Math.pow(2, prestigeLevel);

        if (this.registry.get('totalSkulls') >= cost) {
            // Increase prestige level and multiplier
            this.registry.set('prestigeLevel', prestigeLevel + 1);
            this.registry.set('prestigeMultiplier', Math.pow(2, prestigeLevel + 1));

            // Increase max duplicators (+1 per prestige)
            const currentMaxDuplicators = this.registry.get('maxDuplicators');
            this.registry.set('maxDuplicators', currentMaxDuplicators + 1);

            // Reset all progress except prestige and maxDuplicators
            this.registry.set('totalSkulls', 200);
            this.registry.set('maxSkulls', 10);
            this.registry.set('upgradeLevel', 0);
            this.registry.set('basketLevel', 0);
            this.registry.set('timerLevel', 0);
            this.registry.set('bumperLevel', 0);
            this.registry.set('flipperLevel', 0);
            this.registry.set('triangleLevel', 0);
            this.registry.set('boosterLevel', 0);
            this.registry.set('shrinkerLevel', 0);
            this.registry.set('duplicatorLevel', 0);
            this.registry.set('gameTime', 10);
            this.registry.set('baskets', []);
            this.registry.set('bumpers', []);
            this.registry.set('flippers', []);
            this.registry.set('triangles', []);
            this.registry.set('boosters', []);
            this.registry.set('shrinkers', []);
            this.registry.set('duplicators', []);
            this.registry.set('highscore', 0);
            this.registry.set('autoStartUnlocked', false);
            this.registry.set('autoStartLevel', 0);
            this.registry.set('autoStartEnabled', false);

            this.scene.restart();
        }
    }

    buyBooster() {
        const cost = GameUtils.calculateUpgradeCost(10, this.registry.get('boosterLevel'), 1.5);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');
        const boosters = this.registry.get('boosters');
        const newPosition = PositionManager.findBoosterPosition(boosters, baskets, bumpers, flippers, triangles);

        if (this.registry.get('totalSkulls') >= cost && newPosition) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('boosterLevel', this.registry.get('boosterLevel') + 1);

            newPosition.angle = 0;  // Default angle (pointing down)
            boosters.push(newPosition);
            this.registry.set('boosters', boosters);
            this.scene.restart();
        }
    }

    buyShrinker() {
        const cost = GameUtils.calculateUpgradeCost(15, this.registry.get('shrinkerLevel'), 1.5);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');
        const shrinkers = this.registry.get('shrinkers');
        const newPosition = PositionManager.findShrinkerPosition(shrinkers, baskets, bumpers, flippers, triangles);

        if (this.registry.get('totalSkulls') >= cost && newPosition) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('shrinkerLevel', this.registry.get('shrinkerLevel') + 1);

            shrinkers.push(newPosition);
            this.registry.set('shrinkers', shrinkers);
            this.scene.restart();
        }
    }

    buyDuplicator() {
        const cost = GameUtils.calculateUpgradeCost(1000, this.registry.get('duplicatorLevel'), 1.5);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');
        const duplicators = this.registry.get('duplicators');
        const newPosition = PositionManager.findDuplicatorPosition(duplicators, baskets, bumpers, flippers, triangles);

        if (this.registry.get('totalSkulls') >= cost && newPosition) {
            this.registry.set('totalSkulls', this.registry.get('totalSkulls') - cost);
            this.registry.set('duplicatorLevel', this.registry.get('duplicatorLevel') + 1);

            duplicators.push(newPosition);
            this.registry.set('duplicators', duplicators);
            this.scene.restart();
        }
    }
}