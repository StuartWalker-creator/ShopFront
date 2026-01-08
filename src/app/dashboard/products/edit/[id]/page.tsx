
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useBusiness } from '@/context/business-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Upload, X, BrainCircuit, ChevronDown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image";
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getSuggestedCategories } from '@/ai/flows/category-suggester';
import { generateDescription } from '@/ai/flows/description-generator';
import { generateKeywords } from '@/ai/flows/keyword-generator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import { UpgradeDialog } from '@/components/dashboard/upgrade-dialog';


interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    discountedPrice?: number | null;
    category: string;
    status: 'draft' | 'published' | 'archived';
    isFeatured: boolean;
    imageUrls: string[];
    businessId: string;
    ownerId: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { business, plan, isBusinessLoading } = useBusiness();
  const businessId = business?.id;
  const productId = params.id as string;
  
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  const productRef = useMemoFirebase(() => {
    if (!firestore || !businessId || !productId) return null;
    return doc(firestore, 'businesses', businessId, 'products', productId);
  }, [firestore, businessId, productId]);

  const { data: product, isLoading: isProductLoading, error: productError } = useDoc<Product>(productRef);
  
  const categoriesRef = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return collection(firestore, 'businesses', businessId, 'categories');
  }, [firestore, businessId]);
  
  const { data: categories, isLoading: areCategoriesLoading } = useCollection<{id: string, name: string}>(categoriesRef);


  useEffect(() => {
    if (product) {
      setProductName(product.title);
      setDescription(product.description);
      setPrice(product.price.toString());
      setDiscountedPrice(product.discountedPrice?.toString() || "");
      setCategory(product.category || "");
      setStatus(product.status);
      setIsFeatured(product.isFeatured);
      setImages(product.imageUrls || []);
    }
  }, [product]);

  const isLoading = isBusinessLoading || isProductLoading || isSaving || areCategoriesLoading;
  
  const canGenerateDescription = plan ? PLAN_LIMITS[plan.id as keyof typeof PLAN_LIMITS].ai.description : false;

  const checkPlanAndExecute = (isAllowed: boolean, action: () => void) => {
    if (isAllowed) {
        action();
    } else {
        setIsUpgradeDialogOpen(true);
    }
  };

  const handleSuggestCategories = useCallback(async () => {
    if (!productName && !description) {
        toast({ variant: 'destructive', title: 'Cannot suggest categories', description: 'Please enter a product name or description first.' });
        return;
    }
    setIsSuggesting(true);
    setSuggestions([]);
    try {
        const { categories: suggested } = await getSuggestedCategories({ productName, productDescription: description });
        setSuggestions(suggested);
    } catch (error) {
        console.error("Error suggesting categories:", error);
        toast({ variant: 'destructive', title: 'AI Suggestion Failed', description: 'Could not generate category suggestions.' });
    } finally {
        setIsSuggesting(false);
    }
  }, [productName, description, toast]);

  const handleGenerateDescription = useCallback(async () => {
    if (!productName && images.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Cannot generate description',
            description: 'Please enter a product name or upload an image first.',
        });
        return;
    }
    setIsGeneratingDesc(true);
    try {
        const { description: generatedDesc } = await generateDescription({
            productName: productName,
            imageDataUri: images[0] || undefined,
        });
        setDescription(generatedDesc);
    } catch (error) {
        console.error("Error generating description:", error);
        toast({
            variant: 'destructive',
            title: 'AI Generation Failed',
            description: 'Could not generate a description at this time.',
        });
    } finally {
        setIsGeneratingDesc(false);
    }
}, [productName, images, toast]);


  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      fileArray.forEach(file => {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({
              variant: "destructive",
              title: "Image too large",
              description: `"${file.name}" is larger than 2MB.`,
          });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) handleFileChange(files);
  };
  
  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim() || !categoriesRef) {
        toast({ variant: "destructive", title: "Invalid Category Name"});
        return;
    }
    // Check if category already exists (case-insensitive)
    if (categories?.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Category Exists", description: "This category name is already in use."});
        return;
    }

    const categoryId = uuidv4();
    const categoryRef = doc(categoriesRef, categoryId);
    try {
        await setDoc(categoryRef, { id: categoryId, name: newCategoryName.trim() });
        setCategory(newCategoryName.trim());
        setNewCategoryName("");
        setIsNewCategoryDialogOpen(false);
        toast({ title: "Category Created"});
    } catch (error: any) {
         toast({ variant: "destructive", title: "Error Creating Category", description: error.message });
    }
  };

  const handleSave = async () => {
    if (!productName || !price || !status) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields (Name, Price, Status)." });
      return;
    }
    if (!user || !firestore || !businessId || !productRef) {
        toast({ variant: "destructive", title: "Error", description: "Cannot save product. Please try again." });
        return;
    }

    setIsSaving(true);
    
    try {
        // Generate keywords
        const { keywords } = await generateKeywords({
            productName: productName,
            productDescription: description,
            category: category,
        });

        const updatedProduct = {
            title: productName,
            description,
            price: parseFloat(price),
            discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
            category,
            status,
            isFeatured,
            imageUrls: images,
            keywords: keywords || [],
        };

        await setDoc(productRef, updatedProduct, { merge: true });
        toast({ title: "Product Updated", description: `"${productName}" has been successfully updated.` });
        router.push('/dashboard/products');

    } catch (error: any) {
        console.error("Error updating product:", error);
        toast({ variant: "destructive", title: "Uh oh! Something went wrong.", description: error.message || "Could not update product. Please try again." });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDiscard = () => router.push('/dashboard/products');
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };


  if (isLoading || !product) {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto grid w-full max-w-[59rem] flex-1 auto-rows-max gap-4">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                    <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    </div>
                    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (productError) {
      return <div className="text-center text-destructive p-8">Error loading product: {productError.message}</div>;
  }

  return (
    <>
    <UpgradeDialog
        isOpen={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
        featureName="AI Product Description Generation"
        requiredPlan="Premium"
    />
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Product
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
                        Discard
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>
                                Update the details of your product.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        className="w-full"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="description">Description</Label>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => checkPlanAndExecute(canGenerateDescription, handleGenerateDescription)} 
                                            disabled={isGeneratingDesc || isLoading}
                                        >
                                            <BrainCircuit className={`mr-2 h-4 w-4 ${isGeneratingDesc ? 'animate-pulse' : ''}`} />
                                            {isGeneratingDesc ? 'Generating...' : 'Generate with AI'}
                                        </Button>
                                    </div>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="min-h-32"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Images</CardTitle>
                            <CardDescription>
                                Add or remove images for your product. The first image will be the main one.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                {images.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                        {images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <Image
                                                  alt={`Product image ${index + 1}`}
                                                  className="aspect-square w-full rounded-md object-cover"
                                                  height="150"
                                                  src={image}
                                                  width="150"
                                                />
                                                <Button 
                                                  variant="destructive" 
                                                  size="icon" 
                                                  className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => removeImage(index)}
                                                  disabled={isSaving}
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="picture">Add Pictures</Label>
                                    <div className="flex items-center justify-center w-full">
                                        <Label 
                                            htmlFor="picture" 
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/90 ${isDragging ? 'border-primary bg-primary-foreground' : ''} ${isSaving ? 'cursor-not-allowed opacity-50' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 2MB each)</p>
                                            </div>
                                            <Input 
                                                id="picture" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/png, image/jpeg, image/gif"
                                                onChange={(e) => handleFileChange(e.target.files)}
                                                disabled={isSaving}
                                                multiple
                                            />
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="status">Status</Label>
                                    <Select onValueChange={(value) => setStatus(value as 'draft' | 'published' | 'archived')} value={status} disabled={isSaving}>
                                    <SelectTrigger id="status" aria-label="Select status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-3">
                                    <Label>Featured Product</Label>
                                    <div className='flex items-center space-x-2'>
                                        <Switch 
                                            id="isFeatured" 
                                            checked={isFeatured}
                                            onCheckedChange={setIsFeatured}
                                            disabled={isLoading}
                                        />
                                        <Label htmlFor="isFeatured" className='text-sm text-muted-foreground'>
                                            Show this product on the homepage.
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="price">Price</Label>
                                    <Input 
                                      id="price" 
                                      type="number" 
                                      value={price}
                                      onChange={(e) => setPrice(e.target.value)}
                                      disabled={isSaving}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="discounted-price">Discounted Price (Optional)</Label>
                                    <Input 
                                      id="discounted-price" 
                                      type="number" 
                                      value={discountedPrice}
                                      onChange={(e) => setDiscountedPrice(e.target.value)}
                                      disabled={isSaving}
                                    />
                                </div>
                                 <div className="grid gap-3">
                                    <Label>Category</Label>
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between" disabled={isLoading}>
                                                     <span className="truncate pr-2">{category || "Select a category"}</span>
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                                <DropdownMenuLabel>Existing Categories</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {areCategoriesLoading ? (
                                                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                                                ) : categories && categories.length > 0 ? (
                                                    categories.map(cat => (
                                                        <DropdownMenuItem key={cat.id} onSelect={() => setCategory(cat.name)}>
                                                            {cat.name}
                                                        </DropdownMenuItem>
                                                    ))
                                                ) : (
                                                     <DropdownMenuItem disabled>No categories yet.</DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => setIsNewCategoryDialogOpen(true)}>+ Create New Category</DropdownMenuItem>
                                                {suggestions.length > 0 && <DropdownMenuSeparator />}
                                                {suggestions.length > 0 && <DropdownMenuLabel>AI Suggestions</DropdownMenuLabel>}
                                                {suggestions.map(s => <DropdownMenuItem key={s} onSelect={() => setCategory(s)}>{s}</DropdownMenuItem>)}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button size="icon" variant="ghost" onClick={handleSuggestCategories} disabled={isSuggesting || isLoading}>
                                            <BrainCircuit className={`h-5 w-5 ${isSuggesting ? 'animate-pulse' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 md:hidden">
                <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
                    Discard
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    </div>
     <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Label htmlFor="new-category-name">Category Name</Label>
                <Input
                    id="new-category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Summer Collection"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewCategoryDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNewCategory}>Save Category</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  )
}
