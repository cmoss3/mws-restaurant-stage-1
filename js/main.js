let restaurants,
    neighborhoods,
    cuisines,
    map,
    markers = [],
    mapLoaded = false,
    restaurantsLoaded = false;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function() {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  google.maps.event.addListenerOnce(self.map, 'tilesloaded', function() {
    console.log('map loaded...');
    mapLoaded = true;
    mapLoader.className = 'hide';
    setupAssistedTechAttributesOnGoogleMap(`Restaurant locations shown on map`);
    addMarkersToMap();
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      restaurantsLoaded = true;
      console.log('restaurants loaded...');
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      addMarkersToMap();
    }
  })
}

updateRestaurants();

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (typeof self.markers !== 'undefined') {
    self.markers.forEach(m => m.setMap(null));
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
      ul.append(createRestaurantHTML(restaurant));
  });
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const image = document.createElement('picture');
  const imageTemplate = document.getElementById('restaurant-image-template');
  image.innerHTML = imageTemplate.innerHTML.replace(/X/g, restaurant.id);
  image.children[1].alt = `Picture of the ${restaurant.name} restaurant`;
  li.append(image);

  const name = document.createElement('h2');
  name.setAttribute('aria-label', 'Restaurant name');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.setAttribute('aria-label', 'Restaurant neighborhood');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.setAttribute('aria-label', 'Restaurant address');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li
}

/**
 * Add markers for restaurants to the map.
 * This function will be called from 2 places (after map load and after restaurant data load)
 * We're not sure which of these processes will finish first, but we want to load the markers after both are done
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  if (mapLoaded === false || restaurantsLoaded === false) {
    return;
  }
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
};

/**
 * If our user is on mobile we'll only load the Google Maps API
 * If they open the map with a user gesture.
 */
const mapLoader = document.getElementById('map-loading');
const mapContainer = document.getElementById('map-container');
const loadMapButton = document.getElementById('load-google-map');

const loadMapScript = () => {
  const src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDVBo7pG2U82PjEJWyLbngIowRp8DiHd2E&libraries=places&callback=initMap`;
  const deferredScript = document.createElement('script');
  deferredScript.setAttribute('src', src);
  deferredScript.setAttribute('async', 'true');
  deferredScript.setAttribute('deferred', 'true');
  document.body.appendChild(deferredScript);
  mapContainer.className = '';
  loadMapButton.className = 'hide';
};

if (window.innerWidth <= 1000) {
  loadMapButton.addEventListener('click', loadMapScript)
} else {
  loadMapScript();
}