export type ProtocolStatus = 'pending' | 'in_transit' | 'delivered' | 'returned';
export type ProtocolType = 'internal' | 'external';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user';
  companyId?: string;
  createdAt?: any;
}

export interface ProtocolOpinion {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  timestamp: any;
}

export interface ProtocolDispatch {
  text: string;
  authorId: string;
  authorName: string;
  timestamp: any;
  documentUrl?: string;
}

export interface Protocol {
  id: string;
  title: string;
  description?: string;
  sender?: string;
  receiver?: string;
  status: ProtocolStatus;
  type: ProtocolType;
  createdBy: string;
  createdByName?: string;
  createdAt: any;
  updatedAt: any;
  signature?: string;
  photo?: string;
  qrCode?: string;
  
  // New fields from images
  originType: 'my_company' | 'other_company';
  originCompanyId?: string;
  originDepartmentId?: string;
  originEmployeeId?: string;
  courierId?: string;
  
  destinationType: 'my_company' | 'other_company';
  destinationCompanyId?: string;
  destinationDepartmentId?: string;
  destinationEmployeeId?: string;
  deliveryAddress?: string;

  documentType?: string;
  documentTypeId?: string;
  classificationId?: string;
  protocolNumber?: string;
  sequenceNumber?: number;
  volumes?: number;
  attachments?: { name: string; url: string }[];

  // Workflow fields
  opinions?: ProtocolOpinion[];
  dispatch?: ProtocolDispatch;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'protocol' | 'credential' | 'dispatch';
  link?: string;
  createdAt: any;
}

export interface ProtocolHistory {
  id: string;
  protocolId: string;
  action: string;
  description?: string;
  performedBy: string;
  performedByName?: string;
  timestamp: any;
}

export interface Company {
  id: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: any;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  departmentId?: string;
  companyId?: string;
  createdAt: any;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  companyId?: string;
  createdAt: any;
}

export interface ProtocolItem {
  id: string;
  protocolId: string;
  name: string;
  quantity: number;
  description?: string;
  ref?: string;
  dueDate?: string;
  value?: number;
  total?: number;
  returnDate?: string;
  returned: boolean;
  returnedAt?: any;
}

export interface ProtocolClassification {
  id: string;
  name: string;
  code: string;
  createdAt: any;
}

export interface ProtocolDocumentType {
  id: string;
  name: string;
  createdAt: any;
}
