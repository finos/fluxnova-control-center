import { BasePage } from './base-page.po';

export class LoginPage extends BasePage {
  readonly SSO_USR_INPUT_SELECTOR: string = 'input[name="loginfmt"]';
  readonly MAN_USR_INPUT_SELECTOR: string = 'input[name="username"]';

  /**
   * Logs user in through SSO form.  This represents the normal user flow.
   * Can be used to test SSO into other applications; e.g. Cockpit.
   *
   * @param email
   * @param password
   */
  public async loginSSO(email: string, password: string) {
    await this.goto();

    await this.getUsernameInput(this.SSO_USR_INPUT_SELECTOR).fill(`${email}`);
    await this.submit.click(); // "Next"

    await this.page.waitForResponse((resp) => resp.url().includes('convergedlogin_ppassword') && resp.status() === 200);

    await this.passwordInput.fill(password);
    await this.submit.click(); // "Sign in"
    await this.loginComplete();
    await this.submit.click(); // "Stay signed in"
  }

  /**
   * Logs user in via the login page.  Non-typical flow, but up to 3x faster login speed vs SSO.
   *
   * @param username
   * @param password
   */
  public async loginManual(username: string, password: string) {
    await this.goto('./login');

    await this.getUsernameInput().fill(`${username}`);
    await this.passwordInput.fill(password);
    await this.manualLoginSubmit.click();
    await this.loginComplete();
  }

  public loginComplete() {
    return this.page.waitForResponse(
      (resp) => resp.url().includes('/login') && resp.status() >= 200 && resp.status() < 400,
    );
  }

  protected getUsernameInput(selector: string = this.MAN_USR_INPUT_SELECTOR) {
    return this.page.locator(selector);
  }

  protected get passwordInput() {
    return this.page.locator('input[type="password"]');
  }

  protected get manualLoginSubmit() {
    return this.page.locator('input[id="login"]');
  }

  protected get submit() {
    return this.page.locator('input[type="submit"]');
  }
}
