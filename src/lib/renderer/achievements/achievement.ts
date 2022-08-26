import { im } from "mathjs";
import { Newgrounds } from "../../../external/newgrounds/newgroundsio.min";

declare global {
  interface Window { achievement?: Achievement }
}

interface NG {
  user?: {
    name: string;
    icons: {
      small: string;
    }
  };
  login_error?: {
    message: string;
  };
  getValidSession(callback: () => void, context?: any): void;
  callComponent(api: string, input: any, callback: (result: any) => void): void;
  requestLogin(onLoggedIn: (ngio: NG) => void, onFail: (ngio: NG) => void, onCancel: (ngio: NG) => void): void;
}

interface Medal {
  id: string;
  name: string;
  unlocked: boolean;
}

export interface NewgroundsCredentials {
  key: string;
  secret: string;
}

export class Achievement {
  ng?: NG;
  credentials?: NewgroundsCredentials;
  medals?: Medal[];
  scoreboards?: any[];

  constructor() {
    window.achievement = this;
    if (!document.getElementById("newgrounds-login")) {
      const button = document.body.appendChild(document.createElement("button"));
      button.id = "newgrounds-login";
      button.style.position = "absolute";
      button.style.bottom = "5px";
      button.style.right = "5px";
      button.style.height = "24px";
      button.style.fontSize = "10pt";
      button.style.zIndex = "1000";
      button.classList.add("button");
      button.style.display = "none";
      button.innerText = "login newgrounds";
      button.addEventListener("click", (e) => {
        this.requestLogin();
        e.stopPropagation();
      });
    }
  }

  async loginCheck(credentials: NewgroundsCredentials) {
    const ngio = await this.getNg(credentials);
    if (!ngio?.user) {
      console.log("Not logged into newgrounds.");
      const button = document.getElementById("newgrounds-login");
      if (button) {
        //        button.style.display = "";
      }
    } else {
      this.onLoggedIn(ngio);
    }
  }

  onLoggedIn(ngio: NG) {
    const img = document.body.appendChild(document.createElement("img"));
    img.style.position = "absolute";
    img.style.width = "25px";
    img.style.height = "25px";
    img.style.right = "5px";
    img.style.bottom = "5px";
    img.src = ngio.user?.icons.small ?? "";
    setTimeout(() => {
      img.style.display = "none";
    }, 1000);
    console.log("Welcome", ngio.user?.name + "!");
  }

  async requestLogin() {
    if (!this.credentials) {
      return;
    }
    const ngio = await this.getNg(this.credentials);
    ngio?.requestLogin(() => this.onLoggedIn(ngio), () => this.onLoginFailed(ngio), () => this.onLoginCancelled());
    const button = document.getElementById("newgrounds-login");
    if (button) {
      button.style.display = "none";
    }
  }

  onLoginFailed(ngio: NG) {
    console.log("There was a problem logging in: ", ngio?.login_error?.message);
    const button = document.getElementById("newgrounds-login");
    if (button) {
      button.style.display = "";
    }
  }

  onLoginCancelled() {
    console.log("The user cancelled the login.");
    const button = document.getElementById("newgrounds-login");
    if (button) {
      button.style.display = "";
    }
  }

  async getNg(credentials: NewgroundsCredentials): Promise<NG | undefined> {
    if (credentials.key !== this.credentials?.key || credentials.secret !== this.credentials?.secret) {
      this.credentials = { ...credentials };
      this.ng = new Newgrounds.io.core(this.credentials.key, this.credentials.secret);
      return new Promise(resolve => this.ng?.getValidSession(() => resolve(this.ng)));
    }
    return Promise.resolve(this.ng);
  }

  async getMedals(ngio?: NG): Promise<Medal[]> {
    if (this.medals) {
      return this.medals
    }
    if (!ngio) {
      return [];
    }
    return new Promise(resolve => {
      ngio?.callComponent("Medal.getList", {}, result => {
        this.medals = result.medals;
        resolve(result.medals);
      });
    });
  }

  async unlock({ credentials, medalName }: { credentials: NewgroundsCredentials; medalName: string }): Promise<{ medal: Medal, justUnlocked: boolean }> {
    const allMedals = await this.getMedals(await this.getNg(credentials));
    const [medal] = allMedals.filter(medal => medal.name === medalName);
    const ngio = await this.getNg(credentials);
    return new Promise((resolve) => {
      if (medal.unlocked) {
        resolve({ medal, justUnlocked: false })
      }
      ngio?.callComponent("Medal.unlock", { id: medal?.id }, (result) => {
        console.log(result);
        resolve({ medal: result.medal, justUnlocked: true });
      });
    });
  }

  fetchScoreboards(ngio?: NG, callback?: (result: any) => void) {
    if (this.scoreboards) {
      callback?.(this.scoreboards);
    } else {
      ngio?.callComponent("ScoreBoard.getBoards", {}, (result) => {
        if (result.success) {
          this.scoreboards = result.scoreboards;
          this.scoreboards?.forEach((scoreboard) => console.log("Scoreboard:", scoreboard.name, scoreboard.id));
        }
      });
    }
  }

  postNGScore(ngio?: NG, value?: number, callback?: (result: any) => void) {
    this.fetchScoreboards(ngio, (scoreboards: any[]) => {
      const scoreboard = scoreboards[0];
      ngio?.callComponent("ScoreBoard.postScore", { id: scoreboard.id, value }, callback ?? ((result) => { }));
    });
  }

  async postScore({ credentials, value }: { credentials: NewgroundsCredentials; value: number }): Promise<void> {
    const ngio = await this.getNg(credentials);
    return new Promise((resolve) => {
      this.postNGScore(ngio, value, () => resolve());
    });
  }

}