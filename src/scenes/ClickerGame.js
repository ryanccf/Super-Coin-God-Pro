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
        this.totalCoins = this.registry.get('totalCoins');
        this.maxCoins = this.registry.get('maxCoins');
        this.gameTime = this.registry.get('gameTime');
        this.bigCoinSpawned = false;
    }

    initializeArrays() {
        this.coinObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
    }

    create() {
        this.setupWorld();
        this.createUI();
        this.createGameObjects();
        this.setupPhysics();
        this.setupInput();
        this.spawnInitialCoins();
        this.startTimer();
    }

    setupWorld() {
        this.add.image(512, 384, 'background');
        this.add.image(512, GAME_CONFIG.FLOOR_Y, 'floor').setOrigin(0.5, 0);
        
        this.physics.world.setBounds(
            GAME_CONFIG.PHYSICS_BOUNDS.x,
            GAME_CONFIG.PHYSICS_BOUNDS.y,
            GAME_CONFIG.PHYSICS_BOUNDS.width,
            GAME_CONFIG.PHYSICS_BOUNDS.height
        );
    }

    createUI() {
        const textStyle = {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        };

        this.roundScoreText = this.add.text(32, 32, `Round: ${this.roundScore}`, textStyle).setDepth(1);
        this.totalCoinsText = this.add.text(32, 80, `Total: ${this.totalCoins}`, textStyle).setDepth(1);
        this.maxCoinsText = this.add.text(32, 128, `Max: ${this.maxCoins}`, {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 8
        }).setDepth(1);
        this.timeText = this.add.text(1024 - 32, 32, `Time: ${this.gameTime}`, textStyle).setOrigin(1, 0).setDepth(1);
    }

    createGameObjects() {
        this.createBaskets();
        this.createBumpers();
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
        basket.on('drag', (pointer, dragX, dragY) => {
            basket.x = dragX;
            basket.y = originalPos.y;
            basket.body.x = dragX - 35;
            basket.body.y = originalPos.y - 20;
            
            const basketPositions = this.registry.get('baskets');
            const index = this.basketSprites.indexOf(basket);
            if (index !== -1 && basketPositions[index]) {
                basketPositions[index].x = dragX;
                this.registry.set('baskets', basketPositions);
            }
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
        bumper.on('drag', (pointer, dragX, dragY) => {
            bumper.x = dragX;
            bumper.y = dragY;
            bumper.body.x = dragX - 20;
            bumper.body.y = dragY - 20;
            bumper.body.updateFromGameObject();

            const bumperPositions = this.registry.get('bumpers');
            const index = this.bumperSprites.indexOf(bumper);
            if (index !== -1 && bumperPositions[index]) {
                bumperPositions[index].x = dragX;
                bumperPositions[index].y = dragY;
                this.registry.set('bumpers', bumperPositions);
            }
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

    setupPhysics() {}

    setupCollisionForCoin(coin) {
        if (this.basketSprites.length > 0) {
            this.basketSprites.forEach(basket => {
                this.physics.add.overlap(coin.sprite, basket, (coinSprite, basket) => {
                    this.handleBasketCollection(coinSprite, basket);
                });
            });
        }
        
        if (this.bumperSprites.length > 0) {
            this.bumperSprites.forEach(bumper => {
                this.physics.add.collider(coin.sprite, bumper, (coinSprite, bumper) => {
                    this.handleBumperCollision(coinSprite, bumper);
                });
            });
        }
    }

    setupInput() {
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject.texture) {
                if (gameObject.texture.key.startsWith('coin_')) {
                    this.handleCoinClick(gameObject);
                } else if (gameObject.texture.key === 'bigcoin') {
                    this.handleCoinClick(gameObject);
                }
            }
        });
    }

    spawnInitialCoins() {
        for (let i = 0; i < this.maxCoins; i++) {
            this.spawnCoin();
        }
    }

    startTimer() {
        this.timer = this.time.addEvent({
            delay: this.gameTime * 1000,
            callback: () => this.gameOver()
        });
    }

    spawnCoin(isBig = false) {
        const x = Phaser.Math.Between(128, 896);
        const y = Phaser.Math.Between(0, -400);
        const value = isBig ? 10 : 1;
        
        const coin = new Coin(this, x, y, value, isBig);
        this.coinObjects.push(coin);
        
        this.setupCollisionForCoin(coin);
    }

    handleCoinClick(sprite) {
        const coinObj = this.coinObjects.find(c => c.sprite === sprite);
        if (!coinObj || !coinObj.collect()) return;
        
        this.addScore(coinObj.value);
        this.showBonusText(sprite.x, sprite.y, coinObj.value);
        this.updateScoreDisplay();
        this.removeCoinFromArray(coinObj);
        
        if (this.coinObjects.length < this.maxCoins) {
            this.spawnCoin();
        }
    }

    handleBasketCollection(coinSprite, basket) {
        const coinObj = this.coinObjects.find(c => c.sprite === coinSprite);
        if (!coinObj || !coinObj.collectInBasket(basket)) return;
        
        const bonusValue = coinObj.value + 1;
        this.addScore(bonusValue);
        this.showBasketBonusText(basket.x, basket.y, bonusValue);
        this.updateScoreDisplay();
        this.removeCoinFromArray(coinObj);
        
        if (this.coinObjects.length < this.maxCoins) {
            this.spawnCoin();
        }
    }

    handleBumperCollision(coinSprite, bumper) {
        const coinObj = this.coinObjects.find(c => c.sprite === coinSprite);
        if (!coinObj || !coinObj.canHitBumper(bumper)) return;
        
        coinObj.hitBumper(bumper);
        coinObj.doubleValue();
        this.showBumperEffect(bumper);
    }

    clickBasket(basket) {
        const bonusCoins = 5;
        this.addScore(bonusCoins);
        this.showBasketBonusText(basket.x, basket.y - 30, bonusCoins);
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
        this.totalCoins += points;
        this.registry.set('totalCoins', this.totalCoins);
    }

    updateScoreDisplay() {
        this.roundScoreText.setText(`Round: ${this.roundScore}`);
        this.totalCoinsText.setText(`Total: ${this.totalCoins}`);
        
        this.tweens.add({
            targets: [this.roundScoreText, this.totalCoinsText],
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 200,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    showBonusText(x, y, value) {
        const color = value > 1 ? '#FFFF99' : '#FFD700';
        const stroke = value > 1 ? '#DA70D6' : '#FF8C00';
        
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
            color: '#FFD700',
            stroke: '#8B4513',
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
        
        GameUtils.createParticleEffect(this, bumper.x, bumper.y, COLORS.PURPLE, 6);
        
        const bonusText = this.add.text(bumper.x, bumper.y - 30, '2x!', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#DA70D6',
            stroke: '#FFFFFF',
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

    removeCoinFromArray(coinObj) {
        const index = this.coinObjects.indexOf(coinObj);
        if (index > -1) {
            this.coinObjects.splice(index, 1);
        }
    }

    update() {
        if (!this.timer) return;
        
        this.timeText.setText(`Time: ${Math.ceil(this.timer.getRemainingSeconds())}`);
        
        this.coinObjects.forEach(coin => {
            coin.updateValueText();
            coin.update();
        });
        
        if (!this.bigCoinSpawned && this.timer.getRemainingSeconds() <= 5) {
            this.spawnCoin(true);
            this.bigCoinSpawned = true;
        }
    }

    gameOver() {
        this.coinObjects.forEach(coin => {
            coin.sprite.setVelocity(0, 0);
            if (!coin.isBig) coin.sprite.play('vanish');
            coin.destroy();
        });
        this.coinObjects = [];

        this.input.off('gameobjectdown');

        const currentBest = this.registry.get('highscore');
        if (this.roundScore > currentBest) {
            this.registry.set('highscore', this.roundScore);
        }

        this.time.delayedCall(2000, () => this.scene.start('GameOver'));
    }

    shutdown() {
        this.coinObjects = [];
        this.basketSprites = [];
        this.bumperSprites = [];
    }
}