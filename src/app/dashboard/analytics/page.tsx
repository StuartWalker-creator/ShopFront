import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Detailed analytics of your store's performance.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Charts and data visualizations will be displayed here.</p>
            </CardContent>
        </Card>
    );
}
