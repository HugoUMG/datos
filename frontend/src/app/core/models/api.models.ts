export type TagType = 'QR' | 'RFID';

export interface Supplier {
  id: number;
  name: string;
  taxId: string;
  email: string;
  phone?: string;
  active: boolean;
}

export interface BudgetLine {
  id: number;
  code: string;
  description: string;
  allocatedAmount: number;
}

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  notes?: string;
}

export interface Asset {
  id: number;
  assetCode: string;
  name: string;
  description?: string;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  status: string;
  tagType: TagType;
  tagValue: string;
  location: string;
  purchaseInvoice?: PurchaseInvoice;
  currentCustodian?: Employee;
}

export interface Department {
  id: number;
  name: string;
  costCenterCode?: string;
}

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  department?: Department;
}

export interface Assignment {
  id: number;
  asset: Asset;
  employee?: Employee;
  assignedAt: string;
  expectedReturnAt?: string;
  returnedAt?: string;
  status: string;
  digitalSignature?: string;
  receiptConfirmation?: string;
}

export interface Disposal {
  id: number;
  asset: Asset;
  reason: string;
  disposalType: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  finalValue?: number;
}

export interface InvestedSummary {
  totalInvested: number;
}

export interface AdminUser {
  id: number;
  username: string;
  role: string;
  employeeId?: number;
  createdAt: string;
}
