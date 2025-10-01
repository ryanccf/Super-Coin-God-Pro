class Coin {
    constructor(scene, x, y, value = 1, isBig = false) {
        this.scene = scene;
        this.value = value;
        this.isBig = isBig;
        this.isBeingCollected = false;
        this.bumperCooldown = 0;
        this.lastBumperHit = null;
        
        this.sprite = scene.physics.add.sprite(x, y, isBig ? 'bigcoin' : 'coin_01');
        if (!isBig) this.sprite.play('rotate');
        
        this.sprite.setVelocityX(Phaser.Math.Between(-400, 400));
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0.9);
        this.sprite.setInteractive();
        
        this.valueText = scene.add.text(x, y, value.toString(), {
            fontFamily: 'Arial Black',
            fontSize: isBig ? 20 : 16,
            color: '#000000',
            stroke: '#FFFFFF',
            strokeThickness: isBig ? 3 : 2
        }).setOrigin(0.5).setDepth(10);
        
        if (isBig) {
            scene.tweens.add({
                targets: this.sprite,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        
        GameUtils.createParticleEffect(scene, x, y, COLORS.GOLD, 5);
    }

    update() {
        if (this.bumperCooldown > 0) {
            this.bumperCooldown -= 1;
            if (this.bumperCooldown === 0) {
                this.lastBumperHit = null;
            }
        }
    }

    updateValueText() {
        if (this.valueText && this.sprite) {
            this.valueText.x = this.sprite.x;
            this.valueText.y = this.sprite.y;
            this.valueText.setText(this.value.toString());
        }
    }

    canHitBumper(bumper) {
        return this.bumperCooldown <= 0 && this.lastBumperHit !== bumper;
    }

    hitBumper(bumper) {
        const angle = Phaser.Math.Angle.Between(bumper.x, bumper.y, this.sprite.x, this.sprite.y);
        const force = 200;
        
        const currentVelX = this.sprite.body.velocity.x;
        const currentVelY = this.sprite.body.velocity.y;
        
        this.sprite.setVelocity(
            currentVelX + Math.cos(angle) * force,
            currentVelY + Math.sin(angle) * force
        );
        
        this.bumperCooldown = 3;
        this.lastBumperHit = bumper;
    }

    doubleValue() {
        this.value *= 2;
        this.sprite.setTint(COLORS.LIGHT_YELLOW);
        if (this.valueText) {
            this.valueText.setText(this.value.toString());
            this.valueText.setColor('#FF0000');
        }
    }

    destroy() {
        if (this.valueText) {
            this.valueText.destroy();
            this.valueText = null;
        }
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    collect() {
        if (this.isBeingCollected) return false;
        
        this.isBeingCollected = true;
        this.sprite.disableInteractive();
        this.sprite.setVelocity(0, 0);
        this.sprite.setAngularVelocity(0);
        
        this.scene.cameras.main.shake(50, 0.005);
        GameUtils.createParticleEffect(this.scene, this.sprite.x, this.sprite.y, COLORS.GOLD, 8);
        
        if (!this.isBig) {
            this.sprite.play('vanish');
            this.sprite.once('animationcomplete-vanish', () => this.destroy());
        } else {
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => this.destroy()
            });
        }
        
        return true;
    }

    collectInBasket(basket) {
        if (this.isBeingCollected) return false;
        
        this.isBeingCollected = true;
        this.sprite.disableInteractive();
        this.sprite.setVelocity(0, 0);
        
        this.scene.tweens.add({
            targets: this.sprite,
            x: basket.x,
            y: basket.y - 10,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 300,
            onComplete: () => this.destroy()
        });
        
        this.scene.tweens.add({
            targets: basket,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            yoyo: true
        });
        
        return true;
    }
}