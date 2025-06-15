export default class LoginPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model;
    this.#authModel = authModel;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.getLogin({ email, password });

      if (!response.ok) {
        console.error('getLogin: response:', response);
        this.#view.loginFailed(response.message || 'Login failed');
        return;
      }

      if (response.loginResult && response.loginResult.token) {
        this.#authModel.putToken(response.loginResult.token);
        this.#view.loginSuccessfully(response.message, response.loginResult);
        

        location.hash = '/';
      } else {
        console.error('getLogin: Token is missing in response');
        this.#view.loginFailed('Token missing in response');
      }

    } catch (error) {
      console.error('getLogin: error:', error);
      this.#view.loginFailed(error.message || 'An unexpected error occurred');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
