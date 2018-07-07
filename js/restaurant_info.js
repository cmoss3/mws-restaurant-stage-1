let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      google.maps.event.addListenerOnce(self.map, 'tilesloaded', () => {
          setupAssistedTechAttributesOnGoogleMap(`Restaurant location shown on map`);
      });
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.querySelector('#restaurant-img');
    image.innerHTML = image.innerHTML.replace(/X/g, restaurant.id);
    image.children[1].alt = `Picture of the ${restaurant.name} restaurant`;

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fetchRestaurantReviews();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Fetch restaurant reviews
 */
fetchRestaurantReviews = () => {
  const id = getParameterByName('id');
  const request = DBHelper.fetchRestaurantReviews(id);
  request.then(fillReviewsHTML);
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(Date.parse(review.createdAt)).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Create a new review
 */
const reviewForm = document.getElementById('review-form');
reviewForm.addEventListener('submit', e => {

  e.preventDefault();

  let data = new FormData(reviewForm);
  data = {
    restaurant_id: getParameterByName('id'),
    rating: data.get('rating'),
    comments: data.get('comments'),
    name: data.get('name')
  };

  DBHelper.createRestaurantReview(data, reviewForm).then(fetchRestaurantReviews);
  reviewForm.reset();
});

/**
 * Fill HTML for restaurant favourite star
 */
const restaurantId = getParameterByName('id');
const starWrapper = document.getElementById('favourite-star-wrapper');
const starImage = document.createElement('img');
const isFavourite = DBHelper.fetchFavouriteStatus(restaurantId);
const toggleStar = (favourite) => {
    if (favourite) {
        starWrapper.className = 'remove-from-favourites';
        starWrapper.title = 'Remove restaurant from favourites';
        starWrapper.setAttribute('aria-label', starWrapper.title);
        starImage.setAttribute('src', 'https://png.icons8.com/color/50/000000/filled-star.png');
    } else {
        starWrapper.className = 'add-to-favourites';
        starWrapper.title = 'Add restaurant to favourites';
        starWrapper.setAttribute('aria-label', starWrapper.title);
        starImage.setAttribute('src', 'https://png.icons8.com/color/50/000000/star.png');
    }
    starWrapper.appendChild(starImage);
    setStarListeners();
};

starImage.setAttribute('alt', '');
isFavourite.then(toggleStar);

/**
 * Set listeners to favourite / un-favourite a restaurant
 */
const setStarListeners = () => {
  const removeFromFavourites = document.querySelector('.remove-from-favourites');
  const addToFavourites = document.querySelector('.add-to-favourites');

  if (removeFromFavourites !== null) {
    removeFromFavourites.addEventListener('click', function(e) {
        e.preventDefault();
        DBHelper.setFavouriteStatus(restaurantId, false).then(toggleStar(false));
    });
  }

  if (addToFavourites !== null) {
    addToFavourites.addEventListener('click', function(e) {
        e.preventDefault();
        DBHelper.setFavouriteStatus(restaurantId, true).then(toggleStar(true));
    });
  }
};