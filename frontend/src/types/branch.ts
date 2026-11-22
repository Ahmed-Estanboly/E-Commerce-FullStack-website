export interface Branch {
  _id: string;
  name: string;
  address: string;
  city?: string
  description?: string
  phone: string;
  ownerEmail?: string;
  workingHours: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  address: string;
  city?: string
  description?: string
  phone: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerName?: string;
  workingHours?: string;
}

export interface BranchInventoryItem {
  productId: number;
  productName: string;
  categoryId: number;
  price: number;
  images: string[];
  quantity: number;
  isAssigned: boolean;
}
