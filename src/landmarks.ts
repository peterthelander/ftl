export type StarData = {
  name: string;
  distanceLy: number;
  raHours: number;
  decDegrees: number;
  radiusKm: number;
  color: number;
};

export const landmarkStars: StarData[] = [
    {
      name: "Barnard's Star",
      distanceLy: 5.96,
      raHours: 17.96,
      decDegrees: 4.7,
      radiusKm: 136000,
      color: 0xff9970
    },
    {
      name: 'Wolf 359',
      distanceLy: 7.86,
      raHours: 10.94,
      decDegrees: 7.0,
      radiusKm: 77000,
      color: 0xff7850
    },
    {
      name: 'Lalande 21185',
      distanceLy: 8.31,
      raHours: 11.05,
      decDegrees: 35.97,
      radiusKm: 271000,
      color: 0xffad7a
    },
    {
      name: 'Sirius',
      distanceLy: 8.6,
      raHours: 6.75,
      decDegrees: -16.72,
      radiusKm: 1180000,
      color: 0xd4e7ff
    },
    {
      name: 'Epsilon Eridani',
      distanceLy: 10.5,
      raHours: 3.55,
      decDegrees: -9.46,
      radiusKm: 514000,
      color: 0xffd099
    },
    {
      name: 'Procyon',
      distanceLy: 11.5,
      raHours: 7.66,
      decDegrees: 5.22,
      radiusKm: 1420000,
      color: 0xfff1ce
    },
    {
      name: 'Tau Ceti',
      distanceLy: 11.9,
      raHours: 1.73,
      decDegrees: -15.94,
      radiusKm: 552000,
      color: 0xffe4ac
    },
    {
      name: 'Vega',
      distanceLy: 25.0,
      raHours: 18.62,
      decDegrees: 38.78,
      radiusKm: 1680000,
      color: 0xccddff
    },
    {
      name: 'Arcturus',
      distanceLy: 36.7,
      raHours: 14.26,
      decDegrees: 19.18,
      radiusKm: 17700000,
      color: 0xffbb78
    },
    {
      name: 'Betelgeuse',
      distanceLy: 550,
      raHours: 5.92,
      decDegrees: 7.41,
      radiusKm: 500000000,
      color: 0xff9860
    }
  ];
