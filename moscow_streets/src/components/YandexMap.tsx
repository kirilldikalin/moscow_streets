import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Street } from '../data/districts';

declare global {
  interface Window {
    ymaps: any;
  }
}

interface YandexMapProps {
  streets: Street[];
  learnedStreets: string[];
  onStreetClick?: (street: Street) => void;
}

const YandexMap = forwardRef<any, YandexMapProps>(({ streets, learnedStreets, onStreetClick }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const objectsRef = useRef<any[]>([]);

  useEffect(() => {
    // Загрузка API Яндекс Карт
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=302af765-6c16-4994-992f-ec50c7f8746c&lang=ru_RU';
    script.async = true;
    script.onload = initMap;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateStreets();
    }
  }, [streets, learnedStreets]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      const marker = new window.ymaps.Placemark([55.75, 37.61], { balloonContent: 'Тестовый маркер' });
      mapInstanceRef.current.geoObjects.add(marker);
    }
  }, []);

  const initMap = () => {
    window.ymaps.ready(() => {
      if (mapRef.current) {
        mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
          center: [55.76, 37.64], // Центр Москвы
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        });
        console.log('Передано в карту:', streets);
        updateStreets();
      }
    });
  };

  const updateStreets = () => {
    // Очистка предыдущих объектов
    objectsRef.current.forEach(obj => {
      mapInstanceRef.current.geoObjects.remove(obj);
    });
    objectsRef.current = [];

    streets.forEach(street => {
      const isLearned = learnedStreets.includes(street.name);
      const coords = street.coordinates;
      // Проверка на валидность координат
      if (
        !Array.isArray(coords) ||
        coords.length === 0 ||
        isNaN(coords[0][0]) || isNaN(coords[0][1])
      ) {
        console.log('Некорректные координаты:', coords, street.name);
        return;
      }
      // Если координаты совпадают или их меньше двух — рисуем маркер
      if (
        coords.length < 2 ||
        (coords[0][0] === coords[1][0] && coords[0][1] === coords[1][1])
      ) {
        const marker = new window.ymaps.Placemark(coords[0], {
          balloonContent: street.name
        }, {
          preset: isLearned ? 'islands#greenDotIcon' : 'islands#redDotIcon'
        });
        mapInstanceRef.current.geoObjects.add(marker);
        objectsRef.current.push(marker);
        if (isLearned) {
          mapInstanceRef.current.setCenter(coords[0], 15, { duration: 300 });
        }
        console.log('Маркер:', street.name, coords[0]);
        return;
      }
      // Если есть линия — рисуем линию
      const polyline = new window.ymaps.Polyline(
        coords,
        { balloonContent: street.name },
        {
          strokeColor: isLearned ? '#4CAF50' : '#FF0000',
          strokeWidth: 8,
          opacity: 1,
          zIndex: 1000
        }
      );
      mapInstanceRef.current.geoObjects.add(polyline);
      objectsRef.current.push(polyline);
      if (isLearned) {
        mapInstanceRef.current.setCenter(coords[0], 15, { duration: 300 });
      }
      console.log('Линия:', street.name, coords);
    });
  };

  useImperativeHandle(ref, () => updateStreets);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
});

export default YandexMap; 