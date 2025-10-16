class Altar extends Phaser.Scene {
    constructor() {
        super('Altar');
    }

    create() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

        this.add.image(centerX, centerY, 'background');

        // Add black square
        const squareSize = 300;
        const squareY = centerY - 180;
        const square = this.add.graphics();
        square.fillStyle(0x000000);
        square.fillRect(centerX - squareSize / 2, squareY - squareSize / 2, squareSize, squareSize);

        this.createSkullCountDisplay();
        this.createFlavorText();
        this.createUnlockablesList();
        this.createSkullKnight();
        this.createPrayButton();
        this.createBackButton();
        this.setupInput();
    }

    setupInput() {
        // Add P key listener for testing
        this.input.keyboard.on('keydown-P', () => {
            const currentTotal = this.registry.get('totalSkulls');
            this.registry.set('totalSkulls', currentTotal + 100);
            this.scene.restart();
        });
    }

    createSkullCountDisplay() {
        const totalSkulls = this.registry.get('totalSkulls');

        this.add.text(GAME_CONFIG.WORLD_WIDTH - 32, 32, `Total Skulls: ${totalSkulls}`, {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(1, 0);
    }

    createFlavorText() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const rightSideX = centerX + (GAME_CONFIG.WORLD_WIDTH - centerX) / 2;

        this.add.text(rightSideX, 100,
            "Resurrect the 4 Skull Masters\nto beckon the Skull God's return\nto the material plane!",
            {
                fontFamily: 'Arial Black',
                fontSize: 20,
                color: '#000000',
                stroke: '#ffffff',
                strokeThickness: 3,
                align: 'center',
                wordWrap: { width: 400 }
            }
        ).setOrigin(0.5, 0);
    }

    createUnlockablesList() {
        const unlockedItems = this.registry.get('unlockedItems') || [];

        const startX = 80;
        const startY = 100;
        const spacingX = 120;
        const spacingY = 120;
        const thumbnailSize = 100;

        UNLOCKABLES.forEach((itemName, index) => {
            // Check if this item should be visible
            // First item is always visible, others only if previous item is unlocked
            const previousItem = index > 0 ? UNLOCKABLES[index - 1] : null;
            const shouldShow = index === 0 || (previousItem && unlockedItems.includes(previousItem));

            if (!shouldShow) return;

            // Calculate cost: exponentially scale from 5 to 5000
            // Using formula: cost = 5 * (1000^(index / (totalItems - 1)))
            const totalItems = UNLOCKABLES.length;
            const cost = Math.round(5 * Math.pow(1000, index / (totalItems - 1)));

            const row = Math.floor(index / 3);
            const col = index % 3;
            const x = startX + (col * spacingX);
            const y = startY + (row * spacingY);
            const isUnlocked = unlockedItems.includes(itemName);

            // Create thumbnail container
            const container = this.add.container(x, y);

            // Thumbnail background
            const bg = this.add.graphics();
            bg.fillStyle(isUnlocked ? 0x4A4A4A : 0x2A2A2A);
            bg.fillRect(-thumbnailSize/2, -thumbnailSize/2, thumbnailSize, thumbnailSize);
            bg.lineStyle(2, isUnlocked ? 0x8B1A1A : 0x666666);
            bg.strokeRect(-thumbnailSize/2, -thumbnailSize/2, thumbnailSize, thumbnailSize);
            container.add(bg);

            // Thumbnail image (use Skull Knight for Skeleton Warrior)
            const imageKey = itemName === 'Skeleton Warrior' ? 'Skull Knight' : itemName;
            const thumbnail = this.add.image(0, 0, imageKey);
            thumbnail.setDisplaySize(thumbnailSize - 4, thumbnailSize - 4);
            container.add(thumbnail);

            // Price text (if locked)
            if (!isUnlocked) {
                const priceText = this.add.text(0, thumbnailSize/2 + 15, `${cost} Skulls`, {
                    fontFamily: 'Arial Black',
                    fontSize: 14,
                    color: '#000000',
                    stroke: '#ffffff',
                    strokeThickness: 2
                }).setOrigin(0.5);
                container.add(priceText);

                // Make clickable to buy
                const hitArea = new Phaser.Geom.Rectangle(-thumbnailSize/2, -thumbnailSize/2, thumbnailSize, thumbnailSize + 30);
                bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
                bg.on('pointerdown', () => this.buyItem(itemName, cost));
            } else {
                // Make clickable to view
                const hitArea = new Phaser.Geom.Rectangle(-thumbnailSize/2, -thumbnailSize/2, thumbnailSize, thumbnailSize);
                bg.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
                bg.on('pointerdown', () => this.viewItem(itemName));
            }
        });
    }

    buyItem(itemName, cost) {
        const totalSkulls = this.registry.get('totalSkulls');
        const unlockedItems = this.registry.get('unlockedItems') || [];

        if (totalSkulls >= cost && !unlockedItems.includes(itemName)) {
            this.registry.set('totalSkulls', totalSkulls - cost);
            unlockedItems.push(itemName);
            this.registry.set('unlockedItems', unlockedItems);
            this.scene.restart();
        }
    }

    viewItem(itemName) {
        this.scene.launch('Lightbox', { itemName: itemName });
        this.scene.pause();
    }

    createSkullKnight() {
        const unlockedItems = this.registry.get('unlockedItems') || [];
        const allUnlocked = UNLOCKABLES.every(item => unlockedItems.includes(item));

        if (!allUnlocked) return;

        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
        const squareSize = 300;
        const squareY = centerY - 180;

        // Position to the right of the altar with matching padding from left side
        const altarRightEdge = centerX + squareSize / 2;
        const knightSize = 220;
        const padding = 70; // Match the left side padding
        const knightX = altarRightEdge + padding + knightSize / 2;
        const knightY = squareY;

        // Display Skull Knight to the right of the altar
        const knight = this.add.image(knightX, knightY, 'Skull Knight');
        knight.setDisplaySize(knightSize, knightSize);
        knight.setInteractive();
        knight.on('pointerdown', () => {
            this.scene.launch('Lightbox', { itemName: 'Skull Knight' });
            this.scene.pause();
        });

        // Add ability label below the knight
        this.add.text(knightX, knightY + knightSize / 2 + 20, 'Adds 2X Fast Forward', {
            fontFamily: 'Arial Black',
            fontSize: 18,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
    }

    createPrayButton() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
        const buttonY = centerY + 50;
        const totalSkulls = this.registry.get('totalSkulls');
        const cost = 200;
        const canAfford = totalSkulls >= cost;

        const button = this.add.graphics();
        const color = canAfford ? 0x8B1A1A : 0x4A4A4A;  // Dark red or gray
        button.fillStyle(color);
        button.fillRoundedRect(centerX - 150, buttonY - 30, 300, 60, 10);
        button.lineStyle(3, 0x000000);
        button.strokeRoundedRect(centerX - 150, buttonY - 30, 300, 60, 10);

        const buttonText = this.add.text(centerX, buttonY, `PRAY (${cost} Skulls)`, {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5);

        if (canAfford) {
            button.setInteractive(new Phaser.Geom.Rectangle(centerX - 150, buttonY - 30, 300, 60), Phaser.Geom.Rectangle.Contains);
            button.on('pointerdown', () => this.pray(cost));
        }
    }

    pray(cost) {
        const totalSkulls = this.registry.get('totalSkulls');
        if (totalSkulls >= cost) {
            this.registry.set('totalSkulls', totalSkulls - cost);
            // TODO: Add prayer effect
            this.scene.restart();
        }
    }

    createBackButton() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const buttonY = GAME_CONFIG.WORLD_HEIGHT - 68;

        const button = this.add.graphics();
        button.fillStyle(0x0B5563);  // Dark teal
        button.fillRoundedRect(centerX - 60, buttonY - 20, 120, 40, 6);
        button.lineStyle(3, 0x000000);
        button.strokeRoundedRect(centerX - 60, buttonY - 20, 120, 40, 6);
        button.setInteractive(new Phaser.Geom.Rectangle(centerX - 60, buttonY - 20, 120, 40), Phaser.Geom.Rectangle.Contains);

        const buttonText = this.add.text(centerX, buttonY, 'BACK', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);

        button.on('pointerdown', () => this.scene.start('MainMenu'));
    }
}
