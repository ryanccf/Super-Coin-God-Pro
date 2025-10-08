class Shop extends Phaser.Scene {
    constructor() {
        super('Shop');
    }

    create() {
        this.setupBackground();
        this.createHeader();
        this.createUpgradeButtons();
        this.createNavigationButtons();
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
        const upgrades = this.getUpgradeData();

        upgrades.forEach((upgrade, index) => {
            // 2 buttons left, 4 buttons right layout
            let x, y;
            if (index < 2) {
                // Left column (2 buttons)
                x = centerX - 302;
                y = 240 + index * 95;
            } else {
                // Right column (4 buttons)
                x = centerX + 302;
                y = 240 + (index - 2) * 95;
            }
            this.createUpgradeButton(x, y, upgrade);
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

        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const triangles = this.registry.get('triangles');

        return [
            {
                name: 'Max Skulls +1',
                cost: GameUtils.calculateUpgradeCost(10, upgradeLevel, 1.6),
                canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(10, upgradeLevel, 1.6),
                canPurchase: true,
                color: 0x2F7F4F,  // Dark green
                action: () => this.buySkullUpgrade()
            },
            {
                name: 'Game Time +2s',
                cost: GameUtils.calculateUpgradeCost(25, timerLevel, 1.8),
                canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(25, timerLevel, 1.8),
                canPurchase: true,
                color: 0x1F3A5F,  // Dark blue
                action: () => this.buyTimerUpgrade()
            },
            {
                name: 'Buy Basket',
                cost: GameUtils.calculateUpgradeCost(50, basketLevel, 1.7),
                canAfford: totalSkulls >= GameUtils.calculateUpgradeCost(50, basketLevel, 1.7),
                canPurchase: PositionManager.findBasketPosition(baskets, bumpers, flippers, triangles) !== null,
                color: 0xB34E00,  // Dark orange
                action: () => this.buyBasket()
            },
            {
                name: 'Buy Square',
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
            }
        ];
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
        if (!upgrade.canPurchase) buttonText += ' (No space!)';
        else if (!upgrade.canAfford) buttonText += ' (Need more!)';

        this.add.text(x, y, buttonText, {
            fontFamily: 'Arial Black',
            fontSize: 16,
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
}