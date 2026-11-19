// Which view the Musings section opens on. Cards by default; a visitor who
// switched to the list gets the list on later visits. The script runs before
// the page paints and marks <html data-musings="list">, which CSS reads.
export const MUSINGS_VIEW_KEY = 'musings-view';

export const MUSINGS_VIEW_SCRIPT = `try{if(localStorage.getItem('${MUSINGS_VIEW_KEY}')==='list')document.documentElement.dataset.musings='list'}catch(e){}`;
