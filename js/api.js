/**
 * Gully-Vision API Client
 * Handles communication between the frontend interface and the PHP backend proxy.
 */
class GullyVisionAPI {
  /**
   * Sends a local video file for biomechanical analysis.
   * @param {File} file - The video file object.
   * @param {string} type - The type of player ('batting' or 'bowling').
   * @returns {Promise<Object>} The parsed analysis response.
   */
  static async analyzeVideoFile(file, type = 'batting') {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('type', type);

    try {
      const response = await fetch('api/analyze.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error in analyzeVideoFile:', error);
      throw error;
    }
  }

  /**
   * Sends a YouTube URL for technique analysis.
   * @param {string} url - The YouTube link.
   * @param {string} type - The type of player ('batting' or 'bowling').
   * @returns {Promise<Object>} The parsed analysis response.
   */
  static async analyzeYoutubeUrl(url, type = 'batting') {
    const formData = new FormData();
    formData.append('youtube_url', url);
    formData.append('type', type);

    try {
      const response = await fetch('api/analyze.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error in analyzeYoutubeUrl:', error);
      throw error;
    }
  }
}

// Export to global window namespace so main.js can use it easily without strict bundlers
window.GullyVisionAPI = GullyVisionAPI;
