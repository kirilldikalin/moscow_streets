const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = '302af765-6c16-4994-992f-ec50c7f8746c'; // <-- Вставьте сюда ваш API-ключ Яндекс.Карт
const streets = [
  { name: 'Пятницкая', district: 'Замоскворечье' },
  { name: 'Арбат', district: 'Арбат' },
  { name: 'Большая Якиманка', district: 'Якиманка' }
  // Добавьте сюда остальные улицы
];

async function getCoords(street) {
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${API_KEY}&geocode=Москва,${encodeURIComponent(street.name)}&format=json&results=1`;
  const res = await fetch(url);
  const data = await res.json();
  try {
    const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
    const kind = geoObject.metaDataProperty.GeocoderMetaData.kind;
    if (kind === 'street' && geoObject.geometry && geoObject.geometry.GeometryCollection) {
      // Иногда возвращается GeometryCollection
      const line = geoObject.geometry.GeometryCollection.geometries.find(g => g.type === 'LineString');
      if (line) return line.coordinates;
    }
    // Обычно возвращается Point
    const pos = geoObject.Point.pos.split(' ');
    return [[parseFloat(pos[1]), parseFloat(pos[0])], [parseFloat(pos[1]), parseFloat(pos[0])]];
  } catch {
    return [];
  }
}

(async () => {
  for (let street of streets) {
    const coords = await getCoords(street);
    street.coordinates = coords;
    console.log(street.name, coords);
  }
  fs.writeFileSync('streets_with_coords.json', JSON.stringify(streets, null, 2));
})(); 