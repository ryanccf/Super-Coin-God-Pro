class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }
    
    create() {
        Object.keys(DEFAULT_SAVE_DATA).forEach(key => {
            if (!this.registry.has(key)) {
                this.registry.set(key, DEFAULT_SAVE_DATA[key]);
            }
        });
        
        this.scene.start('Preloader');
    }
}