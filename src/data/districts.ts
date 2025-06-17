export interface Street {
  name: string;
  district: string;
  coordinates: [number, number][]; // массив координат для отрисовки улицы
}

export interface District {
  name: string;
  streets: Street[];
}

export const DISTRICTS: District[] = [
  {
    name: "Арбат",
    streets: []
  },
  {
    name: "Басманный",
    streets: []
  },
  {
    name: "Замоскворечье",
    streets: []
  },
  {
    name: "Красносельский",
    streets: []
  },
  {
    name: "Мещанский",
    streets: []
  },
  {
    name: "Пресненский",
    streets: []
  },
  {
    name: "Таганский",
    streets: []
  },
  {
    name: "Тверской",
    streets: []
  },
  {
    name: "Хамовники",
    streets: []
  },
  {
    name: "Якиманка",
    streets: []
  }
]; 