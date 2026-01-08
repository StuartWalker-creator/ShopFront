
export interface Product {
    id: string;
    title: string;
    price: number;
    discountedPrice?: number | null;
    description: string;
    isFeatured: boolean;
    imageUrls: string[];
    status: 'draft' | 'published' | 'archived';
    category?: string;
    keywords?: string[];
}
