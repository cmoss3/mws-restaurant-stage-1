/*
 * Register Service Worker
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

/*
 * Prompt the user to add our app to their home screen! =:D
 */
let installPromptEvent;
let installButton = document.querySelector('.install-progressive-app');

window.addEventListener('beforeinstallprompt', (event) => {
    //Tell Chrome (versions <= 67) to not automatically show install prompt
    event.preventDefault();
    //Save this bad boy for later
    installPromptEvent = event;
    //Reveal the install button to the user
    installButton.className = installButton.className.replace('hide', '');
});

installButton.addEventListener('click', () => {
    //Have the browser prompt the user to install
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choice) => {
       if (choice.outcome === 'accepted') {//If the user says yes
           installButton.className = installButton.className + ` hide`;
       }
       //Get rid of the event, we don't need it anymore
       installPromptEvent = null;
    });
});

/*
 * Create a title attribute for all google maps iFrames
 */
function setupAssistedTechAttributesOnGoogleMap(title) {
    const iframe = document.querySelector('#map iframe');
    iframe.setAttribute('title', title);
}