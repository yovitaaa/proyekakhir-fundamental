import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as StoryAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #map = null;
  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Share Your Story</h1>
            <p class="new-story__header__description">
              Harap lengkapi formulir berikut untuk menambahkan cerita baru.<br>
            </p>
          </div>
        </div>
      </section>
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
          
              
            
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Storyline</label>
              <div class="new-form__description__container">
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Yuk, ceritain pengalaman menarikmu! Bisa tentang kejadian apa, kapan, dan di mana saja."
                ></textarea>
              </div>
            </div>

            <div class="form-control">
              <label for="documentations-input" class="new-form__documentations__title">Dokumentasi</label>
              <div id="documentations-more-info">Biar makin lengkap, kamu bisa upload foto dokumentasinya juga.</div>
              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">take a photo</button>
                  <input
                    id="documentations-input"
                    class="new-form__documentations__input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    aria-multiline="true"
                    aria-describedby="documentations-more-info"
                  >
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    Open camera
                  </button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <video id="camera-video" class="new-form__camera__video">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>

                  <div class="new-form__camera__tools">
                    <select id="camera-select"></select>
                    <div class="new-form__camera__tools_buttons">
                    <button id="camera-take-button" class="btn" type="button">
                      Take a photo
                    </button>
                  </div>
                  </div>
                </div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>

            <div class="form-control">
              <div class="new-form__location__title">Location</div>
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="number" name="latitude" value="-6.175389" disabled>
                  <input type="number" name="longitude" value="106.827139" disabled>
                </div>
              </div>
            </div>

            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Share Your Story</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#form = document.getElementById('new-form');
    this.#takenDocumentations = [];

    this.#presenter = new NewPresenter({
      view: this,
      model: StoryAPI,
      onMapReady: this.initialMap.bind(this),
      onSubmit: this.#onSubmit.bind(this),
      onShowSubmitLoading: this.showSubmitLoadingButton,
      onHideSubmitLoading: this.hideSubmitLoadingButton,
      onStoreSuccess: this.storeSuccessfully.bind(this),
      onStoreFailed: this.storeFailed.bind(this),
      onShowMapLoading: this.showMapLoading,
      onHideMapLoading: this.hideMapLoading,
    });

    this.#presenter.showNewFormMap();
    this.#setupForm();
  }

  #setupForm() {
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        description: this.#form.elements.namedItem('description').value,
        evidenceImages: this.#takenDocumentations.map((picture) => picture.blob),
        latitude: this.#form.elements.namedItem('latitude').value,
        longitude: this.#form.elements.namedItem('longitude').value,
      };

      await this.#onSubmit(data);
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const insertingPicturesPromises = Array.from(event.target.files).map(async (file) => {
        return await this.#addTakenPicture(file);
      });
      await Promise.all(insertingPicturesPromises);
      await this.#populateTakenPictures();
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations').click();
    });

    const cameraContainer = document.getElementById('camera-container');
  document
    .getElementById('open-documentations-camera-button')
    .addEventListener('click', async (event) => {
      cameraContainer.classList.toggle('open');
      this.#isCameraOpen = cameraContainer.classList.contains('open');
 
      if (this.#isCameraOpen) {
        event.currentTarget.textContent = 'Closed camera';
        this.#setupCamera();
        this.#camera.launch();
 
        return;
      }
 
      event.currentTarget.textContent = 'Open camera';
      this.#camera.stop();
    });
  }

  async #onSubmit(data) {
    this.showSubmitLoadingButton();
    await this.#presenter.submitForm(data);
    this.hideSubmitLoadingButton();
  }

  async #addTakenPicture(image) {
    let blob = image;

    if (typeof image === 'string' || image instanceof String) {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };

    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((acc, picture, index) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      return acc + `
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
            <img src="${imageUrl}" alt="Dokumentasi ke-${index + 1}">
          </button>
        </li>
      `;
    }, '');

    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) => {
      button.addEventListener('click', (event) => {
        const id = event.currentTarget.dataset.deletepictureid;
        const deleted = this.#removePicture(id);
        if (!deleted) console.log(`Terjadi kesalahaan saat menghapus gambar dengan id: ${id}`);
        this.#populateTakenPictures();
      });
    });
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((p) => p.id == id);
    if (!selectedPicture) return null;
    this.#takenDocumentations = this.#takenDocumentations.filter((p) => p.id != id);
    return selectedPicture;
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
      locate: true,
    });

     
    const centerCoordinate = this.#map.getCenter();
    this.#updateLatLngInput(centerCoordinate.latitude, centerCoordinate.longitude);
    const draggableMarker = this.#map.addMarker(
      [centerCoordinate.latitude, centerCoordinate.longitude],
      { draggable: 'true' },
    );
    draggableMarker.addEventListener('move', (event) => {
      const coordinate = event.target.getLatLng();
      this.#updateLatLngInput(coordinate.lat, coordinate.lng);
    });
    this.#map.addMapEventListener('click', (event) => {
      draggableMarker.setLatLng(event.latlng);
    });
  }
  #updateLatLngInput(latitude, longitude) {
    this.#form.elements.namedItem('latitude').value = latitude;
    this.#form.elements.namedItem('longitude').value = longitude;
  }

  #setupCamera() {
    if (this.#camera) {
      return;
    }

    this.#camera = new Camera({
      video: document.getElementById('camera-video'),
      cameraSelect: document.getElementById('camera-select'),
      canvas: document.getElementById('camera-canvas'),
    });

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();
    location.href = '#/';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
    this.#takenDocumentations = [];
    this.#populateTakenPictures();
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Buat Cerita
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Add Stories</button>
    `;
  }
}
