class Preloader extends Phaser.Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        this.createLoadingScreen();
    }

    createLoadingScreen() {
        this.add.rectangle(512, 384, 1024, 768, 0x028af8);
        this.add.text(512, 384, 'Loading...', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff'
        }).setOrigin(0.5);

        const progressBar = this.add.rectangle(512, 450, 468, 32);
        progressBar.setStrokeStyle(2, 0xffffff);
        const bar = this.add.rectangle(512-230, 450, 4, 28, 0xffffff);

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
        AssetCreator.createBigSkull(this);
        AssetCreator.createFloor(this);
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