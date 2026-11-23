/* ==========================================================================
   Reveal Visuals — привязка к релизам GitHub
   Заполните два поля ниже. Всё остальное подтянется само.
   ========================================================================== */

window.REVEAL_RELEASE = {
  owner: 'DisRiks',        // ник или организация на GitHub, например 'reveal-team'
  repo: 'RevealLoader',         // имя репозитория с релизами, например 'reveal-launcher'
  assetPattern: /\.exe$/i,   // какой файл из релиза считать установщиком

  // Зеркало: прямая ссылка на копию установщика (в разметке её не видно)
  mirrorUrl: 'https://www.dropbox.com/scl/fi/4jhktlxrchd2c5zv4w65s/RevealLoader.exe?rlkey=b8lby4dtwy09tmfkdf4v27j4g&st=lgwvhpbd&dl=1',

  // Значения, которые видны до ответа GitHub и если API недоступен
  fallbackVersion: '1.5.2',
  fallbackSize: '133 МБ'
};
