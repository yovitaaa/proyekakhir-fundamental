export default class BookmarkPresenter {
  #view;
  #dbModel;

  constructor({ view, model, dbModel }) {
    this.#view = view;
    this.#dbModel = dbModel;
  }

  async showReportsListMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showReportsListMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initialGalleryAndMap() {
    console.log('[DEBUG] initialGalleryAndMap called');
    this.#view.showReportsListLoading();

    try {
      await this.showReportsListMap();

      
      const bookmarkedReports = await this.#dbModel.getAllReports();
      console.log('[DEBUG] bookmarkedReports:', bookmarkedReports);

      const message = 'Cerita tersimpan berhasil dimuat.';
      this.#view.populateBookmarkedReports(message, bookmarkedReports);
      return {
        message,
        listStory: bookmarkedReports,
      };
    } catch (error) {
      console.error('initialGalleryAndMap: error:', error);
      this.#view.populateBookmarkedReportsError('Gagal mengambil data cerita dari server. Silakan ulangi permintaan Anda nanti');
    } finally {
      this.#view.hideReportsListLoading();
    }
  }

async removeReport(report, wrapper) {
  try {
    
    await this.#dbModel.removeReport(report.id);
    console.log('Cerita berhasil dihapus dan tidak lagi tersimpan di bookmark');
    
   
    if (wrapper) {
      wrapper.remove();  
    }

    
    const updatedReports = await this.#dbModel.getAllReports();
    const message = 'Cerita berhasil dihapus dan tidak lagi tersimpan di bookmarkk';
    this.#view.populateBookmarkedReports(message, updatedReports);

  } catch (error) {
    console.error('removeReport: error:', error);
    
    this.#view.populateBookmarkedReportsError('Terjadi kesalahan saat menghapus cerita. Silakan coba lagi nanti.');
  }
}

}
