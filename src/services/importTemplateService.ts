import { supabase } from './supabase';
import { ImportTemplate, CreateImportTemplateDTO, UpdateImportTemplateDTO } from '../models/ImportTemplate';

interface ImportTemplateDB {
  id: string;
  name: string;
  amount_key: string;
  transaction_date_key: string;
  description_key: string;
  file_type: 'CSV' | 'JSON';
  user_id: string;
  created_at: string;
  updated_at: string;
}

function mapToImportTemplate(dbTemplate: ImportTemplateDB): ImportTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    amountKey: dbTemplate.amount_key,
    transactionDateKey: dbTemplate.transaction_date_key,
    descriptionKey: dbTemplate.description_key,
    fileType: dbTemplate.file_type,
    userId: dbTemplate.user_id,
    createdAt: new Date(dbTemplate.created_at),
    updatedAt: new Date(dbTemplate.updated_at)
  };
}

function mapToDBTemplate(template: CreateImportTemplateDTO): Omit<ImportTemplateDB, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: template.name,
    amount_key: template.amountKey,
    transaction_date_key: template.transactionDateKey,
    description_key: template.descriptionKey,
    file_type: template.fileType,
    user_id: template.userId
  };
}

function mapUpdateToDBTemplate(template: UpdateImportTemplateDTO): Partial<Omit<ImportTemplateDB, 'id' | 'created_at' | 'updated_at'>> {
  const dbTemplate: Partial<ImportTemplateDB> = {};

  if (template.name !== undefined) dbTemplate.name = template.name;
  if (template.amountKey !== undefined) dbTemplate.amount_key = template.amountKey;
  if (template.transactionDateKey !== undefined) dbTemplate.transaction_date_key = template.transactionDateKey;
  if (template.descriptionKey !== undefined) dbTemplate.description_key = template.descriptionKey;
  if (template.fileType !== undefined) dbTemplate.file_type = template.fileType;

  return dbTemplate;
}

export async function getImportTemplates(userId: string): Promise<ImportTemplate[]> {
  const { data, error } = await supabase
    .from('import_templates')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return (data || []).map(mapToImportTemplate);
}

export async function createImportTemplate(template: CreateImportTemplateDTO): Promise<ImportTemplate> {
  const { data, error } = await supabase
    .from('import_templates')
    .insert([mapToDBTemplate(template)])
    .select()
    .single();

  if (error) throw error;
  return mapToImportTemplate(data);
}

export async function updateImportTemplate(id: string, template: UpdateImportTemplateDTO): Promise<ImportTemplate> {
  const { data, error } = await supabase
    .from('import_templates')
    .update(mapUpdateToDBTemplate(template))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapToImportTemplate(data);
}

export async function deleteImportTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('import_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 