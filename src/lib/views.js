// Which view the switchable home sections open on. Musings opens on its cards
// and Playground on its bento; a visitor who switched one to its list gets
// the list on later visits. The script runs before the page paints and marks
// <html data-musings="list"> / <html data-playground="list">, which CSS reads.
export const VIEW_KEYS = { musings: 'musings-view', playground: 'playground-view' };

export const VIEW_SCRIPT = `try{var d=document.documentElement.dataset;${Object.entries(VIEW_KEYS)
  .map(([name, key]) => `if(localStorage.getItem('${key}')==='list')d.${name}='list';`)
  .join('')}}catch(e){}`;
