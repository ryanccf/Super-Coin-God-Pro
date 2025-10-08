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
        button.on('pointerdown', callback);
    }
}