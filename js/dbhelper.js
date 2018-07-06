/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}`;
  }

  /**
   * Create new restaurant review
   */
  static createRestaurantReview(review) {
    let restaurantReviews = [];
    const db = new browserDB();
    const url = this.DATABASE_URL + `/reviews`;
    const options = {
      method: 'POST',
      body: JSON.stringify(review)
    };

    //Send syc message to service worker
    navigator.serviceWorker.controller.postMessage({type: 'sync', url, options});

    return new Promise(resolve => {

      //Grab all current reviews from indexedDB, append new review and push to indexedDB
      db.access('Reviews', store => {
        const request = store.get(review.restaurant_id);
        request.onsuccess = () => {
          if (typeof request.result !== 'undefined') {
            restaurantReviews = request.result;
          }
          db.access('Reviews', store => {
              review.createdAt = new Date();
              restaurantReviews.push(review);
              const update = store.put(restaurantReviews, review.restaurant_id);
              update.onsuccess = resolve;
          });
        };
      });

    });
  }

  /**
   * Fetch restaurant reviews
   */
  static fetchRestaurantReviews(id) {
    const db = new browserDB();
    //If user is online, pull reviews from server and update indexedDB
    if (navigator.onLine) {
      const request = fetch(this.DATABASE_URL + `/reviews?restaurant_id=${id}`);
      return request
              .then(response => response.json())
              .then((reviews) => {
                  db.access('Reviews', store => {
                    store.put(reviews, id);
                  });
                  return reviews;
              });
    }
    //If user is offline, pull reviews from indexedDB
    return new Promise((resolve) => {
      db.access('Reviews', store => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
      });
    });
  }

  /**
   * Get the favourite status of a restaurant
   */
  static fetchFavouriteStatus(id) {
    return new Promise((resolve, reject) => {
      this.fetchRestaurantById(id, (error, restaurant) => {
        if (error !== null) {
          reject(error);
        }
        resolve(restaurant.is_favorite);
      });
    });
  }

  /**
   * Set the favourite status of a restaurant
   */
  static setFavouriteStatus(id, status) {
    const strToggle = status ? 'true' : 'false';
    const url = this.DATABASE_URL + `/restaurants/${id}/?is_favorite=${strToggle}`;
    const db = new browserDB();
    let restaurants = [];

    return new Promise(resolve => {

      //Send syc message to service worker
      navigator.serviceWorker.controller.postMessage({type: 'sync', url});

      //Manually update local DB with new status
      db.access('Restaurants', (store) => {
        const request = store.get(this.DATABASE_URL + `/restaurants`);
        request.onsuccess = () => {
          if (request.result !== 'undefined') {

            restaurants = request.result;
            restaurants.forEach((restaurant, index) => {
              if (restaurant.id === parseInt(id)) {
                const ldb = new browserDB();
                restaurants[index].is_favorite = status;
                ldb.access('Restaurants', store => {
                  const update = store.put(restaurants, this.DATABASE_URL + `/restaurants`);
                  update.onsuccess = resolve;
                });
              }
            });

          }
        };
      });

    });
  }

  /**
   * Delete restaurant review
   */
  static deleteRestaurantReview(id) {
    return fetch(this.DATABASE_URL + `/reviews/${id}`, {method: 'DELETE'});
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const database = new browserDB();
    database.access('Restaurants', store => {

      const request = store.get(DBHelper.DATABASE_URL + `/restaurants`);
      request.onsuccess = () => {

        if (typeof request.result !== 'undefined') {
          callback(null, request.result);
        } else {
          fetch(DBHelper.DATABASE_URL + `/restaurants`)
            .then(response => response.json())
            .then(data => {
              callback(null, data);
              const database = new browserDB();
              database.access('Restaurants', store => store.put(data, DBHelper.DATABASE_URL + `/restaurants`));
            })
            .catch(e => {
                console.log(`data fetch failure: ${e}`);
                callback(e, null);
            });
        }

      }

    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
