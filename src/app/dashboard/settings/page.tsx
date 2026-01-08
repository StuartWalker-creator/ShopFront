

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBusiness } from '@/context/business-context';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, BrainCircuit, Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image";
import { Skeleton } from '@/components/ui/skeleton';
import { generateTheme, type ThemeGeneratorOutput } from '@/ai/flows/theme-generator';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateHeroImage } from '@/ai/flows/hero-image-generator';
import { Switch } from '@/components/ui/switch';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import type { Business, FulfillmentSettings, FontPair } from '@/context/business-context';
import { UpgradeDialog } from '@/components/dashboard/upgrade-dialog';
import { ChevronDown } from 'lucide-react';


const defaultFulfillmentSettings: FulfillmentSettings = {
    delivery: { enabled: false, feePerMile: 0 },
    pickup: { enabled: false, address: "" },
    payment: { payOnline: { enabled: false }, payOnDelivery: { enabled: false } },
};

const headlineFonts = [
    "Poppins", "Montserrat", "Playfair Display", "Roboto Slab", "Oswald", 
    "Lato", "Raleway", "Merriweather", "Noto Sans", "PT Serif", 
    "Ubuntu", "Lobster", "Pacifico", "Anton", "Bebas Neue", 
    "Abril Fatface", "Cormorant Garamond", "Dancing Script", "Caveat", "Kalam",
    "Archivo Black", "Teko"
];

const bodyFonts = [
    "Inter", "Roboto", "Lato", "Open Sans", "Source Sans Pro", "Merriweather",
    "Noto Sans", "PT Sans", "Karla", "Arimo", "Nunito", "Work Sans",
    "Libre Franklin", "Fira Sans", "Quattrocento Sans", "Rubik", "Spectral",
    "Crimson Text", "Gentium Book Basic", "Domine", "Cormorant Garamond",
    "Jost", "EB Garamond", "Cabin", "Quicksand"
];

const allFonts = [...new Set([...headlineFonts, ...bodyFonts])];


