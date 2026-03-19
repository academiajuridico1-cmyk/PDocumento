import { 
  collection, 
  collectionGroup,
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  addDoc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Protocol, ProtocolHistory, ProtocolStatus, UserProfile, Company, Employee, Department, ProtocolItem, ProtocolClassification, ProtocolDocumentType, Notification, ProtocolOpinion, ProtocolDispatch } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const ProtocolService = {
  // Email Helper
  async sendEmail(to: string, subject: string, html: string) {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html })
      });
    } catch (error) {
      console.error('Error calling send-email API:', error);
    }
  },

  // Notifications
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      callback(notifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
  },

  async markNotificationAsRead(id: string) {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  async createUserProfile(user: UserProfile) {
    const path = `users/${user.uid}`;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async signUp(email: string, password: string, displayName: string, companyName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName });
      
      // Create company if it doesn't exist or just associate
      // For now, we'll create a company and a profile
      const companyId = await this.createCompany({
        name: companyName,
        email: email,
        createdAt: serverTimestamp()
      });

      await this.createUserProfile({
        uid: user.uid,
        email: email,
        displayName: displayName,
        role: 'admin',
        companyId: companyId as string
      });

      // Welcome notification
      await this.createNotification({
        userId: user.uid,
        title: 'Bem-vindo ao Pdocumento!',
        message: `Olá ${displayName}, sua conta foi criada com sucesso para a empresa ${companyName}.`,
        type: 'credential'
      });

      // Send Welcome Email
      await this.sendEmail(
        email,
        'Bem-vindo ao Pdocumento!',
        `
        <h1>Bem-vindo ao Pdocumento!</h1>
        <p>Olá ${displayName}, sua conta foi criada com sucesso.</p>
        <p><strong>Suas credenciais:</strong></p>
        <ul>
          <li><strong>E-mail:</strong> ${email}</li>
          <li><strong>Senha:</strong> ${password}</li>
        </ul>
        <p>Você pode acessar a plataforma através do link abaixo:</p>
        <a href="${window.location.origin}?mode=login" style="display: inline-block; padding: 10px 20px; background-color: #0070e0; color: white; text-decoration: none; border-radius: 5px;">Acessar Pdocumento</a>
        <br/><br/>
        <p>Atenciosamente,<br/>Equipe Pdocumento</p>
        `
      );

      return user;
    } catch (error) {
      throw error;
    }
  },

  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profile = await this.getUserProfile(user.uid);
      if (!profile) {
        await this.createUserProfile({
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || '',
          role: 'user'
        });

        // Welcome notification
        await this.createNotification({
          userId: user.uid,
          title: 'Bem-vindo ao Pdocumento!',
          message: `Olá ${user.displayName}, sua conta foi criada com sucesso via Google.`,
          type: 'credential'
        });

        // Send Welcome Email (Google)
        await this.sendEmail(
          user.email!,
          'Bem-vindo ao Pdocumento!',
          `
          <h1>Bem-vindo ao Pdocumento!</h1>
          <p>Olá ${user.displayName}, sua conta foi criada com sucesso através do Google.</p>
          <p>Você pode acessar a plataforma através do link abaixo:</p>
          <a href="${window.location.origin}?mode=login" style="display: inline-block; padding: 10px 20px; background-color: #0070e0; color: white; text-decoration: none; border-radius: 5px;">Acessar Pdocumento</a>
          <br/><br/>
          <p>Atenciosamente,<br/>Equipe Pdocumento</p>
          `
        );
      }
      return user;
    } catch (error) {
      throw error;
    }
  },

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  async createProtocol(protocol: Omit<Protocol, 'id' | 'createdAt' | 'updatedAt' | 'protocolNumber' | 'sequenceNumber'> & { companyId: string }) {
    const path = 'protocols';
    try {
      // Calculate next sequence number for this department and document type within the company
      let nextSequence = 1;
      if (protocol.originDepartmentId && protocol.documentTypeId) {
        const q = query(
          collection(db, 'protocols'),
          where('companyId', '==', protocol.companyId),
          where('originDepartmentId', '==', protocol.originDepartmentId),
          where('documentTypeId', '==', protocol.documentTypeId),
          orderBy('sequenceNumber', 'desc'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const lastProtocol = snapshot.docs[0].data() as Protocol;
          nextSequence = (lastProtocol.sequenceNumber || 0) + 1;
        }
      }

      const docRef = await addDoc(collection(db, 'protocols'), {
        ...protocol,
        sequenceNumber: nextSequence,
        protocolNumber: nextSequence.toString().padStart(4, '0'), // e.g., 0001
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Add initial history
      await this.addHistory({
        protocolId: docRef.id,
        action: 'Protocolo Criado',
        description: `Protocolo "${protocol.title}" foi criado por ${protocol.createdByName || 'usuário'}. Número: ${nextSequence.toString().padStart(4, '0')}`,
        performedBy: protocol.createdBy,
        performedByName: protocol.createdByName,
        timestamp: serverTimestamp()
      });

      // Notify receiver if it's an internal employee
      if (protocol.destinationEmployeeId) {
        await this.createNotification({
          userId: protocol.destinationEmployeeId,
          title: 'Novo Protocolo Recebido',
          message: `Você recebeu um novo protocolo: ${protocol.title}`,
          type: 'protocol',
          link: docRef.id
        });

        // Try to get employee email to send notification
        try {
          const empDoc = await getDoc(doc(db, 'employees', protocol.destinationEmployeeId));
          if (empDoc.exists()) {
            const empData = empDoc.data();
            if (empData.email) {
              const dateStr = new Date().toLocaleString('pt-BR');
              
              let deptName = 'N/A';
              if (protocol.originDepartmentId) {
                const deptDoc = await getDoc(doc(db, 'departments', protocol.originDepartmentId));
                if (deptDoc.exists()) {
                  deptName = deptDoc.data().name;
                }
              }

              await this.sendEmail(
                empData.email,
                'Notificação de Protocolo - Pdocumento',
                `
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Notificação de Protocolo</title>
<style>
  body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0d47a1, #1976d2); color: white; padding: 25px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; }
  .content { padding: 25px; color: #333; }
  .content p { line-height: 1.6; }
  .protocolo-box { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
  .protocolo-box p { margin: 6px 0; }
  .button { display: block; width: fit-content; margin: 25px auto; background: #1976d2; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .highlight { color: #2e7d32; font-weight: bold; }
  .footer { text-align: center; font-size: 12px; color: #888; padding: 15px; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📄 Bem-vindo ao Sistema de Protocolo de Documentos</h1>
  </div>
  <div class="content">
    <p>Olá, <strong>${empData.name}</strong>,</p>
    <p>Informamos que um novo protocolo foi criado no sistema.</p>
    <p class="highlight">📌 Detalhes do Protocolo:</p>
    <div class="protocolo-box">
      <p><strong>Número do Protocolo:</strong> ${nextSequence.toString().padStart(4, '0')}</p>
      <p><strong>Assunto:</strong> ${protocol.title}</p>
      <p><strong>Data de Registo:</strong> ${dateStr}</p>
      <p><strong>Departamento:</strong> ${deptName}</p>
    </div>
    <p>Por favor, acesse o sistema para acompanhar ou dar seguimento ao processo.</p>
    <a href="${window.location.origin}?protocolId=${docRef.id}" class="button">📂 Ver Protocolo</a>
    <p>Este é um aviso automático do sistema.</p>
  </div>
  <div class="footer">
    Protocolo Digital • Sistema de Gestão de Documentos
  </div>
</div>
</body>
</html>
                `
              );
            }
          }
        } catch (e) {
          console.error('Error sending protocol notification email:', e);
        }
      }

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async addOpinion(protocolId: string, opinion: Omit<ProtocolOpinion, 'id' | 'timestamp'>) {
    try {
      const protocolRef = doc(db, 'protocols', protocolId);
      const protocolSnap = await getDoc(protocolRef);
      if (!protocolSnap.exists()) return;

      const protocolData = protocolSnap.data() as Protocol;
      const opinions = protocolData.opinions || [];
      
      const newOpinion = {
        ...opinion,
        id: Math.random().toString(36).substring(7),
        timestamp: Timestamp.now()
      };

      await updateDoc(protocolRef, {
        opinions: [...opinions, newOpinion],
        updatedAt: serverTimestamp()
      });

      await this.addHistory({
        protocolId,
        action: 'Parecer Adicionado',
        description: `Parecer adicionado por ${opinion.authorName}`,
        performedBy: opinion.authorId,
        performedByName: opinion.authorName,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `protocols/${protocolId}/opinions`);
    }
  },

  async addDispatch(protocolId: string, dispatch: Omit<ProtocolDispatch, 'timestamp'>) {
    try {
      const protocolRef = doc(db, 'protocols', protocolId);
      const protocolSnap = await getDoc(protocolRef);
      if (!protocolSnap.exists()) return;

      const protocolData = protocolSnap.data() as Protocol;

      const newDispatch = {
        ...dispatch,
        timestamp: Timestamp.now()
      };

      await updateDoc(protocolRef, {
        dispatch: newDispatch,
        status: 'delivered',
        updatedAt: serverTimestamp()
      });

      await this.addHistory({
        protocolId,
        action: 'Despacho Finalizado',
        description: `Despacho finalizado por ${dispatch.authorName}`,
        performedBy: dispatch.authorId,
        performedByName: dispatch.authorName,
        timestamp: serverTimestamp()
      });

      // Notify creator
      await this.createNotification({
        userId: protocolData.createdBy,
        title: 'Protocolo Concluído (Despacho)',
        message: `O protocolo "${protocolData.title}" foi concluído com um despacho final.`,
        type: 'dispatch',
        link: protocolId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `protocols/${protocolId}/dispatch`);
    }
  },

  async getProtocol(id: string): Promise<Protocol | null> {
    try {
      const docSnap = await getDoc(doc(db, 'protocols', id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Protocol : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `protocols/${id}`);
      return null;
    }
  },

  async updateProtocol(id: string, updates: Partial<Protocol>, performedBy: string, performedByName?: string) {
    const path = `protocols/${id}`;
    try {
      await updateDoc(doc(db, 'protocols', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      let action = 'Protocolo Atualizado';
      let description = 'Campos alterados: ' + Object.keys(updates).join(', ');
      
      if (updates.status) {
        action = 'Status Atualizado';
        description = `Status alterado para: ${updates.status}`;
      }

      await this.addHistory({
        protocolId: id,
        action,
        description,
        performedBy,
        performedByName,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteProtocol(id: string) {
    try {
      await deleteDoc(doc(db, 'protocols', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `protocols/${id}`);
    }
  },

  async addHistory(history: Omit<ProtocolHistory, 'id'>) {
    const path = `protocols/${history.protocolId}/history`;
    try {
      await addDoc(collection(db, 'protocols', history.protocolId, 'history'), {
        ...history,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  subscribeToProtocols(companyId: string, callback: (protocols: Protocol[]) => void) {
    const q = query(
      collection(db, 'protocols'), 
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const protocols = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Protocol[];
      callback(protocols);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'protocols');
    });
  },

  subscribeToProtocolHistory(protocolId: string, callback: (history: ProtocolHistory[]) => void) {
    const q = query(collection(db, 'protocols', protocolId, 'history'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProtocolHistory[];
      callback(history);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `protocols/${protocolId}/history`);
    });
  },

  // Companies
  async createCompany(company: Omit<Company, 'id' | 'createdAt'> & { ownerCompanyId?: string }) {
    try {
      const docRef = await addDoc(collection(db, 'companies'), {
        ...company,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'companies');
    }
  },

  async updateCompany(id: string, updates: Partial<Company>) {
    try {
      await updateDoc(doc(db, 'companies', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `companies/${id}`);
    }
  },

  async deleteCompany(id: string) {
    try {
      await deleteDoc(doc(db, 'companies', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `companies/${id}`);
    }
  },

  subscribeToCompanies(companyId: string, callback: (companies: Company[]) => void) {
    // For now, we'll show all companies but we could filter by ownerId if we wanted to scope "other companies" added by this user
    // However, the user wants "limpa sem conteúdo", so we should probably filter by ownerId or similar
    // Let's add a 'companyId' field to companies too, representing the company that added this "other company"
    const q = query(collection(db, 'companies'), where('ownerCompanyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Company[];
      callback(companies);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'companies');
    });
  },

  // Employees
  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt'> & { companyId: string }) {
    try {
      const docRef = await addDoc(collection(db, 'employees'), {
        ...employee,
        createdAt: serverTimestamp()
      });

      // Simulate sending credentials via notification
      await this.createNotification({
        userId: docRef.id,
        title: 'Suas Credenciais de Acesso',
        message: `Bem-vindo! Seu acesso ao Pdocumento foi criado. Email: ${employee.email}. Senha temporária: Pdoc@2026`,
        type: 'credential'
      });

      // Send Credentials Email
      if (employee.email) {
        await this.sendEmail(
          employee.email,
          'Bem-vindo ao Pdocumento - Suas Credenciais',
          `
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bem-vindo</title>
<style>
  body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0d47a1, #1976d2); color: white; padding: 25px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; }
  .content { padding: 25px; color: #333; }
  .content p { line-height: 1.6; }
  .box { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
  .box p { margin: 5px 0; }
  .button { display: block; width: fit-content; margin: 25px auto; background: #1976d2; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { text-align: center; font-size: 12px; color: #888; padding: 15px; border-top: 1px solid #eee; }
  .alert { color: #d32f2f; font-weight: bold; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📄 Bem-vindo ao Sistema de Protocolo de Documentos</h1>
  </div>
  <div class="content">
    <p>Olá, <strong>${employee.name}</strong>,</p>
    <p>A sua conta foi criada com sucesso. Agora você já pode acessar o sistema e começar a utilizar os serviços disponíveis.</p>
    <div class="box">
      <p><strong>Email:</strong> ${employee.email}</p>
      <p><strong>Senha Temporária:</strong> Pdoc@2026</p>
    </div>
    <a href="${window.location.origin}?mode=login" class="button">🔐 Acessar o Sistema</a>
    <p class="alert">⚠️ Por segurança, altere sua senha no primeiro acesso.</p>
    <p>Se tiver dificuldades, entre em contacto com o administrador do sistema.</p>
    <p>Seja bem-vindo(a) e bom trabalho!</p>
  </div>
  <div class="footer">
    Protocolo Digital • Sistema de Gestão de Documentos
  </div>
</div>
</body>
</html>
          `
        );
      }

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'employees');
    }
  },

  async updateEmployee(id: string, updates: Partial<Employee>) {
    try {
      await updateDoc(doc(db, 'employees', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `employees/${id}`);
    }
  },

  async deleteEmployee(id: string) {
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
    }
  },

  subscribeToEmployees(companyId: string, callback: (employees: Employee[]) => void) {
    const q = query(collection(db, 'employees'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
      callback(employees);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'employees');
    });
  },

  // Departments
  async createDepartment(department: Omit<Department, 'id' | 'createdAt'> & { companyId: string }) {
    try {
      await addDoc(collection(db, 'departments'), {
        ...department,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'departments');
    }
  },

  async updateDepartment(id: string, updates: Partial<Department>) {
    try {
      await updateDoc(doc(db, 'departments', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `departments/${id}`);
    }
  },

  async deleteDepartment(id: string) {
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `departments/${id}`);
    }
  },

  subscribeToDepartments(companyId: string, callback: (departments: Department[]) => void) {
    const q = query(collection(db, 'departments'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const departments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Department[];
      callback(departments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'departments');
    });
  },

  // Protocol Items
  async addProtocolItem(item: Omit<ProtocolItem, 'id'> & { companyId: string }) {
    try {
      const docRef = await addDoc(collection(db, 'protocols', item.protocolId, 'items'), {
        ...item,
        returned: false
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `protocols/${item.protocolId}/items`);
    }
  },

  async updateProtocolItem(protocolId: string, itemId: string, updates: Partial<ProtocolItem>) {
    try {
      await updateDoc(doc(db, 'protocols', protocolId, 'items', itemId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `protocols/${protocolId}/items/${itemId}`);
    }
  },

  async deleteProtocolItem(protocolId: string, itemId: string) {
    try {
      await deleteDoc(doc(db, 'protocols', protocolId, 'items', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `protocols/${protocolId}/items/${itemId}`);
    }
  },

  async getProtocolItems(protocolId: string): Promise<ProtocolItem[]> {
    const path = `protocols/${protocolId}/items`;
    try {
      const q = query(collection(db, 'protocols', protocolId, 'items'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProtocolItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToProtocolItems(protocolId: string, callback: (items: ProtocolItem[]) => void) {
    return onSnapshot(collection(db, 'protocols', protocolId, 'items'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProtocolItem[];
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `protocols/${protocolId}/items`);
    });
  },

  // Document Classifications
  async createClassification(classification: Omit<ProtocolClassification, 'id' | 'createdAt'> & { companyId: string }) {
    try {
      await addDoc(collection(db, 'classifications'), {
        ...classification,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'classifications');
    }
  },

  async updateClassification(id: string, updates: Partial<ProtocolClassification>) {
    try {
      await updateDoc(doc(db, 'classifications', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `classifications/${id}`);
    }
  },

  async deleteClassification(id: string) {
    try {
      await deleteDoc(doc(db, 'classifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classifications/${id}`);
    }
  },

  subscribeToClassifications(companyId: string, callback: (classifications: ProtocolClassification[]) => void) {
    const q = query(collection(db, 'classifications'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const classifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProtocolClassification[];
      callback(classifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classifications');
    });
  },

  // Document Types
  async createDocumentType(docType: Omit<ProtocolDocumentType, 'id' | 'createdAt'> & { companyId: string }) {
    try {
      await addDoc(collection(db, 'documentTypes'), {
        ...docType,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'documentTypes');
    }
  },

  async updateDocumentType(id: string, updates: Partial<ProtocolDocumentType>) {
    try {
      await updateDoc(doc(db, 'documentTypes', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `documentTypes/${id}`);
    }
  },

  async deleteDocumentType(id: string) {
    try {
      await deleteDoc(doc(db, 'documentTypes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `documentTypes/${id}`);
    }
  },

  subscribeToDocumentTypes(companyId: string, callback: (docTypes: ProtocolDocumentType[]) => void) {
    const q = query(collection(db, 'documentTypes'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const docTypes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProtocolDocumentType[];
      callback(docTypes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documentTypes');
    });
  },

  subscribeToAllItems(companyId: string, callback: (items: ProtocolItem[]) => void) {
    const q = query(collectionGroup(db, 'items'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProtocolItem[];
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'items_group');
    });
  }
};
