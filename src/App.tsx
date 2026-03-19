import React, { Component, useState, useEffect, useRef } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { ProtocolService } from './ProtocolService';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { Protocol, ProtocolHistory, ProtocolStatus, ProtocolType, UserProfile, Company, Employee, Department, ProtocolItem, ProtocolClassification, ProtocolDocumentType, Notification } from './types';
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  LogOut, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Truck, 
  RotateCcw, 
  ChevronRight, 
  User as UserIcon,
  QrCode,
  Camera,
  PenTool,
  X,
  Filter,
  ArrowLeft,
  Calendar,
  MapPin,
  MoreVertical,
  Download,
  Share2,
  AlertCircle,
  Building2,
  PlusCircle,
  Printer,
  Users,
  Layers,
  ListChecks,
  ClipboardList,
  Bell,
  Key,
  MessageSquare,
  CheckCircle,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import SignatureCanvas from 'react-signature-canvas';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        errorMessage = `Erro de Permissão: ${parsedError.operationType} em ${parsedError.path}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Ops! Algo deu errado</h2>
            <p className="text-stone-600 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// --- Components ---

const StatusBadge = ({ status }: { status: ProtocolStatus }) => {
  const config = {
    pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    in_transit: { label: 'Em Trânsito', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck },
    delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    returned: { label: 'Devolvido', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: RotateCcw },
  };

  const { label, color, icon: Icon } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

interface ProtocolCardProps {
  protocol: Protocol;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, onClick, onEdit, onDelete }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 group-hover:bg-stone-900 group-hover:text-white transition-colors">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 line-clamp-1">{protocol.title}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-stone-500 font-mono">{protocol.protocolNumber || `#${protocol.id.slice(-6).toUpperCase()}`}</p>
              {protocol.documentType && (
                <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded font-bold uppercase">
                  {protocol.documentType}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={protocol.status} />
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Editar"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <UserIcon size={14} className="text-stone-400" />
          <span className="truncate">Para: {protocol.receiver || 'Não especificado'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Calendar size={14} className="text-stone-400" />
          <span>Criado: {protocol.createdAt ? format(protocol.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '...'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-top border-stone-100">
        <span className={`text-[10px] uppercase tracking-wider font-bold ${protocol.type === 'internal' ? 'text-blue-600' : 'text-purple-600'}`}>
          {protocol.type === 'internal' ? 'Interno' : 'Externo'}
        </span>
        <ChevronRight size={16} className="text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
      </div>
    </motion.div>
  );
};

// --- Main App ---

// --- Modal Component ---
interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  maxWidth?: string;
}

const Modal = ({ children, onClose, title, maxWidth = "max-w-md" }: ModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className={`bg-white rounded-3xl p-8 ${maxWidth} w-full shadow-2xl relative`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900"><X size={24} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

const CameraEscHandler = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  return null;
};

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Excluir", 
  cancelText = "Cancelar",
  isDanger = true 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmText?: string; 
  cancelText?: string;
  isDanger?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-stone-600 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-stone-200 font-bold text-stone-600 hover:bg-stone-50 transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-stone-900 hover:bg-stone-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'list' | 'details' | 'create' | 'companies' | 'employees' | 'departments' | 'returns' | 'items' | 'classifications' | 'documentTypes' | 'notifications'>('dashboard');
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProtocolStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classifications, setClassifications] = useState<ProtocolClassification[]>([]);
  const [documentTypes, setDocumentTypes] = useState<ProtocolDocumentType[]>([]);
  const [allItems, setAllItems] = useState<ProtocolItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form states
  const [newOpinion, setNewOpinion] = useState('');
  const [newDispatch, setNewDispatch] = useState('');
  const [showOpinionModal, setShowOpinionModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [newProtocol, setNewProtocol] = useState({
    title: '',
    description: '',
    sender: '',
    receiver: '',
    type: 'internal' as ProtocolType,
    
    // New fields from images
    originType: 'my_company' as 'my_company' | 'other_company',
    originCompanyId: '',
    originDepartmentId: '',
    originEmployeeId: '',
    courierId: '',
    
    destinationType: 'other_company' as 'my_company' | 'other_company',
    destinationCompanyId: '',
    destinationDepartmentId: '',
    destinationEmployeeId: '',
    deliveryAddress: '',

    documentType: '',
    documentTypeId: '',
    classificationId: '',
    protocolNumber: '',
    volumes: 1,
    attachments: [] as { name: string; url: string }[]
  });

  const [localItems, setLocalItems] = useState<Omit<ProtocolItem, 'id' | 'protocolId' | 'returned'>[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState<Omit<ProtocolItem, 'id' | 'protocolId' | 'returned'>>({
    name: '',
    quantity: 1,
    ref: '',
    dueDate: '',
    value: 0,
    total: 0,
    returnDate: ''
  });

  const handleAddItemToNewProtocol = () => {
    if (!newItem.name) return;
    setLocalItems([...localItems, { ...newItem, total: newItem.quantity * (newItem.value || 0) }]);
    setNewItem({
      name: '',
      quantity: 1,
      ref: '',
      dueDate: '',
      value: 0,
      total: 0,
      returnDate: ''
    });
    setShowItemModal(false);
  };

  // Signature & Camera states
  const [showSignature, setShowSignature] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  
  // Edit states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editType, setEditType] = useState<'protocol' | 'company' | 'employee' | 'department' | 'classification' | 'documentType' | 'item' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Confirmation Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [newCompany, setNewCompany] = useState({ name: '', code: '', email: '', phone: '', address: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', departmentId: '', companyId: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '', code: '', companyId: '' });
  const [newClassification, setNewClassification] = useState({ name: '', code: '' });
  const [newDocType, setNewDocType] = useState({ name: '' });

  const sigCanvas = useRef<SignatureCanvas>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        let userProfile = await ProtocolService.getUserProfile(user.uid);
        if (!userProfile) {
          userProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || '',
            role: 'user'
          };
          await ProtocolService.createUserProfile(userProfile);
        }
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'login' && !user && isAuthReady) {
      setAuthMode('login');
      setShowAuth(true);
    }
  }, [user, isAuthReady]);

  useEffect(() => {
    if (user && isAuthReady && profile?.companyId) {
      const unsubProtocols = ProtocolService.subscribeToProtocols(profile.companyId, setProtocols);
      const unsubCompanies = ProtocolService.subscribeToCompanies(profile.companyId, setCompanies);
      const unsubEmployees = ProtocolService.subscribeToEmployees(profile.companyId, setEmployees);
      const unsubDepartments = ProtocolService.subscribeToDepartments(profile.companyId, setDepartments);
      const unsubClassifications = ProtocolService.subscribeToClassifications(profile.companyId, setClassifications);
      const unsubDocumentTypes = ProtocolService.subscribeToDocumentTypes(profile.companyId, setDocumentTypes);
      const unsubAllItems = ProtocolService.subscribeToAllItems(profile.companyId, setAllItems);
      const unsubNotifications = ProtocolService.subscribeToNotifications(user.uid, setNotifications);

      return () => {
        unsubProtocols();
        unsubCompanies();
        unsubEmployees();
        unsubDepartments();
        unsubClassifications();
        unsubDocumentTypes();
        unsubAllItems();
        unsubNotifications();
      };
    }
  }, [user, isAuthReady]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const protocolId = params.get('protocolId');
    if (protocolId && user && protocols.length > 0) {
      const protocol = protocols.find(p => p.id === protocolId);
      if (protocol) {
        setSelectedProtocol(protocol);
        setView('protocol-detail');
        // Clear the URL parameter to avoid re-selecting on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user, protocols]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleDeleteProtocol = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Protocolo',
      message: 'Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        await ProtocolService.deleteProtocol(id);
        if (selectedProtocol?.id === id) {
          setSelectedProtocol(null);
          setView('dashboard');
        }
      }
    });
  };

  const handleDeleteCompany = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Empresa',
      message: 'Tem certeza que deseja excluir esta empresa?',
      onConfirm: async () => {
        await ProtocolService.deleteCompany(id);
      }
    });
  };

  const handleDeleteEmployee = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Funcionário',
      message: 'Tem certeza que deseja excluir este funcionário?',
      onConfirm: async () => {
        await ProtocolService.deleteEmployee(id);
      }
    });
  };

  const handleDeleteDepartment = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Departamento',
      message: 'Tem certeza que deseja excluir este departamento?',
      onConfirm: async () => {
        await ProtocolService.deleteDepartment(id);
      }
    });
  };

  const handleDeleteClassification = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Classificação',
      message: 'Tem certeza que deseja excluir esta classificação?',
      onConfirm: async () => {
        await ProtocolService.deleteClassification(id);
      }
    });
  };

  const handleDeleteDocumentType = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Tipo de Documento',
      message: 'Tem certeza que deseja excluir este tipo de documento?',
      onConfirm: async () => {
        await ProtocolService.deleteDocumentType(id);
      }
    });
  };

  const handleDeleteProtocolItem = (protocolId: string, itemId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Item do Protocolo',
      message: 'Tem certeza que deseja excluir este item do protocolo?',
      onConfirm: async () => {
        await ProtocolService.deleteProtocolItem(protocolId, itemId);
      }
    });
  };

  const handleEdit = (item: any, type: typeof editType) => {
    setEditingItem(item);
    setEditType(type);
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editType) return;

    try {
      switch (editType) {
        case 'company':
          await ProtocolService.updateCompany(editingItem.id, editingItem);
          break;
        case 'employee':
          await ProtocolService.updateEmployee(editingItem.id, editingItem);
          break;
        case 'department':
          await ProtocolService.updateDepartment(editingItem.id, editingItem);
          break;
        case 'classification':
          await ProtocolService.updateClassification(editingItem.id, editingItem);
          break;
        case 'documentType':
          await ProtocolService.updateDocumentType(editingItem.id, editingItem);
          break;
        case 'protocol':
          await ProtocolService.updateProtocol(editingItem.id, editingItem, user?.uid || '', profile?.displayName);
          break;
        case 'item':
          await ProtocolService.updateProtocolItem(editingItem.protocolId, editingItem.id, editingItem);
          break;
      }
      setShowEditModal(false);
      setEditingItem(null);
      setEditType(null);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  useEffect(() => {
    if (view === 'create') {
      const dept = departments.find(d => d.id === newProtocol.originDepartmentId);
      const inst = companies.find(c => c.id === newProtocol.originCompanyId);
      const classif = classifications.find(c => c.id === newProtocol.classificationId);
      const year = new Date().getFullYear();
      
      // Use names as requested if possible, or codes
      const deptPart = dept?.name || 'DEP';
      const instPart = inst?.name || 'INST';
      const classifPart = classif?.code || classif?.name || '000';
      
      // Format: 1/departamento/instituição/número de classificador/2026
      const protoNum = `1/${deptPart}/${instPart}/${classifPart}/${year}`;
      if (newProtocol.protocolNumber !== protoNum) {
        setNewProtocol(prev => ({ ...prev, protocolNumber: protoNum }));
      }
    }
  }, [newProtocol.originDepartmentId, newProtocol.originCompanyId, newProtocol.classificationId, view, departments, companies, classifications, newProtocol.protocolNumber]);

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const id = await ProtocolService.createProtocol({
      ...newProtocol,
      status: 'pending',
      createdBy: user.uid,
      createdByName: profile.displayName || user.email!,
      companyId: profile.companyId
    });

    if (id) {
      // Save local items
      const savedItems: ProtocolItem[] = [];
      for (const item of localItems) {
        const itemId = await ProtocolService.addProtocolItem({
          ...item,
          protocolId: id,
          returned: false,
          companyId: profile.companyId
        });
        if (itemId) {
          savedItems.push({ ...item, id: itemId, protocolId: id, returned: false });
        }
      }

      // Fetch the full protocol object to ensure we have the correct data (like createdAt)
      const fullProtocol = await ProtocolService.getProtocol(id);
      if (fullProtocol) {
        handleGenerateReceipt(fullProtocol);
      }

      setNewProtocol({ 
        title: '', 
        description: '', 
        sender: '', 
        receiver: '', 
        type: 'internal',
        originType: 'my_company',
        originCompanyId: '',
        originDepartmentId: '',
        originEmployeeId: '',
        courierId: '',
        destinationType: 'other_company',
        destinationCompanyId: '',
        destinationDepartmentId: '',
        destinationEmployeeId: '',
        deliveryAddress: '',
        documentType: '',
        documentTypeId: '',
        classificationId: '',
        protocolNumber: '',
        volumes: 1,
        attachments: []
      });
      setLocalItems([]);
      setView('dashboard');
    }
  };

  const handleSaveOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol || !user || !profile || !newOpinion) return;
    await ProtocolService.addOpinion(selectedProtocol.id, {
      text: newOpinion,
      authorId: user.uid,
      authorName: profile.displayName || user.email || 'Usuário'
    });
    setNewOpinion('');
    setShowOpinionModal(false);
  };

  const handleSaveDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol || !user || !profile || !newDispatch) return;
    await ProtocolService.addDispatch(selectedProtocol.id, {
      text: newDispatch,
      authorId: user.uid,
      authorName: profile.displayName || user.email || 'Usuário'
    });
    
    // Generate Dispatch PDF
    handleGenerateDispatchPDF(selectedProtocol, newDispatch, profile.displayName || user.email || 'Usuário');
    
    setNewDispatch('');
    setShowDispatchModal(false);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;
    await ProtocolService.createCompany({
      ...newCompany,
      ownerCompanyId: profile.companyId
    });
    setNewCompany({ name: '', email: '', phone: '', address: '' });
    setShowCompanyModal(false);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;
    await ProtocolService.createEmployee({
      ...newEmployee,
      companyId: profile.companyId
    });
    setNewEmployee({ name: '', email: '', departmentId: '', companyId: '' });
    setShowEmployeeModal(false);
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;
    await ProtocolService.createDepartment({
      ...newDepartment,
      companyId: profile.companyId
    });
    setNewDepartment({ name: '', code: '', companyId: '' });
    setShowDepartmentModal(false);
  };

  const handleCreateClassification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;
    await ProtocolService.createClassification({
      ...newClassification,
      companyId: profile.companyId
    });
    setNewClassification({ name: '', code: '' });
    setShowClassificationModal(false);
  };

  const handleCreateDocType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;
    await ProtocolService.createDocumentType({
      ...newDocType,
      companyId: profile.companyId
    });
    setNewDocType({ name: '' });
    setShowDocTypeModal(false);
  };

  const handleAddItemToExistingProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocol || !profile?.companyId) return;
    await ProtocolService.addProtocolItem({
      ...newItem,
      protocolId: selectedProtocol.id,
      companyId: profile.companyId
    });
    setNewItem({
      name: '',
      quantity: 1,
      ref: '',
      dueDate: '',
      value: 0,
      total: 0,
      returnDate: ''
    });
    setShowItemModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map((file: File) => {
      return new Promise<{ name: string; url: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: file.name,
            url: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const uploadedFiles = await Promise.all(filePromises);
    setNewProtocol(prev => ({ 
      ...prev, 
      attachments: [...(prev.attachments || []), ...uploadedFiles] 
    }));
  };

  const handleGenerateReceipt = async (protocol: Protocol) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(25, 118, 210); // Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE PROTOCOLO', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(protocol.protocolNumber || `Protocolo #${protocol.id.toUpperCase()}`, pageWidth / 2, 33, { align: 'center' });

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES GERAIS', 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Título: ${protocol.title}`, 20, 65);
    doc.text(`Data: ${format(protocol.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 72);
    const classification = classifications.find(c => c.id === protocol.classificationId)?.name || 'Não informada';
    doc.text(`Classificação: ${classification}`, 20, 79);
    doc.text(`Tipo: ${protocol.documentType || 'Não informado'}`, 20, 86);
    doc.text(`Volumes: ${protocol.volumes || 1}`, 20, 93);
    doc.text(`Status Atual: ${protocol.status.toUpperCase()}`, 20, 100);

    // Origin & Destination
    doc.setFont('helvetica', 'bold');
    doc.text('ORIGEM', 20, 112);
    doc.setFont('helvetica', 'normal');
    const originCompany = companies.find(c => c.id === protocol.originCompanyId)?.name || 'Não informada';
    const originDept = departments.find(d => d.id === protocol.originDepartmentId)?.name || 'Não informado';
    const originEmp = employees.find(e => e.id === protocol.originEmployeeId)?.name || 'Não informado';
    doc.text(`Empresa: ${originCompany}`, 20, 119);
    doc.text(`Depto: ${originDept}`, 20, 126);
    doc.text(`Responsável: ${originEmp}`, 20, 133);

    doc.setFont('helvetica', 'bold');
    doc.text('DESTINO', 110, 112);
    doc.setFont('helvetica', 'normal');
    const destCompany = companies.find(c => c.id === protocol.destinationCompanyId)?.name || 'Não informada';
    const destDept = departments.find(d => d.id === protocol.destinationDepartmentId)?.name || 'Não informado';
    const destEmp = employees.find(e => e.id === protocol.destinationEmployeeId)?.name || 'Não informado';
    doc.text(`Empresa: ${destCompany}`, 110, 119);
    doc.text(`Depto: ${destDept}`, 110, 126);
    doc.text(`Responsável: ${destEmp}`, 110, 133);
    doc.text(`Endereço: ${protocol.deliveryAddress || 'Endereço da empresa'}`, 110, 140);

    // Items Table
    doc.setFont('helvetica', 'bold');
    doc.text('ITENS DO PROTOCOLO', 20, 152);
    
    // Fetch items
    const items = await ProtocolService.getProtocolItems(protocol.id);
    let yPos = 162;
    
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
    doc.setFontSize(8);
    doc.text('DESCRIÇÃO', 22, yPos);
    doc.text('REF', 80, yPos);
    doc.text('VENC.', 110, yPos);
    doc.text('QTDE', 140, yPos);
    doc.text('VALOR', 160, yPos);
    doc.text('TOTAL', 185, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(item.name.substring(0, 35), 22, yPos);
      doc.text(item.ref || '-', 80, yPos);
      doc.text(item.dueDate || '-', 110, yPos);
      doc.text(item.quantity.toString(), 140, yPos);
      doc.text((item.value || 0).toLocaleString('pt-BR'), 160, yPos);
      doc.text((item.total || 0).toLocaleString('pt-BR'), 185, yPos);
      yPos += 6;
    });

    // Observations
    if (protocol.description) {
      yPos += 10;
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      const splitDesc = doc.splitTextToSize(protocol.description, pageWidth - 40);
      doc.text(splitDesc, 20, yPos + 7);
      yPos += (splitDesc.length * 5) + 10;
    }

    // Signatures
    yPos = 260;
    doc.line(20, yPos, 90, yPos);
    doc.line(120, yPos, 190, yPos);
    doc.setFontSize(8);
    doc.text('Assinatura do Remetente', 55, yPos + 5, { align: 'center' });
    doc.text('Assinatura do Destinatário', 155, yPos + 5, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Protocolo Digital`, pageWidth / 2, 285, { align: 'center' });

    doc.save(`recibo-protocolo-${protocol.id}.pdf`);
  };

  const handleGenerateDispatchPDF = async (protocol: Protocol, dispatchText: string, authorName: string) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(33, 33, 33); // Dark Grey
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('COMUNICAÇÃO DE DESPACHO', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(protocol.protocolNumber || `Protocolo #${protocol.id.toUpperCase()}`, pageWidth / 2, 33, { align: 'center' });

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DO PROTOCOLO', 20, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Título: ${protocol.title}`, 20, 65);
    doc.text(`Data de Criação: ${format(protocol.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 72);
    doc.text(`Remetente: ${protocol.createdByName}`, 20, 79);

    // Opinions Section
    let yPos = 95;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PARECERES ACUMULADOS', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (protocol.opinions && protocol.opinions.length > 0) {
      protocol.opinions.forEach((op, index) => {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. Parecer de ${op.authorName}:`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        const splitOp = doc.splitTextToSize(op.text, pageWidth - 40);
        doc.text(splitOp, 20, yPos + 5);
        yPos += (splitOp.length * 5) + 12;
      });
    } else {
      doc.text('Nenhum parecer registrado.', 20, yPos);
      yPos += 10;
    }

    // Final Dispatch
    if (yPos > 230) { doc.addPage(); yPos = 20; }
    yPos += 5;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPos, pageWidth - 30, 40, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DESPACHO FINAL', 20, yPos + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitDispatch = doc.splitTextToSize(dispatchText, pageWidth - 40);
    doc.text(splitDispatch, 20, yPos + 18);
    
    yPos += 50;
    
    // Signature
    doc.line(pageWidth / 2 - 40, yPos + 20, pageWidth / 2 + 40, yPos + 20);
    doc.text(authorName, pageWidth / 2, yPos + 25, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Responsável pelo Despacho', pageWidth / 2, yPos + 30, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Protocolo Digital`, pageWidth / 2, 285, { align: 'center' });

    doc.save(`comunicacao-despacho-${protocol.id}.pdf`);
  };

  const handleUpdateStatus = async (id: string, newStatus: ProtocolStatus) => {
    if (!user || !profile) return;
    await ProtocolService.updateProtocol(id, { status: newStatus }, user.uid, profile.displayName || user.email!);
    if (selectedProtocol && selectedProtocol.id === id) {
      setSelectedProtocol({ ...selectedProtocol, status: newStatus });
    }
  };

  const saveSignature = async () => {
    if (sigCanvas.current && selectedProtocol && user && profile) {
      const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      await ProtocolService.updateProtocol(selectedProtocol.id, { 
        signature: signatureData,
        status: 'delivered'
      }, user.uid, profile.displayName || user.email!);
      setSelectedProtocol({ ...selectedProtocol, signature: signatureData, status: 'delivered' });
      setShowSignature(false);
    }
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current && selectedProtocol && user && profile) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/jpeg');
        await ProtocolService.updateProtocol(selectedProtocol.id, { photo: photoData }, user.uid, profile.displayName || user.email!);
        setSelectedProtocol({ ...selectedProtocol, photo: photoData });
        
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setShowCamera(false);
      }
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowCamera(false);
    }
  };

  const filteredProtocols = protocols.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.protocolNumber && p.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    
    let matchesDate = true;
    if (startDate || endDate) {
      const dateToCompare = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      
      const start = startDate ? new Date(startDate + 'T00:00:00') : null;
      const end = endDate ? new Date(endDate + 'T23:59:59') : null;
      
      if (start && dateToCompare < start) matchesDate = false;
      if (end && dateToCompare > end) matchesDate = false;
    }

    return matchesSearch && matchesFilter && matchesDate;
  });

  const stats = {
    total: protocols.length,
    pending: protocols.filter(p => p.status === 'pending').length,
    in_transit: protocols.filter(p => p.status === 'in_transit').length,
    delivered: protocols.filter(p => p.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-500 font-medium">Carregando Pdocumento...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return (
        <div className="relative">
          <button 
            onClick={() => setShowAuth(false)}
            className="fixed top-6 left-6 z-50 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <Auth 
            onSuccess={() => setShowAuth(false)} 
            initialMode={authMode}
            key={authMode}
          />
        </div>
      );
    }
    return (
      <LandingPage 
        onLoginClick={() => {
          setAuthMode('login');
          setShowAuth(true);
        }}
        onRegisterClick={() => {
          setAuthMode('register');
          setShowAuth(true);
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20 md:pb-0 md:pl-64">
        
        {/* --- Sidebar (Desktop) --- */}
        <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-stone-200 p-6 z-30">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
              <FileText className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Pdocumento</span>
          </div>

          <button 
            onClick={() => setView('create')}
            className="w-full flex items-center justify-center gap-2 bg-[#00897b] text-white py-3 rounded-full font-bold shadow-md hover:bg-[#00796b] transition-all mb-8 uppercase text-sm tracking-wide"
          >
            <Plus size={20} />
            Novo Protocolo
          </button>

          <nav className="space-y-1 flex-1 overflow-y-auto pr-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'list', label: 'Protocolos', icon: ClipboardList },
              { id: 'returns', label: 'Retorno de itens', icon: RotateCcw },
              { id: 'companies', label: 'Empresas', icon: Building2 },
              { id: 'employees', label: 'Funcionários', icon: Users },
              { id: 'departments', label: 'Departamentos', icon: Layers },
              { id: 'classifications', label: 'Classificações', icon: Filter },
              { id: 'documentTypes', label: 'Tipos de Documento', icon: FileText },
              { id: 'items', label: 'Itens do protocolo', icon: ListChecks },
              { id: 'notifications', label: 'Notificações', icon: Bell, count: notifications.filter(n => !n.read).length },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${view === item.id ? 'text-[#1976d2] bg-blue-50 font-semibold' : 'text-stone-600 hover:bg-stone-50'}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} className={view === item.id ? 'text-[#1976d2]' : 'text-stone-500'} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-stone-100">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden">
                {user.photoURL ? <img src={user.photoURL} alt="Avatar" /> : <UserIcon size={20} className="text-stone-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-xs text-stone-500 truncate">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-medium"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </aside>

        {/* --- Mobile Bottom Nav --- */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 px-6 py-3 flex justify-between items-center z-30">
          <button onClick={() => setView('dashboard')} className={`p-2 rounded-xl ${view === 'dashboard' ? 'text-stone-900 bg-stone-100' : 'text-stone-400'}`}>
            <LayoutDashboard size={24} />
          </button>
          <button onClick={() => setView('list')} className={`p-2 rounded-xl ${view === 'list' ? 'text-stone-900 bg-stone-100' : 'text-stone-400'}`}>
            <Search size={24} />
          </button>
          <button onClick={() => setView('create')} className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg -mt-10 border-4 border-stone-50">
            <Plus size={24} />
          </button>
          <button onClick={() => {}} className="p-2 text-stone-400">
            <QrCode size={24} />
          </button>
          <button onClick={handleLogout} className="p-2 text-rose-500">
            <LogOut size={24} />
          </button>
        </nav>

        {/* --- Content Area --- */}
        <main className="p-6 max-w-6xl mx-auto">
          
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <header className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900">Olá, {user.displayName?.split(' ')[0] || 'Usuário'}</h2>
                    <p className="text-stone-500">Aqui está o resumo dos seus protocolos hoje.</p>
                  </div>
                  <button 
                    onClick={() => setView('create')}
                    className="hidden md:flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-stone-800 transition-all active:scale-95"
                  >
                    <Plus size={20} />
                    Novo Protocolo
                  </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total', value: stats.total, icon: FileText, color: 'text-stone-600', bg: 'bg-stone-100' },
                    { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Em Trânsito', value: stats.in_transit, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Entregues', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                      <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                        <stat.icon size={20} />
                      </div>
                      <p className="text-stone-500 text-sm font-medium">{stat.label}</p>
                      <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Protocols */}
                <section>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Protocolos Recentes</h3>
                    <button onClick={() => setView('list')} className="text-stone-500 text-sm font-medium hover:text-stone-900 transition-colors flex items-center gap-1">
                      Ver todos <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {protocols.slice(0, 6).map(p => (
                      <ProtocolCard 
                        key={p.id} 
                        protocol={p} 
                        onClick={() => {
                          setSelectedProtocol(p);
                          setView('details');
                        }} 
                        onEdit={(e) => {
                          e.stopPropagation();
                          handleEdit(p, 'protocol');
                        }}
                        onDelete={(e) => {
                          e.stopPropagation();
                          handleDeleteProtocol(p.id);
                        }}
                      />
                    ))}
                    {protocols.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-stone-300">
                        <FileText className="mx-auto text-stone-300 mb-4" size={48} />
                        <p className="text-stone-500">Nenhum protocolo encontrado.</p>
                        <button onClick={() => setView('create')} className="mt-4 text-stone-900 font-bold underline">Criar o primeiro</button>
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {view === 'companies' && (
              <motion.div key="companies" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Empresas</h2>
                    <p className="text-stone-500">Gerencie as empresas parceiras e clientes.</p>
                  </div>
                  <button onClick={() => setShowCompanyModal(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg hover:bg-stone-800 transition-all">
                    <Plus size={20} /> Nova Empresa
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map(company => (
                    <div key={company.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(company, 'company')}
                          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCompany(company.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 mb-4">
                        <Building2 size={24} />
                      </div>
                      <h3 className="font-bold text-lg text-stone-900 mb-1">{company.name}</h3>
                      <p className="text-sm text-stone-500 mb-4">{company.address || 'Endereço não informado'}</p>
                      <div className="space-y-2 pt-4 border-t border-stone-50">
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Search size={14} className="text-stone-400" />
                          <span>{company.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Truck size={14} className="text-stone-400" />
                          <span>{company.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
                      <Building2 className="mx-auto text-stone-200 mb-4" size={48} />
                      <p className="text-stone-400 font-medium">Nenhuma empresa cadastrada.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900">Notificações</h2>
                  <p className="text-stone-500">Acompanhe as atualizações e alertas do sistema.</p>
                </div>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        onClick={() => !notification.read && ProtocolService.markNotificationAsRead(notification.id)}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                          notification.read 
                            ? 'bg-white border-stone-100 opacity-75' 
                            : 'bg-white border-blue-200 shadow-lg ring-1 ring-blue-50'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            notification.type === 'protocol' ? 'bg-blue-50 text-blue-600' :
                            notification.type === 'credential' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {notification.type === 'protocol' ? <FileText size={24} /> :
                             notification.type === 'credential' ? <Key size={24} /> :
                             <Bell size={24} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className={`font-bold ${notification.read ? 'text-stone-700' : 'text-stone-900'}`}>
                                {notification.title}
                              </h3>
                              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                                {format(notification.createdAt.toDate(), 'dd/MM HH:mm')}
                              </span>
                            </div>
                            <p className={`text-sm leading-relaxed ${notification.read ? 'text-stone-500' : 'text-stone-600'}`}>
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <div className="mt-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Nova</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
                      <Bell className="mx-auto text-stone-200 mb-4" size={48} />
                      <p className="text-stone-400 font-medium">Você não tem notificações no momento.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'employees' && (
              <motion.div key="employees" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Funcionários</h2>
                    <p className="text-stone-500">Gerencie os colaboradores e motoristas.</p>
                  </div>
                  <button onClick={() => setShowEmployeeModal(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg hover:bg-stone-800 transition-all">
                    <Plus size={20} /> Novo Funcionário
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map(employee => (
                    <div key={employee.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(employee, 'employee')}
                          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-600">
                          <Users size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">{employee.name}</h3>
                          <p className="text-xs text-stone-500">{employee.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-stone-50">
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Building2 size={14} className="text-stone-400" />
                          <span>{companies.find(c => c.id === employee.companyId)?.name || 'Empresa não vinculada'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <Layers size={14} className="text-stone-400" />
                          <span>{departments.find(d => d.id === employee.departmentId)?.name || 'Sem departamento'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
                      <Users className="mx-auto text-stone-200 mb-4" size={48} />
                      <p className="text-stone-400 font-medium">Nenhum funcionário cadastrado.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'departments' && (
              <motion.div key="departments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Departamentos</h2>
                    <p className="text-stone-500">Estrutura organizacional da empresa.</p>
                  </div>
                  <button onClick={() => setShowDepartmentModal(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg hover:bg-stone-800 transition-all">
                    <Plus size={20} /> Novo Departamento
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map(dept => (
                    <div key={dept.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(dept, 'department')}
                          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDepartment(dept.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 mb-4">
                        <Layers size={24} />
                      </div>
                      <h3 className="font-bold text-lg text-stone-900 mb-1">{dept.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-stone-600 mt-4 pt-4 border-t border-stone-50">
                        <Building2 size={14} className="text-stone-400" />
                        <span>{companies.find(c => c.id === dept.companyId)?.name || 'Empresa não vinculada'}</span>
                      </div>
                    </div>
                  ))}
                  {departments.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
                      <Layers className="mx-auto text-stone-200 mb-4" size={48} />
                      <p className="text-stone-400 font-medium">Nenhum departamento cadastrado.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'returns' && (
              <motion.div key="returns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Retorno de Itens</h2>
                    <p className="text-stone-500">Protocolos com itens pendentes de devolução.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {protocols.filter(p => p.status !== 'delivered').map(p => (
                    <ProtocolCard key={p.id} protocol={p} onClick={() => { setSelectedProtocol(p); setView('details'); }} />
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'classifications' && (
              <motion.div key="classifications" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Classificações de Documentos</h2>
                    <p className="text-stone-500">Gerencie as categorias de classificação dos protocolos.</p>
                  </div>
                  <button onClick={() => setShowClassificationModal(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg hover:bg-stone-800 transition-all">
                    <Plus size={20} /> Nova Classificação
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classifications.map(classif => (
                    <div key={classif.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(classif, 'classification')}
                          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClassification(classif.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 mb-4">
                        <Filter size={24} />
                      </div>
                      <h3 className="font-bold text-lg text-stone-900 mb-1">{classif.name}</h3>
                      <p className="text-sm font-mono text-stone-500">Código: {classif.code}</p>
                    </div>
                  ))}
                  {classifications.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
                      <Filter className="mx-auto text-stone-200 mb-4" size={48} />
                      <p className="text-stone-400 font-medium">Nenhuma classificação cadastrada.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'documentTypes' && (
              <motion.div key="documentTypes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Tipos de Documento</h2>
                    <p className="text-stone-500">Defina os tipos de documentos aceitos no sistema.</p>
                  </div>
                  <button onClick={() => setShowDocTypeModal(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg hover:bg-stone-800 transition-all">
                    <Plus size={20} /> Novo Tipo
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentTypes.map(docType => (
                    <div key={docType.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(docType, 'documentType')}
                          className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDocumentType(docType.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 mb-4">
                        <FileText size={24} />
                      </div>
                      <h3 className="font-bold text-lg text-stone-900 mb-1">{docType.name}</h3>
                    </div>
                  ))}
                  {documentTypes.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-stone-100">
                      <FileText className="mx-auto text-stone-200 mb-4" size={48} />
                      <p className="text-stone-400 font-medium">Nenhum tipo de documento cadastrado.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'items' && (
              <motion.div key="items" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">Itens do Protocolo</h2>
                    <p className="text-stone-500">Lista geral de itens em todos os protocolos.</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Qtd</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Ref</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {allItems.map(item => (
                        <tr key={item.id} className="hover:bg-stone-50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-stone-900">{item.name}</p>
                            {item.description && <p className="text-xs text-stone-500">{item.description}</p>}
                          </td>
                          <td className="px-6 py-4 text-stone-600 font-medium">{item.quantity}</td>
                          <td className="px-6 py-4 text-stone-500 font-mono text-xs">{item.ref || '-'}</td>
                          <td className="px-6 py-4">
                            {item.returned ? (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase">Retornado</span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase">Pendente</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEdit(item, 'item')}
                                className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProtocolItem(item.protocolId, item.id)}
                                className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {allItems.length === 0 && (
                        <tr>
                          <td className="px-6 py-10 text-center text-stone-400 italic" colSpan={5}>Nenhum item encontrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {view === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <header className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold">Explorar Protocolos</h2>
                    <div className="flex gap-2">
                      <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                        <input 
                          type="text" 
                          placeholder="Buscar por título ou ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                        />
                      </div>
                      <div className="relative">
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as any)}
                          className="appearance-none pl-4 pr-10 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all font-medium text-stone-700"
                        >
                          <option value="all">Todos Status</option>
                          <option value="pending">Pendentes</option>
                          <option value="in_transit">Em Trânsito</option>
                          <option value="delivered">Entregues</option>
                          <option value="returned">Devolvidos</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-stone-400" />
                      <span className="font-bold text-stone-700">Data de Criação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-400 uppercase">De:</span>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-400 uppercase">Até:</span>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>
                    {(startDate || endDate) && (
                      <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 underline ml-auto"
                      >
                        Limpar Datas
                      </button>
                    )}
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProtocols.map(p => (
                    <ProtocolCard 
                      key={p.id} 
                      protocol={p} 
                      onClick={() => {
                        setSelectedProtocol(p);
                        setView('details');
                      }} 
                      onEdit={(e) => {
                        e.stopPropagation();
                        handleEdit(p, 'protocol');
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDeleteProtocol(p.id);
                      }}
                    />
                  ))}
                  {filteredProtocols.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-stone-300">
                      <Search className="mx-auto text-stone-300 mb-4" size={48} />
                      <p className="text-stone-500">Nenhum resultado para sua busca.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'create' && (
              <motion.div 
                key="create"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-5xl mx-auto"
              >
                <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
                  <div className="bg-blue-600 p-8 text-white">
                    <button onClick={() => setView('dashboard')} className="mb-6 text-blue-100 hover:text-white transition-colors flex items-center gap-2">
                      <ArrowLeft size={18} /> Voltar
                    </button>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-3xl font-bold">Novo Protocolo</h2>
                        <p className="text-stone-400 mt-2">Preencha os dados de origem, destino e itens para gerar o protocolo.</p>
                      </div>
                      <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/20 text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Número Automático</p>
                        <p className="text-2xl font-mono font-bold text-emerald-400">{newProtocol.protocolNumber}</p>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleCreateProtocol} className="p-8 space-y-10">
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Título do Protocolo</label>
                          <input 
                            type="text" 
                            value={newProtocol.title}
                            onChange={e => setNewProtocol({...newProtocol, title: e.target.value})}
                            placeholder="Ex: Envio de Documentos Contábeis"
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Classificação de Documento</label>
                          <div className="flex gap-2">
                            <select 
                              value={newProtocol.classificationId}
                              onChange={e => setNewProtocol({...newProtocol, classificationId: e.target.value})}
                              className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              required
                            >
                              <option value="">Selecione a classificação</option>
                              {classifications.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </select>
                            <button type="button" onClick={() => setShowClassificationModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                              <Plus size={20} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tipo de Documento</label>
                          <div className="flex gap-2">
                            <select 
                              value={newProtocol.documentTypeId}
                              onChange={e => {
                                const selected = documentTypes.find(dt => dt.id === e.target.value);
                                setNewProtocol({...newProtocol, documentTypeId: e.target.value, documentType: selected?.name || ''})
                              }}
                              className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              required
                            >
                              <option value="">Selecione o tipo</option>
                              {documentTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setShowDocTypeModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                              <Plus size={20} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Volumes</label>
                          <input 
                            type="number" 
                            min="1"
                            value={newProtocol.volumes}
                            onChange={e => setNewProtocol({...newProtocol, volumes: parseInt(e.target.value)})}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      
                      {/* --- Origem --- */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-stone-900">Origem</h3>
                          <div className="flex bg-stone-100 p-1 rounded-xl">
                            <button 
                              type="button"
                              onClick={() => setNewProtocol({...newProtocol, originType: 'my_company'})}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${newProtocol.originType === 'my_company' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-500'}`}
                            >
                              Minha Empresa
                            </button>
                            <button 
                              type="button"
                              onClick={() => setNewProtocol({...newProtocol, originType: 'other_company'})}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${newProtocol.originType === 'other_company' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-500'}`}
                            >
                              Outra Empresa
                            </button>
                          </div>
                        </div>

                        <div className={`space-y-4 p-6 rounded-2xl border transition-all ${newProtocol.originType === 'my_company' ? 'bg-blue-50/30 border-blue-200' : 'bg-stone-50/30 border-stone-200'}`}>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Empresa / Remetente</label>
                            <select 
                              value={newProtocol.originCompanyId}
                              onChange={e => setNewProtocol({...newProtocol, originCompanyId: e.target.value})}
                              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                            >
                              <option value="">Selecione a empresa</option>
                              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Departamento</label>
                            <div className="flex gap-2">
                              <select 
                                value={newProtocol.originDepartmentId}
                                onChange={e => setNewProtocol({...newProtocol, originDepartmentId: e.target.value})}
                                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              >
                                <option value="">Selecione o departamento</option>
                                {departments.filter(d => d.companyId === newProtocol.originCompanyId).map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => setShowDepartmentModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Funcionário Responsável</label>
                            <div className="flex gap-2">
                              <select 
                                value={newProtocol.originEmployeeId}
                                onChange={e => setNewProtocol({...newProtocol, originEmployeeId: e.target.value})}
                                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              >
                                <option value="">Selecione o funcionário</option>
                                {employees.filter(emp => emp.companyId === newProtocol.originCompanyId).map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => setShowEmployeeModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Entregador</label>
                            <div className="flex gap-2">
                              <select 
                                value={newProtocol.courierId}
                                onChange={e => setNewProtocol({...newProtocol, courierId: e.target.value})}
                                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              >
                                <option value="">Selecione o entregador</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => setShowEmployeeModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- Destino --- */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-stone-900">Destino</h3>
                          <div className="flex bg-stone-100 p-1 rounded-xl">
                            <button 
                              type="button"
                              onClick={() => setNewProtocol({...newProtocol, destinationType: 'my_company'})}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${newProtocol.destinationType === 'my_company' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-500'}`}
                            >
                              Minha Empresa
                            </button>
                            <button 
                              type="button"
                              onClick={() => setNewProtocol({...newProtocol, destinationType: 'other_company'})}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${newProtocol.destinationType === 'other_company' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-500'}`}
                            >
                              Outra Empresa
                            </button>
                          </div>
                        </div>

                        <div className={`space-y-4 p-6 rounded-2xl border transition-all ${newProtocol.destinationType === 'my_company' ? 'bg-blue-50/30 border-blue-200' : 'bg-stone-50/30 border-stone-200'}`}>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Empresa / Destinatário</label>
                            <div className="flex gap-2">
                              <select 
                                value={newProtocol.destinationCompanyId}
                                onChange={e => setNewProtocol({...newProtocol, destinationCompanyId: e.target.value})}
                                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              >
                                <option value="">Selecione a empresa</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <button type="button" onClick={() => setShowCompanyModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Departamento</label>
                            <div className="flex gap-2">
                              <select 
                                value={newProtocol.destinationDepartmentId}
                                onChange={e => setNewProtocol({...newProtocol, destinationDepartmentId: e.target.value})}
                                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              >
                                <option value="">Selecione o departamento</option>
                                {departments.filter(d => d.companyId === newProtocol.destinationCompanyId).map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => setShowDepartmentModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Funcionário Responsável</label>
                            <div className="flex gap-2">
                              <select 
                                value={newProtocol.destinationEmployeeId}
                                onChange={e => setNewProtocol({...newProtocol, destinationEmployeeId: e.target.value})}
                                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                              >
                                <option value="">Selecione o funcionário</option>
                                {employees.filter(emp => emp.companyId === newProtocol.destinationCompanyId).map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => setShowEmployeeModal(true)} className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all">
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Endereço de Entrega</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Endereço completo"
                                value={newProtocol.deliveryAddress}
                                onChange={e => setNewProtocol({...newProtocol, deliveryAddress: e.target.value})}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all pr-10"
                              />
                              <PenTool size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" />
                            </div>
                            <p className="text-[10px] text-stone-400 font-medium">*Mesmo endereço da empresa*</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* --- Itens --- */}
                    <div className="space-y-6 pt-10 border-t border-stone-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-stone-900">Itens ({localItems.length})</h3>
                        <button 
                          type="button" 
                          onClick={() => setShowItemModal(true)}
                          className="flex items-center gap-2 bg-[#1976d2] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#1565c0] transition-all"
                        >
                          <Plus size={18} /> INCLUIR ITEM
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-stone-100">
                              <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Descrição</th>
                              <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Ref</th>
                              <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Vencimento</th>
                              <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Qtde</th>
                              <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Valor R$</th>
                              <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Total R$</th>
                              <th className="py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Retornar em</th>
                              <th className="py-4"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {localItems.map((item, idx) => (
                              <tr key={idx} className="border-b border-stone-50 group">
                                <td className="py-4 text-sm font-medium text-stone-700">{item.name}</td>
                                <td className="py-4 text-sm text-stone-500">{item.ref || '-'}</td>
                                <td className="py-4 text-sm text-stone-500">{item.dueDate || '-'}</td>
                                <td className="py-4 text-sm text-stone-700 text-center font-bold">{item.quantity}</td>
                                <td className="py-4 text-sm text-stone-500 text-right">{(item.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 text-sm text-stone-900 text-right font-bold">{(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 text-sm text-stone-500">{item.returnDate || '-'}</td>
                                <td className="py-4 text-right">
                                  <button 
                                    type="button"
                                    onClick={() => setLocalItems(localItems.filter((_, i) => i !== idx))}
                                    className="text-stone-300 hover:text-rose-500 transition-colors"
                                  >
                                    <X size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {localItems.length === 0 && (
                              <tr>
                                <td colSpan={8} className="py-10 text-center text-stone-400 text-sm italic">Nenhum item incluído ainda.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* --- Observações --- */}
                    <div className="space-y-6 pt-10 border-t border-stone-100">
                      <h3 className="text-xl font-bold text-stone-900">Observações</h3>
                      <div className="space-y-2">
                        <textarea 
                          rows={4}
                          placeholder="Observações são impressas no protocolo"
                          value={newProtocol.description}
                          onChange={e => setNewProtocol({...newProtocol, description: e.target.value})}
                          className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none transition-all resize-none text-stone-700"
                        />
                        <p className="text-xs text-stone-400 font-medium">Observações são impressas no protocolo</p>
                      </div>
                    </div>

                    {/* --- Outros campos (Anexos) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-stone-100">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Anexar Arquivos</label>
                        <div className="flex flex-col gap-4">
                          <label className="flex items-center justify-center gap-2 w-full p-6 border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:border-stone-400 transition-all bg-stone-50">
                            <Plus size={24} className="text-stone-400" />
                            <span className="text-stone-500 font-bold">Clique para selecionar arquivos</span>
                            <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                          </label>
                          
                          {newProtocol.attachments && newProtocol.attachments.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {newProtocol.attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-stone-100 rounded-xl text-xs shadow-sm">
                                  <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                                  <button 
                                    type="button"
                                    onClick={() => setNewProtocol(prev => ({
                                      ...prev, 
                                      attachments: prev.attachments?.filter((_, i) => i !== idx)
                                    }))}
                                    className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-all"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-10">
                      <button 
                        type="submit"
                        className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <Plus size={24} />
                        Criar Protocolo
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {view === 'details' && selectedProtocol && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Info */}
                  <div className="flex-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
                      <div className="p-8 border-b border-stone-100 flex justify-between items-start">
                        <div>
                          <button onClick={() => setView('dashboard')} className="mb-4 text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 text-sm font-medium">
                            <ArrowLeft size={16} /> Voltar
                          </button>
                          <h2 className="text-2xl font-bold text-stone-900">{selectedProtocol.title}</h2>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-stone-500 font-mono text-sm">{selectedProtocol.protocolNumber || `#${selectedProtocol.id.toUpperCase()}`}</p>
                            {selectedProtocol.documentType && (
                              <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full font-bold uppercase tracking-wider">
                                {selectedProtocol.documentType}
                              </span>
                            )}
                            {selectedProtocol.volumes && (
                              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold uppercase tracking-wider">
                                {selectedProtocol.volumes} {selectedProtocol.volumes === 1 ? 'Volume' : 'Volumes'}
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={selectedProtocol.status} />
                      </div>

                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-4">Origem e Destino</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className={`p-6 rounded-2xl border transition-all ${selectedProtocol.originType === 'my_company' ? 'bg-blue-50/50 border-blue-200' : 'bg-stone-50 border border-stone-100'}`}>
                                <p className={`text-xs font-bold uppercase mb-3 ${selectedProtocol.originType === 'my_company' ? 'text-blue-600' : 'text-stone-400'}`}>Origem</p>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Building2 size={14} className={selectedProtocol.originType === 'my_company' ? 'text-blue-400' : 'text-stone-400'} />
                                    <span className="text-sm font-bold">{companies.find(c => c.id === selectedProtocol.originCompanyId)?.name || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users size={14} className={selectedProtocol.originType === 'my_company' ? 'text-blue-400' : 'text-stone-400'} />
                                    <span className="text-sm">{departments.find(d => d.id === selectedProtocol.originDepartmentId)?.name || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <UserIcon size={14} className={selectedProtocol.originType === 'my_company' ? 'text-blue-400' : 'text-stone-400'} />
                                    <span className="text-sm">{employees.find(e => e.id === selectedProtocol.originEmployeeId)?.name || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className={`p-6 rounded-2xl border transition-all ${selectedProtocol.destinationType === 'my_company' ? 'bg-blue-50/50 border-blue-200' : 'bg-stone-50 border border-stone-100'}`}>
                                <p className={`text-xs font-bold uppercase mb-3 ${selectedProtocol.destinationType === 'my_company' ? 'text-blue-600' : 'text-stone-400'}`}>Destino</p>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Building2 size={14} className={selectedProtocol.destinationType === 'my_company' ? 'text-blue-400' : 'text-stone-400'} />
                                    <span className="text-sm font-bold">{companies.find(c => c.id === selectedProtocol.destinationCompanyId)?.name || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users size={14} className={selectedProtocol.destinationType === 'my_company' ? 'text-blue-400' : 'text-stone-400'} />
                                    <span className="text-sm">{departments.find(d => d.id === selectedProtocol.destinationDepartmentId)?.name || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <UserIcon size={14} className={selectedProtocol.destinationType === 'my_company' ? 'text-blue-400' : 'text-stone-400'} />
                                    <span className="text-sm">{employees.find(e => e.id === selectedProtocol.destinationEmployeeId)?.name || 'N/A'}</span>
                                  </div>
                                  <div className={`flex items-start gap-2 pt-2 border-t ${selectedProtocol.destinationType === 'my_company' ? 'border-blue-200' : 'border-stone-200'}`}>
                                    <MapPin size={14} className={`${selectedProtocol.destinationType === 'my_company' ? 'text-blue-400' : 'text-stone-400'} shrink-0 mt-0.5`} />
                                    <span className="text-xs text-stone-600">{selectedProtocol.deliveryAddress || 'Endereço da empresa'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Descrição</p>
                            <p className="text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
                              {selectedProtocol.description || 'Nenhuma descrição fornecida.'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2">Ações Rápidas</p>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedProtocol.status === 'pending' && (
                                <button 
                                  onClick={() => handleUpdateStatus(selectedProtocol.id, 'in_transit')}
                                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all"
                                >
                                  <Truck size={24} />
                                  <span className="text-xs font-bold">Em Trânsito</span>
                                </button>
                              )}
                              {selectedProtocol.status === 'in_transit' && (
                                <button 
                                  onClick={() => setShowSignature(true)}
                                  className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all"
                                >
                                  <PenTool size={24} />
                                  <span className="text-xs font-bold">Assinar</span>
                                </button>
                              )}
                              <button 
                                onClick={startCamera}
                                className="flex flex-col items-center gap-2 p-4 bg-stone-50 text-stone-700 rounded-2xl border border-stone-200 hover:bg-stone-100 transition-all"
                              >
                                <Camera size={24} />
                                <span className="text-xs font-bold">Foto</span>
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(selectedProtocol.id, 'returned')}
                                className="flex flex-col items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all"
                              >
                                <RotateCcw size={24} />
                                <span className="text-xs font-bold">Devolver</span>
                              </button>
                              <button 
                                onClick={() => handleGenerateReceipt(selectedProtocol)}
                                className="flex flex-col items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all"
                              >
                                <FileText size={24} />
                                <span className="text-xs font-bold">Recibo</span>
                              </button>
                              <button 
                                onClick={() => window.print()}
                                className="flex flex-col items-center gap-2 p-4 bg-stone-50 text-stone-700 rounded-2xl border border-stone-200 hover:bg-stone-100 transition-all print:hidden"
                              >
                                <Printer size={24} />
                                <span className="text-xs font-bold">Imprimir</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setNewItem({
                                    name: '',
                                    quantity: 1,
                                    ref: '',
                                    dueDate: '',
                                    value: 0,
                                    total: 0,
                                    returnDate: ''
                                  });
                                  setShowItemModal(true);
                                }}
                                className="flex flex-col items-center gap-2 p-4 bg-stone-900 text-white rounded-2xl border border-stone-800 hover:bg-stone-800 transition-all"
                              >
                                <PlusCircle size={24} />
                                <span className="text-xs font-bold">Incluir Item</span>
                              </button>
                              <button 
                                onClick={() => setShowOpinionModal(true)}
                                className="flex flex-col items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 hover:bg-amber-100 transition-all"
                              >
                                <MessageSquare size={24} />
                                <span className="text-xs font-bold">Dar Parecer</span>
                              </button>
                              <button 
                                onClick={() => setShowDispatchModal(true)}
                                className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all"
                              >
                                <CheckCircle size={24} />
                                <span className="text-xs font-bold">Despacho</span>
                              </button>
                            </div>
                          </div>

                          {selectedProtocol.dispatch && (
                            <div className="bg-emerald-900 rounded-2xl p-6 text-white">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="bg-emerald-800 p-2 rounded-lg">
                                  <CheckCircle size={20} />
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">Despacho Final</p>
                                  <p className="text-sm font-bold">Protocolo Concluído</p>
                                </div>
                              </div>
                              <p className="text-sm text-emerald-100 italic mb-4">"{selectedProtocol.dispatch.text}"</p>
                              <div className="flex items-center justify-between text-[10px] text-emerald-300 border-t border-emerald-800 pt-3">
                                <span>Por: {selectedProtocol.dispatch.authorName}</span>
                                <span>{format(selectedProtocol.dispatch.timestamp.toDate(), 'dd/MM/yyyy HH:mm')}</span>
                              </div>
                              <button 
                                onClick={() => handleGenerateDispatchPDF(selectedProtocol, selectedProtocol.dispatch!.text, selectedProtocol.dispatch!.authorName)}
                                className="w-full mt-4 bg-white/10 hover:bg-white/20 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <FileText size={14} />
                                Baixar Comunicação de Despacho
                              </button>
                            </div>
                          )}

                          <div className="bg-stone-900 rounded-2xl p-6 text-white flex items-center justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">QR Code de Rastreio</p>
                              <p className="text-xs text-stone-400">Escaneie para ver status</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg">
                              <QRCodeSVG value={`${window.location.origin}/p/${selectedProtocol.id}`} size={64} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
                      <h3 className="text-xl font-bold mb-6">Pareceres</h3>
                      <div className="space-y-4">
                        {selectedProtocol.opinions && selectedProtocol.opinions.length > 0 ? (
                          selectedProtocol.opinions.map((op) => (
                            <div key={op.id} className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-xs uppercase">
                                    {op.authorName.charAt(0)}
                                  </div>
                                  <span className="text-sm font-bold text-stone-900">{op.authorName}</span>
                                </div>
                                <span className="text-[10px] text-stone-400 font-medium">
                                  {format(op.timestamp.toDate(), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm text-stone-600 leading-relaxed italic">"{op.text}"</p>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                            <MessageSquare size={32} className="mx-auto text-stone-300 mb-3" />
                            <p className="text-stone-400 text-sm">Nenhum parecer registrado ainda.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evidences & Attachments */}
                    {(selectedProtocol.signature || selectedProtocol.photo || (selectedProtocol.attachments && selectedProtocol.attachments.length > 0)) && (
                      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
                        <h3 className="text-xl font-bold mb-6">Comprovantes e Anexos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedProtocol.signature && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Assinatura Digital</p>
                              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-center h-40">
                                <img src={selectedProtocol.signature} alt="Assinatura" className="max-h-full" />
                              </div>
                            </div>
                          )}
                          {selectedProtocol.photo && (
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Foto de Comprovação</p>
                              <div className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden h-40">
                                <img src={selectedProtocol.photo} alt="Foto" className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                          {selectedProtocol.attachments && selectedProtocol.attachments.length > 0 && (
                            <div className="space-y-2 md:col-span-2">
                              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Arquivos Anexados</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {selectedProtocol.attachments.map((file, idx) => (
                                  <a 
                                    key={idx} 
                                    href={file.url} 
                                    download={file.name}
                                    className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-100 rounded-xl hover:bg-stone-100 transition-all group"
                                  >
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-stone-400 group-hover:text-[#1976d2] transition-colors">
                                      <Download size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-stone-600 truncate">{file.name}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: History & Items */}
                  <div className="w-full md:w-80 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <ListChecks size={20} className="text-stone-400" />
                          Itens
                        </h3>
                        <button onClick={() => setShowItemModal(true)} className="text-[#1976d2] hover:bg-blue-50 p-1 rounded-lg transition-colors">
                          <Plus size={20} />
                        </button>
                      </div>
                      <ProtocolItemsList 
                        protocolId={selectedProtocol.id} 
                        onEdit={(item) => handleEdit(item, 'item')}
                        onDelete={handleDeleteProtocolItem}
                      />
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 h-full">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-stone-400" />
                        Histórico
                      </h3>
                      <div className="relative space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-100">
                        <HistoryList protocolId={selectedProtocol.id} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* --- Modals --- */}
        
        {/* Signature Modal */}
        <AnimatePresence>
          {showSignature && (
            <Modal onClose={() => setShowSignature(false)} title="Assinatura Digital" maxWidth="max-w-lg">
              <div className="p-6">
                <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl mb-6 h-64 overflow-hidden">
                  <SignatureCanvas 
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => sigCanvas.current?.clear()}
                    className="flex-1 py-4 rounded-2xl border-2 border-stone-200 font-bold text-stone-600 hover:bg-stone-50 transition-all"
                  >
                    Limpar
                  </button>
                  <button 
                    onClick={saveSignature}
                    className="flex-1 py-4 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-all"
                  >
                    Confirmar Entrega
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Camera Modal */}
        <AnimatePresence>
          {showCamera && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col"
            >
              <CameraEscHandler onClose={() => {
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
                setShowCamera(false);
              }} />
              <div className="p-6 flex justify-between items-center text-white z-10">
                <h3 className="text-xl font-bold">Capturar Evidência</h3>
                <button onClick={() => {
                  const stream = videoRef.current?.srcObject as MediaStream;
                  stream?.getTracks().forEach(track => track.stop());
                  setShowCamera(false);
                }} className="text-white/60 hover:text-white">
                  <X size={32} />
                </button>
              </div>
              
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-full border-2 border-white/20 rounded-3xl" />
                </div>
              </div>

              <div className="p-10 flex justify-center items-center bg-black">
                <button 
                  onClick={takePhoto}
                  className="w-20 h-20 bg-white rounded-full border-8 border-white/20 flex items-center justify-center active:scale-90 transition-all"
                >
                  <div className="w-14 h-14 bg-white rounded-full border-2 border-black/10" />
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

          {showOpinionModal && (
            <Modal onClose={() => setShowOpinionModal(false)} title="Dar Parecer">
              <form onSubmit={handleSaveOpinion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Seu Parecer</label>
                  <textarea 
                    required 
                    rows={5}
                    value={newOpinion} 
                    onChange={e => setNewOpinion(e.target.value)} 
                    placeholder="Escreva aqui sua análise ou opinião técnica sobre este protocolo..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none" 
                  />
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-amber-700 transition-all">Registrar Parecer</button>
              </form>
            </Modal>
          )}

          {showDispatchModal && (
            <Modal onClose={() => setShowDispatchModal(false)} title="Finalizar com Despacho">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-6">
                <p className="text-xs text-emerald-800 leading-relaxed">
                  <strong>Atenção:</strong> O despacho final conclui o processo deste protocolo e gera automaticamente a Comunicação de Despacho em PDF.
                </p>
              </div>
              <form onSubmit={handleSaveDispatch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Texto do Despacho</label>
                  <textarea 
                    required 
                    rows={5}
                    value={newDispatch} 
                    onChange={e => setNewDispatch(e.target.value)} 
                    placeholder="Escreva a decisão final ou despacho para este protocolo..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none" 
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-emerald-700 transition-all">Finalizar e Gerar PDF</button>
              </form>
            </Modal>
          )}

          {showCompanyModal && (
            <Modal onClose={() => setShowCompanyModal(false)} title="Nova Empresa">
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                  <input type="text" required value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Código (para Protocolo)</label>
                  <input type="text" required value={newCompany.code} onChange={e => setNewCompany({...newCompany, code: e.target.value})} placeholder="Ex: ABC, MAX, CORP" className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                  <input type="email" required value={newCompany.email} onChange={e => setNewCompany({...newCompany, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Telefone</label>
                  <input type="text" required value={newCompany.phone} onChange={e => setNewCompany({...newCompany, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Endereço</label>
                  <input type="text" required value={newCompany.address} onChange={e => setNewCompany({...newCompany, address: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4">Salvar Empresa</button>
              </form>
            </Modal>
          )}

          {showEmployeeModal && (
            <Modal onClose={() => setShowEmployeeModal(false)} title="Novo Funcionário">
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                  <input type="text" required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                  <input type="email" required value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Empresa</label>
                  <select required value={newEmployee.companyId} onChange={e => setNewEmployee({...newEmployee, companyId: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none">
                    <option value="">Selecione uma empresa</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Departamento</label>
                  <select required value={newEmployee.departmentId} onChange={e => setNewEmployee({...newEmployee, departmentId: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none">
                    <option value="">Selecione um departamento</option>
                    {departments.filter(d => d.companyId === newEmployee.companyId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4">Salvar Funcionário</button>
              </form>
            </Modal>
          )}

          {showDepartmentModal && (
            <Modal onClose={() => setShowDepartmentModal(false)} title="Novo Departamento">
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                  <input type="text" required value={newDepartment.name} onChange={e => setNewDepartment({...newDepartment, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Código (para Protocolo)</label>
                  <input type="text" required value={newDepartment.code} onChange={e => setNewDepartment({...newDepartment, code: e.target.value})} placeholder="Ex: FIN, RH, TI" className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Empresa</label>
                  <select required value={newDepartment.companyId} onChange={e => setNewDepartment({...newDepartment, companyId: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 outline-none">
                    <option value="">Selecione uma empresa</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4">Salvar Departamento</button>
              </form>
            </Modal>
          )}

          {showEditModal && editingItem && (
            <Modal onClose={() => setShowEditModal(false)} title={`Editar ${editType === 'protocol' ? 'Protocolo' : editType === 'company' ? 'Empresa' : editType === 'employee' ? 'Funcionário' : editType === 'department' ? 'Departamento' : editType === 'classification' ? 'Classificação' : editType === 'documentType' ? 'Tipo de Documento' : 'Item'}`}>
              <form onSubmit={handleUpdateItem} className="space-y-4">
                {editType === 'protocol' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Título</label>
                      <input type="text" required value={(editingItem as Protocol).title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Descrição</label>
                      <textarea rows={3} value={(editingItem as Protocol).description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none resize-none" />
                    </div>
                  </>
                )}
                {editType === 'company' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input type="text" required value={(editingItem as Company).name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Código</label>
                      <input type="text" required value={(editingItem as Company).code} onChange={e => setEditingItem({...editingItem, code: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                      <input type="email" required value={(editingItem as Company).email} onChange={e => setEditingItem({...editingItem, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Telefone</label>
                      <input type="text" required value={(editingItem as Company).phone} onChange={e => setEditingItem({...editingItem, phone: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Endereço</label>
                      <input type="text" required value={(editingItem as Company).address} onChange={e => setEditingItem({...editingItem, address: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                  </>
                )}
                {editType === 'employee' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input type="text" required value={(editingItem as Employee).name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                      <input type="email" required value={(editingItem as Employee).email} onChange={e => setEditingItem({...editingItem, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                  </>
                )}
                {editType === 'department' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input type="text" required value={(editingItem as Department).name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                  </>
                )}
                {editType === 'classification' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input type="text" required value={(editingItem as ProtocolClassification).name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Código</label>
                      <input type="text" required value={(editingItem as ProtocolClassification).code} onChange={e => setEditingItem({...editingItem, code: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                  </>
                )}
                {editType === 'documentType' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input type="text" required value={(editingItem as ProtocolDocumentType).name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                  </>
                )}
                {editType === 'item' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nome</label>
                      <input type="text" required value={(editingItem as ProtocolItem).name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Quantidade</label>
                      <input type="number" required value={(editingItem as ProtocolItem).quantity} onChange={e => setEditingItem({...editingItem, quantity: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                    </div>
                  </>
                )}
                <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4">Salvar Alterações</button>
              </form>
            </Modal>
          )}

          {showClassificationModal && (
            <Modal onClose={() => setShowClassificationModal(false)} title="Nova Classificação">
              <form onSubmit={handleCreateClassification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nome da Classificação</label>
                  <input type="text" required value={newClassification.name} onChange={e => setNewClassification({...newClassification, name: e.target.value})} placeholder="Ex: Documentos Fiscais" className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Código (para Protocolo)</label>
                  <input type="text" required value={newClassification.code} onChange={e => setNewClassification({...newClassification, code: e.target.value})} placeholder="Ex: 100, 200, FISC" className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4">Salvar Classificação</button>
              </form>
            </Modal>
          )}

          {showDocTypeModal && (
            <Modal onClose={() => setShowDocTypeModal(false)} title="Novo Tipo de Documento">
              <form onSubmit={handleCreateDocType} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Nome do Tipo</label>
                  <input type="text" required value={newDocType.name} onChange={e => setNewDocType({...newDocType, name: e.target.value})} placeholder="Ex: Nota Fiscal, Ofício, Contrato" className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none" />
                </div>
                <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4">Salvar Tipo</button>
              </form>
            </Modal>
          )}

          {showItemModal && (
            <Modal onClose={() => setShowItemModal(false)} title="Incluir Item" maxWidth="max-w-lg">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Descrição</label>
                  <input 
                    type="text"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none"
                    placeholder="Ex: Contrato de Prestação de Serviços"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Referência</label>
                    <input 
                      type="text"
                      value={newItem.ref}
                      onChange={e => setNewItem({...newItem, ref: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none"
                      placeholder="Ex: REF-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Vencimento</label>
                    <input 
                      type="date"
                      value={newItem.dueDate}
                      onChange={e => setNewItem({...newItem, dueDate: e.target.value})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Quantidade</label>
                    <input 
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Valor Unitário</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={newItem.value}
                      onChange={e => setNewItem({...newItem, value: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Total</label>
                    <div className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 font-bold">
                      {(newItem.quantity * (newItem.value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Data de Retorno</label>
                  <input 
                    type="date"
                    value={newItem.returnDate}
                    onChange={e => setNewItem({...newItem, returnDate: e.target.value})}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none"
                  />
                </div>
                <button 
                  onClick={view === 'create' ? handleAddItemToNewProtocol : handleAddItemToExistingProtocol}
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-stone-800 transition-all"
                >
                  {view === 'create' ? 'Adicionar Item' : 'Salvar Item no Protocolo'}
                </button>
              </div>
            </Modal>
          )}

          <ConfirmModal 
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            confirmText={confirmModal.confirmText}
            isDanger={confirmModal.isDanger}
          />
        </AnimatePresence>

      </div>
    </ErrorBoundary>
  );
}

const HistoryList = ({ protocolId }: { protocolId: string }) => {
  const [history, setHistory] = useState<ProtocolHistory[]>([]);

  useEffect(() => {
    const unsubscribe = ProtocolService.subscribeToProtocolHistory(protocolId, setHistory);
    return () => unsubscribe();
  }, [protocolId]);

  return (
    <>
      {history.map((item, i) => (
        <div key={item.id} className="relative pl-8">
          <div className="absolute left-0 top-1 w-8 h-8 bg-white border-2 border-stone-200 rounded-full flex items-center justify-center z-10">
            <div className="w-2 h-2 bg-stone-900 rounded-full" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-900">{item.action}</p>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{item.description}</p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-400 font-medium">
              <span>{item.performedByName || 'Sistema'}</span>
              <span>•</span>
              <span>{item.timestamp ? (isToday(item.timestamp.toDate()) ? format(item.timestamp.toDate(), 'HH:mm', { locale: ptBR }) : format(item.timestamp.toDate(), 'dd/MM HH:mm', { locale: ptBR })) : '...'}</span>
            </div>
          </div>
        </div>
      ))}
      {history.length === 0 && <p className="text-center text-stone-400 text-sm py-4">Nenhum histórico disponível.</p>}
    </>
  );
}

const ProtocolItemsList = ({ protocolId, onEdit, onDelete }: { protocolId: string, onEdit?: (item: ProtocolItem) => void, onDelete?: (protocolId: string, itemId: string) => void }) => {
  const [items, setItems] = useState<ProtocolItem[]>([]);

  useEffect(() => {
    const unsubscribe = ProtocolService.subscribeToProtocolItems(protocolId, setItems);
    return () => unsubscribe();
  }, [protocolId]);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-100 shadow-sm group relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">
              {item.quantity}x
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{item.name}</p>
              {item.description && <p className="text-[10px] text-stone-500">{item.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {onEdit && (
                <button 
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={() => onDelete(protocolId, item.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {item.returned ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : (
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
            )}
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-stone-400 text-xs py-2">Nenhum item adicionado.</p>}
    </div>
  );
}

