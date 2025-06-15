import {
  generateLoaderAbsoluteTemplate,
  generateStoryItemTemplate,
  generateStoryListEmptyTemplate,
  generateStoryListErrorTemplate,
  generateRemoveStoryButtonTemplate,
} from '../../templates';
import * as StoryAPI from '../../data/api';
import BookmarkPresenter from './bookmark-presenter';
import Database from '../../data/database';
import Map from '../../utils/map';

export default class BookmarkPage {
  #presenter = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="stories-list__map__container">
          <div id="map" class="stories-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">list of saved stories</h1>

        <div class="stories-list__container">
          <div id="stories-list"></div>
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new BookmarkPresenter({
      view: this,
      model: StoryAPI,
      dbModel: Database,
    });
    try {
      await this.initialMap();
      const response = await this.#presenter.initialGalleryAndMap();
      console.log(response.listStory);
    } catch (error) {
      this.populateBookmarkedReportsError('Ups! Kami tidak dapat memuat cerita saat ini. Coba beberapa saat lagi.');
      console.error(error);
    }
  }

  async initialMap() {
    this.showMapLoading();

    const mapContainer = document.querySelector('#map');
    if (mapContainer && mapContainer._leaflet_id != null) {
      mapContainer._leaflet_id = null;
      mapContainer.innerHTML = '';
    }

    try {
      this.#map = await Map.build('#map', {
        zoom: 10,
        locate: true,
      });
    } catch (e) {
      console.error('Terjadi kesalahan saat memuat peta:', e);
    } finally {
      this.hideMapLoading();
    }
  }

  populateBookmarkedReports(message, stories) {
  const container = document.getElementById('stories-list');
  if (!container) return;

  if (!stories || stories.length === 0) {
    this.populateBookmarkedReportsListEmpty();
    return;
  }

  const listWrapper = document.createElement('div');
  listWrapper.classList.add('stories-list');

  stories.forEach((story) => {
    if (this.#map) {
      const lat = parseFloat(story.lat);
      const lon = parseFloat(story.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        this.#map.addMarker([lat, lon], { alt: story.name }, { content: story.description });
      } else {
        console.warn('Data lokasi untuk cerita ini tidak valid:', story);
      }
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = generateStoryItemTemplate(story);

   
    const saveContainer = wrapper.querySelector('.save-actions-container');
    if (saveContainer) {
      saveContainer.innerHTML = generateRemoveStoryButtonTemplate();
      const removeBtn = saveContainer.querySelector('.report-detail-remove');
      removeBtn?.addEventListener('click', async () => {
        
        await this.#presenter.removeReport(story, wrapper); 

        
        const response = await this.#presenter.initialGalleryAndMap();
        this.populateBookmarkedReports('Cerita berhasil dihapus dari sistem', response.listStory);
      });
    }

    listWrapper.appendChild(wrapper.firstElementChild);
  });

  container.innerHTML = '';  
  container.appendChild(listWrapper);  
}

  populateBookmarkedReportsListEmpty() {
    const container = document.getElementById('stories-list');
    if (container) container.innerHTML = generateStoryListEmptyTemplate();
  }

  populateBookmarkedReportsError(message) {
    const container = document.getElementById('stories-list');
    if (container) container.innerHTML = generateStoryListErrorTemplate(message);
  }

  showReportsListLoading() {
    document.getElementById('reports-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideReportsListLoading() {
    document.getElementById('reports-list-loading-container').innerHTML = '';
  }

  showMapLoading() {
    const container = document.getElementById('map-loading-container');
    if (container) container.innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    const container = document.getElementById('map-loading-container');
    if (container) container.innerHTML = '';
  }
}
