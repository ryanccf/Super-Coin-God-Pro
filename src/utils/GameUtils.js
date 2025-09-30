class GameUtils {
    static calculateUpgradeCost(basePrice, level, multiplier = 1.6) {
        return Math.floor(basePrice * Math.pow(multiplier, level));
    }

    static createParticleEffect(scene, x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = scene.add.circle(x, y, 3, color);
            const angle = (i / count) * Math.PI * 2;
            const speed = Phaser.Math.Between(50, 150);
            
            scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                scaleX: 0,
                scaleY: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    static addButtonEffect(button, text, callback) {
        button.on('pointerover', () => button.setAlpha(0.8));
        button.on('pointerout', () => button.setAlpha(1));
        button.on('pointerdown', () => {
            button.scene.tweens.add({
                targets: [button, text],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: callback
            });
        });
    }
}