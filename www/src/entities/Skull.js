class Skull {
    constructor(scene, x, y, value = 1, isBig = false) {
        this.scene = scene;
        this.value = value;
        this.isBig = isBig;
        this.isBeingCollected = false;
        this.bumperCooldown = 0;
        this.lastBumperHit = null;
        this.flipperCooldown = 0;
        this.lastFlipperHit = null;
        this.bumperHitCount = 0;

        this.sprite = scene.physics.add.sprite(x, y, isBig ? 'bigskull' : 'skull_01');
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
            strokeThickness: isBig ? 3 : 2,
            fixedWidth: 0
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
        if (this.flipperCooldown > 0) {
            this.flipperCooldown -= 1;
            if (this.flipperCooldown === 0) {
                this.lastFlipperHit = null;
            }
        }
    }

    updateValueText() {
        if (this.valueText && this.sprite) {
            // Keep text centered on sprite body center, smoothed to reduce jitter
            const centerX = Math.round(this.sprite.body.center.x);
            const centerY = Math.round(this.sprite.body.center.y);
            this.valueText.setPosition(centerX, centerY);
        }
    }

    canHitBumper(bumper) {
        return this.bumperCooldown <= 0 && this.lastBumperHit !== bumper;
    }

    canHitFlipper(flipper) {
        return this.flipperCooldown <= 0 && this.lastFlipperHit !== flipper;
    }

    hitBumper(bumper) {
        // Calculate angle from bumper center to skull (pushing away radially)
        const angle = Phaser.Math.Angle.Between(bumper.x, bumper.y, this.sprite.x, this.sprite.y);

        // Strong outward push like real pinball bumpers
        const pushForce = 400;

        // Set velocity directly (with some preservation of momentum)
        const currentVelX = this.sprite.body.velocity.x * 0.3;
        const currentVelY = this.sprite.body.velocity.y * 0.3;

        this.sprite.setVelocity(
            currentVelX + Math.cos(angle) * pushForce,
            currentVelY + Math.sin(angle) * pushForce
        );

        // Apply diminishing multiplier based on hit count
        this.applyBumperMultiplier();
        this.bumperHitCount++;

        this.bumperCooldown = 5;
        this.lastBumperHit = bumper;
    }

    hitFlipper(flipper, upwardForce, horizontalForce) {
        this.sprite.setVelocity(
            this.sprite.body.velocity.x + horizontalForce,
            upwardForce
        );

        // Add +1 to skull value
        this.value += 1;
        if (this.valueText) {
            this.valueText.setText(this.value.toString());
        }

        this.flipperCooldown = 5;
        this.lastFlipperHit = flipper;
    }

    applyBumperMultiplier() {
        // Diminishing returns formula:
        // 1st hit: +100% (×2), 2nd: +50% (×1.5), 3rd: +25% (×1.25), 4th: +12.5% (×1.125), etc.
        // multiplierBonus = 1.0 / (2^bumperHitCount)
        const multiplierBonus = 1.0 / Math.pow(2, this.bumperHitCount);
        const totalMultiplier = 1 + multiplierBonus;

        this.value = Math.floor(this.value * totalMultiplier);
        this.sprite.setTint(COLORS.LIGHT_YELLOW);
        if (this.valueText) {
            this.valueText.setText(this.value.toString());
            this.valueText.setColor('#000000');
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

        GameUtils.createParticleEffect(this.scene, this.sprite.x, this.sprite.y, COLORS.GOLD, 8);

        if (!this.isBig) {
            this.sprite.play('vanish');
            this.sprite.once('animationcomplete-vanish', () => this.destroy());
            if (this.valueText) {
                this.scene.tweens.add({
                    targets: this.valueText,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        if (this.valueText) this.valueText.destroy();
                    }
                });
            }
        } else {
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => this.destroy()
            });
            if (this.valueText) {
                this.scene.tweens.add({
                    targets: this.valueText,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 500
                });
            }
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

        if (this.valueText) {
            this.scene.tweens.add({
                targets: this.valueText,
                x: basket.x,
                y: basket.y - 10,
                scaleX: 0.5,
                scaleY: 0.5,
                alpha: 0,
                duration: 300
            });
        }

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