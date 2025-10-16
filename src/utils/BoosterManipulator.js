class BoosterManipulator {
    constructor(scene, booster) {
        this.scene = scene;
        this.booster = booster;
        this.isActive = false;

        // Create UI elements
        this.outline = null;
        this.rotationHandle = null;

        this.createUI();
    }

    createUI() {
        // Green outline with 30% opacity
        this.outline = this.scene.add.graphics();
        this.outline.setDepth(100);
        this.outline.setVisible(false);

        // Rotation handle - draggable circle at edge of booster
        this.rotationHandle = this.scene.add.circle(0, 0, 12, 0x00FF00, 0.8);
        this.rotationHandle.setStrokeStyle(2, 0xFFFFFF);
        this.rotationHandle.setDepth(101);
        this.rotationHandle.setVisible(false);
        this.rotationHandle.setInteractive({ draggable: true });

        // Rotation icon (circular arrows)
        this.rotationIcon = this.scene.add.graphics();
        this.rotationIcon.setDepth(102);
        this.rotationIcon.setVisible(false);

        this.setupHandlers();
    }

    setupHandlers() {
        // Rotation handle drag
        this.rotationHandle.on('drag', (pointer, dragX, dragY) => {
            // CRITICAL: Stop processing if game is over or body doesn't exist
            if (this.scene.isGameOver || !this.booster.body) return;

            const angle = Phaser.Math.Angle.Between(
                this.booster.x,
                this.booster.y,
                dragX,
                dragY
            );

            // setRotation updates both sprite and Matter body
            this.booster.setRotation(angle);
            this.booster.baseAngle = Phaser.Math.RadToDeg(angle); // Update base angle

            this.updateUI();

            // Update saved position angle
            const boosterPositions = this.scene.registry.get('boosters');
            const index = this.scene.boosterSprites.indexOf(this.booster);
            if (index !== -1 && boosterPositions[index]) {
                boosterPositions[index].angle = this.booster.baseAngle;
                this.scene.registry.set('boosters', boosterPositions);
            }
        });

        // Prevent rotation handle from triggering deselection
        this.rotationHandle.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
        });
    }

    show() {
        this.isActive = true;
        this.updateUI();
        this.outline.setVisible(true);
        this.rotationHandle.setVisible(true);
        this.rotationIcon.setVisible(true);
    }

    hide() {
        this.isActive = false;
        this.outline.setVisible(false);
        this.rotationHandle.setVisible(false);
        this.rotationIcon.setVisible(false);
    }

    updateUI() {
        if (!this.isActive) return;

        // CRITICAL: Stop if booster or body is destroyed/missing
        if (!this.booster || !this.booster.body) return;

        // Update outline position and rotation
        this.outline.clear();
        this.outline.lineStyle(3, 0x00FF00, 0.3);

        // Draw rotated rectangle outline - 140px x 30px
        const length = 140;
        const width = 30;
        const halfLength = length / 2;
        const halfWidth = width / 2;

        // Rectangle corners relative to center
        const corners = [
            { x: -halfLength, y: -halfWidth },
            { x: halfLength, y: -halfWidth },
            { x: halfLength, y: halfWidth },
            { x: -halfLength, y: halfWidth }
        ];

        // Rotate corners using booster's rotation
        const cos = Math.cos(this.booster.rotation);
        const sin = Math.sin(this.booster.rotation);

        const rotatedCorners = corners.map(corner => ({
            x: this.booster.x + (corner.x * cos - corner.y * sin),
            y: this.booster.y + (corner.x * sin + corner.y * cos)
        }));

        this.outline.beginPath();
        this.outline.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
        for (let i = 1; i < rotatedCorners.length; i++) {
            this.outline.lineTo(rotatedCorners[i].x, rotatedCorners[i].y);
        }
        this.outline.closePath();
        this.outline.strokePath();

        // Position rotation handle at the arrow end (right side)
        const handleDistance = 80; // Distance to right edge + some padding
        const handleAngle = this.booster.rotation; // Right side
        this.rotationHandle.x = this.booster.x + Math.cos(handleAngle) * handleDistance;
        this.rotationHandle.y = this.booster.y + Math.sin(handleAngle) * handleDistance;

        // Draw rotation icon (circular arrow) - rotated with booster
        this.rotationIcon.clear();
        this.rotationIcon.lineStyle(2, 0xFFFFFF, 1);

        const iconX = this.rotationHandle.x;
        const iconY = this.rotationHandle.y;
        const radius = 6;
        const boosterRot = this.booster.rotation;

        // Draw arc (270 degrees) - relative to booster rotation
        this.rotationIcon.beginPath();
        this.rotationIcon.arc(
            iconX,
            iconY,
            radius,
            Phaser.Math.DegToRad(-45) + boosterRot,
            Phaser.Math.DegToRad(225) + boosterRot,
            false
        );
        this.rotationIcon.strokePath();

        // Draw arrowhead - rotated with booster
        const arrowAngle = Phaser.Math.DegToRad(225) + boosterRot;
        const arrowX = iconX + Math.cos(arrowAngle) * radius;
        const arrowY = iconY + Math.sin(arrowAngle) * radius;
        const arrowSize = 3;

        this.rotationIcon.fillStyle(0xFFFFFF, 1);
        this.rotationIcon.beginPath();
        this.rotationIcon.moveTo(arrowX, arrowY);
        this.rotationIcon.lineTo(
            arrowX + Math.cos(arrowAngle - Math.PI / 2) * arrowSize,
            arrowY + Math.sin(arrowAngle - Math.PI / 2) * arrowSize
        );
        this.rotationIcon.lineTo(
            arrowX + Math.cos(arrowAngle + Math.PI) * arrowSize,
            arrowY + Math.sin(arrowAngle + Math.PI) * arrowSize
        );
        this.rotationIcon.closePath();
        this.rotationIcon.fillPath();
    }

    destroy() {
        // CRITICAL: Remove event listeners BEFORE destroying objects
        if (this.rotationHandle) {
            this.rotationHandle.removeAllListeners();
            this.rotationHandle.destroy();
        }
        if (this.outline) this.outline.destroy();
        if (this.rotationIcon) this.rotationIcon.destroy();
    }
}
