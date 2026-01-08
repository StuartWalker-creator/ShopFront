import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminSettingsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>Manage global settings for the ShopFront application.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Global application settings will be configured here.</p>
            </CardContent>
        </Card>
    );
}
