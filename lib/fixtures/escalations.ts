export const LADDER = [
  { level: 1, name: 'Ward Engineer', owner: 'Ward 32 · R. Bhuyan', count: 44, breached: 6, rule: '2 days to acknowledge, 7 to fix', tone: 'red' as const },
  { level: 2, name: 'Executive Engineer', owner: 'GMC Zone 3 · S. Das', count: 12, breached: 4, rule: '5 days to fix after escalation', tone: 'amber' as const },
  { level: 3, name: 'Municipal Commissioner', owner: 'GMC head office', count: 3, breached: 2, rule: '5 days, reviewed weekly', tone: 'red' as const },
  { level: 4, name: 'Urban Development Dept', owner: 'Government of Assam', count: 1, breached: 1, rule: 'no further ladder', tone: 'red' as const },
  { level: 5, name: 'Public board', owner: 'visible to every citizen', count: 74, breached: 74, rule: 'permanent record', tone: 'brand' as const },
];

export const ESCALATIONS = [
  { id: 'GMC-W32-2461', road: 'G.S. Road, before Ganeshguri flyover', from: 'Ward Engineer', to: 'Executive Engineer', at: '26 Aug, 07:12', over: 9 },
  { id: 'GMC-W31-2402', road: 'Zoo Road Tiniali', from: 'Ward Engineer', to: 'Executive Engineer', at: '29 Aug, 09:00', over: 4 },
  { id: 'PWD-KAM-0881', road: 'Lokhra to Basistha road', from: 'Sub Division', to: 'Executive Engineer', at: '30 Aug, 06:30', over: 6 },
  { id: 'GMC-W32-2455', road: 'Rukminigaon main road', from: 'Ward Engineer', to: 'Executive Engineer', at: '31 Aug, 07:12', over: 7 },
  { id: 'GMC-W28-2244', road: 'Beltola bazar approach', from: 'Executive Engineer', to: 'Commissioner', at: '01 Sep, 10:15', over: 12 },
  { id: 'NHAI-27-4471', road: 'NH-27, km 12.480', from: 'Project Director', to: 'Regional Officer', at: '02 Sep, 08:02', over: 5 },
];

export const SIT_TIME = { data: [9, 6, 21, 34], labels: ['Ward Engineer', 'Executive Engineer', 'Commissioner', 'State department'] };
export const BREACH_WEEKS = [12, 9, 14, 21, 26, 31, 24, 19, 17];
