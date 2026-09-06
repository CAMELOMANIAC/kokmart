import { MartStore } from '../types/store.js';

export const mockMartStores: MartStore[] = [
  {
    id: 'store-emart-yeoksam',
    name: '이마트 역삼점',
    brand: '이마트',
    lat: 37.4998,
    lng: 127.0375,
    address: '서울특별시 강남구 역삼로 310',
    phone: '02-6908-1234',
    businessHours: '10:00 ~ 23:00',
    isHolidayToday: false,
    activeDealCount: 18
  },
  {
    id: 'store-homeplus-gangnam',
    name: '홈플러스 스페셜 강남점',
    brand: '홈플러스',
    lat: 37.4925,
    lng: 127.0458,
    address: '서울특별시 강남구 도곡로 401',
    phone: '02-3461-8000',
    businessHours: '10:00 ~ 24:00',
    isHolidayToday: false,
    activeDealCount: 14
  },
  {
    id: 'store-lotte-seocho',
    name: '롯데마트 서초점',
    brand: '롯데마트',
    lat: 37.4912,
    lng: 127.0125,
    address: '서울특별시 서초구 서초대로38길 12',
    phone: '02-6902-2500',
    businessHours: '10:00 ~ 23:00',
    isHolidayToday: false,
    activeDealCount: 12
  },
  {
    id: 'store-emart-yangjae',
    name: '이마트 양재점',
    brand: '이마트',
    lat: 37.4721,
    lng: 127.0384,
    address: '서울특별시 서초구 매헌로 16',
    phone: '02-2155-1234',
    businessHours: '10:00 ~ 23:00',
    isHolidayToday: false,
    activeDealCount: 22
  },
  {
    id: 'store-homeplus-jamsil',
    name: '홈플러스 잠실점',
    brand: '홈플러스',
    lat: 37.5143,
    lng: 127.1022,
    address: '서울특별시 송파구 올림픽로35가길 16',
    phone: '02-3434-8000',
    businessHours: '10:00 ~ 24:00',
    isHolidayToday: false,
    activeDealCount: 16
  },
  {
    id: 'store-lotte-jamsil',
    name: '롯데마트 제타플렉스 잠실점',
    brand: '롯데마트',
    lat: 37.5115,
    lng: 127.0982,
    address: '서울특별시 송파구 올림픽로 240',
    phone: '02-2143-2500',
    businessHours: '10:00 ~ 23:00',
    isHolidayToday: false,
    activeDealCount: 25
  }
];
