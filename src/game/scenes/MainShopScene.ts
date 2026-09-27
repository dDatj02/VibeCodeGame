import Phaser from 'phaser';
import { useCustomerStore } from '../../stores/customerStore';
import { useRecipeStore } from '../../stores/recipeStore';
import { useShopStore } from '../../stores/shopStore';
import { useGameStore } from '../../stores/gameStore';
import { OrderSystem } from '../../systems/OrderSystem';
import { ActiveCustomer } from '../../types';

interface CustomerSpriteGroup {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Graphics;
  head: Phaser.GameObjects.Arc;
  bubble: Phaser.GameObjects.Container;
  patienceBarBg: Phaser.GameObjects.Graphics;
  patienceBarFill: Phaser.GameObjects.Graphics;
  drinkIcon: Phaser.GameObjects.Text;
  customerId: string;
}

export class MainShopScene extends Phaser.Scene {
  private customerGroups: Map<string, CustomerSpriteGroup> = new Map();
  private blenderContainer!: Phaser.GameObjects.Container;
  private blenderLiquid!: Phaser.GameObjects.Graphics;
  private isBlenderSpinning = false;
  private motorbikes: Phaser.GameObjects.Container[] = [];
  private rainParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  private unsubscribeStore: (() => void) | null = null;

  constructor() {
    super({ key: 'MainShopScene' });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.drawStreetBackground(width, height);
    this.createSmoothieCart(width, height);
    this.createBlenderStation(width, height);
    this.createMotorbikeTraffic(width, height);

    // Clean up previous subscription if exists
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }

    // Subscribe to customer store changes
    this.unsubscribeStore = useCustomerStore.subscribe((state) => {
      // Check if scene is still active and valid before modifying display list
      if (!this.sys || !this.add || !this.scene.isActive()) return;
      this.syncCustomers(state.activeCustomers);
    });

