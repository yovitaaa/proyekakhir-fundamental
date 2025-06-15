export default class NewPresenter {
    #view;
    #model;
  
    constructor({ view, model }) {
      this.#view = view;
      this.#model = model;
    }
  
    async showNewFormMap() {
      this.#view.showMapLoading();
      try {
        await this.#view.initialMap();
      } catch (error) {
        console.error('showNewFormMap: error:', error);
      } finally {
        this.#view.hideMapLoading();
      }
    }
  
    async postNewStory({ description, photo, latitude, longitude }) {
      this.#view.showSubmitLoadingButton();
      try {
        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo', photo);
        if (latitude) formData.append('lat', latitude);
        if (longitude) formData.append('lon', longitude);
  
        const response = await this.#model.storeNewStory(formData);
  
        if (!response || response.error) {
          this.#view.storeFailed(response?.message || 'Terjadi kesalahan saat menyimpan Cerita.');
          return;
        }
  
        this.#view.storeSuccessfully(response.message);
      } catch (error) {
        console.error('postNewStory: error:', error);
        this.#view.storeFailed(error.message);
      } finally {
        this.#view.hideSubmitLoadingButton();
      }
    }
    async submitForm({ description, evidenceImages, latitude, longitude }) {
        this.#view.showSubmitLoadingButton();
      
        try {
          const formData = new FormData();
          formData.append('description', description);
      
          if (latitude) formData.append('lat', latitude);
          if (longitude) formData.append('lon', longitude);
      
          evidenceImages.forEach((image, index) => {
            formData.append(`photo`, image); 
          });
      
          const response = await this.#model.storeNewStory(formData);
      
          if (!response || response.error) {
            this.#view.storeFailed(response?.message || 'Terjadi kesalahan saat menyimpan Cerita.');
            return;
          }
      
          this.#view.storeSuccessfully(response.message);
        } catch (error) {
          console.error('submitForm error:', error);
          this.#view.storeFailed(error.message);
        } finally {
          this.#view.hideSubmitLoadingButton();
        }
      }
      
  }
  