// lib/govApi.test.ts
import { parseGovResponse } from './govApi';

const MOCK_API_RESPONSE = {
  Fecha: '18/04/2026 10:00:00',
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
      'Tipo Venta': 'P',
      'Precio Gasolina 95 E5': '1,499',
      'Precio Gasolina 98 E5': '1,599',
      'Precio Gasoleo A': '1,439',
      'Precio Gases licuados del petróleo': '0,899',
      'Precio Gas Natural Comprimido': '',
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
      'Tipo Venta': 'R',
      'Precio Gasolina 95 E5': '',
      'Precio Gasolina 98 E5': '',
      'Precio Gasoleo A': '1,459',
      'Precio Gases licuados del petróleo': '',
      'Precio Gas Natural Comprimido': '1,299',
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
      ventaRestringida: false,
    });
  });

  it('marks restricted stations correctly', () => {
    const { stations } = parseGovResponse(MOCK_API_RESPONSE);
    expect(stations[0].ventaRestringida).toBe(false);
    expect(stations[1].ventaRestringida).toBe(true);
  });

  it('parses g95 price', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '1234' && p.fuel === 'g95')?.price).toBeCloseTo(1.499);
  });

  it('parses g98 price', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '1234' && p.fuel === 'g98')?.price).toBeCloseTo(1.599);
  });

  it('parses glp price', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '1234' && p.fuel === 'glp')?.price).toBeCloseTo(0.899);
  });

  it('parses gnc price', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '5678' && p.fuel === 'gnc')?.price).toBeCloseTo(1.299);
  });

  it('skips empty prices', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '5678' && p.fuel === 'g95')).toBeUndefined();
    expect(prices.find(p => p.stationId === '1234' && p.fuel === 'gnc')).toBeUndefined();
  });

  it('parses diesel price', () => {
    const { prices } = parseGovResponse(MOCK_API_RESPONSE);
    expect(prices.find(p => p.stationId === '5678' && p.fuel === 'diesel')?.price).toBeCloseTo(1.459);
  });
});
