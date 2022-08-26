import BattleScene from "../scenes/battle-scene";
import KeyboardRenderer from "./keyboard-renderer";
import { RenderingStatus } from "./types/canvas-renderer";
import Hero from "./types/hero";

const DEFAULT_CROP = [0, 0, 0, 0];

export default class BattleRenderer extends KeyboardRenderer<BattleScene> {
  attackOptions: ["ATTACK", "ITEM", "FLEE"];
  time: DOMHighResTimeStamp;

  constructor() {
    super();
    this.attackOptions = [
      "ATTACK",
      "ITEM",
      "FLEE",
    ];
    this.time = 0;
  }

  reset(data: BattleScene) {
    super.reset(data);
    data.menuIndex = 0;
    data.foeAttackTime = 0;
    data.foeLife = data.foeMaxLife ?? 100;
    delete data.selectedIndex;
    data.battleOver = false;
    data.failedEscape = false;
    data.collected = false;
    data.message = undefined;
    data.chest = undefined;
    data.attackSequence = false;
    for (let i = 0; i < (data.persist?.game.stats?.heroes.length ?? 0); i++) {
      if (data.persist?.game.stats?.heroes[i].hp) {
        data.hero = i;
        break;
      }
    }
    // data.persist?.game.stats?.heroes.forEach((stat, hero) => {
    //   if (!stat.hp) {
    //     this.saveStats(data, stat.max ?? 100, stat.max ?? 100, hero);
    //   }
    // });
    this.updateHeroName(data);
  }

  updateHeroName(data: BattleScene) {
    data.heroName = this.getHeroName(data.hero ?? 0);
  }

  canBattle(data: BattleScene, hero?: number) {
    const heroStat = data.persist?.game.stats?.heroes[hero ?? 0];
    return heroStat?.active && heroStat.hp;
  }

  randomHero(data: BattleScene) {
    const array = [];
    for (let i = 0; i < (data.persist?.game.stats?.heroes.length ?? 0); i++) {
      if (this.canBattle(data, i)) {
        array.push(i)
      }
    }
    const index = Math.floor(Math.random() * array.length);
    return array[index];
  }

  performRendering(data: BattleScene, timestamp: DOMHighResTimeStamp): RenderingStatus {
    this.time = timestamp;
    if (this.context) {
      this.drawAnimation(data.background, timestamp, data?.startTime, true);

      if (data.foeHurtTime) {
        this.drawAnimation(data.foe?.hurt, timestamp, data?.startTime, true);
        if (timestamp - data.foeHurtTime > 1000) {
          data.foeHurtTime = 0;
          if (!data.foeLife) {
            data.chest = {
              opened: 0,
            };
            data.persist?.game.stats?.heroes.filter(({ active, hp }) => active && hp)
              .forEach((heroStat, hero) => this.addXP(data, data.xp ?? 0, hero));
            let extraMessage = "";
            data.persist?.game.stats?.heroes.filter(({ active, hp }) => active && hp)
              .forEach((heroStat, hero) => {
                extraMessage += this.updateStatsWithLevelProgression(data, hero) ? ` ${this.getHeroName(hero)} advanced a new level.` : '';
              });
            this.updateLevelProgression(data);
            data.message = `The ${data.foe?.name} has been defeated.You gained ${data.xp} XP.` + extraMessage;
            data.battleOver = true;
          }
        }
      } else if (!data.foeLife) {
        //  hide
      } else if (data.foeAttackTime) {
        const { animating } = this.drawAnimation(data.foe?.attack, timestamp, data.foeAttackTime, false);
        if (!animating) {
          data.foeAttackTime = 0;
          data.waitTime = timestamp;
          data.attackSequence = false;
          if (Math.random() < this.getDodgeChance(data) && !data.failedEscape) {
            data.foeMissed = true;
            // console.log("FOE MISSED");
            this.playSFX(data.sounds?.miss);

            for (let i = 0; i < (data.persist?.game.stats?.heroes.length ?? 0); i++) {
              if (data.persist?.game.stats?.heroes[i].hp) {
                data.hero = i;
                break;
              }
            }
            this.updateHeroName(data);
          } else {
            data.hurtTime = timestamp;
            data.failedEscape = false;
            // console.log("FOE HIT", data.heroName);
            const damage = 1 + ((data.foeStrength ?? 10) * Math.random() * 2 * this.getDefense(data, data.hero ?? 0));
            const heroStat = this.getHeroStat(data, data.hero ?? 0);
            const hp = Math.max(0, heroStat.hp ?? 0) - Math.floor(damage);
            this.saveStats(data, hp, heroStat.max ?? 0, data.hero ?? 0);
            this.playSFX(data.sounds?.foeHit);
          }
        }
      } else {
        this.drawAnimation(data.foe?.idle, timestamp, data?.startTime, false);
      }

      if (data.attackTime) {
        const { animating } = this.drawAnimation(data.strike, timestamp, data.attackTime ?? 0, false);
        if (!animating) {
          data.attackTime = 0;
        }
        if (timestamp - data.attackTime > 100 && !data.missed && !data.foeHurtTime) {
          if (Math.random() < .3 || !this.getAttack(data, data.hero ?? 0)) {
            // console.log("MISSED");
            data.missed = true;
            this.playSFX(data.sounds?.miss);
          } else {
            // console.log("HIT");
            data.foeLife = Math.max(0, (data.foeLife ?? 0) - Math.floor(1 + this.getAttack(data, data.hero ?? 0) * Math.random() * 2));
            data.foeHurtTime = timestamp;
            this.playSFX(data.sounds?.playerHit);
            if (!data.foeLife) {
              this.changeMusic(undefined);
            }
          }
        }
      }

      if (data.chest) {
        if (data.chest.opened) {
          const { animating } = this.drawAnimation(data.chestOpen, timestamp, data.chest.opened, false);
          if (!animating && !data.message && !data.collected) {
            data.collected = true;

            data.justPickedUp = true;
            data.message = `The chest contains ${data.gold} gold.`;
            this.addGold(data, data.gold ?? 0);
          }

        } else {
          this.drawAnimation(data.chestClose, timestamp, 0, false);
        }

        if (!data.chest.opened && !data.message) {
          data.chest.opened = timestamp;
          this.playSFX(data.sounds?.door);
        }
      }

      if (data.hurtTime) {
        this.drawAnimation(data.hurt, timestamp, data.hurtTime ?? 0, true);
        if (timestamp - data.hurtTime > 1000) {
          data.hurtTime = 0;
          for (let i = 0; i < (data.persist?.game.stats?.heroes.length ?? 0); i++) {
            if (data.persist?.game.stats?.heroes[i].hp) {
              data.hero = i;
              break;
            }
          }
          this.updateHeroName(data);
        }
      }

      if (data.attackSequence && !data.message) {
        if (!data.attackTime && !data.foeHurtTime && !data.foeAttackTime) {
          //  Done attacking.
          if ((data.hero ?? 0) < (data.persist?.game.stats?.heroes.length ?? 0) - 1 && !data.failedEscape) {
            //  next attacking hero
            data.hero = (data.hero ?? 0) + 1;
            this.updateHeroName(data);
            if (this.canBattle(data, data.hero)) {
              data.attackSequence = false;
            }
          } else {
            //  Foe attack
            data.hero = this.randomHero(data);
            this.updateHeroName(data);
            data.foeAttackTime = timestamp;
          }
        }
      }

      if (data.waitTime && timestamp - (data.waitTime ?? 0) > 300) {
        data.waitTime = 0;
      }

      if (data.dialog) {
        data.dialog.hidden = (data.foeAttackTime ?? 0) > 0
          || (data.attackTime ?? 0) > 0
          || (data.hurtTime ?? 0) > 0
          || (data.foeHurtTime ?? 0) > 0
          || (data.waitTime ?? 0) > 0
          || data.battleOver
          || !!data.message;
      }

      if (data.persist?.game.stats?.heroes.every(({ hp }) => !hp) && !data.hurtTime && !data.battleOver && data.dialog) {
        data.battleOver = true;
        data.message = "You have died.";
        data.dialog.hidden = true;
        data.mute = true;
      }
    }
    return data.message || !data.battleOver || (data.chest && !data.collected) ? RenderingStatus.RENDERING : RenderingStatus.COMPLETED;
  }

