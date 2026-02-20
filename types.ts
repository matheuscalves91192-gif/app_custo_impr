
export interface DbEntry {
  tipo: string;
  tamanho_cm: number;
  peso_g: number;
  material: string;
  tempo_impressao_h: number;
  valor_cobrado: number;
}

export interface SimilarityRequest {
  nome: string;
  email: string;
  telefone?: string;
  tipo: string;
  tamanho_cm: number;
  peso_g: number;
  material: string;
  possuiSTL: boolean;
}

export interface SimilarityResponse {
  valorMin: number;
  valorMax: number;
  peçasSimilaresEncontradas: number;
  justificativa: string;
}

export interface PrintConfig {
  filamentPrice: number;
  filamentWeight: number;
  printTime: number;
  electricityCost: number;
  printerPower: number;
  laborRate: number;
  laborTime: number;
  failRate: number;
  profitMargin: number;
  maintenanceCost: number;
}

export interface BudgetResult {
  materialCost: number;
  energyCost: number;
  laborCost: number;
  maintenanceCost: number;
  subtotal: number;
  riskCost: number;
  profit: number;
  totalPrice: number;
}
