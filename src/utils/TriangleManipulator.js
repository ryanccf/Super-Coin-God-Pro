class TriangleManipulator {
    constructor(scene, triangle) {
        this.scene = scene;
        this.triangle = triangle;
        this.isActive = false;

        // Create UI elements
        this.outline = null;
        this.rotationHandle = null;

        this.createUI();
    }

    createUI() {
        // Red outline with 10% opacity
        this.outline = this.scene.add.graphics();
        this.outline.setDepth(100);
        this.outline.setVisible(false);

        // Rotation handle - draggable circle at edge of triangle
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
            if (this.scene.isGameOver || !this.triangle.body) return;

            const angle = Phaser.Math.Angle.Between(
                this.triangle.x,
                this.triangle.y,
                dragX,
                dragY
            );

            // setRotation updates both sprite and Matter body
            this.triangle.setRotation(angle);
            this.triangle.baseAngle = Phaser.Math.RadToDeg(angle); // Update base angle

            this.updateUI();

            // Update saved position angle
            const trianglePositions = this.scene.registry.get('triangles');
            const index = this.scene.triangleSprites.indexOf(this.triangle);
            if (index !== -1 && trianglePositions[index]) {
                trianglePositions[index].angle = this.triangle.baseAngle;
                this.scene.registry.set('triangles', trianglePositions);
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

        // CRITICAL: Stop if triangle or body is destroyed/missing
        if (!this.triangle || !this.triangle.body) return;

        // Update outline position and rotation
        this.outline.clear();
        this.outline.lineStyle(3, 0xFF0000, 0.1);

        // Draw rotated rectangle outline - 120px width x 60px height
        const width = 120;
        const height = 60;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Rectangle corners relative to center
        const corners = [
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight }
        ];

        // Rotate corners using triangle's rotation
        const cos = Math.cos(this.triangle.rotation);
        const sin = Math.sin(this.triangle.rotation);

        const rotatedCorners = corners.map(corner => ({
            x: this.triangle.x + (corner.x * cos - corner.y * sin),
            y: this.triangle.y + (corner.x * sin + corner.y * cos)
        }));

        this.outline.beginPath();
        this.outline.moveTo(rotatedCorners[0].x, rotatedCorners[0].y);
        for (let i = 1; i < rotatedCorners.length; i++) {
            this.outline.lineTo(rotatedCorners[i].x, rotatedCorners[i].y);
        }
        this.outline.closePath();
        this.outline.strokePath();

        // Position rotation handle at the top center edge
        const handleDistance = 85; // Distance to top edge + some padding
        const handleAngle = this.triangle.rotation - Math.PI / 2; // Top of square
        this.rotationHandle.x = this.triangle.x + Math.cos(handleAngle) * handleDistance;
        this.rotationHandle.y = this.triangle.y + Math.sin(handleAngle) * handleDistance;

        // Draw rotation icon (circular arrow) - rotated with triangle
        this.rotationIcon.clear();
        this.rotationIcon.lineStyle(2, 0xFFFFFF, 1);

        const iconX = this.rotationHandle.x;
        const iconY = this.rotationHandle.y;
        const radius = 6;
        const triangleRot = this.triangle.rotation;

        // Draw arc (270 degrees) - relative to triangle rotation
        this.rotationIcon.beginPath();
        this.rotationIcon.arc(
            iconX,
            iconY,
            radius,
            Phaser.Math.DegToRad(-45) + triangleRot,
            Phaser.Math.DegToRad(225) + triangleRot,
            false
        );
        this.rotationIcon.strokePath();

        // Draw arrowhead - rotated with triangle
        const arrowAngle = Phaser.Math.DegToRad(225) + triangleRot;
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
