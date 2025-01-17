export interface ImportTemplate {
  id: string;
  name: string;
  amountKey: string;
  transactionDateKey: string;
  descriptionKey: string;
  fileType: 'CSV' | 'JSON';
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateImportTemplateDTO {
  name: string;
  amountKey: string;
  transactionDateKey: string;
  descriptionKey: string;
  fileType: 'CSV' | 'JSON';
  userId: string;
}

export interface UpdateImportTemplateDTO {
  name?: string;
  amountKey?: string;
  transactionDateKey?: string;
  descriptionKey?: string;
  fileType?: 'CSV' | 'JSON';
} 