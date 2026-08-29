document.addEventListener('DOMContentLoaded', () => {
fetch('./version.json')
  .then(response => response.json())
  .then(data => {
    document.getElementById('app-version').textContent =
      `Versiune ${data.version}`;
  })
  .catch(() => {
    document.getElementById('app-version').textContent =
      'Versiune indisponibilă';
  });
});
