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
        this.add.image(512, 384, 'background');
    }

    createHeader() {
        const totalCoins = this.registry.get('totalCoins');
        const maxCoins = this.registry.get('maxCoins');
        const gameTime = this.registry.get('gameTime');
        
        this.add.text(512, 60, 'COIN SHOP', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(512, 120, `Your Coins: ${totalCoins}`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(512, 160, `Max Coins: ${maxCoins} | Game Time: ${gameTime}s`, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }

    createUpgradeButtons() {
        const upgrades = this.getUpgradeData();

        upgrades.forEach((upgrade, index) => {
            let x, y;
            if (index === 4) {
                // Flipper button - move to right side of third row
                x = 814;
                y = 260 + Math.floor(index / 2) * 110;
            } else {
                x = 210 + (index % 2) * 604;
                y = 260 + Math.floor(index / 2) * 110;
            }
            this.createUpgradeButton(x, y, upgrade);
        });
    }

    getUpgradeData() {
        const totalCoins = this.registry.get('totalCoins');
        const upgradeLevel = this.registry.get('upgradeLevel');
        const timerLevel = this.registry.get('timerLevel');
        const basketLevel = this.registry.get('basketLevel');
        const bumperLevel = this.registry.get('bumperLevel');
        const flipperLevel = this.registry.get('flipperLevel');

        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');

        return [
            {
                name: 'Max Coins +1',
                cost: GameUtils.calculateUpgradeCost(10, upgradeLevel, 1.6),
                canAfford: totalCoins >= GameUtils.calculateUpgradeCost(10, upgradeLevel, 1.6),
                canPurchase: true,
                color: 0x32CD32,
                action: () => this.buyCoinUpgrade()
            },
            {
                name: 'Buy Basket',
                cost: GameUtils.calculateUpgradeCost(50, basketLevel, 1.7),
                canAfford: totalCoins >= GameUtils.calculateUpgradeCost(50, basketLevel, 1.7),
                canPurchase: PositionManager.findBasketPosition(baskets, bumpers, flippers) !== null,
                color: 0x8B4513,
                action: () => this.buyBasket()
            },
            {
                name: 'Game Time +2s',
                cost: GameUtils.calculateUpgradeCost(25, timerLevel, 1.8),
                canAfford: totalCoins >= GameUtils.calculateUpgradeCost(25, timerLevel, 1.8),
                canPurchase: true,
                color: 0x4169E1,
                action: () => this.buyTimerUpgrade()
            },
            {
                name: 'Buy Bumper',
                cost: GameUtils.calculateUpgradeCost(25, bumperLevel, 1.7),
                canAfford: totalCoins >= GameUtils.calculateUpgradeCost(25, bumperLevel, 1.7),
                canPurchase: PositionManager.findBumperPosition(bumpers, baskets, flippers) !== null,
                color: 0x9370DB,
                action: () => this.buyBumper()
            },
            {
                name: 'Buy Flipper',
                cost: GameUtils.calculateUpgradeCost(20, flipperLevel, 1.5),
                canAfford: totalCoins >= GameUtils.calculateUpgradeCost(20, flipperLevel, 1.5),
                canPurchase: PositionManager.findFlipperPosition(flippers, baskets, bumpers) !== null,
                color: 0xFF6347,
                action: () => this.buyFlipper()
            }
        ];
    }

    createUpgradeButton(x, y, upgrade) {
        const available = upgrade.canAfford && upgrade.canPurchase;
        const color = available ? upgrade.color : 0x8B0000;
        
        const button = this.add.graphics();
        button.fillStyle(color);
        button.fillRoundedRect(x-140, y-40, 280, 80, 10);
        button.lineStyle(4, color - 0x101010);
        button.strokeRoundedRect(x-140, y-40, 280, 80, 10);
        
        let buttonText = `${upgrade.name}\nCost: ${upgrade.cost}`;
        if (!upgrade.canPurchase) buttonText += ' (No space!)';
        else if (!upgrade.canAfford) buttonText += ' (Need more!)';
        
        this.add.text(x, y, buttonText, {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        if (available) {
            button.setInteractive(new Phaser.Geom.Rectangle(x-140, y-40, 280, 80), Phaser.Geom.Rectangle.Contains);
            button.on('pointerdown', upgrade.action);
        }
    }

    createNavigationButtons() {
        this.createNavButton(230, 670, 'BACK', () => this.scene.start('MainMenu'));
        this.createNavButton(794, 670, 'PLAY', () => this.scene.start('ClickerGame'));
    }

    createNavButton(x, y, text, callback) {
        const button = this.add.graphics();
        button.fillStyle(text === 'BACK' ? COLORS.ROYAL_BLUE : 0xFF6347);
        button.fillRoundedRect(x-60, y-20, 120, 40, 6);
        button.setInteractive(new Phaser.Geom.Rectangle(x-60, y-20, 120, 40), Phaser.Geom.Rectangle.Contains);

        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff'
        }).setOrigin(0.5);

        button.on('pointerdown', callback);
    }

        buyCoinUpgrade() {
        const cost = GameUtils.calculateUpgradeCost(10, this.registry.get('upgradeLevel'), 1.6);
        if (this.registry.get('totalCoins') >= cost) {
            this.registry.set('totalCoins', this.registry.get('totalCoins') - cost);
            this.registry.set('upgradeLevel', this.registry.get('upgradeLevel') + 1);
            this.registry.set('maxCoins', this.registry.get('maxCoins') + 1);
            this.scene.restart();
        }
    }

    buyTimerUpgrade() {
        const cost = GameUtils.calculateUpgradeCost(25, this.registry.get('timerLevel'), 1.8);
        if (this.registry.get('totalCoins') >= cost) {
            this.registry.set('totalCoins', this.registry.get('totalCoins') - cost);
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
        const newPosition = PositionManager.findBasketPosition(baskets, bumpers, flippers);

        if (this.registry.get('totalCoins') >= cost && newPosition) {
            this.registry.set('totalCoins', this.registry.get('totalCoins') - cost);
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
        const newPosition = PositionManager.findBumperPosition(bumpers, baskets, flippers);

        if (this.registry.get('totalCoins') >= cost && newPosition) {
            this.registry.set('totalCoins', this.registry.get('totalCoins') - cost);
            this.registry.set('bumperLevel', this.registry.get('bumperLevel') + 1);

            bumpers.push(newPosition);
            this.registry.set('bumpers', bumpers);
            this.scene.restart();
        }
    }

    buyFlipper() {
        const cost = GameUtils.calculateUpgradeCost(20, this.registry.get('flipperLevel'), 1.5);
        const baskets = this.registry.get('baskets');
        const bumpers = this.registry.get('bumpers');
        const flippers = this.registry.get('flippers');
        const newPosition = PositionManager.findFlipperPosition(flippers, baskets, bumpers);

        if (this.registry.get('totalCoins') >= cost && newPosition) {
            this.registry.set('totalCoins', this.registry.get('totalCoins') - cost);
            this.registry.set('flipperLevel', this.registry.get('flipperLevel') + 1);

            const facingLeft = flippers.length % 2 === 0;
            newPosition.facingLeft = facingLeft;
            flippers.push(newPosition);
            this.registry.set('flippers', flippers);
            this.scene.restart();
        }
    }
}