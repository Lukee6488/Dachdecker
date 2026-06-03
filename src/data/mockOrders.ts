export type LeadStatus = 'Neu' | 'In Bearbeitung' | 'Kontaktiert' | 'Abgeschlossen';
export type LeadQuelle = 'Voice' | 'Mail';
export type LeadKategorie =
  | 'Neueindeckung'
  | 'Sanierung / Reparatur'
  | 'Flachdach / Abdichtung'
  | 'Dachausbau / Dachgauben'
  | 'Dachrinne / Entwässerung'
  | 'Sturmschaden / Notfall'
  | 'Sonstiges / Beratung';

export const LEAD_KATEGORIEN: LeadKategorie[] = [
  'Neueindeckung',
  'Sanierung / Reparatur',
  'Flachdach / Abdichtung',
  'Dachausbau / Dachgauben',
  'Dachrinne / Entwässerung',
  'Sturmschaden / Notfall',
  'Sonstiges / Beratung',
];

export interface Lead {
  id: string;
  name: string;
  kontakt: string | null;
  kategorie: LeadKategorie;
  nachricht: string | null;
  quelle: LeadQuelle | null;
  datum: string;
  status: LeadStatus;
}
