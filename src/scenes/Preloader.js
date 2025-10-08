class Preloader extends Phaser.Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        this.createLoadingScreen();
    }

    createLoadingScreen() {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

        // Create full screen blue background
        const bg = this.add.graphics();
        bg.fillStyle(0x028af8, 1);
        bg.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        this.add.text(centerX, centerY, 'Loading...', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff'
        }).setOrigin(0.5);

        const progressBar = this.add.rectangle(centerX, centerY + 66, 468, 32);
        progressBar.setStrokeStyle(2, 0xffffff);
        const bar = this.add.rectangle(centerX - 230, centerY + 66, 4, 28, 0xffffff);

        this.load.on("progress", (progress) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload() {
        AssetCreator.createSkullFrames(this);
        AssetCreator.createVanishFrames(this);
        AssetCreator.createBackground(this);
        AssetCreator.createBasket(this);
        AssetCreator.createBumper(this);
        AssetCreator.createFlipper(this);
        AssetCreator.createTriangle(this);
        AssetCreator.createBigSkull(this);
        AssetCreator.createFloor(this);

        // Load unlockables
        UNLOCKABLES.forEach(name => {
            this.load.image(name, `src/assets/images/unlockables/${name}.png`);
        });

        // Load rewards
        this.load.image('Skull Knight', 'src/assets/images/rewards/Skull Knight.png');
    }

    create() {
        this.createAnimations();
        this.transitionToMainMenu();
    }

    createAnimations() {
        this.anims.create({
            key: "rotate",
            frames: Array.from({length: 7}, (_, i) => ({ key: `skull_${(i+1).toString().padStart(2, '0')}` })),
            frameRate: 16,
            repeat: -1
        });

        this.anims.create({
            key: "vanish",
            frames: Array.from({length: 4}, (_, i) => ({ key: `vanish_${i+1}` })),
            frameRate: 10
        });
    }

    transitionToMainMenu() {
        this.scene.transition({
            target: 'MainMenu',
            duration: 1000,
            moveBelow: true,
            onUpdate: (progress) => {
                this.cameras.main.setAlpha(1 - progress);
            }
        });
    }
}