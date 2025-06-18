export interface District {
  name: string;
  bounds?: [number, number][];
}

export interface Street {
  name: string;
  district: string;
  coordinates: [number, number][]; // массив координат для отрисовки улицы
}

export const DISTRICTS: District[] = [
  { name: 'Арбат' },
  { name: 'Басманный' },
  { name: 'Замоскворечье' },
  { name: 'Красносельский' },
  { name: 'Мещанский' },
  { name: 'Пресненский' },
  { name: 'Таганский' },
  { name: 'Тверской' },
  { name: 'Хамовники' },
  { name: 'Якиманка' }
]; 