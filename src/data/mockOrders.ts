export type OrderPriority = "niedrig" | "mittel" | "hoch";
export type OrderStatus = "open" | "in_progress" | "done";
export type OrderCategory =
  | "Rundfunk/Fernsehen"
  | "Telefonanlagen"
  | "Bandmeldeanlagen"
  | "Lichtruf"
  | "Starkstrom"
  | "Einbruchmeldeanlagen"
  | "Datentechnik";

export const ORDER_CATEGORIES: OrderCategory[] = [
  "Rundfunk/Fernsehen",
  "Telefonanlagen",
  "Bandmeldeanlagen",
  "Lichtruf",
  "Starkstrom",
  "Einbruchmeldeanlagen",
  "Datentechnik",
];

export interface Order {
  id: string;
  customerName: string;
  firma: string | null;
  address: string;
  phone: string;
  priority: OrderPriority;
  status: OrderStatus;
  receivedAt: string;
  scheduledAt: string | null;
  description: string;
  assignedTo: string | null;
  pmUserId: string | null;
  notes: string;
  category: OrderCategory;
}

export const mockOrders: Order[] = [
  {
    id: "A-2024-001",
    pmUserId: null,
    firma: null,
    customerName: "Familie Müller",
    address: "Hauptstraße 12, 80331 München",
    phone: "+49 89 1234567",
    priority: "hoch",
    status: "open",
    receivedAt: "2024-03-18T08:15:00",
    description: "Stromausfall im gesamten Erdgeschoss.",
    assignedTo: null,
    scheduledAt: null,
    notes: "Aufgenommen durch ElevenLabs-Bot.",
    category: "Starkstrom",
  },
  {
    id: "A-2024-002",
    firma: null,
    customerName: "Dr. Schmidt",
    address: "Leopoldstraße 45, 80802 München",
    phone: "+49 89 9876543",
    priority: "mittel",
    status: "in_progress",
    receivedAt: "2024-03-17T14:30:00",
    description: "Neue Steckdosen in der Praxis installieren.",
    assignedTo: "Thomas Weber",
    scheduledAt: null,
    notes: "Material wurde bereits bestellt.",
    category: "Starkstrom",
  },
  {
    id: "A-2024-003",
    firma: null,
    customerName: "Bäckerei Hofmann",
    address: "Sendlinger Str. 78, 80331 München",
    phone: "+49 89 5551234",
    priority: "hoch",
    status: "open",
    receivedAt: "2024-03-18T06:45:00",
    description: "Backofen-Anschluss defekt.",
    assignedTo: null,
    scheduledAt: null,
    notes: "Gewerbebetrieb – Priorität hoch.",
    category: "Starkstrom",
  },
  {
    id: "A-2024-004",
    firma: null,
    customerName: "Herr Bauer",
    address: "Nymphenburger Str. 120, 80636 München",
    phone: "+49 89 4445566",
    priority: "niedrig",
    status: "open",
    receivedAt: "2024-03-16T10:00:00",
    description: "Lichtschalter im Flur funktioniert nicht mehr.",
    assignedTo: null,
    scheduledAt: null,
    notes: "",
    category: "Lichtruf",
  },
  {
    id: "A-2024-005",
    firma: null,
    customerName: "WG Karlstraße",
    address: "Karlstraße 22, 80333 München",
    phone: "+49 176 12345678",
    priority: "mittel",
    status: "done",
    receivedAt: "2024-03-15T09:20:00",
    description: "FI-Schutzschalter löst aus.",
    assignedTo: "Markus Fischer",
    scheduledAt: null,
    notes: "Erledigt. Defekter FI getauscht.",
    category: "Starkstrom",
  },
  {
    id: "A-2024-006",
    firma: null,
    customerName: "Restaurant La Vita",
    address: "Maximilianstraße 8, 80539 München",
    phone: "+49 89 7778899",
    priority: "hoch",
    status: "in_progress",
    receivedAt: "2024-03-18T07:00:00",
    description: "Kurzschluss in der Küchenbeleuchtung.",
    assignedTo: "Thomas Weber",
    scheduledAt: null,
    notes: "Thomas ist auf dem Weg.",
    category: "Starkstrom",
  },
  {
    id: "A-2024-007",
    firma: null,
    customerName: "Frau Schneider",
    address: "Isartalstraße 55, 80469 München",
    phone: "+49 89 3332211",
    priority: "mittel",
    status: "open",
    receivedAt: "2024-03-14T16:45:00",
    description: "Elektroinstallation für neues Homeoffice.",
    assignedTo: null,
    scheduledAt: null,
    notes: "Terminvorschlag nächste Woche.",
    category: "Datentechnik",
  },
  {
    id: "A-2024-008",
    firma: null,
    customerName: "Autohaus Meier",
    address: "Landsberger Str. 200, 80687 München",
    phone: "+49 89 6667788",
    priority: "niedrig",
    status: "done",
    receivedAt: "2024-03-13T11:00:00",
    description: "Installation einer Wallbox für E-Fahrzeuge.",
    assignedTo: "Markus Fischer",
    scheduledAt: null,
    notes: "Installation abgeschlossen.",
    category: "Starkstrom",
  },
];
