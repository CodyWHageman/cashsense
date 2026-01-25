import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ImportTemplate, CreateImportTemplateDTO, UpdateImportTemplateDTO } from '../models/ImportTemplate';

const mapTemplate = (doc: any): ImportTemplate => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    amountKey: data.amountKey,
    transactionDateKey: data.transactionDateKey,
    descriptionKey: data.descriptionKey,
    fileType: data.fileType,
    userId: data.userId,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date()
  };
};

export async function getImportTemplates(userId: string): Promise<ImportTemplate[]> {
  const q = query(collection(db, 'import_templates'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(mapTemplate);
}

export async function createImportTemplate(template: CreateImportTemplateDTO): Promise<ImportTemplate> {
  const ref = await addDoc(collection(db, 'import_templates'), {
    ...template,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return { id: ref.id, ...template } as any;
}

export async function updateImportTemplate(id: string, template: UpdateImportTemplateDTO): Promise<ImportTemplate> {
  await updateDoc(doc(db, 'import_templates', id), {
    ...template,
    updatedAt: new Date()
  });
  return { id, ...template } as any;
}

export async function deleteImportTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, 'import_templates', id));
}