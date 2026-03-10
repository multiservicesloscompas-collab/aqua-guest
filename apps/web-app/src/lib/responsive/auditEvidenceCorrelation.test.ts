import { describe, expect, it } from 'vitest';

import { classifyAuditEvidence } from './auditEvidenceCorrelation';

describe('classifyAuditEvidence', () => {
  it('returns Pass when all evidence sources are present', () => {
    const result = classifyAuditEvidence({
      code: ['apps/web-app/src/pages/WaterSalesPage.tsx'],
      test: ['apps/web-app/src/pages/WaterSalesPage.responsive.test.tsx'],
      docs: ['apps/web-app/docs/domain-water-sales.md'],
    });

    expect(result.status).toBe('Pass');
    expect(result.missingSources).toEqual([]);
    expect(result.proposedRemediation).toEqual([]);
  });

  it('returns Partial and remediation when one source is missing', () => {
    const result = classifyAuditEvidence({
      code: ['apps/web-app/src/pages/WaterSalesPage.tsx'],
      test: [],
      docs: ['apps/web-app/docs/domain-water-sales.md'],
    });

    expect(result.status).toBe('Partial');
    expect(result.missingSources).toEqual(['test']);
    expect(result.proposedRemediation).toEqual([
      'Agregar evidencia de prueba verificable (suite + escenario) para cubrir la regla auditada.',
    ]);
  });

  it('returns Gap when two or more sources are missing', () => {
    const result = classifyAuditEvidence({
      code: [],
      test: ['apps/web-app/src/pages/WaterSalesPage.responsive.test.tsx'],
      docs: [],
    });

    expect(result.status).toBe('Gap');
    expect(result.missingSources).toEqual(['code', 'docs']);
    expect(result.proposedRemediation).toEqual([
      'Agregar referencia de implementación concreta con ruta de archivo y punto auditado.',
      'Agregar referencia en documentación de dominio/auditoría que describa explícitamente la regla.',
    ]);
  });
});