  getDodgeChance(data: BattleScene) {
    if (data.persist?.game.inventory?.["shield"]) {
      return .4;
    }
    return .3;
  }

  hasCloak(data: BattleScene) {
    return (data.inventory ?? []).indexOf("cloak") >= 0;
  }

  createKeyHandlerDown(data: BattleScene): (e: KeyboardEvent) => void {
    const numOptions = data.subMenu && data.inventory ? data.inventory.length : this.attackOptions.length;
    return (e) => {
      e.preventDefault();
      if (data.dialog?.hidden) {
        return;
      }
      switch (e.code) {
        case "KeyA":
        case "ArrowLeft":
          data.menuIndex = ((data.menuIndex ?? 0) - 1 + numOptions) % numOptions;
          break;
        case "KeyD":
        case "ArrowRight":
          data.menuIndex = ((data.menuIndex ?? 0) + 1 + numOptions) % numOptions;
          break;
        case "Space":
          data.selectedIndex = data.menuIndex;
          data.menuIndex = 0;
          if (data.subMenu) {
            if (data.selectedIndex === 0) {
              const item = data.inventory?.[0];
              if (item) {
                this.removeItem(data, item);
                this.performAction(data, data.itemActions?.[item]);
                this.playSFX(data.sounds?.pickup);

                if (data.dialog) {
                  data.dialog.hidden = true;
                  data.attackSequence = true;
                  data.missed = true;
                }
              }
            } else if (data.selectedIndex === 1) {
              const item = data.inventory?.[1];
              if (item) {
                this.removeItem(data, item);
                this.performAction(data, data.itemActions?.[item]);
                this.playSFX(data.sounds?.pickup);

                if (data.dialog) {
                  data.dialog.hidden = true;
                  data.attackSequence = true;
                  data.missed = true;
                }
              }
            }
            delete data.subMenu;
          } else {
            if (data.selectedIndex === 0) {
              data.attackTime = this.time;
              data.attackSequence = true;
              data.foeHurtTime = 0;
              data.missed = false;
              data.hurtTime = 0;
              data.foeMissed = false;
              data.failedEscape = false;
            } else if (data.selectedIndex === 1) {
              data.subMenu = true;
              delete data.selectedIndex;
            } else if (data.selectedIndex === 2) {
              if (Math.random() < .3 * (this.hasCloak(data) ? .5 : 1)) {
                data.message = "Your escape attempt has FAILED.";
                if (data.dialog) {
                  data.dialog.hidden = true;
                  data.attackSequence = true;
                  data.missed = true;
                  data.failedEscape = true;
                }
              } else {
                data.message = "You have escaped.";
                data.battleOver = true;
                if (data.dialog) {
                  data.dialog.hidden = true;
                }
              }
            }
          }
          break;
      }
    };
  }
}