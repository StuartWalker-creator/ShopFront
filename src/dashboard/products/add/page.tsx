
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { useBusinessId } from '@/hooks/use-business-id';
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
import { Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image";
import { Skeleton } from '@/components/ui/skeleton';
import { v4 as uuidv4 } from 'uuid';

export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { businessId, isLoading: isBusinessIdLoading } = useBusinessId();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("draft");
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = isBusinessIdLoading || isSaving;

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
            variant: "destructive",
            title: "Image too large",
            description: "Please upload an image smaller than 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleSave = async () => {
    if (!productName || !price || !status) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields (Name, Price, Status).",
      });
      return;
    }
    
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to save a product.",
        });
        return;
    }
    
    if (!businessId) {
        toast({
            variant: "destructive",
            title: "Business Not Found",
            description: "Could not find a business associated with your account.",
        });
        return;
    }

    setIsSaving(true);
    
    const productId = uuidv4();
    const productRef = doc(firestore, 'businesses', businessId, 'products', productId);

    const newProduct = {
        id: productId,
        title: productName,
        description,
        price: parseFloat(price),
        status,
        imageUrl: image,
        totalSales: 0,
        createdAt: new Date().toISOString(),
        businessId: businessId, // Add businessId to the product
        ownerId: user.uid, // Add ownerId for security rules
    };

    try {
        await setDoc(productRef, newProduct);

        toast({
            title: "Product Saved",
            description: `"${productName}" has been successfully saved.`,
        });
        router.push('/dashboard/products');

    } catch (error: any) {
        console.error("Error saving product:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: error.message || "Could not save product. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    router.push('/dashboard/products');
  }

  const removeImage = () => {
    setImage(null);
  }

  if (isBusinessIdLoading) {
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

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Add New Product
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isLoading}>
                        Discard
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                        {isSaving ? 'Saving...' : 'Save Product'}
                    </Button>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>
                                Fill in the details of your new product.
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
                                        placeholder="e.g. Stylish T-Shirt"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="A brief description of the product."
                                        className="min-h-32"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="price">Price</Label>
                                    <Input 
                                      id="price" 
                                      type="number" 
                                      placeholder="100.00"
                                      value={price}
                                      onChange={(e) => setPrice(e.target.value)}
                                      disabled={isLoading}
                                    />
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
                                <Select onValueChange={setStatus} value={status} disabled={isLoading}>
                                  <SelectTrigger id="status" aria-label="Select status">
                                      <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="draft">Draft</SelectItem>
                                      <SelectItem value="published">Active</SelectItem>
                                      <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle>Product Images</CardTitle>
                            <CardDescription>
                                Add an image for your product.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                {image ? (
                                    <div className="relative">
                                        <Image
                                          alt="Product image"
                                          className="aspect-square w-full rounded-md object-cover"
                                          height="300"
                                          src={image}
                                          width="300"
                                        />
                                        <Button 
                                          variant="destructive" 
                                          size="icon" 
                                          className="absolute top-2 right-2 h-6 w-6"
                                          onClick={removeImage}
                                          disabled={isLoading}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                  <div className="grid w-full max-w-sm items-center gap-1.5">
                                      <Label htmlFor="picture">Picture</Label>
                                      <div className="flex items-center justify-center w-full">
                                          <Label 
                                            htmlFor="picture-upload" 
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/90 ${isDragging ? 'border-primary bg-primary-foreground' : ''} ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                          >
                                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                  <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 2MB)</p>
                                              </div>
                                              <Input 
                                                id="picture-upload" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/png, image/jpeg, image/gif"
                                                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                                                disabled={isLoading}
                                              />
                                          </Label>
                                      </div>
                                  </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 md:hidden">
                <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isLoading}>
                    Discard
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isLoading}>
                    {isSaving ? 'Saving...' : 'Save Product'}
                </Button>
            </div>
        </div>
    </div>
  )
}
