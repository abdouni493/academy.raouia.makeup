/** Follow OS appearance changes; the initial class is set before paint in index.html. */
const preference = window.matchMedia('(prefers-color-scheme: dark)');
const applyAppearance = () => document.documentElement.classList.toggle('dark', preference.matches);
applyAppearance();
preference.addEventListener('change', applyAppearance);
if (import.meta.hot) import.meta.hot.dispose(() => preference.removeEventListener('change', applyAppearance));