export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { business, plan, isBusinessLoading } = useBusiness();
    
    // Business Branding State
    const [businessName, setBusinessName] = useState("");
    const [tagline, setTagline] = useState("");
    const [description, setDescription] = useState("");
    const [logo, setLogo] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Theming State
    const [themeDescription, setThemeDescription] = useState("");
    const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
    const [generatedTheme, setGeneratedTheme] = useState<ThemeGeneratorOutput | null>(null);
    const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false);

    // Layout and Fonts State
    const [selectedLayout, setSelectedLayout] = useState<string>("");
    const [headlineFont, setHeadlineFont] = useState<string>("");
    const [bodyFont, setBodyFont] = useState<string>("");

    // Hero Image State
    const [showHeroSection, setShowHeroSection] = useState(true);
    const [heroImageDescription, setHeroImageDescription] = useState("");
    const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
    const [isGeneratingHero, setIsGeneratingHero] = useState(false);
    const [isDraggingHero, setIsDraggingHero] = useState(false);
    
    // Custom Domain State
    const [customDomain, setCustomDomain] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");

    // Fulfillment State
    const [fulfillment, setFulfillment] = useState<FulfillmentSettings>(defaultFulfillmentSettings);
    const [flutterwavePublicKey, setFlutterwavePublicKey] = useState("");

    // Upgrade Dialog State
    const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
    const [upgradeFeature, setUpgradeFeature] = useState({ name: '', plan: '' });


    const businessRef = useMemoFirebase(() => {
        if (!business || !firestore) return null;
        return doc(firestore, 'businesses', business.id);
    }, [business, firestore]);

    // Effect to load fonts for dropdown previews
    useEffect(() => {
        const fontStyleId = 'dynamic-preview-fonts';
        if (document.getElementById(fontStyleId)) return;

        const fontFamilies = allFonts.map(font => `family=${font.replace(/ /g, '+')}`).join('&');
        const link = document.createElement('link');
        link.id = fontStyleId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;
        document.head.appendChild(link);
    }, []);

    useEffect(() => {
        if (business) {
            setBusinessName(business.name);
            setTagline(business.tagline || "");
            setDescription(business.description);
            setLogo(business.logoUrl);
            setCustomDomain(business.customDomain || "");
            setBusinessAddress(business.businessAddress || "");
            if (business.theme && Object.keys(business.theme).length > 0) {
                setGeneratedTheme(business.theme as ThemeGeneratorOutput);
                setIsThemeEditorOpen(true);
            }
            setSelectedLayout(business.layout || "Grid");
            setHeadlineFont(business.fontPair?.headlineFont || "Poppins");
            setBodyFont(business.fontPair?.bodyFont || "Inter");
            
            setShowHeroSection(business.showHeroSection ?? true);
            setHeroImageUrl(business.heroImageUrl || null);
            if (business.fulfillment) {
                // Ensure the fee property is compatible
                const newFulfillment = { ...business.fulfillment };
                if (newFulfillment.delivery && (newFulfillment.delivery as any).fee) {
                    newFulfillment.delivery.feePerMile = (newFulfillment.delivery as any).fee;
                    delete (newFulfillment.delivery as any).fee;
                }
                setFulfillment(newFulfillment);
            }
            if (business.flutterwavePublicKey) {
                setFlutterwavePublicKey(business.flutterwavePublicKey);
            }
        }
    }, [business]);

    const handleFileChange = (file: File | null, setter: (value: string | null) => void) => {
        if (file) {
          if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: "destructive",
                title: "Image too large",
                description: "Please upload an image smaller than 2MB.",
            });
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            setter(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>, setter: (isDragging: boolean) => void) => { e.preventDefault(); setter(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>, setter: (isDragging: boolean) => void) => { e.preventDefault(); setter(false); };
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>, fileSetter: (value: string | null) => void, dragSetter: (isDragging: boolean) => void) => {
        e.preventDefault();
        dragSetter(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileChange(file, fileSetter);
    };
    
    const checkPlanAndExecute = (featureName: string, requiredPlan: string, isAllowed: boolean, action: () => void) => {
        if (isAllowed) {
            action();
        } else {
            setUpgradeFeature({ name: featureName, plan: requiredPlan });
            setIsUpgradeDialogOpen(true);
        }
    };

    const handleGenerateTheme = async () => {
        if (!themeDescription) {
            toast({ variant: 'destructive', title: 'Please provide a description for your theme.' });
            return;
        }
        setIsGeneratingTheme(true);
        try {
            const theme = await generateTheme({ description: themeDescription });
            setGeneratedTheme(theme);
            setIsThemeEditorOpen(true);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Theme Generation Failed', description: error.message || 'Could not generate theme.' });
        } finally {
            setIsGeneratingTheme(false);
        }
    };

    const handleGenerateHeroImage = async () => {
        if (!heroImageDescription) {
            toast({ variant: 'destructive', title: 'Please provide a description for the hero image.' });
            return;
        }
        setIsGeneratingHero(true);
        try {
            const result = await generateHeroImage({ description: heroImageDescription });
            setHeroImageUrl(result.imageUrl);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hero Image Generation Failed', description: error.message || 'Could not generate image.' });
        } finally {
            setIsGeneratingHero(false);
        }
    };

    const handleColorChange = (colorName: keyof ThemeGeneratorOutput['dark'], value: string, isDark: boolean) => {
        setGeneratedTheme(prevTheme => {
            if (!prevTheme) return null;
    
            if (isDark && prevTheme.dark) {
                const newDarkTheme = { ...prevTheme.dark, [colorName]: value };
                return { ...prevTheme, dark: newDarkTheme };
            }
    
            if (!isDark && colorName in prevTheme) {
                 const key = colorName as keyof Omit<ThemeGeneratorOutput, 'dark'>;
                 return { ...prevTheme, [key]: value };
            }
    
            return prevTheme;
        });
    };
    
    const handleSaveBranding = async () => {
        if (!businessName || !businessRef) {
            toast({ variant: "destructive", title: "Missing Information", description: "Business name is required." });
            return;
        }
    
        setIsSaving(true);
        try {
            await updateDoc(businessRef, {
                name: businessName,
                tagline,
                description,
                logoUrl: logo,
            });
            toast({ title: "Branding Saved", description: "Your business branding has been updated." });
        } catch (error: any) {
            console.error("Error updating business branding:", error);
            toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save branding settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveHero = async () => {
        if (!businessRef) return;
        setIsSaving(true);
        try {
            await updateDoc(businessRef, {
                showHeroSection,
                heroImageUrl,
            });
            toast({ title: "Hero Settings Saved", description: "Your storefront hero has been updated." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save hero settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDomain = async () => {
        if (!businessRef) return;
        setIsSaving(true);
        try {
            await updateDoc(businessRef, { customDomain });
            toast({ title: "Domain Saved", description: "Your custom domain has been updated." });
        } catch (error: any) {
            console.error("Error updating custom domain:", error);
            toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save domain." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleApplyTheme = async () => {
        if (!generatedTheme || !businessRef) {
            toast({ variant: "destructive", title: "No theme to apply" });
            return;
        }
        setIsSaving(true);
        try {
            await updateDoc(businessRef, { theme: generatedTheme });
            toast({ title: "Theme Applied", description: "Your new store theme is now live." });
        } catch (error: any) {
            console.error("Error applying theme:", error);
            toast({ variant: "destructive", title: "Apply Failed", description: error.message || "Could not apply theme." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveLayoutAndFonts = async () => {
        if (!businessRef) return;
        const fontPair: FontPair = { headlineFont, bodyFont };
        
        setIsSaving(true);
        try {
            await updateDoc(businessRef, {
                layout: selectedLayout,
                fontPair: fontPair,
            });
            toast({ title: "Layout & Fonts Saved", description: "Your storefront has been updated." });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save settings." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveFulfillment = async () => {
        if (!businessRef) return;
        setIsSaving(true);
        try {
            await updateDoc(businessRef, { 
                fulfillment,
                businessAddress,
                flutterwavePublicKey,
            });
            toast({ title: "Fulfillment Settings Saved", description: "Your checkout options have been updated." });
        } catch (error: any) {
             toast({ variant: "destructive", title: "Save Failed", description: error.message || "Could not save fulfillment settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const removeLogo = () => setLogo(null);
    const removeHeroImage = () => setHeroImageUrl(null);

    const handleViewStore = () => {
        if (business) {
            window.open(`/store/${business.id}`, '_blank');
        } else {
            toast({
                variant: "destructive",
                title: "Store Not Ready",
                description: "Save your settings to activate your store's public URL.",
            });
        }
    };
    
    if (isBusinessLoading || !business || !plan) {
        return (
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                     <Skeleton className="h-96 w-full" />
                     <Skeleton className="h-64 w-full" />
                </div>
                 <div className="md:col-span-1 space-y-6">
                     <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }

    const planLimits = PLAN_LIMITS[plan.id as keyof typeof PLAN_LIMITS];
    
    const themeColorKeys = generatedTheme 
    ? Object.keys(generatedTheme).filter(key => key !== 'dark') as (keyof Omit<ThemeGeneratorOutput, 'dark'>)[]
    : [];

    return (
        <div className='grid md:grid-cols-3 gap-6 items-start'>
            <UpgradeDialog 
                isOpen={isUpgradeDialogOpen}
                onOpenChange={setIsUpgradeDialogOpen}
                featureName={upgradeFeature.name}
                requiredPlan={upgradeFeature.plan}
            />

            <div className="md:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Business Branding</CardTitle>
                                <CardDescription>Manage your store settings, branding, and public page.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleViewStore} disabled={!business.id}>View Public Store</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-3">
                            <Label htmlFor="business-name">Business Name</Label>
                            <Input
                                id="business-name"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                disabled={isSaving}
                                placeholder="Your Company Inc."
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="tagline">Tagline</Label>
                            <Input
                                id="tagline"
                                value={tagline}
                                onChange={(e) => setTagline(e.target.value)}
                                disabled={isSaving}
                                placeholder="Quality products you can trust"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-32"
                                disabled={isSaving}
                                placeholder="Tell us a little bit about your business"
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label>Business Logo</Label>
                            {logo ? (
                                <div className="relative w-48 h-48">
                                    <Image
                                    alt="Business Logo"
                                    className="aspect-square w-full rounded-md object-cover"
                                    height="192"
                                    src={logo}
                                    width="192"
                                    />
                                    <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={removeLogo}
                                    disabled={isSaving}
                                    >
                                    <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <div className="flex items-center justify-center w-full">
                                    <Label 
                                        htmlFor="logo-upload" 
                                        className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/90 ${isDragging ? 'border-primary bg-primary-foreground' : ''} ${isSaving ? 'cursor-not-allowed opacity-50' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, setIsDragging)}
                                        onDragLeave={(e) => handleDragLeave(e, setIsDragging)}
                                        onDrop={(e) => handleDrop(e, setLogo, setIsDragging)}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-center text-muted-foreground"><span className="font-semibold">Click to upload</span><br /> or drag & drop</p>
                                            <p className="text-xs text-muted-foreground">PNG or JPG (MAX. 2MB)</p>
                                        </div>
                                        <Input 
                                            id="logo-upload" 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/png, image/jpeg"
                                            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null, setLogo)}
                                            disabled={isSaving}
                                        />
                                    </Label>
                                </div>
                            </div>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveBranding} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isSaving ? 'Saving...' : 'Save Branding'}
                        </Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>AI Store Theming</CardTitle>
                        <CardDescription>Describe your desired store style and let AI generate a unique theme for you.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-3">
                            <Label htmlFor="theme-description">Theme Description</Label>
                            <Textarea
                                id="theme-description"
                                value={themeDescription}
                                onChange={(e) => setThemeDescription(e.target.value)}
                                disabled={isGeneratingTheme || isSaving}
                                placeholder="e.g., A minimalist and modern theme with a focus on typography and neutral colors like beige and gray."
                            />
                        </div>
                        <Button 
                            onClick={() => checkPlanAndExecute('AI Theme Generation', 'Premium', planLimits.ai.theming, handleGenerateTheme)}
                            disabled={isGeneratingTheme || isSaving}
                        >
                            {isGeneratingTheme ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><BrainCircuit className="mr-2 h-4 w-4" /> Generate Theme</>}
                        </Button>

                        {generatedTheme && (
                            <Collapsible open={isThemeEditorOpen} onOpenChange={setIsThemeEditorOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-start p-2 -ml-2">
                                        <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${isThemeEditorOpen ? 'rotate-180' : ''}`} />
                                        <span>{isThemeEditorOpen ? 'Close Generated Theme' : 'View Generated Theme'}</span>
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="space-y-4 rounded-lg border bg-card p-4 mt-2">
                                        <div className="grid grid-cols-3 gap-x-4 items-center font-semibold">
                                            <p>Color</p>
                                            <p>Light Value</p>
                                            <p>Dark Value</p>
                                        </div>
                                        <Separator />
                                        <div className='space-y-4'>
                                        {themeColorKeys.map((key) => {
                                            const lightValue = generatedTheme[key];
                                            const darkValue = generatedTheme.dark?.[key];

                                            return (
                                                <div key={key} className="grid grid-cols-3 gap-x-4 items-center">
                                                    <Label htmlFor={`light-${key}`} className="capitalize text-sm">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <div style={{ backgroundColor: `hsl(${lightValue})` }} className="w-6 h-6 rounded-md border shrink-0" />
                                                        <Input
                                                            id={`light-${key}`}
                                                            value={String(lightValue)}
                                                            onChange={(e) => handleColorChange(key, e.target.value, false)}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>

                                                    {darkValue !== undefined && (
                                                    <div className="flex items-center gap-2">
                                                        <div style={{ backgroundColor: `hsl(${darkValue})` }} className="w-6 h-6 rounded-md border shrink-0" />
                                                        <Input
                                                            id={`dark-${key}`}
                                                            value={String(darkValue)}
                                                            onChange={(e) => handleColorChange(key, e.target.value, true)}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </CardContent>
                    {generatedTheme && (
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleApplyTheme} disabled={isSaving}>
                                {isSaving ? 'Applying...' : 'Apply Theme'}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Storefront Hero</CardTitle>
                        <CardDescription>Customize the hero section on your store's homepage.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Switch id="show-hero" checked={showHeroSection} onCheckedChange={setShowHeroSection} disabled={isSaving} />
                            <Label htmlFor="show-hero">Show Hero Section</Label>
                        </div>

                        {showHeroSection && (
                            <>
                            {heroImageUrl ? (
                                <div className="grid gap-3">
                                    <Label>Hero Image Preview</Label>
                                    <div className="relative aspect-video w-full">
                                        <Image
                                            alt="Generated hero image"
                                            className="rounded-md object-cover"
                                            fill
                                            src={heroImageUrl}
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6"
                                            onClick={removeHeroImage}
                                            disabled={isSaving}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="hero-image-description">Generate with AI</Label>
                                        <Textarea
                                            id="hero-image-description"
                                            value={heroImageDescription}
                                            onChange={(e) => setHeroImageDescription(e.target.value)}
                                            disabled={isGeneratingHero || isSaving}
                                            placeholder="e.g., A minimalist photo of ceramic vases."
                                        />
                                        <Button 
                                            onClick={() => checkPlanAndExecute('AI Hero Image Generation', 'Premium', planLimits.ai.theming, handleGenerateHeroImage)} 
                                            disabled={isGeneratingHero || isSaving} 
                                            className="w-fit"
                                        >
                                            {isGeneratingHero ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><BrainCircuit className="mr-2 h-4 w-4" /> Generate Image</>}
                                        </Button>
                                    </div>
                                    
                                    <div className="relative">
                                        <Separator />
                                        <div className="absolute inset-x-0 -top-2 flex items-center" aria-hidden="true">
                                            <div className="mx-auto bg-card px-2 text-muted-foreground text-sm">OR</div>
                                        </div>
                                    </div>
    
                                    <div className="grid gap-3">
                                        <Label htmlFor="hero-upload">Upload your own</Label>
                                        <Label 
                                            htmlFor="hero-upload" 
                                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/90 ${isDraggingHero ? 'border-primary' : ''} ${isSaving ? 'cursor-not-allowed opacity-50' : ''}`}
                                            onDragOver={(e) => handleDragOver(e, setIsDraggingHero)}
                                            onDragLeave={(e) => handleDragLeave(e, setIsDraggingHero)}
                                            onDrop={(e) => handleDrop(e, setHeroImageUrl, setIsDraggingHero)}
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">PNG or JPG (MAX. 2MB)</p>
                                            </div>
                                            <Input 
                                                id="hero-upload" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/png, image/jpeg"
                                                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null, setHeroImageUrl)}
                                                disabled={isSaving}
                                            />
                                        </Label>
                                    </div>
                                </div>
                            )}
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveHero} disabled={isSaving}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isSaving ? 'Saving...' : 'Save Hero Settings'}
                        </Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Store Layout &amp; Fonts</CardTitle>
                        <CardDescription>Directly select your store's appearance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-3">
                            <Label htmlFor="layout-select">Storefront Layout</Label>
                            <Select onValueChange={setSelectedLayout} value={selectedLayout} disabled={isSaving}>
                                <SelectTrigger id="layout-select">
                                    <SelectValue placeholder="Select a layout" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Grid">Grid</SelectItem>
                                    <SelectItem value="Carousel">Carousel</SelectItem>
                                    <SelectItem value="Minimalist">Minimalist</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="headline-font-select">Headline Font</Label>
                             <Select onValueChange={setHeadlineFont} value={headlineFont} disabled={isSaving}>
                                <SelectTrigger id="headline-font-select">
                                    <SelectValue placeholder="Select a headline font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {headlineFonts.map(font => (
                                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid gap-3">
                            <Label htmlFor="body-font-select">Body Font</Label>
                             <Select onValueChange={setBodyFont} value={bodyFont} disabled={isSaving}>
                                <SelectTrigger id="body-font-select">
                                    <SelectValue placeholder="Select a body font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bodyFonts.map(font => (
                                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveLayoutAndFonts} disabled={isSaving}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isSaving ? 'Saving...' : 'Save Layout & Fonts'}
                        </Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Custom Domain</CardTitle>
                        <CardDescription>Connect a domain to your storefront. Requires "Standard" plan or higher.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <Label htmlFor="custom-domain">Domain Name</Label>
                            <Input
                                id="custom-domain"
                                value={customDomain}
                                onChange={(e) => setCustomDomain(e.target.value)}
                                disabled={isSaving || !planLimits.customDomain}
                                placeholder="yourstore.com"
                            />
                            { !planLimits.customDomain && 
                                <p className="text-xs text-destructive">
                                    Custom domains are not available on the {plan.name} plan. 
                                    <Button variant="link" className="p-0 h-auto ml-1" onClick={() => router.push('/dashboard/billing')}>Upgrade</Button>
                                </p>
                            }
                            <p className="text-xs text-muted-foreground">
                                After saving, create an 'A' record pointing to: <code className="font-mono bg-muted p-1 rounded-sm">199.36.158.100</code>.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveDomain} disabled={isSaving || !planLimits.customDomain}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isSaving ? 'Saving...' : 'Save Domain'}
                        </Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Fulfillment & Payments</CardTitle>
                        <CardDescription>Configure how customers receive and pay for orders.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 rounded-md border p-4">
                            <h4 className="font-medium">Fulfillment Methods</h4>
                             <div className="grid gap-2">
                                <Label htmlFor="business-address">Business Address</Label>
                                <Textarea id="business-address" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="e.g. 123 Main St, Kampala" />
                                <p className="text-xs text-muted-foreground">Used as the starting point for delivery calculations.</p>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="delivery-enabled" className="flex flex-col gap-1">
                                    <span>Delivery</span>
                                    <span className="font-normal text-muted-foreground text-xs">Ship products to your customers.</span>
                                </Label>
                                <Switch id="delivery-enabled" checked={fulfillment.delivery.enabled} onCheckedChange={(checked) => setFulfillment(f => ({...f, delivery: {...f.delivery, enabled: checked}}))} />
                            </div>
                            {fulfillment.delivery.enabled && (
                                <div className="grid gap-2 pl-6">
                                    <Label htmlFor="delivery-fee">Fee Per Mile (UGX)</Label>
                                    <Input id="delivery-fee" type="number" value={fulfillment.delivery.feePerMile} onChange={e => setFulfillment(f => ({...f, delivery: {...f.delivery, feePerMile: parseInt(e.target.value) || 0}}))} placeholder="e.g. 1500" />
                                </div>
                            )}
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pickup-enabled" className="flex flex-col gap-1">
                                    <span>In-Store Pickup</span>
                                    <span className="font-normal text-muted-foreground text-xs">Allow customers to pick up orders.</span>
                                </Label>
                                <Switch id="pickup-enabled" checked={fulfillment.pickup.enabled} onCheckedChange={(checked) => setFulfillment(f => ({...f, pickup: {...f.pickup, enabled: checked}}))} />
                            </div>
                            {fulfillment.pickup.enabled && (
                                <div className="grid gap-2 pl-6">
                                    <Label htmlFor="pickup-address">Pickup Address</Label>
                                    <Textarea id="pickup-address" value={fulfillment.pickup.address} onChange={e => setFulfillment(f => ({...f, pickup: {...f.pickup, address: e.target.value}}))} placeholder="e.g. 123 Main St, Kampala" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 rounded-md border p-4">
                            <h4 className="font-medium">Payment Methods</h4>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pay-online-enabled" className="flex flex-col gap-1">
                                    <span>Pay Online</span>
                                    <span className="font-normal text-muted-foreground text-xs">Accept payments via Flutterwave.</span>
                                </Label>
                                <Switch id="pay-online-enabled" checked={fulfillment.payment.payOnline.enabled} onCheckedChange={(checked) => setFulfillment(f => ({...f, payment: {...f.payment, payOnline: { enabled: checked }}}))} />
                            </div>
                            {fulfillment.payment.payOnline.enabled && (
                                <div className="grid gap-2 pl-6">
                                    <Label htmlFor="flutterwave-key">Flutterwave Public Key</Label>
                                    <Input id="flutterwave-key" type="text" value={flutterwavePublicKey} onChange={e => setFlutterwavePublicKey(e.target.value)} placeholder="FLWPUBK_TEST-xxxxxxxxxxxx-X" />
                                    <p className="text-xs text-muted-foreground">Find this in your Flutterwave Dashboard.</p>
                                </div>
                            )}
                            <Separator />
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pay-on-delivery-enabled" className="flex flex-col gap-1">
                                    <span>Pay on Delivery/Pickup</span>
                                    <span className="font-normal text-muted-foreground text-xs">Accept cash on fulfillment.</span>
                                </Label>
                                <Switch id="pay-on-delivery-enabled" checked={fulfillment.payment.payOnDelivery.enabled} onCheckedChange={(checked) => setFulfillment(f => ({...f, payment: {...f.payment, payOnDelivery: { enabled: checked }}}))} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveFulfillment} disabled={isSaving}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isSaving ? 'Saving...' : 'Save Fulfillment Settings'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

    

    