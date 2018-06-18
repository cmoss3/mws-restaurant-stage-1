class browserDB {

    constructor() {
        this.indexedDB = window.indexedDB || window.mozIndexedDB ||
            window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    }

    /*
     * Open database and set callbacks
     */
    access(success) {
        this.open = this.indexedDB.open("RestaurantReviewApp", 1);
        this.open.onupgradeneeded = () => {
            let db = this.open.result;
            db.createObjectStore("RestaurantReviewApp");
        };
        this.open.onsuccess = () => {
            let db = this.open.result;
            let tx = db.transaction("RestaurantReviewApp", "readwrite");
            let store = tx.objectStore("RestaurantReviewApp");
            this.successCallback(store);
            tx.oncomplete = function() {
                db.close();
            };
        };
        this.successCallback = success;
    }

}