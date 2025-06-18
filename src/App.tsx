import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DISTRICTS } from './data/districts';
import YandexMap from './components/YandexMap';

const API_KEY = '302af765-6c16-4994-992f-ec50c7f8746c';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
`;

const Header = styled.header`
  margin-bottom: 20px;
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
  gap: 20px;
`;

const Sidebar = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MapContainer = styled.div`
  flex: 1;
  min-height: 500px;
  border: 1px solid #ccc;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const ProgressSection = styled.div`
  margin-top: 20px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;

  &::after {
    content: '';
    display: block;
    width: ${props => props.progress}%;
    height: 100%;
    background-color: #4CAF50;
    transition: width 0.3s ease;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #45a049;
  }
`;

function App() {
  const [inputValue, setInputValue] = useState('');
  const [learnedStreets, setLearnedStreets] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [streets, setStreets] = useState<any[]>([]); // [{name, district, coordinates}]
  const mapUpdateRef = useRef<any>(null);

  useEffect(() => {
    const savedProgress = localStorage.getItem('learnedStreets');
    const savedStreets = localStorage.getItem('streets');
    if (savedProgress) setLearnedStreets(JSON.parse(savedProgress));
    if (savedStreets) setStreets(JSON.parse(savedStreets));
  }, []);

  useEffect(() => {
    localStorage.setItem('learnedStreets', JSON.stringify(learnedStreets));
    localStorage.setItem('streets', JSON.stringify(streets));
    const newProgress: Record<string, number> = {};
    DISTRICTS.forEach(district => {
      const districtStreets = streets.filter(street => street.district === district.name);
      const totalStreets = districtStreets.length;
      const learnedInDistrict = districtStreets.filter(street => learnedStreets.includes(street.name)).length;
      newProgress[district.name] = totalStreets > 0 ? (learnedInDistrict / totalStreets) * 100 : 0;
    });
    setProgress(newProgress);
  }, [learnedStreets, streets]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Получение координат улицы через API Яндекса
  const fetchStreetCoords = async (streetName: string) => {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${API_KEY}&geocode=Москва,${encodeURIComponent(streetName)}&format=json&results=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
      
      // Пробуем получить LineString (если есть)
      if (geoObject.geometry?.GeometryCollection) {
        const line = geoObject.geometry.GeometryCollection.geometries.find((g: any) => g.type === 'LineString');
        if (line) {
          // ВНИМАНИЕ: Яндекс возвращает [lon, lat], а нам нужен [lat, lon]
          const coords = line.coordinates.map((c: any) => [parseFloat(c[1]), parseFloat(c[0])]);
          console.log('LineString coords:', coords);
          return coords;
        }
      }
      
      // Если нет LineString, используем точку
      const pos = geoObject.Point.pos.split(' ');
      const coords = [[parseFloat(pos[1]), parseFloat(pos[0])], [parseFloat(pos[1]), parseFloat(pos[0])]];
      console.log('Point coords:', coords);
      return coords;
    } catch (e) {
      console.error('Ошибка получения координат:', e);
      return [];
    }
  };

  const handleInputSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = inputValue.trim();
    if (!normalizedInput) return;

    let foundStreet = streets.find(street => 
      street.name.toLowerCase() === normalizedInput.toLowerCase()
    );

    if (!foundStreet) {
      const coords = await fetchStreetCoords(normalizedInput);
      
      if (
        coords.length === 0 ||
        isNaN(coords[0][0]) || isNaN(coords[0][1]) ||
        coords[0][0] < 54 || coords[0][0] > 57 || coords[0][1] < 36 || coords[0][1] > 39
      ) {
        toast.error('Не удалось получить корректные координаты улицы');
        setInputValue('');
        return;
      }

      let district = '';
      for (const d of DISTRICTS) {
        if (d.name && normalizedInput.match(new RegExp(d.name, 'i'))) {
          district = d.name;
          break;
        }
      }

      if (!district) {
        district = 'Неизвестно';
        toast.warn('Район не определён, улица будет добавлена без района');
      }

      foundStreet = { 
        name: normalizedInput, 
        district, 
        coordinates: coords 
      };

      setStreets(prev => {
        const newStreets = [...prev, foundStreet];
        console.log('Добавлена новая улица:', foundStreet);
        if (mapUpdateRef.current) {
          setTimeout(() => mapUpdateRef.current(), 100);
        }
        return newStreets;
      });
    }

    if (!learnedStreets.includes(foundStreet.name)) {
      setLearnedStreets(prev => [...prev, foundStreet.name]);
      toast.success(`Поздравляем! Вы выучили улицу ${foundStreet.name}`);
    } else {
      toast.info('Эта улица уже изучена');
    }

    setInputValue('');
  };

  const handleClearProgress = () => {
    if (window.confirm('Вы уверены, что хотите сбросить весь прогресс?')) {
      setLearnedStreets([]);
      toast.info('Прогресс сброшен');
    }
  };

  const handleExportProgress = () => {
    const data = JSON.stringify(learnedStreets);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moscow-streets-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedStreets = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedStreets)) {
            setLearnedStreets(importedStreets);
            toast.success('Прогресс успешно импортирован');
          } else {
            throw new Error('Неверный формат файла');
          }
        } catch (error) {
          toast.error('Ошибка при импорте файла');
        }
      };
      reader.readAsText(file);
    }
  };

  console.log('Streets for map:', streets);

  return (
    <AppContainer>
      <ToastContainer />
      <Header>
        <h1>Изучение улиц ЦАО Москвы</h1>
      </Header>
      
      <MainContent>
        <Sidebar>
          <form onSubmit={handleInputSubmit}>
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Введите название улицы..."
            />
          </form>

          <ProgressSection>
            <h3>Прогресс по районам:</h3>
            {DISTRICTS.map(district => (
              <div key={district.name}>
                <p>{district.name}</p>
                <ProgressBar progress={progress[district.name] || 0} />
              </div>
            ))}
          </ProgressSection>

          <Button onClick={handleClearProgress}>
            Сбросить прогресс
          </Button>
          <Button onClick={handleExportProgress}>
            Экспорт прогресса
          </Button>
          <label>
            <Button as="span">
              Импорт прогресса
            </Button>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportProgress}
            />
          </label>
        </Sidebar>

        <MapContainer>
          <YandexMap
            ref={mapUpdateRef}
            streets={streets}
            learnedStreets={learnedStreets}
          />
        </MapContainer>
      </MainContent>
    </AppContainer>
  );
}

export default App; 