export type AuditEvidenceSource = 'code' | 'test' | 'docs';

export type AuditEvidenceMap = {
  code: string[];
  test: string[];
  docs: string[];
};

export type AuditEvidenceStatus = 'Pass' | 'Partial' | 'Gap';

export interface AuditEvidenceClassification {
  status: AuditEvidenceStatus;
  missingSources: AuditEvidenceSource[];
  proposedRemediation: string[];
}

const SOURCE_ORDER: AuditEvidenceSource[] = ['code', 'test', 'docs'];

function hasEvidence(entries: string[]): boolean {
  return entries.some((entry) => entry.trim().length > 0);
}

function remediationForSource(source: AuditEvidenceSource): string {
  if (source === 'code') {
    return 'Agregar referencia de implementación concreta con ruta de archivo y punto auditado.';
  }

  if (source === 'test') {
    return 'Agregar evidencia de prueba verificable (suite + escenario) para cubrir la regla auditada.';
  }

  return 'Agregar referencia en documentación de dominio/auditoría que describa explícitamente la regla.';
}

export function classifyAuditEvidence(
  evidence: AuditEvidenceMap
): AuditEvidenceClassification {
  const missingSources = SOURCE_ORDER.filter(
    (source) => !hasEvidence(evidence[source])
  );

  if (missingSources.length === 0) {
    return {
      status: 'Pass',
      missingSources,
      proposedRemediation: [],
    };
  }

  return {
    status: missingSources.length === 1 ? 'Partial' : 'Gap',
    missingSources,
    proposedRemediation: missingSources.map(remediationForSource),
  };
}
