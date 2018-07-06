class browserDB {

    constructor() {
        this.indexedDB = window.indexedDB || window.mozIndexedDB ||
            window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    }

    /*
     * Open database and set callbacks
     */
    access(storeName, success) {
        return new Promise((resolve, reject) => {
            this.open = this.indexedDB.open("RestaurantReviewApp", 1);
            this.open.onupgradeneeded = () => {
                let db = this.open.result;
                db.createObjectStore('Reviews');
                db.createObjectStore('Restaurants');
            };
            this.open.onsuccess = () => {
                let db = this.open.result;
                let tx = db.transaction(storeName, "readwrite");
                let store = tx.objectStore(storeName);
                this.successCallback(store);
                tx.oncomplete = function() {
                    db.close();
                };
                resolve();
            };
            this.successCallback = success;
        });
    }

}