    // Cleanup on scene shutdown or destroy
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.unsubscribeStore) {
        this.unsubscribeStore();
        this.unsubscribeStore = null;
      }
      this.customerGroups.clear();
    });

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      if (this.unsubscribeStore) {
        this.unsubscribeStore();
        this.unsubscribeStore = null;
      }
      this.customerGroups.clear();
    });

    // Initial sync
    this.syncCustomers(useCustomerStore.getState().activeCustomers);
  }

  private drawStreetBackground(w: number, h: number) {
    const bg = this.add.graphics();

    // 1. Sky / Buildings Backdrop (Top 40%)
    const skyHeight = h * 0.45;
    bg.fillGradientStyle(0xFDE68A, 0xFDE68A, 0xFED7AA, 0xFED7AA, 1);
    bg.fillRect(0, 0, w, skyHeight);

    // Distant Saigon townhouses (narrow shophouses with balconies)
    const houseWidth = 55;
    const houseCount = Math.ceil(w / houseWidth) + 1;
    const houseColors = [0x93C5FD, 0xFCA5A5, 0xFDE047, 0x86EFAC, 0xC4B5FD];

    for (let i = 0; i < houseCount; i++) {
      const houseH = 70 + (i % 4) * 20;
      const col = houseColors[i % houseColors.length];
      bg.fillStyle(col, 0.4);
      bg.fillRect(i * houseWidth, skyHeight - houseH, houseWidth - 4, houseH);

      // Windows
      bg.fillStyle(0x475569, 0.5);
      bg.fillRect(i * houseWidth + 10, skyHeight - houseH + 15, 14, 20);
      bg.fillRect(i * houseWidth + 30, skyHeight - houseH + 15, 14, 20);
    }

    // Street greenery / palm tree tops
    bg.fillStyle(0x15803D, 0.6);
    for (let i = 0; i < w; i += 120) {
      bg.fillCircle(i + 20, skyHeight - 40, 24);
      bg.fillCircle(i + 40, skyHeight - 45, 20);
    }

    // 2. Road asphalt (Middle 25%)
    const roadY = skyHeight;
    const roadH = h * 0.22;
    bg.fillStyle(0x334155, 1);
    bg.fillRect(0, roadY, w, roadH);

    // Road dashed divider lines
    bg.fillStyle(0xFACC15, 0.8);
    for (let x = 10; x < w; x += 40) {
      bg.fillRect(x, roadY + roadH / 2 - 2, 22, 4);
    }

    // 3. Sidewalk pavement (Bottom 35%)
    const walkY = roadY + roadH;
    const walkH = h - walkY;

    // Yellow & Black painted Saigon curb
    bg.fillStyle(0xEAB308, 1);
    bg.fillRect(0, walkY, w, 10);
    for (let x = 0; x < w; x += 30) {
      bg.fillStyle(0x1E293B, 1);
      bg.fillRect(x, walkY, 15, 10);
    }

    // Warm terracotta sidewalk pavers
    bg.fillStyle(0xEA580C, 0.9);
    bg.fillRect(0, walkY + 10, w, walkH - 10);

    // Paver grid lines
    bg.lineStyle(1, 0xC2410C, 0.5);
    for (let x = 0; x < w; x += 35) {
      bg.lineBetween(x, walkY + 10, x, h);
    }
    for (let y = walkY + 10; y < h; y += 30) {
      bg.lineBetween(0, y, w, y);
    }
  }

  private createSmoothieCart(w: number, h: number) {
    const cartX = Math.max(90, w * 0.22);
    const cartY = h * 0.66;

    const cartContainer = this.add.container(cartX, cartY);

    const g = this.add.graphics();

    // Red & Blue Plastic Stools (Iconic Vietnamese street element)
    // Red stool
    g.fillStyle(0xDC2626, 1);
    g.fillRoundedRect(-80, 50, 24, 20, 3);
    g.fillRect(-78, 70, 4, 18);
    g.fillRect(-62, 70, 4, 18);

    // Blue stool
    g.fillStyle(0x2563EB, 1);
    g.fillRoundedRect(-50, 52, 24, 20, 3);
    g.fillRect(-48, 72, 4, 16);
    g.fillRect(-32, 72, 4, 16);

    // Cart Wheels
    g.fillStyle(0x0F172A, 1);
    g.fillCircle(-40, 75, 16);
    g.fillCircle(40, 75, 16);
    g.fillStyle(0x94A3B8, 1);
    g.fillCircle(-40, 75, 6);
    g.fillCircle(40, 75, 6);

    // Stainless steel cart main body
    g.fillStyle(0xE2E8F0, 1);
    g.fillRoundedRect(-65, -30, 130, 95, 6);
    g.fillStyle(0xCBD5E1, 1);
    g.fillRect(-60, 20, 120, 40);

    // Front sign board "QUÁN SINH TỐ"
    g.fillStyle(0xDC2626, 1);
    g.fillRoundedRect(-55, -20, 110, 32, 4);

    const signText = this.add.text(0, -4, 'QUÁN SINH TỐ', {
      fontFamily: 'Cabinet Grotesk, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FEF08A',
    }).setOrigin(0.5);

    // Glass display case on counter
    g.fillStyle(0xBAE6FD, 0.45);
    g.fillRoundedRect(-55, -75, 110, 45, 4);
    g.lineStyle(2, 0x94A3B8, 1);
    g.strokeRoundedRect(-55, -75, 110, 45, 4);

    // Fresh fruit emojis inside glass case
    const fruitIcons = this.add.text(0, -52, '🥭 🥑 🍓 🍌', {
      fontSize: '14px',
    }).setOrigin(0.5);

    // Canopy awning posts
    g.fillStyle(0x64748B, 1);
    g.fillRect(-55, -110, 4, 80);
    g.fillRect(51, -110, 4, 80);

    // Striped Sun Canopy (Red & Yellow awning)
    const awningW = 140;
    const stripeW = 14;
    for (let i = 0; i < 10; i++) {
      g.fillStyle(i % 2 === 0 ? 0xDC2626 : 0xFACC15, 1);
      g.fillRect(-70 + i * stripeW, -120, stripeW, 25);
      // Scalloped bottom edge
      g.fillCircle(-70 + i * stripeW + stripeW / 2, -95, stripeW / 2);
    }

    cartContainer.add([g, signText, fruitIcons]);
  }

  private createBlenderStation(w: number, h: number) {
    const stationX = Math.max(90, w * 0.22) + 25;
    const stationY = h * 0.66 - 28;

    this.blenderContainer = this.add.container(stationX, stationY);

    const g = this.add.graphics();

    // Blender base motor
    g.fillStyle(0x1E293B, 1);
    g.fillRoundedRect(-14, 0, 28, 18, 3);
    // Control dial
    g.fillStyle(0xEF4444, 1);
    g.fillCircle(0, 9, 3);

    // Glass jar
    g.fillStyle(0xE0F2FE, 0.6);
    g.fillRoundedRect(-11, -30, 22, 30, 2);
    // Lid
    g.fillStyle(0x0F172A, 1);
    g.fillRect(-12, -34, 24, 4);

    // Liquid inside jar (changes color when blending)
    this.blenderLiquid = this.add.graphics();
    this.blenderLiquid.fillStyle(0xF59E0B, 0.9);
    this.blenderLiquid.fillRoundedRect(-9, -22, 18, 20, 2);

    this.blenderContainer.add([g, this.blenderLiquid]);

    // Click handler to trigger blending visual
    this.blenderContainer.setSize(40, 50);
    this.blenderContainer.setInteractive({ useHandCursor: true });
    this.blenderContainer.on('pointerdown', () => {
      this.animateBlender();
    });
  }

  public animateBlender() {
    if (this.isBlenderSpinning || !this.tweens || !this.scale) return;
    this.isBlenderSpinning = true;

    const colors = [0xF59E0B, 0x10B981, 0xEF4444, 0xEAB308];
    const pickedColor = colors[Math.floor(Math.random() * colors.length)];

    this.tweens.add({
      targets: this.blenderContainer,
      x: this.blenderContainer.x + 2,
      duration: 50,
      yoyo: true,
      repeat: 12,
      onUpdate: () => {
        if (!this.blenderLiquid || !this.blenderLiquid.scene) return;
        this.blenderLiquid.clear();
        this.blenderLiquid.fillStyle(pickedColor, 0.95);
        this.blenderLiquid.fillRoundedRect(-9, -24 + Math.random() * 4, 18, 20, 2);
      },
      onComplete: () => {
        this.isBlenderSpinning = false;
        if (this.blenderContainer && this.scale) {
          this.blenderContainer.x = Math.max(90, this.scale.width * 0.22) + 25;
        }
      },
    });
  }

  private createMotorbikeTraffic(w: number, h: number) {
    const roadY = h * 0.45 + (h * 0.22) / 2;

    const spawnBike = () => {
      const bikeContainer = this.add.container(-60, roadY + (Math.random() > 0.5 ? -12 : 12));
      const g = this.add.graphics();

      // Motorbike body & wheels
      g.fillStyle(0x0F172A, 1);
      g.fillCircle(-16, 12, 7);
      g.fillCircle(16, 12, 7);

      // Frame
      const bikeCols = [0xDC2626, 0x2563EB, 0x059669, 0xD97706];
      g.fillStyle(bikeCols[Math.floor(Math.random() * bikeCols.length)], 1);
      g.fillRect(-12, 4, 24, 6);

      // Driver helmet & body
      g.fillStyle(0xFBBF24, 1);
      g.fillCircle(2, -8, 6); // helmet
      g.fillStyle(0x3B82F6, 1);
      g.fillRoundedRect(-4, -2, 12, 10, 2); // shirt

      bikeContainer.add(g);

      // Drive across screen from left to right
      this.tweens.add({
        targets: bikeContainer,
        x: w + 80,
        duration: 3500 + Math.random() * 2000,
        ease: 'Linear',
        onComplete: () => {
          bikeContainer.destroy();
        },
      });
    };

    // Spawn bike periodically
    this.time.addEvent({
      delay: 5000,
      callback: spawnBike,
      loop: true,
    });
  }

  private syncCustomers(customers: ActiveCustomer[]) {
    if (!this.sys || !this.add || !this.scene.isActive() || !this.scale) return;
    const currentIds = new Set(customers.map((c) => c.id));

    // Remove customers no longer active
    for (const [id, group] of this.customerGroups.entries()) {
      if (!currentIds.has(id)) {
        // Animate leave
        this.tweens.add({
          targets: group.container,
          alpha: 0,
          y: group.container.y - 15,
          duration: 300,
          onComplete: () => {
            group.container.destroy();
          },
        });
        this.customerGroups.delete(id);
      }
    }

    // Add or update existing customers
    const queueStartX = Math.max(90, this.scale.width * 0.22) + 95;
    const spacing = 52;
    const baseY = this.scale.height * 0.72;

    customers.forEach((cust, idx) => {
      const targetX = queueStartX + idx * spacing;
      let group = this.customerGroups.get(cust.id);

      if (!group) {
        group = this.createCustomerSprite(cust, targetX + 100, baseY);
        this.customerGroups.set(cust.id, group);
      }

      // Move into queue position smoothly
      this.tweens.add({
        targets: group.container,
        x: targetX,
        y: baseY,
        duration: 400,
        ease: 'Cubic.easeOut',
      });

      // Update patience bar
      const patiencePct = Math.max(0, cust.remainingPatience / cust.maxPatience);
      group.patienceBarFill.clear();
      const barColor = patiencePct > 0.5 ? 0x10B981 : patiencePct > 0.25 ? 0xF59E0B : 0xEF4444;
      group.patienceBarFill.fillStyle(barColor, 1);
      group.patienceBarFill.fillRect(-16, -55, 32 * patiencePct, 4);
    });
  }

  private createCustomerSprite(cust: ActiveCustomer, x: number, y: number): CustomerSpriteGroup {
    const container = this.add.container(x, y);

    const recipe = useRecipeStore.getState().getRecipeById(cust.desiredRecipeId);
    const drinkIconChar = recipe ? recipe.icon : '🥤';

    // 1. Customer Body & Legs
    const bodyG = this.add.graphics();
    const outfitColors = [0x3B82F6, 0xEC4899, 0x10B981, 0x8B5CF6, 0xF97316];
    const outfitColor = outfitColors[Math.floor(Math.random() * outfitColors.length)];

    // Legs
    bodyG.fillStyle(0x1E293B, 1);
    bodyG.fillRect(-6, 12, 4, 12);
    bodyG.fillRect(2, 12, 4, 12);

    // Torso / Shirt
    bodyG.fillStyle(outfitColor, 1);
    bodyG.fillRoundedRect(-10, -8, 20, 22, 4);

    // Head
    const headArc = this.add.circle(0, -18, 10, 0xFED7AA);

    // Hair
    const hairG = this.add.graphics();
    hairG.fillStyle(0x1F2937, 1);
    hairG.fillCircle(0, -22, 10);
    hairG.fillRect(-9, -24, 18, 6);

    // 2. Patience Bar Background
    const patienceBg = this.add.graphics();
    patienceBg.fillStyle(0x334155, 0.8);
    patienceBg.fillRoundedRect(-18, -57, 36, 8, 2);

    const patienceFill = this.add.graphics();

    // 3. Order Speech Bubble
    const bubble = this.add.container(0, -36);
    const bubbleBg = this.add.graphics();
    bubbleBg.fillStyle(0xFFFFFF, 1);
    bubbleBg.fillRoundedRect(-14, -14, 28, 26, 6);
    // Little pointer triangle
    bubbleBg.fillTriangle(-4, 12, 4, 12, 0, 17);
    bubbleBg.lineStyle(1.5, 0xCBD5E1, 1);
    bubbleBg.strokeRoundedRect(-14, -14, 28, 26, 6);

    const drinkText = this.add.text(0, -1, drinkIconChar, {
      fontSize: '13px',
    }).setOrigin(0.5);

    bubble.add([bubbleBg, drinkText]);

    // Add everything to container
    container.add([bodyG, hairG, headArc, patienceBg, patienceFill, bubble]);

    // Make interactive for instant serve on click
    container.setSize(38, 70);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerdown', () => {
      this.animateBlender();
      OrderSystem.serveOrder(cust.id);
    });

    return {
      container,
      body: bodyG,
      head: headArc,
      bubble,
      patienceBarBg: patienceBg,
      patienceBarFill: patienceFill,
      drinkIcon: drinkText,
      customerId: cust.id,
    };
  }

  update(time: number, delta: number) {
    // Delta in seconds
    const deltaSeconds = delta / 1000;
    // Tick game system
    // (Orchestrated in React hook or here)
  }
}
