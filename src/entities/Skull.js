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

        // Create Matter sprite with circular body
        const radius = isBig ? 35 : 25;
        this.sprite = scene.matter.add.sprite(x, y, isBig ? 'bigskull' : 'skull_01', null, {
            shape: { type: 'circle', radius: radius },
            restitution: 0.9,
            friction: 0.01,
            frictionAir: 0.01,
            label: 'skull'
        });

        if (!isBig) this.sprite.play('rotate');

        // Spawn with different angles, all going downward
        const velocityX = Phaser.Math.Between(-8, 8);
        const velocityY = Phaser.Math.Between(2, 6);  // Always positive (downward)
        this.sprite.setVelocity(velocityX, velocityY);
        this.sprite.setInteractive();

        // Store reference to this Skull object
        this.sprite.skull = this;
        
        this.valueText = scene.add.text(x, y, value.toString(), {
            fontFamily: 'Arial Black',
            fontSize: isBig ? 20 : 16,
            color: '#ffffff',
            stroke: '#000000',
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
        // Safety check: only update if sprite and body still exist
        if (this.valueText && this.sprite && this.sprite.body) {
            // Keep text centered on sprite position
            const centerX = Math.round(this.sprite.x);
            const centerY = Math.round(this.sprite.y);
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
        // SAFETY: Don't process if being collected or body doesn't exist
        if (this.isBeingCollected || !this.sprite || !this.sprite.body) return;

        // Calculate angle from bumper center to skull (pushing away radially)
        const angle = Phaser.Math.Angle.Between(bumper.x, bumper.y, this.sprite.x, this.sprite.y);

        // Strong outward push like real pinball bumpers
        const pushVelocity = 15;

        // Set velocity away from bumper (with some momentum preservation)
        this.sprite.setVelocity(
            this.sprite.body.velocity.x * 0.3 + Math.cos(angle) * pushVelocity,
            this.sprite.body.velocity.y * 0.3 + Math.sin(angle) * pushVelocity
        );

        // Apply diminishing multiplier based on hit count
        this.applyBumperMultiplier();
        this.bumperHitCount++;

        this.bumperCooldown = 5;
        this.lastBumperHit = bumper;
    }

    hitFlipper(flipper, horizontalForce, verticalForce) {
        // SAFETY: Don't process if being collected or body doesn't exist
        if (this.isBeingCollected || !this.sprite || !this.sprite.body) return;

        // Matter Physics uses different velocity scale (divide by ~60)
        this.sprite.setVelocity(
            horizontalForce / 60,
            verticalForce / 60
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
            this.valueText.setColor('#ffffff');
        }
    }

    destroy() {
        if (this.valueText) {
            this.valueText.destroy();
            this.valueText = null;
        }
        if (this.sprite) {
            // Remove all event listeners to prevent callbacks
            this.sprite.removeAllListeners();

            // CRITICAL: Stop any running tweens on the sprite (infinite breathing animation for big skulls)
            if (this.scene.tweens) {
                this.scene.tweens.getTweensOf(this.sprite).forEach(tween => tween.remove());
            }

            // Only remove body if it still exists in the world (prevent duplicate removal)
            if (this.sprite.body && this.scene.matter && this.scene.matter.world) {
                try {
                    // Check if body is still in the world
                    const bodyStillInWorld = this.scene.matter.world.localWorld.bodies.includes(this.sprite.body);

                    if (bodyStillInWorld) {
                        this.scene.matter.sleeping.set(this.sprite.body, true);
                        this.scene.matter.world.remove(this.sprite.body);
                    }
                } catch (e) {
                    // Ignore errors if body is already removed
                }
            }

            // Destroy the sprite
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    collect() {
        if (this.isBeingCollected) return false;

        this.isBeingCollected = true;
        this.sprite.disableInteractive();

        // CRITICAL: Remove body from physics world IMMEDIATELY to prevent further collisions
        if (this.sprite.body && this.scene.matter && this.scene.matter.world) {
            try {
                this.sprite.setVelocity(0, 0);
                this.sprite.setAngularVelocity(0);
                this.scene.matter.sleeping.set(this.sprite.body, true);
                this.scene.matter.world.remove(this.sprite.body);
            } catch (e) {
                // Body might already be removed
            }
        }

        GameUtils.createParticleEffect(this.scene, this.sprite.x, this.sprite.y, COLORS.GOLD, 8);

        if (!this.isBig) {
            this.sprite.play('vanish');
            this.sprite.once('animationcomplete-vanish', () => {
                // Safety check before destroying
                if (this.sprite) this.destroy();
            });
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
                onComplete: () => {
                    // Safety check before destroying
                    if (this.sprite) this.destroy();
                }
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

        // CRITICAL: Remove body from physics world IMMEDIATELY to prevent further collisions
        if (this.sprite.body && this.scene.matter && this.scene.matter.world) {
            try {
                this.sprite.setVelocity(0, 0);
                this.scene.matter.sleeping.set(this.sprite.body, true);
                this.scene.matter.world.remove(this.sprite.body);
            } catch (e) {
                // Body might already be removed
            }
        }

        this.scene.tweens.add({
            targets: this.sprite,
            x: basket.x,
            y: basket.y - 10,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                // Safety check before destroying
                if (this.sprite) this.destroy();
            }
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

        // Safety check: only tween basket if it still has a body
        if (basket && basket.body) {
            this.scene.tweens.add({
                targets: basket,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                yoyo: true
            });
        }

        return true;
    }
}