// lib/govApi.test.ts
import { parseGovResponse } from './govApi';

const MOCK_API_RESPONSE = {
  Fecha: '16/04/2026 22:00:00',
  ListaEESSPrecio: [
    {
      IDEESS: '1234',
      Rótulo: 'REPSOL',
      Dirección: 'CALLE MAYOR, 1',
      Localidad: 'MADRID',
      Municipio: 'Madrid',
      Provincia: 'MADRID',
      Latitud: '40,416775',
      'Longitud (WGS84)': '-3,703790',
      'Precio Gasolina 95 E5': '1,499',
      'Precio Gasoleo A': '1,439',
    },
    {
      IDEESS: '5678',
      Rótulo: 'CEPSA',
      Dirección: 'AV LIBERTAD, 5',
      Localidad: 'BARCELONA',
      Municipio: 'Barcelona',
      Provincia: 'BARCELONA',
      Latitud: '41,385064',
      'Longitud (WGS84)': '2,173403',
      'Precio Gasolina 95 E5': '',    // empty = no price
      'Precio Gasoleo A': '1,459',
    },
  ],
};

describe('parseGovResponse', () => {
  it('parses station metadata correctly', () => {
    const { stations } = parseGovResponse(MOCK_API_RESPONSE);
    expect(stations[0]).toMatchObject({
      id: '1234',
      brand: 'REPSOL',
      lat: 40.416775,
      lng: -3.70379,
      province: 'MADRID',
    });
  });

  it('converts Spanish comma decimals to floats', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '1234' && p.fuel === 'g95')?.price).toBeCloseTo(1.499);
  });

  it('skips empty prices', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '5678' && p.fuel === 'g95')).toBeUndefined();
  });

  it('includes diesel prices', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '5678' && p.fuel === 'diesel')?.price).toBeCloseTo(1.459);
  });
});
